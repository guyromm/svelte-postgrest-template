<script>
  import { stores } from '@sapper/app'

  import PassReset from '../../components/PassReset.svelte'

  const { page } = stores()
</script>

<PassReset {page} mode='send-email'/>
