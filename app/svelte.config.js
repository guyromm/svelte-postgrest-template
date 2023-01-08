import adapter from '@sveltejs/adapter-auto';
/** @type {import('@sveltejs/kit').Config} */
const l = console.log;

const config = {
  kit: {
    // hydrate the <div id="svelte"> element in src/app.html
    /*target: '#svelte',*/
    paths: { base: "/" },
    //trailingSlash:'ignore',
    //prerender:{enabled:true},
    adapter: adapter(),
    //ssr:true,
    paths: {base:''},
	  adapter: adapter({
	    			pages: 'build',
			assets: 'build',
			fallback: null
	  })
  }
};

export default config;
