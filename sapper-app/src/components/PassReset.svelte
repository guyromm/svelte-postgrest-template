<script>
  import { pass_reset, pass_reset_new } from '../../../common/postgrest.js'
  import {parseToken,authDataStore} from '../lib/stores.js';
  const l = (...a) => console.log(...a);
  import {stores,goto} from '@sapper/app';
  const {page} = stores();  
  // import Button from '../Button.svelte'
  // import UserPic from '../UserPic.svelte'
  // import Input from '../Input.svelte'

  //export let page
  export let mode

  let email = $page.query.email||'';
  l('email is',email);
  let pass = ''
  let error = null
  let pass_reset_success = false
  authDataStore.subscribe(value => {
    email = value?value.email:email; //l('authDataStore',value);
  });
  parseToken();

  let disabled
  $: { disabled = !email || !pass }

  const performPassReset = async () => {
    error = null
    const response = await pass_reset(email)
    if (response.ok) {
      pass_reset_success = true
    } else {
      error = (await response.json()).message
    }
  }

  const performPassResetNew = async () => {
    error = null
    let token  = $page.query.token

    if (token) {
      const response = await pass_reset_new({
        token: token,
        pass
      })
      if (response.ok) {
        pass_reset_success = true
      } else {
        error = (await response.json()).message
      }
    } else {
      error = 'Undefined token'
    }
  }

  let srcLogo = '/img/logo.png'
</script>

<style>

</style>

<div class="auth-wrapper">
  <h4>Restore password</h4>
  <div>
    {#if error}
      <div class="error">{error}</div>
    {/if}

    {#if mode==='send-email'}
      {#if pass_reset_success }
        <div>Check your email for a link to reset your password</div>
      {:else}
        <p>Enter your user account's verified email address and we will send you a password reset link.</p>
        <form on:submit|preventDefault="{performPassReset}" class="form-col">
          <input placeholder="Email" type="email" bind:value={email} narrow required data-testid="email" />
          <button disabled={!email} type="submit">Send password reset email</button>
        </form>
      {/if}
    {:else if mode==='new-pass'}
      {#if pass_reset_success }
        <div>Successfuly changed. <a href="auth/login">Sign in</a></div>
      {:else}
        <br>
        <form on:submit|preventDefault="{performPassResetNew}" class="form-col">
          <input placeholder="New password" type="password" bind:value={pass} narrow required data-testid="pass" />
          <button disabled={!pass} type="submit">Change</button>
        </form>
      {/if}
    {/if}
  </div>
</div>
