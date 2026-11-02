<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import RedStringBoard from '$lib/components/RedStringBoard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo />

<!-- The cover: the case board — Liam, his chapters, his files and his friends on red string. -->
<RedStringBoard board={data.board} friends={data.friends} />
