const child_process = require("child_process")
const fs = require("fs")
const tmp = require("tmp")
const decamelize = require("decamelize")
const path = require("path")
const bent = require("bent")

const getJSON = bent("json")
const l = (...a) => console.log(process.env.REV,'PG',...a);

module.exports.startServer = async (config) => {
    l('in startServer; config=',config);
    let configPath
    let serverPort
    let connectedToDB=false;
    
    if (typeof config === "string") {
	l('config is a string, attempting to extract my port');
	configPath = config
	const configContent = fs.readFileSync(configPath).toString()
	serverPort = parseInt(/^server-port=(.*)$/.match(configContent))
    } else {
	l('config is an object or is empty? generating from the object');
	serverPort = config.serverPort
	const postgrestConfigContent = `${Object.entries(config)
      .map(([k, v]) => `${decamelize(k, "-")}="${v}"`)
      .join("\n")}`
	configPath = tmp.tmpNameSync() + ".conf"
	l('generating postgrest config:',postgrestConfigContent);
	fs.writeFileSync(configPath, postgrestConfigContent)
    }
    l('spawning process');
    connectedToDB=false;
    const proc = child_process.spawn(
	path.resolve(__dirname, "postgrest"),
	[configPath],
	{
	    shell: true,
	}
    )
    l('proc spawned');
    proc.stdout.on("data", (data) => {
	l(`stdout: ${data}`)
	if (data.includes('Connection successful'))
	    connectedToDB=true;
    })

    proc.stderr.on("data", (data) => {
	l(`stderr: ${data}`)
    })

    let isClosed = false
    proc.on("close", (code) => {
	l('closed');
	isClosed = true
    })

    await new Promise((resolve, reject) => {
	const processCloseTimeout = setTimeout(() => {
	    if (isClosed) {
		l('did not start projerly.');
		reject("Postgrest didn't start properly")
	    } else {
	    	l('did not respond.');
		reject(`Postgrest didn't respond`)
		proc.kill("SIGINT")
	    }
	}, 10000)

	async function checkIfPostgrestRunning() {
	    //l(`is running at http://localhost:${serverPort}?`);
	    if (!connectedToDB) {
		//l('no point checking connectivity while not connected to db.');
		return setTimeout(checkIfPostgrestRunning, 25);
	    }
	    const result = await getJSON(`http://localhost:${serverPort}`).catch(
		() => null
	    )
	    //l('is running res=',result);
	    if (result) {
		l('IS RUNNING!');
		clearTimeout(processCloseTimeout)
		resolve()
	    } else {
		setTimeout(checkIfPostgrestRunning, 200)
	    }
	}
	checkIfPostgrestRunning()
    })

    return {
	proc,
	stop: async () => {
	    proc.kill("SIGINT")
	},
    }
}
