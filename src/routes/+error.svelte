<!--
	A file that isn't in the cabinet. 404 is 查無此案: the request typed on the
	file, a rubber stamp slammed across it, and the ways back (the board, the
	search, the index). Every other error keeps its message, with a way to sign
	in when that's what it takes.
-->
<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { search } from '$lib/search.svelte';
	import LogIn from '@lucide/svelte/icons/log-in';
	import Search from '@lucide/svelte/icons/search';

	const missing = $derived(page.status === 404);
	const stamp = $derived(missing ? '查無此案' : page.status === 401 ? '權限不足' : '案件受阻');
</script>

<Seo title={missing ? '查無此案' : `${page.status} 錯誤`} noindex />

<div class="mx-auto max-w-3xl px-6 pt-16 pb-20 sm:pt-24">
	<div class="file">
		<p class="kicker font-mono-hack">CASE FILE № {page.status}</p>
		<h1 class="title font-display">
			{missing ? '這份卷宗不在櫃子裡' : (page.error?.message ?? '出了點問題')}
		</h1>
		<dl class="fields font-mono-hack">
			<div>
				<dt>調閱</dt>
				<dd>{page.url.pathname}</dd>
			</div>
			<div>
				<dt>結果</dt>
				<dd>{missing ? '查無資料，可能被移走、改名，或從來沒立過案。' : page.error?.message}</dd>
			</div>
		</dl>
		<span class="stamp font-display" aria-hidden="true">{stamp}</span>

		<div class="ways">
			{#if page.status === 401}
				<a href={resolve('/login')} class="way primary">
					<LogIn class="size-4" /> 前往登入
				</a>
			{/if}
			<a href={resolve('/')} class="way" class:primary={page.status !== 401}>回到白板</a>
			<button type="button" class="way" onclick={() => (search.open = true)}>
				<Search class="size-4" /> 搜尋案件
			</button>
			<a href={resolve('/contents')} class="way">翻目錄</a>
		</div>
	</div>
</div>

<style>
	.file {
		position: relative;
		padding: 2.6rem clamp(1.25rem, 4vw, 2rem) 2.2rem;
		border: 1px solid rgb(60 40 20 / 0.12);
		border-top: 4px solid var(--color-accent);
		border-radius: 3px;
		background: linear-gradient(180deg, rgb(255 255 255 / 0.6), transparent 40%), #fffcf5;
		box-shadow:
			0 1px 2px rgb(40 25 10 / 0.08),
			0 22px 40px -20px rgb(40 25 10 / 0.45);
		rotate: -0.4deg;
		animation: hang 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}
	.kicker {
		padding-right: 6.5rem;
		color: var(--color-ink-muted);
		font-size: 0.72rem;
		letter-spacing: 0.22em;
	}
	.title {
		margin-top: 0.8rem;
		padding-right: 5rem;
		color: var(--color-ink);
		font-size: clamp(1.7rem, 4.5vw, 2.4rem);
		line-height: 1.25;
	}
	.fields {
		display: grid;
		gap: 0.6rem;
		margin-top: 1.6rem;
		font-size: 0.8rem;
	}
	.fields div {
		display: grid;
		grid-template-columns: 3.2rem 1fr;
		gap: 0.75rem;
		padding-bottom: 0.6rem;
		border-bottom: 1px dashed rgb(60 40 20 / 0.18);
	}
	.fields dt {
		color: var(--color-ink-muted);
		letter-spacing: 0.15em;
	}
	.fields dd {
		min-width: 0;
		color: var(--color-ink);
		overflow-wrap: anywhere;
	}
	/* Slammed across the corner of the file once it's hung. */
	.stamp {
		position: absolute;
		top: 1.6rem;
		right: 1.4rem;
		padding: 0.3rem 0.7rem;
		border: 3px double var(--color-accent);
		border-radius: 4px;
		color: var(--color-accent);
		font-size: 1.05rem;
		letter-spacing: 0.15em;
		opacity: 0.85;
		rotate: 12deg;
		mix-blend-mode: multiply;
		animation: slam 0.45s cubic-bezier(0.5, 0, 0.75, 0) 0.55s both;
	}
	.ways {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-top: 2rem;
	}
	.way {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 1rem;
		border: 1px solid rgb(60 40 20 / 0.2);
		border-radius: 999px;
		color: var(--color-ink);
		font-size: 0.875rem;
		transition:
			translate 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
			border-color 0.2s,
			background 0.2s;
	}
	.way:hover {
		translate: 0 -2px;
		border-color: var(--color-accent);
	}
	.way.primary {
		border-color: var(--color-accent);
		background: var(--color-accent);
		color: #fff;
	}
	@keyframes hang {
		from {
			opacity: 0;
			translate: 0 -18px;
			rotate: -3deg;
		}
	}
	@keyframes slam {
		from {
			opacity: 0;
			scale: 2.2;
			rotate: 4deg;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.file,
		.stamp {
			animation: none;
		}
	}
</style>
