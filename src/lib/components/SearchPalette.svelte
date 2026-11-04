<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade, scale } from 'svelte/transition';
	import Search from '@lucide/svelte/icons/search';
	import CornerDownLeft from '@lucide/svelte/icons/corner-down-left';
	import { search, loadIndex, runSearch, PAGE, type SearchDoc } from '$lib/search.svelte';

	let query = $state('');
	let docs = $state<SearchDoc[]>([]);
	let loading = $state(false);
	let active = $state(0);
	let listEl: HTMLUListElement | undefined = $state();

	// Nothing typed yet: the site's pages, so you can see what's here before guessing a word.
	const hits = $derived(
		query.trim()
			? runSearch(docs, query)
			: docs.filter((d) => d.type === PAGE).map((doc) => ({ doc, snippet: doc.excerpt ?? '' }))
	);

	$effect(() => {
		if (!search.open) return;
		query = '';
		active = 0;
		if (docs.length === 0) {
			loading = true;
			loadIndex().then((d) => {
				docs = d;
				loading = false;
			});
		}
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prevOverflow;
		};
	});

	$effect(() => {
		// Reset the highlighted row whenever the result set changes.
		void hits;
		active = 0;
	});

	function close() {
		search.open = false;
	}

	function go(path: string) {
		close();
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- paths come from the server-built search index
		goto(path);
	}

	function onGlobalKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement | null;
		const typing =
			target &&
			(target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			search.open = !search.open;
		} else if (e.key === '/' && !typing && !search.open) {
			e.preventDefault();
			search.open = true;
		}
	}

	function onInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			active = Math.min(active + 1, hits.length - 1);
			scrollActiveIntoView();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			active = Math.max(active - 1, 0);
			scrollActiveIntoView();
		} else if (e.key === 'Enter' && hits[active]) {
			e.preventDefault();
			go(hits[active].doc.path);
		}
	}

	function scrollActiveIntoView() {
		queueMicrotask(() =>
			listEl?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
		);
	}

	/** Splits text into plain/matched segments so matches can be highlighted without {@html}. */
	function highlight(text: string, q: string): { t: string; m: boolean }[] {
		const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
		if (terms.length === 0) return [{ t: text, m: false }];
		const lower = text.toLowerCase();
		const marks = new Array<boolean>(text.length).fill(false);
		for (const term of terms) {
			let i = lower.indexOf(term);
			while (i >= 0) {
				marks.fill(true, i, i + term.length);
				i = lower.indexOf(term, i + term.length);
			}
		}
		const parts: { t: string; m: boolean }[] = [];
		for (let i = 0; i < text.length; i++) {
			const last = parts.at(-1);
			if (last && last.m === marks[i]) last.t += text[i];
			else parts.push({ t: text[i], m: marks[i] });
		}
		return parts;
	}
</script>

<svelte:window onkeydown={onGlobalKeydown} />

{#if search.open}
	<div
		class="fixed inset-0 z-[100] flex items-start justify-center bg-case-950/50 px-4 pt-[12vh] backdrop-blur-sm"
		transition:fade={{ duration: 120 }}
		onclick={(e) => e.target === e.currentTarget && close()}
		role="presentation"
	>
		<div
			role="dialog"
			aria-modal="true"
			aria-label="全站搜尋"
			class="search-file w-full max-w-xl"
			transition:scale={{ duration: 160, start: 0.96 }}
		>
			<span class="file-pin" aria-hidden="true"></span>
			<p class="file-kicker font-mono-hack">調閱 · CASE INDEX</p>
			<div class="flex items-center gap-3 border-b border-border-case px-4">
				<Search class="size-4 shrink-0 text-ink-muted" />
				<!-- svelte-ignore a11y_autofocus -->
				<input
					bind:value={query}
					onkeydown={onInputKeydown}
					autofocus
					type="search"
					placeholder="想找什麼？頁面、文章、追劇、作品…"
					aria-label="搜尋關鍵字"
					aria-controls="search-results"
					class="h-14 w-full border-0 bg-transparent p-0 text-base text-ink placeholder:text-ink-muted/70 focus:ring-0 focus:outline-none"
				/>
				<kbd
					class="hidden rounded border border-border-case px-1.5 py-0.5 font-mono-hack text-[0.65rem] text-ink-muted sm:block"
					>ESC</kbd
				>
			</div>

			<ul
				id="search-results"
				bind:this={listEl}
				class="max-h-[55vh] overflow-y-auto p-2"
				role="listbox"
			>
				{#if loading}
					<li class="px-3 py-8 text-center font-mono-hack text-sm text-ink-muted">調閱卷宗中…</li>
				{:else if hits.length === 0}
					<li class="px-3 py-8 text-center font-mono-hack text-sm text-ink-muted">
						NO MATCH — 找不到「{query}」
					</li>
				{:else}
					{#each hits as hit, i (hit.doc.path)}
						<li role="option" aria-selected={i === active} data-index={i}>
							<button
								type="button"
								onclick={() => go(hit.doc.path)}
								onmousemove={() => (active = i)}
								class="hit flex w-full items-start gap-3 rounded-sm px-3 py-2.5 text-left"
								class:is-active={i === active}
							>
								<span class="kind mt-0.5 shrink-0 px-1.5 py-0.5 font-mono-hack text-[0.65rem]"
									>{hit.doc.type}</span
								>
								<span class="min-w-0 flex-1">
									<span class="block truncate text-sm font-medium text-ink">
										{#each highlight(hit.doc.title, query) as part, pi (pi)}
											{#if part.m}<mark class="rounded-sm bg-accent/20 text-accent">{part.t}</mark
												>{:else}{part.t}{/if}
										{/each}
									</span>
									{#if hit.snippet}
										<span class="mt-0.5 line-clamp-2 block text-xs text-ink-muted">
											{#each highlight(hit.snippet, query) as part, pi (pi)}
												{#if part.m}<mark class="rounded-sm bg-accent/15 text-ink">{part.t}</mark
													>{:else}{part.t}{/if}
											{/each}
										</span>
									{/if}
								</span>
								{#if i === active}
									<CornerDownLeft class="mt-1 size-3.5 shrink-0 text-ink-muted" />
								{/if}
							</button>
						</li>
					{/each}
				{/if}
			</ul>
		</div>
	</div>
{/if}

<style>
	/* The palette is the card index: a drawer card pulled up over the board,
	   pinned at the top, the matching files filed on it. */
	.search-file {
		position: relative;
		border: 1px solid rgb(60 40 20 / 0.14);
		border-top: 3px solid var(--color-accent);
		border-radius: 3px;
		background: linear-gradient(180deg, rgb(255 255 255 / 0.55), transparent 30%), #fffcf5;
		box-shadow:
			0 2px 4px rgb(40 25 10 / 0.12),
			0 40px 70px -24px rgb(0 0 0 / 0.6);
		color-scheme: light;
		--color-ink: #2a1f16;
		--color-ink-muted: #7a6a58;
		--color-border-case: rgb(60 40 20 / 0.14);
	}
	.file-pin {
		position: absolute;
		top: -9px;
		left: 50%;
		width: 15px;
		height: 15px;
		margin-left: -7.5px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #ff8b80, var(--b-red, #b3261e) 45%, #6d0b0b);
		box-shadow: 0 3px 4px rgb(0 0 0 / 0.35);
	}
	.file-kicker {
		padding: 0.85rem 1rem 0;
		color: var(--color-accent);
		font-size: 0.62rem;
		letter-spacing: 0.24em;
	}
	/* The browser's clear button, redrawn in ink instead of its system blue. */
	.search-file input::-webkit-search-cancel-button {
		width: 14px;
		height: 14px;
		background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 14'%3E%3Cpath d='M3 3l8 8M11 3l-8 8' stroke='%237a6a58' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E")
			center / contain no-repeat;
		cursor: pointer;
		-webkit-appearance: none;
		appearance: none;
	}
	/* The file under the cursor gets the red thread down its edge. */
	.hit {
		position: relative;
		transition:
			background 0.2s,
			translate 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.hit::before {
		content: '';
		position: absolute;
		top: 0.5rem;
		bottom: 0.5rem;
		left: 0;
		width: 2px;
		border-radius: 2px;
		background: var(--color-accent);
		scale: 1 0;
		transition: scale 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.hit.is-active {
		background: rgb(60 40 20 / 0.06);
		translate: 3px 0;
	}
	.hit.is-active::before {
		scale: 1 1;
	}
	/* What kind of file: a slip of paper clipped to it. */
	.kind {
		background: #f3e6c2;
		color: #6b5336;
		letter-spacing: 0.06em;
		rotate: -2deg;
	}
	@media (prefers-reduced-motion: reduce) {
		.hit,
		.hit::before {
			transition: none;
		}
	}
</style>
