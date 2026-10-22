<!-- Picks the 3D component for a piece of gear. -->
<script lang="ts">
	import type { GearModel } from '$lib/collections';
	import PhoneModel from './PhoneModel.svelte';
	import KeyboardModel from './KeyboardModel.svelte';
	import MouseModel from './MouseModel.svelte';

	let { model, label }: { model: GearModel; label: string } = $props();
</script>

{#if model.kind === 'iphone-15-pro'}
	<PhoneModel finish={model.finish} {label} />
{:else if model.kind === 'gpro-x-tkl'}
	<KeyboardModel keycaps={model.keycaps} {label} />
{:else}
	<MouseModel {label} />
{/if}
