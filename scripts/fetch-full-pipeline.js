/**
 * eol.cn API 全量爬取统筹脚本
 * 1. 轮询等待 API 恢复
 * 2. 执行跨省全量爬取
 * 3. 合并 + 构建
 */
const { execSync } = require('child_process');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const SCRIPT_DIR = __dirname;

async function waitForApi() {
  console.log('[1/3] 等待 eol.cn API 恢复...');
  let attempts = 0;
  while (true) {
    attempts++;
    try {
      const r = await fetch('https://api.eol.cn/gkcx/api/?page=1&request_type=1&school_type=6000&size=1&uri=apidata/api/gk/school/lists', {
        headers: { 'User-Agent': UA }
      });
      const d = await r.json();
      if (d.code === '0000' && d.data?.item?.length) {
        console.log(`  ✅ API 已恢复（等待约 ${attempts * 30}s）`);
        return;
      }
    } catch {}
    if (attempts % 2 === 0) process.stdout.write('.');
    await new Promise(r => setTimeout(r, 30000));
  }
}

async function run() {
  // Step 1: 等 API
  await waitForApi();

  // Step 2: 爬取
  console.log('\n[2/3] 开始跨省全量爬取...');
  const crawlExit = execSync('node scripts/fetch-eol-api.js', {
    cwd: path.join(SCRIPT_DIR, '..'),
    stdio: 'inherit'
  });

  // Step 3: 合并 + 构建
  console.log('\n[3/3] 合并数据并构建...');
  execSync('node scripts/merge-eol-data.js && npm run build', {
    cwd: path.join(SCRIPT_DIR, '..'),
    stdio: 'inherit'
  });

  console.log('\n✅ 全流程完成！');
}

const path = require('path');
run().catch(err => { console.error('❌', err.message); process.exit(1); });
