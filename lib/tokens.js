define(['lib/models/ddm'], function(DDM) {

  const make_token = DDM.token

  const WHITESPACE_TOKEN = 'token:whitespace'
  const END_OF_LINE_TOKEN = 'token:end of line'
  const NUMERIC_TOKEN = 'token:numeric'
  const ALPHABETIC_TOKEN = 'token:alphabetic'
  const CHARACTER_TOKEN = 'token:character'
  const ESCAPED_TOKEN = 'token:escaped'

  function* tokens(readable) {
    let token = null
    let ready = []

    let line = 1
    let column = 1

    function found(kind, data, complete) {
      if (token && token.kind != kind) {
        ready.push(token)
        token = null
      }

      if (!token)
        token = make_token(kind, data).at_location(line, column)
      else if (kind == ESCAPED_TOKEN)
        token.data = data
      else
        token.data += data

      column += data.length

      if (complete) {
        ready.push(token)
        token = null
      }
    }

    function next_line() {
      line += 1
      column = 1
    }

    let escaped = false
    for (const c of readable) {
      if (escaped) {
        found(ESCAPED_TOKEN, c, true)
        escaped = false

      } else if (c == '\\') {
        found(ESCAPED_TOKEN, c)
        escaped = true

      } else if (c == '\r')
        found(END_OF_LINE_TOKEN, c)
      
      else if (c == '\n') {
        found(END_OF_LINE_TOKEN, c, true)
        next_line()
      
      } else if (' \t'.indexOf(c) >= 0)
        found(WHITESPACE_TOKEN, c)
      
      else if ('0123456789'.indexOf(c) >= 0)
        found(NUMERIC_TOKEN, c)
      
      else if ('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(c) >= 0)
        found(ALPHABETIC_TOKEN, c)
      
      else
        found(CHARACTER_TOKEN, c, true)
      
      while (ready.length > 0)
        yield ready.shift()
    }

    if (token)
      yield token
  }

  return {
    WHITESPACE_TOKEN: WHITESPACE_TOKEN,
    END_OF_LINE_TOKEN: END_OF_LINE_TOKEN,
    NUMERIC_TOKEN: NUMERIC_TOKEN,
    ALPHABETIC_TOKEN: ALPHABETIC_TOKEN,
    CHARACTER_TOKEN: CHARACTER_TOKEN,
    ESCAPED_TOKEN: ESCAPED_TOKEN,

    tokens: tokens,
  }
})
