define(['lib/passes/util'], function(P) {

  // Turns any data into equivalent JSON strings.

  return {
    id: 'JSON.stringify',
    
    in: 'any',
    dir: 'top-down',
    out: 'string',

    start: P.nothing,
    process: function (data, context, blackboard) {
      return [JSON.stringify(data, null, 2)]
    },
    end: P.nothing,
  }
})
