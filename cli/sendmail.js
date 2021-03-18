#!/usr/bin/env node
import 'dotenv/config.js'
import nodemailer from 'nodemailer'
import commandLineArgs from 'command-line-args'
import fs from "fs";
const l = console.log;
const nmargs= {
    service: process.env.EMAIL_SERVICE,
    host: (process.env.EMAIL_HOST?process.env.EMAIL_HOST:undefined),
    port: (process.env.EMAIL_PORT?process.env.EMAIL_PORT:undefined),
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
};

const opts = commandLineArgs([
    { name: 'recipients', alias: 'r',type:String,multiple:true},
    { name: 'subject', alias: 's',type:String},    
]);
l(opts);
let stdinBuffer = fs.readFileSync(0); // STDIN_FILENO = 0
let stdinText = stdinBuffer.toString();

const smtpTransport = nodemailer.createTransport(nmargs)

smtpTransport.sendMail({from:process.env.EMAIL_USER,
			to:opts.recipients,
			subject:opts.subject,
			text:stdinText});
