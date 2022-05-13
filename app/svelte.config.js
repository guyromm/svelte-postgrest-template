// argh: https://stackoverflow.com/questions/67245743/config-kit-adapter-should-be-an-object-with-an-adapt-method
import adapter from '@sveltejs/adapter-static';
//import adapter from '@sveltejs/adapter-node';
/** @type {import('@sveltejs/kit').Config} */
const l = console.log;

const config = {
  kit: {
    // hydrate the <div id="svelte"> element in src/app.html
    /*target: '#svelte',*/
    paths: { base: "/" },
    trailingSlash:'ignore',
    prerender:{default:true},
    adapter: adapter(),
    //ssr:true,
    paths: {base:''},
	  adapter: adapter({
	    			pages: 'build',
			assets: 'build',
			fallback: null
	  }),
    vite: {
      server: {
        hmr: {
          protocol: process.env.HMR_PROTO || 'ws',
          port: process.env.HMR_PORT || process.env.APP_PORT
        }
      }
    }
  }
};

export default config;
