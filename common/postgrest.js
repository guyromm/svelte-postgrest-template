//import fetch from 'node-fetch'
import jwt_decode from 'jwt-decode'
import qs from 'qs'

const l = console.log

export const isnode = () =>
  typeof process !== 'undefined' &&
  process.release &&
  process.release.name === 'node'

export const DB = import.meta.env.VITE_POSTGREST_BASE_URI

export const hdrs = { 'Content-Type': 'application/json' }

export async function F() {
  return fetch; 
  //return !isnode() ? fetch : (await import('node-fetch')).default
}

export async function login(
  login,
  pass,
  mode = 'login',
  validation_info = null
) {
  let payload = {}
  let h = { ...hdrs }
  if (mode === 'refresh') h = await getHeaders()
  else payload = { em: login, ps: pass }
  if (validation_info) payload.vinfo = validation_info
  let f = await F()
  //l('attempting to',mode,'with payload',payload);
  const pth = '/rpc/' + mode
  const furl =
    DB +
    (import.meta.env.VITE_POSTGREST_PATH_AS_ARG
      ? '?_path=' + encodeURIComponent(pth)
      : pth)
  let res = await f(furl, {
    method: 'POST',
    headers: h,
    body: JSON.stringify(payload),
  })
  let txt, json
  try {
    txt = await res.text()
    json = JSON.parse(txt)
    //l(furl,payload,'response:',json);
    if (json.code) throw new Error('could not login')
    if (!json.length === 1)
      throw new Error('wrong length returned by login response.')
  } catch (err) {
    l('error obtaining json from res', err)
    l('login error is', txt)
    //throw err;
    let cause =
      txt && txt.includes('already exists') ? 'user exists' : 'unknown'
    return { status: 'error', error: err, cause, json, txt }
  }
  return { status: 'ok', result: json[0] }
  //return json[0];
}

function redirToAuth() {
  if (isnode()) throw new Error('authentication error')
  let rdirt = '/auth/login?redir=' + encodeURIComponent(window.location.href)
  //l('about to redir to',rdirt,'with backredir being',window.location.href);
  //throw new Error(`about to redir to ${rdirt}`);
  window.location.href = rdirt
}

export async function authLogic(rta) {
  //l('ORIGINAL AUTH FUNC');
  let cookie, gad, headers
  //l('JWT TOKEN=',CFG.JWT_TOKEN);
  //l('CFG',CFG);
  //if (!CFG.JWT_TOKEN) throw new Error('no jwt token biatch');
  if (CFG.JWT_TOKEN) {
    //l('GOT a token set as global var',CFG.JWT_TOKEN);
    cookie = CFG.JWT_TOKEN
    gad = getAuthData(cookie)
  } else if (CFG.login && CFG.pass) {
      //l('got a login/password in config.');
      const pth = '/rpc/login';
      const lurl = DB + (import.meta.env.VITE_POSTGREST_PATH_AS_ARG?'?_path='+encodeURIComponent(pth):pth)
    let res = await fetch(lurl, {
      method: 'POST',
      headers: hdrs,
      body: JSON.stringify({ em: CFG.login, ps: CFG.pass }),
    })
    let txt, json
    try {
      txt = await res.text()
      json = JSON.parse(txt)
      if (json.length) {
        l('assigning a new token from json', json)
        CFG.JWT_TOKEN = cookie = json[0].token
      } else {
        l(json)
        throw new Error('could not find token in auth response')
      }
    } catch (err) {
      l('error obtaining json from res', err)
      l('login error is', txt)
      throw err
    }
  } else {
    //l('invoking redirToAuth');
    await CFG.redirToAuth()
  }

  //cookie = CFG.JWT_TOKEN;
  if (cookie) {
    //l('examining for expiry.');
    let gad = getAuthData(cookie)
    if (gad.is_expired) {
      l('expired token.', gad)
      CFG.JWT_TOKEN = undefined
      return await authLogic(rta)
    }
  }
  if (cookie) {
    //l('returning header with bearer',cookie);
    return { ...hdrs, Authorization: 'Bearer ' + cookie }
  } else if (rta) rta()
  return { cookie, gad, hdrs }
}

export async function webAuthLogic() {
  const sc = { JWT_TOKEN: getCookie('auth') }
  setConfig(sc)
  return await authLogic()
}

export async function cliAuthLogic() {
  setConfig({
    login: import.meta.env.VITE_POSTGREST_CLI_LOGIN,
    pass: import.meta.env.VITE_POSTGREST_CLI_PASS,
  })
  return await authLogic()
}

export async function isoAuthLogic() {
  if (isnode()) return await cliAuthLogic()
  else return await webAuthLogic()
}

let CFG = { authLogic: isoAuthLogic, redirToAuth }

export function setConfig(args) {
  //l('setConfig',args);
  for (const [k, v] of Object.entries(args)) CFG[k] = v
}

export function getConfig() {
  return CFG
}

export async function getHeaders() {
  const al = await CFG.authLogic(CFG.redirToAuth)
  //l('authLogic returned',al,'into',al);
  return al
}

export function getCookie(name = 'auth') {
  const rt = readCookie(name)
  //l('readCookie',name,'=>',rt);
  return rt
}

export function createCookie(name, value, days) {
  if (days) {
    var date = new Date()
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
    var expires = '; expires=' + date.toGMTString()
  } else {
    var expires = ''
  }
  document.cookie = name + '=' + value + expires + ';path=/'
}

function readCookie(name) {
  var nameEQ = name + '='
  var ca = document.cookie.split(';')
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i]
    while (c.charAt(0) == ' ') {
      c = c.substring(1, c.length)
    }
    if (c.indexOf(nameEQ) == 0) {
      return c.substring(nameEQ.length, c.length)
    }
  }
  return null
}

export function eraseCookie(name) {
  //l('current',readCookie(name));
  createCookie(name, '', -1)
}


export function getAuthData(tok) {
  let rt = {}
  if (!tok) {
    tok = getCookie('auth')
    //l('gotten token',tok);
  }
  if (!tok) {
    rt.loginForm = true
  } else if (tok) {
    if (typeof tok === undefined) throw 'bad token!'
    rt.auth = tok
    rt.auth_decoded = jwt_decode(tok)
    let now = new Date()
    rt.exp = new Date(rt.auth_decoded.exp * 1000)
    if (now > rt.exp) rt.is_expired = true
    else rt.is_expired = false
    //l('AUTH',rt.auth,rt.auth_decoded,now,exp,now>exp);
  }
  return rt
}
export async function del(path, conds = {}) {
    if (!Object.entries(conds).length) throw new Error('conds is empty.')
    let furl;
    if (import.meta.env.VITE_POSTGREST_PATH_AS_ARG)
	furl = DB + '/' + '?' + qs.stringify({...conds,_path:path});
    else
	furl = DB + '/' + path + '?' + qs.stringify(conds);
  let res = await fetch(furl, {
    method: 'DELETE',
    headers: await getHeaders(),
  })
  return res
}
export async function update(path, doc, errok, key = ['id']) {
  //l('IN UPDATE',doc.parsed.scores); throw 'bye';
  if (typeof key !== 'object') throw 'wrong key type in update'
  //l('updating',path,doc[xokey]);throw 'bye';
  let str = JSON.stringify(doc)
  let keys
  if (Array.isArray(key))
    keys = Object.fromEntries(
      Object.entries(doc)
        .filter((df) => key.indexOf(df[0]) !== -1)
        .map((df) => [df[0], 'eq.' + df[1]])
    )
  else
    keys = Object.fromEntries(
      Object.entries(key).map(([k, v]) => [k, 'eq.' + v])
    )

  //throw 'cond='+cond;
    let updurl;
    let cond;
    
    if (import.meta.env.VITE_POSTGREST_PATH_AS_ARG)
    {
	cond = qs.stringify({...keys,_path:path});
	updurl = DB + '/' + '?' + cond
    }
    else
    {
	cond = qs.stringify(keys);
	updurl = DB + '/' + path + '?' + cond;
    }
  //l('PATCHing',updurl,'with',str.length);
  //l('updurl=',updurl); l('body:',doc)
  let res = await fetch(updurl, {
    method: 'PATCH',
    headers: await getHeaders(),
    body: str,
  })
  //l('received response',res); throw 'bye';
  if (!errok && res.status !== 204) {
    l('code', res.status)
    l('message:', res.statusText)
    for (let [k, v] of Object.entries(doc)) {
      let js = JSON.stringify(v)
      if (js) l(k + '.length=', js.length)
      else l(k, 'is', typeof js)
    }
    l('attempted to update', str.length, 'long doc')
    l('res', await res.text())
    throw Error(
      'could not update ' +
        path +
        ' with ' +
        cond +
        ' (' +
        res.status +
        '): ' +
        res.statusText +
        ' with key ' +
        JSON.stringify(key) +
        ' valued ' +
        JSON.stringify(
          Object.entries(doc).filter(
            (x) => Array.isArray(key) && key.includes(x[0])
          )
        )
    )
  }
  return res
}
export async function upsert(path, obj, key = ['id']) {
  if (typeof key !== 'object') throw 'wrong key type in upsert'
  let res = await insert(path, obj, true)
  if (res.status === 409) {
    let res2 = await update(path, obj, false, key)
    //l('upsert pt2',res2);
    return res2
  } else {
    return res
  }
}
export async function insert(path, obj, errok, headersOverride = {}) {
  let h = { ...(await getHeaders()), ...headersOverride }
    //l('using headers',h);
    let furl;
    if (import.meta.env.VITE_POSTGREST_PATH_AS_ARG)
	furl = DB + '/?_path=' + encodeURIComponent(path);
    else
	furl = DB + '/' + path;
  let res = await fetch(furl, {
    method: 'POST',
    headers: {'Prefer':'return=representation',...h},
    body: JSON.stringify(obj),
  })
  //l('insert returned',res);
  if (!errok && res.status !== 204 && res.status !== 201) {
    throw Error('bad insert response ' + res.status + ': ' + (await res.text()))
  }
  return res
}

export async function select(path, args) {
  if (!DB) throw new Error('DB not defined.')
    let h = await getHeaders()
    let furl;
    if (import.meta.env.VITE_POSTGREST_PATH_AS_ARG)
	furl = DB + '/' + '?' + qs.stringify({...args,_path:path});
    else
	furl = DB + '/' + path + '?' + qs.stringify(args);
  let res = await fetch(furl, {
    method: 'GET',
    headers: h,
  })
  let txt, json
  try {
    txt = await res.text()
    try {
      json = JSON.parse(txt)
      if (json.message === 'JWT expired' || res.code === 401) {
        l('headers', h)
        let cookie = getCookie('auth')
        l('cookie is', cookie)
        let dec = jwt_decode(cookie)
        l('dec=', dec)
        throw new Error('jwt has expired wtf')
      }
      if (json.code && json.message)
        throw new Error(
          'select from ' +
            path +
            ' errored with code ' +
            json.code +
            '; ' +
            json.message
        )
    } catch (err) {
      throw new Error('could not json parse the response ' + txt)
    }
    if (json.message && json.message.startsWith('JWSError')) {
      l('JWSError:', json) //l(path,args,'=>',json);
      await CFG.redirToAuth()
    }
    return json
  } catch (err) {
    l('could not parse/return response', txt)
    throw err
  }
}
export async function selectOne(path, args, errOk = false) {
  let res = await select(path, args)
  if (!errOk && res.length !== 1) {
    l(res)
    throw new Error(
      'selection from ' + path + ' is not 1 in length - ' + res.length
    )
  }
  if (res.length) return res[0]
  else return null
}

export async function pass_reset(email) {
    let furl;
    if (import.meta.env.VITE_POSTGREST_PATH_AS_ARG)
	furl=`${DB}?_path=/rpc/pass_reset`;
    else
	furl = `${DB}/rpc/pass_reset`;
  return await fetch(furl, {
    method: 'POST',
    headers: { ...hdrs },
    body: JSON.stringify({ email }),
  })
}

export async function pass_reset_new(obj) {
    let furl;
    if (import.meta.env.VITE_POSTGREST_PATH_AS_ARG)
	furl = `${DB}?_path=/rpc/pass_reset_new`
    else
	furl = `${DB}/rpc/pass_reset_new`;
  return await fetch(furl, {
    method: 'POST',
    headers: { ...hdrs },
    body: JSON.stringify(obj),
  })
}

export async function validateByToken(token, authData) {
  l('validateByToken', token, authData)
    if (token) {
	let furl;
	if (import.meta.env.VITE_POSTGREST_PATH_AS_ARG)
	    furl = DB + '?_path=/rpc/validate_token';
	else
	    furl = DB + '/rpc/validate_token';
	    
    let f = await fetch(furl, {
      method: 'POST',
      headers: hdrs,
      body: JSON.stringify({ token }),
    })
    let j = await f.json()
    l('validateByToken j=', j)
    if (j && j.token) return { token: j.token, email: j.email }
    else return null
  }
  return null
}

export async function validationReset() {
    let h = await getHeaders()
    let furl;
    if (import.meta.env.VITE_POSTGREST_PATH_AS_ARG)
	furl = `${DB}?_path=/rpc/validation_reset`;
    else
	furl = `${DB}/rpc/validation_reset`;
  return await fetch(furl, {
    method: 'POST',
    headers: h,
  })
}
