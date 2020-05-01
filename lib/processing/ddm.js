const fs = require('fs')

define([
  'lib/models/ddm',
  'lib/processing/util',
], function(
  DDM,
  UTIL,
) {
  
  // # Blocks
  
  // By default blocks will clone their core identity.
  // Their text will get processed further.
  // TODO .children ?
  let BLOCK_PROCESSING = UTIL.kind_registry(
    block => {
      let clone = block.clone_core()
      if (block.items) clone.add(...UTIL.remap(block.items, process_block))
      if (block.text) clone.insert(...UTIL.remap(block.text, t => process_fragment(t, block)))
      return [clone]
    }
  )
  
  // By default block macros remain unchanged.
  // TODO .children
  let BLOCK_MACRO_PROCESSING = UTIL.macro_registry(
    block_macro => {
      let clone = block_macro.clone_core()
      clone.append(...UTIL.remap(block_macro.children, process_block))
      return [clone]
    }
  )

  function process_block(block) {
    // TODO Should check if a block __may__ be processed.
    // ^ I.e. it's not below a comment or a macro.
    // ^ Unless it's on demand by a macro... 
    
    if (block.kind == 'macro')
      return BLOCK_MACRO_PROCESSING.resolve(block)(block)
    else
      return BLOCK_PROCESSING.resolve(block)(block)
  }
  
  // Comment are removed.
  BLOCK_PROCESSING.register('comment', comment => [])

  // Verbatims keep their text unchanged.
  // TODO What of .children ?
  BLOCK_PROCESSING.register('verbatim', verbatim => {
    let clone = verbatim.clone_core()
    // TODO What of the parent links of the text ?
    clone.text = verbatim.text
    return [clone]
  })
  
  // Horizontal rules are stripped down.
  // TODO What of .children ?
  BLOCK_PROCESSING.register('horizontal-rule', horizontal_rule => {
    let clone = horizontal_rule.clone_core()
    return [clone]
  })


  // # Fragments
  
  // By default fragments are returned unchanged.
  let FRAGMENT_PROCESSING = UTIL.kind_registry(
    (fragment, block) => [fragment]
  )

  // By default block macros remain unchanged.
  let FRAGMENT_MACRO_PROCESSING = UTIL.macro_registry(
    (fragment_macro, block) => [fragment_macro]
  )

  function process_fragment(fragment, block) {
    // TODO This is a "legacy" check. Remove it ASAP.
    if (UTIL.is_string(fragment))
      throw 'NOT A FRAGMENT: ' + fragment
    
    if (DDM.is_token(fragment))
      return [fragment]
        
    if (fragment.kind == 'macro')
      return FRAGMENT_MACRO_PROCESSING.resolve(fragment)(fragment, block)
    else
      return FRAGMENT_PROCESSING.resolve(fragment)(fragment, block)
  }

  // Slots are matched to dictionary entries, and replaced when found.
  FRAGMENT_PROCESSING.register('slot', (slot, block) => {
    // TODO 1. Lookup the block we're in.
    while (block) {
      // TODO 2. Check children of that block (in reverse order) for dictionaries.
      for (let dictionary of UTIL.in_reverse_order(block.children)) {
        if (dictionary.kind !== 'dictionary') continue
      
        // TODO 3. Match entries (in reverse order) in dictionaries.
        for (let entry of UTIL.in_reverse_order(dictionary.items)) {
          if (UTIL.fragments_match(slot.text, entry.key)) {
            // TODO 3a. On a match: replace slot with the entry's value, then expand that as well.
            return UTIL.remap(entry.text, t => process_fragment(t, dictionary))
          }
        }
      }
      
      // TODO 3b. If no match: go up a block and repeat.
      block = block.parent
    }

    // TODO 4. If no match could be found, return the slot as is.
    return [slot]
  })


  return {
    process: process_block
  }
})
