/**
 * 启动 dev server 并测试 analyze 接口
 */
const path = require('path');
const PROJECT_DIR = path.resolve(__dirname, '..');

const server = spawn('npx', ['next', 'dev', '-p', '3000'], {
  cwd: PROJECT_DIR,
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env }
});

let started = false;

server.stdout.on('data', d => {
  const text = d.toString();
  process.stdout.write('[server] ' + text);
  if (text.includes('Ready') && !started) {
    started = true;
    testAPI();
  }
});

server.stderr.on('data', d => {
  process.stderr.write('[err] ' + d.toString());
});

function testAPI() {
  setTimeout(async () => {
    console.log('\n--- 测试 API ---');
    try {
      const r = await fetch('http://127.0.0.1:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessCode: 'test',
          universityId: 'tsinghua',
          province: '北京',
          category: '综合',
          score: 680,
          rank: 500,
          preferences: { priorityOrder: ['就业', '学术'], researchFocus: ['机器学习'] }
        })
      });
      console.log('status:', r.status);
      const text = await r.text();
      console.log('body:', text.substring(0, 1000));
    } catch (e) {
      console.error('fetch error:', e.message);
    }
    
    // 5秒后退出
    setTimeout(() => process.exit(0), 5000);
  }, 3000);
}
