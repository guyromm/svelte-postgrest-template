import 'dotenv/config.js'
import archiver from 'archiver'
import pg from 'pg'
import sirv from 'sirv'
import polka from 'polka'
import compression from 'compression'
import Busboy from 'busboy'
import path from 'path'
import fs, { createReadStream } from 'fs'
import { Server } from 'socket.io' // socketIo
import http from 'http'
import Cors from 'cors'

const { NODE_ENV } = process.env
const dev = NODE_ENV === 'development'
const l = console.log


const cors = { origin: '*', 'Access-Control-Allow-Origin': '*' } // FIXME!

let isConnected = false
const client = new pg.Client(process.env.PGDSN)
l('connstr is', process.env.DBURI)
const server = http.createServer()

async function getAuthUser(req) {
  //validate
  let token
  if (req.query.token) {
    token = req.query.token
  } else if (req.headers.authorization) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.headers.cookie)
    token = Object.fromEntries(
      req.headers.cookie.split('; ').map((c) => c.split('='))
    ).auth
  else {
    return null
  }

  //l('validating token',token);
  let vres = await client.query('select (verify_token($1)).*', [token])
  let { header, payload, valid } = vres.rows[0]
  //l('validate returned',header,payload,valid);
  if (valid !== true) {
    return null
  }
  let user = payload.email
  return user
}

async function deny(res) {
  res.writeHead(403)
  return res.end()
}
async function notfound(res) {
  res.writeHead(404)
  return res.end()
}

const P = '/server' //prefix



polka({ server }) // You can also use Express
  .use(
    Cors(cors),
    compression({ threshold: 0 }),
    sirv('../app/static', { dev })
  )
  //.use('/app',proxy) // proxy is disabled in favor of standalone servers
  .listen(process.env.SERVER_PORT, (err) => {
    if (err) console.log('error', err)
  })

// helper func to figure out if client is authorized for
// action/resource access
async function isAuthorized(o, user) {
    let rt = true; // FIXME!
    l('isAuthorized',o,user,'=>',rt);
    return rt
}

async function pgconn() {
    if (!isConnected) {
	l('pgconn connecting.')
	isConnected = true
	await client.connect()

	for (let listen of listens)
	{
	    l('listening on',listen);
	    var query = await client.query(`LISTEN ${listen}`)
	}

	client.on('notification', async function (title) {
	    l('NOTIFICATION', title)
	    let o = JSON.parse(title.payload)
	    for (let [sockid, socket] of Object.entries(sockets)) {
		//l('working socket',sockid,'for possible authorization to notify',o.owner_id,'regarding',o.id);
		const ia = await isAuthorized(o, socketUsers[socket.id]);
		l('ia=',ia,!!ia);
		if (ia) {
		    l(
			'notification',
			title.channel,
			title.payload,
			'=>',
			socketUsers[socket.id]
		    )
		    socket.emit('update', { message: title })
		}
	    }
	})
    }
    //else l('pgconn ALREADY CONNECTED');
}
const io = new Server(server, { cors })

// pg channels to listen on for events to pass on to connected clients
const listens = [
 // INSERT LISTENED CHANNELS LIST HERE
]
let sockets = {}
let socketUsers = {}
io.on('connection', async function (socket) {
    //const token = Object.keys(socket.handshake.query)[0];
    let cookies = Object.fromEntries(
	socket.handshake.headers.cookie
	    ? socket.handshake.headers.cookie
            .split('; ')
            .map((x) => (x ? x.split('=') : [null, null]))
	    : []
    )
    const token =
	  cookies.auth || (socket.handshake.auth && socket.handshake.auth.token)
    //l('socket',socket.id,'connected with token',token);
    if (!token || token.length < 10) return socket.disconnect()
    //console.log('connected with token',token)
    pgconn()
    try {
	let vres = await client.query('select (verify_token($1)).*', [token])
	//l('vres',vres);
	let { header, payload, valid } = vres.rows[0]
	//l('validate returned',header,payload,valid);
	if (valid !== true) throw new Error('invalid token')
	let user = payload.email
	l('connected socketio user', user)
	socket.on('disconnect', () => {
	    l('socket', socket.id, 'disconnecting')
	    delete sockets[socket.id]
	    delete socketUsers[socket.id]
	})
	sockets[socket.id] = socket
	socketUsers[socket.id] = user
    } catch (e) {
	l('error authenticating.', token, ':', e)
	socket.disconnect()
    }
})
