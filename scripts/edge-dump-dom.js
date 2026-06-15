/**
 * 使用 Edge 浏览器获取渲染后的页面内容
 * 
 * 通过 Chrome DevTools Protocol (CDP) 连接 Edge
 */

const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_FILE = 'c:\\Users\\Administrator\\.trae-cn\\aizhuanyefengxi\\scripts\\edge-output.html';

async function getRenderedDOM(url) {
  return new Promise((resolve, reject) => {
    const userDataDir = 'c:\\Users\\Administrator\\.trae-cn\\aizhuanyefengxi\\scripts\\edge-temp-' + Date.now();
    
    const args = [
      `--headless`,
      `--disable-gpu`,
      `--no-sandbox`,
      `--user-data-dir=${userDataDir}`,
      `--remote-debugging-port=0`,
      `--dump-dom`,
      url
    ];
    
    console.log(`Launching Edge with URL: ${url.substring(0, 100)}...`);
    
    const edge = spawn(EDGE_PATH, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      timeout: 30000
    });
    
    let stdout = '';
    let stderr = '';
    
    edge.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    edge.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    edge.on('error', (err) => {
      reject(new Error(`Edge launch error: ${err.message}`));
    });
    
    edge.on('close', (code) => {
      console.log(`Edge exited with code ${code}`);
      
      if (stdout.length > 100) {
        fs.writeFileSync(OUTPUT_FILE, stdout, 'utf-8');
        console.log(`Output saved to ${OUTPUT_FILE} (${stdout.length} chars)`);
        
        // Check if output contains score data
        const hasScore = stdout.includes('最低分') || stdout.includes('平均分') || stdout.includes('录取人数');
        const hasTable = stdout.includes('<table');
        console.log(`Has score data: ${hasScore}`);
        console.log(`Has tables: ${hasTable}`);
        
        // Print first 500 chars
        console.log(`\nFirst 500 chars:\n${stdout.substring(0, 500)}`);
        
        resolve(stdout);
      } else {
        console.log(`Stdout too short: ${stdout.length} chars`);
        if (stderr) console.log(`Stderr: ${stderr.substring(0, 500)}`);
        reject(new Error(`No output. Stderr: ${stderr.substring(0, 200)}`));
      }
      
      // Cleanup
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch (e) {}
    });
    
    // Timeout
    setTimeout(() => {
      try { edge.kill(); } catch (e) {}
      reject(new Error('Timeout after 30s'));
    }, 30000);
  });
}

async function main() {
  try {
    const url = 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score';
    const dom = await getRenderedDOM(url);
    console.log('\nDone!');
  } catch (e) {
    console.error(`Error: ${e.message}`);
    
    // Try without query params
    try {
      console.log('\nRetrying with simpler URL...');
      const url2 = 'https://gaokao.chsi.com.cn/sch/schoolInfoMain--schId-3.dhtml';
      const dom2 = await getRenderedDOM(url2);
      console.log('Done!');
    } catch (e2) {
      console.error(`Second attempt also failed: ${e2.message}`);
    }
  }
}

main();