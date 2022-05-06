<script>
  import { onMount } from 'svelte';
  import { cssValue } from '../lib/helpers';

  export let padding = 's0';
  export let color = 'color-primary';
  export let backgroundColor = 'color-secondary';
  export let borderWidth = 'border-medium';
  export let borderStyle = 'solid';
  export let borderColor = 'color-primary';

  let box;

  onMount(() => {
    box.style.padding = cssValue(padding);
    box.style.color = cssValue(color);
    box.style.backgroundColor = cssValue(backgroundColor);

    if (borderWidth) {
      box.style.border = cssValue(borderWidth, borderStyle, borderColor);
    } else {
      box.style.outline = '0.125rem solid transparent';
      box.style.outlineOffset = '-0.125rem';
    }
  });
</script>

<div bind:this={box} class="box">
  <slot />
</div>

<style>
  .box :global(*) {
    color: inherit;
  }
</style>
