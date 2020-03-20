const path = require('path')

define(['lib/models/ddm'], function(DDM) {
  
  function is_string(object) {
    return typeof object === 'string' || object instanceof String
  }

  const NOTHING = []
  function nothing() { return NOTHING }
  
  function remap(list, mapper) {
    if (!list) return []
    let result = []
    
    for (d of list) {
      let remapped = mapper(d)
      result.push(...remapped)
    }
    
    return result
  }
  
  // TODO Have tests for this.
  // TODO Better place for this ? Maybe in DDM ?
  function matching(text_a, text_b) {
    let index_a = 0
    let index_b = 0
    
    while (index_a < text_a.length && index_b < text_b.length) {
      let item_a = text_a[index_a]
      let item_b = text_b[index_b]
      
      // TODO What about escaped ?
      if (item_a.kind !== item_b.kind) return false
      
      // TODO Be lenient on whitespace. No exact match needed.
      if (item_a.data !== item_b.data) return false
      
      index_a += 1
      index_b += 1
    }
    
    if (index_a < text_a.length) return false
    if (index_b < text_b.length) return false
      
    return true
  }
  
  // TODO Variant of above, but starts_with, with (optional) index
  // ^ A match should return the length of the match.
  function starts_with(text, index, pattern) {
    let index_a = index
    let index_b = 0
    
    while (index_a < text.length && index_b < pattern.length) {
      let item_a = text[index_a]
      let item_b = pattern[index_b]
      
      // TODO What about escaped ?
      if (item_a.kind !== item_b.kind) return 0
      
      // TODO Be lenient on whitespace. No exact match needed.
      if (item_a.data !== item_b.data) return 0
      
      index_a += 1
      index_b += 1
    }
    
    if (index_b < pattern.length) return 0
      
    return index_a - index
  }
  
  
  class Frame {
    constructor() {
      this.definitions = []
      this.replacements = []
    }
    
    add_definition(entry) {
      this.definitions.push({
        key: entry.key,
        value: {
          text: entry.text,
          children: entry.children
        }
      })
    }
    
    // TODO Allow a function to be passed. Modules could do smarter things.
    add_replacement(entry) {
      // TODO Make a class for this (and for definitions).
      this.replacements.push({
        key: entry.key,
        value: {
          text: entry.text,
          // TODO Any use ? children: entry.children
        },
        activations: 0
      })
    }
  }
  
  class Context {
    constructor(cwd, input_path, encoding, format, output_path) {
      this.cwd = cwd
      this.input_path = input_path
      this.encoding = encoding
      this.format = format
      this.output_path = output_path

      let output_dir = path.dirname(output_path)
      this.offset_path = path.normalize(path.relative(output_dir, cwd))
      
      this.stack = null
      this.pass = null
    }
    
    clear_stack() { this.stack = [ new Frame() ] }
    current_frame() { return this.stack[this.stack.length - 1] }
    
    resolve(key) {
      for (let i = this.stack.length - 1; i >= 0; i--) {
        let frame = this.stack[i]
        
        for (let j = frame.definitions.length - 1; j >= 0; j--) {
          let entry = frame.definitions[j]
          
          if (matching(key, entry.key))
            return entry.value
        }
      }

      return null
    }
    
    fork(input_path) {
      let context = new Context(this.cwd, input_path, this.encoding, this.format, this.output_path)
      context.stack = this.stack
      context.pass = this.pass
      return context
    }
  }
  
  function context(cwd, input_path, encoding, format, output_path) {
    return new Context(cwd, input_path, encoding, format, output_path)
  }
  
  class Registry {
    constructor(get_key, default_entry, on_redefine) {
      this.entries = {}
      
      this.get_key = get_key
      this.default_entry = default_entry
      this.on_redefine = on_redefine
    }
    
    register(name, fn) {
      if (this.entries[name])
        this.on_redefine(name)
      
      this.entries[name] = fn
    }
    
    resolve(object) {
      let key = this.get_key(object)
      if (this.entries[key]) {
        let value = this.entries[key]
        if (value instanceof Registry)
          return value.resolve(object, 0)
        else
          return value
      }
      else return this.default_entry
    }
  }
  
  function key_macro(object) { return DDM.raw_text(object.key) }

  function macro_registry(default_entry, on_redefine) {
    if (!on_redefine)
      on_redefine = (name) => { console.warn('[WARN] Redefining \'' + name + '\'. ') }
    return new Registry(key_macro, default_entry, on_redefine)
  }
  
  function key_kind(object) { return object.kind }

  function kind_registry(default_entry, on_redefine) {
    if (!on_redefine)
      on_redefine = (name) => { console.warn('[WARN] Redefining \'' + name + '\'. ') }
    return new Registry(key_kind, default_entry, on_redefine)
  }
  
  
  
  function rescope(index, fn) {
    return function(macro, ...args) {
      let rescoped_macro = null
      
      // TODO Ugly way of doing this...
      if (macro.text != null)
        rescoped_macro
          = DDM.fragment_macro(macro.args[index], macro.args.slice(index+1))
            .insert(...macro.text)
      else
        rescoped_macro
          = DDM.block_macro(macro.args[index], macro.args.slice(index+1))
            .append(...macro.children)
        
      return fn(rescoped_macro, ...args)
    }
  }
  
  class ModuleRegistry extends Registry {
    constructor(parent_registry, module_name) {
      super(
        null,
        leave_unchanged,
        (name) => { console.warn('[WARN] Redefining \'' + name + '\'. ') }
      )
      
      this.parent_registry = parent_registry
      this.module_name = module_name
    }
    
    register(name, fn) {
      super.register(name, fn)
      this.parent_registry.register(name, fn)
    }
    
    resolve(object, index) {
      let key = DDM.raw_text(object.args[index])
      
      if (this.entries[key]) {
        let value = this.entries[key]
        if (value instanceof ModuleRegistry)
          return value.resolve(object, index + 1)
        else
          return rescope(index, value)
      }
      else return this.default_entry
    }
  }

  function module_registry(parent_registry, module_name) {
    let reg = new ModuleRegistry(parent_registry, module_name)
    parent_registry.register(module_name, reg)
    return reg
  }



  function leave_unchanged(node, context, blackboard) { return [node] }

  class Pass {
    constructor(options) {
      this.id = options.id

      this.in = options.in
      this.out = options.out

      this.start = options.start || nothing
      this.process = options.process
      this.end = options.end || nothing
      
      this.string_processing = options.string_processing || leave_unchanged
      this.token_processing = options.token_processing || leave_unchanged

      this.processing = kind_registry(
        leave_unchanged, 
        kind => {
          console.warn('[WARN] Redefining processing for \'' + kind + '\' (phase: ' + this.id + '). ')
        }
      )
      
      // TODO Split into block and fragment macros ?
      this.macros = macro_registry(
        leave_unchanged, 
        name => {
          console.warn('[WARN] Redefining macro \'' + name + '\' (phase: ' + this.id + '). ')
        }
      )
    }

    processing_for(node) {
      if (is_string(node)) return this.string_processing
      else if (DDM.is_token(node)) return this.token_processing
      else if (node.kind == 'macro') return this.macros.resolve(node)
      else return this.processing.resolve(node)
    }

    process_node(node, context, blackboard) {
      return this.processing_for(node)(node, context, blackboard)
    }
  }

  let pp = true
  function top_down(tree, context, blackboard) {
    let ff = pp

    // TODO Why does placing this here break slots ?
    // Because elements should be expanded/applied into their current context.
    // If we create a new scope for each element, their effects would be thrown out straight after...
    // Think of it like executing statements. We don't scope by statement either...
    // context.stack.push(new Frame())
      
    let remapped = context.pass.process_node(tree, context, blackboard)

    context.stack.push(new Frame())
    
    remapped.forEach(r => {
      // Children before text and items ! ~slots
      if (r.children) r.children = remap(r.children, c => top_down(c, context, blackboard))
      
      // TODO We only really need this in GENERATE...
      if (r.text) {
        if (pp)
          r.text = preprocess_and_remap(r.text, context, blackboard)
        else
          r.text = remap(r.text, t => top_down(t, context, blackboard))
      }
      
      if (r.items) r.items = remap(r.items, c => top_down(c, context, blackboard))
    })
    
    pp = ff
    
    context.stack.pop()

    return remapped
  }



  function preprocess_and_remap(text, context, blackboard) {
    if (!text || text.length == 0) return text
    
    let new_text = []
    let index = 0

    replacing:
    while (index < text.length) {

      for (f = context.stack.length - 1; f >= 0; f--) {
        let frame = context.stack[f]

        for (let r = frame.replacements.length - 1; r >= 0; r--) {
          let replacement = frame.replacements[r]

          if (replacement.activations > 0)
            continue

          let match = starts_with(text, index, replacement.key)

          if (match > 0) {
            replacement.activations += 1

            new_text.push(...remap(replacement.value.text, t => top_down(t.clone(), context, blackboard)))
            // TODO replacement.children for anything ??
            // TODO Should we try matching the replacement text again ?

            replacement.activations -= 1

            index += match
            continue replacing
          }
        }
      }

      // No matching replacement. Skip one.
      new_text.push(...remap([text[index]], t => top_down(t, context, blackboard)))
      index += 1
    }

    return new_text
  }

  function pass(options) {
    return new Pass(options)
  }

  return {
    is_string: is_string,

    NOTHING: NOTHING,
    nothing: nothing,

    remap: remap,
    
    context: context,
    macro_registry: macro_registry,
    kind_registry: kind_registry,
    module_registry: module_registry,
    
    pass: pass,
    top_down: top_down,
  }
})
