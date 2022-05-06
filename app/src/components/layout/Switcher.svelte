<script>
  import { onMount } from 'svelte';
  import { cssValue } from '../lib/helpers';

  export let gap = 's0';
  export let minWidth = 'measure';
  /** limit can only be a number (handed as a string), but not a CSS-variable */
  export let limit = '';

  let switcher;

  onMount(() => {
    switcher
      .querySelectorAll(`.switcher > *`)
      .forEach((e) => (e.style.margin = `calc(${cssValue(gap)} / 2 * -1)`));
    switcher.querySelectorAll(`.switcher > * > *`).forEach((e) => {
      e.style.flexBasis = `calc((${cssValue(minWidth)} - 100% + ${cssValue(gap)}) * 999)`;
      e.style.margin = `calc(${cssValue(gap)} / 2)`;
    });

    if (limit) {
      switcher
        .querySelectorAll(
          `.switcher > * > :nth-last-child(n+${limit}), .switcher > * > :nth-last-child(n+${limit}) ~ *`
        )
        .forEach((e) => (e.style.flexBasis = '100%'));
    }
  });
</script>

<div bind:this={switcher} class="switcher">
  <div>
    <slot />
  </div>
</div>

<style>
  .switcher > * {
    display: flex;
    flex-wrap: wrap;
    overflow: hidden;
  }

  .switcher > * > :global(*) {
    flex-grow: 1;
  }
</style>
