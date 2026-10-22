<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import CommentThread from '$lib/components/CommentThread.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { SITE_DESCRIPTION } from '$lib/site';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Edit freely — these are the questions people (or future me) actually ask.
	const faq = [
		{
			q: '這裡是什麼地方？',
			a: `${SITE_DESCRIPTION} 技術文章、心情、碎念、作品和追劇紀錄都放在這。`
		},
		{
			q: '網站用什麼做的？',
			a: '前端是 SvelteKit（Svelte 5）＋ Tailwind CSS，資料庫是 SQLite 搭 Drizzle ORM，登入用 Better Auth。用 Docker 包好，部署在自己的機器上，前面擋一層 Traefik。'
		},
		{
			q: '文章存在哪裡？',
			a: '兩個地方：長文是 repo 裡的 Markdown（mdsvex 編譯），技術文章跟心情則是在後台寫、存進資料庫。全站搜尋、RSS、時間軸都會把兩邊合在一起看。'
		},
		{
			q: '可以留言嗎？',
			a: '可以，登入後每篇文章底下都能留言，也有專門的留言板。'
		},
		{
			q: '有 RSS 嗎？',
			a: '有，網址是 /rss.xml，所有類型的文章都在裡面。'
		},
		{
			q: '有藏彩蛋嗎？',
			a: '有一個鍵盤上的，找找看。'
		}
	];

	let open = $state<number | null>(0);
</script>

<Seo title="本站說明" description="關於這個網站：怎麼做的、放了什麼。" />

<div class="mx-auto max-w-3xl px-6 pb-16">
	<PageHeader
		title="本站說明"
		stamp="公開"
		description="一個前端工程師的個人空間：寫技術、記生活，也拿來實驗各種介面想法。"
	/>

	<section use:reveal={{ delay: 80 }}>
		<h2 class="section-title">常見問題</h2>
		<ul
			class="mt-4 divide-y divide-border-case/60 rounded-2xl border border-border-case/70 bg-surface-alt/40"
		>
			{#each faq as item, i (item.q)}
				<li>
					<button
						type="button"
						aria-expanded={open === i}
						onclick={() => (open = open === i ? null : i)}
						class="flex w-full items-center gap-3 px-5 py-4 text-left"
					>
						<span class="flex-1 font-medium text-ink">{item.q}</span>
						<ChevronDown
							class="size-4 text-ink-muted transition-transform duration-200 {open === i
								? 'rotate-180'
								: ''}"
						/>
					</button>
					<div
						class="grid transition-[grid-template-rows] duration-300 ease-out {open === i
							? 'grid-rows-[1fr]'
							: 'grid-rows-[0fr]'}"
					>
						<p class="overflow-hidden px-5 pl-12 text-sm leading-relaxed text-ink-muted">
							<span class="block pb-4">{item.a}</span>
						</p>
					</div>
				</li>
			{/each}
		</ul>
	</section>

	<p class="mt-8 text-sm text-ink-muted" use:reveal={{ delay: 120 }}>
		繼續瞭解：
		<a href={resolve('/history')} class="text-accent underline-offset-4 hover:underline">結案紀錄</a
		>
		— 站點走過的路
	</p>

	<CommentThread comments={data.comments} message={form?.message} />
</div>
