define(['lib/passes/util'], function(P) {

  // Logs all data to console, before passing it on again.

  return {
    id: 'console.log',

    in: 'any',
    out: 'in',
    dir: 'top-down',

    start: P.nothing,
    process: function (data, context, blackboard) {
      console.log(data)
      return [data]
    },
    end: P.nothing,
  }
})
