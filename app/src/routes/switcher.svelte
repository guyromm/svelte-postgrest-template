<script>
  import { Switcher, Box } from '../components/layout';
</script>

<a href="https://every-layout.dev/layouts/switcher/" target="_blank"><h1>Switcher</h1></a>
{#each [...Array(20).keys()].slice(1) as i}
  <h5>{i} options</h5>
  <Switcher minWidth="13rem">
    {#each [...Array(i).keys()] as k}
      <Box><span style="color:white">Option {k}</span></Box>
    {/each}
  </Switcher>
{/each}
