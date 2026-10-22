<!-- Picks the 3D component for a piece of gear. -->
<script lang="ts">
	import type { GearModel } from '$lib/collections';
	import type { Shoot } from '$lib/gear-shots';
	import PhoneModel from './PhoneModel.svelte';
	import KeyboardModel from './KeyboardModel.svelte';
	import MouseModel from './MouseModel.svelte';

	let {
		model,
		label,
		onshoot
	}: { model: GearModel; label: string; onshoot?: (shoot: Shoot) => void } = $props();
</script>

{#if model.kind === 'iphone-15-pro'}
	<PhoneModel finish={model.finish} {label} {onshoot} />
{:else if model.kind === 'gpro-x-tkl'}
	<KeyboardModel keycaps={model.keycaps} {label} {onshoot} />
{:else}
	<MouseModel {label} {onshoot} />
{/if}
