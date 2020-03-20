const fs = require('fs')
const path = require('path')

define([
  'lib/passes/util',
  'lib/main',
  'lib/models/ddm',
  'lib/util/args',
], function(UTIL, DBLDWN, DDM, ARGS) {
  
  function start(context, blackboard) {
    blackboard['meta'] = {}
    blackboard['links'] = {}
    blackboard['headings'] = []
    
    return UTIL.NOTHING
  }

  // First pass over a DoubleDown document, possibly/probably transforming it
  // in place. Anything which does not rely on global info, or on anything
  // appearing later in the document, can go here.
  
  let GENERATE = UTIL.pass({
    id: 'dbldwn.generate',

    in: 'DDM',
    out: 'DDM',

    start: start,
    process: UTIL.top_down,
  })
  
  
  // Remove all comments now. Less processing later.
  GENERATE.processing.register('comment', UTIL.nothing)


  // # Macro `include`.
  //
  // Takes a path to another DoubleDown file, resolves it relative to the
  // one currently being processed, has it processed into its own DDM, then
  // inserts that DDM into the current one.
  
  let INCLUDE_OPTIONS = ARGS.define().param('target', ARGS.ONE)
  
  GENERATE.macros.register('include', (tree, context, blackboard) => {
    let args = INCLUDE_OPTIONS.capture(tree.args)
    
    // TODO Return a DDM fragment with the errors instead.
    if (args['_errors']) console.log(args['_errors'])
    
    let input_dir = path.dirname(context.input_path)
    let file_to_include = path.normalize(path.join(input_dir, args.target))
    
    if (!fs.existsSync(file_to_include)) {
      console.error('[ERROR] Include: not found: ' + file_to_include)
      // TODO Return a DDM fragment with the error instead.
      return [DDM.paragraph().insert('Include: not found: ', file_to_include)]
    }
  
    if (!fs.lstatSync(file_to_include).isFile()) {
      console.error('[ERROR] Include: not a file: ' + file_to_include)
      // TODO Return a DDM fragment with the error instead.
      return [DDM.paragraph().insert('Include: not a file: ', file_to_include)]
    }
    
    console.log('Including: ', file_to_include)
    
    let doubledown_text_to_include = fs.readFileSync(
      file_to_include,
      { encoding: context.encoding }
    )
    
    return UTIL.remap(
      Array.from(DBLDWN.all_trees(doubledown_text_to_include)),
      d => context.pass.process_node(d, context.fork(file_to_include), blackboard)
    )
  })
  
  
  // # Macro `use`.
  //
  // Takes one ore more module names and loads them for use with the document.

  GENERATE.macros.register('use', (tree, context, blackboard) => {
    for (let mod of tree.args) {
      let mod_name = DDM.raw_text(mod)
      console.log('Loading module \'' + mod_name + '\'...')
      require('lib/modules/' + mod_name)
    }
    
    return UTIL.NOTHING
  })
  
  // # Macro `meta`.
  //
  // This flags a descriptive part of a document. Any dictionaries here will
  // get copied into the blackboard's `meta` info.
  //
  // The macro and anything below it will then be removed from the document
  // itself.

  GENERATE.macros.register('meta', (tree, context, blackboard) => {
    for (let c of tree.children)
      if (c.kind == 'dictionary')
        DDM.copy_dictionary_into_object(c, blackboard['meta'], {
          lowercase_keys: true,
          raw_text: true
        })

    return UTIL.NOTHING
  })
  
  
  // # Macro `links`.
  //
  // This flags a collection of links, with shorthands for them for use in the
  // document. The macro expects a single dictionary below it, whose keys are
  // the shorthands, and whose text will be the links.
  //
  // The macro and anything below it will then be removed from the document
  // itself.
  
  GENERATE.macros.register('links', (tree, context, blackboard) => {
    // TODO Be more defensive.
    
    DDM.copy_dictionary_into_object(tree.children[0], blackboard['links'])
    
    return UTIL.NOTHING
  })
  
  
  // # Headings
  //
  // Headings, and their level, are tracked in the blackboard for use by
  // others (such as table of contents).
  //
  // The first level 1 heading will also be used as the document's title,
  // tracked in the blackboard's `meta` info, if none has been set earlier.
  
  // TODO Should this be in a later pass, after extra content may have been
  // generated ?
  GENERATE.processing.register('heading', (tree, context, blackboard) => {
    if (tree.level == 1 && !blackboard['meta']['title'])
      blackboard['meta']['title'] = { text : tree.text }
    
    blackboard['headings'].push({
      level: tree.level,
      title: tree.text
    })
    
    return [tree]
  })


  // # Slots
  //
  // This is work-in-progress !
  // TODO Test lookup and scoping more thoroughly !

  GENERATE.processing.register('dictionary', (block, context, blackboard) => {
    for (let entry of block.items)
      context.current_frame().add_definition(entry)

    return [block]
  })


  GENERATE.processing.register('slot', (fragment, context, blackboard) => {
    // TODO Are keys case-sensitive ?
    let key = fragment.text
    
    let block = context.resolve(key)
    if (block) {
      return UTIL.remap(
        // TODO Should (deep-)clone these ?
        [...block.text, ...block.children],
        d => context.pass.process_node(d, context, blackboard)
      )
    }
    
    return [fragment]
  })


  // # Macro `auto-replace`
  //
  // TODO ...
  GENERATE.macros.register('replace', (tree, context, blackboard) => {
    for (let c of tree.children)
      if (c.kind === 'dictionary')
        for (let entry of c.items) {
          // TODO This needs more. Need to register auto-replacements somewhere.
          context.current_frame().add_replacement(entry)
          context.current_frame().add_definition(entry)
        }
    
    return UTIL.NOTHING
  })
  
  return GENERATE
})
