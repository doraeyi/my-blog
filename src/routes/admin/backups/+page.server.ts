import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { listBackups, offsiteEnabled, runBackup } from '$lib/server/backup';

export const load: PageServerLoad = async () => ({
	backups: await listBackups(),
	offsite: offsiteEnabled()
});

export const actions: Actions = {
	run: async () => {
		try {
			const b = await runBackup();
			return { notice: `備份完成：${b.name}${b.uploaded ? '（已上傳異地）' : ''}` };
		} catch (err) {
			return fail(500, { message: err instanceof Error ? err.message : '備份失敗' });
		}
	}
};
