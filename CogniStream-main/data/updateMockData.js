import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const targetFile = resolve(__dirname, 'mockData.ts');
let content = fs.readFileSync(targetFile, 'utf8');

content = content.replace(/({[^}]*level:\s*'[^']+',)(\s*)(portuguese:\s*'([^']+)',)/g, (match, p1, p2, p3, portugueseText) => {
    // If it has already been typed skip
    if (match.includes("type:")) return match;

    const isSentence = portugueseText.split(' ').length > 2;
    const typeVal = isSentence ? "'sentence'" : "'word'";

    return `${p1} type: ${typeVal},${p2}${p3}`;
});

fs.writeFileSync(targetFile, content, 'utf8');
console.log('mockData.ts successfully updated with type properties.');
