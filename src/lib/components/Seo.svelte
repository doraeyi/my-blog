<script lang="ts">
	import { page } from '$app/state';
	import { SITE_DESCRIPTION, SITE_LOCALE, SITE_NAME, SITE_TITLE } from '$lib/site';

	let {
		title,
		description = SITE_DESCRIPTION,
		image = '/og.png',
		type = 'website',
		publishedTime,
		tags = [],
		noindex = false
	}: {
		/** Page title; omitted means the homepage, which uses the full site title. */
		title?: string;
		description?: string | null;
		/** Root-relative or absolute URL of the share image. */
		image?: string;
		type?: 'website' | 'article';
		publishedTime?: Date;
		tags?: string[];
		noindex?: boolean;
	} = $props();

	const fullTitle = $derived(title ? `${title} | ${SITE_NAME}` : SITE_TITLE);
	const desc = $derived(description || SITE_DESCRIPTION);
	const canonical = $derived(page.url.origin + page.url.pathname);
	const imageUrl = $derived(image.startsWith('http') ? image : page.url.origin + image);

	// Articles also describe themselves as schema.org BlogPosting, so search engines
	// and AI answer engines get the author, dates and topics without guessing.
	const articleLd = $derived(
		type === 'article'
			? `<script type="application/ld+json">${JSON.stringify({
					'@context': 'https://schema.org',
					'@type': 'BlogPosting',
					headline: title ?? SITE_TITLE,
					description: desc,
					url: canonical,
					mainEntityOfPage: canonical,
					image: imageUrl,
					inLanguage: 'zh-Hant-TW',
					...(publishedTime ? { datePublished: publishedTime.toISOString() } : {}),
					...(tags.length ? { keywords: tags.join(', ') } : {}),
					author: { '@type': 'Person', name: 'Liam', url: page.url.origin },
					publisher: {
						'@type': 'Person',
						name: 'Liam',
						logo: { '@type': 'ImageObject', url: `${page.url.origin}/icon-512.png` }
					}
				}).replace(/</g, '\\u003c')}</` + `script>`
			: ''
	);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={desc} />
	<link rel="canonical" href={canonical} />
	{#if noindex}
		<meta name="robots" content="noindex" />
	{/if}

	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:locale" content={SITE_LOCALE} />
	<meta property="og:type" content={type} />
	<meta property="og:title" content={title ?? SITE_TITLE} />
	<meta property="og:description" content={desc} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	{#if publishedTime}
		<meta property="article:published_time" content={publishedTime.toISOString()} />
	{/if}
	{#each tags as tag (tag)}
		<meta property="article:tag" content={tag} />
	{/each}

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title ?? SITE_TITLE} />
	<meta name="twitter:description" content={desc} />
	<meta name="twitter:image" content={imageUrl} />

	{#if articleLd}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- JSON-LD built from page props, '<' escaped -->
		{@html articleLd}
	{/if}
</svelte:head>
