<script>
  export let selectMode = false;
</script>

<style>
	main {
		box-sizing: border-box;
		padding: 24px;
		/* z-index: 2; */
		width: 520px;
		position: absolute;
	  transition: transform linear .4s;
	}
	main.selectmode {
		transform: translate(-550px, 0);
  }
	@media (max-width: 900px) {
		main {
			width: 50%;
		}
	}
	@media (max-width: 670px) {
		main {
			width: 100%;
			top: 70%;
		}
	}
</style>

<main class:selectmode={selectMode}>
	<slot></slot>
</main>
