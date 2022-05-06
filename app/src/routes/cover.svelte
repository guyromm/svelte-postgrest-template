<script>
  import { Cover, Box } from '../components/layout';
  import { loremIpsum } from 'lorem-ipsum';
</script>

<Cover minHeight="10vh">
  <div slot="above">
    <Box padding="zero">
      <h3><a href="https://every-layout.dev/layouts/cover/" target="_blank">Cover</a></h3>
    </Box>
  </div>
  <Box padding="s1"><span class="wt">{loremIpsum({ count: 50 })}</span></Box>
  <div slot="below">
    <Box padding="zero">{loremIpsum({ count: 5 })}</Box>
  </div>
</Cover>

<style>
  span.wt {
    color: white !important;
  }
</style>
