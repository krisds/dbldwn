const path = require("path")
const requirejs = require('requirejs')

requirejs.config({
    baseUrl: path.join(__dirname, '..', ),
    nodeRequire: require
})

requirejs([
  'lib/util/testing', 'lib/tokens', 'lib/blocks', 'lib/values'
], function(TESTING, T, B, V) {

  function process(lines) {
    return Array.from(V.trees_of_values(B.trees_of_blocks(B.blocks(T.tokens(lines.join('\n'))))))
  }

  function test(name, lines, expected) {
    TESTING.test(name, lines, process, expected)
  }
  
  console.log('# Trees of values')
  console.log()
  
  test('par', [
    'Once upon a midnight dreary,',
    'while I pondered, weak and weary,'
  ], [
    { kind: 'paragraph' }
  ])
  
  test('par par', [
    'Once upon a midnight dreary,',
    'while I pondered, weak and weary,',
    '',
    'While I nodded, nearly napping, suddenly there came a tapping,',
    'As of some one gently rapping, rapping at my chamber door.',
  ], [
    { kind: 'paragraph' },
    { kind: 'paragraph' }
  ])
  
  test('par / par', [
    'Once upon a midnight dreary,',
    'while I pondered, weak and weary,',
    '  While I nodded, nearly napping, suddenly there came a tapping,',
    '  As of some one gently rapping, rapping at my chamber door.',
  ], [
    { kind: 'paragraph', children: [
      { kind: 'paragraph' }
    ] },
  ])
  
  test('h par', [
    '# The Raven',
    '',
    'Once upon a midnight dreary, while I pondered, weak and weary,',
    'Over many a quaint and curious volume of forgotten lore',
  ], [
    { kind: 'heading', level: 1 },
    { kind: 'paragraph' }
  ])
  
  test('list', [
    '* Once upon a midnight dreary, while I pondered, weak and weary,',
    '* Over many a quaint and curious volume of forgotten lore',
    '* While I nodded, nearly napping, suddenly there came a tapping,',
    '* As of some one gently rapping, rapping at my chamber door.',
  ], [
    { kind: 'list', items: [
      { kind: 'list-item' },
      { kind: 'list-item' },
      { kind: 'list-item' },
      { kind: 'list-item' },
    ] },
  ])
  
  test('list list list list', [
    '* Once upon a midnight dreary, while I pondered, weak and weary,',
    '',
    '* Over many a quaint and curious volume of forgotten lore',
    '',
    '* While I nodded, nearly napping, suddenly there came a tapping,',
    '',
    '* As of some one gently rapping, rapping at my chamber door.',
  ], [
    { kind: 'list', items: [{ kind: 'list-item' }] },
    { kind: 'list', items: [{ kind: 'list-item' }] },
    { kind: 'list', items: [{ kind: 'list-item' }] },
    { kind: 'list', items: [{ kind: 'list-item' }] },
  ])
  
  test('numbered-list', [
    '1. Once upon a midnight dreary, while I pondered, weak and weary,',
    '2. Over many a quaint and curious volume of forgotten lore',
    '3. While I nodded, nearly napping, suddenly there came a tapping,',
    '4. As of some one gently rapping, rapping at my chamber door.',
  ], [
    { kind: 'numbered-list', items: [
      { kind: 'numbered-list-item' },
      { kind: 'numbered-list-item' },
      { kind: 'numbered-list-item' },
      { kind: 'numbered-list-item' },
    ] },
  ])
  
  test('numbered-list numbered-list numbered-list numbered-list', [
    '1. Once upon a midnight dreary, while I pondered, weak and weary,',
    '',
    '2. Over many a quaint and curious volume of forgotten lore',
    '',
    '3. While I nodded, nearly napping, suddenly there came a tapping,',
    '',
    '4. As of some one gently rapping, rapping at my chamber door.',
  ], [
    { kind: 'numbered-list', items: [{ kind: 'numbered-list-item' }] },
    { kind: 'numbered-list', items: [{ kind: 'numbered-list-item' }] },
    { kind: 'numbered-list', items: [{ kind: 'numbered-list-item' }] },
    { kind: 'numbered-list', items: [{ kind: 'numbered-list-item' }] },
  ])
  
  test('dictionary', [
    '- Once: upon a midnight dreary, while I pondered, weak and weary,',
    '- Over: many a quaint and curious volume of forgotten lore',
    '- While: I nodded, nearly napping, suddenly there came a tapping,',
    '- As: of some one gently rapping, rapping at my chamber door.',
  ], [
    { kind: 'dictionary', items: [
      { kind: 'dictionary-entry', key: ['Once']},
      { kind: 'dictionary-entry', key: ['Over']},
      { kind: 'dictionary-entry', key: ['While']},
      { kind: 'dictionary-entry', key: ['As']},
    ] },
  ])

  test('dictionary dictionary dictionary dictionary', [
    '- Once: upon a midnight dreary, while I pondered, weak and weary,',
    '',
    '- Over: many a quaint and curious volume of forgotten lore',
    '',
    '- While: I nodded, nearly napping, suddenly there came a tapping,',
    '',
    '- As: of some one gently rapping, rapping at my chamber door.',
  ], [
    { kind: 'dictionary', items: [{ kind: 'dictionary-entry', key: ['Once'] }] },
    { kind: 'dictionary', items: [{ kind: 'dictionary-entry', key: ['Over'] }] },
    { kind: 'dictionary', items: [{ kind: 'dictionary-entry', key: ['While'] }] },
    { kind: 'dictionary', items: [{ kind: 'dictionary-entry', key: ['As'] }] },
  ])

  test('(list / par) (list / par)', [
    '* Once upon a midnight dreary, while I pondered, weak and weary,',
    '        Over many a quaint and curious volume of forgotten lore',
    '* While I nodded, nearly napping, suddenly there came a tapping,',
    '      As of some one gently rapping, rapping at my chamber door.',
  ], [
    { kind: 'list', items: [
      { kind: 'list-item', children: [
        { kind: 'paragraph' },
      ] },
    ] },
    { kind: 'list', items: [
      { kind: 'list-item', children: [
        { kind: 'paragraph' },
      ] },
    ] },
  ])
  
  test('(numbered-list / par) (numbered-list / par)', [
    '1. Once upon a midnight dreary, while I pondered, weak and weary,',
    '        Over many a quaint and curious volume of forgotten lore',
    '2. While I nodded, nearly napping, suddenly there came a tapping,',
    '      As of some one gently rapping, rapping at my chamber door.',
  ], [
    { kind: 'numbered-list', items: [
      { kind: 'numbered-list-item', children: [
        { kind: 'paragraph' },
      ] },
    ] },
    { kind: 'numbered-list', items: [
      { kind: 'numbered-list-item', children: [
        { kind: 'paragraph' },
      ] },
    ] },
  ])

  test('(dictionary / par) (dictionary / par)', [
    '- Once: upon a midnight dreary, while I pondered, weak and weary,',
    '        Over many a quaint and curious volume of forgotten lore',
    '- While: I nodded, nearly napping, suddenly there came a tapping,',
    '      As of some one gently rapping, rapping at my chamber door.',
  ], [
    { kind: 'dictionary', items: [
      { kind: 'dictionary-entry', key: ['Once'], children: [
        { kind: 'paragraph' },
      ] },
    ] },
    { kind: 'dictionary', items: [
      { kind: 'dictionary-entry', key: ['While'], children: [
        { kind: 'paragraph' },
      ] },
    ] },
  ])

  test('(table / par)', [
    '| Once upon a midnight dreary, | while I pondered, weak and weary, |',
    '| Over many a quaint | and curious volume of forgotten lore |',
    '      While  I nodded, nearly napping, suddenly there came a tapping,',
    '      As of some one gently rapping, rapping at my chamber door.',
  ], [
    { kind: 'table', items: [
      { kind: 'row', items: [
        { kind: 'cell' },
        { kind: 'cell' },
      ] },
      { kind: 'row', items: [
        { kind: 'cell' },
        { kind: 'cell' },
      ] },
    ], children: [
      { kind: 'paragraph' },
    ] },
  ])

  test('(list / par par par)', [
    '* Once upon a midnight dreary, while I pondered, weak and weary,',
    '    Over many a quaint and curious volume of forgotten lore',
    '',
    '    While I nodded, nearly napping, suddenly there came a tapping,',
    '    As of some one gently rapping, rapping at my chamber door.',
    '',
    '    "Tis some visitor," I muttered, "tapping at my chamber door—',
    '    Only this and nothing more."',
  ], [
    { kind: 'list', items: [
      { kind: 'list-item', children: [
        { kind: 'paragraph' },
        { kind: 'paragraph' },
        { kind: 'paragraph' },
      ] },
    ] },
  ])

  test('(numbered-list / (par par par) (par par par))', [
    '1. Once upon a midnight dreary, while I pondered, weak and weary,',
    '    Over many a quaint and curious volume of forgotten lore',
    '',
    '    While I nodded, nearly napping, suddenly there came a tapping,',
    '    As of some one gently rapping, rapping at my chamber door.',
    '',
    '    "Tis some visitor," I muttered, "tapping at my chamber door—',
    '    Only this and nothing more."',
    '',
    '2. Ah, distinctly I remember it was in the bleak December;',
    '    And each separate dying ember wrought its ghost upon the floor.',
    '',
    '    Eagerly I wished the morrow;—vainly I had sought to borrow',
    '    From my books surcease of sorrow—sorrow for the lost Lenore—',
    '',
    '    For the rare and radiant maiden whom the angels name Lenore—',
    '    Nameless here for evermore.',
  ], [
    { kind: 'numbered-list', items: [
      { kind: 'numbered-list-item', children: [
        { kind: 'paragraph' },
        { kind: 'paragraph' },
        { kind: 'paragraph' },
      ] },
    ] },
    { kind: 'numbered-list', items: [
      { kind: 'numbered-list-item', children: [
        { kind: 'paragraph' },
        { kind: 'paragraph' },
        { kind: 'paragraph' },
      ] },
    ] },
  ])
  
  test('(dictionary / (par par par) (par par par))', [
    '- Once: upon a midnight dreary, while I pondered, weak and weary,',
    '    Over many a quaint and curious volume of forgotten lore',
    '',
    '    While I nodded, nearly napping, suddenly there came a tapping,',
    '    As of some one gently rapping, rapping at my chamber door.',
    '',
    '    "Tis some visitor," I muttered, "tapping at my chamber door—',
    '    Only this and nothing more."',
    '',
    '- Ah: distinctly I remember it was in the bleak December;',
    '    And each separate dying ember wrought its ghost upon the floor.',
    '',
    '    Eagerly I wished the morrow;—vainly I had sought to borrow',
    '    From my books surcease of sorrow—sorrow for the lost Lenore—',
    '',
    '    For the rare and radiant maiden whom the angels name Lenore—',
    '    Nameless here for evermore.',
  ], [
    { kind: 'dictionary', items: [
      { kind: 'dictionary-entry', key: ['Once'], children: [
        { kind: 'paragraph' },
        { kind: 'paragraph' },
        { kind: 'paragraph' },
      ] },
    ] },
    { kind: 'dictionary', items: [
      { kind: 'dictionary-entry', key: ['Ah'], children: [
        { kind: 'paragraph' },
        { kind: 'paragraph' },
        { kind: 'paragraph' },
      ] },
    ] },
  ])
  
  test('table / (row row row row)', [
    '| Once upon a midnight dreary, | while I pondered, weak and weary, |',
    '',
    '| Over many a quaint | and curious volume of forgotten lore |',
    '',
    '| While I nodded, nearly napping, | suddenly there came a tapping, |',
    '',
    '| As of some one gently rapping, | rapping at my chamber door. |',
  ], [
    { kind: 'table', items: [
      { kind: 'row', items: [
        { kind: 'cell' },
        { kind: 'cell' },
      ] },
    ] },
    { kind: 'table', items: [
      { kind: 'row', items: [
        { kind: 'cell' },
        { kind: 'cell' },
      ] },
    ] },
    { kind: 'table', items: [
      { kind: 'row', items: [
        { kind: 'cell' },
        { kind: 'cell' },
      ] },
    ] },
    { kind: 'table', items: [
      { kind: 'row', items: [
        { kind: 'cell' },
        { kind: 'cell' },
      ] },
    ] },
  ])

  test('par [macro / sel]', [
    '<<The Raven>>[by Poe]',
  ], [
    { kind: 'paragraph', text: [
      { kind: 'selection' },
      { kind: 'macro', key: ['by'], args: [['Poe']]},
    ] },
  ])
  
  test('par [macro / macro / sel]', [
    '<<The Raven>>[by Poe][link POE]',
  ], [
    { kind: 'paragraph', text: [
      { kind: 'selection' },
      { kind: 'macro', key: 'by', args: [['Poe']] },
      { kind: 'macro', key: 'link', args: [['POE']] },
    ] },
  ])

  test('(dictionary / list table)', [
    '- First:',
    '    * Once upon a midnight dreary, while I pondered, weak and weary,',
    '    * Over many a quaint and curious volume of forgotten lore',
    '- Second:',
    '    | While I nodded, | nearly napping, suddenly there came a tapping, |',
    '    | As of some one gently rapping, | rapping at my chamber door. |',
  ], [
    { kind: 'dictionary', items: [
      { kind: 'dictionary-entry', key:['First'], children: [
        { kind: 'list', items: [
          { kind: 'list-item' },
          { kind: 'list-item' },
        ] },
      ] },
    ] },
    { kind: 'dictionary', items: [
      { kind: 'dictionary-entry', key:['Second'], children: [
        { kind: 'table', items: [
          { kind: 'row', items: [
            { kind: 'cell' },
            { kind: 'cell' },
          ] },
          { kind: 'row', items: [
            { kind: 'cell' },
            { kind: 'cell' },
          ] },
        ] }
      ] },
    ] },
  ])

  test('(list / par)*2 (numbered-list / par)*2', [
    '* Once upon a midnight dreary, while I pondered, weak and weary,',
    '   Over many a quaint and curious volume of forgotten lore',
    '* While I nodded, nearly napping, suddenly there came a tapping,',
    '   As of some one gently rapping, rapping at my chamber door.',
    '1. "\'Tis some visiter," I muttered, "tapping at my chamber door -',
    '   Only this and nothing more."',
    '2. Ah, distinctly I remember it was in the bleak December;',
    '   And each separate dying ember wrought its ghost upon the floor.',
  ], [
    { kind: 'list', items: [
      { kind: 'list-item', children: [
        { kind: 'paragraph' }
      ] },
    ] },
    { kind: 'list', items: [
      { kind: 'list-item', children: [
        { kind: 'paragraph' }
      ] },
    ] },
    { kind: 'numbered-list', items: [
      { kind: 'numbered-list-item', children: [
        { kind: 'paragraph' }
      ] },
    ] },
    { kind: 'numbered-list', items: [
      { kind: 'numbered-list-item', children: [
        { kind: 'paragraph' }
      ] },
    ] },
  ])


  console.log()
})

