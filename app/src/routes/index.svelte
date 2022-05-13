<script>
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
  } from '../components/layout';
  import {postfix} from '../../../common/funcs.js';
  import Presentation from '../components/Presentation.svelte';
  function L(n) {
    return '/'+n+postfix;
  }
</script>

<h1>
  <a href="https://every-layout.dev/layouts/grid/" target="_blank">the grid (you're here now)</a>
</h1>
<Grid minWidth="12rem">
  <Presentation>
    <a slot="title" href={L("stack")}><h5>Stack</h5></a>
    <Stack recursive>
      <ul>
        <li><p>some</p></li>
        <li><p>equally</p></li>
        <li><p>spaced</p></li>
        <li><p>content</p></li>
      </ul>
    </Stack>
  </Presentation>

  <Presentation>
    <a href={L("box")}><h5>Box</h5></a>
    <Box padding="s1" />
  </Presentation>

  <Presentation>
    <a slot="title" href={L("bracket")}><h5>Bracket</h5></a>
    <Bracket>
      <div slot="left">
        <Box padding="zero">
          <div style="height:calc(var(--s1) * 2);" />
        </Box>
      </div>
      <Box padding="s1" />
      <div slot="right">
        <Box padding="zero">
          <div style="height:calc(var(--s1) * 2);" />
        </Box>
      </div>
    </Bracket>
  </Presentation>

  <Presentation>
    <a slot="title" href={L("cluster")}><h5>Cluster</h5></a>
    <Cluster>
      <ul style="list-style: none">
        <li><p>Content</p></li>
        <li><p>Content</p></li>
        <li><p>Content</p></li>
        <li><p>Content</p></li>
        <li><p>Content</p></li>
      </ul>
    </Cluster>
  </Presentation>

  <Presentation>
    <a slot="title" href={L("sidebar")}><h5>Sidebar</h5></a>
    <Sidebar>
      <div slot="sidebar">
        <Box padding="s-2" color="white">
          <Stack splitAfter="1">
            <p>A</p>
            <p>B</p>
          </Stack>
        </Box>
      </div>
      <div slot="not-sidebar">
        <Box color="white">
          <p>Main Content</p>
        </Box>
      </div>
    </Sidebar>
  </Presentation>

  <Presentation>
    <a slot="title" href={L("switcher")}><h5>Switcher</h5></a>
    <Switcher minWidth="13rem">
      <Box />
      <Box />
      <Box />
    </Switcher>
  </Presentation>

  <Presentation>
    <a slot="title" href={L("cover")}><h5>Cover</h5></a>
    <Cover minHeight="10vh">
      <div slot="above">
        <Box padding="zero" />
      </div>
      <Box padding="s1" />
      <div slot="below">
        <Box padding="zero" />
      </div>
    </Cover>
  </Presentation>

  <Presentation>
    <a slot="title" href="/"><h5>Grid</h5></a>
    <div style="min-width: 8rem;">
      <Grid minWidth="s1">
        <Box padding="s-3" color="white">X</Box>
        <Box padding="s-3" color="white">o</Box>
        <Box padding="s-3" color="white">o</Box>
        <Box padding="s-3" color="white">o</Box>
        <Box padding="s-3" color="white">X</Box>
        <Box padding="s-3" color="white">o</Box>
        <Box padding="s-3" color="white">o</Box>
        <Box padding="s-3" color="white">o</Box>
        <Box padding="s-3" color="white">X</Box>
      </Grid>
    </div>
  </Presentation>

  <Presentation>
    <a slot="title" href={L("frame")}><h5>Frame</h5></a>
    <Box padding="zero">
      <Frame>
        <img src="favicon.png" alt="favicon" />
      </Frame>
    </Box>
  </Presentation>

  <Presentation>
    <a slot="title" href={L("reel")}><h5>Reel</h5></a>
    <Box padding="zero" backgroundColor="white">
      <div style="max-width: 12rem;">
        <Reel itemWidth="s4">
          <img src="favicon.png" alt="favicon" />
          <img src="favicon.png" alt="favicon" />
          <img src="favicon.png" alt="favicon" />
          <img src="favicon.png" alt="favicon" />
          <img src="favicon.png" alt="favicon" />
          <img src="favicon.png" alt="favicon" />
          <img src="favicon.png" alt="favicon" />
          <img src="favicon.png" alt="favicon" />
          <img src="favicon.png" alt="favicon" />
          <img src="favicon.png" alt="favicon" />
        </Reel>
      </div>
    </Box>
  </Presentation>

  <Presentation>
    <a slot="title" href={L("imposter")}><h5>Imposter</h5></a>
    <Box padding="zero" backgroundColor="white">
      <div style="max-width: 12rem; position: relative;">
        <p>
          Some obscured text. Some obscured text. Some obscured text. Some obscured text. Some
          obscured text.
        </p>
        <Imposter>
          <Box color="white" padding="s-2">
            <p>I'm infront!</p>
            <br />
            <br />
            <br />
            <br />
            <p>And scrollable!</p>
          </Box>
        </Imposter>
      </div>
    </Box>
  </Presentation>
</Grid>

<style>
  a[target='_blank'] {
    color: red;
  }
</style>
