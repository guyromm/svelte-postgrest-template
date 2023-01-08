import { sveltekit } from '@sveltejs/kit/vite';

const l = console.log;
l('process.env?')
l(process.env.HMR_PROTO)
/** @type {import('vite').UserConfig} */
const config = {
  plugins: [sveltekit()],
      server: {
        hmr: {
          protocol: process.env.HMR_PROTO || 'ws',
          port: process.env.HMR_PORT || process.env.APP_PORT
        }
      }  
};

export default config;
