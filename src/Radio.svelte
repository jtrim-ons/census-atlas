<script>
	export let props;
	export let selected;
	export let onselect = () => {};
</script>

<style>
	div {
		position: relative;
	}
	span, label {
		padding: 0 0 0 1.3em;
	}
	input {
		position: absolute;
		top: 3px;
		left: 2px;
	}
</style>

<div>
	<label>
	    <input type="radio" bind:group={selected} value={props} on:click={() => {onselect()}} />
	    {props.name}
	</label>
</div>
