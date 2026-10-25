import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

/**
 * fetch() for URLs that visitors typed in (friend sites, their feeds). It only
 * goes to public http(s) hosts — never this server's own network — follows a
 * few redirects by hand so each hop is checked too, gives up after a timeout
 * and stops reading past a size cap.
 */

const blocked = new BlockList();
for (const [net, prefix] of [
	['0.0.0.0', 8],
	['10.0.0.0', 8],
	['100.64.0.0', 10],
	['127.0.0.0', 8],
	['169.254.0.0', 16],
	['172.16.0.0', 12],
	['192.0.0.0', 24],
	['192.168.0.0', 16],
	['198.18.0.0', 15],
	['224.0.0.0', 3]
] as const)
	blocked.addSubnet(net, prefix, 'ipv4');
for (const [net, prefix] of [
	['::', 127],
	['fc00::', 7],
	['fe80::', 10],
	['ff00::', 8]
] as const)
	blocked.addSubnet(net, prefix, 'ipv6');

function isBlockedAddress(address: string): boolean {
	const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
	if (mapped) return blocked.check(mapped[1], 'ipv4');
	return blocked.check(address, isIP(address) === 6 ? 'ipv6' : 'ipv4');
}

async function assertPublic(url: URL) {
	if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('只接受 http(s) 網址');
	const host = url.hostname.replace(/^\[|\]$/g, '');
	if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal'))
		throw new Error('不能是內部網址');
	const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
	if (addresses.length === 0 || addresses.some((a) => isBlockedAddress(a.address)))
		throw new Error('不能是內部網址');
}

export interface SafeResponse {
	status: number;
	url: string;
	contentType: string;
	body: string;
	latencyMs: number;
}

export async function safeFetch(
	input: string,
	{ timeoutMs = 8000, maxBytes = 1_500_000, accept = '*/*' } = {}
): Promise<SafeResponse> {
	const started = performance.now();
	const signal = AbortSignal.timeout(timeoutMs);
	let url = new URL(input);
	for (let hop = 0; hop < 4; hop++) {
		await assertPublic(url);
		const res = await fetch(url, {
			redirect: 'manual',
			signal,
			headers: {
				accept,
				'user-agent': 'LiamBlogFriendBot/1.0 (+https://blog.doraeyi.com/friends)'
			}
		});
		const location = res.headers.get('location');
		if (res.status >= 300 && res.status < 400 && location) {
			url = new URL(location, url);
			void res.body?.cancel();
			continue;
		}
		const latencyMs = Math.round(performance.now() - started);
		let body = '';
		if (res.body) {
			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let size = 0;
			for (;;) {
				const { done, value } = await reader.read();
				if (done) break;
				size += value.byteLength;
				body += decoder.decode(value, { stream: true });
				if (size >= maxBytes) {
					void reader.cancel();
					break;
				}
			}
		}
		return {
			status: res.status,
			url: url.href,
			contentType: res.headers.get('content-type') ?? '',
			body,
			latencyMs
		};
	}
	throw new Error('轉址太多次');
}
