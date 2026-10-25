<!--
	"Mentioned elsewhere": pages on other sites (and friends' posts) that link to
	this one, collected through Webmention. Each is a clipping pinned to the file,
	with the sentence around the link quoted.
-->
<script lang="ts">
	import Link2 from '@lucide/svelte/icons/link-2';
	import Reply from '@lucide/svelte/icons/reply';
	import Heart from '@lucide/svelte/icons/heart';
	import Repeat from '@lucide/svelte/icons/repeat-2';

	type Mention = {
		id: string;
		source: string;
		kind: 'mention' | 'reply' | 'like' | 'repost';
		authorName: string | null;
		authorUrl: string | null;
		authorPhoto: string | null;
		title: string | null;
		excerpt: string | null;
		friendId: string | null;
		verifiedAt: Date | null;
	};

	let { mentions }: { mentions: Mention[] } = $props();

	const likes = $derived(mentions.filter((m) => m.kind === 'like' || m.kind === 'repost'));
	const quotes = $derived(mentions.filter((m) => m.kind === 'mention' || m.kind === 'reply'));
	const verb = {
		mention: '提到了這篇',
		reply: '回應了這篇',
		like: '喜歡這篇',
		repost: '轉貼了這篇'
	};
	const host = (url: string) => {
		try {
			return new URL(url).hostname.replace(/^www\./, '');
		} catch {
			return url;
		}
	};
</script>

{#if mentions.length}
	<section class="mt-12" aria-labelledby="mentions-title">
		<h2 id="mentions-title" class="flex items-center gap-2 font-display text-lg text-ink">
			<Link2 class="size-4 text-accent" /> 其他地方提到這篇
			<span class="font-mono-hack text-xs text-ink-muted">{mentions.length}</span>
		</h2>

		{#if likes.length}
			<ul class="mt-4 flex flex-wrap items-center gap-1.5">
				{#each likes as m (m.id)}
					<li>
						<!-- eslint-disable svelte/no-navigation-without-resolve -- external page -->
						<a
							href={m.source}
							target="_blank"
							rel="noopener nofollow ugc"
							title="{m.authorName ?? host(m.source)} {verb[m.kind]}"
							class="relative block size-8 overflow-hidden rounded-full border border-border-case bg-surface"
						>
							{#if m.authorPhoto}
								<img
									src={m.authorPhoto}
									alt=""
									loading="lazy"
									referrerpolicy="no-referrer"
									class="size-full object-cover"
								/>
							{/if}
							<span class="absolute right-0 bottom-0 rounded-full bg-surface p-0.5 text-accent">
								{#if m.kind === 'like'}<Heart class="size-2.5" />{:else}<Repeat
										class="size-2.5"
									/>{/if}
							</span>
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					</li>
				{/each}
			</ul>
		{/if}

		<ul class="mt-4 space-y-3">
			{#each quotes as m (m.id)}
				<li class="index-card rounded-sm px-5 py-4" style="transform: rotate(-0.3deg)">
					<div class="flex items-center gap-2.5">
						<span
							class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-case-300 bg-case-50 text-sm text-case-800"
						>
							{#if m.authorPhoto}
								<img
									src={m.authorPhoto}
									alt=""
									loading="lazy"
									referrerpolicy="no-referrer"
									class="size-full object-cover"
								/>
							{:else}
								{(m.authorName ?? host(m.source)).charAt(0)}
							{/if}
						</span>
						<p class="min-w-0 flex-1 text-sm text-case-800">
							<span class="font-medium text-case-900">{m.authorName ?? host(m.source)}</span>
							<span class="text-case-700">
								{#if m.kind === 'reply'}<Reply class="inline size-3.5" />{/if}
								{verb[m.kind]}</span
							>
							{#if m.friendId}
								<span class="ml-1 rounded-sm border border-brass/70 px-1 text-[10px] text-case-700"
									>友站</span
								>
							{/if}
						</p>
					</div>
					{#if m.excerpt}
						<blockquote
							class="mt-3 border-l-2 border-stamp-400/60 pl-3 text-sm leading-relaxed text-case-800"
						>
							…{m.excerpt}…
						</blockquote>
					{/if}
					<!-- eslint-disable svelte/no-navigation-without-resolve -- external page -->
					<a
						href={m.source}
						target="_blank"
						rel="noopener nofollow ugc"
						class="mt-2 block truncate font-mono-hack text-xs text-stamp-600 hover:underline"
					>
						{m.title ?? host(m.source)} ↗
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</li>
			{/each}
		</ul>
	</section>
{/if}
