/**
 * 爬虫 Step 1: 从 eol.cn 汇总页提取各省投档线文章链接
 *
 * 运行: node scripts/crawl-eol-links.js
 * 输出: scripts/crawled-data/eol-articles.json
 *
 * 数据来源: https://www.eol.cn/e_html/gk/gktoudang/index.shtml
 * 各省考试院在 eol.cn 上发布投档线文章，包含本科普通批/本科批的投档数据
 */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'crawled-data');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// 需要爬取的年份（本次仅爬取 2025 年）
const YEARS = [2025, 2024, 2023, 2022, 2021];

// 省份拼音映射（eol.cn URL 中的拼音）
const PROVINCE_PINYIN = {
  '北京': 'bei_jing', '天津': 'tian_jin', '上海': 'shang_hai', '重庆': 'chong_qing',
  '河北': 'he_bei', '河南': 'he_nan', '山东': 'shan_dong', '山西': 'shan_xi',
  '安徽': 'an_hui', '江西': 'jiang_xi', '江苏': 'jiang_su', '浙江': 'zhe_jiang',
  '湖北': 'hu_bei', '湖南': 'hu_nan', '广东': 'guang_dong', '广西': 'guang_xi',
  '福建': 'fu_jian', '四川': 'si_chuan', '贵州': 'gui_zhou', '云南': 'yun_nan',
  '陕西': 'shan_xi2', '甘肃': 'gan_su', '青海': 'qing_hai', '宁夏': 'ning_xia',
  '新疆': 'xin_jiang', '内蒙古': 'nei_meng_gu', '西藏': 'xi_zang',
  '辽宁': 'liao_ning', '吉林': 'ji_lin', '黑龙江': 'hei_long_jiang',
  '海南': 'hai_nan'
};

// 反向映射：拼音 → 省份名
const PINYIN_PROVINCE = {};
for (const [prov, py] of Object.entries(PROVINCE_PINYIN)) {
  PINYIN_PROVINCE[py] = prov;
}

// 汇总页 URL（按年份）
function getYearPageUrl(year) {
  if (year === 2025) {
    return 'https://www.eol.cn/e_html/gk/gktoudang/index.shtml';
  }
  return `https://gaokao.eol.cn/e_html/gk/gktoudang/${year}.shtml`;
}

// 从文章标题判断批次类型
function getBatchType(title) {
  const t = title.replace(/\s/g, '');
  // 排除非普通批次
  if (/提前批|艺术|体育|军士|定向|征集|征求|专项|强基|综合评价|高水平|保送/.test(t)) {
    return null;
  }
  // 普通本科批
  if (/本科普通批|普通本科批|本科批/.test(t)) {
    if (/物理/.test(t)) return '物理类';
    if (/历史/.test(t)) return '历史类';
    if (/综合/.test(t)) return '综合';
    return '物理类'; // 默认为物理类（多数省份分开发布）
  }
  // 普通类一段（浙江）
  if (/普通类.*段/.test(t)) return '综合';
  // 常规批（山东）
  if (/常规批/.test(t)) return '综合';
  return null;
}

// 从文章标题和内容提取年份
function extractYear(title, content) {
  const yearMatch = title.match(/20\d{2}/) || content.match(/20\d{2}/);
  return yearMatch ? parseInt(yearMatch[0]) : null;
}

async function crawlYearPage(year) {
  const url = getYearPageUrl(year);
  console.log(`\n[${year}] 爬取汇总页: ${url}`);

  try {
    const resp = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(resp.data);
    const articles = [];

    // 找到所有链接
    $('a[href*="dongtai/20"]').each((i, el) => {
      const href = $(el).attr('href');
      const title = $(el).text().trim();
      if (!href || !title) return;

      const fullUrl = href.startsWith('http') ? href : `https://gaokao.eol.cn${href.startsWith('/') ? '' : '/'}${href}`;

      // 从 URL 提取省份
      const provMatch = fullUrl.match(/\/\/([^.]+)\.eol\.cn\/([^/]+)\/dongtai/);
      let province = null;
      if (provMatch) {
        province = PINYIN_PROVINCE[provMatch[2]];
      }

      // 从文章页面提取的年份
      const artYear = extractYear(title, '');

      articles.push({
        title,
        url: fullUrl,
        province: province || '未知',
        year: artYear || year,
        batchType: getBatchType(title),
      });
    });

    // 过滤：只保留本科普通批且有省份信息的
    const filtered = articles.filter(a => a.batchType && a.province !== '未知');
    console.log(`  [${year}] 找到 ${articles.length} 个链接，其中 ${filtered.length} 个本科批文章`);

    return filtered;
  } catch (err) {
    console.error(`  [${year}] 爬取失败: ${err.message}`);
    return [];
  }
}

async function main() {
  console.log('=== EOL 投档线文章链接爬虫 ===\n');

  const allArticles = [];

  // 按年份爬取汇总页
  for (const year of YEARS) {
    const articles = await crawlYearPage(year);
    allArticles.push(...articles);
  }

  // 去重
  const seen = new Set();
  const uniqueArticles = allArticles.filter(a => {
    const key = a.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 按省份分组统计
  const byProvince = {};
  for (const a of uniqueArticles) {
    if (!byProvince[a.province]) byProvince[a.province] = [];
    byProvince[a.province].push(a);
  }

  console.log(`\n=== 统计 ===`);
  console.log(`总文章数: ${uniqueArticles.length}`);
  console.log(`覆盖省份: ${Object.keys(byProvince).length}`);
  console.log(`\n各省文章数:`);
  for (const [prov, arts] of Object.entries(byProvince).sort((a, b) => b[1].length - a[1].length)) {
    const years = [...new Set(arts.map(a => a.year))].sort();
    const types = [...new Set(arts.map(a => a.batchType))];
    console.log(`  ${prov}: ${arts.length} 篇 (${years.join('/')}) [${types.join(', ')}]`);
  }

  // 输出
  const outputPath = path.join(OUT_DIR, 'eol-articles.json');
  fs.writeFileSync(outputPath, JSON.stringify(uniqueArticles, null, 2));
  console.log(`\n输出: ${outputPath}`);
}

main().catch(console.error);
