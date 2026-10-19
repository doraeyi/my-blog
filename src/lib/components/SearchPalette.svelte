<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade, scale } from 'svelte/transition';
	import Search from '@lucide/svelte/icons/search';
	import CornerDownLeft from '@lucide/svelte/icons/corner-down-left';
	import { search, loadIndex, runSearch, type SearchDoc } from '$lib/search.svelte';

	let query = $state('');
	let docs = $state<SearchDoc[]>([]);
	let loading = $state(false);
	let active = $state(0);
	let listEl: HTMLUListElement | undefined = $state();

	const hits = $derived(runSearch(docs, query));

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
			class="w-full max-w-xl overflow-hidden rounded-xl border border-border-case bg-surface shadow-2xl"
			transition:scale={{ duration: 140, start: 0.97 }}
		>
			<div class="flex items-center gap-3 border-b border-border-case px-4">
				<Search class="size-4 shrink-0 text-ink-muted" />
				<!-- svelte-ignore a11y_autofocus -->
				<input
					bind:value={query}
					onkeydown={onInputKeydown}
					autofocus
					type="search"
					placeholder="搜尋文章、心情、作品、追劇…"
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
				{:else if query.trim() === ''}
					<li class="px-3 py-8 text-center text-sm text-ink-muted">
						輸入關鍵字開始搜查
						<span class="mt-2 block font-mono-hack text-xs text-ink-muted/70">
							↑↓ 選擇 · Enter 開啟 · Ctrl/⌘ K 或 / 隨時呼叫
						</span>
					</li>
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
								class="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition {i ===
								active
									? 'bg-surface-alt'
									: ''}"
							>
								<span
									class="mt-0.5 shrink-0 rounded border border-border-case px-1.5 py-0.5 font-mono-hack text-[0.65rem] text-ink-muted"
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
