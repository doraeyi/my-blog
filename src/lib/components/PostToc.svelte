<!--
	Table of contents for an article, read from the rendered headings inside
	`container`. Desktop: a sticky index card beside the text, its sections
	strung on a red thread, a pushpin sliding along it to the one being read. Phones: a collapsed "本案目錄" card above the
	body. Hidden when the post has fewer than two headings.
-->
<script lang="ts">
	import { ensureHeadingIds, headingText } from '$lib/actions/prose';

	let {
		container,
		variant
	}: {
		container: HTMLElement | undefined;
		/** `side` = sticky desktop column, `inline` = collapsible card for small screens. */
		variant: 'side' | 'inline';
	} = $props();

	interface Item {
		id: string;
		text: string;
		level: number;
	}

	let items = $state<Item[]>([]);
	let activeId = $state<string | null>(null);
	let open = $state(false);
	let listEl: HTMLOListElement | undefined = $state();
	let pinY = $state<number | null>(null);

	// Where the pin sits: level with the current section's line.
	$effect(() => {
		const id = activeId;
		const li = listEl
			?.querySelector<HTMLElement>(`[href="#${CSS.escape(id ?? '')}"]`)
			?.closest<HTMLElement>('li');
		pinY = li ? li.offsetTop + li.offsetHeight / 2 : null;
	});

	const minLevel = $derived(items.length ? Math.min(...items.map((i) => i.level)) : 2);

	$effect(() => {
		const root = container;
		if (!root) return;
		let observer: IntersectionObserver | undefined;

		function read() {
			ensureHeadingIds(root!);
			const headings = Array.from(root!.querySelectorAll<HTMLElement>('h2, h3'));
			items = headings.map((h) => ({
				id: h.id,
				text: headingText(h),
				level: Number(h.tagName[1])
			}));

			observer?.disconnect();
			observer = new IntersectionObserver(
				(entries) => {
					const hit = entries.find((e) => e.isIntersecting);
					if (hit) activeId = hit.target.id;
				},
				{ rootMargin: '-15% 0px -70% 0px' }
			);
			headings.forEach((h) => observer!.observe(h));
		}

		// The body is inserted by {@html} / a component; read once it is in place,
		// and again if it changes (navigating between posts reuses this page).
		const raf = requestAnimationFrame(read);
		const mo = new MutationObserver(() => read());
		mo.observe(root, { childList: true });
		return () => {
			cancelAnimationFrame(raf);
			mo.disconnect();
			observer?.disconnect();
		};
	});

	function jump(e: MouseEvent, id: string) {
		const el = document.getElementById(id);
		if (!el) return;
		e.preventDefault();
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
		history.replaceState(history.state, '', `#${id}`);
		activeId = id;
		open = false;
	}
</script>

{#snippet list()}
	<ol class="toc-list" bind:this={listEl}>
		{#if pinY !== null}
			<li class="toc-pin" style:top="{pinY}px" aria-hidden="true"></li>
		{/if}
		{#each items as item (item.id)}
			<li>
				<a
					href="#{item.id}"
					onclick={(e) => jump(e, item.id)}
					class="toc-link"
					class:is-active={activeId === item.id}
					aria-current={activeId === item.id ? 'location' : undefined}
					style:padding-left="{(item.level - minLevel) * 0.9 + 1.25}rem"
				>
					{item.text}
				</a>
			</li>
		{/each}
	</ol>
{/snippet}

{#if items.length >= 2}
	{#if variant === 'side'}
		<nav aria-label="本案目錄" class="toc-card index-card rounded-sm">
			<p class="toc-head">本案目錄</p>
			{@render list()}
		</nav>
	{:else}
		<nav aria-label="本案目錄" class="toc-card index-card mt-8 rounded-sm">
			<button
				type="button"
				class="toc-head toc-toggle"
				aria-expanded={open}
				onclick={() => (open = !open)}
			>
				本案目錄 <span class="font-mono-hack text-[0.7rem] text-case-600">· {items.length} 節</span>
				<span aria-hidden="true" class="toc-caret" class:open>▾</span>
			</button>
			{#if open}
				{@render list()}
			{/if}
		</nav>
	{/if}
{/if}

<style>
	.toc-card {
		padding: 0.75rem 0.75rem 0.9rem;
	}
	.toc-head {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		width: 100%;
		padding: 0 0.75rem 0.5rem;
		border-bottom: 2px solid color-mix(in srgb, #cf5a4c 65%, transparent);
		font-family: var(--font-display);
		font-size: 1rem;
		color: #2c2118;
		text-align: left;
	}
	.toc-toggle {
		cursor: pointer;
	}
	.toc-caret {
		margin-left: auto;
		transition: transform 0.2s;
	}
	.toc-caret.open {
		transform: rotate(180deg);
	}
	.toc-list {
		position: relative;
		margin-top: 0.4rem;
		max-height: calc(100vh - 14rem);
		overflow-y: auto;
	}
	/* The red thread the sections hang on */
	.toc-list::before {
		content: '';
		position: absolute;
		top: 0.7rem;
		bottom: 0.7rem;
		left: 0.38rem;
		width: 2px;
		background: repeating-linear-gradient(to bottom, #b3362b 0 5px, #8e1d12 5px 7px);
		opacity: 0.75;
	}
	.toc-list > li:not(.toc-pin) {
		position: relative;
	}
	/* A knot on the thread for every section */
	.toc-list > li:not(.toc-pin)::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0.24rem;
		width: 0.35rem;
		height: 0.35rem;
		margin-top: -0.175rem;
		border-radius: 50%;
		background: #8e1d12;
	}
	.toc-pin {
		position: absolute;
		z-index: 1;
		left: 0.39rem;
		width: 0.9rem;
		height: 0.9rem;
		translate: -50% -50%;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #ff8f80, #b3362b 60%, #6a1d16);
		box-shadow: 0 2px 3px rgba(0, 0, 0, 0.4);
		transition: top 0.5s cubic-bezier(0.3, 1.5, 0.5, 1);
		pointer-events: none;
	}
	.toc-link {
		position: relative;
		display: block;
		padding-block: 0.3rem;
		padding-right: 0.5rem;
		font-size: 0.85rem;
		line-height: 1.45;
		color: #6b5336;
		transition: color 0.15s;
	}
	.toc-link:hover {
		color: #2c2118;
	}
	.toc-link.is-active {
		color: #2c2118;
		font-weight: 600;
	}
	@media (prefers-reduced-motion: reduce) {
		.toc-pin {
			transition: none;
		}
	}
</style>
