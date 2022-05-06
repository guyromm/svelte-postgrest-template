<script>
  import { onMount } from 'svelte';
  import { cssValue } from '../lib/helpers';

  export let gap = 's0';
  export let padding = 's0';
  export let minHeight = '100vh';

  let cover;
  let above;
  let below;

  onMount(() => {
    cover.style.minHeight = cssValue(minHeight);
    cover.style.padding = cssValue(padding);

    // set minimal gap between center and above/below
    above.style.marginBottom = cssValue(gap);
    below.style.marginTop = cssValue(gap);
  });
</script>

<div bind:this={cover} class="cover">
  <div bind:this={above} class="above">
    <slot name="above" />
  </div>
  <div class="center">
    <slot />
  </div>
  <div bind:this={below} class="below">
    <slot name="below" />
  </div>
</div>

<style>
  .cover {
    display: flex;
    flex-direction: column;
  }

  .cover > .center {
    margin-top: auto;
    margin-bottom: auto;
  }

  .cover > .above {
    margin-top: 0;
  }

  .cover > .below {
    margin-bottom: 0;
  }
</style>
