const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const DATA_DIR = path.join(__dirname, 'crawled-data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const COOKIE_FILE = path.join(DATA_DIR, 'chsi-cookie.txt');

console.log('=== 阳光志愿 Cookie 导入 ===');
console.log('');
console.log('请从浏览器 F12 → Application → Cookies → gaokao.chsi.com.cn');
console.log('右键任意 Cookie → 复制全部 (Copy All)');
console.log('');
console.log('然后粘贴到下面，按回车两次确认:');
console.log('');

let fullInput = '';
rl.on('line', (line) => {
  if (line.trim() === '' && fullInput.length > 10) {
    rl.close();
    return;
  }
  fullInput += line + ' ';
});

rl.on('close', () => {
  const cookie = fullInput.trim();
  if (cookie.length < 10) {
    console.log('❌ Cookie 太短，请重新运行脚本');
    process.exit(1);
  }
  fs.writeFileSync(COOKIE_FILE, cookie, 'utf-8');
  console.log(`\n✅ Cookie 已保存 (${cookie.length} 字符)`);
  console.log('前60字符: ' + cookie.substring(0, 60));
  
  // 自动调用探索脚本
  console.log('\n开始探索平台...\n');
  require('./chsi-cookie-explore-fast.js');
});
