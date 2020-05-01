const path = require("path")
const requirejs = require('requirejs')

requirejs.config({
    baseUrl: path.join(__dirname, '..', ),
    nodeRequire: require
})

const assert = require('assert')

requirejs([
  'lib/util/testing', 'lib/prsly', 'lib/tokens', 'lib/blocks', 'lib/values'
], function(TESTING, _, T, B, V) {

  function accept(lines, parser, expected) {
    let name = expected.kind + ': ' + lines[0] + (lines.length > 1 ? ' ...' : '')
  
    let tokens = Array.from(T.tokens(lines.join('\n')))
  
    let input = new _.Stream(_.from_list(tokens))
    let [stream, value] = parser(input)
  
    if (stream == _.NO_MATCH || stream.head() != _.NO_VALUE) {
      console.log('* FAIL : ' +  name)
      assert(false)
    }
    
    TESTING.test(
      name,
      value,
      (x => [x]),
      [expected]
    )
  }
  
  function reject(lines, parser) {
    let name = 'reject ' + lines[0] + (lines.length > 1 ? ' ...' : '')
  
    let tokens = Array.from(T.tokens(lines.join('\n')))
  
    let input = new _.Stream(_.from_list(tokens))
    let [stream, value] = parser(input)
  
    if (stream != _.NO_MATCH) {
      console.log('* FAIL: ' + name)
      assert(false)
    }
    
    console.log('* PASS: ' + name)
  }
  
  console.log('# Values')
  console.log()
  
  accept(['# one'        ], V.HEADING, { kind: 'heading', level: 1, __text: ['one'] })
  accept(['## two'       ], V.HEADING, { kind: 'heading', level: 2, __text: ['two'] })
  accept(['### three'    ], V.HEADING, { kind: 'heading', level: 3, __text: ['three'] })
  accept(['#### four'    ], V.HEADING, { kind: 'heading', level: 4, __text: ['four'] })
  accept(['##### five'   ], V.HEADING, { kind: 'heading', level: 5, __text: ['five'] })
  accept(['###### six'   ], V.HEADING, { kind: 'heading', level: 6, __text: ['six'] })
  accept(['####### seven'], V.HEADING, { kind: 'heading', level: 7, __text: ['seven'] })
  
  reject(['#nope'], V.HEADING)
  
  accept(['---'        ], V.HORIZONTAL_RULE, { kind: 'horizontal-rule' })
  accept(['----'       ], V.HORIZONTAL_RULE, { kind: 'horizontal-rule' })
  accept(['------'     ], V.HORIZONTAL_RULE, { kind: 'horizontal-rule' })
  accept(['--------'   ], V.HORIZONTAL_RULE, { kind: 'horizontal-rule' })
  accept(['-----------'], V.HORIZONTAL_RULE, { kind: 'horizontal-rule' })
  
  reject(['--'], V.HORIZONTAL_RULE)
  
  accept(['//// did you know'], V.COMMENT, { kind: 'comment', __text: ['did you know'] })
  
  reject(['////nope'], V.COMMENT)
  
  accept(['* apples'], V.LIST_ITEM, { kind: 'list-item', __text: ['apples'] })
  accept([
    '* apples',
    'green ones'
  ], V.LIST_ITEM, { kind: 'list-item', __text: ['apples', 'green ones'] })
  
  reject(['*nope'], V.LIST_ITEM)
  
  accept([
    '* apples',
    '* oranges'
  ], V.LIST, { kind: 'list', items: [
    { kind: 'list-item', __text: ['apples']},
    { kind: 'list-item', __text: ['oranges']},
  ] })
  
  accept([
    '* apples',
    'green ones',
    '* oranges',
    'orange ones'
  ], V.LIST, { kind: 'list', items: [
    { kind: 'list-item', __text: ['apples', 'green ones']},
    { kind: 'list-item', __text: ['oranges', 'orange ones']},
  ] })
  
  accept(['0. apples'  ], V.NUMBERED_LIST_ITEM, { kind: 'numbered-list-item', __text: ['apples'] })
  accept(['1. apples'  ], V.NUMBERED_LIST_ITEM, { kind: 'numbered-list-item', __text: ['apples'] })
  accept(['999. apples'], V.NUMBERED_LIST_ITEM, { kind: 'numbered-list-item', __text: ['apples'] })
  
  accept([
    '1. apples',
    'green ones'
  ], V.NUMBERED_LIST_ITEM, { kind: 'numbered-list-item', __text: ['apples', 'green ones'] })
  
  
  reject(['1.nope'  ], V.NUMBERED_LIST_ITEM)
  reject(['1 nope'  ], V.NUMBERED_LIST_ITEM)
  reject(['1 . nope'], V.NUMBERED_LIST_ITEM)
  
  accept([
    '1. apples',
    '2. oranges'
  ], V.NUMBERED_LIST, { kind: 'numbered-list', items: [
    { kind: 'numbered-list-item', __text: ['apples']},
    { kind: 'numbered-list-item', __text: ['oranges']},
  ] })
  
  accept([
    '1. apples',
    'green ones',
    '2. oranges',
    'orange ones'
  ], V.NUMBERED_LIST, { kind: 'numbered-list', items: [
    { kind: 'numbered-list-item', __text: ['apples', 'green ones']},
    { kind: 'numbered-list-item', __text: ['oranges', 'orange ones']},
  ] })
  
  accept(['- double: down'], V.DICTIONARY_ENTRY, { kind: 'dictionary-entry', __key: 'double', __text: ['down'] })
  accept(['- double : down'], V.DICTIONARY_ENTRY, { kind: 'dictionary-entry', __key: 'double ', __text: ['down'] })
  accept(['- double: '], V.DICTIONARY_ENTRY, { kind: 'dictionary-entry', __key: 'double', __text: [] })
  accept(['- double:'], V.DICTIONARY_ENTRY, { kind: 'dictionary-entry', __key: 'double', __text: [] })
  
  reject(['-double: down'], V.DICTIONARY_ENTRY)
  reject(['- double:down'], V.DICTIONARY_ENTRY)
  
  accept([
    '- double: down',
    '- twice: the value'
  ], V.DICTIONARY, { kind: 'dictionary', items: [
    { kind: 'dictionary-entry', __key: 'double', __text: ['down'] },
    { kind: 'dictionary-entry', __key: 'twice', __text: ['the value'] },
  ]})
  
  accept(['| one | two | three |'], V.TABLE_ROW, { kind: 'row', items: [
    { kind: 'cell', __text: ['one'] },
    { kind: 'cell', __text: ['two'] },
    { kind: 'cell', __text: ['three'] },
  ]})
  
  reject(['|one | two | three |'], V.TABLE_ROW)
  reject(['| one | two | three|'], V.TABLE_ROW)
  // TODO ? reject(['| one| two | three |'], V.TABLE_ROW)
  
  accept([
    '| one | two | three |',
    '| a | b | c |'
  ], V.TABLE, { kind: 'table', items: [
    { kind: 'row', items: [
      { kind: 'cell', __text: ['one'] },
      { kind: 'cell', __text: ['two'] },
      { kind: 'cell', __text: ['three'] },
    ]},
    { kind: 'row', items: [
      { kind: 'cell', __text: ['a'] },
      { kind: 'cell', __text: ['b'] },
      { kind: 'cell', __text: ['c'] },
    ]}
  ]})
  
  
  accept(['<< the quick brown fox >>'], V.SELECTION, { kind: 'selection', __text: [' the quick brown fox '] })
  accept(['<<jumped over the lazy dog>>'], V.SELECTION, { kind: 'selection', __text: ['jumped over the lazy dog'] })
  
  
  accept(['>'], V.VERBATIM, { kind: 'verbatim', __text: [''] })
  accept(['> '], V.VERBATIM, { kind: 'verbatim', __text: [''] })
  accept(['> the quick brown fox'], V.VERBATIM, { kind: 'verbatim', __text: ['the quick brown fox'] })
  accept([
    '> the quick brown fox',
    '> jumped over the lazy dog'
  ], V.VERBATIM, { kind: 'verbatim', __text: ['the quick brown fox', 'jumped over the lazy dog'] })
  
  reject([
    '> the quick brown fox',
    'jumped over the lazy dog'
  ], V.VERBATIM)
  
  
  accept(['`console.log("hello world")`'], V.INLINE_CODE, { kind: 'inline-code', __text: ['console.log("hello world")'] })
  
  reject(['``'], V.INLINE_CODE)
  
  
  accept(['__apples__'], V.EMPHASIS, { kind: 'emphasis', __text: ['apples'] })
  
  reject(['_apples_'], V.EMPHASIS)
  reject(['____'], V.EMPHASIS)
  
  
  accept(['**apples**'], V.STRONG, { kind: 'strong', __text: ['apples'] })
  
  reject(['*apples*'], V.STRONG)
  reject(['****'], V.STRONG)
  
  
  accept(['~~apples~~'], V.STRIKETHROUGH, { kind: 'strikethrough', __text: ['apples'] })
  
  reject(['~apples~'], V.STRIKETHROUGH)
  reject(['~~~~'], V.STRIKETHROUGH)
  
  
  accept(['___'], V.PLACEHOLDER, { kind: 'placeholder' })
  accept(['________'], V.PLACEHOLDER, { kind: 'placeholder' })
  
  reject(['__'], V.PLACEHOLDER)
  
  
  accept(['[fruit]'], V.INLINE_MACRO, { kind: 'macro', __key: 'fruit', args: [] })
  accept(['[ fruit ]'], V.INLINE_MACRO, { kind: 'macro', __key: 'fruit', args: [] })
  accept(['[ fruit apples oranges ]'], V.INLINE_MACRO, { kind: 'macro', __key: 'fruit', args: [['apples'], ['oranges']] })
  
  reject(['[]'], V.INLINE_MACRO)
  
  
  accept(['[fruit]'], V.MACRO, { kind: 'macro', __key: 'fruit', args: [] })
  accept(['[ fruit ]'], V.MACRO, { kind: 'macro', __key: 'fruit', args: [] })
  accept(['[ fruit apples oranges ]'], V.MACRO, { kind: 'macro', __key: 'fruit', args: [['apples'], ['oranges']] })
  
  reject(['[]'], V.MACRO)
  

  accept(['{{nevermore}}'], V.SLOT, { kind: 'slot', __text: ['nevermore'] })
  accept(['{{ the raven }}'], V.SLOT, { kind: 'slot', __text: ['the raven'] })

  reject(['{{}}'], V.SLOT)
  reject(['{{      }}'], V.SLOT)

  console.log()
  
})
