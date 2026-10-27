<!--
	The site's frame, as things on the detective's desk rather than a website's
	navigation bar:
	- top left (every page but the office): a paper-clipped slip back to the
	  office (the book's own bookmarks are the way around it);
	- top right: a magnifying glass (search), a light switch (light / dark),
	  a luggage tag for the English profile, and a clip-on ID
	  badge (account, notifications);
	The slips and props sit on the top edge of the page and scroll away with it,
	like things on a desk; ⌘/Ctrl K and each page's closing stamp cover the rest.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { onRoute } from '$lib/site-nav';
	import { search } from '$lib/search.svelte';
	import { theme } from '$lib/theme.svelte';

	let { user, unread = 0 }: { user?: { name: string; role?: string | null }; unread?: number } =
		$props();

	const onBoard = $derived(page.url.pathname === '/');
	const onEnglish = $derived(onRoute(page.url.pathname, '/english'));
	let badgeOpen = $state(false);
	let badgeEl: HTMLElement | undefined = $state();

	$effect(() => {
		void page.url.href;
		badgeOpen = false;
	});

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') badgeOpen = false;
	}
	function onWindowClick(e: MouseEvent) {
		if (badgeOpen && badgeEl && !badgeEl.contains(e.target as Node)) badgeOpen = false;
	}
</script>

<svelte:window onkeydown={onKeydown} onclick={onWindowClick} />

<!-- ── Top left: the way back, and where you are ── -->
{#if !onBoard}
	<nav
		class="slips absolute top-3 left-3 z-50 flex items-start gap-2 sm:top-4 sm:left-4"
		aria-label="位置"
	>
		<a href={resolve('/')} class="slip back-slip flex items-center">
			<span class="clip" aria-hidden="true"></span>
			<span class="font-display text-sm">← 回辦公室</span>
		</a>
	</nav>
{/if}

<!-- ── Top right: things on the desk ── -->
<div class="props absolute top-0 right-3 z-50 flex items-start gap-3 sm:right-5">
	<!-- English profile: a luggage tag -->
	{#if onEnglish}
		<a
			href={resolve('/about')}
			hreflang="zh-Hant"
			lang="zh-Hant"
			title="中文"
			class="tag-prop mt-4"
		>
			中<span class="sr-only">文版人物檔案</span>
		</a>
	{:else}
		<a
			href={resolve('/english')}
			hreflang="en"
			lang="en"
			title="English profile"
			class="tag-prop mt-4"
		>
			EN<span class="sr-only"> · English profile</span>
		</a>
	{/if}

	<!-- On the homepage the study's own computer and lamp do these. -->
	{#if !onBoard}
		<!-- Search: the magnifying glass -->
		<button
			type="button"
			class="glass-prop mt-3"
			aria-label="搜尋（Ctrl/⌘ K）"
			title="搜尋（Ctrl/⌘ K）"
			onclick={() => (search.open = true)}
		>
			<svg viewBox="0 0 48 48" aria-hidden="true">
				<circle
					cx="20"
					cy="20"
					r="12.5"
					fill="rgba(200,226,255,0.22)"
					stroke="#b8904f"
					stroke-width="4"
				/>
				<path
					d="M13 15 Q16 10.5 21 10"
					stroke="#fff"
					stroke-width="2"
					stroke-linecap="round"
					fill="none"
					opacity="0.8"
				/>
				<path d="M29 29 L40 40" stroke="#6b4f2a" stroke-width="6" stroke-linecap="round" />
				<path d="M29.5 29.5 L32 32" stroke="#8a6a36" stroke-width="6" stroke-linecap="round" />
			</svg>
		</button>

		<!-- Light / dark: the light switch on the wall -->
		<button
			type="button"
			class="switch-prop mt-3"
			aria-pressed={theme.current !== 'dark'}
			aria-label={theme.current === 'dark' ? '電燈開關：開燈' : '電燈開關：關燈'}
			title={theme.current === 'dark' ? '開燈' : '關燈'}
			onclick={() => theme.toggle()}
		>
			<span class="screw" aria-hidden="true"></span>
			<span class="slot" aria-hidden="true"
				><span class="lever" class:off={theme.current === 'dark'}></span></span
			>
			<span class="screw" aria-hidden="true"></span>
		</button>

		<!-- Account: a clip-on ID badge -->
		<div bind:this={badgeEl} class="relative mt-2">
			<button
				type="button"
				class="badge-prop"
				aria-label={unread ? `識別證（${unread} 則新通知）` : '識別證：登入與通知'}
				aria-expanded={badgeOpen}
				onclick={() => (badgeOpen = !badgeOpen)}
			>
				<span class="badge-clip" aria-hidden="true"></span>
				<span class="badge-band" aria-hidden="true"></span>
				<span class="badge-name font-mono-hack">{user ? user.name.slice(0, 6) : 'GUEST'}</span>
				{#if unread}<span class="unread-dot" aria-hidden="true"></span>{/if}
			</button>
			{#if badgeOpen}
				<div
					class="account-menu index-card top-full right-0 mt-2 w-44 rounded-sm px-2 pb-1"
					in:fly={{ y: -6, duration: 160 }}
					out:fly={{ y: -6, duration: 100 }}
				>
					{#if user}
						<p class="menu-row truncate font-mono-hack text-xs text-case-600">{user.name}</p>
						<a
							href={resolve('/notifications')}
							class="menu-row flex items-center justify-between rounded-sm text-sm text-case-900 hover:bg-case-200/60"
						>
							通知
							{#if unread}<span class="font-mono-hack text-xs text-stamp-500">{unread} 則新</span
								>{/if}
						</a>
						{#if user.role === 'Liam'}
							<a
								href={resolve('/admin/posts')}
								class="menu-row block rounded-sm text-sm text-case-900 hover:bg-case-200/60">後台</a
							>
							<a
								href={resolve('/admin/comments')}
								class="menu-row block rounded-sm text-sm text-case-900 hover:bg-case-200/60"
								>證詞審核</a
							>
						{/if}
						<form method="post" action="{resolve('/login')}?/signOut" use:enhance>
							<button
								type="submit"
								class="menu-row block w-full rounded-sm text-left text-sm text-case-900 hover:bg-case-200/60"
								>登出</button
							>
						</form>
					{:else}
						<a
							href={resolve('/login')}
							class="menu-row block rounded-sm text-sm text-case-900 hover:bg-case-200/60">登入</a
						>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* ── Paper slips (top left) ── */
	.slip {
		position: relative;
		padding: 7px 14px 8px;
		background: #f4ead2;
		color: #2c2118;
		box-shadow: 0 6px 14px -8px rgba(0, 0, 0, 0.55);
		transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.back-slip {
		rotate: -2deg;
		padding-left: 22px;
	}
	.slip:hover,
	.slip:focus-visible {
		transform: translateY(2px) rotate(1deg);
	}
	.clip {
		/* a bent-wire paperclip over the slip's left edge */
		position: absolute;
		top: -8px;
		left: 6px;
		width: 10px;
		height: 30px;
		border: 2px solid #8f969c;
		border-radius: 6px;
		box-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
	}

	/* ── Desk props (top right) ── */
	.tag-prop {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 42px;
		height: 26px;
		padding-left: 6px;
		background: #ecdcae;
		color: #4a3925;
		font-family: var(--font-mono-hack);
		font-size: 0.8rem;
		letter-spacing: 0.05em;
		clip-path: polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 50%);
		rotate: 8deg;
		transition: rotate 0.25s;
	}
	.tag-prop::before {
		content: '';
		position: absolute;
		left: 8px;
		top: 50%;
		width: 5px;
		height: 5px;
		translate: 0 -50%;
		border-radius: 50%;
		background: var(--color-surface);
	}
	.tag-prop:hover {
		rotate: -4deg;
	}

	.glass-prop {
		width: 44px;
		height: 44px;
		rotate: -12deg;
		filter: drop-shadow(0 6px 6px rgba(0, 0, 0, 0.35));
		transition: rotate 0.3s cubic-bezier(0.2, 1.4, 0.4, 1);
	}
	.glass-prop:hover,
	.glass-prop:focus-visible {
		rotate: 8deg;
	}

	/* The same light switch as on the study's wall (StudyRoom.svelte). */
	.switch-prop {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		width: 26px;
		height: 42px;
		padding: 5px 0;
		border-radius: 4px;
		background: linear-gradient(150deg, #f4ecd8, #ddd0b2);
		box-shadow:
			inset 0 1px 0 #fffaf0,
			inset 0 -2px 0 rgba(0, 0, 0, 0.12),
			0 4px 8px -2px rgba(0, 0, 0, 0.55);
	}
	.switch-prop:hover {
		box-shadow:
			inset 0 1px 0 #fffaf0,
			0 0 0 3px rgba(212, 160, 23, 0.35),
			0 4px 8px -2px rgba(0, 0, 0, 0.55);
	}
	.screw {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: linear-gradient(135deg, #c9b07a, #8a6a36);
	}
	.slot {
		position: relative;
		width: 8px;
		height: 14px;
		border-radius: 2px;
		background: #3b2a1c;
		perspective: 80px;
	}
	.lever {
		position: absolute;
		left: 1px;
		bottom: 50%;
		width: 6px;
		height: 12px;
		border-radius: 2px;
		background: linear-gradient(90deg, #6b4a2c, #a37a4c 45%, #6b4a2c);
		transform: rotateX(28deg);
		transform-origin: bottom center;
		transition: transform 0.18s cubic-bezier(0.5, 1.8, 0.6, 1);
	}
	.lever.off {
		transform: rotateX(152deg);
	}

	.badge-prop {
		position: relative;
		display: block;
		width: 44px;
		height: 56px;
		padding-top: 16px;
		border-radius: 5px;
		background: #fbfaf6;
		box-shadow: 0 8px 14px -8px rgba(0, 0, 0, 0.55);
		rotate: 4deg;
		transition: rotate 0.25s;
	}
	.badge-prop:hover,
	.badge-prop[aria-expanded='true'] {
		rotate: -3deg;
	}
	.badge-clip {
		position: absolute;
		top: -7px;
		left: 50%;
		width: 16px;
		height: 10px;
		translate: -50% 0;
		border-radius: 3px;
		background: linear-gradient(#c9ccd0, #8f969c);
	}
	.badge-band {
		position: absolute;
		top: 6px;
		left: 0;
		right: 0;
		height: 7px;
		background: #b3362b;
	}
	.badge-name {
		display: block;
		margin-top: 18px;
		font-size: 8px;
		letter-spacing: 0.08em;
		color: #4a3925;
		text-align: center;
		overflow: hidden;
	}
	.unread-dot {
		position: absolute;
		top: -4px;
		right: -4px;
		width: 11px;
		height: 11px;
		border-radius: 50%;
		background: #e2574a;
		box-shadow: 0 0 0 2px var(--color-surface);
	}
	.account-menu {
		position: absolute;
	}
	.menu-row {
		height: 28px;
		padding: 0 0.5rem;
		line-height: 27px;
	}

	@media (prefers-reduced-motion: reduce) {
		.slip,
		.glass-prop,
		.badge-prop,
		.tag-prop {
			transition: none;
		}
	}
</style>
