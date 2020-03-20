define([], function() {

  function is_string(object) {
    return typeof object === 'string' || object instanceof String
  }
  
  function is_number(object) {
    return typeof object === 'number'
  }

  // https://stackoverflow.com/questions/7381974/which-characters-need-to-be-escaped-in-html

  function escape_attribute(str) {
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function escape_text(str) {
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  // Convert strings into Text
  function nodify(object) {
    if (is_string(object)) return new Text(object)
    else if (is_number(object)) return new Text('' + object)
    else return object
  }

  class Node {
    // n == indent step (default 2)
    // d == overall indent (default 0)
    stringify(n, d) { throw new Error('Not implemented.') }
    raw_text() { return '' }
  }

  class Text extends Node {
    constructor(text) {
      super()
      this.text = text
    }
  
    stringify() { return escape_text(this.text) }
    raw_text() { return this.text }
  }

  class Element extends Node {
    // options.break => split children over lines, one per line, properly indented
    constructor(tag, options) {
      super()
      this.tag = tag
      this.attributes = {}
      this.styles = {}
      this.children = []
    
      this._break = options && options['break'] || false
    }
  
    attr(name, value) {
      // TODO Warn about overwrite ?
      this.attributes[name] = value
      return this
    }
    
    style(name, value) {
      // TODO Warn about overwrite ?
      this.styles[name] = value
      return this
    }

    append(...nodes_or_strings) {
      this.children.push(...nodes_or_strings.map(nodify))
      return this
    }
  
    stringify(n, d) {
      n = n || 2
      d = d || 0
      let cd = this._break ? d + n : d
    
      let parts = []
    
      parts.push('<' + this.tag)
    
      let attributeNames = Object.keys(this.attributes).sort()
      if (attributeNames.length > 0) {
        for (let name of attributeNames) {
          parts.push(' ')
          parts.push(name)
          parts.push('="')
          parts.push(escape_attribute(this.attributes[name]))
          parts.push('"')
        }
      }
      
      let styleNames = Object.keys(this.styles).sort()
      if (styleNames.length > 0) {
        parts.push(' style="')
        
        for (let i = 0; i < styleNames.length; i++) {
          let name = styleNames[i]
          if (i > 0) parts.push('; ')
          parts.push(name)
          parts.push(': ')
          parts.push(escape_attribute(this.styles[name]))
        }
        
        parts.push('"')
      }
      
      parts.push('>')
    
      for (let c of this.children.map(c => c.stringify(n, cd))) {
        if (this._break) {
          parts.push('\n')
          for (let i = 0; i < cd; i++) parts.push(' ')
        }
        parts.push(c)
      }
    
      if (this._break && this.children.length > 0) {
        parts.push('\n')
        for (let i = 0; i < d; i++) parts.push(' ')
      }
      parts.push('</' + this.tag + '>')
    
      return parts.join('')
    }
    
    raw_text() { return this.children.map(c => c.raw_text()).join('') }
  }

  function text(text) { return new Text(text) }
  function h1() { return new Element('h1') }
  function h2() { return new Element('h2') }
  function h3() { return new Element('h3') }
  function h4() { return new Element('h4') }
  function h5() { return new Element('h5') }
  function h6() { return new Element('h6') }
  function p() { return new Element('p') }
  function a() { return new Element('a') }
  function li() { return new Element('li') }
  function ul() { return new Element('ul', { break: true }) }
  function ol() { return new Element('ol', { break: true }) }
  function pre() { return new Element('pre') }
  function b() { return new Element('b') }
  function i() { return new Element('i') }
  function span() { return new Element('span') }
  function hr() { return new Element('hr') }
  function table() { return new Element('table', { break: true }) }
  function thead() { return new Element('thead', { break: true }) }
  function tbody() { return new Element('tbody', { break: true }) }
  function tr() { return new Element('tr', { break: true }) }
  function td() { return new Element('td') }
  function th() { return new Element('th') }
  function div() { return new Element('div', { break: true }) }
  function img() { return new Element('img') }

  function e(tag, options) { return new Element(tag, options) }

  return {
    text: text,
    h1: h1,
    h2: h2,
    h3: h3,
    h4: h4,
    h5: h5,
    h6: h6,
    p: p,
    a: a,
    li: li,
    ul: ul,
    ol: ol,
    pre: pre,
    b: b,
    i: i,
    span: span,
    hr: hr,
    table: table,
    thead: thead,
    tbody: tbody,
    tr: tr,
    td: td,
    th: th,
    e: e,
    div: div,
    img: img,
  }
})
