define([
  'lib/passes/util',
  'lib/passes/generate', 'lib/passes/complete',
  'lib/models/ddm', 'lib/models/dom', 'lib/util/args'
], function(
  UTIL, GENERATE, COMPLETE, DDM, DOM, ARGS
) {
  const ID = 'module.bibliography'
  
  function bibliography_data(blackboard) {
    if (!blackboard[ID])
      blackboard[ID] = {
        citations: {},
        references: {}
      }
    
    return blackboard[ID]
  }
  
  let BIBLIO_GENERATE = UTIL.module_registry(GENERATE.macros, 'bibliography')
  

  // # Macro `see`.
  //
  // Takes a citation key and creates a formatted link for it which looks like
  // `[KEY]`.

  let SEE_OPTIONS = ARGS.define()
    .param('key')
    .option('p.', ARGS.OPTIONAL)
  
  BIBLIO_GENERATE.register('see', (tree, context, blackboard) => {
    let args = SEE_OPTIONS.capture(tree.args)
    
    // TODO Return a DDM fragment with the errors instead.
    if (args['_errors']) console.log(args['_errors'])
    
    let references = bibliography_data(blackboard).references
    if (!references[args.key]) references[args.key] = 1
    else references[args.key] += 1
    
    // GENERATE processes top down. So if we move child elements up, we have to
    // trigger processing ourselves...
    let result = UTIL.remap(tree.text, t => GENERATE.process(t, context, blackboard))
    
    // TODO For HTML: really want an "on hover" dialog.
    result.push(' [')
    result.push(
      DDM.fragment_macro(
        ['link'],
        [['#bibliography:' + args.key]]
      ).insert(
        DDM.selection().insert(args.key)
      )
    )
    if (args['p.']) {
      result.push(', p. ')
      result.push(args['p.'])
    }
    result.push(']')

    return result
  })
  



  let CITE_OPTIONS = ARGS.define()
    .param('kind', ARGS.ONE, ARGS.choice('book', 'poem'))
    .param('key')

  BIBLIO_GENERATE.register('cite', (tree, context, blackboard) => {
    let args = CITE_OPTIONS.capture(tree.args)
    
    // TODO Return a DDM fragment with the errors instead.
    if (args['_errors']) console.log(args['_errors'])
    
    let details = { a: args.kind, used: false }
    DDM.copy_dictionary_into_object(tree.children[0], details, { lowercase_keys: true })
        
    bibliography_data(blackboard).citations[args.key] = details
    
    return UTIL.NOTHING
  })
  
  
  
  let BIBLIO_COMPLETE = UTIL.module_registry(COMPLETE.macros, 'bibliography')

  BIBLIO_COMPLETE.register('create', (tree, context, blackboard) => {
    let bibliography = bibliography_data(blackboard)
    let sortedReferenceNames = Object.keys(bibliography.references).sort()
    
    let result = []
    for (let referenceName of sortedReferenceNames) {
      let cited = bibliography.citations[referenceName]
        
      let text = [DDM.anchor('bibliography:' + referenceName), '[', referenceName, '] ']
      text.push(...cited['authors'].text)
      text.push(', ')
      
      let title = ['"']
      title.push(...cited['title'].text)
      title.push('"')
      text.push(DDM.emphasis().insert(...title))

      text.push(', ')
      text.push(...cited['publisher'].text)
      text.push(', ')
      text.push(...cited['publication date'].text)
      text.push(', ISBN: ')
      text.push(...cited['isbn'].text)

      result.push(DDM.paragraph().insert(...text))
    }
    
    return result
  })
  
  return {
    id: ID
  }
})
