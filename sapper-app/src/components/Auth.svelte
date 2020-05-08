<script>
 import { onMount } from 'svelte';
  import {goto} from '@sapper/app';
 import {Switcher,Box,Stack} from '../components/layout';
 import {login,getAuthData,getCookie} from '../../../common/postgrest.js';
 import {parseToken,authDataStore} from '../lib/stores.js';
 import {parse} from 'qs';
 const l = console.log;
 const FBAPPID=process.env.FACEBOOK_APP_ID;
 const GOOGLECLIENTID=process.env.GOOGLE_CLIENT_ID;
 //dynamically imported as per https://sapper.svelte.dev/docs#Making_a_component_SSR_compatible :
 let GoogleAuth
 let FacebookAuth;

 onMount(async () => {
     const module = await import('@beyonk/svelte-social-auth');
     FacebookAuth = module.FacebookAuth;     
     GoogleAuth = module.GoogleAuth;
 });
 let email='';
 let pass='';
 let error;
 parseToken();
 let disabled;
 $: { disabled = !email || !pass; }
 let authData;
 const unsubscribe = authDataStore.subscribe(value => authData=value);	   

 const loginWorker = async (email,pass,mode,tok=null) => {
     try {
     //l('attempting to login with',email,pass,mode,tok);
	 const lres = await login(email,pass,mode,tok);
	 //l('login returned',lres);
	 if (lres) // && lres.token)
	 {
	 l('setting document.cookie auth to',lres.token,'am at',location.search);
	     document.cookie='auth='+lres.token;
	     parseToken();
	     error=undefined;
	     let search = parse(location.search.slice(1));
	     if (search.redir)
	     {
	     l('gotta redir to',search.redir);
	     goto(search.redir);
	     }
	 }
	 error='could not '+mode;
	 }
     catch (err) {
	 error='exception: '+err.toString();
     }
     
 }
 const performLogin =
     async (e,mode='login') => {
	 return await loginWorker(email,pass,mode);
     }
 
 const performRegistration = async (e) => performLogin(e,'register');

 const randPass = () => Math.random().toString(36).slice(-8);
 
 const googleAuth = async (e) => {
     const u = e.detail.user;
     l('detail.user=',u,Object.getOwnPropertyNames(Object.getPrototypeOf(u)));
     const em = u.getBasicProfile().getEmail();
     return await loginWorker(em,randPass(),'register',{...u,
						       type:'google'}); 
 }

function deleteCookie( name ) {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
  
 
 const performLogout = () => {
     deleteCookie('auth');
     l('have reset auth cookie, hopefully:',getCookie());
     parseToken();
 }
 const fbAuthSuccess = async (r) => {
     l('fbAuthSuccess',r);
     const token = r.detail.accessToken;
     const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`);
     l('info obtain res:',response);
     let j = await response.json();
     const em = j.email;
     return await loginWorker(em,randPass(),'register',
			      {
				  ...r.detail,
				  type:'facebook',
				  name:j.name}); 
 }
 export let mode;
 const setMode = (nm) => mode=nm;
 
</script>

<h4>authentication</h4>
{#if !authData || authData.is_expired}
<Switcher>
	{#each ['login','register','social'] as act}
	    <Box>
		<a href="/auth/{act}">{act}</a>
		<!--<button
		    disabled={mode==act}
				 on:click={()=>setMode(act)}>{act}</button>-->
	    </Box>
	{/each}
</Switcher>
{/if}
<Stack>
    {#if authData && !authData.is_expired}
	<h4>logged in</h4>
	<Box>role: {authData.role}</Box>
	<Box>email: {authData.email}</Box>
	<Box>validated: {authData.validated}</Box>	
	<Box>expiry: {((new Date(authData.exp)-new Date())/1000/3600).toLocaleString()}h</Box>
	<Box>is expired: {authData.is_expired}</Box>
	<button on:click={performLogout}>logout</button>
    {:else if mode==='login'}
	<h4>login</h4>    
	{#if error}<Box>{error}</Box>{/if}
	<form on:submit|preventDefault={performLogin}>
            <Box><label>email<input type='text' bind:value={email}/></label></Box>
    	    <Box><label>pass<input type='password' bind:value={pass}/></label></Box>
            <Box><button {disabled} on:click={performLogin}>login</button></Box>
	</form>
    {:else if mode==='register'}
	<h4>registration</h4>    
	{#if error}<Box>{error}</Box>{/if}    
	<form on:submit|preventDefault={performRegistration}>
            <Box><label>email<input type='text' bind:value={email}/></label></Box>
    	    <Box><label>pass<input type='password' bind:value={pass}/></label></Box>
            <Box><button {disabled} on:click={performLogin}>register</button></Box>
	</form>
    {:else if mode==='social'}
	<h4>google sign-in</h4>
	<svelte:component
	    this={GoogleAuth}
	    clientId={GOOGLECLIENTID}
	    on:auth-success={googleAuth}/>

	<svelte:component
	    this={FacebookAuth}
	    appId={FBAPPID}
	    scope='email'
	    on:auth-success={fbAuthSuccess}/>
    {/if}
</Stack>
