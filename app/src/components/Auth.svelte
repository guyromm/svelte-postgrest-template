<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    login,
    getAuthData,
    getCookie,
    createCookie,
    eraseCookie,
    validateByToken,
    validationReset,
    pass_reset_new,
    pass_reset
  } from '../../../common/postgrest.js';
  import {postfix} from '../../../common/funcs.js';
  import { parseToken, authDataStore } from '../lib/stores.js';
  import { parse } from 'qs';

  const l = console.log;

  import { page } from '$app/stores';
  const FBAPPID = import.meta.env.VITE_FACEBOOK_APP_ID;
  const GOOGLECLIENTID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  export let mode = undefined;

  let GoogleAuth;
  let FacebookAuth;

  /* email token validation vars */
  let token;
  let tokenValid = false;
  let thankYou = false;
  let redir;
  let authToken;
  let validationProcess = false;

  if (mode === 'validate') {
    validationProcess = true;
  }

  function loadParams() {
    token = $page.url.searchParams.get('token');
    redir = $page.url.searchParams.get('redir');
    email = $page.url.searchParams.get('email') || ''
  }
  
  onMount(async () => {

    const module = await import('@beyonk/svelte-social-auth');
    FacebookAuth = module.FacebookAuth;
    GoogleAuth = module.GoogleAuth;
    parseToken();
    let user;
    if (mode === 'validate') {
      user = await validateByToken(token, authData);
      l('vtok', user);
      if (user) {
        authToken = user.token.token;
        email = user.email ? user.email : '';
        redir = '/';
      }
      //l('authDataStore',authDataStore);
    } else if (redir) {
      let rdArgs = parse(redir.split('?')[1]);
      if (rdArgs.validation_token) {
        user = await validateByToken(rdArgs.validation_token, authData);
        l('vtok', user);
        if (user && user.token) authToken = user.token;
        else if (user && user.email) {
          email = user.email;
          error = user.status;
        }
        //l('validation resulted in',tokenValid,thankYou);
      }
    }
    if (authToken) {
      l('setting an auth cookie', authToken);
      createCookie('auth', authToken);
      parseToken();
      tokenValid = thankYou = true; // display thankyou notice without redirecting
    }
    if (redir && tokenValid) goto(redir);
    validationProcess = false;
  });
  let email = ''
  let pass = '';
  let confirm_pass = '';
  let error;

  let disabled;
  $: {
    disabled = !email || !pass;
  }
  $: {
    email = email.trim().toLowerCase();
  }
  $: {
    if (authData && !authData.validated && !authData.is_expired && mode != 'validate')
      mode = 'unvalidated';
  }
  $: if (
    (mode === 'unvalidated' && authData.validated) ||
    (mode === 'unapproved' && authData.approved)
  ) {
    goto('/');
  }

  let authData;
  const unsubscribe = authDataStore.subscribe((value) => (authData = value));

  async function loginWorker(email, pass, mode, tok = null) {
    try {
      const lres = await login(email, pass, mode, tok);
      if (lres && lres.status === 'ok') {
        l('setting auth to', lres.result.token, 'am at', location.search);
        createCookie('auth', lres.result.token);
        parseToken();
        error = undefined;
        let search = parse(location.search.slice(1));
        if (search.redir) {
          l('gotta redir to', search.redir);
          goto(search.redir);
        } else {
          goto('/');
        }
      } else {
        if (lres.json.code === '23505') {
          // TODO fix the error message on the server side
          error = `User with email "${email}" already exists`;
        } else {
          error = lres.json.message;
        }
      }
    } catch (err) {
      l('caught err', err, err.message);
      error = 'exception: ' + err.toString();
    }
  }

  const performLogin = async (e, mode = 'login') => {
    return await loginWorker(email, pass, mode);
  };

  const performRegistration = async (e) => performLogin(e, 'register');

  const randPass = () => Math.random().toString(36).slice(-8);

  const googleAuth = async (e) => {
    const u = e.detail.user;
    l('detail.user=', u, Object.getOwnPropertyNames(Object.getPrototypeOf(u)));
    const em = u.getBasicProfile().getEmail();
    return await loginWorker(em, randPass(), 'register', {
      ...u,
      type: 'google'
    });
  };

  const performLogout = () => {
    eraseCookie('auth');
    l('have reset auth cookie, hopefully:', getCookie());
    parseToken();
    redir = '';
    setMode('login');
  };
  const fbAuthSuccess = async (r) => {
    l('fbAuthSuccess', r);
    const token = r.detail.accessToken;
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`
    );
    l('info obtain res:', response);
    let j = await response.json();
    const em = j.email;
    return await loginWorker(em, randPass(), 'register', {
      ...r.detail,
      type: 'facebook',
      name: j.name
    });
  };
  const setMode = (nm) => (mode = nm);

  let resetForm;
  let loginForm;
  let registerForm;

  $: resetForm = `/auth/pass-reset${postfix}?email=` + encodeURIComponent(email);
  $: loginForm = `/auth/login${postfix}?email=` + encodeURIComponent(email);
  $: registerForm = `/auth/register${postfix}?email=` + encodeURIComponent(email);
  $: if (pass || email || confirm_pass) {
    error = '';
  }

  const validationLinkHandle = async () => {
    let error = null;
    const response = await validationReset();
    if (!response.ok) {
      error = (await response.json()).message;
    }
  };
</script>

<div class="auth-wrapper">
  <div>
    {#if mode === 'validate'}
      {#if !validationProcess}
        <h4>Email validation</h4>
        {#if !token}
          <p>No valid token provided</p>
          <!--{:else if tokenValid}
          <p>Your token is valid! Authenticating & redirecting</p>-->
        {:else}
          <p>
            Your token is either invalid or has been used. Please <a href={loginForm}> login </a>
            or
            <a href={resetForm}>reset your password.</a>
          </p>
        {/if}
      {/if}
    {:else if mode === 'login'}
      <br />
      <h5>
        Don't have user? <a href={registerForm}>Register now</a>
        &nbsp;&nbsp; Forgotten your password?
        <a href={resetForm}>Reset it</a>
      </h5>
      <br />
      <div class="form-wrapper">
        {#if error}<div class="error">
            {error}
            <br />
            <a href={resetForm}>Reset password</a>
          </div>{/if}

        <form on:submit|preventDefault={performLogin}>
          <label>
            <span>Email:</span>
            <input type="email" bind:value={email} data-testid="email" />
          </label>

          <label>
            <span>Password:</span>
            <input type="password" bind:value={pass} data-testid="pass" />
          </label>

          <button {disabled} type="submit">Sign in</button>
        </form>
      </div>
    {:else if mode === 'register'}
      <br />
      <h5>
        <a href={loginForm}>Login</a>
        &nbsp;Forgotten your password?&nbsp;
        <a href={resetForm}>Reset it</a>
      </h5>
      <br />
      <h4>Registration</h4>
      <div class="form-wrapper">
        <form on:submit|preventDefault={performRegistration}>
          <label>
            <span>Email:</span>
            <input type="email" bind:value={email} autocomplete="email" />
            {#if error}<div class="error reg-error">{error}</div>{/if}
          </label>
          <label>
            <span>Password:</span>
            <input
              type="password"
              bind:value={pass}
              autocomplete="new-password"
              data-testid="pass"
            />
          </label>
          <label>
            <span>Confirm password:</span>
            <input
              type="password"
              bind:value={confirm_pass}
              required
              autocomplete="confirm-password"
            />
            <div class="error reg-error">
              {confirm_pass && pass !== confirm_pass ? "Passwords don't match" : ''}
            </div>
          </label>
          <button disabled={!email || !pass || pass !== confirm_pass} type="submit">
            Register
          </button>
        </form>
      </div>
    {:else if mode === 'unvalidated'}
      <p>
        Welcome, <b>{$authDataStore.email}</b>
        !
        <br />
        You have not yet validated your email. Please follow the link that should be in your inbox in
        order to complete validation.
        <br />
        <br />
        If you haven’t received an email from us, we can try & re-send it:
        <a href="/" on:click|preventDefault={validationLinkHandle}> resend validation link. </a>
      </p>
      <button on:click={performLogout}>Logout</button>
    {:else if mode === 'unapproved'}
      <p>
        Welcome, <b>{$authDataStore.email}</b>
        !
        <br />
        You account is on review. Please wait.
      </p>
      <button on:click={performLogout}>Logout</button>
    {:else if authData && !authData.is_expired}
      <div class="auth-info">
        {#if thankYou}
          <h4>THANK YOU FOR VALIDATING!</h4>
        {/if}
        <h4>Logged in</h4>
        <span>Role: {authData.role}</span>
        <span>Email: {authData.email}</span>
        <span>Approved: {authData.approved}</span>
        <span>Validated: {authData.validated}</span>
        <span>
          Expiry: {((new Date(authData.exp) - new Date()) / 1000 / 3600).toLocaleString()}h
        </span>
        <span>Is expired: {authData.is_expired}</span>
        <a href={resetForm}>Reset password</a>
        <button on:click={performLogout}>Logout</button>
      </div>
    {:else if mode === 'social'}
      <h4>Google sign-in</h4>
      <svelte:component this={GoogleAuth} clientId={GOOGLECLIENTID} on:auth-success={googleAuth} />

      <svelte:component
        this={FacebookAuth}
        appId={FBAPPID}
        scope="email"
        on:auth-success={fbAuthSuccess}
      />
    {:else}
      <h2>Not logged in?</h2>
      <h4><a href={loginForm}>Sign in</a></h4>
      <h2>New here?</h2>
      <h4><a href={registerForm}>Register</a></h4>
    {/if}
  </div>
</div>

<style>
  .auth-wrapper {
    margin-left: 2em;
  }
  label {
    display: block;
    margin: 0.5em 0;
  }
  label span:first-child {
    width: 16ch;
    display: inline-block;
  }
  .auth-info {
    display: flex;
    flex-direction: column;
    place-items: end;
  }
  .auth-info span,
  .auth-info a {
    display: inline-block;
    margin: 0.5em 0;
  }
  button {
    margin: 1em 0;
  }
  .error.reg-error {
    position: relative;
    float: right;
  }
  h5 a {
    font-size: 1em;
  }
  h4 a {
    font-size: 0.9em;
  }
  h2 {
    margin: 2em 0 0.5em;
  }
  p {
    padding: 2em 0;
    line-height: 1.8em;
  }
  p a {
    font-size: 1em;
  }
</style>
