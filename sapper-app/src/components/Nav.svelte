<script>
 import { goto } from '@sapper/app';
 import {Switcher,Box} from './layout';
 import {parseToken,authDataStore} from '../lib/stores';
 import {login} from '../../../common/postgrest.js';
 export let segment;
 const pagenames = ['grid','stack','box','bracket','cluster','sidebar','switcher','cover','frame','reel','imposter','auth'];
 const navpages = {};
 const l = console.log;
 for (const page of pagenames)
     navpages[page]={};
 navpages.grid={url:'/'};
 let authData;
 const updauth = (value) => {
     authData=value;
     navpages.auth={label:'auth'+
		   (value?` (${value.email})`:'')};
 }
 const unsubscribe = authDataStore.subscribe(updauth);
 parseToken();
 let lastRefresh;
 const tokenRefresh = setInterval(async() => {
     let interval;
     if (authData && !authData.validated) interval=1; //unvalidated - refresh every second
     else if (authData && authData.validated) interval=300; // validated - refresh every 5 min
     else if (!authData) interval=null; // do not refresh - we do not have a token.
     else throw new Error('unknown situation refresh-wise');
     let sinceSecs = (new Date() - lastRefresh)/1000;
     //l('sinceSecs=',sinceSecs,'interval=',interval);
     if ((interval && !authData.is_expired) &&
	 (!lastRefresh || sinceSecs>interval)) {
	 lastRefresh = new Date();
	 const lres = await login(null,null,'refresh');
	 if (lres && lres.token)
	 {
	     document.cookie='auth='+lres.token;
	     parseToken();
	 }
     }
     //else { l('not refreshing, interval=',interval,'sinceSecs',sinceSecs); }
 },1000);


 let cursegment;
 $: {
     cursegment = (segment || 'grid');
    }
 const handleKey = (e) => {
     let pos = pagenames.indexOf(cursegment);
     let idx=0;
     if (e.key==='ArrowRight')
	 idx=pos+1;
     else if (e.key==='ArrowLeft')
	 idx=pos-1;
     else if (e.key==='ArrowUp')
	 idx=0;
     else if (e.key==='ArrowDown')
	 idx=pagenames.length-1;
     else
	 idx=pos;
     if (idx>=pagenames.length) idx=0;
     else if (idx<0) idx=pagenames.length-1;
     let nsegment=pagenames[idx];     
     //l(e,'pos',pos,'keyup',e.key,idx,cursegment,'=>',nsegment,nsegment===cursegment);
     if (nsegment!==cursegment) goto(navpages[nsegment].url?
				     navpages[nsegment].url:
				     nsegment);
     }
</script>
<!--<svelte:window on:keyup={handleKey}/>-->
<style>
/* show external links in bold */
:global(a[target="_blank"]) { color:red; }
</style>
<nav>
    <Switcher>
	{#each Object.entries(navpages) as [name,opts]}
	    <Box><a
		     aria-current={((segment!==undefined && segment===opts.url) ||
				cursegment===name ||
				(segment===undefined && opts.url==='.'))?"page":undefined}
		   href={opts.url?opts.url:name}
		   {...opts.attrs}
		><span>{opts.label || name}</span></a></Box>
	{/each}
    </Switcher>
</nav>
