/**
 * 全年份 samescore3 爬虫 — 爬取 2021-2025 所有分数点
 *
 * 策略：
 *   - 分数范围 300-700，步长5（减少调用次数，覆盖足够多组合）
 *   - 5 年 × 81 个分数点 = 405 次 API 调用
 *   - 自动重试，随机延时
 *   - 进度断点续传
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const BASE_URL = 'https://static-data.gaokao.cn/www/2.0';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const SCORE_START = 300;
const SCORE_END = 700;
const SCORE_STEP = 5;  // 步长5，共81个分数点
const YEARS = [2025, 2024, 2023, 2022, 2021];
const OUTPUT_DIR = path.join(__dirname, 'crawled-data');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'crawl-all-progress.json');
const MAPPING_FILE = path.join(OUTPUT_DIR, 'gaokao-to-uni-mapping.json');

// 类型映射
const TYPE_MAP = {
  '1': '理科', '2': '文科', '3': '综合',
  '4': '艺术类', '5': '体育类',
  '32': '物理类', '33': '历史类',
  '2073': '物理类', '2074': '历史类',
  '2292': '艺术类(历史)', '2293': '艺术类(物理)',
  '2294': '体育类(历史)', '2295': '体育类(物理)',
};

// 省份映射
const PROVINCE_MAP = {
  '11': '北京', '12': '天津', '13': '河北', '14': '山西', '15': '内蒙古',
  '21': '辽宁', '22': '吉林', '23': '黑龙江',
  '31': '上海', '32': '江苏', '33': '浙江', '34': '安徽', '35': '福建', '36': '江西', '37': '山东',
  '41': '河南', '42': '湖北', '43': '湖南', '44': '广东', '45': '广西', '46': '海南',
  '50': '重庆', '51': '四川', '52': '贵州', '53': '云南', '54': '西藏',
  '61': '陕西', '62': '甘肃', '63': '青海', '64': '宁夏', '65': '新疆',
};

// ==================== 日志 ====================
function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

// ==================== 延时 ====================
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ==================== 加载学校映射 ====================
function loadSchoolMap() {
  if (!fs.existsSync(MAPPING_FILE)) {
    log('错误: 映射文件不存在，请先运行 crawl-eol-2025.js');
    process.exit(1);
  }
  const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
  return mapping.gaokaoToUni;  // school_id -> { uniId, name }
}

// ==================== 加载/保存进度 ====================
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    } catch { /* ignore */ }
  }
  return { completed: {}, records: {} };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');
}

// ==================== 爬取单个年份 ====================
async function crawlYear(year, schoolMap, progress) {
  const scorePoints = [];
  for (let s = SCORE_START; s <= SCORE_END; s += SCORE_STEP) {
    scorePoints.push(s);
  }
  
  const yearRecords = [];
  const seen = new Set();  // school_id|province|type|batch
  
  for (let i = 0; i < scorePoints.length; i++) {
    const score = scorePoints[i];
    const cacheKey = `${year}/${score}`;
    
    // 跳过已完成的
    if (progress.completed[cacheKey]) {
      log(`  ${year} 分数=${score}: 已缓存，跳过`);
      if (progress.records[cacheKey]) {
        // 如果是最后一个完成点，把记录也加进来
        // 但从缓存恢复时，不重复添加已看到的
      }
      continue;
    }
    
    const url = `${BASE_URL}/samescore3/${year}/${score}.json`;
    let success = false;
    
    for (let retry = 0; retry < 3; retry++) {
      try {
        const r = await axios.get(url, {
          timeout: 30000,
          headers: { 'User-Agent': UA, 'Accept': 'application/json' }
        });
        
        const data = r.data;
        if (data.code === '0000' && data.data) {
          let count = 0;
          Object.entries(data.data).forEach(([provId, typeData]) => {
            const province = PROVINCE_MAP[provId];
            if (!province) return;
            
            Object.entries(typeData).forEach(([typeCode, items]) => {
              const category = TYPE_MAP[typeCode] || `类型${typeCode}`;
              
              items.forEach(item => {
                const schoolInfo = schoolMap[String(item.school_id)];
                if (!schoolInfo) return;
                
                const key = `${item.school_id}|${provId}|${typeCode}|${item.batch || ''}`;
                if (seen.has(key)) return;
                seen.add(key);
                
                yearRecords.push({
                  year,
                  schoolId: String(item.school_id),
                  provinceId: provId,
                  province,
                  category,
                  batch: item.batch || '',
                  zslx: item.zslx || '',
                  minScore: item.min || 0,
                  minRank: parseInt(item.eol_rank) || 0,
                  schoolName: item.name,
                  universityId: schoolInfo.uniId,
                  source: `eol:samescore3:${year}`
                });
                count++;
              });
            });
          });
          
          success = true;
          log(`  ${year} 分数=${score}: +${count} 记录 (总计 ${yearRecords.length})`);
        } else {
          log(`  ${year} 分数=${score}: code=${data.code}, msg=${data.message}`);
          success = true;  // 不算失败，只是没有数据
        }
        break;
      } catch (e) {
        if (e.response?.status === 404) {
          log(`  ${year} 分数=${score}: 404 (无数据)`);
          success = true;
          break;
        }
        log(`  ${year} 分数=${score}: 重试 ${retry+1}/3 - ${e.message}`);
        await sleep(2000 * (retry + 1));
      }
    }
    
    // 保存进度
    progress.completed[cacheKey] = true;
    progress.records[cacheKey] = success ? yearRecords.length : 0;
    saveProgress(progress);
    
    // 进度报告
    if ((i + 1) % 10 === 0 || i === scorePoints.length - 1) {
      log(`  ${year} 进度: ${i+1}/${scorePoints.length} (${Math.round((i+1)/scorePoints.length*100)}%)`);
    }
    
    // 随机延时 1-2s
    await sleep(1000 + Math.random() * 1000);
  }
  
  return yearRecords;
}

// ==================== 主流程 ====================
async function main() {
  log('=== samescore3 全年份爬虫 ===');
  log(`分数范围: ${SCORE_START}-${SCORE_END} 步长${SCORE_STEP}`);
  log(`年份: ${YEARS.join(', ')}`);
  log('\n');
  
  // 1. 加载映射
  log('加载学校映射...');
  const schoolMap = loadSchoolMap();
  log(`映射数: ${Object.keys(schoolMap).length}`);
  
  // 2. 加载/初始化进度
  const progress = loadProgress();
  log(`已缓存分数点: ${Object.keys(progress.completed).length}`);
  
  // 3. 逐年份爬取
  const allRecords = {};
  for (const year of YEARS) {
    log(`\n=== 爬取 ${year} 年 ===`);
    const records = await crawlYear(year, schoolMap, progress);
    allRecords[year] = records;
    log(`${year} 完成: ${records.length} 条`);
    
    // 每个年份间休息
    if (year !== YEARS[YEARS.length - 1]) {
      await sleep(3000);
    }
  }
  
  // 4. 分析汇总
  log('\n=== 爬取汇总 ===');
  let total = 0;
  for (const year of YEARS) {
    log(`${year}: ${allRecords[year].length} 条`);
    total += allRecords[year].length;
  }
  log(`总计: ${total} 条`);
  
  // 5. 按类别统计
  log('\n各年份类别分布:');
  for (const year of YEARS) {
    const catStat = {};
    allRecords[year].forEach(r => {
      catStat[r.category] = (catStat[r.category] || 0) + 1;
    });
    log(`  ${year}: ${Object.entries(catStat).sort((a,b)=>b[1]-a[1]).map(([k,v]) => `${k}=${v}`).join(', ')}`);
  }
  
  // 6. 保存独立文件
  for (const year of YEARS) {
    const outFile = path.join(OUTPUT_DIR, `samescore3-${year}-records.json`);
    fs.writeFileSync(outFile, JSON.stringify(allRecords[year], null, 2), 'utf-8');
    log(`保存 ${year}: ${outFile}`);
  }
  
  // 7. 保存合并文件
  const merged = [];
  for (const year of YEARS) {
    merged.push(...allRecords[year]);
  }
  const mergedFile = path.join(OUTPUT_DIR, 'samescore3-all-years-records.json');
  fs.writeFileSync(mergedFile, JSON.stringify(merged, null, 2), 'utf-8');
  log(`\n合并文件: ${mergedFile} (${merged.length} 条, ${Math.round(fs.statSync(mergedFile).size / 1024)}KB)`);
}

main().catch(e => {
  log(`错误: ${e.message}`);
  console.error(e);
});
