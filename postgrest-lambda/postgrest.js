const child_process = require('child_process')
const fs = require('fs')
const tmp = require('tmp')
//const decamelize = require("decamelize")
const path = require('path')
const bent = require('bent')

const getJSON = bent('json')
const l = (...a) => console.log(process.env.REV, 'PG', ...a)

const handlePreserveConsecutiveUppercase = (decamelized, separator) => {
  // Lowercase all single uppercase characters. As we
  // want to preserve uppercase sequences, we cannot
  // simply lowercase the separated string at the end.
  // `data_For_USACounties` → `data_for_USACounties`
  decamelized = decamelized.replace(
    /((?<![\p{Uppercase_Letter}\d])[\p{Uppercase_Letter}\d](?![\p{Uppercase_Letter}\d]))/gu,
    ($0) => $0.toLowerCase()
  )

  // Remaining uppercase sequences will be separated from lowercase sequences.
  // `data_For_USACounties` → `data_for_USA_counties`
  return decamelized.replace(
    /(\p{Uppercase_Letter}+)(\p{Uppercase_Letter}\p{Lowercase_Letter}+)/gu,
    (_, $1, $2) => $1 + separator + $2.toLowerCase()
  )
}

function decamelize(
  text,
  { separator = '_', preserveConsecutiveUppercase = false } = {}
) {
  if (!(typeof text === 'string' && typeof separator === 'string')) {
    throw new TypeError(
      'The `text` and `separator` arguments should be of type `string`'
    )
  }

  // Checking the second character is done later on. Therefore process shorter strings here.
  if (text.length < 2) {
    return preserveConsecutiveUppercase ? text : text.toLowerCase()
  }

  const replacement = `$1${separator}$2`

  // Split lowercase sequences followed by uppercase character.
  // `dataForUSACounties` → `data_For_USACounties`
  // `myURLstring → `my_URLstring`
  const decamelized = text.replace(
    /([\p{Lowercase_Letter}\d])(\p{Uppercase_Letter})/gu,
    replacement
  )

  if (preserveConsecutiveUppercase) {
    return handlePreserveConsecutiveUppercase(decamelized, separator)
  }

  // Split multiple uppercase characters followed by one or more lowercase characters.
  // `my_URLstring` → `my_ur_lstring`
  return decamelized
    .replace(
      /(\p{Uppercase_Letter})(\p{Uppercase_Letter}\p{Lowercase_Letter}+)/gu,
      replacement
    )
    .toLowerCase()
}

module.exports.startServer = async (config) => {
  l('in startServer; config=', config)
  let configPath
  let serverPort
  let connectedToDB = false

  if (typeof config === 'string') {
    l('config is a string, attempting to extract my port')
    configPath = config
    const configContent = fs.readFileSync(configPath).toString()
    serverPort = parseInt(/^server-port=(.*)$/.match(configContent))
  } else {
    l('config is an object or is empty? generating from the object')
    serverPort = config.serverPort
    const postgrestConfigContent = `${Object.entries(config)
      .map(([k, v]) => `${decamelize(k, { separator: '-' })}="${v}"`)
      .join('\n')}`
    configPath = tmp.tmpNameSync() + '.conf'
    l('generating postgrest config:', postgrestConfigContent)
    fs.writeFileSync(configPath, postgrestConfigContent)
  }
  const pth = path.resolve(__dirname, 'postgrest')
  const args = [configPath]
  const opts = {
    shell: true,
  }
  l('spawning process', { pth, args, opts })

  connectedToDB = false
  const proc = child_process.spawn(pth, args, opts)
  l('proc spawned')
  function checkConnGood(data) {
    if (data.includes('Connection successful')) {
      connectedToDB = true
      l('CONNECTION SUCCESFUL! connectedToDB=true')
    }
  }

  proc.stdout.on('data', (data) => {
    l(`stdout: ${data}`)
    checkConnGood(data)
  })

  proc.stderr.on('data', (data) => {
    l(`stderr: ${data}`)
    checkConnGood(data)
  })

  let isClosed = false
  proc.on('close', (code) => {
    l('closed', { code })
    isClosed = true
  })

  await new Promise((resolve, reject) => {
    const processCloseTimeout = setTimeout(() => {
      if (isClosed) {
        l('did not start projerly.')
        reject("Postgrest didn't start properly")
      } else {
        l('did not respond.')
        reject(`Postgrest didn't respond`)
        proc.kill('SIGINT')
      }
    }, 20000)

    async function checkIfPostgrestRunning() {
      //l(`is running at http://localhost:${serverPort}?`);
      if (!connectedToDB) {
        //l('no point checking connectivity while not connected to db.');
        return setTimeout(checkIfPostgrestRunning, 25)
      }
      const jurl = `http://localhost:${serverPort}`
      l('checking if running', { jurl })
      const result = await getJSON(jurl).catch((err) =>
        l('caught an error', err)
      )
      //l('is running res=',result);
      if (result) {
        l('IS RUNNING!')
        clearTimeout(processCloseTimeout)
        resolve()
      } else {
        l('setting to re-check')
        setTimeout(checkIfPostgrestRunning, 200)
      }
    }
    checkIfPostgrestRunning()
  })

  return {
    proc,
    stop: async () => {
      proc.kill('SIGINT')
    },
  }
}
