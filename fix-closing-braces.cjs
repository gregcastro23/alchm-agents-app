const fs = require('fs')
let content = fs.readFileSync('lib/demo-agents-data.ts', 'utf8')

// Remove extra closing braces that appear after array elements
content = content.replace(/      },\s*\n      },/g, '      },')

fs.writeFileSync('lib/demo-agents-data.ts', content)
console.log('Fixed extra closing braces')
