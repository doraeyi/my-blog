<script lang="ts">
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';
	import RedStringBoard from '$lib/components/RedStringBoard.svelte';
	import StudyRoom from '$lib/components/StudyRoom.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	// Prototype comparison: /?v=office still shows the 3D office.
	const office = $derived(page.url.searchParams.get('v') === 'office');
</script>

<Seo />

{#if office}
	<StudyRoom board={data.board} friends={data.friends} />
{:else}
	<!-- The cover: the case board — Liam, his chapters, his files and his friends on red string. -->
	<RedStringBoard board={data.board} friends={data.friends} />
{/if}
