<script>
  import { onMount } from 'svelte';
  import { cssValue } from '../lib/helpers';

  export let gap = 's0';
  export let padding = 's0';
  export let maxWidth = 'measure';
  export let centerText = false;
  export let centerItems = false;

  let bracket;
  let left;
  let center;
  let right;

  onMount(() => {
    bracket.style.padding = cssValue(padding);

    left.style.marginRight = cssValue(gap);
    right.style.marginLeft = cssValue(gap);

    center.style.maxWidth = cssValue(maxWidth);
    centerText ? (center.style.textAlign = 'center') : null;
    centerItems ? (center.style.alignItems = 'center') : null;
  });
</script>

<div bind:this={bracket} class="bracket">
  <div bind:this={left} class="left">
    <slot name="left" />
  </div>
  <div bind:this={center} class="center">
    <slot />
  </div>
  <div bind:this={right} class="right">
    <slot name="right" />
  </div>
</div>

<style>
  .bracket {
    display: flex;
  }

  .bracket > .center {
    margin-left: auto;
    margin-right: auto;
  }

  .bracket > .left {
    margin-left: 0;
  }

  .bracket > .right {
    margin-right: 0;
  }
</style>
