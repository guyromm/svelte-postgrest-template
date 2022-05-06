<script>
  import { onMount } from 'svelte';
  import { cssValue } from '../lib/helpers';

  export let gap = 's0';
  export let recursive = false;
  /** splitAfter can only be a number (handed as a string), but not a CSS-variable */
  export let splitAfter = '';

  let stack;

  onMount(() => {
    if (recursive) {
      stack.querySelectorAll(`* + *`).forEach((e) => (e.style.marginTop = cssValue(gap)));
    } else {
      stack.querySelectorAll(`.stack > * + *`).forEach((e) => (e.style.marginTop = cssValue(gap)));
    }

    if (splitAfter) {
      stack
        .querySelectorAll(`.stack > :nth-child(${splitAfter})`)
        .forEach((e) => (e.style.marginBottom = 'auto'));
    }
  });
</script>

<div bind:this={stack} class="stack">
  <slot />
</div>

<style>
  .stack {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  /* allow for split even if no sibling height is available */
  .stack:only-child {
    height: 100%;
  }
</style>
