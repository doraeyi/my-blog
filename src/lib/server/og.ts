import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

/**
 * Share-card renderer. Fonts come from Google Fonts subset to exactly the
 * characters on the card — a full CJK font is several MB, a subset is a few KB.
 * Without a browser User-Agent, Google serves TTF, which is what satori needs.
 */

type Node = { type: string; props: Record<string, unknown> };

function h(
	type: string,
	style: Record<string, unknown>,
	...children: (Node | string | null)[]
): Node {
	const kids = children.filter((c) => c !== null);
	return { type, props: { style, children: kids.length === 1 ? kids[0] : kids } };
}

async function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer> {
	const cssUrl = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}&text=${encodeURIComponent(text)}`;
	const css = await (await fetch(cssUrl)).text();
	const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
	if (!src) throw new Error(`Could not resolve font ${family}`);
	return (await fetch(src)).arrayBuffer();
}

export interface OgCard {
	eyebrow: string;
	title: string;
	subtitle?: string | null;
	footer: string;
}

const cache = new Map<string, Uint8Array>();
const MAX_CACHE = 200;

export async function renderOgImage(card: OgCard, cacheKey: string): Promise<Uint8Array> {
	const hit = cache.get(cacheKey);
	if (hit) return hit;

	const subtitle =
		card.subtitle && card.subtitle.length > 90 ? card.subtitle.slice(0, 88) + '…' : card.subtitle;
	const allText = `${card.eyebrow}${card.title}${subtitle ?? ''}${card.footer}CASE FILE CLASSIFIED LIAM`;

	const [sans, sansBold, elite] = await Promise.all([
		loadGoogleFont('Noto Sans TC', 400, allText),
		loadGoogleFont('Noto Sans TC', 700, allText),
		loadGoogleFont('Special Elite', 400, 'CASE FILE CLASSIFIED LIAM' + card.eyebrow)
	]);

	const tree = h(
		'div',
		{
			width: '100%',
			height: '100%',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-between',
			padding: '64px 72px',
			backgroundColor: '#120d0a',
			backgroundImage: 'radial-gradient(circle at 85% 20%, rgba(179,54,43,0.35), transparent 55%)',
			color: '#f4ead2',
			fontFamily: 'Noto Sans TC'
		},
		h(
			'div',
			{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
			h(
				'div',
				{
					display: 'flex',
					fontFamily: 'Special Elite',
					fontSize: 26,
					letterSpacing: 6,
					color: '#f0b429'
				},
				card.eyebrow
			),
			h(
				'div',
				{
					display: 'flex',
					fontFamily: 'Special Elite',
					fontSize: 24,
					letterSpacing: 4,
					color: '#e2574a',
					border: '3px solid #e2574a',
					borderRadius: 6,
					padding: '6px 16px',
					transform: 'rotate(-6deg)'
				},
				'CLASSIFIED'
			)
		),
		h(
			'div',
			{ display: 'flex', flexDirection: 'column' },
			h(
				'div',
				{
					display: 'flex',
					fontSize: card.title.length > 24 ? 60 : 76,
					fontWeight: 700,
					lineHeight: 1.2
				},
				card.title
			),
			subtitle
				? h(
						'div',
						{ display: 'flex', marginTop: 24, fontSize: 30, color: '#c2a877', lineHeight: 1.5 },
						subtitle
					)
				: null
		),
		h(
			'div',
			{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				borderTop: '2px dashed #4a3925',
				paddingTop: 24,
				fontSize: 26,
				color: '#a3865a'
			},
			h(
				'div',
				{ display: 'flex', fontFamily: 'Special Elite', letterSpacing: 4, color: '#f4ead2' },
				'LIAM'
			),
			h('div', { display: 'flex' }, card.footer)
		)
	);

	const svg = await satori(tree as never, {
		width: 1200,
		height: 630,
		fonts: [
			{ name: 'Noto Sans TC', data: sans, weight: 400, style: 'normal' },
			{ name: 'Noto Sans TC', data: sansBold, weight: 700, style: 'normal' },
			{ name: 'Special Elite', data: elite, weight: 400, style: 'normal' }
		]
	});
	const png = new Resvg(svg).render().asPng();

	if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!);
	cache.set(cacheKey, png);
	return png;
}

export function pngResponse(png: Uint8Array): Response {
	return new Response(png as BodyInit, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
		}
	});
}
