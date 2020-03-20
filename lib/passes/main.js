const fs = require('fs')

define([
  'lib/main',
  'lib/passes/util',
  'lib/passes/generate',
  'lib/passes/complete',
  'lib/passes/ddm_to_dom',
  'lib/passes/dom_to_html',
  'lib/passes/json_stringify',
  'lib/passes/ddm_to_md',
  'lib/passes/console_log',
  'lib/passes/write_to_file'
], function(
  DoubleDown,
  UTIL,
  GENERATE,
  COMPLETE,
  DDM_TO_DOM,
  dom_to_html,
  json_stringify,
  ddm_to_md,
  console_log,
  write_to_file
) {
  
  function process(context) {
    let passes = []
    
    // Basic processing of DoubleDown documents...
    passes.push(GENERATE)
    passes.push(COMPLETE)

    // Followed by output specific steps...
    switch(context.format) {
      case 'html':
        passes.push(DDM_TO_DOM)
        passes.push(dom_to_html)
        // passes.push(console_log)
        passes.push(write_to_file)
        break
      case 'json':
        passes.push(json_stringify)
        // passes.push(console_log)
        passes.push(write_to_file)
        break
      case 'md':
        passes.push(ddm_to_md)
        // passes.push(console_log)
        passes.push(write_to_file)
        break
      default:
        return
    }
    
    let doubledown_text = fs.readFileSync(context.input_path, { encoding: context.encoding })
    let data = Array.from(DoubleDown.all_trees(doubledown_text))
    
    let blackboard = {}

    for (let p of passes) {
      context.pass = p
      context.clear_stack()
      
      let phase_start = p.start(context, blackboard)
      let phased = UTIL.remap(data, (d) => p.process(d, context, blackboard))
      let phase_end = p.end(context, blackboard)

      while(phase_start.length > 0) phased.unshift(phase_start.pop())
      while(phase_end.length > 0) phased.push(phase_end.shift())
      
      data = phased;
    }
    
    context.pass = null
  }
  

  return {
    process: process,
  }
})
