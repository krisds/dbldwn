define(['./prsly', './tokens', './models/ddm'], function(_, T, DDM) {

  function lit(expected) {
    return _.is(t => t && t.kind != T.ESCAPED_TOKEN && t.data == expected)
  }

  // TODO PRSLY: should `.as(...)` return a new PC object ?
  // TODO PRSLY: add a "one or more", and use it here...

  let  WS  = _.is(t => t && t.kind == T.WHITESPACE_TOKEN)
  let _WS_ = _.is(t => t && t.kind == T.WHITESPACE_TOKEN).as(_.ignored_value)
  
  let  MAYBE_WS  = _.optional(WS)
  let _MAYBE_WS_ = _.optional(WS).as(_.ignored_value)

  let TEXT = _.is(t => t && (t.kind == T.ALPHABETIC_TOKEN || t.kind == T.NUMERIC_TOKEN || t.kind == T.ESCAPED_TOKEN))
  let NUM  = _.is(t => t && t.kind == T.NUMERIC_TOKEN)
  let EOLN = _.is(t => t && (t.kind == T.END_OF_LINE_TOKEN))
  let _MAYBE_EOLN_ = _.optional(EOLN).as(_.ignored_value)

  let WORD_PART= _.is(t => t && (
    t.kind == T.ALPHABETIC_TOKEN
    || t.kind == T.NUMERIC_TOKEN
    || t.kind == T.CHARACTER_TOKEN
    || t.kind == T.ESCAPED_TOKEN
  ))
  let WORD = _.sequence(WORD_PART, _.many(WORD_PART)).as(_.flattened_value)

  let INLINE = _.to_be_defined()

  function block_of(...parsers) {
    parsers.push(_.at_end)
    return _.sequence.apply(null, parsers)
  }
  
  let HEADING_MARKER = _.sequence(lit('#'), _.many(lit('#')), _WS_).as(_.flattened_value)
  let HEADING = block_of(
    HEADING_MARKER, _.many(INLINE)
    
  ).as(values => {
    let marker = values.shift()
    let text = values.shift()
    
    return DDM.heading(marker.length).at(marker[0].location).insert(...text)
  })
  
  let COMMENT_MARKER = _.sequence(lit('/'), lit('/'), lit('/'), lit('/'), _WS_)
  let COMMENT = block_of(
    COMMENT_MARKER, _.many(INLINE)
    
  ).as(values => {
    let marker = values.shift()
    let text = values.shift()

    return DDM.comment().at(marker[0].location).insert(...text)
  })
  
  
  let INLINE_MACRO = _.enclosed(
    _.sequence(lit('['), _MAYBE_WS_),
    _.sequence(
      WORD,
      _.many(_.sequence(_WS_, WORD)).as(_.flattened_value),
    ),
    _.sequence(_MAYBE_WS_, lit(']'))
    
  ).as(values => {
    let marker = values[0].shift()
    let key = values[1].shift() 
    let args = values[1].shift()
    
    return DDM.fragment_macro(key, args).at(marker.location)
  })

  let MACRO = block_of(
    INLINE_MACRO,
    _MAYBE_WS_,
    _MAYBE_EOLN_
    
  ).as(values => {
    // TODO Better way to do this ?
    let fragment_macro = values.shift()
    return DDM.block_macro(fragment_macro.key, fragment_macro.args).at(fragment_macro.location)
  })
  
  let FORMATTED_LINE = _.enclosed(
    _.empty,
    _.many(INLINE),
    _.choice(EOLN, _.at_end)
  ).as(_.flattened_value)

  function list_item(kind, marker) {
    return _.sequence(
      marker, FORMATTED_LINE,
      _.many(_.sequence(
        _.not(_.choice(marker, _.at_end)), FORMATTED_LINE
      ).as(_.first_value)).as(_.flattened_value)
      
    ).as(values => {
      let marker = values.shift()
      let skipped = values.shift()
      // TODO while for ??
      while (values.length > 0)
        for (let v of values.shift())
          skipped.push(v)
      
      let last = skipped.pop()
      if (last && last.kind != T.END_OF_LINE_TOKEN) skipped.push(last)
      
      return kind().at(marker.location).insert(...skipped)
    })
  }
  
  function list(kind, item) {
    return _.sequence(
      _.many(item),
      _.at_end
      
    ).as(values => {
      let items = values[0]
      
      return kind().at(items[0].location).add(...items)
    })
  }
  
  let LIST_ITEM_MARKER = _.sequence(lit('*'), _WS_).as(_.first_value)
  let LIST_ITEM = list_item(DDM.list_item, LIST_ITEM_MARKER)
  let LIST = list(DDM.list, LIST_ITEM)

  let NUMBERED_LIST_ITEM_MARKER = _.sequence(NUM, lit('.'), _WS_).as(_.first_value)
  let NUMBERED_LIST_ITEM = list_item(DDM.numbered_list_item, NUMBERED_LIST_ITEM_MARKER)
  let NUMBERED_LIST = list(DDM.numbered_list, NUMBERED_LIST_ITEM)
    
  let DICTIONARY_ENTRY = _.sequence(
    lit('-'), _WS_,
    
    _.enclosed(
      _.empty,
      _.many(INLINE),
      _.sequence(lit(':'), _.choice(_WS_, _.at_end)).as(_.ignored_value),
    ).as(_.flattened_value),
    
    _.optional(
      FORMATTED_LINE
    )
    
  ).as(values => {
    let marker = values.shift()
    let key = values.shift()
    let text = values.shift()
    
    let last = text.pop()
    if (last && last.kind != T.END_OF_LINE_TOKEN) text.push(last)
    
    return DDM.dictionary_entry(key).at(marker.location).insert(...text)
  })
  
  let DICTIONARY = list(DDM.dictionary, DICTIONARY_ENTRY)
  
  let TABLE_CELL = _.enclosed(
    _WS_,
    _.many(INLINE),
    _.sequence(_WS_, lit('|')).as(_.ignored_value)
    
  ).as(values => {
    values = values[0]
    
    return DDM.table_cell().at(values[0].location).insert(...values)
  })
  
  let TABLE_ROW = _.sequence(
    lit('|'),
    // TODO At least one ?
    _.many(TABLE_CELL),
    _MAYBE_WS_,
    _.choice(EOLN, _.at_end)

  ).as(values => {
    let marker = values.shift()
    let cells = values.shift()
    
    return DDM.table_row().at(marker.location).add(...cells)
  })
  
  let TABLE = list(DDM.table, TABLE_ROW)
  
  let VERBATIM = block_of(
    _.many(
      _.enclosed(
        lit('>'),
        _.optional(_.sequence(WS, _.many(_.any)).as(_.flattened_value)),
        _.choice(EOLN, _.at_end)
      )
    )
    
  ).as(values => {
    values = values.shift()
    let marker = values[0][0]
    let text = []

    for (let line of values) {
      // Lose the marker
      line.shift()

      if (line.length > 0 && line[0] instanceof Array) {
        let content = line.shift()
        let ws = content.shift()

        if (ws.data.length > 1) {
          ws.data = ws.data.substring(1)
          ws.column += 1
          text.push(ws)
        }
        // Optional text
        if (content) text.push(...content)
      }

      // Optional eoln
      if (line.length > 0) text.push(line.shift())
    }
      
    return DDM.verbatim().at(marker.location).insert(...text)
  })
  
  function delineated(type, start_marker, end_marker) {
    end_marker = end_marker || start_marker
    return _.enclosed(
      start_marker,
      _.sequence(INLINE, _.many(INLINE)).as(_.flattened_value),
      end_marker
    
    ).as(values => {
      let marker = values.shift()
      let skipped = values.shift()
      
      return type().at(marker[0].location).insert(...skipped)
    })
  }
  
  let PLACEHOLDER = _.sequence(
    lit('_'), lit('_'), lit('_'), _.many(lit('_'))
    
  ).as(values => {
    return DDM.placeholder().at(values[0].location)
  })

  let EMPHASIS_MARKER = _.sequence(lit('_'), lit('_'))
  let EMPHASIS = delineated(DDM.emphasis, EMPHASIS_MARKER)
  
  let STRONG_MARKER = _.sequence(lit('*'), lit('*'))
  let STRONG = delineated(DDM.strong, STRONG_MARKER)
  
  let STRIKETHROUGH_MARKER = _.sequence(lit('~'), lit('~'))
  let STRIKETHROUGH = delineated(DDM.strikethrough, STRIKETHROUGH_MARKER)

  let SELECTION_START_MARKER = _.sequence(lit('<'), lit('<'))
  let SELECTION_END_MARKER = _.sequence(lit('>'), lit('>'))
  let SELECTION = delineated(DDM.selection, SELECTION_START_MARKER, SELECTION_END_MARKER)
  
  let INLINE_CODE_MARKER = _.sequence(lit('`')) // TODO Make use of sequence optional ?
  let INLINE_CODE = delineated(DDM.inline_code, INLINE_CODE_MARKER)

  let SLOT = _.enclosed(
    _.sequence(lit('{'), lit('{'), _MAYBE_WS_),
    _.sequence(
      WORD,
      _.many(
        _.sequence(WS, WORD).as(_.flattened_value)
      ).as(_.flattened_value)
    ).as(_.flattened_value),
    _.sequence(_MAYBE_WS_, lit('}'), lit('}'))
  
  ).as(values => {
    let marker = values.shift()
    let skipped = values.shift()
    
    return DDM.slot().at(marker[0].location).insert(...skipped)
  })

  INLINE.define(_.choice(
    PLACEHOLDER,
    EMPHASIS,
    STRONG,
    STRIKETHROUGH,
    INLINE_CODE,  // TODO Rename to FRAGMENT_CODE ?
    INLINE_MACRO, // TODO Rename to FRAGMENT_MACRO ?
    SELECTION,
    SLOT,
    _.any  // < this is a catch-all
  ))
  
  let PARAGRAPH = block_of(
    _.many(INLINE)
    
  ).as(values => {
    let skipped = values[0]
    return DDM.paragraph().at(skipped[0].location).insert(...skipped)
  })

  let HORIZONTAL_RULE = block_of(
    lit('-'), lit('-'), lit('-'), _.many(lit('-')).as(_.ignored_value),
    _MAYBE_EOLN_
  ).as(values => {
    let marker = values[0]
    
    return DDM.horizontal_rule().at(marker)
  })

  let BLOCK = _.choice(
    HEADING,
    MACRO,
    COMMENT,
    LIST,
    NUMBERED_LIST,
    DICTIONARY,
    TABLE,
    VERBATIM,
    HORIZONTAL_RULE,
    PARAGRAPH  // < this is a catch-all
  )

  function to_value(block) {
    let tokens = block.tokens
    let start = tokens[0]

    let token_stream = new _.Stream(_.from_list(tokens))

    let [stream, value] = BLOCK(token_stream)
    if (stream !== _.NO_MATCH) return value
    else return null
  }

  const LISTY_KINDS = ['list', 'numbered-list', 'dictionary']
  function is_listy(value) { return LISTY_KINDS.includes(value.kind) }

  function to_tree_of_values(tree_of_blocks) {
    if (!tree_of_blocks) return null
    let tree_of_values = to_value(tree_of_blocks)

    let target_value = null
    if (is_listy(tree_of_values))
      target_value = tree_of_values.items[tree_of_values.items.length - 1]
    else
      target_value = tree_of_values
    
    target_value.append(...tree_of_blocks.children.map(to_tree_of_values))

    return tree_of_values
  }
  
  function* trees_of_values(trees_of_blocks) {
    for (let tree_of_blocks of trees_of_blocks) {
      // console.log('BLOCKS: ', tree_of_blocks)
      let tree_of_values = to_tree_of_values(tree_of_blocks)
      // console.log('VALUES: ', tree_of_values)
      yield tree_of_values
    }
  }

  return {
    trees_of_values: trees_of_values,
    
    HEADING: HEADING,
    MACRO: MACRO,
    COMMENT: COMMENT,
    LIST: LIST,
    LIST_ITEM: LIST_ITEM,
    NUMBERED_LIST: NUMBERED_LIST,
    NUMBERED_LIST_ITEM: NUMBERED_LIST_ITEM,
    DICTIONARY: DICTIONARY,
    DICTIONARY_ENTRY: DICTIONARY_ENTRY,
    TABLE: TABLE,
    TABLE_ROW: TABLE_ROW,
    TABLE_CELL: TABLE_CELL,
    VERBATIM: VERBATIM,
    HORIZONTAL_RULE: HORIZONTAL_RULE,
    PARAGRAPH: PARAGRAPH,
    SELECTION: SELECTION,
    EMPHASIS: EMPHASIS,
    STRONG: STRONG,
    STRIKETHROUGH: STRIKETHROUGH,
    INLINE_CODE: INLINE_CODE,
    PLACEHOLDER: PLACEHOLDER,
    INLINE_MACRO: INLINE_MACRO,
    MACRO: MACRO,
    SLOT: SLOT,
  }
})
