define(['./tokens'], function(T) {

  class ProtoBlock {
    constructor(level, tokens) {
      this.level = level
      this.children = []
      this.tokens = tokens
    }
  }

  function is_empty(line) {
    return line.every(token =>
      token.kind == T.WHITESPACE_TOKEN || token.kind == T.END_OF_LINE_TOKEN
    )
  }
  
  function without_trailing_eoln(block) {
    let last = block.tokens.length - 1
    if (last >= 0 && block.tokens[last].kind == T.END_OF_LINE_TOKEN)
      block.tokens.pop()
    return block
  }

  function get_level(line) {
    if (line.length == 0) return 0
    let start = line[0]
    if (start.kind != T.WHITESPACE_TOKEN) return 0
    return start.data.length
  }
  
  function* blocks(tokens) {
    let block = null
    let line = []

    while (true) {
      let next = tokens.next()

      let token = null
      if (!next.done) {
        token = next.value
        line.push(token)
      }

      if (token == null || token.kind == T.END_OF_LINE_TOKEN) {
        if (is_empty(line)) {
          if (block) yield without_trailing_eoln(block)
          block = null
          line = []

        } else if (block == null) {
          let level = get_level(line)
          if (level > 0) line.shift()  // Lose leading T.WHITESPACE_TOKEN.
          block = new ProtoBlock(level, line)
          line = []

        } else if (block.level == get_level(line)) {
          if (block.level > 0) line.shift()  // Lose leading T.WHITESPACE_TOKEN.
          block.tokens.push(...line)
          line = []

        } else {
          yield without_trailing_eoln(block)
          let level = get_level(line)
          if (level > 0) line.shift()  // Lose leading T.WHITESPACE_TOKEN.
          block = new ProtoBlock(level, line)
          line = []
        }

        if (token == null) {
          if (block) yield without_trailing_eoln(block)
          return
        }
      }
    }
  }

  function* trees_of_blocks(blocks) {
    let stack = []

    while (true) {
      let next = blocks.next()

      if (next.done) {
        while (stack.length > 1) stack.pop()
        yield stack.pop()
        break
      }

      let block = next.value

      while (stack.length > 1 && stack[stack.length - 1].level >= block.level)
        stack.pop()
      
      if (stack.length == 1 && stack[0].level >= block.level)
        yield stack.pop()
      
      if (stack.length > 0)
        stack[stack.length - 1].children.push(block)
      
      stack.push(block)
    }
  }

  return {
    blocks: blocks,
    trees_of_blocks: trees_of_blocks,
  }
})
