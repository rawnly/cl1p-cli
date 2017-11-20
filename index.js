#! /usr/bin/env node

const clear = require('clear')
const fs = require('fs')
const chalk = require('chalk')
const Meow = require('meow')
const request = require('request')
const got = require('got')
const Ora = require('ora')

const cli = new Meow(chalk`
	{bold Usage}
	{green $} cl1p [text] --name <name>

	{bold Options}
	{yellow -n --name} {gray <name>}			{dim # Cl1p name (cl1p.net/:name)}
	{yellow -f --file} {gray <path>}			{dim # Get clip content from file}
	{yellow --lifetime} {gray <time>}			{dim # Destroy the clip after given ms}
`, {
    alias: {
      n: 'name',
      h: 'help',
      V: 'version',
      f: 'file'
    }
  })

const spinner = new Ora('Creating a new clipboard...')

async function client (inputs, {name, file, lifetime} = {}) {
  function throwError (message, exitCode = 0) {
    clear()
    console.log()
    console.log(chalk`{bold {yellow ERROR:}} {red ${message}}`)
    console.log()
    cli.showHelp()
    process.exit(exitCode)
  }

  let _path = {
    url: 'https://cl1p.net'
  }

  if (!name) {
    throwError('Clip name is required!')
    process.exit(0)
  }

  _path.name = name

  if (lifetime) {
    _path.lifetime = lifetime
  }

  if (file && !inputs.length) {
    _path.content = fs.readFileSync(file, 'utf8')
  } else if (!file && inputs.length) {
    _path.content = inputs.join(' ')
  } else {
    throwError('Content not defined')
  }

  _path.url = `${_path.url}/${_path.name}`

  spinner.start()
  request({
    url: _path.url,
    method: 'POST',
    form: {
      content: _path.content
    },
    headers: {
      'User-Agent': 'Super Agent/0.0.1',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }, (err, res, body) => {
    if (err) {
      throw new Error(err)
    }
    spinner.succeed()

    console.log()
    console.log(`SHARE NOW: ${_path.url}`)
    console.log()

    if (lifetime) {
      let seconds = lifetime / 1000
      let passedSeconds = 0
      console.log(`Deleting in.. ${seconds}s`)
      const timer = setInterval(() => {
        if (passedSeconds < seconds) {
          passedSeconds++
          seconds = seconds - passedSeconds
          console.log(`Deleting in.. ${seconds}s`)
        } else {
          clearInterval(timer)
        }
      }, 1000)

      setTimeout(() => {
        got(_path.url).then(({body}) => {
          console.log('Destroyed!')
        })
      }, lifetime)
    }
  })
}

client(cli.input, cli.flags)
