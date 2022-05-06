<script>
  import { onMount } from 'svelte';
  import { cssValue } from '../lib/helpers';

  export let gap = 's0';
  export let minWidth = 'measure';

  let grid;

  onMount(() => {
    grid.style.gridGap = cssValue(gap);
    grid.style.gridTemplateColumns = `repeat(auto-fit, minmax(${cssValue(minWidth)}, 1fr))`;
  });
</script>

<div bind:this={grid} class="grid">
  <slot />
</div>

<style>
  .grid {
    display: grid;
  }
</style>
