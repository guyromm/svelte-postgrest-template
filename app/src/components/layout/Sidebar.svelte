<script>
  import { onMount } from 'svelte';
  import { cssValue } from '../lib/helpers';

  export let gap = 's0';
  export let sidebarIs = 'left';
  export let sideWidth = '';
  export let contentMinWidth = '50%';

  let withSidebar;
  let notSidebar;
  let sidebar;

  onMount(() => {
    notSidebar.style.minWidth = cssValue(contentMinWidth);

    if (sideWidth) {
      sidebar.style.flexBasis = cssValue(sideWidth);
    }

    if (gap) {
      withSidebar
        .querySelectorAll(`.with-sidebar > *`)
        .forEach((e) => (e.style.margin = `calc(${cssValue(gap)} / 2 * -1)`));
      withSidebar
        .querySelectorAll(`.with-sidebar > * > *`)
        .forEach((e) => (e.style.margin = `calc(${cssValue(gap)} / 2)`));
      notSidebar.style.minWidth = `calc(${cssValue(contentMinWidth)} - ${cssValue(gap)})`;
    }
  });
</script>

<div bind:this={withSidebar} class="with-sidebar">
  <div>
    {#if sidebarIs === 'left'}
      <div bind:this={sidebar} class="sidebar">
        <slot name="sidebar" />
      </div>
      <div bind:this={notSidebar} class="not-sidebar">
        <slot name="not-sidebar" />
      </div>
    {:else}
      <div bind:this={notSidebar} class="not-sidebar">
        <slot name="not-sidebar" />
      </div>
      <div bind:this={sidebar} class="sidebar">
        <slot name="sidebar" />
      </div>
    {/if}
  </div>
</div>

<style>
  .with-sidebar {
    overflow: hidden;
  }

  .with-sidebar > * {
    display: flex;
    flex-wrap: wrap;
  }

  .sidebar {
    flex-grow: 1;
  }

  .not-sidebar {
    /* ↓ grow from nothing */
    flex-basis: 0;
    flex-grow: 999;
  }
</style>
