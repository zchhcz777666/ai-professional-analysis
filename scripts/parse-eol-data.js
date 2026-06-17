/**
 * 爬虫 Step 3: 解析下载的 Excel/PDF 投档线文件，转换为 ScoreRecord 格式
 *
 * 运行: node scripts/parse-eol-data.js
 * 输入: scripts/crawled-data/eol-downloads/ (下载的 Excel/PDF 文件)
 *       scripts/crawled-data/eol-files-index.json (文件索引)
 * 输出: scripts/crawled-data/parsed-records.json (解析后的记录)
 *
 * 支持的格式:
 * - Excel (.xls/.xlsx): 使用 xlsx (SheetJS) 库解析
 * - PDF (.pdf): 使用 pdf-parse + 正则提取表格文本
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'crawled-data');
const DOWNLOAD_DIR = path.join(OUT_DIR, 'eol-downloads');
const FILES_INDEX = path.join(OUT_DIR, 'eol-files-index.json');
const OUTPUT_FILE = path.join(OUT_DIR, 'parsed-records.json');

// === 大学名称模糊匹配 ===

// 从 universities.ts 读取大学列表
function loadUniversities() {
  const uniContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');

  // 用正则提取所有大学信息
  const universities = [];
  const uniBlocks = uniContent.matchAll(/\{\s*id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'/g);

  for (const m of uniBlocks) {
    universities.push({ id: m[1], name: m[2] });
  }

  return universities;
}

// 大学名称同义词/简写映射
const NAME_ALIASES = {
  '北京航空航天大学': ['北航', '北京航空'],
  '哈尔滨工业大学': ['哈工大', '哈尔滨工业'],
  '哈尔滨工业大学(深圳)': ['哈工大深圳', '哈工大（深圳）', '哈尔滨工业大学深圳'],
  '哈尔滨工业大学(威海)': ['哈工大威海', '哈工大（威海）', '哈尔滨工业大学威海'],
  '南京航空航天大学': ['南航', '南京航空'],
  '西安电子科技大学': ['西电', '西安电子科技'],
  '北京邮电大学': ['北邮', '北京邮电'],
  '电子科技大学': ['成电', '电子科大'],
  '上海交通大学': ['上海交大', '上交'],
  '西安交通大学': ['西安交大', '西交大'],
  '中国科学技术大学': ['中科大', '中国科技大'],
  '华中科技大学': ['华中科大', '华科'],
  '武汉大学': ['武大'],
  '中山大学': ['中大'],
  '厦门大学': ['厦大'],
  '四川大学': ['川大'],
  '山东大学': ['山大'],
  '吉林大学': ['吉大'],
  '南开大学': ['南开'],
  '天津大学': ['天大'],
  '同济大学': ['同济'],
  '东南大学': ['东南'],
  '大连理工大学': ['大连理工'],
  '华南理工大学': ['华南理工'],
  '北京理工大学': ['北理工'],
  '西北工业大学': ['西北工大', '西工大'],
  '重庆大学': ['重大'],
  '湖南大学': ['湖大'],
  '中南大学': ['中南'],
  '兰州大学': ['兰大'],
};

// 构建大学名称模糊匹配索引
function buildUniIndex(universities) {
  const index = [];

  for (const uni of universities) {
    // 原名
    index.push({ id: uni.id, name: uni.name, priority: 10 });

    // 别名
    const aliases = NAME_ALIASES[uni.name] || [];
    for (const alias of aliases) {
      index.push({ id: uni.id, name: alias, priority: 9 });
    }

    // 去除括号的版本（如 "哈尔滨工业大学(深圳)" → "哈尔滨工业大学深圳"）
    const noParens = uni.name.replace(/[（）()]/g, '');
    if (noParens !== uni.name) {
      index.push({ id: uni.id, name: noParens, priority: 8 });
    }
  }

  return index;
}

// 匹配大学名称到 universityId
function matchUniversity(name, uniIndex) {
  if (!name) return null;

  const cleanName = name.trim().replace(/[\s　]+/g, '');

  // 精确匹配优先
  const exact = uniIndex.find(u => u.name === cleanName);
  if (exact) return exact.id;

  // 包含匹配
  for (const u of uniIndex) {
    if (cleanName.includes(u.name) || u.name.includes(cleanName)) {
      return u.id;
    }
  }

  return null;
}

// === Excel 文件解析（使用 xlsx 库） ===

function parseExcelFile(filePath, fileInfo) {
  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // 转为二维数组
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // 找到表头行
    let headerRow = -1;
    const headerKeywords = ['院校', '学校', '投档', '最低分', '最低位次', '分数线', '专业'];

    for (let i = 0; i < Math.min(data.length, 20); i++) {
      const row = data[i];
      if (!row || !Array.isArray(row)) continue;

      const rowStr = row.map(c => String(c || '')).join(' ');

      // 检查是否包含表头关键词
      const matchCount = headerKeywords.filter(k => rowStr.includes(k)).length;
      if (matchCount >= 2) {
        headerRow = i;
        break;
      }
    }

    if (headerRow === -1) {
      console.warn(`    未找到表头行: ${filePath}`);
      return [];
    }

    // 解析表头
    const headers = (data[headerRow] || []).map(h => String(h || '').trim());
    console.log(`    表头: ${headers.join(' | ')}`);

    // 识别列
    const colMap = {};
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      if (/院校|学校|招生|高校/.test(h)) colMap.name = i;
      else if (/最低分|投档线|分数线/.test(h) && !/位次/.test(h)) colMap.minScore = i;
      else if (/最低位次|投档位次|排名/.test(h)) colMap.minRank = i;
      else if (/平均分/.test(h)) colMap.avgScore = i;
      else if (/计划|人数|录取/.test(h)) colMap.enrollment = i;
      else if (/专业|科类/.test(h)) colMap.major = i;
    }

    // 必须要有学校名和最低分
    if (colMap.name === undefined) {
      console.warn(`    未找到院校名称列`);
      return [];
    }

    const records = [];

    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !Array.isArray(row)) continue;

      const name = String(row[colMap.name] || '').trim();
      if (!name || /合计|平均|小计|注|说明|第/.test(name)) continue;

      const minScore = colMap.minScore !== undefined ? parseInt(row[colMap.minScore]) || 0 : 0;
      const minRank = colMap.minRank !== undefined ? parseInt(String(row[colMap.minRank]).replace(/,/g, '')) || 0 : 0;
      const avgScore = colMap.avgScore !== undefined ? parseInt(row[colMap.avgScore]) || 0 : 0;
      const enrollment = colMap.enrollment !== undefined ? parseInt(row[colMap.enrollment]) || 0 : 0;

      if (minScore === 0 && minRank === 0) continue;

      records.push({
        name,
        minScore,
        avgScore: avgScore || minScore,
        minRank,
        enrollment,
      });
    }

    console.log(`    解析到 ${records.length} 条记录`);
    return records;
  } catch (err) {
    console.error(`    Excel 解析失败: ${err.message}`);
    return [];
  }
}

// === PDF 文件解析（使用 pdf-parse） ===
// 注意：过大的 PDF（>5MB）会严重拖慢解析，直接跳过

async function parsePdfFile(filePath, fileInfo) {
  // 检查文件大小
  const stats = fs.statSync(filePath);
  if (stats.size > 5 * 1024 * 1024) {
    console.log(`    PDF 文件过大 (${(stats.size / 1024 / 1024).toFixed(1)} MB)，跳过解析`);
    return [];
  }

  try {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);

    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    console.log(`    PDF 文本行数: ${lines.length}`);

    // 尝试从文本中提取表格数据
    // 常见格式: "学校名称 最低分 最低位次"
    const records = [];

    // 查找表头位置
    let startLine = -1;
    const headerPatterns = [/院校.*最低分/, /学校.*投档/, /院校.*位次/, /名称.*最低/];

    for (let i = 0; i < Math.min(lines.length, 50); i++) {
      for (const pat of headerPatterns) {
        if (pat.test(lines[i])) {
          startLine = i + 1;
          break;
        }
      }
      if (startLine > 0) break;
    }

    if (startLine < 0) startLine = 0;

    // 解析数据行
    // 预期格式: "清华大学 685 396" 或 "清华大学 685 396 招生16人"
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];

      // 跳过非数据行
      if (/合计|平均|小计|注|说明|第.*页|数据来源|www/.test(line)) continue;

      // 尝试提取：学校名 + 分数 + 位次
      // 匹配模式：中文学校名 + 空格 + 数字(分数) + 空格 + 数字(位次)
      const match = line.match(/^([\u4e00-\u9fa5（）()]+)\s+(\d{3})\s+(\d[\d,]*)/);
        if (match) {
          const name = match[1].trim();
          const minScore = parseInt(match[2]);
          const minRank = parseInt(match[3].replace(/,/g, ''));

          if (name && minScore > 0) {
            records.push({
              name,
              minScore: minScore,
              avgScore: minScore,
              minRank: minRank,
              enrollment: 0,
            });
          }
        }
      }

      console.log(`    解析到 ${records.length} 条记录`);
      return records;
    } catch (err) {
      console.error(`    PDF 解析失败: ${err.message}`);
      return [];
    }
}

// 判断文件类型并解析
async function parseFile(fileInfo) {
  const filePath = path.join(DOWNLOAD_DIR, fileInfo.fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`  文件不存在: ${fileInfo.fileName}`);
    return [];
  }

  const ext = fileInfo.ext.toLowerCase();

  if (ext === '.xls' || ext === '.xlsx') {
    return parseExcelFile(filePath, fileInfo);
  } else if (ext === '.pdf') {
    return await parsePdfFile(filePath, fileInfo);
  } else {
    console.warn(`  不支持的文件格式: ${ext}`);
    return [];
  }
}

async function main() {
  console.log('=== EOL 投档线数据解析器 ===\n');

  // 加载文件索引
  if (!fs.existsSync(FILES_INDEX)) {
    console.error(`请先运行 crawl-eol-files.js 生成 ${FILES_INDEX}`);
    process.exit(1);
  }

  const fileIndex = JSON.parse(fs.readFileSync(FILES_INDEX, 'utf-8'));
  const universities = loadUniversities();
  const uniIndex = buildUniIndex(universities);

  console.log(`大学数: ${universities.length}`);
  console.log(`文件数: ${fileIndex.length}`);

  // 解析所有文件
  const allRecords = [];

  for (const fileInfo of fileIndex) {
    console.log(`\n解析: ${fileInfo.province} ${fileInfo.year} ${fileInfo.category} [${fileInfo.ext}]`);

    let records = [];
    try {
      records = await parseFile(fileInfo);
    } catch (err) {
      console.error(`    解析异常: ${err.message}`);
      records = [];
    }

    for (const rec of records) {
      const universityId = matchUniversity(rec.name, uniIndex);

      if (!universityId) {
        console.warn(`    未匹配: ${rec.name}`);
        continue;
      }

      allRecords.push({
        universityId,
        province: fileInfo.province,
        year: fileInfo.year,
        category: fileInfo.category === '物理类' ? '物理类' :
                 fileInfo.category === '历史类' ? '物理类' :  // 历史类暂存为物理类占位
                 fileInfo.category === '综合' ? '综合' : '物理类',
        minScore: rec.minScore,
        avgScore: rec.avgScore || rec.minScore,
        minRank: rec.minRank,
        enrollment: rec.enrollment || 0,
        source: `eol:${fileInfo.province}考试院`,
      });
    }

    console.log(`  本次解析匹配: ${records.length} → ${allRecords.slice(-records.length).filter(r => r.universityId).length} 条有效记录`);
  }

  // 去重（同大学+同省+同年+同类只保留一条）
  const seen = new Set();
  const uniqueRecords = allRecords.filter(r => {
    const key = `${r.universityId}|${r.province}|${r.year}|${r.category}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`\n=== 解析统计 ===`);
  console.log(`总解析记录: ${allRecords.length}`);
  console.log(`去重后记录: ${uniqueRecords.length} 条`);

  // 按省份统计
  const byProv = {};
  for (const r of uniqueRecords) {
    byProv[r.province] = (byProv[r.province] || 0) + 1;
  }
  console.log(`覆盖省份:`);
  for (const [prov, count] of Object.entries(byProv).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${prov}: ${count} 条`);
  }

  // 检查未匹配的大学
  const unmatchedNames = new Set();
  for (const fileInfo of fileIndex) {
    const filePath = path.join(DOWNLOAD_DIR, fileInfo.fileName);
    if (!fs.existsSync(filePath)) continue;
    try {
      const records = await parseFile(fileInfo);
      for (const rec of records) {
        if (!matchUniversity(rec.name, uniIndex)) {
          unmatchedNames.add(rec.name);
        }
      }
    } catch (err) {
      // 跳过解析失败的
    }
  }

  if (unmatchedNames.size > 0) {
    console.log(`\n未匹配的大学名称 (${unmatchedNames.size}):`);
    for (const name of [...unmatchedNames].sort()) {
      console.log(`  - ${name}`);
    }
  }

  // 保存
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(uniqueRecords, null, 2));
  console.log(`\n输出: ${OUTPUT_FILE} (${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(0)} KB)`);
}

main().catch(console.error);
