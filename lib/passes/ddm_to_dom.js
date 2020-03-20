define([
  'lib/passes/util', 'lib/models/dom', 'lib/models/ddm', 'lib/util/args'
], function(UTIL, DOM, DDM, ARGS) {
  
  let error = () => DOM.e('error')
  let inline_code = () => DOM.e('inline-code')
  let strikethrough = () => DOM.e('strikethrough')
  let placeholder = () => DOM.e('placeholder')
  
  function process(node, context, blackboard) {
    if (node.kind == 'macro') {
      // MACROS: DO NOT DO BOTTOM UTIL. Instead make macro issue processing requests.
      return context.pass.macros.resolve(node)(node, null, context, blackboard)
    }
    
    // Generation goes bottom up.

    let partial_dom = { children: [], items: [], text: [] }
    
    if (node.children)
      partial_dom.children = UTIL.remap(node.children, c => process(c, context, blackboard))

    if (node.items)
      partial_dom.items = UTIL.remap(node.items, c => process(c, context, blackboard))

    if (node.text)
      partial_dom.text = UTIL.remap(node.text, t => process(t, context, blackboard))

    return context.pass.processing_for(node)(node, partial_dom, context, blackboard)
  }

  let TO_DOM = UTIL.pass({
    id: 'dbldwn.to_dom',

    in: 'DDM',
    out: 'DOM',

    process: process,
    
    string_processing: (node, partial_dom, context, blackboard) => [DOM.text(node)],
    token_processing: (node, partial_dom, context, blackboard) => [DOM.text(node.data)],
  })

  // TODO Split into block and fragment macros ?
  TO_DOM.macros.default_entry = (node, partial_dom, context, blackboard) => {
    let key = DDM.raw_text(node.key)
    console.log('Undefined  macro: ', key, ' at ', node.location)
    return [
      error().append(
        'Undefined macro ',
         inline_code().append(key),
         '.'
      )
    ]
  }

  TO_DOM.processing.default_entry = (node, partial_dom, context, blackboard) => {
    console.log('No generation for: ', node.kind, ' at ', node.location)
    return [error().append(
        'No generation for ',
        inline_code().append(node.kind),
        '.'
    )]
  }

  let headings = [DOM.h1, DOM.h2, DOM.h3, DOM.h4, DOM.h5, DOM.h6]
  
  TO_DOM.processing.register('heading', (node, partial_dom, context, blackboard) => {
    // TODO Can't use raw-text here... Unless we provide it on DOM nodes as well ???
    let id = DDM.raw_text(node.text).toLowerCase().replace(/\s+/g, '-')
    
    let h = headings[Math.min(node.level - 1, headings.length - 1)]
    return [
      h().append(
        DOM.a().attr('id', id),
        ...partial_dom.text
      ),
      ...partial_dom.children
    ]
  })

  TO_DOM.processing.register('paragraph', (node, partial_dom, context, blackboard) => {
    return [
      DOM.p().append(
        ...partial_dom.text,
        ...partial_dom.children
      )
    ]
  })

  TO_DOM.processing.register('verbatim', (node, partial_dom, context, blackboard) => {
    return [
      DOM.pre().append(
        ...partial_dom.text,
        ...partial_dom.children
      )
    ]
  })

  TO_DOM.processing.register('emphasis', (node, partial_dom, context, blackboard) => {
    return [
      DOM.i().append(
        ...partial_dom.text
      )
    ]
  })

  TO_DOM.processing.register('strong', (node, partial_dom, context, blackboard) => {
    return [
      DOM.b().append(
        ...partial_dom.text
      )
    ]
  })

  TO_DOM.processing.register('inline-code', (node, partial_dom, context, blackboard) => {
    return [
      inline_code().append(
        ...partial_dom.text
      )
    ]
  })

  TO_DOM.processing.register('placeholder', (node, partial_dom, context, blackboard) => {
    return [
      placeholder()
    ]
  })
  
  TO_DOM.processing.register('horizontal-rule', (node, partial_dom, context, blackboard) => {
    return [
      DOM.hr()
    ]
  })

  TO_DOM.processing.register('strikethrough', (node, partial_dom, context, blackboard) => {
    return [
      strikethrough().append(
        ...partial_dom.text
      )
    ]
  })

  TO_DOM.processing.register('anchor', (node, partial_dom, context, blackboard) => {
    let id = DDM.raw_text(node.key).replace(/\s+/g, '-')
    return [
      DOM.a().attr('id', id)
    ]
  })
  
  TO_DOM.processing.register('selection', (node, partial_dom, context, blackboard) => {
    return partial_dom.text || []
  })
  
  TO_DOM.processing.register('list', (node, partial_dom, context, blackboard) => {
    return [
      DOM.ul().append(
        ...partial_dom.items
      )
    ]
  })
  
  TO_DOM.processing.register('numbered-list', (node, partial_dom, context, blackboard) => {
    return [
      DOM.ol().append(
        ...partial_dom.items
      )
    ]
  })
  
  function list_item(node, partial_dom, context, blackboard) {
    return [
      DOM.li().append(
        DOM.span().append(
          ...partial_dom.text
        ),
        ...partial_dom.children
      )
    ]
  }
  
  TO_DOM.processing.register('list-item', list_item)
  TO_DOM.processing.register('numbered-list-item', list_item)
  
  TO_DOM.processing.register('table', (node, partial_dom, context, blackboard) => {
    return [
      DOM.table().append(
        DOM.tbody().append(
          ...partial_dom.items
        )
      )
    ]
  })

  TO_DOM.processing.register('row', (node, partial_dom, context, blackboard) => {
    return [
      DOM.tr().append(
        ...partial_dom.items
      )
    ]
  })

  TO_DOM.processing.register('cell', (node, partial_dom, context, blackboard) => {
    return [
      DOM.td().append(
        ...partial_dom.text,
        ...partial_dom.children
      )
    ]
  })
  
  TO_DOM.processing.register('dictionary', (block, context, blackboard) => {
    return UTIL.NOTHING
  })
  
  TO_DOM.processing.register('dictionary-entry', (block, context, blackboard) => {
    return UTIL.NOTHING
  })
  
  
  
  let LINK_OPTIONS = ARGS.define().param('target', ARGS.ONE)

  TO_DOM.macros.register('link', (tree, _, context, blackboard) => {
    let args = LINK_OPTIONS.capture(tree.args)
    
    // TODO Return a DDM fragment with the errors instead.
    if (args['_errors']) console.log(args['_errors'])
    
    let target = args.target
    let links = blackboard['links']
    if (links && links[args.target]) target = DDM.raw_text(links[args.target].text)
      
    if (target.endsWith('.%'))
      target = target.substring(0, target.length - 2) + '.' + context.format
    
    return [
      DOM.a().attr('href', target)
        .append(...UTIL.remap(tree.text, t => process(t, context, blackboard)))
    ]
  })
  
  
  let IMAGE_OPTIONS = ARGS.define()
    .param('src')
    .option('width', ARGS.OPTIONAL)
    .option('height', ARGS.OPTIONAL)

  TO_DOM.macros.register('image', (tree, _, context, blackboard) => {
    let args = IMAGE_OPTIONS.capture(tree.args)
    
    // TODO Return a DDM fragment with the errors instead.
    if (args['_errors']) console.log(args['_errors'])
    
    let image = DOM.img().attr('src', args.src)

    if (args.width) image.style('width', args.width)
    if (args.height) image.style('height', args.height)

    // TODO If block macro, place in a div ?
    return [image]
  })
  
  
  
  // Create a DOM node
  function make_a_node(name) {
    return function(tree, _, context, blackboard) {
      return [
        DOM.e(name).append(
          ...UTIL.remap(tree.text, t => process(t, context, blackboard)),
          ...UTIL.remap(tree.children, t => process(t, context, blackboard))
        )
      ]
    }
  }
  
  TO_DOM.macros.register('quote', make_a_node('quote'))
  TO_DOM.macros.register('code', make_a_node('code'))
  TO_DOM.macros.register('result', make_a_node('result'))
  TO_DOM.macros.register('definition', make_a_node('definition'))
  
  
  
  return TO_DOM
})
