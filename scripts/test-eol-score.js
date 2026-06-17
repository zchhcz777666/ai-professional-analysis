/**
 * 精简版 eol.cn 2025 爬取 — 直接对每个学校-省份组合爬数据
 */
const fs = require('fs');
const path = require('path');

const PROVINCES = [
  { name: '北京', id: 11 }, { name: '天津', id: 12 }, { name: '河北', id: 13 },
  { name: '山西', id: 14 }, { name: '内蒙古', id: 15 },
  { name: '辽宁', id: 21 }, { name: '吉林', id: 22 }, { name: '黑龙江', id: 23 },
  { name: '上海', id: 31 }, { name: '江苏', id: 32 }, { name: '浙江', id: 33 },
  { name: '安徽', id: 34 }, { name: '福建', id: 35 }, { name: '江西', id: 36 },
  { name: '山东', id: 37 }, { name: '河南', id: 41 }, { name: '湖北', id: 42 },
  { name: '湖南', id: 43 }, { name: '广东', id: 44 }, { name: '广西', id: 45 },
  { name: '海南', id: 46 }, { name: '重庆', id: 50 }, { name: '四川', id: 51 },
  { name: '贵州', id: 52 }, { name: '云南', id: 53 }, { name: '西藏', id: 54 },
  { name: '陕西', id: 61 }, { name: '甘肃', id: 62 }, { name: '青海', id: 63 },
  { name: '宁夏', id: 64 }, { name: '新疆', id: 65 },
];

const API_BASE = 'https://api.eol.cn/gkcx/api/';
const UA = 'Mozilla/5.0';
const YEAR = 2025;
const OUTPUT = path.join(__dirname, 'crawled-data', 'api-records.json');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithRetry(url, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, timeout: 10000 });
      const d = await r.json();
      if (d.code === '1069') {
        const wait = Math.min(30000 + i * 10000, 60000);
        console.log(`  限流 #${i+1}, 等待 ${wait/1000}s`);
        await sleep(wait);
        continue;
      }
      return d;
    } catch(e) {
      console.log(`  请求失败 #${i+1}: ${e.message.substring(0, 40)}`);
      await sleep(5000);
    }
  }
  return null;
}

// 直接测试一个学校-省份的分数查询
async function testScoreAPI() {
  // 清华 school_id=140, 北京 prov_id=11
  const url = `${API_BASE}?access_token=&local_province_id=11&school_id=140&signsafe=&uri=apidata/api/gk/score/province&year=${YEAR}`;
  console.log('测试 API:', url.substring(0, 100));
  const d = await fetchWithRetry(url);
  if (d && d.data?.item) {
    console.log(`找到 ${d.data.item.length} 条记录`);
    console.log('样本:', JSON.stringify(d.data.item[0]));
  } else {
    console.log('API 返回:', JSON.stringify(d).substring(0, 200));
  }
}

testScoreAPI().catch(e => console.error('错误:', e));
