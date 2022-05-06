<script>
  import { onMount } from 'svelte';
  import { cssValue } from '../lib/helpers';

  export let gap = 's0';
  export let alignItems = 'center';
  export let justifyContent = 'center';

  let cluster;

  onMount(() => {
    cluster.querySelectorAll(`.cluster > *`).forEach((e) => {
      e.style.justifyContent = cssValue(justifyContent);
      e.style.alignItems = cssValue(alignItems);
      e.style.margin = `calc(${cssValue(gap)} / 2 * -1)`;
    });
    cluster
      .querySelectorAll(`.cluster > * > *`)
      .forEach((e) => (e.style.margin = `calc(${cssValue(gap)} / 2)`));
  });
</script>

<div bind:this={cluster} class="cluster">
  <slot />
</div>

<style>
  .cluster {
    overflow: hidden;
  }

  .cluster > :global(*) {
    display: flex;
    flex-wrap: wrap;
  }
</style>
