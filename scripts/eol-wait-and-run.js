/**
 * 轮询等待 eol.cn API 恢复，恢复后立即运行爬取脚本
 */
const { spawn } = require('child_process');

const CHECK_URL = 'https://api.eol.cn/gkcx/api/?page=1&request_type=1&school_type=6000&size=1&uri=apidata/api/gk/school/lists';
const UA = 'Mozilla/5.0';

async function poll() {
  let attempts = 0;
  while (true) {
    attempts++;
    try {
      const r = await fetch(CHECK_URL, { headers: { 'User-Agent': UA }, timeout: 8000 });
      const d = await r.json();
      const now = new Date().toLocaleTimeString();
      console.log(`[${now}] #${attempts} code=${d.code}`);
      if (d.code === '0000') return;
    } catch (e) {
      console.log(`[${new Date().toLocaleTimeString()}] #${attempts} fetch error`);
    }
    await new Promise(r => setTimeout(r, 30000));
  }
}

poll()
  .then(() => {
    console.log('\n✅ API 已恢复！启动爬取...\n');
    const s = spawn('node', ['scripts/fetch-eol-2025.js'], { stdio: 'inherit', cwd: __dirname });
    s.on('exit', code => console.log(`\n爬取结束，退出码: ${code}`));
  })
  .catch(e => console.error('轮询错误:', e));
