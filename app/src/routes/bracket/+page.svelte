<script>
  import { loremIpsum } from 'lorem-ipsum';
  import { Bracket, Box } from '../../components/layout';
  import Presentation from '../../components/Presentation.svelte';
</script>

<svelte:head><title>bracket</title></svelte:head>

<a href="https://every-layout.dev/layouts/center/" target="_blank"><h5>Bracket</h5></a>
<Bracket>
  <div slot="left">
    <Box padding="zero">
      <div style="height:calc(var(--s1) * 2);">{loremIpsum({ count: 1 })}</div>
    </Box>
  </div>
  <Box padding="s1"><span style="color:white">{loremIpsum({ count: 20 })}</span></Box>
  <div slot="right">
    <Box padding="zero">
      <div style="height:calc(var(--s1) * 2);">{loremIpsum({ count: 1 })}</div>
    </Box>
  </div>
</Bracket>
