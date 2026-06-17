/**
 * 爬虫 Step 2: 从 eol.cn 文章页提取原始 PDF/Excel 下载链接并下载
 *
 * 运行: node scripts/crawl-eol-files.js
 * 输入: scripts/crawled-data/eol-articles.json (由 crawl-eol-links.js 生成)
 * 输出: scripts/crawled-data/eol-files.json (文件索引)
 *        scripts/crawled-data/eol-downloads/ (下载的原始文件)
 *
 * 数据来源: 各省教育考试院官方发布的投档线文件（PDF/XLS/XLSX）
 * 这些文件由各高校直接报送、教育部门核验，数据可信度最高
 */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'crawled-data');
const DOWNLOAD_DIR = path.join(OUT_DIR, 'eol-downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

const ARTICLES_FILE = path.join(OUT_DIR, 'eol-articles.json');
const FILES_INDEX = path.join(OUT_DIR, 'eol-files-index.json');

// 需要下载的文件类型
const FILE_EXTENSIONS = ['.pdf', '.xls', '.xlsx', '.csv'];

// 省份到考试院名称的映射（用于文件名）
const PROVINCE_EXAM = {
  '北京': '北京教育考试院', '天津': '天津市教育招生考试院',
  '上海': '上海市教育考试院', '重庆': '重庆市教育考试院',
  '河北': '河北省教育考试院', '河南': '河南省教育考试院',
  '山东': '山东省教育招生考试院', '山西': '山西省招生考试管理中心',
  '安徽': '安徽省教育招生考试院', '江西': '江西省教育考试院',
  '江苏': '江苏省教育考试院', '浙江': '浙江省教育考试院',
  '湖北': '湖北省教育考试院', '湖南': '湖南省教育考试院',
  '广东': '广东省教育考试院', '广西': '广西招生考试院',
  '福建': '福建省教育考试院', '四川': '四川省教育考试院',
  '贵州': '贵州省招生考试院', '云南': '云南省招生考试院',
  '陕西': '陕西省教育考试院', '甘肃': '甘肃省教育考试院',
  '青海': '青海省教育考试院', '宁夏': '宁夏教育考试院',
  '新疆': '新疆教育考试院', '内蒙古': '内蒙古自治区教育招生考试中心',
  '西藏': '西藏教育考试院', '辽宁': '辽宁省招生考试办公室',
  '吉林': '吉林省教育考试院', '黑龙江': '黑龙江省招生考试院',
  '海南': '海南省考试局'
};

// 从文章页提取文件下载链接
async function extractFileLinks(article) {
  console.log(`  解析: ${article.province} ${article.year} ${article.batchType}`);

  try {
    const resp = await axios.get(article.url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(resp.data);
    const fileLinks = [];
    const text = resp.data;

    // 方法1: 查找 <a> 标签中的文件链接
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      const linkText = $(el).text().trim();

      if (!href) return;

      // 提取文件扩展名
      const ext = path.extname(href.split('?')[0].split('&')[0]).toLowerCase();
      if (!FILE_EXTENSIONS.includes(ext)) return;

      // 确保是完整 URL
      const fullUrl = href.startsWith('http') ? href :
        (href.startsWith('/') ? `https:${href}` :
         (href.startsWith('//') ? `https:${href}` : href));

      fileLinks.push({
        url: fullUrl,
        text: linkText,
        ext,
        province: article.province,
        year: article.year,
        category: article.batchType,
        articleTitle: article.title,
      });
    });

    // 方法2: 在 HTML 文本中搜索 PDF/Excel 链接（有些链接以文本形式嵌入，不在 <a> 中）
    const urlRegex = /https?:\/\/[^\s"'<>]+\.(pdf|xls|xlsx|csv)(\?[^\s"'<>]*)?/gi;
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      const url = match[0].replace(/["']/g, '');
      const ext = path.extname(url.split('?')[0]).toLowerCase();

      // 检查是否已存在
      const exists = fileLinks.some(f => f.url === url);
      if (!exists && FILE_EXTENSIONS.includes(ext)) {
        fileLinks.push({
          url,
          text: '',
          ext,
          province: article.province,
          year: article.year,
          category: article.batchType,
          articleTitle: article.title,
        });
      }
    }

    // 去重
    const seen = new Set();
    const uniqueLinks = fileLinks.filter(f => {
      if (seen.has(f.url)) return false;
      seen.add(f.url);
      return true;
    });

    console.log(`    发现 ${uniqueLinks.length} 个文件链接`);
    return uniqueLinks;
  } catch (err) {
    console.error(`    解析失败: ${err.message}`);
    return [];
  }
}

// 下载文件
async function downloadFile(fileInfo) {
  const { url, province, year, category, ext } = fileInfo;

  // 构建文件名: 省份_年份_科类_序号.ext
  const timestamp = Date.now();
  const fileName = `${province}_${year}_${category}_${timestamp}${ext}`;
  const filePath = path.join(DOWNLOAD_DIR, fileName);

  // 检查是否已下载
  if (fs.existsSync(filePath)) {
    console.log(`  已存在: ${fileName}`);
    return fileName;
  }

  try {
    console.log(`  下载: ${fileName}`);
    const resp = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://gaokao.eol.cn/',
      },
    });

    fs.writeFileSync(filePath, resp.data);
    console.log(`    完成: ${(resp.data.length / 1024).toFixed(0)} KB`);
    return fileName;
  } catch (err) {
    console.error(`    下载失败: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('=== EOL 投档线文件下载器 ===\n');

  // 读取文章列表
  if (!fs.existsSync(ARTICLES_FILE)) {
    console.error(`请先运行 crawl-eol-links.js 生成 ${ARTICLES_FILE}`);
    process.exit(1);
  }

  const articles = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf-8'));
  console.log(`共 ${articles.length} 篇文章`);

  // 加载已存在的文件索引
  let existingIndex = [];
  if (fs.existsSync(FILES_INDEX)) {
    existingIndex = JSON.parse(fs.readFileSync(FILES_INDEX, 'utf-8'));
  }

  // 为每篇文章提取文件链接
  const allFileLinks = [];
  for (const article of articles) {
    const links = await extractFileLinks(article);
    allFileLinks.push(...links);
    // 延迟，避免请求过快
    await new Promise(r => setTimeout(r, 500));
  }

  // 去重文件链接
  const seen = new Set();
  const uniqueFiles = allFileLinks.filter(f => {
    const key = f.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`\n=== 文件统计 ===`);
  console.log(`总文件链接数: ${uniqueFiles.length}`);
  const byExt = {};
  for (const f of uniqueFiles) {
    byExt[f.ext] = (byExt[f.ext] || 0) + 1;
  }
  for (const [ext, count] of Object.entries(byExt).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${ext}: ${count} 个`);
  }

  // 下载文件（只下载新文件）
  console.log(`\n=== 开始下载 ===`);
  let downloaded = 0;
  const fileIndex = [...existingIndex];

  for (const fileInfo of uniqueFiles) {
    // 检查是否已下载
    const existing = fileIndex.find(f => f.url === fileInfo.url);
    if (existing) {
      console.log(`  跳过(已下载): ${existing.fileName}`);
      continue;
    }

    const fileName = await downloadFile(fileInfo);
    if (fileName) {
      fileIndex.push({ ...fileInfo, fileName, downloadedAt: new Date().toISOString() });
      downloaded++;
    }

    // 延迟，避免请求过快
    await new Promise(r => setTimeout(r, 1000));
  }

  // 保存文件索引
  fs.writeFileSync(FILES_INDEX, JSON.stringify(fileIndex, null, 2));
  console.log(`\n本次下载: ${downloaded} 个文件`);
  console.log(`累计: ${fileIndex.length} 个文件`);
  console.log(`索引: ${FILES_INDEX}`);
  console.log(`文件目录: ${DOWNLOAD_DIR}`);
}

main().catch(console.error);
