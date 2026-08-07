<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let Post = $derived(data.component);
	let liked = $derived(form && 'liked' in form ? form.liked : data.liked);
	let message = $derived(form && 'message' in form ? form.message : undefined);
</script>

<article>
	<h1 class="text-3xl font-bold">{data.metadata.title}</h1>
	<p class="text-sm text-gray-500">{data.metadata.date}</p>

	<div class="prose mt-6">
		<Post />
	</div>
</article>

<section class="mt-8">
	<form method="post" action="?/like" use:enhance>
		<button
			type="submit"
			class="rounded-md border px-3 py-1 text-sm"
			class:bg-blue-600={liked}
			class:text-white={liked}
		>
			{liked ? '已按讚' : '按讚'} ({data.likeCount})
		</button>
	</form>
</section>

<section class="mt-8">
	<h2 class="text-xl font-semibold">留言 ({data.comments.length})</h2>
	<ul class="mt-4 space-y-3">
		{#each data.comments as comment (comment.id)}
			<li>
				<strong>{comment.author.name}</strong>
				<p>{comment.body}</p>
			</li>
		{/each}
	</ul>

	<form method="post" action="?/comment" use:enhance class="mt-4 space-y-2">
		<textarea name="body" required class="w-full rounded-md border p-2" rows="3"></textarea>
		<button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-white">送出留言</button>
	</form>
	{#if message}
		<p class="mt-2 text-red-600">{message}</p>
	{/if}
</section>
