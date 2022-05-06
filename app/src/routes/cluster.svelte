<script>
  import { loremIpsum } from 'lorem-ipsum';
  import { Cluster } from '../components/layout';
</script>

<a href="https://every-layout.dev/layouts/cluster/" target="_blank"><h5>Cluster</h5></a>
<Cluster>
  <ul style="list-style: none">
    {#each [...Array(30).keys()] as i}
      <li style="border:solid black 1px"><p>{loremIpsum({ count: 1, units: 'words' })}</p></li>
    {/each}
  </ul>
</Cluster>
