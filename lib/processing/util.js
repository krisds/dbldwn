const path = require('path')

define(['lib/models/ddm'], function(DDM) {
  
  function is_string(object) {
    return typeof object === 'string' || object instanceof String
  }


  function remap(list, mapper) {
    if (!list) return []
    let result = []
    
    for (d of list) {
      let remapped = mapper(d)
      result.push(...remapped)
    }
    
    return result
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




  function* in_reverse_order(list) {
    if (!list) return
      
    for (let i = list.length - 1; i >= 0; i--) yield list[i]
  }


  function fragments_match(fragments_a, fragments_b) {
    let index_a = 0
    let index_b = 0
    
    while (index_a < fragments_a.length && index_b < fragments_b.length) {
      let fragment_a = fragments_a[index_a]
      let fragment_b = fragments_b[index_b]
      
      // TODO What about escaped ?
      if (fragment_a.kind !== fragment_b.kind) return false
      
      // TODO Be lenient on whitespace. No exact match needed.
      if (fragment_a.data !== fragment_b.data) return false
      
      index_a += 1
      index_b += 1
    }
    
    if (index_a < fragments_a.length) return false
    if (index_b < fragments_b.length) return false
      
    return true
  }


  return {
    is_string: is_string,
    remap: remap,
    macro_registry: macro_registry,
    kind_registry: kind_registry,
    
    in_reverse_order: in_reverse_order,
    fragments_match: fragments_match,
  }
})
