<script>
  import { loremIpsum } from 'lorem-ipsum';
  import { Box } from '../components/layout';
  import Presentation from '../components/Presentation.svelte';
</script>

<svelte:head><title>box</title></svelte:head>

<h1><a href="https://every-layout.dev/layouts/box/" target="_blank">Box</a></h1>
<Box padding="s1"><span style="color:white">{loremIpsum({ count: 50 })}</span></Box>
