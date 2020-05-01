define([], function() {

  class Location {
    constructor(line, column) {
      this.line = line || 0
      this.column = column || 0
    }
    
    toString() { return this.line + ':' + this.column }
  }

  class Node {
    constructor(kind) {
      this.kind = kind
      this.location = new Location()
    }
    
    at_location(line, column) {
      this.location.line = line
      this.location.column = column
      return this
    }
    
    at(location) {
      this.location.line = location.line
      this.location.column = location.column
      return this
    }
    
    toString() { return JSON.stringify(this) }
  }

  // FRAGMENTS ----------------------------------------------------------------
  
  class Fragment extends Node {
    constructor(kind) {
      super(kind)
    }
    
    raw_text() { return '' }
  }
  
  class Text extends Fragment {
    constructor(kind) {
      super(kind)
      this.text = []
    }
    
    insert(...fragments) {
      this.text.push(...fragments)
      return this
    }

    raw_text() { return this.text.map(f => f.raw_text()).join('') }
  }

  class Token extends Fragment {
    constructor(kind, data) {
      super(kind)
      this.data = data
    }
    
    raw_text() { return this.data }
  }
  
  class Selection extends Text { constructor() { super('selection') } }
  class InlineCode extends Text { constructor() { super('inline-code') } }
  class Emphasis extends Text { constructor() { super('emphasis') } }
  class Strong extends Text { constructor() { super('strong') } }
  class Strikethrough extends Text { constructor() { super('strikethrough') } }
  class Placeholder extends Fragment { constructor() { super('placeholder') } }

  class FragmentMacro extends Text {
    constructor(key, args) {
      super('macro')
      this.key = key
      this.args = args
    }
  }
  
  class Slot extends Text { constructor() { super('slot') } }
   
  // BLOCKS -------------------------------------------------------------------
  
  // abstract
  class Block extends Node {
    constructor(kind) {
      super(kind)
      this.children = []

      // TODO Not sure this is the best solution...
      this.parent = null
    }
    
    // TODO Rename to 'nest'
    append(...blocks) {
      blocks.forEach(b => { b.parent = this })
      this.children.push(...blocks)
      return this
    }
    
    copy_core(other) {
      this.kind = other.kind
      this.location = other.location
      this.children = []
    }
    
    clone_core() {
      let the_clone = Object.create(Object.getPrototypeOf(this))
      the_clone.copy_core(this)
      return the_clone
    }
  }
  
  class Document extends Block { constructor() { super('document') } }
  
  class TextBlock extends Block {
    constructor(kind) {
      super(kind)
      this.text = []
    }
    
    insert(...fragments) {
      this.text.push(...fragments)
      return this
    }
    
    raw_text() { return this.text.map(f => f.raw_text()).join('') }
    
    copy_core(other) {
      super.copy_core(other)
      this.text = []
    }
  }
  
  class ItemBlock extends Block {
    constructor(kind) {
      super(kind)
      this.items = []
    }
    
    add(...blocks) {
      this.items.push(...blocks)
      return this
    }
    
    copy_core(other) {
      super.copy_core(other)
      this.items = []
    }
  }

  class Heading extends TextBlock {
    constructor(level) {
      super('heading')
      this.level = level
    }
    
    copy_core(other) {
      super.copy_core(other)
      this.level = other.level
    }
  }

  class HorizontalRule extends Block { constructor() { super('horizontal-rule') } }
  class Comment extends TextBlock { constructor() { super('comment') } }
  
  class List extends ItemBlock {
    constructor() { super('list') }
    
    join(continued) {
      // TODO this and continued children ??
      this.items.push(...continued.items)
    }
  }
  
  class ListItem extends TextBlock { constructor() { super('list-item') } }
  
  class NumberedList extends ItemBlock {
    constructor() { super('numbered-list') }
    
    join(continued) {
      // TODO this and continued children ??
      this.items.push(...continued.items)
    }
  }
  
  class NumberedListItem extends TextBlock { constructor() { super('numbered-list-item') } }
  
  // TODO Assert appended things are of right item type ?
  class Dictionary extends ItemBlock {
    constructor() { super('dictionary') }
    
    join(continued) {
      // TODO this and continued children ??
      this.items.push(...continued.items)
    }
  }

  class DictionaryEntry extends TextBlock {
    constructor(key) {
      super('dictionary-entry')
      this.key = key
    }

    copy_core(other) {
      super.copy_core(other)
      // TODO Should clone key ?
      this.key = other.key
    }
  }

  class BlockMacro extends Block {
    constructor(key, args) {
      super('macro')
      this.key = key
      this.args = args
    }

    copy_core(other) {
      super.copy_core(other)
      // TODO Should clone key ?
      this.key = other.key
      // TODO Should clone args ?
      this.args = other.args
    }
  }
  
  // TODO Assert appended things are of right item type ?
  class Table extends ItemBlock {
    constructor() { super('table') }
    
    join(continued) {
      // TODO this and continued children ??
      this.items.push(...continued.items)
    }
  }
  
  class TableRow extends ItemBlock { constructor() { super('row') } }
  class TableCell extends TextBlock { constructor() { super('cell') } }
  
  class Verbatim extends TextBlock { constructor() { super('verbatim') } }
  class Paragraph extends TextBlock { constructor() { super('paragraph') } }
  
  // --------------------------------------------------------------------------
  
  class Anchor extends Fragment {
    constructor(label) {
      super('anchor')
      // TODO this.label = ... instead of:
      this.key = [label]
    }
  }
  
  function anchor(label) { return new Anchor(label) }

  // --------------------------------------------------------------------------

  function token(kind, data) { return new Token(kind, data) }
  
  // TODO Why can't I use instanceof ???
  function is_token(node) { return node.data != null }

  function selection() { return new Selection() }
  function inline_code() { return new InlineCode() }
  function emphasis() { return new Emphasis() }
  function strong() { return new Strong() }
  function strikethrough() { return new Strikethrough() }
  function placeholder() { return new Placeholder() }
  function fragment_macro(key, args) { return new FragmentMacro(key, args) }
  function slot() { return new Slot() }


  function document() { return new Document() }
  function heading(level) { return new Heading(level) }
  function horizontal_rule() { return new HorizontalRule() }
  function comment() { return new Comment() }

  function list() { return new List() }
  function list_item() { return new ListItem() }

  function numbered_list() { return new NumberedList() }
  function numbered_list_item() { return new NumberedListItem() }

  function dictionary() { return new Dictionary() }
  function dictionary_entry(key) { return new DictionaryEntry(key) }
  
  function table() { return new Table() }
  function table_row() { return new TableRow() }
  function table_cell() { return new TableCell() }
  
  function verbatim() { return new Verbatim() }
  function paragraph() { return new Paragraph() }
  
  function block_macro(key, args) { return new BlockMacro(key, args) }


  function is_string(object) {
    return typeof object === 'string' || object instanceof String
  }

  // TODO Can get rid of this ?
  function raw_text(fragments) {
    return fragments.map(f => is_string(f) ? f : f.raw_text()).join('')
  }

  function copy_dictionary_into_object(dictionary_tree, object, options) {
    lowercase = options && 'lowercase_keys' in options ? options['lowercase_keys'] : false
    for (let entry of dictionary_tree.items) {
      let key = raw_text(entry.key)
      if (lowercase) key = key.toLowerCase()
      object[key] = { text: entry.text, children: entry.children }
    }
  }


  return {
    token: token,
    is_token: is_token,

    selection: selection,
    inline_code: inline_code,
    emphasis: emphasis,
    strong: strong,
    strikethrough: strikethrough,
    placeholder: placeholder,
    fragment_macro: fragment_macro,
    slot: slot,

    document: document,
    heading: heading,
    horizontal_rule: horizontal_rule,
    comment: comment,
    list: list,
    list_item: list_item,
    numbered_list: numbered_list,
    numbered_list_item: numbered_list_item,
    dictionary: dictionary,
    dictionary_entry: dictionary_entry,
    table: table,
    table_row: table_row,
    table_cell: table_cell,
    table_row: table_row,
    verbatim: verbatim,
    paragraph: paragraph,
    block_macro: block_macro,
    
    anchor: anchor,
    
    raw_text: raw_text,
    copy_dictionary_into_object: copy_dictionary_into_object,
  }
})
