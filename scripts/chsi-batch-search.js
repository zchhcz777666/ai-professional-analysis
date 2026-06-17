/**
 * 批量补齐缺失学校的 schId — 用 yxmc 参数搜索
 */
const c = require('fs').readFileSync('scripts/crawled-data/chsi-cookie.txt', 'utf-8').trim();
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const HEADERS = { 'User-Agent': UA, 'Cookie': c, 'Referer': 'https://gaokao.chsi.com.cn/sch/' };

const SCHOOL_MAP_FILE = path.join(__dirname, 'crawled-data', 'chsi-school-map.json');

async function main() {
  const map = JSON.parse(fs.readFileSync(SCHOOL_MAP_FILE, 'utf-8'));
  const u = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');
  const names = [...u.matchAll(/name:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const missing = names.filter(n => !map[n]);
  console.log(`缺失 ${missing.length} 所学校\n`);

  let found = 0;
  for (let i = 0; i < missing.length; i++) {
    const name = missing[i];
    const encoded = encodeURIComponent(name);
    
    try {
      const r = await fetch(`https://gaokao.chsi.com.cn/sch/search.do?yxmc=${encoded}`, { headers: HEADERS, timeout: 10000 });
      const h = await r.text();
      
      // 提取 schId
      const ids = [...h.matchAll(/schId[-=](\d+)/g)].map(m => m[1]);
      const uniqueIds = [...new Set(ids)];
      
      if (uniqueIds.length > 0) {
        // 取最大最常见的 schId
        const schId = parseInt(uniqueIds.sort((a, b) => b.length - a.length)[0]);
        map[name] = schId;
        found++;
        console.log(`  [${i + 1}/${missing.length}] ✅ ${name} => schId=${schId}`);
      } else {
        // 尝试编码兼容
        const encoded2 = encodeURIComponent(name.replace(/[（(].*[）)]/, '').trim());
        const r2 = await fetch(`https://gaokao.chsi.com.cn/sch/search.do?yxmc=${encoded2}`, { headers: HEADERS, timeout: 10000 });
        const h2 = await r2.text();
        const ids2 = [...h2.matchAll(/schId[-=](\d+)/g)].map(m => m[1]);
        const uniqueIds2 = [...new Set(ids2)];
        if (uniqueIds2.length > 0) {
          const schId = parseInt(uniqueIds2.sort((a, b) => b.length - a.length)[0]);
          map[name] = schId;
          found++;
          console.log(`  [${i + 1}/${missing.length}] ✅ ${name}(精简) => schId=${schId}`);
        } else {
          console.log(`  [${i + 1}/${missing.length}] ❌ ${name}: 无结果`);
        }
      }
    } catch (e) {
      console.log(`  [${i + 1}/${missing.length}] ❌ ${name}: ${e.message.substring(0, 50)}`);
    }

    // 每 30 个保存一次
    if (i % 30 === 29) {
      fs.writeFileSync(SCHOOL_MAP_FILE, JSON.stringify(map, null, 2), 'utf-8');
    }

    await new Promise(r => setTimeout(r, 800));
  }

  fs.writeFileSync(SCHOOL_MAP_FILE, JSON.stringify(map, null, 2), 'utf-8');
  console.log(`\n✅ 完成! 找到 ${found} / ${missing.length} 个`);
  
  // 最终统计
  const matched = names.filter(n => map[n]);
  console.log(`现在共 ${matched.length} / ${names.length} 所学校有 schId`);
}

main().catch(e => console.error(e));
