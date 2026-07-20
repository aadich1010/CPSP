const fs = require('fs');
let content = fs.readFileSync('src/components/PremiumResultScreen.tsx', 'utf8');
content = content.replace(/\\\`/g, '\`').replace(/\\\$/g, '$');
fs.writeFileSync('src/components/PremiumResultScreen.tsx', content);
