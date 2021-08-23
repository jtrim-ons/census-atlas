<style>
	div {
		box-sizing: border-box;
		padding: 8px;
		z-index: 2;
		width: 320px;
		position: absolute;
	    right: 12px;
	    bottom: 24px;
	    background: white;
	    box-shadow: 6px 0 5px 0 rgba(80, 80, 80, 0.2);
	    border-radius: 4px;
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

<div>
	<slot></slot>
</div>
