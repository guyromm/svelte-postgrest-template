<script>
  import { onMount } from 'svelte';
  import { cssValue } from '../lib/helpers';

  export let gap = 's0';
  export let fixed = false;
  export let breakout = false;

  let imposter;

  onMount(() => {
    fixed ? (imposter.style.position = 'fixed') : null;
    if (!breakout) {
      imposter.style.maxWidth = `calc(100% - ${cssValue(gap)} * 2)`;
      imposter.style.maxHeight = `calc(100% - ${cssValue(gap)} * 2)`;
    }
  });
</script>

<div bind:this={imposter} class="imposter">
  <slot />
</div>

<style>
  .imposter {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    overflow: auto;
  }
</style>
