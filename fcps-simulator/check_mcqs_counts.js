const fs = require('fs');
const path = require('path');

const mcqsDir = path.resolve(__dirname, '..', 'MCQS');

if (!fs.existsSync(mcqsDir)) {
  console.error('MCQS directory not found at:', mcqsDir);
  process.exit(1);
}

const files = fs.readdirSync(mcqsDir).filter(f => f.endsWith('.js'));
console.log('📂 Found JS files in MCQS directory:');

let grandTotal = 0;
files.forEach(file => {
  const filePath = path.join(mcqsDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Using eval to parse JavaScript array content
    const parsed = eval(content);
    const count = Array.isArray(parsed) ? parsed.length : 0;
    console.log(`- ${file}: ${count} questions`);
    grandTotal += count;
  } catch (err) {
    console.error(`- Error reading/parsing ${file}:`, err.message);
  }
});

console.log(`\n📊 Grand Total questions in MCQS folder JS files: ${grandTotal}`);
