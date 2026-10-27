<!--
	Liking a page is stamping it: a round 推薦 rubber stamp that slams onto the
	paper in red ink. Works on any page with a `?/like` form action; signed-out
	visitors get a link to the login page instead of a 401.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	let { liked, count, signedIn }: { liked: boolean; count: number; signedIn: boolean } = $props();

	let pending = $state(false);
	// Bumped on each new like so the slam replays.
	let slams = $state(0);
</script>

{#snippet seal(inked: boolean)}
	{#key slams}
		<span class="seal" class:inked class:slam={slams > 0 && inked}>
			<span class="seal-word">推薦</span>
			<span class="seal-count font-mono-hack">{count}</span>
		</span>
	{/key}
{/snippet}

{#if signedIn}
	<form
		method="post"
		action="?/like"
		use:enhance={() => {
			pending = true;
			if (!liked) slams++;
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
			aria-label={liked ? `取消推薦，目前 ${count} 個推薦` : `蓋章推薦，目前 ${count} 個推薦`}
			class="stamp-btn"
		>
			{@render seal(liked)}
			<span class="stamp-hint">{liked ? '已蓋章' : '蓋章推薦'}</span>
		</button>
	</form>
{:else}
	<a href={resolve('/login')} class="stamp-btn" title="登入後就能蓋章推薦">
		{@render seal(false)}
		<span class="stamp-hint">登入後蓋章</span>
	</a>
{/if}

<style>
	.stamp-btn {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 0.45rem;
		color: #b3261e;
	}
	.stamp-btn:disabled {
		cursor: progress;
	}
	.seal {
		display: grid;
		place-items: center;
		align-content: center;
		width: 4.6rem;
		height: 4.6rem;
		border: 3px dashed color-mix(in srgb, #b3261e 55%, transparent);
		border-radius: 50%;
		color: color-mix(in srgb, #b3261e 70%, transparent);
		rotate: -10deg;
		transition:
			transform 0.2s,
			border-color 0.2s,
			color 0.2s;
	}
	.stamp-btn:hover .seal {
		border-color: #b3261e;
		color: #b3261e;
		transform: translateY(-3px) scale(1.04);
	}
	.seal.inked {
		border: 4px double #b3261e;
		background: radial-gradient(circle, rgba(179, 38, 30, 0.12), rgba(179, 38, 30, 0.04) 70%);
		color: #b3261e;
		mix-blend-mode: multiply;
	}
	.seal-word {
		font-family: var(--font-display);
		font-size: 1.05rem;
		letter-spacing: 0.15em;
		line-height: 1.1;
	}
	.seal-count {
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
	}
	.stamp-hint {
		color: var(--color-ink-muted);
		font-family: var(--font-mono-hack);
		font-size: 0.7rem;
		letter-spacing: 0.2em;
	}
	.slam {
		animation: slam 0.45s cubic-bezier(0.3, 1.5, 0.5, 1);
	}
	@keyframes slam {
		0% {
			opacity: 0;
			transform: translateY(-18px) scale(1.6);
		}
		60% {
			opacity: 1;
			transform: scale(0.94);
		}
		100% {
			transform: scale(1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.slam {
			animation: none;
		}
	}
</style>
