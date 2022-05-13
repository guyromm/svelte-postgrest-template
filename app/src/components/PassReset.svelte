<script>
  import { pass_reset, pass_reset_new } from '../../../common/postgrest.js';
  import {postfix} from '../../../common/funcs.js';
  import { parseToken, authDataStore } from '../lib/stores.js';
  import { goto } from '$app/navigation';
  import {onMount} from 'svelte';
  
  const l = (...a) => console.log(...a);

  import { page } from '$app/stores';
  export let mode;

  
  let email=''
  let pass = '';
  let error = null;
  let pass_reset_success = false;
  let confirm_pass = '';
  authDataStore.subscribe((value) => {
    email = value ? value.email : email; //l('authDataStore',value);
  });
  onMount(() => {
      email = $page.url.searchParams.get('email') || '';
  })
  parseToken();

  let disabled;
  $: {
    disabled = !email || !pass;
  }

  const performPassReset = async () => {
    error = null;
    const response = await pass_reset(email);
    if (response.ok) {
      pass_reset_success = true;
    } else {
      error = (await response.json()).message;
    }
  };

  const performPassResetNew = async () => {
    error = null;
    let token = $page.query.get('token');
    if (token) {
      const response = await pass_reset_new({
        token: token,
        pass
      });
      if (response.ok) {
        pass_reset_success = true;
      } else {
        error = (await response.json()).message;
      }
    } else {
      error = 'Undefined token';
    }
  };

  let srcLogo = '/img/logo.png';
  
</script>

<div class="auth-wrapper">
  <div>
    <h4>Restore password</h4>
    <div>
      {#if mode === 'send-email'}
        {#if pass_reset_success}
          <br />
          <div>Check your email for a link to reset your password</div>
        {:else}
          <br />
          <p>
            Enter your user account's verified email address and we will send you a password reset
            link.
          </p>
          <form on:submit|preventDefault={performPassReset}>
            <input placeholder="Email" type="email" bind:value={email} required />
            {#if error}<div class="error">{error}</div>{/if}
            <button disabled={!email} type="submit" class="primary">
              Send password reset email
            </button>
          </form>
        {/if}
      {:else if mode === 'new-pass'}
        {#if pass_reset_success}
          <br />
          <div>
            Successfuly changed.
            {#if !$authDataStore}
              <a href={`/auth/login${postfix}`}>Sign in</a>
            {/if}
          </div>
        {:else}
          <form on:submit|preventDefault={performPassResetNew}>
            <input placeholder="New password" type="password" bind:value={pass} required />
            <div>
              <input
                placeholder="Confirm password"
                type="password"
                bind:value={confirm_pass}
                required
              />
              <div class="error">
                {confirm_pass && pass !== confirm_pass ? "Passwords don't match" : ''}
              </div>
            </div>
            <div>
              <button disabled={!pass || pass !== confirm_pass} type="submit" class="primary">
                Change
              </button>
              {#if error}<div class="error new-pass">{error}</div>{/if}
            </div>
          </form>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  form {
    position: relative;
    display: flex;
    flex-direction: column;
    width: max-content;
  }
  form > * {
    margin: 0.5em 0;
    position: relative;
  }
  .error {
    position: absolute;
    top: 0;
    left: 100%;
    width: 100%;
    margin: 0.5em;
  }
  .error.new-pass {
    position: relative;
    margin-left: 0;
    left: 0;
  }
  .auth-wrapper > div {
    margin: 2em;
    border-radius: 4px;
    background-color: #fff;
    background-clip: border-box;
    height: calc(100% - 4em);
  }

  /* allow for split even if no sibling height is available */
  .auth-wrapper > div:only-child {
    height: calc(100% - 4em);
  }
</style>
