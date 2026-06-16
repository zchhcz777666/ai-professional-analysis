const axios = require('axios');
const fs = require('fs');

async function main() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': 'https://gaokao.chsi.com.cn/',
  };

  // Test various URL patterns for the score page
  const tests = [
    { name: 'score tab direct', url: 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score' },
    { name: 'score tab old', url: 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?tab=score&provinceId=11&year=2024' },
    { name: 'no tab param', url: 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024' },
    { name: 'listHireInfo (往年录取信息)', url: 'https://gaokao.chsi.com.cn/sch/listHireInfo--schId-3,categoryId-36677,mindex-6.dhtml' },
    { name: 'schoolInfo with category', url: 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3,categoryId-36650,mindex-1.dhtml' },
    { name: '学校简介 category', url: 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3,categoryId-36655,mindex-2.dhtml' },
    { name: '录取规则 category', url: 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3,categoryId-36665,mindex-4.dhtml' },
    // Try with schId as query param
    { name: 'schoolInfo with schId param', url: 'https://gaokao.chsi.com.cn/sch/schoolInfo.dhtml?schId=3&provinceId=11&year=2024&tab=score' },
    // Try wap version with score
    { name: 'wap score page', url: 'https://gaokao.chsi.com.cn/wap/sch/score.html?schId=3&provinceId=11&year=2024' },
  ];

  for (const test of tests) {
    try {
      const res = await axios.get(test.url, { 
        headers, 
        timeout: 8000,
        maxRedirects: 0,  // Don't follow redirects
        validateStatus: status => status < 400
      });
      
      const finalUrl = res.request.res.responseUrl || res.request._redirectable?._redirectCount > 0 ? 'redirected' : test.url;
      
      console.log(`\n${test.name}:`);
      console.log(`  Status: ${res.status}`);
      console.log(`  Content-Type: ${res.headers['content-type'] || 'N/A'}`);
      console.log(`  HTML length: ${res.data.length}`);
      
      if (res.data.includes('最低分') || res.data.includes('平均分') || res.data.includes('录取人数')) {
        console.log(`  ★ CONTAINS SCORE DATA!`);
      }
      if (res.data.includes('table')) {
        console.log(`  Has tables: yes`);
      }
      
      // Check redirect
      const redirect = res.headers['location'];
      if (redirect) {
        console.log(`  Redirect to: ${redirect}`);
      }
      
    } catch (e) {
      if (e.response) {
        console.log(`\n${test.name}:`);
        console.log(`  Status: ${e.response.status}`);
        console.log(`  Redirect/Error: ${e.response.headers['location'] || e.message.substring(0, 60)}`);
      } else {
        console.log(`\n${test.name}: Error - ${e.message.substring(0, 60)}`);
      }
    }
  }
}

main().catch(e => console.error('Fatal:', e.message));