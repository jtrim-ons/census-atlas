<script>
	import Radio from './Radio.svelte';

	export let expanded = false;
	export let expandAll = false;
	export let props;
	export let selected;
	export let onselect = () => {};

	function toggle() {
		expanded = !expanded;
	}

	function radioClick(e) {
	    onselect();
		e.stopPropagation();
	}
</script>

<style>
	span {
		position: relative;
		padding: 0 0 0 1.3em;
		background: url(../icons/arrow.svg) 0 0.1em no-repeat;
		background-size: 1em 1em;
		font-weight: bold;
		cursor: pointer;
	}
	.accordion {
	    color: rgb(29, 112, 184);
	    font-size: 24px;
	    font-weight: 700;
    }
	.expanded {
		background-image: url(../icons/arrow-open.svg);
	}
	ul {
		padding: 0.2em 0 0 0.5em;
		margin: 0 0 0 0.5em;
		list-style: none;
		border-left: 1px solid #eee;
	}
	ul.no-left-border {
		padding: 0;
		margin: 0;
		border-left: none;
	}
	li {
		padding: 0.2em 0;
	}
	input {
		position: absolute;
		top: 3px;
		left: 1.2em;
	}
	li.hidden {
	    display: none;
    }
</style>

{#if props.type == 'group-radio'}
<span class:expanded="{expanded||expandAll}" on:click={toggle} style="padding-left: 2.3em">
	<input type="radio" bind:group={selected} value={props} on:click={radioClick} />
	{props.name}
</span>
{:else if !props.isRoot}
<span class:accordion="{props.depth==0}" class:expanded="{expanded||expandAll}" on:click={toggle}>
	{props.name}
</span>
{/if}
{#if props.code && props.type != 'group-radio'}<small>({props.code})</small>{/if}

{#if expanded || expandAll}
	<ul class:no-left-border={props.isRoot}>
		{#each props.children as child}
            <li class:hidden={child.hidden}>
                {#if child.depth != 1 && (child.type === 'group' || child.type === 'group-radio')}
                    <svelte:self {onselect} {expandAll} props={child} bind:selected={selected}/>
                {:else}
                    <Radio {onselect} props={child} bind:selected={selected}/>
                {/if}
            </li>
		{/each}
	</ul>
{/if}
