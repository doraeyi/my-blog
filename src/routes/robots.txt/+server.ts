import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	return new Response(
		`User-agent: *
Disallow: /admin
Disallow: /login

Sitemap: ${url.origin}/sitemap.xml
`,
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
	);
};
