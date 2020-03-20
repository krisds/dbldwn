define(['lib/models/ddm'], function(DDM) {
  
  // Turns DOM nodes into formatted strings.
  
  const ID = 'dbldwn.dom_to_html'
  
  let resources = [
    { type: 'stylesheet', url: 'https://fonts.googleapis.com/css?family=Caladea&display=swap' },
    { type: 'stylesheet', url: 'https://fonts.googleapis.com/css?family=Overpass+Mono&display=swap' },
    { type: 'stylesheet', url: 'web/css/reset.css' },
    { type: 'stylesheet', url: 'web/css/dbldwn.css' },
  ]
  
  function clear_resources() { resources = [] }
  
  function add_resource(type, url) {
    // TODO Check type is valid.
    resources.push({ type: type, url: url })
  }
  
  function html_start(context, blackboard) {
    let root = context.offset_path
    if (!root.endsWith('/')) root += '/'
    
    let start = [
      '<!doctype html>',
      '',
      '<html lang="en">',
      '<head>',
      '  <meta charset="utf-8">',
    ]

    if (blackboard['meta'] && blackboard['meta']['title'])
      start.push('  <title>' + DDM.raw_text(blackboard['meta']['title'].text) + '</title>')

    for (let r of resources) {
      let is_absolute = r.url.charAt(0) == '/' || r.url.indexOf('://') >= 0
      
      switch (r.type) {
        case 'stylesheet':
          start.push('  <link rel="stylesheet" href="' + (is_absolute ? '' : root) + r.url + '">')
          break
        case 'javascript':
          start.push('  <script type="text/javascript" src="' + (is_absolute ? '' : root) + r.url + '"></script>')
          break
        default:
          console.error(ID + ': unknown resource type "' + r.type + '"')
          break
      }
    }

    start.push(...[
      '</head>',
      '<body>',
    ])
  
    return start
  }

  let html_end = [
    '</body>',
    '</html>',
  ]


  return {
    id: ID,

    in: 'DOM',
    dir: 'top-down',
    out: 'string',

    clear_resources: clear_resources,
    add_resource: add_resource,

    start: html_start,
    process: function(element, context, blackboard) {
      return ['  ' + element.stringify(2, 2)]
    },
    end: (context, blackboard) => html_end,
  }
})
