const fs = require('fs');
const content = fs.readFileSync('src/data/scores.ts', 'utf8');
const lines = content.split('\n');

// Find the original array closing bracket (line with just ']')
// It should be right before the first export function
let arrayEndLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === ']' && i + 2 < lines.length && lines[i + 2].includes('export function')) {
    arrayEndLine = i;
    break;
  }
}

console.log('Array ends at line', arrayEndLine + 1);

// Find all the appended data sections
const sections = [
  '// ===== 2025年录取数据 =====',
  '// ===== 补全2022/2023年数据 =====',
  '// ===== 2021年录取数据 =====',
  '// ===== 新增Top300高校录取数据 =====',
];

// Collect all appended data lines
const appendedData = [];
let inAppendedSection = false;
const cleanedLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if this line starts an appended section
  if (sections.some(s => line.includes(s))) {
    inAppendedSection = true;
    appendedData.push(line);
    continue;
  }
  
  if (inAppendedSection) {
    // Check if we've hit the export functions area
    if (line.includes('export function') || line.includes('export const')) {
      inAppendedSection = false;
      cleanedLines.push(line);
      continue;
    }
    // Check if this is a data line or empty line in the appended section
    if (line.trim().startsWith('{ universityId:') || line.trim() === '' || line.trim().startsWith('//')) {
      appendedData.push(line);
      continue;
    }
    // If we hit the original ']' that was duplicated, skip it
    if (line.trim() === ']') {
      continue;
    }
    // Otherwise, might be a function line
    inAppendedSection = false;
    cleanedLines.push(line);
  } else {
    cleanedLines.push(line);
  }
}

console.log('Found', appendedData.length, 'appended data lines');

// Now rebuild: insert appended data before the array closing bracket
const finalLines = [];
for (let i = 0; i < cleanedLines.length; i++) {
  if (i === arrayEndLine) {
    // Insert appended data before the closing bracket
    finalLines.push(...appendedData);
    finalLines.push(cleanedLines[i]); // the ']'
  } else {
    finalLines.push(cleanedLines[i]);
  }
}

fs.writeFileSync('src/data/scores.ts', finalLines.join('\n'), 'utf8');
console.log('File fixed successfully');
