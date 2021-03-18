#!/usr/bin/env node
import 'dotenv/config.js';
import fetch from 'node-fetch';
import gal from 'google-auth-library';
import pg from 'pg';
import commandLineArgs from 'command-line-args';
import createSubscriber from "pg-listen"
import {select,selectOne,update} from '../common/postgrest.js';
const l = console.log;
const {OAuth2Client} = gal;
const optionDefinitions = [
    { name:'notify',alias:'n',type:Boolean},    
    { name:'listen',alias:'l',type:Boolean},
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const chan = 'users_insert';
const tbl = 'basic_auth.users';
const subscriber = createSubscriber({ connectionString: process.env.PGDSN });
async function verify(token) {
  const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });
  const payload = ticket.getPayload();
  const userid = payload['sub'];
}
async function validate(email,{client}) {
    const ures = await client.query('update '+tbl+' set validated=now() where email=$1',[email]);    
}
async function processItem(u,{client}) {
    l('going over',u.email);
    if (u.validation_info && u.validation_info.type==='google')
    {
	try {
	    l('trying to verify',u);
	    for (let k of Object.keys(u.validation_info))
		if (u.validation_info[k].id_token)
	    {
		let vres = await verify(u.validation_info[k].id_token);
		await validate(u.email,{client});
		break;
	    }
	    
	} catch (e)
	{
	    l('google verification of',u.email,'failed:',e);
	}
    }
    else if (u.validation_info && u.validation_info.type==='facebook')
    {
	const response = await fetch("https://graph.facebook.com/me?fields=id,name,email&access_token="+u.validation_info.accessToken);
	let j = await response.json();
	l('accessToken response is',j);
	if (j.email===u.email)
	{
	    l('email',j.email,' matches, validating user');
	    await validate(u.email,{client});	    
	}
    }
    else l('unknown validation type for',u,':',u.validation_info);
}

async function run(opts) {
    l('run()');
    if (!opts.noConnect) await subscriber.connect();    
    const client = new pg.Client(process.env.PGDSN);
    await client.connect();
    const res = await client.query('SELECT * from '+tbl+' where validated is null and validation_info is not null');
    for (const u of res.rows) {
	if (opts.notify)
	{
	    l('notifying',u.email);
	    await subscriber.notify(chan,{email:u.email});
	}
	else 
	    await processItem(u,{client});

    }
    l('disconnecting.');
    await client.end();  
    l('run() out.');
}
async function listen() {
    const client = new pg.Client(process.env.PGDSN);
    await client.connect();
    
    let toRun=[];
    subscriber.notifications.on(chan, async (payload) => {
	l('users',payload);
	l('looking for ',tbl,' by',payload.email);
	const qi = await client.query('select * from '+tbl+' where email=$1',[payload.email]);
	for (const row of qi.rows)
	{
	    if (!row.validated) toRun.push(row);
	    else l(row.email,'already validated. skipping.');
	}
    });
    await subscriber.connect();
    l('connected. listening.');
    await subscriber.listenTo(chan);
    process.on("exit", () => subscriber.close())
    l('listen setup complete. running notifies for older stuff.');
    run({notify:true,noConnect:true});

    while (true) {
	if (toRun.length) l('trying to pop an item from a',toRun.length,'long queue.');
	let qi = toRun.pop();
	if (qi) await processItem(qi,{client});
	if (!toRun.length) await sleep(50);
    }
}
const opts = commandLineArgs(optionDefinitions);
if (opts.listen)
    listen(opts);
else
    run(opts);
