define([
  'lib/prsly',
  'lib/tokens',
  'lib/blocks',
  'lib/values',
  'lib/models/ddm'
], function(_, T, B, V, DDM) {

  function is_string(object) {
    return typeof object === 'string' || object instanceof String
  }

  function transform(tree_of_values) {
    if (tree_of_values.children)
      tree_of_values.children = [...normalized_trees(tree_of_values.children)]

    if (tree_of_values.items)
      for (let i of tree_of_values.items)
        transform(i)

    if (tree_of_values.text)
      tree_of_values.text = normalized_text(tree_of_values.text)
  }
  
  function normalized_text(text) {
    let text1 = text // TODO Can get safely rid of ?: .map(t => DDM.is_token(t) ? t.data : t) 
    let simplified_text = []
    
    for (let next of text1) {
      let last = simplified_text.pop()
      
      if (next.kind == 'macro' && last && (last.kind == 'selection' || last.kind == 'macro')) {
        transform(next)
        // Apply a macro to any preceding selection or macro.
        next.text = [last]
        simplified_text.push(next)
        
      } else {
        if (last) simplified_text.push(last)
        transform(next)
        simplified_text.push(next)
      }
    }

    // Lose trailing newline, if any.
    // TODO Right thing to do ?
    // TODO Does this still apply ?
    if (simplified_text.length > 0) {
      let last = simplified_text[simplified_text.length - 1]
      if (is_string(last) && last.endsWith('\n')) {
        last = last.substring(0, last.length - 1)
        simplified_text[simplified_text.length - 1] = last
      }
    }

    return simplified_text
  }

  function* normalized_trees(trees) {
    let previous = null
    
    for (let tree_of_values of trees) {
      transform(tree_of_values)

      if (previous) {
        if (tree_of_values.kind == 'list' && previous.kind == 'list') {
          previous.join(tree_of_values)
          continue
          
        } else if (tree_of_values.kind == 'numbered-list' && previous.kind == 'numbered-list') {
          previous.join(tree_of_values)
          continue
          
        } else if (tree_of_values.kind == 'dictionary' && previous.kind == 'dictionary') {
          previous.join(tree_of_values)
          continue
          
        } else if (tree_of_values.kind == 'table' && previous.kind == 'table') {
          previous.join(tree_of_values)
          continue
        }
      }

      if (previous) yield previous
      previous = tree_of_values
    }
    
    if (previous) yield previous
  }
  
  
  function* all_trees(input_stream) {
    for (let tree_of_values of
        normalized_trees(
          V.trees_of_values(
            B.trees_of_blocks(
              B.blocks(
                T.tokens(input_stream))))))
      yield tree_of_values
  }

  return {
    all_trees: all_trees,
  }
})
