/**
 * 爬取 school/{id}/info.json 中的 pro_type_min 字段
 *
 * 这个字段包含每所学校按省份-科类-年份的最低录取分数线
 * 对于同一所学校同一省份，可能有多个科类（如 物理类+历史类）
 * 且有多年的数据
 *
 * 策略：调用所有 mapped 学校的 info.json，提取 pro_type_min 数据
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const BASE_URL = 'https://static-data.gaokao.cn/www/2.0';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const OUTPUT_DIR = path.join(__dirname, 'crawled-data');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'school-info-progress.json');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'school-info-scores.json');

// 类型映射
const TYPE_MAP = {
  '1': '理科', '2': '文科', '3': '综合',
  '4': '艺术类', '5': '体育类',
  '2073': '物理类', '2074': '历史类',
  '2292': '艺术类(历史)', '2293': '艺术类(物理)',
  '2294': '体育类(历史)', '2295': '体育类(物理)',
};

// 省份映射
const PROV_ID_MAP = {
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
  const mappingFile = path.join(OUTPUT_DIR, 'gaokao-to-uni-mapping.json');
  if (!fs.existsSync(mappingFile)) {
    log('错误: 映射文件不存在');
    process.exit(1);
  }
  const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'));
  return mapping.gaokaoToUni;  // school_id -> { uniId, name }
}

// ==================== 加载/保存进度 ====================
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8')); } catch {}
  }
  return { completed: [], records: [] };
}

function saveProgress(progress) {
  // 只保留最近100次的进度用于断点续传
  const save = {
    completed: progress.completed,
    records: progress.records
  };
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(save, null, 2), 'utf-8');
}

// ==================== 提取 pro_type_min 数据 ====================
function extractProTypeMin(proTypeMin, schoolId, uniId) {
  const records = [];
  if (!proTypeMin || typeof proTypeMin !== 'object') return records;
  
  const uniqueKeys = new Set();
  
  Object.entries(proTypeMin).forEach(([provId, yearList]) => {
    const province = PROV_ID_MAP[provId];
    if (!province) return;
    
    if (!Array.isArray(yearList)) return;
    
    yearList.forEach(yearEntry => {
      const year = yearEntry.year;
      if (!year || year < 2021 || year > 2025) return;
      
      const types = yearEntry.type;
      if (!types || typeof types !== 'object') return;
      
      Object.entries(types).forEach(([typeCode, minScore]) => {
        const category = TYPE_MAP[typeCode] || `类型${typeCode}`;
        const score = parseInt(minScore);
        
        // 去重
        const key = `${uniId}|${province}|${category}|${year}`;
        if (uniqueKeys.has(key)) return;
        uniqueKeys.add(key);
        
        records.push({
          schoolId: String(schoolId),
          universityId: uniId,
          province,
          provinceId: provId,
          category,
          year,
          minScore: score || 0,
          source: 'school-info-json'
        });
      });
    });
  });
  
  return records;
}

// ==================== 主流程 ====================
async function main() {
  log('=== 爬取 school/info.json 分数线数据 ===\n');
  
  // 1. 加载映射
  const schoolMap = loadSchoolMap();
  const schoolIds = Object.keys(schoolMap);
  log(`学校总数: ${schoolIds.length}`);
  
  // 2. 加载进度
  const progress = loadProgress();
  const completed = new Set(progress.completed);
  log(`已完成: ${completed.size} 所`);
  
  // 3. 逐学校爬取
  let allRecords = [...(progress.records || [])];
  let consecutiveErrors = 0;
  
  for (let i = 0; i < schoolIds.length; i++) {
    const sid = schoolIds[i];
    
    // 跳过已完成的
    if (completed.has(sid)) continue;
    
    const uniInfo = schoolMap[sid];
    
    try {
      const r = await axios.get(`${BASE_URL}/school/${sid}/info.json`, {
        timeout: 20000,
        headers: { 'User-Agent': UA }
      });
      
      const data = r.data.data;
      if (data && data.pro_type_min) {
        const records = extractProTypeMin(data.pro_type_min, sid, uniInfo.uniId);
        allRecords.push(...records);
        log(`[${i+1}/${schoolIds.length}] school_id=${sid} (${uniInfo.name || uniInfo.uniId}): ${records.length} 条`);
      } else {
        log(`[${i+1}/${schoolIds.length}] school_id=${sid} (${uniInfo.name || uniInfo.uniId}): 无 pro_type_min 数据`);
      }
      
      completed.add(sid);
      consecutiveErrors = 0;
      
      // 每10个学校保存一次进度
      if (i % 10 === 0) {
        progress.completed = [...completed];
        progress.records = allRecords;
        saveProgress(progress);
        
        // 每50个学校显示汇总
        if (i > 0 && i % 50 === 0) {
          log(`\n--- 进度: ${completed.size}/${schoolIds.length}, 总计 ${allRecords.length} 条 ---\n`);
        }
      }
      
    } catch (e) {
      consecutiveErrors++;
      if (e.response?.status === 404) {
        log(`[${i+1}/${schoolIds.length}] school_id=${sid}: 404`);
        completed.add(sid);  // 标记完成，跳过
      } else {
        log(`[${i+1}/${schoolIds.length}] school_id=${sid}: ${e.message}`);
        if (consecutiveErrors >= 5) {
          log('连续错误过多，暂停 10 秒...');
          await sleep(10000);
          consecutiveErrors = 0;
        }
      }
    }
    
    // 随机延时 0.8-1.5s
    await sleep(800 + Math.random() * 700);
  }
  
  // 4. 保存最终结果
  // 去重
  const seen = new Set();
  const deduped = [];
  allRecords.forEach(r => {
    const key = `${r.universityId}|${r.province}|${r.category}|${r.year}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(r);
  });
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(deduped, null, 2), 'utf-8');
  log(`\n=== 爬取完成 ===`);
  log(`总记录: ${allRecords.length}`);
  log(`去重后: ${deduped.length}`);
  log(`已处理学校: ${completed.size}/${schoolIds.length}`);
  log(`保存到: ${OUTPUT_FILE}`);
  
  // 统计
  const yearStats = {};
  deduped.forEach(r => {
    if (!yearStats[r.year]) yearStats[r.year] = { total: 0, byCat: {} };
    yearStats[r.year].total++;
    yearStats[r.year].byCat[r.category] = (yearStats[r.year].byCat[r.category] || 0) + 1;
  });
  log('\n按年份统计:');
  Object.entries(yearStats).sort().forEach(([y, stats]) => {
    log(`  ${y}: ${stats.total} 条`);
    Object.entries(stats.byCat).sort((a,b) => b[1]-a[1]).forEach(([c, n]) => {
      log(`    ${c}: ${n}`);
    });
  });
  
  // 清理进度文件
  progress.completed = [...completed];
  progress.records = deduped;
  saveProgress(progress);
}

main().catch(e => {
  log(`错误: ${e.message}`);
  console.error(e);
});
