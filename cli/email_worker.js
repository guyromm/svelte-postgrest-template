#!/usr/bin/env node
import 'dotenv/config.js'
import pg from 'pg'
import commandLineArgs from 'command-line-args'
import createSubscriber from 'pg-listen'
import nodemailer from 'nodemailer'

const CHANNELS = {pass_reset:'users_pass_reset',
		  validated:'validated',
		  inserted:'users_insert',
		 };

const l = console.log
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
  if (!process.env.SITE_BASE_URI) throw new Error('no SITE_BASE_URI!');

const subscriber = createSubscriber({ connectionString: process.env.PGDSN })

const nmargs= {
    service: process.env.EMAIL_SERVICE,
    host: (process.env.EMAIL_HOST?process.env.EMAIL_HOST:undefined),
    port: (process.env.EMAIL_PORT?process.env.EMAIL_PORT:undefined),
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
};
const smtpTransport = nodemailer.createTransport(nmargs);

// this defines additional tables (resources) and their columns 
// which can be shared between users
const colTrans={
		//SRCTBL:'fkey_id',
	       };

async function processInvite(u,{client,payload}) {
  let r = payload;
  for (let [mtyp,mcol] of Object.entries(colTrans))
    if (r[mcol]!==undefined)
  {
    r.typ=mtyp;
  }
  if (!r.typ) { l(r) ; l('tried mcols',colTrans); throw new Error('processInvite: unknown typ'); }
  const col = colTrans[r.typ];
  const id = r[col];
  l('processInvite',r.typ,col,r);
  let invite_link = `${process.env.SITE_BASE_URI}/${r.typ}/${id}`;
  if (r.validation_info && r.validation_info.token && !r.validated)  //&& !r.validation_info.email_sent)
    invite_link+='?validation_token='+encodeURIComponent(r.validation_info.token);
  l('about to send email to',r.user_id,'with invite link',invite_link);
  const info = await smtpTransport.sendMail({from:process.env.EMAIL_USER,
					     to:r.user_id,
					     subject:`${process.env.APPNAME} - invitation to collaborate on ${r.typ} ${id}`,
					     html:`step inside <a href="${invite_link}">${r.typ} ${r.id}</a>`
					    });
  const updqry = `update ${r.typ}_perms set status='invited' where ${col}=$1 and user_id=$2`;
  const updargs = [id,r.user_id];
  await client.query(updqry,updargs);
  l(updqry,updargs);
  l('processInvite done',r.typ,col,id); 
}
async function processWelcome(user,{client}) {
    l('about to welcome',user.email); // return;
    const info = await smtpTransport.sendMail({from:process.env.EMAIL_USER,
					       to:user.email,
					       subject:`welcome to ${process.env.APPNAME}!`,
					       html: `<h4>You've succesfully validated!</h4>`});
    
    await client.query(`update basic_auth.users set 
validation_info=jsonb_set(
coalesce(validation_info,'{}'::jsonb),
'{welcome_sent_at}'::text[],
concat('"',to_char (now()::timestamp at time zone 'UTC', 'YYYY-MM-DDTHH24:MI:SSZ'),'"')::jsonb

) where email=$1`,[user.email]);    

    l('welcomed',user.email);
}

async function processInserted(user,{client}) {
  l('about to send validation to',user.email); // return;
  await client.query(`update basic_auth.users set 
validation_info=
jsonb_set(jsonb_set(
coalesce(validation_info,'{}'::jsonb),
'{token}'::text[],
concat('"',md5(random()::text),'"')::jsonb
),'{email_sent}','true'::jsonb) where email=$1`,[user.email]);
  let token = (await client.query("select validation_info->>'token' token from basic_auth.users where email=$1",[user.email])).rows[0].token;
  let validate_link = `${process.env.SITE_BASE_URI}/auth/validate?token=${encodeURIComponent(token)}`;
  let subject;
  subject=`${process.env.APPNAME} validation`;
  const info = await smtpTransport.sendMail({from:process.env.EMAIL_USER,
    					     to:user.email,
    					     subject,
    					     html: `<h4>please follow the following link in order to validate your email</h4>
<p><a href="${validate_link}">validate</a></p>`});

  l('welcomed',user.email);
}

async function processPasswordReset (user, { client }) {
    l('processPasswordReset:', user.email)
    const reset_pass_link = `${process.env.SITE_BASE_URI}/auth/pass-reset-new?token=${user.pass_reset_info.token}`
    const info = await smtpTransport.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'password reset',
        html: `Reset password: <a href="${reset_pass_link}">${reset_pass_link}</a>`
    })
    l('email sent', info)
    await client.query(`
        UPDATE basic_auth.users
        SET pass_reset_info=jsonb_set(pass_reset_info, '{email_sent}', 'true')
        WHERE email = $1`, [user.email]
    )

    l('processing has been finished', user.email)
}

let isSubscriberConnected=false;
async function scon(opts) {
    if (!opts.noConnect && !isSubscriberConnected) {
	l('SUBSCRIBING!');
	await subscriber.connect();
	isSubscriberConnected=true;	

    }
}
async function sclose(opts) {
    if (!opts.noConnect) {
	l('CLOSING',subscriber);
        await subscriber.close()
    }    
}
async function validation_run(opts) {
    l('validation_run');
    //scon(opts);
    const client = opts.client;
    let res;
    if (opts.user)
	res = await client.query("select * from basic_auth.users where validated is not null and validation_info->'welcome_sent_at' is null and email = $1",[opts.user]);
    else
	res = await client.query("select * from basic_auth.users where validated is not null and validation_info->'welcome_sent_at' is null");
    l('validated not welcome:',res.rows.length);
    for (const r of res.rows) {
	if (opts.notify) {
	    l('notifying: validation',r.email);
	    await subscriber.notify(CHANNELS.validated,{email:r.email});
	} else {
	    await processWelcome(r,{client});
	}
    }
}

async function inserted_run(opts) {
    l('inserted_run');
    const client = opts.client;
    let res;
    if (opts.user)
	res = await client.query("select * from basic_auth.users where validated is null and (validation_info is null or validation_info->'token' is null) and email = $1",[opts.user]);
    else
	res = await client.query("select * from basic_auth.users where validated is null and (validation_info is null or validation_info->'token' is null)");
    l('validated not welcome:',res.rows.length);
    for (const r of res.rows) {
	if (opts.notify) {
	    l('notifying: welcome',r.email);
	    await subscriber.notify(CHANNELS.inserted,{email:r.email});
	} else {
	    await processInserted(r,{client});
	}
    }
}


async function pass_reset_run (opts) {
    l('pass_reset_run()');
    //scon(opts)
    const client = opts.client;
    let res;
    if (opts.user)
	res = await client.query('SELECT * FROM basic_auth.users WHERE (pass_reset_info->>\'email_sent\')::bool IS FALSE and email = $1',[opts.user]);
    else
	res = await client.query('SELECT * FROM basic_auth.users WHERE (pass_reset_info->>\'email_sent\')::bool IS FALSE');
    
    l('email reset token present but no email sent:',res.rows.length);
    for (const r of res.rows) {
        if (opts.notify) {
            l('notifying: reset pass', r.email)
            await subscriber.notify(CHANNELS.pass_reset, { email: r.email })
        } else {
            await processPasswordReset(r, { client });
        }
    }

    //l('disconnecting.')
    //await client.end()
    //sclose(opts);

    l('pass_reset_run() out.')
}

async function share_run(opts,tbl) {
  const client = opts.client;
  const ct = colTrans[tbl];
  if (!ct) throw new Error('coltrans wtf '+tbl);
  let res;
  if (opts.user)
    res = await client.query(`select * from ${tbl}_perms sdp left outer join ${tbl} sd on sdp.${ct}=sd.id left outer join basic_auth.users u on u.email=sdp.user_id where sdp.user_id=$1 where sdp.status=$2`,[opts.user,'pending'])
  else
  {
    let qry = `select * from ${tbl}_perms sdp left outer join ${tbl} sd on sdp.${ct}=sd.id left outer join basic_auth.users u on u.email=sdp.user_id where sdp.status=$1`;
    l('share run',tbl,qry);
    res = await client.query(qry,['pending'])
  }
  
  for (const r of res.rows) {
    if (opts.notify) {
      await subscriber.notify(tbl+'_perms_insert',r);
    }
    else
      await processInvite(r,{client,payload:r});
  }
}

function validateWelcomeRow(row) {
  const rt = (row.validated && (!row.validation_info || !row.validation_info.welcome_sent_at));
  l('validateWelcomeRow',row.validated,row.validation_info,'=>',rt);
  return rt;
}

function validateInsertedRow(row) {
  const rt = (!row.validated && !row.validation_info);
  l('validateInsertedRow',row.validated,row.validation_info,'=>',rt);
  return rt;
}

function validatePassResetRow(row) {
  const rt = (row.pass_reset_info && row.pass_reset_info.email_sent === false)
  l('validatePassResetRow',row.pass_reset_info,'=>',rt);
  return rt;
}


async function insert_listen(opts) {
    let args = {chan:CHANNELS.inserted,
		validateRow:validateInsertedRow,
		processItem:processInserted,
		run_func:inserted_run};
    return await listen(args,opts);
}

async function validation_listen(opts) {
    let args = {chan:CHANNELS.validated,
		validateRow:validateWelcomeRow,
		processItem:processWelcome,
		run_func:validation_run};
    
    return await listen(args,opts);
}

async function pass_reset_listen (opts) {
    let args = {chan:CHANNELS.pass_reset,
		validateRow:validatePassResetRow,
		processItem:processPasswordReset,
		run_func:pass_reset_run};
    return await listen(args,opts);
}

async function listen({chan,validateRow,processItem,run_func},opts) {
  l('listen', chan);
  const client = opts.client;

  let toRun = []
  l('subscriber.notifications.on',chan);
  subscriber.notifications.on(chan, async (payload) => {
    l(chan,'payload:',payload);
    const result = await client.query('SELECT * FROM basic_auth.users WHERE email=$1', [payload.email])
    for (const row of result.rows) {
      //l('about to run validateRow',validateRow,'on',row);
      if (validateRow(row,payload)) toRun.push([row,payload])
      else l(row.email,'already processed for',chan,'. skipping.')
    }
  })
  //scon(opts)
  l('connected. listening.')
  await subscriber.listenTo(chan);
  process.on('exit', () => { sclose(); client.end(); } )
  l('listen setup complete. running notifies for older stuff.')

  run_func({...opts, notify: true, noConnect: true })

  while (true) {
    if (toRun.length) {
      l('trying to pop an item from a', toRun.length, 'long queue.')
      let [qi,payload] = toRun.pop();
      l('popped qi=',qi,'payload=',payload);
      if (qi) await processItem(qi, { client,payload });
    }
    if (!toRun.length) await sleep(50);
  }
}

const opts = commandLineArgs([
    { name: 'user', alias: 'u',type:String},
    { name: 'notify', alias: 'n', type: Boolean },
    { name: 'listen', alias: 'l', type: Boolean },
    { name: 'runs', alias:'r',type:String, multiple:true},
])

const runs = {pass_reset:pass_reset_run,
	      validation:validation_run,
	      users_insert:inserted_run,
	     };

const listens = {pass_reset:pass_reset_listen,
		 validation:validation_listen,
		 users_insert:insert_listen,
		};

async function run() {
  l('PGDSN',process.env.PGDSN);
    opts.client = new pg.Client(process.env.PGDSN);
    await opts.client.connect();
    await scon(opts);
    
    if (opts.listen)
    {
	for (let [runk,runf] of Object.entries(runs))
	{
	    if (!opts.runs || opts.runs.includes(runk))
	    {
		l('listen',runk);
		listens[runk](opts);
		l('listen',runk,'end');
	    }
	}
    }
    else
  {
    l('opts',Object.keys(opts));
	for (let [runk,runf] of Object.entries(runs))
	{
	    if (!opts.runs || !opts.runs.length || opts.runs.includes(runk))
	    {
		l('run',runk,'start');
		runs[runk](opts);
		l('run',runk,'end');
	    }
	}
    }
}
run();
