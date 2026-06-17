const axios = require('axios');
const fs = require('fs');

async function main() {
  // Download the largest vendor chunk and search for API patterns
  const files = [
    'https://www.gaokao.cn/static/js/2026_06_16_11_57.9d74b435d8310b7ce442.main~139f7333.chunk.js',
    'https://www.gaokao.cn/static/js/2026_06_16_11_57.57c7a1742fdd91810f5a.main~ab8de4ae.chunk.js',
    'https://www.gaokao.cn/static/js/2026_06_16_11_57.31aa4dd1214f55072ce9.main~0520be64.chunk.js',
  ];

  const allApiUrls = new Set();
  for (const file of files) {
    try {
      const r = await axios.get(file, { timeout: 15000 });
      const js = r.data;
      
      // Find all quoted strings that look like API URLs
      const patterns = [
        /["'](https?:\/\/[^"']*(?:gaokao|eol|chsi)[^"']*(?:\/api\/|\/v[12]\/|\/www\/)[^"']*)["']/gi,
        /["'](\/[a-z]{2,}\/[a-z]{2,}\/[a-z]+\/\d+[^"']*(?:\.json)?(?:\?[^"']*)?)["']/gi,
        /["']((?:\/[a-z_]+){2,}\/[a-z0-9_]+\.json)["']/gi,
      ];
      
      for (const p of patterns) {
        let m;
        while ((m = p.exec(js)) !== null) {
          allApiUrls.add(m[1]);
        }
      }
    } catch (e) {
      console.log('Error:', file.split('/').pop(), e.message);
    }
  }

  console.log('=== Unique API URLs/Paths found ===');
  [...allApiUrls].sort().forEach(u => console.log(u));

  // Save combined JS for manual inspection
  console.log('\nDownloading complete...');
}

main().catch(console.error);
