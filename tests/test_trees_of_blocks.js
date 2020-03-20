const path = require("path")
const requirejs = require('requirejs')

requirejs.config({
    baseUrl: path.join(__dirname, '..', ),
    nodeRequire: require
})

requirejs(['lib/util/testing', 'lib/tokens', 'lib/blocks'], function(TESTING, T, B) {

  function process(lines) {
    return Array.from(B.trees_of_blocks(B.blocks(T.tokens(lines.join('\n')))))
  }

  function test(name, lines, expected) {
    TESTING.test(name, lines, process, expected)
  }
  
  console.log('# Trees of blocks')
  console.log()
  
  test('0', [
    'Once upon a midnight dreary,',
    'while I pondered, weak and weary,'
  ], [
    { level: 0, __tokens: [
      'Once upon a midnight dreary,',
      'while I pondered, weak and weary,'
    ] }
  ])
  
  test('0, 0', [
    'Once upon a midnight dreary,',
    '',
    'while I pondered, weak and weary,'
  ], [
    { level: 0, __tokens: [ 'Once upon a midnight dreary,' ] },
    { level: 0, __tokens: [ 'while I pondered, weak and weary,' ] },
  ])
  
  test('0 / (2 / 4) (2, 4*)', [
    'Once upon a midnight dreary,',
    '  while I pondered,',
    '    weak and weary,',
    '  Over many a quaint',
    '    and curious volume',
    '    of forgotten lore'
  ], [
    { level: 0, __tokens: ['Once upon a midnight dreary,'], children: [
      { level: 2, __tokens: ['while I pondered,'], children: [
        { level: 4, __tokens: ['weak and weary,'] }
      ] },
      { level: 2, __tokens: ['Over many a quaint'], children: [
        { level: 4, __tokens: [
          'and curious volume',
          'of forgotten lore'
        ] }
      ] },
    ] }
  ])

  console.log()
  
})
