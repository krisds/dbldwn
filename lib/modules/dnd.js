define([
  'lib/passes/util',
  'lib/passes/generate',
  'lib/passes/ddm_to_dom',
  'lib/passes/dom_to_html',
  'lib/models/ddm',
  'lib/models/dom',
  'lib/util/args'
], function(
  UTIL, GENERATE, TO_DOM, TO_HTML, DDM, DOM, ARGS
) {
  
  let roll = () => DOM.e('roll')

  const ID = 'module.dnd'
  
  let DNDBEYOND_OPTIONS = ARGS.define().param('reference')
  
  function dndbeyond(tree, context, blackboard) {
    let args = DNDBEYOND_OPTIONS.capture(tree.args)
    
    // TODO Return a DOM fragment with the errors instead.
    if (args['_errors']) console.log(args['_errors'])
    
    let link = DDM.fragment_macro(
      ['link'],
      [['https://www.dndbeyond.com/' + args.reference]]
    ).insert(...tree.text)
    
    return [link]
  }
  
  // TODO Would rather have this in GEN ?
  function description(tree, _, context, blackboard) {
    return [
      DOM.div().attr('class', 'dnd-description')
        .append(...UTIL.remap(tree.children, t => TO_DOM.process(t, context, blackboard)))
    ]
  }
  
  // TODO Would rather have this in GEN ?
  function sidebar(tree, _, context, blackboard) {
    return [
      DOM.div().attr('class', 'dnd-sidebar')
        .append(...UTIL.remap(tree.children, t => TO_DOM.process(t, context, blackboard)))
    ]
  }
  
  function get_score(fragments) {
    if (!fragments) return null
    let text = DDM.raw_text(fragments).trim()
    if (text.match(/^\d+$/)) return parseInt(text)
    return null
  }
  
  function ability_elements(kind, score) {
    let text = null
    
    if (score == null)
      text = ['?? (??)']
    else {
      //  20 (+5)
      let modifier = Math.floor((score - 10)/2)
      text = [score, ' (', (modifier >= 0 ? '+' : ''), modifier, ')']
    }
    
    return [
      DOM.div().attr('class', 'dnd-attribute').append(
        DOM.h1().append(kind),
        DOM.p().append(...text)
      )
    ]
  }
  
  // TODO Would rather have this in GEN ?
  function statblock(tree, _, context, blackboard) {
    if (!tree.children || tree.children.length == 0) {
      console.log(ID + ': Empty statblock at ' + tree.location)
      return [DOM.e('error').append('Empty statblock at ' + tree.location)]
    }
    
    let remap = list => UTIL.remap(list, t => TO_DOM.process(t, context, blackboard))
    
    let statblock = DOM.div().attr('class', 'dnd-statblock')

    let index = 0
    
    if (index < tree.children.length && tree.children[index].kind == 'heading') {
      statblock.append(...remap([tree.children[index]]))
      index += 1
    }
    
    if (index < tree.children.length && tree.children[index].kind == 'dictionary') {
      let stats = {}
      DDM.copy_dictionary_into_object(tree.children[index], stats, { lowercase_keys: true })
      
      if (stats['race'] || stats['alignment']) {
        let meta = DOM.p().attr('class', 'meta')
        if (stats['race']) meta.append(...remap(stats['race'].text))
        if (stats['race'] && stats['alignment']) meta.append(', ')
        if (stats['alignment']) meta.append(...remap(stats['alignment'].text))
        statblock.append(meta)
      }
      
      statblock.append(DOM.hr())
      
      if (stats['ac'] || stats['hp'] || stats['speed']) {
        if (stats['ac']) {
          let ac = DOM.p().attr('class', 'stat')
          ac.append(DOM.b().append('Armor Class'), ' ')
          ac.append(...remap(stats['ac'].text))
          statblock.append(ac)
        }
        
        if (stats['hp']) {
          let hp = DOM.p().attr('class', 'stat')
          hp.append(DOM.b().append('Hit Points'), ' ')
          hp.append(...remap(stats['hp'].text))
          statblock.append(hp)
        }
        
        if (stats['speed']) {
          let speed = DOM.p().attr('class', 'stat')
          speed.append(DOM.b().append('Speed'), ' ')
          speed.append(...remap(stats['speed'].text))
          statblock.append(speed)
        }

        statblock.append(DOM.hr())
      }
      
      if (stats['str'] || stats['dex'] || stats['con']
       || stats['int'] || stats['wis'] || stats['cha']) {
        
        let str = get_score(stats['str'].text)
        let dex = get_score(stats['dex'].text)
        let con = get_score(stats['con'].text)
        let int = get_score(stats['int'].text)
        let wis = get_score(stats['wis'].text)
        let cha = get_score(stats['cha'].text)
        
        let abilities = DOM.div().attr('class', 'dnd-abilities')
        
        abilities.append(
          ...ability_elements('STR', str),
          ...ability_elements('DEX', dex),
          ...ability_elements('CON', con),
          ...ability_elements('INT', int),
          ...ability_elements('WIS', wis),
          ...ability_elements('CHA', cha)
        )
        
        statblock.append(DOM.p().append(abilities))
        statblock.append(DOM.hr())
      }
      index += 1
    }
    
    if (index < tree.children.length) {
      statblock.append(...UTIL.remap(tree.children.slice(index), t => TO_DOM.process(t, context, blackboard)))
    }
    
    return [statblock]
  }
  
  
  let ROLL_DICE_OPTIONS = ARGS.define().param('dice', ARGS.ONE,
    ARGS.matching(/^\d+d\d+(\+\d+d\d+)*(\+\d+)?$/))
  
  function roll_dice(tree, _, context, blackboard) {
    let args = ROLL_DICE_OPTIONS.capture(tree.args)
    
    // TODO Return a DOM fragment with the errors instead.
    if (args['_errors']) console.log(args['_errors'])
    
    return [
      roll().append(...UTIL.remap(tree.args[0], t => TO_DOM.process(t, context, blackboard)))
    ]
  }
  
  let DND_GENERATE = UTIL.module_registry(GENERATE.macros, 'dnd')
  DND_GENERATE.register('beyond', dndbeyond)
  
  let DND_TO_DOM = UTIL.module_registry(TO_DOM.macros, 'dnd')
  DND_TO_DOM.register('roll', roll_dice)
  DND_TO_DOM.register('description', description)
  DND_TO_DOM.register('sidebar', sidebar)
  DND_TO_DOM.register('statblock', statblock)

  TO_HTML.clear_resources()
  TO_HTML.add_resource('stylesheet', 'web/css/reset.css')
  TO_HTML.add_resource('stylesheet', 'https://fonts.googleapis.com/css?family=PT+Serif&display=swap')
  TO_HTML.add_resource('stylesheet', 'https://fonts.googleapis.com/css?family=Alegreya+SC&display=swap')
  TO_HTML.add_resource('stylesheet', 'https://fonts.googleapis.com/css?family=Lato&display=swap')
  
  TO_HTML.add_resource('stylesheet', 'web/dnd/css/dnd.css')
  TO_HTML.add_resource('javascript', 'web/dnd/js/dnd.js')
  
  return {
    id: ID,
  }
})
