define(['lib/passes/util', 'lib/models/ddm'], function(UTIL, DDM) {
  
  // Transforms DDM nodes to Markdown text.
  
  const ID = 'dbldwn.ddm_to_md'
  
  let block_macros = UTIL.macro_registry(
    (block, indent, context, blackboard) => {
      console.log('Undefined block macro: ', key, ' at ', block.location)
      return [['**Undefined block macro `', key, '`**.', ''].join('')]
    }, 
    name => {
      console.warn('[WARN] Redefining block macro \'' + name + '\' (phase: ' + ID + '). ')
    }
  )
  
  let fragment_macros = UTIL.macro_registry(
    (fragment, indent, context, blackboard) => {
      console.log('Undefined fragment macro: ', key, ' at ', fragment.location)
      return ['**Undefined fragment macro `', key, '`**.', '']
    }, 
    name => {
      console.warn('[WARN] Redefining fragment macro \'' + name + '\' (phase: ' + ID + '). ')
    }
  )

  function heading(block, indent, context, blackboard) {
    let h = [indent]
    
    for (let i = 0; i < block.level; i++) h.push('#')
    h.push(' ')
      
    // TODO Not raw text. Pass via to_words...
    h.push(...UTIL.remap(block.text, t => to_words(t, indent, context, blackboard)))
    
    return [
      h.join(''),
      ''
    ]
  }
  
  function paragraph(block, indent, context, blackboard) {
    let text = UTIL.remap(block.text, t => to_words(t, indent, context, blackboard)).join('')
    
    return [indent + text, '']
  }

  function selection(fragment, indent, context, blackboard) {
    return UTIL.remap(fragment.text, t => to_words(t, indent, context, blackboard))
  }

  function inline_code(fragment, indent, context, blackboard) {
    let md = ['`']
    md.push(...UTIL.remap(fragment.text, t => to_words(t, indent, context, blackboard)))
    md.push('`')
    return md
  }

  function strong(fragment, indent, context, blackboard) {
    return ['**', ...UTIL.remap(fragment.text, t => to_words(t, indent, context, blackboard)), '**']
  }
  
  function emphasis(fragment, indent, context, blackboard) {
    return ['_', ...UTIL.remap(fragment.text, t => to_words(t, indent, context, blackboard)), '_']
  }
  
  function strikethrough(fragment, indent, context, blackboard) {
    return ['~~', ...UTIL.remap(fragment.text, t => to_words(t, indent, context, blackboard)), '~~']
  }
    
  function placeholder(fragment, indent, context, blackboard) {
    return ['`___________`']
  }
    
  function list(block, indent, context, blackboard) {
    let md = []
    for (let i = 0; i < block.items.length; i++) {
      let lines = to_lines(block.items[i], indent, context, blackboard)
      md.push(indent + '* ' + lines.shift())
      md.push(...lines)
    }
    
    md.push('')
    return md
  }
  
  function numbered_list(block, indent, context, blackboard) {
    let md = []
    for (let i = 0; i < block.items.length; i++) {
      let lines = to_lines(block.items[i], indent, context, blackboard)
      md.push(indent + (i+1) + '. ' + lines.shift())
      md.push(...lines)
    }
    
    md.push('')
    return md
  }
  
  function list_item(block, indent, context, blackboard) {
    let md = [
      UTIL.remap(block.text, t => to_words(t, indent, context, blackboard)).join(''),
      ''
    ]
    
    for (let i = 0; i < block.children.length; i++) {
      md.push(...to_lines(block.children[i], indent + '  ', context, blackboard))
      md.push('')
    }
    
    return md
  }
  
  function verbatim(block, indent, context, blackboard) {
    let text = UTIL.remap(block.text, t => to_words(t, '', context, blackboard)).join('')
    let lines = text.split('\n')
    return lines.map(l => indent + '> ' + l)
  }

  function table(block, indent, context, blackboard) {
    return [
      ...UTIL.remap(block.items, c => to_lines(c, indent, context, blackboard)),
      ''
    ]
  }

  function row(block, indent, context, blackboard) {
    let md = [indent, '|']
    
    for (let i = 0; i < block.items.length; i++) {
      md.push(' ')
      md.push(...to_lines(block.items[i], indent, context, blackboard))
      md.push(' |')
    }
    
    return [md.join('')]
  }

  function cell(block, indent, context, blackboard) {
    return UTIL.remap(block.text, t => to_words(t, indent, context, blackboard))
  }
  
  function horizontal_rule(block, indent, context, blackboard) {
    return ['---', '']
  }

  function as_children(block, indent, context, blackboard) {
    return UTIL.remap(block.children, c => to_lines(c, indent, context, blackboard))
  }
  
  function generation_for_block(tree) {
    if (tree.kind == 'heading') return heading
    if (tree.kind == 'paragraph') return paragraph
    if (tree.kind == 'list') return list
    if (tree.kind == 'list-item') return list_item
    if (tree.kind == 'numbered-list') return numbered_list
    if (tree.kind == 'numbered-list-item') return list_item
    if (tree.kind == 'verbatim') return verbatim
    if (tree.kind == 'table') return table
    if (tree.kind == 'row') return row
    if (tree.kind == 'cell') return cell
    if (tree.kind == 'horizontal-rule') return horizontal_rule
      
    if (tree.kind == 'macro')
      return block_macros.resolve(tree)
    
    return function() {
      console.log('No generation for block: ', tree.kind, ' at ', tree.location)
      return ['**No generation for block `' + tree.kind + '`.**', '']
    }
  }
  
  function generation_for_fragment(fragment) {
    if (UTIL.is_string(fragment)) return () => [fragment]
    if (DDM.is_token(fragment)) return () => [fragment.data]
    
    if (fragment.kind == 'selection') return selection
    if (fragment.kind == 'inline-code') return inline_code
    if (fragment.kind == 'strong') return strong
    if (fragment.kind == 'emphasis') return emphasis
    if (fragment.kind == 'strikethrough') return strikethrough
    if (fragment.kind == 'placeholder') return placeholder
    
    if (fragment.kind == 'macro')
      return fragment_macros.resolve(fragment)
    

    return function() {
      console.log('No generation for fragment: ', fragment.kind, ' at ', fragment.location)
      return ['**No generation for fragment `' + fragment.kind + '`.**', '']
    }
  }

  function to_lines(tree, indent, context, blackboard) {
    return generation_for_block(tree)(tree, indent, context, blackboard)
  }

  function to_words(fragment, indent, context, blackboard) {
    return generation_for_fragment(fragment)(fragment, indent, context, blackboard)
  }

  function process(tree, context, blackboard) {
    return to_lines(tree, '', context, blackboard)
  }
  
  fragment_macros.register('link', (fragment, indent, context, blackboard) => {
    let target = DDM.raw_text(fragment.args[0])
    
    let links = blackboard['links']
    if (links && links[target]) target = DDM.raw_text(links[target])
    
    return [
      '[',
      ...UTIL.remap(fragment.text, t => to_words(t, context, blackboard)),
      '](',
      target,
      ')'
    ]
  })
  
  block_macros.register('code', (block, indent, context, blackboard) => {
    let md = [
      indent + '```',
      UTIL.remap(block.children[0].text, c => to_words(c, indent, context, blackboard)).join(''),
      '```'
    ]
    
    return md
  })
  
  
  fragment_macros.register('image', (fragment, indent, context, blackboard) => {
    let target = DDM.raw_text(fragment.args[0])

    return [
      '![', target, '](', target, ')'
    ]
  })
  
  
  block_macros.register('image', (block, indent, context, blackboard) => {
    let target = DDM.raw_text(block.args[0])

    return [
      '![' + target + '](' + target + ')',
      ''
    ]
  })
  
  // TODO "quote" should be like a verbatim
  block_macros.register('quote', as_children)
  // TODO What to do with "definition" ?
  block_macros.register('definition', as_children)
  // TODO What to do with "result" ?
  block_macros.register('result', as_children)
  
  
  return {
    id: ID,
    
    in: 'DDM',
    dir: 'top-down',
    out: 'string',

    start: UTIL.nothing,
    process: process,
    end: UTIL.nothing,
    
    to_words: to_words,
    to_lines: to_lines,
    
    block_macros: block_macros,
    fragment_macros: fragment_macros,
    as_children: as_children,
  }
})
