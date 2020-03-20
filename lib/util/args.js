define(['lib/models/ddm'], function(DDM) {

  let MIN = 0
  let MAX = 1

  // Ranges. Values are inclusive !
  let ONE = [1, 1]
  let ONE_OR_MORE = [1, Infinity]
  let OPTIONAL = [0, 1]
  let MANY = [0, Infinity]

  let ACCEPT_ANY = (value) => true
  function matching(re) {
    return (value) => value.match(re)
  }
  
  function choice(...values) {
    return (value) => values.indexOf(value) >= 0
  }

  class Args {
    constructor() {
      this.params = []
      this.options = {}
    }
    
    param(name, range, validator_fn) {
      if (this.params.some(p => p.name == name))
        throw new Error('Duplicate definition of parameter: ' + name)
      if (this.options[name])
        throw new Error('Redefinition of option as parameter: ' + name)
      
      range = range || ONE
      validator_fn = validator_fn || ACCEPT_ANY
      
      this.params.push({
        name: name,
        range: range,
        validator_fn: validator_fn,
      })
      
      return this
    }
    
    option(name, range, validator_fn) {
      // TODO Make this case insensitive ?
      if (this.options[name])
        throw new Error('Duplicate definition of option: ' + name)
      if (this.params.some(p => p.name == name))
        throw new Error('Redefinition of parameter as option: ' + name)
      
      range = range || ONE
      validator_fn = validator_fn || ACCEPT_ANY
      
      this.options[name] = {
        name: name,
        range: range,
        validator_fn: validator_fn,
      }

      return this
    }
    
    capture(args) {
      args = args.map(a => DDM.raw_text(a))
      
      let result = {}
      let option = null
      
      function error(msg) {
        if (!result['_errors']) result['_errors'] = [msg]
        else result['_errors'].push(msg)
      }
      
      let ai = 0
      let pi = 0
      
      while (true) {
        if (ai >= args.length) break
        let value = args[ai]
        
        // Have we found an option ?
        if (this.options[value]) {
          // Yes. This one:
          option = this.options[value]
          
        } else if (option) {
          // Singular value or not ?
          if (option.range[MAX] == 1) {
            // Singular

            // Have we reached the quota for this option ?
            if (result[option.name]) {
              error('Too many values for option: ' + option.name)
              break

            } else if (!option.validator_fn(value)) {
              // TODO Include bad value ?
              error('Bad value for option: ' + option.name)
              break
              
            } else 
              result[option.name] = value
          
          } else {
            // Plural
            
            // TODO Test that it has not already been fulfilled.
            
            if (result[option.name]) result[option.name].push(value)
            else result[option.name] = [value]
          }

        } else {
          // Do we have a valid param slot ?
          if (pi >= this.params.length) {
            error('No parameter to assign this to: ' + value)
            break
          }
        
          // What param are we working on ?
          let param = this.params[pi]
        
          if (!param.validator_fn(value)) {
            // TODO Include bad value ?
            error('Bad value for param: ' + param.name)
            
            // TODO Skip param ???
            break
          }

          // Singular value or not ?
          if (param.range[MAX] == 1) {
            // Singular
            result[param.name] = value
            
            // Param fulfilled. Carry on to the next one.
            pi += 1
          
          } else {
            // Plural
            if (result[param.name]) result[param.name].push(value)
            else result[param.name] = [value]

            // Have we reached the quota for this parameter ?
            if (result[param.name].length >= param.range[MAX]) {
              // Yes. So param fulfilled. Carry on to the next one.
              pi += 1
            }
          }
        }
        
        
        ai += 1
      }
      
      // Do we have all params filled ?
      while (pi < this.params.length) {
        let param = this.params[pi]
        if (param.range[MIN] == 0) {
          // Optional, which is fine.
          
        } else if (param.range[MAX] == 1 || !result[param.name]) {
          // Singular or missing, which is not fine.
          error('Missing parameter: ' + param.name)
          
        } else if (result[param.name].length < param.range[MIN]) {
          // Plural, and not fulfilled, which is not fine.
          error('Incomplete parameter: ' + param.name)
        }

        pi += 1
      }
      
      // Do we have all options filled ?
      for (let name of Object.keys(this.options)) {
        let option = this.options[name]
        
        if (option.range[MIN] == 0) {
          // Optional, which is fine.
          
        } else if (option.range[MAX] == 1) {
          // Singular...
          if (!result[option.name]) {
            // And missing, which is not fine.
            error('Missing parameter: ' + option.name)
          }
          
        } else if (!result[option.name] || result[option.name].length < option.range[MIN]) {
          // Plural, and not fulfilled, which is not fine.
          error('Incomplete parameter: ' + option.name)
        }
      }
      
      // Have we processed all arguments ?
      if (ai < args.length)
        error('Trailing arguments: ' + args.slice(ai).join(', '))
      
      return result
    }
  }

  return {
    define: () => new Args(),
    
    ONE: ONE,
    ONE_OR_MORE: ONE_OR_MORE,
    OPTIONAL: OPTIONAL,
    MANY: MANY,
    
    matching: matching,
    choice: choice,
  }
})
