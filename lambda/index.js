const dotenv = require('dotenv/config.js')
const postgrest = require('./postgrest.js')
const getPort = require('get-port')
const micro = require('micro')
const { URL } = require('url')
const fetch = require('node-fetch')
const delay = require('delay')
//const qs = require('qs');

const l = (...a) => console.log(process.env.REV, 'IDX', ...a)
let postgrestPort, postgrestUrl, server
l('dsn:', process.env.DBURI)
async function startServer() {
  l('starting server...')
  postgrestPort = await getPort()
  l('port', postgrestPort)
  server = await postgrest.startServer({
    dbUri:process.env.DBURI
    dbAnonRole: 'anon',
    dbSchema: 'public',
    serverPort: postgrestPort,
    dbPool: 2,
    jwtSecret: process.env.JWTSECRET,
  })
  postgrestUrl = `http://localhost:${postgrestPort}`
  l('started at url', postgrestUrl)
}

async function startOrResetServer() {
  l('startOrResetServer', Boolean(server))
  if (!server) {
    l('server not yet initialized, initializing...')
    await startServer()
    l({ postgrestUrl })
  } else {
    try {
      l('attempting to fetch(', postgrestUrl, ')')
      const res = await fetch(postgrestUrl)
      l('res', Object.keys(res))
      if (!(res.status >= 200 && res.status < 300)) {
        l("Couldn't connect to previous postgrest instance")
        throw new Error("Couldn't connect to previous postgrest instance")
      }
    } catch (e) {
      l('exception:', e.toString())
      l('Restarting postgrest...')
      await server.stop()
      await startServer()
    }
  }
}

module.exports = {
  handler: async (req, res) => {
    //l('in handler',Object.keys(req),'req.url=',req.url);
    //res.statusCode=200; res.body = JSON.stringify(req); return res;

    await startOrResetServer()
    //let path = req.url?req.url.replace(/^\/api/, "/"):'/';
    const qsp =
      req && req.queryStringParameters ? req.queryStringParameters : {}
    let path = qsp._path ? qsp._path : '/' // req.url?req.url.replace('testicle/','/'):'/';
    if (!path.startsWith('/')) path = '/' + path
    //let get = qs.stringify({...req.queryStringParameters,_path:undefined});
    let get = ''
    for (let [k, v] of Object.entries(qsp)) {
      if (['_path'].includes(k)) continue
      get +=
        (get.length ? '&' : '?') +
        encodeURIComponent(k) +
        '=' +
        encodeURIComponent(v)
    }
    if (get.length) path += get
    const proxyTo = `${postgrestUrl}${path}`
    l('proxying to', proxyTo)
    const proxyRes = await fetch(proxyTo, {
      method: req.requestContext.http.method,
      headers: Object.assign(
        { 'x-forwarded-host': req.headers ? req.headers.host : undefined },
        req.headers,
        { host: req.host }
      ),
      body: req.body,
      redirect: 'manual',
    })
    //l('proxy res=',proxyRes);
    res.statusCode = proxyRes.status
      res.headers = {
	  "Access-Control-Allow-Headers" : "*",
	  "Access-Control-Allow-Origin": "*",
  	  'Content-Type': 'application/json',
      }
      l('res.headers=',res.headers)
    res.isBase64Encoded = false
    l('proxy statusCode', res.statusCode)
    //l('proxy size',res.size);
    //proxyRes.body.pipe(res,{end:true});
    //await res.send(await proxyRes.text());
    //res.end();
    res.body = await proxyRes.text()
    return res
    l('done piping?')
  },
}
