<script>
  import { loremIpsum } from 'lorem-ipsum';
  import {
    Cover,
    Stack,
    Bracket,
    Cluster,
    Sidebar,
    Switcher,
    Frame,
    Reel,
    Imposter,
    Grid,
    Box
  } from '../../components/layout';
  import Presentation from '../../components/Presentation.svelte';
</script>

<Stack recursive>
  <h1><a href="https://every-layout.dev/layouts/stack/" target="_blank">the stack</a></h1>
  <ul>
    {#each [...Array(10).keys()] as i}
      <li><p>{loremIpsum({ count: 1 })}</p></li>
    {/each}
  </ul>
</Stack>
