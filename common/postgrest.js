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

let JWT_TOKEN=null;

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
    let cookie,gad;
    if ((typeof process !== 'undefined') && JWT_TOKEN)
    {
        //l('GOT a token biatch!');
        cookie = JWT_TOKEN;
        //l('obtained cookie',cookie,'from JWT_TOKEN');
	gad = getAuthData(cookie);
    }

    if ((typeof process !== 'undefined') &&
	(gad && gad.is_expired) || 
	(!JWT_TOKEN &&
	 process.env.POSTGREST_CLI_LOGIN &&
	 process.env.POSTGREST_CLI_PASS)
       )
    {
	const lurl = DB+'/rpc/login';
        let res = await fetch(lurl,
            {method:'POST',
                headers:hdrs,
                body:JSON.stringify({em:process.env.POSTGREST_CLI_LOGIN,
				     ps:process.env.POSTGREST_CLI_PASS})});
	
        let txt,json;
        try {
	    txt = await res.text();
	    json = JSON.parse(txt);
	    JWT_TOKEN = cookie = json[0].token;
        } catch (err) {
	    l('error obtaining json from res',err);
	    l('login error is',txt);
	    throw err;
        }

    }
    else if (isnode() && !JWT_TOKEN)
    {
        l('process:',process);
        throw Error('NO AUTH (JWT_TOKEN) in cli invocation.');
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
        if (gad.is_expired &&
	    (!isnode() &&
	     (document &&
	      document.cookie)))
        {
	    document.cookie='auth=';
	    return getHeaders();
        }
    }
    if (cookie)
        return {...hdrs,'Authorization':'Bearer '+cookie};
    else if (JWT_TOKEN)
        return {...hdrs,
            'Authorization':'Bearer '+JWT_TOKEN};
    else if (typeof document !== 'undefined' &&
	     document &&
	     !window.location.pathname.startsWith('/auth'))
    {
        let rdirt='/auth/login?redir='+encodeURIComponent(window.location.href);
        //l('cookie=',cookie);
        //throw Error('redirecting to '+rdirt);
        window.location.href=rdirt
    }
    else
        return hdrs;

}
export function getCookie(name='auth') {
    const rt = Object.fromEntries(document.cookie.split('; ').map(x=>x.split('=')).filter(x=>x[1]))[name];
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
export async function del(path,conds={}) {
  if (!Object.entries(conds).length) throw new Error('conds is empty.');
  let res = await fetch(DB+'/'+path+'?'+qs.stringify(conds),
			{
			  method:'DELETE',
			  headers:await getHeaders()});
  return res;
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
    //l('PATCHing',updurl,'with',str.length);
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
        throw Error("could not update "+path+" with "+cond+" ("+res.status+"): "+res.statusText+' with key '+JSON.stringify(key)+' valued '+JSON.stringify(Object.entries(doc).filter(x=>key.includes(x[0]))));
    }
    return res;
}
export async function upsert(path,obj,key=['id']) {
    if (typeof key!=='object') throw 'wrong key type in upsert';
    let res = await insert(path,obj,true);
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
  let h = await getHeaders();
    let res = await fetch(DB+'/'+path+'?'+qs.stringify(args),
			  {method:'GET',
			   headers:h
			  })
    let txt,json;
    try {
        txt = await res.text();
	try {
          json = JSON.parse(txt);
	  if (json.message==='JWT expired' || res.code===401)
	  {
	    l('headers',h);
	    let cookie = getCookie('auth');
	    l('cookie is',cookie);
	    let dec = jwt_decode(cookie);
	    l('dec=',dec);
	    throw new Error('jwt has expired wtf');
	  }
            if (json.code && json.message) throw new Error("select from "+path+" errored with code "+json.code+"; "+json.message);
	} catch (err) {
	    throw new Error('could not json parse the response '+txt);
	}
	if (json.message && json.message.startsWith('JWSError'))
	    throw new Error(json); //l(path,args,'=>',json);
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
