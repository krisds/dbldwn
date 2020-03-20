const path = require("path")
const requirejs = require('requirejs')

requirejs.config({
    baseUrl: path.join(__dirname, '..', ),
    nodeRequire: require
})

const assert = require('assert')

requirejs(['lib/tokens', 'lib/models/ddm'], function(T, DDM) {

  let WS = T.WHITESPACE_TOKEN
  let EOLN = T.END_OF_LINE_TOKEN
  let NUM = T.NUMERIC_TOKEN
  let ALPHA = T.ALPHABETIC_TOKEN
  let CHAR = T.CHARACTER_TOKEN
  let ESC = T.ESCAPED_TOKEN
  
  function find_difference(list_a, list_b) {
    for (let i = 0; i < Math.min(list_a.length, list_b.length); i++)
      for (let n = 0; n < 2; n++)
        if (list_a[i][n] != list_b[i][n])
          return i
  
    if (list_a.length != list_b.length)
      return Math.min(list_a.length, list_b.length)
    
    return -1
  }
  
  function test(lines, expected) {
    let name = lines[0] + (lines.length > 1 ? ' ...' : '')
    let tokens = Array.from(T.tokens(lines.join('\n')))
    
    for (let t of tokens) assert (DDM.is_token(t))
    
    let actual = tokens.map(t => [t.kind, t.data])
    
    let diff = find_difference(expected, actual)
    
    if (diff < 0) {
      console.log('* PASS: ' +  name)
    }
    else {
      console.log('* FAIL: ' +  name)
      console.log('  * DIFF AT: ', diff)
      console.log('  * EXPECTED: ', expected[diff])
      console.log('  * GOT: ', actual[diff])
    }
  
    assert(diff < 0)
  }
  
  console.log('# Tokens')
  console.log()
  
  test([
    'Nevermore'
  ], [
    [ALPHA, 'Nevermore']
  ])
  
  test([
    'The Raven'
  ], [
    [ALPHA, 'The'], [WS, ' '], [ALPHA, 'Raven']
  ])
  
  test([
    '- on pi: Really, it\'s 3.14159 26535 89793 23846 26433 83279 50288 41971 69399 37510... and so on.'
  ], [
    [CHAR, '-'], [WS, ' '], [ALPHA, 'on'], [WS, ' '], [ALPHA, 'pi'], [CHAR, ':'], [WS, ' '],
    [ALPHA, 'Really'], [CHAR, ','], [WS, ' '], [ALPHA, 'it'], [CHAR, '\''], [ALPHA, 's'], [WS, ' '],
    [NUM, '3'], [CHAR, '.'], [NUM, '14159'], [WS, ' '], [NUM, '26535'], [WS, ' '],
    [NUM, '89793'], [WS, ' '], [NUM, '23846'], [WS, ' '], [NUM, '26433'], [WS, ' '],
    [NUM, '83279'], [WS, ' '], [NUM, '50288'], [WS, ' '], [NUM, '41971'], [WS, ' '],
    [NUM, '69399'], [WS, ' '], [NUM, '37510'], [CHAR, '.'], [CHAR, '.'], [CHAR, '.'],
    [WS, ' '], [ALPHA, 'and'], [WS, ' '], [ALPHA, 'so'], [WS, ' '], [ALPHA, 'on'], [CHAR, '.']
  ])
  
  test([
    'New', '\\n', 'lines'
  ], [
    [ALPHA, 'New'], [EOLN, '\n'], [ESC, 'n'], [EOLN, '\n'], [ALPHA, 'lines']
  ])
  
  console.log()

})