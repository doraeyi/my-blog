<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import StudyRoom from '$lib/components/StudyRoom.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo />

<!-- The cover: Liam's study — the computer, the lamp and his book on the desk, friends on the wall. -->
<StudyRoom board={data.board} friends={data.friends} />
