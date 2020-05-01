const assert = require('assert')

define([], function() {

  function is_string(object) {
    return typeof object === 'string' || object instanceof String
  }

  function find_difference(expected_trees, actual_trees, path) {
    if (!actual_trees) return path
    if (expected_trees.length != actual_trees.length) return path + '.length'
    
    for (let i = 0; i < expected_trees.length; i++) {
      let expected = expected_trees[i]
      let actual = actual_trees[i]
      
      if (is_string(expected)) {
        if (actual.data != expected && actual != expected)
          return path + '.' + i
        
        continue
      }
      
      if (expected instanceof Array) {
        let diff = find_difference(expected, actual, path + '.' + i)
        if (diff != null) return diff
        continue
      }
      
      if (expected.kind != actual.kind)
        return path + '.' + i + '.kind'
      
      if (expected.level) {
        if (expected.level != actual.level)
          return path + '.' + i + '.level'
      } else if (actual.level)
        return path + '.' + i + '.level'
      
      if (expected.key) {
        if (!actual.key) return path + '.' + i + '.key'
        let diff = find_difference(expected.key, actual.key, path + '.' + i + '.key')
        if (diff) return diff
          
      } else if (expected.__key) {
        if (!actual.key) return path + '.' + i + '.key'
        if (expected.__key != actual.key.map(t => t.data).join('')) return path + '.' + i + '.key'

      } else if (actual.key)
        return path + '.' + i + '.key'
      
      if (expected.args) {
        let diff = find_difference(expected.args, actual.args, path + '.' + i + '.args')
        if (diff != null) return diff
      
      } else if (actual.args && actual.args.length > 0) {
        return path + '.' + i + '.args'
      }
      
      if (expected.items) {
        let diff = find_difference(expected.items, actual.items, path + '.' + i + '.items')
        if (diff != null) return diff
      
      } else if (actual.items && actual.items.length > 0) {
        return path + '.' + i + '.items'
      }
      
      if (expected.children) {
        let diff = find_difference(expected.children, actual.children, path + '.' + i + '.children')
        if (diff != null) return diff
      
      } else if (actual.children && actual.children.length > 0) {
        return path + '.' + i + '.children'
      }
      
      if (expected.text) {
        let diff = find_difference(expected.text, actual.text, path + '.' + i + '.text')
        if (diff != null) return diff
      }
      
      if (expected.__text) {
        if (expected.__text.join('\n') != actual.text.map(t => is_string(t) ? t : t.data).join(''))
          return path + '.' + i + '.text'
      }
      
      if (expected.__tokens) {
        if (expected.__tokens.join('\n') != actual.tokens.map(t => t.data).join(''))
          return path + '.' + i + '.tokens'
      }
    }
    
    return null
  }

  function difference_as_selector(diff) {
    let path = diff.split('.')
    
    return function(data) {
      for (let p of path) {
        if (p == '_')
          continue
        
        if (p.match(/^\d+$/)) {
          data = data[parseInt(p)]
          continue
        }
        
        data = data[p] || data['__' + p]
      }
      
      return data
    }
  }

  function test(name, input, process, expected) {
    let actual = process(input)
  
    let diff = find_difference(expected, actual, '_')
    if (diff == null)
      console.log('* PASS: ' +  name)
    else {
      console.log('* FAIL :', name)
      console.log('  * DIFF: ', diff)
      
      let select = difference_as_selector(diff)
      console.log('  * EXPECTED: >>' + select(expected) + '<<')
      console.log('  * ACTUAL: >>' + select(actual) + '<<')

      assert(diff == null, 'At: ' + diff + '. Expected: ' + select(expected) + '. Got: ' + select(actual) + '.')
    }
  }

  return {
    find_difference: find_difference,
    difference_as_selector: difference_as_selector,
    test: test,
  }
})
