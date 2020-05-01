const path = require("path")
const requirejs = require('requirejs')

requirejs.config({
    baseUrl: path.join(__dirname, '..', ),
    nodeRequire: require
})

const assert = require('assert')

requirejs(['lib/util/args'], function(ARGS) {

  function match(expected, actual) {
    for (let key of Object.keys(expected)) {
      if (!actual[key]) return false

      let expected_value = expected[key]
      let actual_value = actual[key]
        
      if (!Array.isArray(expected_value)) {
        if (expected[key] != actual[key]) return false
      } else if (!Array.isArray(actual_value))
        return false
      else if (expected_value.length != actual_value.length)
        return false
      else for (let i = 0; i < expected_value.length; i++)
        if (expected_value[i] != actual_value[i])
          return false
    }
    
    return true
  }

  function accept(name, definition, args, expected) {
    let actual = definition.capture(args)
    
    let matching = match(expected, actual)
    if (matching && !actual['_errors']) {
      console.log('* PASS: ' + name)
      
    } else {
      console.log('* FAIL: ' + name)
      console.log()
      if (!matching) {
        console.log('  * EXPECTED: ', expected)
        console.log('  * GOT: ', actual)
      }
      if (actual['_errors'])
        for (let e of actual['_errors'])
          console.log('  * ERROR: ', e)
      
      // TODO assert(false)
    }
  }
  
  function reject(name, definition, args, expected) {
    let actual = definition.capture(args)

    let matching = match(expected, actual)
    if (matching && actual['_errors']) {
      console.log('* PASS: ' + name)
      
    } else {
      console.log('* FAIL: ' + name)
      console.log()
      if (!matching) {
        console.log('  * EXPECTED: ', expected)
        console.log('  * GOT: ', actual)
      }
      if (actual['_errors'])
        for (let e of actual['_errors'])
          console.log('  * ERROR: ', e)
    }

    // TODO assert(false)
  }
  
  console.log('# Args')
  console.log()


  let TITLE = ARGS.define().param('title')
  
  accept('title <- $', TITLE,
    [['The', ' ', 'Raven']],
    { title: 'The Raven'}
  )
  
  reject('title <- ', TITLE, [], {})
  
  reject('title <- $ $', TITLE,
    [['The', ' ', 'Raven'], ['Edgar', ' ', 'Allan', ' ', 'Poe']],
    { title: 'The Raven' }
  )


  let TITLE_AUTHOR = ARGS.define().param('title').param('author')
  
  accept('title, author <- $ $', TITLE_AUTHOR,
    [['The', ' ', 'Raven'], ['Edgar', ' ', 'Allan', ' ', 'Poe']],
    { title: 'The Raven', author: 'Edgar Allan Poe' }
  )

  reject('title, author <- $', TITLE_AUTHOR,
    [['The', ' ', 'Raven']],
    { title: 'The Raven' }
  )

  reject('title, author <- $ $ $', TITLE_AUTHOR,
    [['The', ' ', 'Raven'], ['Edgar', ' ', 'Allan', ' ', 'Poe'], ['1845']],
    { title: 'The Raven', author: 'Edgar Allan Poe' }
  )
  
  
  let NAMES = ARGS.define().param('names', ARGS.ONE_OR_MORE)
  
  accept('names+ <- $', NAMES,
    [['Edgar']],
    { names: ['Edgar'] }
  )
  
  accept('names+ <- $ $', NAMES,
    [['Edgar'], ['Allan']],
    { names: ['Edgar', 'Allan'] }
  )
  
  accept('names+ <- $ $ $', NAMES,
    [['Edgar'], ['Allan'], ['Poe']],
    { names: ['Edgar', 'Allan', 'Poe'] }
  )
  
  reject('names+ <- ', NAMES, [], {})


  let TITLE_NAMES = ARGS.define().param('title').param('names', ARGS.ONE_OR_MORE)
  
  accept('title names+ <- $ $', TITLE_NAMES,
    [['The', ' ', 'Raven'], ['Edgar']],
    { title: 'The Raven', names: ['Edgar'] }
  )
  
  accept('title names+ <- $ $ $', TITLE_NAMES,
    [['The', ' ', 'Raven'], ['Edgar'], ['Allan']],
    { title: 'The Raven', names: ['Edgar', 'Allan'] }
  )

  accept('title names+ <- $ $ $ $', TITLE_NAMES,
    [['The', ' ', 'Raven'], ['Edgar'], ['Allan'], ['Poe']],
    { title: 'The Raven', names: ['Edgar', 'Allan', 'Poe'] }
  )

  reject('title names+ <- $', TITLE_NAMES,
    [['The', ' ', 'Raven']],
    { title: 'The Raven' }
  )

  reject('title names+ <-', TITLE_NAMES, [], {})


  let OPTIONAL_TITLE = ARGS.define().param('title', ARGS.OPTIONAL)

  accept('title? <- $', OPTIONAL_TITLE,
    [['The', ' ', 'Raven']],
    { title: 'The Raven' }
  )

  accept('title? <- ', OPTIONAL_TITLE, [], {})

  reject('title? <- $ $', OPTIONAL_TITLE,
    [['The', ' ', 'Raven'], ['Poe']],
    { title: 'The Raven' }
  )


  let QUOTH = ARGS.define().option('quoth')
  
  accept('quoth: <- quoth $', QUOTH,
    [['quoth'], ['Nevermore']],
    { quoth: 'Nevermore' }
  )
  
  reject('quoth: <- quoth $ $', QUOTH,
    [['quoth'], ['The'], ['Raven']],
    { quoth: 'The' }
  )

  reject('quoth: <- ', QUOTH, [], {})


  let OPTIONAL_QUOTH = ARGS.define().option('quoth', ARGS.OPTIONAL)
  
  accept('quoth:? <- quoth $', OPTIONAL_QUOTH,
    [['quoth'], ['Nevermore']],
    { quoth: 'Nevermore' }
  )
  
  reject('quoth:? <- quoth $ $', OPTIONAL_QUOTH,
    [['quoth'], ['The'], ['Raven']],
    { quoth: 'The' }
  )
  
  accept('quoth:? <- ', OPTIONAL_QUOTH, [], {})


  let CHARACTERS = ARGS.define().option('characters', ARGS.ONE_OR_MORE)
  
  accept('characters:+ <- characters $', CHARACTERS,
    [['characters'], ['Lenore']],
    { characters: ['Lenore'] }
  )

  accept('characters:+ <- characters $ $', CHARACTERS,
    [['characters'], ['Lenore'], ['Raven']],
    { characters: ['Lenore', 'Raven'] }
  )

  reject('characters:+ <- ', CHARACTERS, [], {})


  let FOO = ARGS.define().option('characters', [1, 3])
  
  // TODO Test range !
  

  let IMAGE_OPTIONS = ARGS.define()
    .param('src')
    .option('width', ARGS.OPTIONAL)
    .option('height', ARGS.OPTIONAL)
  
  accept('src width:? height:? <- $', IMAGE_OPTIONS,
    [['raven.png']],
    { src: 'raven.png' }
  )

  accept('src width:? height:? <- $ width $', IMAGE_OPTIONS,
    [['raven.png'], ['width'], ['30px']],
    { src: 'raven.png', width: '30px' }
  )

  accept('src width:? height:? <- $ height $', IMAGE_OPTIONS,
    [['raven.png'], ['height'], ['10%']],
    { src: 'raven.png', height: '10%' }
  )

  accept('src width:? height:? <- $ width $ height $', IMAGE_OPTIONS,
    [['raven.png'], ['width'], ['30px'], ['height'], ['10%']],
    { src: 'raven.png', width: '30px', height: '10%' }
  )

  accept('src width:? height:? <- $ height $ width $', IMAGE_OPTIONS,
    [['raven.png'], ['height'], ['10%'], ['width'], ['30px']],
    { src: 'raven.png', width: '30px', height: '10%' }
  )
  
  
  let CITE_OPTIONS = ARGS.define()
    .param('kind', ARGS.ONE, ARGS.choice('book', 'poem'))
    .param('key')

  accept('kind name <- $ $', CITE_OPTIONS,
    [['poem'], ['Raven']],
    { kind: 'poem', key: 'Raven' }
  )

  accept('kind name <- $ $', CITE_OPTIONS,
    [['book'], ['Raven']],
    { kind: 'book', key: 'Raven' }
  )

  reject('kind name <- ! $', CITE_OPTIONS,
    [['cookie'], ['Raven']],
    { }
  )

  let SEE_OPTIONS = ARGS.define()
    .param('key')
    .param('page', ARGS.OPTIONAL, ARGS.matching(/^p\.\d+$/))
  
  accept('key page? <- $', SEE_OPTIONS,
    [['Raven']],
    { key: 'Raven' }
  )

  accept('key page? <- $ $', SEE_OPTIONS,
    [['Raven'], ['p.42']],
    { key: 'Raven', page: 'p.42' }
  )

  reject('key page? <- $ !', SEE_OPTIONS,
    [['Raven'], ['fourty two']],
    { key: 'Raven' }
  )


  console.log()
})
