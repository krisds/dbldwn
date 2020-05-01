const path = require("path")
const requirejs = require('requirejs')

requirejs.config({
    baseUrl: path.join(__dirname, '..', ),
    nodeRequire: require
})

const assert = require('assert')

requirejs(['lib/util/testing', 'lib/main', 'lib/processing/ddm'], function(TESTING, DBLDWN, DDM_PROCESSING) {

  function process(lines) {
    return DBLDWN.document(lines.join('\n'))
  }

  function accept(name, input_lines, target_to_be_converted, expected_lines) {
    let input = process(input_lines)
    
    let target_selector = TESTING.difference_as_selector(target_to_be_converted)
    let target = target_selector(input)
    assert(target !== undefined)

    let actual = DDM_PROCESSING.process(target)
    
    let expected = process(expected_lines).children
    
    let diff = TESTING.find_difference(expected, actual, '_')

    if (diff == null)
      console.log('* PASS: ' +  name)
    else {
      console.log('* FAIL :', name)
      console.log('  * DIFF: ', diff)
      let select = TESTING.difference_as_selector(diff)
      console.log('  * EXPECTED:', select(expected))
      console.log('  * ACTUAL:', select(actual))
      
      assert(diff == null, 'At: ' + diff + '. Expected: ' + select(expected) + '. Got: ' + select(actual) + '.')
    }
  }
    
  console.log('# DDM Processing')
  console.log()
  
  accept('Comments are removed',
    [ '# The Raven',
      '',
      '//// Once upon a midnight dreary, while I pondered, weak and weary,',
      'Over many a quaint and curious volume of forgotten lore',
    ],
    '_.children.1',
    []
  )
  
  // TODO Expanding anything beneath a comment should yield nothing ?

  accept('Basic paragraphs remain unchanged',
    [ '# The Raven',
      '',
      'Once upon a midnight dreary, while I pondered, weak and weary,',
      'Over many a quaint and curious volume of forgotten lore',
      'While I nodded, nearly napping, suddenly there came a tapping,',
      'As of some one gently rapping, rapping at my chamber door.',
    ],
    '_.children.1',
    [ 'Once upon a midnight dreary, while I pondered, weak and weary,',
      'Over many a quaint and curious volume of forgotten lore',
      'While I nodded, nearly napping, suddenly there came a tapping,',
      'As of some one gently rapping, rapping at my chamber door.',
    ]
  )

  accept('Basic headings (level 1) remain unchanged',
    [ '# The Raven' ],
    '_.children.0',
    [ '# The Raven' ]
  )
  
  accept('Basic headings (level 2) remain unchanged',
    [ '## By Edgar Allan Poe' ],
    '_.children.0',
    [ '## By Edgar Allan Poe' ]
  )
    
  accept('Basic headings (level 3) remain unchanged',
    [ '### First published in January 1845' ],
    '_.children.0',
    [ '### First published in January 1845' ]
  )
  
  accept('Basic ordered lists remain unchanged',
    [ '# The Raven',
      '',
      '* Once upon a midnight dreary, while I pondered, weak and weary,',
      '* Over many a quaint and curious volume of forgotten lore',
      '* While I nodded, nearly napping, suddenly there came a tapping,',
      '* As of some one gently rapping, rapping at my chamber door.',
    ],
    '_.children.1',
    [ '* Once upon a midnight dreary, while I pondered, weak and weary,',
      '* Over many a quaint and curious volume of forgotten lore',
      '* While I nodded, nearly napping, suddenly there came a tapping,',
      '* As of some one gently rapping, rapping at my chamber door.',
    ]
  )

  accept('Basic numbered lists remain unchanged',
    [ '# The Raven',
      '',
      '0. Once upon a midnight dreary, while I pondered, weak and weary,',
      '0. Over many a quaint and curious volume of forgotten lore',
      '0. While I nodded, nearly napping, suddenly there came a tapping,',
      '0. As of some one gently rapping, rapping at my chamber door.',
    ],
    '_.children.1',
    [ '0. Once upon a midnight dreary, while I pondered, weak and weary,',
      '0. Over many a quaint and curious volume of forgotten lore',
      '0. While I nodded, nearly napping, suddenly there came a tapping,',
      '0. As of some one gently rapping, rapping at my chamber door.',
    ]
  )

  accept('Basic tables remain unchanged',
    [ '# The Raven',
      '',
      '| Once upon a midnight dreary, | while I pondered, weak and weary, |',
      '| Over many a quaint and curious volume | of forgotten lore |',
      '| While I nodded, nearly napping, | suddenly there came a tapping, |',
      '| As of some one gently rapping, | rapping at my chamber door. |',
    ],
    '_.children.1',
    [ '| Once upon a midnight dreary, | while I pondered, weak and weary, |',
      '| Over many a quaint and curious volume | of forgotten lore |',
      '| While I nodded, nearly napping, | suddenly there came a tapping, |',
      '| As of some one gently rapping, | rapping at my chamber door. |',
    ]
  )
  
  accept('Verbatims remain unchanged',
    [ '# The Raven',
      '',
      '> Once upon a midnight dreary, while I pondered, weak and weary,',
      '> Over many a quaint and curious volume of forgotten lore—',
      '>     While I nodded, nearly napping, suddenly there came a tapping,',
      '> As of some one gently rapping, rapping at my chamber door.',
      '> “’Tis some visitor,” I muttered, “tapping at my chamber door—',
      '>             Only this and nothing more.”',
    ],
    '_.children.1',
    [ '> Once upon a midnight dreary, while I pondered, weak and weary,',
      '> Over many a quaint and curious volume of forgotten lore—',
      '>     While I nodded, nearly napping, suddenly there came a tapping,',
      '> As of some one gently rapping, rapping at my chamber door.',
      '> “’Tis some visitor,” I muttered, “tapping at my chamber door—',
      '>             Only this and nothing more.”',
    ]
  )
  
  accept('Horizontal rules remain unchanged',
    [ '# The Raven',
      '',
      '---',
    ],
    '_.children.1',
    [ '---',
    ]
  )

  // TODO Dictionaries become what ?

  accept('Basic inline elements remain unchanged',
    [ '# The Raven',
      '',
      '__Once__ upon a **midnight dreary**, while I ~~wondered~~ pondered, weak and weary,',
      'Over many a ___ and ___ volume of <<forgotten>> `lore`—',
    ],
    '_.children.1',
    [ '__Once__ upon a **midnight dreary**, while I ~~wondered~~ pondered, weak and weary,',
      'Over many a ___ and ___ volume of <<forgotten>> `lore`—',
    ]
  )

  accept('Slots without matching dictionary entries remain unchanged',
    [ '# The Raven',
      '',
      'Once upon a {{time}}, while I pondered, weak and weary,',
    ],
    '_.children.1',
    [ 'Once upon a {{time}}, while I pondered, weak and weary,',
    ]
  )

  accept('Slots with a matching dictionary entry are replaced',
    [ '# The Raven',
      '',
      'Once upon a {{time}}, while I pondered, weak and weary,',
      '',
      '  - time: fortnight',
      '  - time: midnight dreary',
      '  - place: my chamber',
    ],
    '_.children.1',
    [ 'Once upon a midnight dreary, while I pondered, weak and weary,',
    ]
  )
  
  // TODO What with dictionary entries which have replacements of their own ?

  accept('Slots may be resolved against multiple dictionaries found in the document',
    [ '# The Raven',
      '',
      '- motivation: weak and weary',
      '',
      '## By Edgar Allan Poe',
      '',
      '  - action: pondered',
      '',
      '  Once upon a {{time}}, while {{actor}} {{action}}, {{motivation}},',
      '  ',
      '    - time: midnight dreary',
      '  ',
      '  - actor: I',
    ],
    '_.children.2.children.1',
    [ 'Once upon a midnight dreary, while I pondered, weak and weary,',
    ]
  )

  accept('Slots only look at certain parts of the document for possible replacements',
    [ '# The Raven',
      '',
      '  - quote: Believe nothing you hear, and only one half that you see.',
      '',
      'Quoth the Raven "{{quote}}"',
      '  ',
      '  ## Once upon...',
      '    - quote: I wish I could write as mysterious as a cat.',
      '',
      '## A midnight dreary...',
      '  - quote: All that we see and seem is but a dream within a dream.',
    ],
    '_.children.1',
    [ 'Quoth the Raven "{{quote}}"',
    ]
  )
  
  accept('Unknown block macros remain unchanged',
    [ '[nevermore]',
    ],
    '_.children.0',
    [ '[nevermore]']
  )

  accept('Unknown block macros with children remain unchanged',
    [ '[quote]',
      '  Once upon a midnight dreary, while I pondered, weak and weary,',
    ],
    '_.children.0',
    [ '[quote]',
      '  Once upon a midnight dreary, while I pondered, weak and weary,',
    ]
  )

  accept('Unknown fragment macros remain unchanged',
    [ 'Quoth the Raven [nevermore]',
    ],
    '_.children.0',
    [ 'Quoth the Raven [nevermore]']
  )

  accept('Unknown fragment macros with children remain unchanged',
    [ 'Quoth the Raven <<nevermore>>[quote]',
    ],
    '_.children.0',
    [ 'Quoth the Raven <<nevermore>>[quote]']
  )

  // TODO [replace] should move up its dictionary/ies one level
  // TODO ^ slots should work in terms of transformed elements


  // TODO TOC ? <= Collection(heading')
  // TODO Use (something like) dfntly, data flow engine ?
  // TODO Could give Node/Block a "dfntly processed()"
  // TODO ^ We'd need a version which can update/remove links.
  // TODO A "dntly context()" ?

  console.log()
})
