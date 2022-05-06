<script>
  import { Box, Bracket, Cover } from './layout';
</script>

<Box backgroundColor="white">
  <Bracket centerText padding="zero">
    <Cover minHeight="s0">
      <div slot="above">
        <slot name="title" />
      </div>
      <slot />
    </Cover>
  </Bracket>
</Box>
