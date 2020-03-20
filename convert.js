const requirejs = require('requirejs')

requirejs.config({
    baseUrl: __dirname,
    nodeRequire: require
})

const fs = require('fs')
const path = require('path')
const yargs = require('yargs')

requirejs(['lib/passes/main', 'lib/passes/util'], function(PASSES, UTIL) {
  
  const VERSION = require('./package.json').version
  const TITLE = '# <<DoubleDown ' + VERSION + '>>[link https://github.com/krisds/dbldwn]'
  
  let FORMATS = ['html', 'json', 'md']
  
  let argv = yargs
    .usage('Usage: $0 --in <file> [--as <format>] --out <file>')
    .nargs('in', 1).describe('in', 'The DoubleDown file to process')
    .nargs('as', 1).describe('as', 'Output format (html, json or md; default: html)')
    .nargs('out', 1).describe('out', 'The file to be created')
    .nargs('encoding', 1).describe('encoding', 'Encoding to use; default: utf8')
    .demandOption(['in', 'out'])
    .help('h').alias('h', 'help')
    .example('$0 --in doubledown.txt --as html --out doubledown.html', 'Convert doubledown.txt to html')
    .version('version', VERSION).alias('version', 'v')
    .epilog(TITLE)
    .argv
  
  let input_path = argv.in
  let encoding = argv.encoding || 'utf8'
  let format = argv.as || 'html'
  let output_path = argv.out
  
  if(!FORMATS.includes(format)) {
      console.error('Unsupported format: ' + format)
      yargs.showHelp()
      return
  }
  
  if (!fs.existsSync(input_path)) {
      console.error('Input file not found: ' + input_path)
      return
  }

  if (!fs.lstatSync(input_path).isFile()) {
      console.error('Input is not a file: ' + input_path)
      return
  }
  
  let output_dir = path.dirname(output_path)
  if (!fs.existsSync(output_dir)) {
      console.error('Folder for output file not found: ' + output_dir)
      return
  }
    
  if (fs.existsSync(output_path) && !fs.lstatSync(output_path).isFile()) {
      console.error('Output is not a file: ' + output_path)
      return
  }
    
  console.log(TITLE)

  console.log('Reading from: ' + input_path)
  console.log('Converting to: ' + format)
  console.log('Writing to: ' + output_path)
  console.log('Using encoding: ' + encoding)

  PASSES.process(
    UTIL.context(
      process.cwd(),
      input_path,
      encoding,
      format,
      output_path
    ))
  
  console.log('Processing complete.')
})
