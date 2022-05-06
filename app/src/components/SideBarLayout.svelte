<script>
  import { Sidebar, Cover, Box, Stack } from './layout';
  import Presentation from './Presentation.svelte';
</script>

<Cover>
  <Presentation>
    <a slot="title" href="https://every-layout.dev/layouts/sidebar/" target="blank"
      ><h5>Sidebar</h5></a
    >
    <Sidebar>
      <div slot="sidebar">
        <Box padding="s-2" color="white">
          <Stack splitAfter="1">
            <slot name="sidebar" />
          </Stack>
        </Box>
      </div>

      <div slot="not-sidebar">
        <Box color="white">
          <slot name="main" />
        </Box>
      </div>
    </Sidebar>
  </Presentation>
</Cover>
