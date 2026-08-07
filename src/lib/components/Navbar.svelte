<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { listPosts } from '$lib/content-service';
	import House from '@lucide/svelte/icons/house';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import User from '@lucide/svelte/icons/user';
	import UserRound from '@lucide/svelte/icons/user-round';
	import Tag from '@lucide/svelte/icons/tag';
	import Mail from '@lucide/svelte/icons/mail';
	import Rss from '@lucide/svelte/icons/rss';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import FolderGit2 from '@lucide/svelte/icons/folder-git-2';
	import Feather from '@lucide/svelte/icons/feather';
	import FilePen from '@lucide/svelte/icons/file-pen';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { user }: { user?: { name: string; role?: string | null } } = $props();

	// "首頁" gets a richer profile-card layout; other groups use a simple icon grid.
	const homePages = [
		{ label: '首頁', href: resolve('/'), icon: House },
		{ label: '關於我', href: '#about', icon: UserRound }
	];

	const navGroups = [
		{
			label: '首頁',
			icon: House,
			items: [] as { label: string; href: string; icon: typeof House }[]
		},
		{
			label: '手記',
			icon: BookOpen,
			items: [
				{ label: '技術文章', href: resolve('/articles'), icon: BookOpen },
				{ label: '心情', href: resolve('/moods'), icon: Feather },
				{ label: '所有文章', href: resolve('/blog'), icon: BookOpen },
				{ label: '標籤', href: '#tags', icon: Tag }
			]
		},
		{
			label: '更多',
			icon: LayoutGrid,
			items: [
				{ label: '作品集', href: resolve('/portfolio'), icon: FolderGit2 },
				{ label: '聯絡我', href: '#contact', icon: Mail },
				{ label: '追蹤 RSS', href: '/rss.xml', icon: Rss }
			]
		}
	];

	const postCount = listPosts().length;
	const displayName = 'Liam';

	let openGroup = $state<string | null>(null);
	let hoveredGroup = $state<string | null>(null);
	let profileOpen = $state(false);
	let navEl: HTMLElement | undefined = $state();
	let profileEl: HTMLElement | undefined = $state();
	let buttonEls: Record<string, HTMLButtonElement> = $state({});
	let indicatorStyle = $state('opacity:0');

	const highlightGroup = $derived(openGroup ?? hoveredGroup);

	$effect(() => {
		const btn = highlightGroup ? buttonEls[highlightGroup] : undefined;
		if (btn && navEl) {
			const navRect = navEl.getBoundingClientRect();
			const btnRect = btn.getBoundingClientRect();
			indicatorStyle = `opacity:1; width:${btnRect.width}px; transform:translateX(${btnRect.left - navRect.left}px)`;
		} else {
			indicatorStyle = 'opacity:0';
		}
	});

	function toggleGroup(label: string) {
		profileOpen = false;
		openGroup = openGroup === label ? null : label;
	}

	function toggleProfile() {
		openGroup = null;
		profileOpen = !profileOpen;
	}

	function closeAll() {
		openGroup = null;
		profileOpen = false;
	}

	function handleWindowClick(event: MouseEvent) {
		const target = event.target as Node;
		if (openGroup && navEl && !navEl.contains(target)) openGroup = null;
		if (profileOpen && profileEl && !profileEl.contains(target)) profileOpen = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') closeAll();
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeydown} />

<header class="fixed inset-x-0 top-4 z-50 flex items-center justify-center gap-3 px-4">
	<a
		href={resolve('/')}
		class="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-case bg-surface/80 font-bold text-ink shadow-sm backdrop-blur-md"
	>
		L
	</a>

	<nav
		bind:this={navEl}
		onmouseleave={() => (hoveredGroup = null)}
		class="relative flex items-center gap-1 rounded-full border border-border-case bg-surface/80 px-2 py-1.5 shadow-sm backdrop-blur-md"
	>
		<div
			class="pointer-events-none absolute inset-y-1.5 left-0 rounded-full bg-surface-alt transition-all duration-200 ease-out"
			style={indicatorStyle}
		></div>

		{#each navGroups as group (group.label)}
			{@const Icon = group.icon}
			<div class="relative">
				<button
					bind:this={buttonEls[group.label]}
					type="button"
					class="group relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-ink"
					aria-expanded={openGroup === group.label}
					onmouseenter={() => (hoveredGroup = group.label)}
					onclick={() => toggleGroup(group.label)}
				>
					<Icon class="size-4" />
					<span class="relative inline-block">
						{group.label}
						<span
							class="absolute -bottom-1 left-0 h-0.5 w-full origin-center bg-ink transition-transform duration-200 {highlightGroup ===
							group.label
								? 'scale-x-100'
								: 'scale-x-0'}"
						></span>
					</span>
					<ChevronDown
						class="size-3.5 transition-transform {openGroup === group.label ? 'rotate-180' : ''}"
					/>
				</button>

				{#if openGroup === group.label}
					{#if group.label === '首頁'}
						<div
							class="absolute top-full left-1/2 mt-2 flex w-96 -translate-x-1/2 gap-3 rounded-xl border border-border-case bg-surface p-3 shadow-lg"
							in:fly={{ y: -6, duration: 160 }}
							out:fly={{ y: -6, duration: 100 }}
						>
							<div class="flex w-36 shrink-0 flex-col gap-2 border-r border-border-case pr-3">
								<div class="flex items-center gap-2">
									<span
										class="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-alt text-sm font-bold text-ink"
									>
										L
									</span>
									<div class="min-w-0">
										<p class="truncate text-sm font-semibold text-ink">{displayName}</p>
										<p class="flex items-center gap-1 text-xs text-ink-muted">
											<span class="size-1.5 rounded-full bg-green-500"></span>
											在線
										</p>
									</div>
								</div>
								<p class="text-xs text-ink-muted">{postCount} 篇文章</p>
							</div>
							<div class="flex flex-1 flex-col gap-1">
								{#each homePages as item (item.label)}
									{@const ItemIcon = item.icon}
									<!-- eslint-disable svelte/no-navigation-without-resolve -- item.href is pre-resolved for real routes; placeholder items use plain "#anchor" strings -->
									<a
										href={item.href}
										class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink hover:bg-surface-alt"
										onclick={closeAll}
									>
										<span
											class="flex size-8 items-center justify-center rounded-full bg-surface-alt text-ink-muted"
										>
											<ItemIcon class="size-4" />
										</span>
										{item.label}
									</a>
									<!-- eslint-enable svelte/no-navigation-without-resolve -->
								{/each}
							</div>
						</div>
					{:else}
						<div
							class="absolute top-full left-1/2 mt-2 w-56 -translate-x-1/2 rounded-xl border border-border-case bg-surface p-2 shadow-lg"
							in:fly={{ y: -6, duration: 160 }}
							out:fly={{ y: -6, duration: 100 }}
						>
							<div class="grid grid-cols-2 gap-1">
								{#each group.items as item (item.label)}
									{@const ItemIcon = item.icon}
									<!-- eslint-disable svelte/no-navigation-without-resolve -- item.href is pre-resolved for real routes; placeholder items use plain "#anchor" strings -->
									<a
										href={item.href}
										class="flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-center text-xs font-medium text-ink hover:bg-surface-alt"
										onclick={closeAll}
									>
										<span
											class="flex size-9 items-center justify-center rounded-full bg-surface-alt text-ink-muted"
										>
											<ItemIcon class="size-4" />
										</span>
										{item.label}
									</a>
									<!-- eslint-enable svelte/no-navigation-without-resolve -->
								{/each}
								{#if group.label === '更多' && user?.role === 'Liam'}
									<a
										href={resolve('/admin/comments')}
										class="flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-center text-xs font-medium text-ink hover:bg-surface-alt"
										onclick={closeAll}
									>
										<span
											class="flex size-9 items-center justify-center rounded-full bg-surface-alt text-ink-muted"
										>
											<ShieldCheck class="size-4" />
										</span>
										留言審核
									</a>
									<a
										href={resolve('/admin/posts')}
										class="flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-center text-xs font-medium text-ink hover:bg-surface-alt"
										onclick={closeAll}
									>
										<span
											class="flex size-9 items-center justify-center rounded-full bg-surface-alt text-ink-muted"
										>
											<FilePen class="size-4" />
										</span>
										文章管理
									</a>
								{/if}
							</div>
						</div>
					{/if}
				{/if}
			</div>
		{/each}
	</nav>

	<div class="absolute top-0 right-4 flex items-center gap-2">
		<ThemeToggle />
		<div bind:this={profileEl}>
			<button
				type="button"
				class="flex size-10 items-center justify-center rounded-full border border-border-case bg-surface/80 shadow-sm backdrop-blur-md hover:bg-surface-alt"
				aria-expanded={profileOpen}
				onclick={toggleProfile}
			>
				<User class="size-4.5 text-ink-muted" />
			</button>

			{#if profileOpen}
				<div
					class="absolute top-full right-0 mt-2 w-40 rounded-xl border border-border-case bg-surface p-1.5 shadow-lg"
					in:fly={{ y: -6, duration: 160 }}
					out:fly={{ y: -6, duration: 100 }}
				>
					{#if user}
						<p class="truncate px-3 py-1.5 text-sm text-ink-muted">{user.name}</p>
						<form method="post" action="{resolve('/login')}?/signOut" use:enhance>
							<button
								type="submit"
								class="block w-full rounded-lg px-3 py-1.5 text-left text-sm text-ink hover:bg-surface-alt"
							>
								登出
							</button>
						</form>
					{:else}
						<a
							href={resolve('/login')}
							class="block rounded-lg px-3 py-1.5 text-sm text-ink hover:bg-surface-alt"
							onclick={closeAll}
						>
							登入
						</a>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</header>
