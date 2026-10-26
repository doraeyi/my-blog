import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readdir, rm, stat, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import { AwsClient } from 'aws4fetch';
import { env } from '$env/dynamic/private';
import { client } from '$lib/server/db';
import { notifyOps } from '$lib/server/discord';

/**
 * Daily SQLite backups. SQLite's online backup API copies the live database
 * without stopping the site; the copy is gzipped into data/backups (the mounted
 * volume) and the newest KEEP are kept. With BACKUP_S3_* set, each one is also
 * uploaded to an S3-compatible bucket (Cloudflare R2, Backblaze B2, …), which is
 * what survives the VM's disk dying.
 */

const KEEP = 30;
const TZ = 'Asia/Taipei';
/** Earliest local hour for the daily run — quiet time. */
const RUN_FROM_HOUR = 4;

export const backupDir = () =>
	env.BACKUP_DIR || join(dirname(env.DATABASE_URL || './local.db'), 'backups');

const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: TZ });
const hourNow = () =>
	Number(new Date().toLocaleString('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }));

function offsite() {
	const {
		BACKUP_S3_ENDPOINT,
		BACKUP_S3_BUCKET,
		BACKUP_S3_ACCESS_KEY_ID,
		BACKUP_S3_SECRET_ACCESS_KEY
	} = env;
	if (
		!BACKUP_S3_ENDPOINT ||
		!BACKUP_S3_BUCKET ||
		!BACKUP_S3_ACCESS_KEY_ID ||
		!BACKUP_S3_SECRET_ACCESS_KEY
	)
		return null;
	return {
		aws: new AwsClient({
			accessKeyId: BACKUP_S3_ACCESS_KEY_ID,
			secretAccessKey: BACKUP_S3_SECRET_ACCESS_KEY,
			service: 's3',
			region: env.BACKUP_S3_REGION || 'auto'
		}),
		base: `${BACKUP_S3_ENDPOINT.replace(/\/$/, '')}/${BACKUP_S3_BUCKET}`
	};
}

export const offsiteEnabled = () => offsite() !== null;

export interface BackupFile {
	name: string;
	size: number;
	createdAt: Date;
}

export async function listBackups(): Promise<BackupFile[]> {
	const dir = backupDir();
	let names: string[];
	try {
		names = (await readdir(dir)).filter((n) => /^blog-[\d-]+\.db\.gz$/.test(n));
	} catch {
		return [];
	}
	const files = await Promise.all(
		names.map(async (name) => {
			const s = await stat(join(dir, name));
			return { name, size: s.size, createdAt: s.mtime };
		})
	);
	return files.sort((a, b) => b.name.localeCompare(a.name));
}

let running: Promise<BackupFile & { uploaded: boolean }> | null = null;

/** Takes a backup now (one at a time). Today's file is replaced if it already exists. */
export function runBackup() {
	running ??= (async () => {
		try {
			const dir = backupDir();
			await mkdir(dir, { recursive: true });
			const name = `blog-${today()}.db.gz`;
			const raw = join(dir, `.${name}.tmp`);
			await client.backup(raw);
			await pipeline(
				createReadStream(raw),
				createGzip({ level: 9 }),
				createWriteStream(join(dir, name))
			);
			await rm(raw, { force: true });

			// Retention.
			const all = await listBackups();
			for (const old of all.slice(KEEP)) await rm(join(dir, old.name), { force: true });

			let uploaded = false;
			const remote = offsite();
			if (remote) {
				const res = await remote.aws.fetch(`${remote.base}/${name}`, {
					method: 'PUT',
					body: await readFile(join(dir, name)),
					headers: { 'content-type': 'application/gzip' }
				});
				if (!res.ok)
					throw new Error(`異地備份上傳失敗：${res.status} ${(await res.text()).slice(0, 200)}`);
				uploaded = true;
			}
			const s = await stat(join(dir, name));
			return { name, size: s.size, createdAt: s.mtime, uploaded };
		} catch (err) {
			notifyOps('資料庫備份失敗', err instanceof Error ? err.message : String(err));
			throw err;
		} finally {
			running = null;
		}
	})();
	return running;
}

let timer: ReturnType<typeof setInterval> | null = null;

/** Checks hourly; backs up once a day after RUN_FROM_HOUR (or right away if today's is missing and it's late enough). */
export function startBackupSchedule() {
	if (timer) return;
	const tick = async () => {
		if (hourNow() < RUN_FROM_HOUR) return;
		const files = await listBackups();
		if (files[0]?.name === `blog-${today()}.db.gz`) return;
		await runBackup().catch((err) => console.error('[backup] failed:', err));
	};
	setTimeout(tick, 60_000);
	timer = setInterval(tick, 60 * 60 * 1000);
	timer.unref?.();
}
