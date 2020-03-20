const path = require("path")
const requirejs = require('requirejs')

requirejs.config({
    baseUrl: path.join(__dirname, '..', ),
    nodeRequire: require
})

const assert = require('assert')

requirejs(['lib/models/dom'], function(dom) {

  let text =  dom.text
  let h1 =  dom.h1
  let h2 =  dom.h2
  let h3 =  dom.h3
  let h4 =  dom.h4
  let h5 =  dom.h5
  let h6 =  dom.h6
  let p =  dom.p
  let a =  dom.a
  let li =  dom.li
  let ul =  dom.ul
  let ol =  dom.ol
  let pre =  dom.pre
  let b =  dom.b
  let i =  dom.i
  let span =  dom.span
  let hr =  dom.hr
  let table = dom.table
  let thead = dom.thead
  let tbody = dom.tbody
  let tr = dom.tr
  let td = dom.td
  let th = dom.th
  let div = dom.div
  let img = dom.img
  let e =  dom.e
  
  function test(name, element, expected) {
    let stringified = element.stringify(2)
    if (expected == stringified) {
      console.log('* PASS: ' + name)
    }
    else {
      console.log('* FAIL : ' + name)
      console.log('  * EXPECTED: ', expected)
      console.log('  * GOT: ', stringified)
    }
  
    assert(expected == stringified)
  }
  
  console.log('# DOM')
  console.log()
  
  test('§', text('DoubleDown'), 'DoubleDown')
  test('§(escaped)', text('<">&\''), '&lt;"&gt;&amp;\'')
  
  test('h1', h1(), '<h1></h1>')
  test('h2 / §', h2().append('The Raven'), '<h2>The Raven</h2>')
  
  test('p', p(), '<p></p>')
  test('p / §', p().append('DoubleDown'), '<p>DoubleDown</p>')
  
  test('a', a(), '<a></a>')
  test('a / §', a().append('DoubleDown'), '<a>DoubleDown</a>')
  
  test('a[href]', a().attr('href', 'poe'), '<a href="poe"></a>')
  test('a[href:escaped]', a().attr('href', '<">&\''), '<a href="&lt;&quot;&gt;&amp;&#39;"></a>')
  
  test('h3 / a[id] §', h3().append(a().attr('id', 'raven'), 'The Raven'), '<h3><a id="raven"></a>The Raven</h3>')
  
  test('p / § a §',
    p().append('Once upon a ', a().append('midnight'), ' dreary,'),
    '<p>Once upon a <a>midnight</a> dreary,</p>')
  
  test('p / § a[href] §',
    p().append('Once upon a ', a().attr('href', 'poe').append('midnight'), ' dreary,'),
    '<p>Once upon a <a href="poe">midnight</a> dreary,</p>')
  
  test('li', li(), '<li></li>')
  test('li / §', li().append('One'), '<li>One</li>')
  
  test('ul', ul(), '<ul></ul>')
  test('ul / li / §',
    ul().append(li().append('One')), 
    [ '<ul>',
      '  <li>One</li>',
      '</ul>'
    ].join('\n'))
  
  test('ul / (li / §) (li / §)',
    ul().append(li().append('One'), li().append('Two')), 
    [ '<ul>',
      '  <li>One</li>',
      '  <li>Two</li>',
      '</ul>'
    ].join('\n'))
  
  test('ol', ol(), '<ol></ol>')
  test('ol / li / §',
    ol().append(li().append('One')), 
    [ '<ol>',
      '  <li>One</li>',
      '</ol>'
    ].join('\n'))
  
  test('ol / (li / §) (li / §)',
    ol().append(li().append('One'), li().append('Two')), 
    [ '<ol>',
      '  <li>One</li>',
      '  <li>Two</li>',
      '</ol>'
    ].join('\n'))
  
  test('ul / li / ol / li / §',
    ul().append(li().append(ol().append(li().append('One')))), 
    [ '<ul>',
      '  <li><ol>',
      '    <li>One</li>',
      '  </ol></li>',
      '</ul>'
    ].join('\n'))
  
  test('p / § (ul / li / §) §',
    p().append('Once upon a ', ul().append(li().append('midnight')), ' dreary,'), 
    [ '<p>Once upon a <ul>',
      '  <li>midnight</li>',
      '</ul> dreary,</p>'
    ].join('\n'))
  
  test('pre', pre(), '<pre></pre>')
  test('pre > §', 
    pre().append('Once upon a midnight dreary,'),
    '<pre>Once upon a midnight dreary,</pre>')
  
  test('pre > (§ \\n)+',
    pre().append(
      'Once upon a midnight dreary, while I pondered, weak and weary,\n', 
      'Over many a quaint and curious volume of forgotten lore—\n', 
      '    While I nodded, nearly napping, suddenly there came a tapping,\n', 
      'As of some one gently rapping, rapping at my chamber door.\n', 
      '"\'Tis some visitor," I muttered, "tapping at my chamber door—\n', 
      '            Only this and nothing more."'
    ), 
    [ '<pre>Once upon a midnight dreary, while I pondered, weak and weary,', 
      'Over many a quaint and curious volume of forgotten lore—', 
      '    While I nodded, nearly napping, suddenly there came a tapping,', 
      'As of some one gently rapping, rapping at my chamber door.', 
      '"\'Tis some visitor," I muttered, "tapping at my chamber door—', 
      '            Only this and nothing more."</pre>'
    ].join('\n'))
  
  test('b', b(), '<b></b>')
  test('b / §', b().append('The Raven'), '<b>The Raven</b>')
  
  test('i', i(), '<i></i>')
  test('i / §', i().append('Poe'), '<i>Poe</i>')
  
  test('e', e('quoth'), '<quoth></quoth>')
  test('e / §', e('quoth').append('Nevermore'), '<quoth>Nevermore</quoth>')
  
  test('table', table(), '<table></table>')
  test('table / thead tbody',
    table().append(thead(), tbody()),
    [ '<table>',
      '  <thead></thead>',
      '  <tbody></tbody>',
     '</table>'
    ].join('\n'))
  
  test('table / (thead / tr / th / §) (tbody / tr / td / §)',
    table().append(
      thead().append(tr().append(th().append('The Raven'))),
      tbody().append(tr().append(td().append('Nevermore')))
    ),
    [ '<table>',
      '  <thead>',
      '    <tr>',
      '      <th>The Raven</th>',
      '    </tr>',
      '  </thead>',
      '  <tbody>',
      '    <tr>',
      '      <td>Nevermore</td>',
      '    </tr>',
      '  </tbody>',
     '</table>'
    ].join('\n'))
  
  test('div', div(), '<div></div>')
  test('div / p / §', div().append(p().append('The Raven')), [
    '<div>',
    '  <p>The Raven</p>',
    '</div>'
  ].join('\n'))
  test('div[class]', div().attr('class', 'poem'), '<div class="poem"></div>')
  
  test('img[src]', img().attr('src', 'the-raven.png'), '<img src="the-raven.png"></img>')

  test('img[src, style]',
    img().attr('src', 'the-raven.png').style('width', '80%'),
    '<img src="the-raven.png" style="width: 80%"></img>')
  
  test('img[src, style*]',
    img().attr('src', 'the-raven.png').style('width', '80%').style('border', '1px solid black'),
    '<img src="the-raven.png" style="border: 1px solid black; width: 80%"></img>')
  
  console.log()
  
})