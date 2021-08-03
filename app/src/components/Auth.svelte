<script>
  import { onMount } from 'svelte';
  import {stores,goto} from '@sapper/app';
  import {Switcher,Box,Stack} from '../components/layout';
  import {hdrs,DB,login,getAuthData,getCookie,createCookie,eraseCookie,validateByToken} from '../../../common/postgrest.js';
  import {parseToken,authDataStore} from '../lib/stores.js';
  import {parse} from 'qs';

  const l = console.log;
  const {page} = stores();
  const FBAPPID=process.env.FACEBOOK_APP_ID;
  const GOOGLECLIENTID=process.env.GOOGLE_CLIENT_ID;
  //dynamically imported as per https://sapper.svelte.dev/docs#Making_a_component_SSR_compatible :
  let GoogleAuth
  let FacebookAuth;

  /* email token validation vars */
  let token = $page.query.token;
  let tokenValid=false;
  let thankYou=false;
  let redir = $page.query.redir;
  let authToken;
  
  onMount(async () => {
    const module = await import('@beyonk/svelte-social-auth');
    FacebookAuth = module.FacebookAuth;
    GoogleAuth = module.GoogleAuth;
    parseToken();
    let vtok;
    if (mode==='validate')
    {
      vtok = await validateByToken(token,authData);
      authToken = vtok.token.token;
      //l('authDataStore',authDataStore);
    }
    else if (redir)
    {
      let rdArgs = parse(redir.split('?')[1]);
      if (rdArgs.validation_token)
      {
	vtok = await validateByToken(rdArgs.validation_token,authData);
	l('vtok',vtok);
	if (vtok.token)
	  authToken = vtok.token.token;
	else if (vtok.email)
	{
	  email=vtok.email;
	  error=vtok.status;
	}
	
	//l('validation resulted in',tokenValid,thankYou);
      }
    }
    if (authToken) {
      l('setting an auth cookie',authToken);
      createCookie('auth',authToken);
      parseToken();
      tokenValid=thankYou=true; // display thankyou notice without redirecting
    }
    if (redir && tokenValid)
      goto(redir);

  });
  let email=$page.query.email||'';
  let pass='';
  let error;

  let disabled;
  $: { disabled = !email || !pass; }
  $: { email = email.trim().toLowerCase(); }
  let authData;
  const unsubscribe = authDataStore.subscribe(value => authData=value);

  async function loginWorker (email,pass,mode,tok=null) {
    try {
      const lres = await login(email,pass,mode,tok);
      if (lres && lres.status==='ok')
      {
        l('setting auth to',lres.result.token,'am at',location.search);
        createCookie('auth',lres.result.token);
        parseToken();
        error=undefined;
        let search = parse(location.search.slice(1));
        if (search.redir)
        {
          l('gotta redir to',search.redir);
          goto(search.redir);
        }
      }
      else
      {
	error=`status: ${lres.status} ; ${lres.cause}`;
      }
    }
    catch (err) {
      l('caught err',err,err.message)
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
    return await loginWorker(em,randPass(),
      'register',
      {...u,
        type:'google'});
  }

  const performLogout = () => {
    eraseCookie('auth');
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

  $: resetForm="/auth/pass-reset?email="+encodeURIComponent(email);
  $: loginForm="/auth/login?email="+encodeURIComponent(email);
  $: registerForm="/auth/register?email="+encodeURIComponent(email);    
</script>

<style>
  label {
    display:block;
  }
</style>

<div class="auth-wrapper">

    <Stack>
        {#if authData && !authData.is_expired}

            <div class="auth-info">
                {#if thankYou}

                    <h4>THANK YOU FOR VALIDATING!</h4>
                {/if}
                <h4>Logged in</h4>
                <span>Role: {authData.role}</span>
                <span>Email: {authData.email}</span>
                <span>Validated: {authData.validated}</span>
                <span>Expiry: {((new Date(authData.exp)-new Date())/1000/3600).toLocaleString()}h</span>
                <span>Is expired: {authData.is_expired}</span>
                <a href={resetForm}>Reset password</a>
                <button on:click={performLogout}>Logout</button>
            </div>

        {:else if mode==='validate'}

            <h4>email validation</h4>
            {#if !token}
                <p>no valid token provided</p>
            {:else}
                {#if tokenValid}
                    <p>your token is valid! authenticating & redirecting</p>
                {:else}
                    <p>your token is either invalid or has been used. Please <a href={loginForm}>login</a> or <a href={resetForm}>reset your password.</a></p>
                {/if}
            {/if}

        {:else if mode==='login'}
            {#if error}<div class="error">{error}</div>{/if}

            <form on:submit|preventDefault={performLogin}>
                <label>
                    <span>User name / E-mail:</span>
                    <input type='text' bind:value={email} data-testid="email" />
                </label>
		
                <label>
                    <span>Password:</span>
                    <input type='password' bind:value={pass} data-testid="pass" />
                </label>
		
                <button {disabled} type="submit">Sign in</button>
            </form>
            <h5>Don't have user? <a href={registerForm}>Register now.</a>
                Forgotten your password? <a href={resetForm}>Reset it</a>
            </h5>
        {:else if mode==='register'}
            <h4>Registration</h4>
            {#if error}<Box>{error}</Box>{/if}
            <form on:submit|preventDefault={performRegistration}>
                <label>
                    <span>User name / E-mail:</span>
                    <input type='text' bind:value={email} data-testid="email" />
                </label>
                <label>
                    <span>Password:</span>
                    <input type='password' bind:value={pass} autocomplete="new-password" data-testid="pass" />
                </label>
                <button {disabled} type="submit">Register</button>
            </form>
            <h5><a href={loginForm}>Login</a></h5>
        {:else if mode==='social'}
            <h4>google sign-in</h4>
            <svelte:component
                    this={GoogleAuth}
                    clientId={GOOGLECLIENTID}
                    on:auth-success={googleAuth} />

            <svelte:component
                    this={FacebookAuth}
                    appId={FBAPPID}
                    scope='email'
                    on:auth-success={fbAuthSuccess} />
        {:else}
            <h2>not logged in?</h2>
            <h5><a href={loginForm}>Sign in</a></h5>
	    <h2>new here?</h2>
            <h5><a href={registerForm}>Register</a></h5>	    
        {/if}
    </Stack>
</div>
