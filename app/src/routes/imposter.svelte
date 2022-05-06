<script>
  import { loremIpsum } from 'lorem-ipsum';
  import { Imposter, Box } from '../components/layout';
  import Presentation from '../components/Presentation.svelte';
</script>

<svelte:head><title>impostah</title></svelte:head>
<h1>
  <a href="https://absolutely.every-layout.dev/layouts/imposter/" target="blank">the imposter</a>
</h1>
<div style="min-width: 26rem; min-height:35rem; position: relative;">
  <p>{loremIpsum({ count: 50 })}</p>
  <Imposter>
    <Box color="white" padding="s-2">
      <p>{loremIpsum({ count: 10 })}</p></Box
    >
  </Imposter>
</div>
