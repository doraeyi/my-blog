import type { Component } from 'svelte';

export interface PostMetadata {
	title: string;
	date: string;
	tags?: string[];
	excerpt?: string;
	series?: string;
	published?: boolean;
}

export interface PostSummary extends PostMetadata {
	slug: string;
}

interface PostModule {
	metadata: PostMetadata;
	default: Component;
}

// Eager: for a personal blog's scale, bundling all compiled posts together is
// simpler and more honest than a mixed eager/lazy glob over the same files,
// which Rollup can't actually split anyway (it warns and inlines everything).
const modules = import.meta.glob<PostModule>('/src/lib/content/posts/*.md', { eager: true });

function slugFromPath(path: string): string {
	return path.split('/').pop()!.replace(/\.md$/, '');
}

function allPosts(): PostSummary[] {
	return Object.entries(modules)
		.map(([path, mod]) => ({ ...mod.metadata, slug: slugFromPath(path) }))
		.filter((post) => post.published !== false)
		.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function listPosts(): PostSummary[] {
	return allPosts();
}

export function getPostBySlug(
	slug: string
): { metadata: PostSummary; component: Component } | null {
	const mod = modules[`/src/lib/content/posts/${slug}.md`];
	if (!mod) return null;
	return { metadata: { ...mod.metadata, slug }, component: mod.default };
}
