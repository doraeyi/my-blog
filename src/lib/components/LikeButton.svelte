<!--
	Heart toggle for any page with a `?/like` form action. Signed-out visitors
	get a link to the login page instead of a 401.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Heart from '@lucide/svelte/icons/heart';

	let { liked, count, signedIn }: { liked: boolean; count: number; signedIn: boolean } = $props();

	let pending = $state(false);
	// Bumped on each new like so the pop animation replays.
	let pops = $state(0);
</script>

{#if signedIn}
	<form
		method="post"
		action="?/like"
		use:enhance={() => {
			pending = true;
			if (!liked) pops++;
			return async ({ update }) => {
				await update({ reset: false });
				pending = false;
			};
		}}
	>
		<button
			type="submit"
			disabled={pending}
			aria-pressed={liked}
			aria-label={liked ? `取消按讚，目前 ${count} 個讚` : `按讚，目前 ${count} 個讚`}
			class="like-btn {liked ? 'is-liked' : ''}"
		>
			{#key pops}
				<span class="heart" class:pop={pops > 0 && liked}>
					<Heart class="size-4" fill={liked ? 'currentColor' : 'none'} />
				</span>
			{/key}
			<span class="font-mono-hack text-xs tabular-nums">{count}</span>
		</button>
	</form>
{:else}
	<a href={resolve('/login')} class="like-btn" title="登入後就能按讚">
		<span class="heart"><Heart class="size-4" /></span>
		<span class="font-mono-hack text-xs tabular-nums">{count}</span>
	</a>
{/if}

<style>
	.like-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.4rem 0.9rem;
		border: 1px solid var(--color-border-case);
		border-radius: 999px;
		color: var(--color-ink-muted);
		transition:
			color 0.2s,
			border-color 0.2s,
			background-color 0.2s;
	}
	.like-btn:hover {
		color: #d9534f;
		border-color: color-mix(in srgb, #d9534f 50%, transparent);
	}
	.like-btn.is-liked {
		color: #e5534b;
		border-color: color-mix(in srgb, #e5534b 60%, transparent);
		background: color-mix(in srgb, #e5534b 10%, transparent);
	}
	.like-btn:disabled {
		cursor: progress;
	}
	.heart {
		display: inline-flex;
	}
	.pop {
		animation: pop 0.45s cubic-bezier(0.2, 1.6, 0.4, 1);
	}
	@keyframes pop {
		0% {
			transform: scale(0.6);
		}
		60% {
			transform: scale(1.35);
		}
		100% {
			transform: scale(1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.pop {
			animation: none;
		}
	}
</style>
