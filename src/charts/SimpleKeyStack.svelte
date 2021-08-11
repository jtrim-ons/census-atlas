<script>
	import { getContext } from 'svelte';

	const { xScale, yRange } = getContext('LayerCake');
	
	export let ticks;
	
	import colors from '../colors.js';
</script>

<g class="stack-background">
	{#each ticks.slice(0, -1) as tick, i}
		<rect
			class='group-rect'
			data-id="{i}"
			x="{$xScale(tick)}"
			y="{$yRange[1]}"
			width="{$xScale(ticks[i + 1]) - $xScale(tick)}"
			height="{$yRange[0]}"
			fill="{colors.base[i]}"
			opacity="1"
		/>
	{/each}
</g>
