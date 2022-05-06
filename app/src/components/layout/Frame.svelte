<script>
  import { onMount } from 'svelte';
  import { cssValue } from '../lib/helpers';

  export let ratio = '16:9';
  $: [d, n] = ratio.split(':');

  let frame;

  onMount(() => {
    frame.style.paddingBottom = `calc(${cssValue(n)} / ${cssValue(d)} * 100%)`;
  });
</script>

<div bind:this={frame} class="frame">
  <slot />
</div>

<style>
  .frame {
    position: relative;
  }

  .frame > :global(*) {
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }

  .frame > :global(img),
  .frame > :global(video) {
    height: 100%;
    width: 100%;
    object-fit: cover;
  }
</style>
