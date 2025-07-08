<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import '../app.css';
	
	let { children } = $props();
	
	onMount(async () => {
		await auth.initialize();
	});
</script>

{@render children()}

<style>
	:global(body) {
		margin: 0;
		background-color: #f5f5f5;
	}
</style>
