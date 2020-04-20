import fetch from 'node-fetch';
import jwt_decode from 'jwt-decode';
import qs from 'qs';

const l = console.log;

export const isnode = () => ((typeof process !== 'undefined') && process.release && (process.release.name === 'node'));

export const DB = process.env.POSTGREST_BASE_URI;

export const hdrs = {'Content-Type':'application/json'};

export async function F() {
  return (!isnode()?fetch:(await import('node-fetch')).default);
}
export async function login(login,pass,mode='login',validation_info=null) {
    let payload={};
    let h = {...hdrs};
    if (mode==='refresh')
	h=await getHeaders();
    else
	payload = {em:login,
		   ps:pass,
		  };
    if (validation_info) payload.vinfo=validation_info;
    let f = await F();
    //l('attempting to',mode,'with payload',payload);
    const furl = DB+'/rpc/'+mode;
    let res = await f(furl,
		      {method:'POST',
		       headers:h,
		       body:JSON.stringify(payload)});
    let txt,json;
    try {
	txt = await res.text();
	json = JSON.parse(txt);
	//l(furl,payload,'response:',json);
	if (json.code) throw new Error('could not login');
	if (!json.length===1) throw new Error('wrong length returned by login response.');
    } catch (err) {
	l('error obtaining json from res',err);
	l('login error is',txt);
	throw err;
    }  
    return json[0];
}
export async function getHeaders() {
    let cookie;
    if ((typeof process !== 'undefined') && process.env.jwt_token)
    {
        //l('GOT a token biatch!');
        cookie = process.env.jwt_token;
        //l('obtained cookie',cookie,'from process.env.jwt_token');
    }
    if ((typeof process !== 'undefined') &&
	!process.env.jwt_token &&
	process.env.jwt_login &&
	process.env.jwt_pass)
    {
      let json = await login(process.env.jwt_login,
			     process.env.jwt_pass);
      if (json && json.token)
	process.env.jwt_token = cookie = json.token;
    }
    else if (isnode() && !process.env.jwt_token)
    {
        l('process:',process);
        throw Error('NO AUTH (process.env.jwt_token) in cli invocation.');
    }
    else if (!isnode())
    {
        //l('getting from cookie!');
        cookie = getCookie('auth');
        //l('gotten cookie',cookie);
    }
    if (cookie)
    {
        //throw 'getting auth data?';
        let gad = getAuthData(cookie);
        //l('getAuthData=',gad);
        if (gad.is_expired && document.cookie)
        {
	    document.cookie='auth=';
	    return getHeaders();
        }
    }
    if (cookie)
        return {...hdrs,'Authorization':'Bearer '+cookie};
    else if (process.env.jwt_token)
        return {...hdrs,
            'Authorization':'Bearer '+process.env.jwt_token};
    else if (typeof document !== 'undefined' &&
	     document &&
	     !window.location.pathname.startsWith('/auth'))
    {
        let rdirt='/auth?redir='+encodeURIComponent(window.location.href);
        //l('cookie=',cookie);
        //throw Error('redirecting to '+rdirt);
        window.location.href=rdirt
    }
    else
        return hdrs;

}
export function getCookie(name='auth') {
    const rt = Object.fromEntries(document.cookie.split('; ').map(x=>x.split('=')).filter(x=>x[1]))[name];
    //l('getCookie =>',rt);
    return rt;
}
export function getAuthData(tok) {
    let rt = {};
    if (!tok)
    {
        tok = getCookie('auth');
        //l('gotten token',tok);
    }
    if (!tok)
    {
        rt.loginForm=true;
    }
    else if (tok)
    {
        if (typeof tok === undefined) throw 'bad token!';
        rt.auth=tok;
        rt.auth_decoded = jwt_decode(tok);
	//l('jwt_decode',tok,'=>',rt.auth_decoded);
        let now = new Date();
        rt.exp = new Date(rt.auth_decoded.exp*1000);
        if (now>rt.exp)
	    rt.is_expired=true;
        else
	    rt.is_expired=false;
        //l('AUTH',rt.auth,rt.auth_decoded,now,exp,now>exp);
    }
    return rt;
}
export async function update(path,doc,errok,key=['id']) {
    //l('IN UPDATE',doc.parsed.scores); throw 'bye';
    if (typeof key!=='object') throw 'wrong key type in update';
    //l('updating',path,doc[xokey]);throw 'bye';
    let str = JSON.stringify(doc);
    let keys = Object.fromEntries(Object.entries(doc).filter(df=>key.indexOf(df[0])!==-1).map(df=>[df[0],'eq.'+df[1]]));
    let cond = qs.stringify(keys);
    //throw 'cond='+cond;
    const updurl = DB+'/'+path+'?'+cond;
    l('PATCHing',updurl,'with',str.length);
    //l('updurl=',updurl); l('body:',doc)
    let res = await fetch(updurl,
			  {method:'PATCH',
			   headers:await getHeaders(),
			   body:str});
    //l('received response',res); throw 'bye';
    if (!errok && res.status!==204) {
        l('code',res.status);
        l('message:',res.statusText);
        for (let [k,v] of Object.entries(doc))
	{
	    let js = JSON.stringify(v);
	    if (js)
		l(k+'.length=',js.length);
	    else
		l(k,'is',typeof js);
	}
        l('attempted to update',str.length,'long doc');
        throw Error("could not update "+path+" with "+cond+" ("+res.status+"): "+res.statusText)
    }
    return res;
}
export async function upsert(path,obj,key=['id']) {
    if (typeof key!=='object') throw 'wrong key type in upsert';
    let res = await insert(path,obj,true);
    //l('upsert pt1',res);
    if (res.status===409)
    {
        let res2 = await update(path,obj,false,key);
        //l('upsert pt2',res2);
        return res2;
    }
    else
        return res;
}
export async function insert(path,obj,errok) {
    let h = await getHeaders();
    //l('using headers',h);
    let res = await fetch(DB+'/'+path,
        {method:'POST',
            headers:h,
            body:JSON.stringify(obj)});
    //l('insert returned',res);
    if (!errok && res.status!==204 && res.status!==201)
    {
        throw Error("bad insert response "+res.status+": "+(await res.text()));
    }
    return res;
}

export async function select(path,args) {
    if (!DB) throw new Error('DB not defined.');
    let res = await fetch(DB+'/'+path+'?'+qs.stringify(args),
			  {method:'GET',
			   headers:await getHeaders()
			  })
    let txt,json;
    try {
        txt = await res.text();
	try {
            json = JSON.parse(txt);
            if (json.code && json.message) throw new Error("select from "+path+" errored with code "+json.code+"; "+json.message);
	} catch (err) {
	    throw new Error('could not json parse the response '+txt);
	}
        return json;
    }
    catch (err) {
        l('could not parse/return response',txt);
        throw err;
    }

}
export async function selectOne(path,args,errOk=false) {
    let res = await select(path,args);
    if (!errOk && res.length!==1) { l(res); throw new Error('selection from '+path+' is not 1 in length - '+res.length); }
    if (res.length)
        return res[0];
    else
        return null;
}