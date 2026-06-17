/**
 * 阳光志愿平台结构探索脚本
 * 用于了解 gaokao.chsi.com.cn 的页面结构
 */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function main() {
  // 1. 先看首页
  console.log('=== 阳光高考首页 ===');
  const r1 = await fetch('https://gaokao.chsi.com.cn/', { headers: { 'User-Agent': UA } });
  const html = await r1.text();
  console.log('标题:', html.match(/<title>([^<]+)<\/title>/i)?.[1] || 'none');
  console.log('长度:', html.length, 'bytes');
  
  // 找所有链接
  const links = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]).filter(l => l.length > 5 && l.length < 100);
  const keyLinks = links.filter(l => /login|signin|service|zy|yk|school|score|志愿|查询|data/i.test(l));
  console.log('关键链接:', keyLinks.slice(0, 15));

  // 2. 看登录页面
  console.log('\n=== 登录页面 ===');
  const r2 = await fetch('https://account.chsi.com.cn/account/login', { 
    headers: { 'User-Agent': UA },
    redirect: 'manual'
  });
  const loginHtml = await r2.text();
  console.log('登录页标题:', loginHtml.match(/<title>([^<]+)<\/title>/i)?.[1] || 'none');
  console.log('登录页长度:', loginHtml.length);

  // 3. 看院校库页面（公开可访问的）
  console.log('\n=== 院校库 ===');
  const r3 = await fetch('https://gaokao.chsi.com.cn/zz/yz/school/', {
    headers: { 'User-Agent': UA }
  });
  const schoolHtml = await r3.text();
  console.log('院校库标题:', schoolHtml.match(/<title>([^<]+)<\/title>/i)?.[1] || 'none');
  console.log('长度:', schoolHtml.length);
  
  // 找搜索接口
  const apiCalls = [...schoolHtml.matchAll(/url|api|fetch|ajax|action="([^"]+)"/g)].map(m => m[1]).filter(Boolean);
  console.log('API 相关:', apiCalls.slice(0, 10));
  
  // 4. 找录取数据API
  console.log('\n=== 录取数据接口 ===');
  const endpoints = [
    'https://gaokao.chsi.com.cn/zz/yz/school/score/',
    'https://gaokao.chsi.com.cn/zz/yz/school/search/',
    'https://gaokao.chsi.com.cn/api/school/score/',
    'https://gaokao.chsi.com.cn/zz/yz/school/province/',
  ];
  for (const url of endpoints) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      console.log(url.slice(40), '->', r.status, (await r.text()).substring(0, 100));
    } catch(e) {
      console.log(url.slice(40), '-> ERROR');
    }
  }

  console.log('\n探索完成');
}

main().catch(e => console.error(e));
