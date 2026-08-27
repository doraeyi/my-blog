<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import MessageSquareText from '@lucide/svelte/icons/message-square-text';
	import FolderGit2 from '@lucide/svelte/icons/folder-git-2';
	import FilePen from '@lucide/svelte/icons/file-pen';
	import Clapperboard from '@lucide/svelte/icons/clapperboard';

	let { children } = $props();

	const tabs = [
		{ label: '留言審核', href: resolve('/admin/comments'), icon: MessageSquareText },
		{ label: '作品集管理', href: resolve('/admin/projects'), icon: FolderGit2 },
		{ label: '文章管理', href: resolve('/admin/posts'), icon: FilePen },
		{ label: '追劇管理', href: resolve('/admin/watch'), icon: Clapperboard }
	];
</script>

<div class="mx-auto max-w-4xl px-6 pt-28 pb-16">
	<nav class="flex gap-1 border-b border-border-case">
		<!-- eslint-disable svelte/no-navigation-without-resolve -- tab.href is pre-resolved via resolve() in the tabs array above -->
		{#each tabs as tab (tab.label)}
			{@const Icon = tab.icon}
			{@const active = page.url.pathname.startsWith(tab.href)}
			<a
				href={tab.href}
				class="flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition {active
					? 'border-ink text-ink'
					: 'border-transparent text-ink-muted hover:text-ink'}"
			>
				<Icon class="size-4" />
				{tab.label}
			</a>
		{/each}
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</nav>

	<div class="mt-6">
		{@render children()}
	</div>
</div>
