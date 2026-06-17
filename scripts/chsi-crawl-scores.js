/**
 * 阳光高考 Puppeteer 抓取脚本
 * 策略：遍历所有学校列表页 → 建立 schId→name 映射 → 匹配我们的学校 → 抓取录取数据
 */
const puppeteer = require('puppeteer');
const c = require('fs').readFileSync('scripts/crawled-data/chsi-cookie.txt', 'utf-8').trim();
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'crawled-data');
const CHROME_PATH = 'C:\\Users\\Administrator\\.cache\\puppeteer\\chrome\\win64-131.0.6778.204\\chrome-win64\\chrome.exe';
const SCHOOL_MAP_FILE = path.join(DATA_DIR, 'chsi-school-map.json');
const SCORE_FILE = path.join(DATA_DIR, 'chsi-scores.json');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 加载我们的大学
function loadOurUniversities() {
  const content = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');
  const map = {};
  const ids = [...content.matchAll(/id:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const names = [...content.matchAll(/name:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  for (let i = 0; i < Math.min(ids.length, names.length); i++) map[names[i]] = ids[i];
  return map;
}

async function buildSchoolMap(page) {
  console.log('=== 构建学校 schId 映射 ===\n');
  
  // 检查是否有已有的映射
  if (fs.existsSync(SCHOOL_MAP_FILE)) {
    const existing = JSON.parse(fs.readFileSync(SCHOOL_MAP_FILE, 'utf-8'));
    console.log(`已有 ${Object.keys(existing).length} 个学校的映射`);
    return existing;
  }

  const map = {};

  // 从第1页开始遍历
  for (let pageNum = 0; pageNum < 148; pageNum++) {
    const start = pageNum * 20;
    const url = `https://gaokao.chsi.com.cn/sch/search--ss-on,option-qg,searchType-1,start-${start}.dhtml`;
    
    console.log(`  翻页 ${pageNum + 1}/148 (start=${start})...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    // 提取当前页的学校列表
    const pageData = await page.evaluate(() => {
      const items = [];
      const links = document.querySelectorAll('a[href*="schoolInfo--schId-"]');
      links.forEach(a => {
        const m = a.href.match(/schId-(\d+)/);
        const name = a.textContent.trim();
        if (m && name && name.length > 1) {
          items.push({ schId: parseInt(m[1]), name });
        }
      });
      return items;
    });

    // 去重
    for (const item of pageData) {
      if (!map[item.name]) map[item.name] = item.schId;
    }

    console.log(`    本页找到 ${pageData.length} 个学校, 累计 ${Object.keys(map).length} 个`);

    // 每10页保存一次进度
    if (pageNum % 10 === 9) {
      fs.writeFileSync(SCHOOL_MAP_FILE, JSON.stringify(map, null, 2), 'utf-8');
    }

    // 不要太快
    await sleep(1000);
  }

  // 保存完整映射
  fs.writeFileSync(SCHOOL_MAP_FILE, JSON.stringify(map, null, 2), 'utf-8');
  console.log(`\n✅ 学校映射完成: ${Object.keys(map).length} 所学校\n`);
  return map;
}

async function matchSchools(map) {
  const ourMap = loadOurUniversities();
  console.log(`我们的学校: ${Object.keys(ourMap).length} 所`);
  
  const matched = [];
  let notFound = [];
  
  for (const [name, id] of Object.entries(ourMap)) {
    const schId = map[name];
    if (schId) {
      matched.push({ id, name, schId });
    } else {
      notFound.push(name);
    }
  }

  console.log(`匹配成功: ${matched.length}, 未找到: ${notFound.length}`);
  if (notFound.length > 0) {
    console.log('未匹配的学校:', notFound.slice(0, 20));
  }

  return matched;
}

async function fetchScoreData(page, school, year = 2025) {
  // 访问学校详情页
  const infoUrl = `https://gaokao.chsi.com.cn/sch/schoolInfo--schId-${school.schId}.dhtml`;
  await page.goto(infoUrl, { waitUntil: 'networkidle2', timeout: 15000 });
  await sleep(1500);

  // 找"往年录取信息"链接
  const hireLink = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a')];
    for (const a of links) {
      if (a.textContent.includes('录取') && (a.href.includes('schId') || a.href.includes('Hire'))) {
        return a.href;
      }
    }
    return null;
  });

  if (!hireLink) {
    console.log(`  ${school.name}: 无录取信息入口`);
    return [];
  }

  // 访问录取信息页
  await page.goto(hireLink, { waitUntil: 'networkidle2', timeout: 15000 });
  await sleep(2000);

  // 提取表格数据
  const scoreData = await page.evaluate((year) => {
    const rows = document.querySelectorAll('table tr');
    const results = [];
    
    rows.forEach(tr => {
      const cells = tr.querySelectorAll('td');
      if (cells.length < 3) return;
      
      const text = [...cells].map(td => td.textContent.trim());
      
      // 尝试提取省份、类别、分数
      // 表格可能的结构: 省份 | 科类 | 最低分 | 最低位次 | 平均分 | ...
      let province = '';
      let category = '';
      let minScore = 0;
      let minRank = 0;

      // 识别省份列
      for (const t of text) {
        if (t.endsWith('省') || t.endsWith('市') || t.endsWith('自治区')) {
          province = t;
          break;
        }
      }

      // 识别分数
      for (const t of text) {
        const score = parseInt(t);
        if (score >= 100 && score <= 750) {
          minScore = score;
          break;
        }
      }

      // 识别科类
      for (const t of text) {
        if (t.includes('物理') || t.includes('理科')) { category = '物理类'; break; }
        if (t.includes('历史') || t.includes('文科')) { category = '历史类'; break; }
        if (t.includes('综合')) { category = '综合'; break; }
      }

      if (province && minScore > 0) {
        results.push({ province, category, minScore, minRank, year });
      }
    });
    
    return results;
  }, year);

  return scoreData;
}

async function main() {
  console.log('=== 阳光高考数据抓取 ===\n');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
  
  // 设置 Cookie
  const cookieItems = c.split(';').map(pair => {
    const [name, ...vals] = pair.trim().split('=');
    return { name, value: vals.join('='), domain: '.chsi.com.cn', path: '/' };
  });
  await page.setCookie(...cookieItems);

  // 步骤1: 建立学校映射
  const schoolMap = await buildSchoolMap(page);
  
  // 步骤2: 匹配我们的学校
  const matched = await matchSchools(schoolMap);

  // 步骤3: 读取已有分数或创建新的
  let allScores = [];
  if (fs.existsSync(SCORE_FILE)) {
    allScores = JSON.parse(fs.readFileSync(SCORE_FILE, 'utf-8'));
    console.log(`\n已有分数: ${allScores.length} 条`);
  }

  // 步骤4: 抓取录取数据（先测5所）
  console.log('\n=== 抓取录取数据（测试5所） ===\n');
  for (let i = 0; i < Math.min(5, matched.length); i++) {
    const school = matched[i];
    console.log(`[${i + 1}/${5}] ${school.name} (schId=${school.schId})...`);
    
    const scores = await fetchScoreData(page, school);
    console.log(`  找到 ${scores.length} 条录取记录`);
    
    if (scores.length > 0) {
      allScores.push(...scores.map(s => ({ ...s, universityId: school.id, universityName: school.name })));
    }
    
    await sleep(1000);
  }

  // 保存
  fs.writeFileSync(SCORE_FILE, JSON.stringify(allScores, null, 2), 'utf-8');
  console.log(`\n✅ 已保存 ${allScores.length} 条记录`);

  await browser.close();
}

main().catch(e => { console.error('错误:', e); process.exit(1); });
