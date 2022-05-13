<script>
  import { goto } from '$app/navigation';
  import { parseToken, authDataStore } from '../lib/stores';
  import { login } from '../../../common/postgrest.js';
  import {postfix} from '../../../common/funcs.js';
  import { page } from '$app/stores';
  import Switcher from '../components/layout/Switcher.svelte';
  import Box from '../components/layout/Box.svelte';

  const pagenames = [
    'home',
    'stack',
    'box',
    'bracket',
    'cluster',
    'sidebar',
    'switcher',
    'cover',
    'frame',
    'reel',
    'imposter',
    'auth'
  ];
  const pageHumanName = {
    source_data: 'Data',
    output_cfg: 'Configs',
    jobs: 'Jobs',
    tutorial: 'Tutorial',
    auth: 'Account'
  };
  const adminPages = ['users', 'settings'];
  const navpages = {};
  const l = console.log;

  let authData;
  const updauth = (value) => {
    authData = value;
    for (const page of pagenames) {
      let url;
      if (page==='home')
	url='/'
      else
	url = !authData || !authData.token
            ? `/auth/login${postfix}?redir=` + encodeURIComponent(`/${page}${postfix}`)
            : !authData.approved
            ? `/auth/unapproved-user${postfix}?redir=` + encodeURIComponent(`/${page}`)
            : !authData.validated
            ? `/auth/unvalidated-user${postfix}?redir=` + encodeURIComponent(`/${page}`)
            : '/' + page+postfix
      const label = page === 'auth'
            ? pageHumanName.auth + (authData ? ` (${authData.email})` : '')
            : pageHumanName[page]
      navpages[page] = {
        label,
        url,
      };
    }
  };

  const unsubscribe = authDataStore.subscribe(updauth);

  parseToken();

  let lastRefresh;
  const tokenRefresh = setInterval(async () => {
    let interval;
    if (authData && (!authData.validated || !authData.approved)) interval = 1;
    //unvalidated - refresh every second
    else if (authData && authData.validated) interval = 300;
    // validated - refresh every 5 min
    else if (!authData) interval = null;
    // do not refresh - we do not have a token.
    else throw new Error('unknown situation refresh-wise');
    let sinceSecs = (new Date() - lastRefresh) / 1000;
    //l('sinceSecs=',sinceSecs,'interval=',interval);
    if (interval && !authData.is_expired && (!lastRefresh || sinceSecs > interval)) {
      lastRefresh = new Date();
      const lres = await login(null, null, 'refresh');
      if (lres && lres.status === 'ok' && lres.result.token) {
        document.cookie = 'auth=' + lres.result.token + ';path=/';
        parseToken();
      }
    }
    //else { l('not refreshing, interval=',interval,'sinceSecs',sinceSecs); }
  }, 1000);

  let cursegment;
  let selected;
  $: {
    cursegment = $page.url.pathname.slice(1);
    selected = cursegment;
  }
  const handleKey = (e) => {
    let pos = pagenames.indexOf(cursegment);
    let idx = 0;
    if (e.key === 'ArrowRight') idx = pos + 1;
    else if (e.key === 'ArrowLeft') idx = pos - 1;
    else if (e.key === 'ArrowUp') idx = 0;
    else if (e.key === 'ArrowDown') idx = pagenames.length - 1;
    else idx = pos;
    if (idx >= pagenames.length) idx = 0;
    else if (idx < 0) idx = pagenames.length - 1;
    let nsegment = pagenames[idx];
    //l(e,'pos',pos,'keyup',e.key,idx,cursegment,'=>',nsegment,nsegment===cursegment);
    if (nsegment !== cursegment) goto(navpages[nsegment].url ? navpages[nsegment].url : nsegment);
  };

  $: isAdmin = !!(authData && authData.role === 'admin');
</script>

<nav>
  <Switcher>
    {#each Object.entries(navpages) as [name, opts]}
      <Box
        ><a
          aria-current={(cursegment !== undefined && cursegment === opts.url) ||
          cursegment === name ||
          (cursegment === undefined && opts.url === '.')
            ? 'page'
            : undefined}
          href={opts.url ? opts.url : name}
          {...opts.attrs}><span>{opts.label || name}</span></a
        ></Box
      >
    {/each}
  </Switcher>
</nav>

<!--<svelte:window on:keyup={handleKey}/>-->
<style>
  /* show external links in bold */
  :global(a[target='_blank']) {
    color: red;
  }
</style>
