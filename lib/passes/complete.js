const fs = require('fs')
const path = require('path')

define([
  'lib/passes/util',
  'lib/main',
  'lib/models/ddm',
  'lib/util/args',
], function(UTIL, DBLDWN, DDM, ARGS) {
  
  // Second pass over a DoubleDown document, possibly/probably transforming it
  // in place. Processing here can rely on anything collected in the first
  // phase.
  
  let COMPLETE = UTIL.pass({
    id: 'dbldwn.complete',

    in: 'DDM',
    out: 'DDM',

    process: UTIL.top_down,
  })
  
  // # Macro `table-of-contents`.
  //
  // Takes all heading info, and creates a table-of-contents (with links), from
  // it.
  
  COMPLETE.macros.register('table-of-contents', (tree, context, blackboard) => {
    // TODO Be more defensive.
    
    let headings = blackboard['headings']
    if (!headings) return P.NOTHING

    let levels = []
    let lists = []
    for (let h of headings) {
      while (levels.length > 0 && h.level < levels[levels.length - 1]) {
        levels.pop()
        lists.pop()
      }
      
      let label = '#' + DDM.raw_text(h.title).toLowerCase().replace(/\s+/g, '-')
      
      // TODO Should this exclude non-textual things (e.g. images) from the text ?
      h.title = DDM.fragment_macro(['link'], [[label]]).insert(DDM.selection().insert(...h.title))
      
      if (levels.length == 0) {
        // Add root level
        levels.push(h.level)
        lists.push(DDM.list().add(DDM.list_item().insert(h.title)))
        
      } else if (h.level > levels[levels.length - 1]) {
        // Add new level
        levels.push(h.level)

        let l = DDM.list().add(DDM.list_item().insert(h.title))

        let items = lists[lists.length - 1].items
        items[items.length - 1].children = [l]
        lists.push(l)
        

      } else if (h.level == levels[levels.length - 1]) {
        // Add to current level
        lists[lists.length - 1].add(DDM.list_item().insert(h.title))
      }
    }

    return [lists[0]]
  })  
  
  return COMPLETE
})
