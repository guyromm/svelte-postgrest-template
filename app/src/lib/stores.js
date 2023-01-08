import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getCookie, getAuthData } from '../../../common/postgrest';
export const authDataStore = writable(0);
const l = console.log;
export const parseToken = () => {
  const token = browser && getCookie();
  //l('token=',token,'pb',browser);
  let no;
  try {
    const add = token && getAuthData(token);
    const ad = add && add.auth_decoded;
    no = ad && { ...ad, exp: add.exp, is_expired: add.is_expired, token };
  } catch (err) {
    no = {};
  }
  authDataStore.set(no);
};
