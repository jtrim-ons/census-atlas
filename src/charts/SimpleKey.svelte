<script>
	import { LayerCake, Svg } from 'layercake';
	import { histogram } from 'd3-array';
	import { scalePow } from 'd3-scale';

	import AreaMask from './AreaMask.svelte';
	import SimpleKeyStack from './SimpleKeyStack.svelte';
	import Marker from './Marker.svelte';
	import AxisX from './AxisX.svelte';

	export let breaks;
	export let key = 'perc';

	const xKey = ['x0', 'x1'];
	const yKey = 'length';
	const maskId = 'area-mask';

	$: domain = [breaks[0], breaks[breaks.length - 1]];

	$: scale = (breaks[1] - domain[0]) / (domain[1] - domain[0]) < 1 / 20 ? 0.5 : (breaks[4] - domain[0]) / (domain[1] - domain[0]) > 19 / 20 ? 2 : 1;

	$: formatTick = d => d.toFixed(Math.abs(breaks[1] - domain[0]) < 0.1 ? 2 : Math.abs(breaks[1] - domain[0]) < 1 ? 1 : 0);

	$: scaleActive = scalePow().exponent(scale);
</script>

<style>
	.chart-container {
		width: 100%;
		height: 50px;
	}
	.input-container {
		text-align: right;
	}
	input {
		height: auto;
	}
	label {
		display: inline-block;
		margin-right: 5px;
	}
</style>

{#if scaleActive}
<div class="chart-container">
	<LayerCake
		padding={{ top: 0, right: 0, bottom: 30, left: 0 }}
		x={xKey}
		xDomain={domain}
		xScale={scaleActive}
		y={yKey}
		yDomain={[0, null]}
	>
		<Svg>
			<SimpleKeyStack
				ticks={breaks}
			/>
			<AxisX
				gridlines={true}
				baseline={true}
				snapTicks={true}
				ticks={breaks}
				dyTick={5}
				{formatTick}
			/>
		</Svg>
	</LayerCake>
</div>
{/if}
