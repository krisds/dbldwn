const fs = require('fs')

define(['lib/passes/util'], function(P) {

  // Write lines to file.

  // TODO Track on context ? On blackboard ?
  let stream = null
  
  return {
    id: 'write_to_file',
    
    in: 'string',
    dir: 'top-down',
    out: 'none',
    
    start: function(context, blackboard) {
      // TODO Use context for this...
      stream = fs.createWriteStream(context.output_path, { encoding: context.encoding })
      return P.NOTHING
    },
    process: function (data, context, blackboard) {
      stream.write(data)
      stream.write('\n')
      return P.NOTHING
    },
    end: function(context, blackboard) {
      stream.end()
      stream = null
      return P.NOTHING
    },
  }
})
