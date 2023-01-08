<script>
  import PassReset from '../../../components/PassReset.svelte';

  import { page } from '$app/stores';
</script>

<PassReset {page} mode="new-pass" />
