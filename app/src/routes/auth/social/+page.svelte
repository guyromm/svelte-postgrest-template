<script>
  import { browser } from '$app/environment'; 
  import Auth from '../../../components/Auth.svelte';
  import { goto } from '$app/navigation';
  import {insert,DB,hdrs} from '../../../../../common/postgrest.js'
  import { page } from '$app/stores';  
  const l = console.log
  
  async function handleCredentialResponse(response) {
    // Save the Google provided token as a cookie
    document.cookie = `google_token=${response.credential};path=/;max-age=3600`;
    // Submit the token to the PostgREST backend
      const pth = '/rpc/social';
      const lurl = DB + (import.meta.env.VITE_POSTGREST_PATH_AS_ARG?'?_path='+encodeURIComponent(pth):pth)
    let authResponse = await fetch(lurl, {
      method: 'POST',
      headers: hdrs,
      body: JSON.stringify({ google_token:response.credential
			   })
    })
    const bd = document.getElementById('buttonDiv');
    l('bd',bd)
    if (authResponse.status===200) {
      const siteNativeToken = await authResponse.json();
      // Save the site-native JWT token as a cookie
      document.cookie = `auth=${siteNativeToken.token};path=/;max-age=3600`;
      bd.setAttribute('data-loggedin', 'true')
      const redir = $page.url.searchParams.get('redir');
      if (redir) goto(redir)
    } else {
      console.error('Authentication failed:', authResponse.status);
      bd.setAttribute('data-loggedin', 'false')      
      l('authResponse',authResponse);
    }
  }



  let startGoogleSignIn;
  
  if (browser)
  {

    if (browser) {
      window.handleCredentialResponse = handleCredentialResponse;
      startGoogleSignIn = window.startGoogleSignIn = function() {
	google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse
	});
	google.accounts.id.renderButton(
          document.getElementById('buttonDiv'),
          { theme: 'outline', size: 'large' }
	);
	google.accounts.id.prompt();
      };
    }
  }
</script>
<svelte:head>
  {#if browser}
    <script defer
	    src="https://accounts.google.com/gsi/client"
	    onload="startGoogleSignIn()" />
  {/if}
</svelte:head>

<h3>begin auth btn</h3>
<div id="buttonDiv"></div>
<h3>end auth</h3>
<!--<Auth mode="social" />-->
