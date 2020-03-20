document.addEventListener('DOMContentLoaded', function() {
  console.log('Installing DND features...')
  
  for (let roll_element of document.getElementsByTagName('roll')) {
    let result_element = null
    let definition = roll_element.innerText
    
    roll_element.onmouseover = function() {
      if (!result_element) {
        result_element = document.createElement('div')
        result_element.classList.add('result');
        result_element.textContent = '?'
        roll_element.appendChild(result_element)
      }
    }
    
    roll_element.onclick = function(event) {
      event.stopPropagation()
      
      let steps = definition.split(/\s*\+\s*/)
      
      let dice_rolls = []
      let total = 0
      
      console.log('STEPS', steps)
      for (let step of steps) {
        if (step.match(/^\d+d\d+$/)) {
          let ds = step.split('d').map(d => parseInt(d))
          for (i = 0; i < ds[0]; i++) {
            let dice_roll = Math.ceil(Math.random() * ds[1])
            dice_rolls.push(dice_roll)
            total += dice_roll
          }
        }
        else if (step.match(/^\d+$/)) {
          let fixed_bonus = parseInt(step)
          dice_rolls.push(fixed_bonus)
          total += fixed_bonus
        }
      }
      
      console.log(definition, total, dice_rolls)
      if (result_element) result_element.innerText = '' + total
    }
  }
  
}, false)
