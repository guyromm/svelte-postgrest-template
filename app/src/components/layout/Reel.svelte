<script>
  import { onMount } from 'svelte';
  import { cssValue } from '../lib/helpers';

  export let gap = 's0';
  export let height = 'auto';
  export let itemWidth = 'auto';

  let reel;

  onMount(() => {
    reel.style.height = cssValue(height);
    reel.querySelectorAll(`.reel > * + *`).forEach((e) => (e.style.marginLeft = cssValue(gap)));
    reel
      .querySelectorAll(`.reel > *`)
      .forEach((e) => (e.style.flex = `0 0 ${cssValue(itemWidth)}`));
  });
</script>

<div bind:this={reel} class="reel">
  <slot />
</div>

<style>
  .reel {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .reel > :global(img) {
    height: 100%;
    flex-basis: auto;
    width: auto;
  }
</style>
