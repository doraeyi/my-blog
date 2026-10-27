<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import SuspectBoard from '$lib/components/SuspectBoard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo />

<!-- The cover: an evidence board that says who Liam is at a glance. -->
<SuspectBoard board={data.board} />
