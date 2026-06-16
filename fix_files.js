const fs = require('fs');

function fixFile(filePath, arrayVarName) {
  console.log(`Fixing ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Find the original array closing ']' (the one right before export functions)
  // and the start of appended data (after the broken function signature)
  const result = [];
  let state = 'normal'; // normal, in_appended_data, in_functions
  let appendedData = [];
  let foundArrayEnd = false;
  let arrayEndIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Detect the broken function signature like "export function getUniversitiesByProvince(province: string): University[,"
    // or "export function getAvailableProvinces(): string[,"
    if (trimmed.includes('export function') && trimmed.endsWith(',')) {
      // This is the broken line - save the function name and skip
      console.log(`  Found broken function at line ${i+1}: ${trimmed}`);
      state = 'in_appended_data';
      // Save the function signature prefix for later
      const funcPrefix = trimmed.replace(/,$/, '[] {');
      appendedData.push({type: 'func', line: funcPrefix, origLine: i});
      continue;
    }
    
    if (state === 'in_appended_data') {
      // Check if this line is data or part of the appended section
      if (trimmed.startsWith('{') && trimmed.includes('id:') && trimmed.endsWith('},')) {
        // This is university/score data that was incorrectly appended
        appendedData.push({type: 'data', line: line});
        continue;
      }
      if (trimmed.startsWith('{ universityId:') && (trimmed.endsWith('},') || trimmed.endsWith('}'))) {
        appendedData.push({type: 'data', line: line});
        continue;
      }
      if (trimmed.startsWith('// =====')) {
        appendedData.push({type: 'data', line: line});
        continue;
      }
      if (trimmed === '' && appendedData.length > 0) {
        // Could be blank line in data section
        appendedData.push({type: 'data', line: line});
        continue;
      }
      if (trimmed === '}' && appendedData.some(a => a.type === 'data')) {
        // Last item in data (no trailing comma)
        appendedData.push({type: 'data', line: line});
        continue;
      }
      if (trimmed === '] {' || trimmed === ']{') {
        // This is the broken closing bracket + function body start
        // Skip the ']' part, keep the '{' for function body
        appendedData.push({type: 'bracket', line: line});
        continue;
      }
      if (trimmed.startsWith('return ') || trimmed.includes('.filter(') || trimmed.includes('.map(') || trimmed.includes('.sort(') || trimmed === '}' || trimmed.includes('Array.from')) {
        // This is function body - switch to function mode
        state = 'in_functions';
        // First, reconstruct the proper function
        result.push(''); 
        // We'll add the function later
        // For now, collect function lines
        appendedData.push({type: 'funcbody', line: line});
        continue;
      }
      // Unknown line in appended section, keep it
      appendedData.push({type: 'data', line: line});
      continue;
    }
    
    if (state === 'in_functions') {
      // Collect remaining function lines
      appendedData.push({type: 'funcbody', line: line});
      continue;
    }
    
    // Normal state
    result.push(line);
    
    // Track the array closing bracket
    if (trimmed === ']' && !foundArrayEnd && i + 1 < lines.length && 
        (lines[i+1].trim() === '' || lines[i+1].trim().startsWith('export function') || lines[i+1].trim().startsWith('//'))) {
      arrayEndIndex = result.length - 1;
      foundArrayEnd = true;
    }
  }
  
  console.log(`  Array end at result index ${arrayEndIndex}`);
  console.log(`  Collected ${appendedData.filter(a => a.type === 'data').length} data lines`);
  
  // Now rebuild: separate data items from function items
  const dataItems = appendedData.filter(a => a.type === 'data').map(a => a.line);
  const funcItems = appendedData.filter(a => a.type === 'func' || a.type === 'funcbody' || a.type === 'bracket');
  
  // Reconstruct the function properly
  const funcLine = appendedData.find(a => a.type === 'func');
  const funcBodyLines = appendedData.filter(a => a.type === 'funcbody').map(a => a.line);
  
  // Insert data items before the array closing bracket
  if (arrayEndIndex >= 0 && dataItems.length > 0) {
    const before = result.slice(0, arrayEndIndex);
    const after = result.slice(arrayEndIndex);
    
    const finalLines = [...before, ...dataItems, ...after];
    
    // Add the reconstructed function at the end
    if (funcLine) {
      finalLines.push('');
      finalLines.push(funcLine.line);
      finalLines.push(...funcBodyLines);
    }
    
    fs.writeFileSync(filePath, finalLines.join('\n'), 'utf8');
    console.log(`  Fixed! Added ${dataItems.length} data lines before array close.`);
  } else {
    console.log(`  WARNING: Could not find array end or no data to insert`);
    // Just fix the broken function
    const funcLine2 = appendedData.find(a => a.type === 'func');
    if (funcLine2) {
      // Replace the broken line in result
      const finalLines = [...result, '', funcLine2.line, ...funcBodyLines];
      fs.writeFileSync(filePath, finalLines.join('\n'), 'utf8');
    }
  }
}

fixFile('src/data/universities.ts', 'universities');
fixFile('src/data/scores.ts', 'scoreRecords');
console.log('Done!');
