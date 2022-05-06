<script>
  import { loremIpsum } from 'lorem-ipsum';
  import { Sidebar } from '../components/layout';
  let li = loremIpsum({ count: 20 });
</script>

<svelte:head><title>sidebar home</title></svelte:head>

<Sidebar>
  <div slot="sidebar">
    <h4>on the side</h4>
    <ul>
      {#each [...Array(10).keys()] as i}
        <li>list entry {i}</li>
      {/each}
    </ul>
  </div>
  <div slot="not-sidebar">
    <h4><a href="https://every-layout.dev/layouts/sidebar/" target="_blank">the sidebar</a></h4>
    <p>{li}</p>
  </div>
</Sidebar>
