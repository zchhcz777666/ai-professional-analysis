const axios = require('axios');
const fs = require('fs');

async function exploreSamescore() {
  // 加载学校映射
  const schoolMap = JSON.parse(fs.readFileSync('gaokao-school-map.json', 'utf-8'));
  
  // 加载省份映射（从school name list中的proid）
  const provinceMap = {
    '11': '北京', '12': '天津', '13': '河北', '14': '山西', '15': '内蒙古',
    '21': '辽宁', '22': '吉林', '23': '黑龙江',
    '31': '上海', '32': '江苏', '33': '浙江', '34': '安徽', '35': '福建', '36': '江西', '37': '山东',
    '41': '河南', '42': '湖北', '43': '湖南', '44': '广东', '45': '广西', '46': '海南',
    '50': '重庆', '51': '四川', '52': '贵州', '53': '云南', '54': '西藏',
    '61': '陕西', '62': '甘肃', '63': '青海', '64': '宁夏', '65': '新疆',
    '81': '香港', '82': '澳门', '71': '台湾'
  };
  
  // 学校ID映射：将我们的universityId映射到gaokao.cn的school_id
  // 从uniMap.json或universities.ts获取
  const unis = JSON.parse(fs.readFileSync('gaokao-school-map.json', 'utf-8'));
  // 找我们系统中已知的大学 -> gaokao school_id映射
  const knownSchools = {
    '清华大学': { id: 'tsinghua' },
    '北京大学': { id: 'pku' },
    '浙江大学': { id: 'zju' },
    '上海交通大学': { id: 'sjtu' },
    '西安交通大学': { id: 'xjtu' },
    '哈尔滨工业大学': { id: 'hit' },
    '北京航空航天大学': { id: 'buaa' },
    '华中科技大学': { id: 'hust' },
    '电子科技大学': { id: 'uestc' },
    '南京大学': { id: 'nju' },
    '中国科学技术大学': { id: 'ustc' },
    '同济大学': { id: 'tongji' },
    '武汉大学': { id: 'whu' },
    '中山大学': { id: 'sysu' },
    '北京邮电大学': { id: 'bupt' },
    '东南大学': { id: 'seu' },
    '华南理工大学': { id: 'scut' },
    '大连理工大学': { id: 'dlut' },
    '南开大学': { id: 'nankai' },
    '中国人民大学': { id: 'ruc' },
    '厦门大学': { id: 'xmu' },
    '西北工业大学': { id: 'nwpu' },
    '湖南大学': { id: 'hnu' },
    '中南大学': { id: 'csu' },
    '北京理工大学': { id: 'bit' },
    '复旦大学': { id: 'fudan' },
    '天津大学': { id: 'tju' },
    '吉林大学': { id: 'jlu' },
    '重庆大学': { id: 'cqu' },
    '四川大学': { id: 'scu' },
    '山东大学': { id: 'sdu' },
    '北京师范大学': { id: 'bnu' },
    '华东师范大学': { id: 'ecnu' },
    '兰州大学': { id: 'lzu' },
    '西安电子科技大学': { id: 'xidian' },
    '南京航空航天大学': { id: 'nuaa' },
    '南京理工大学': { id: 'njust' },
    '西南交通大学': { id: 'swjtu' },
    '南京邮电大学': { id: 'njupt' },
    '杭州电子科技大学': { id: 'hdu' },
    '重庆邮电大学': { id: 'cqupt' },
    '深圳大学': { id: 'szu' },
    '东北大学': { id: 'neu' },
    '华南师范大学': { id: 'scnu' },
    '哈尔滨工程大学': { id: 'hrbeu' },
    '郑州大学': { id: 'zzu' },
    '福州大学': { id: 'fzu' },
    '安徽大学': { id: 'ahu' },
    '合肥工业大学': { id: 'hfut' },
    '北京工业大学': { id: 'bjut' },
    '河北工业大学': { id: 'hebut' },
    '南京信息工程大学': { id: 'nuist' },
    '西南大学': { id: 'swu' },
    '安徽师范大学': { id: 'ahnu' },
    '上海大学': { id: 'shu' },
    '北京化工大学': { id: 'buct' },
    '长安大学': { id: 'chd' },
    '太原理工大学': { id: 'tyut' },
    '贵州大学': { id: 'gzu' },
    '华北电力大学': { id: 'ncepu' },
    '大连海事大学': { id: 'dlmu' },
    '华中师范大学': { id: 'ccnu' },
    '东华大学': { id: 'dhu' },
    '中国矿业大学': { id: 'cumt' },
    '南昌大学': { id: 'nchu' },
    '云南大学': { id: 'ynu' },
    '广西大学': { id: 'gxu' },
    '海南大学': { id: 'hainanu' },
    '宁夏大学': { id: 'nxu' },
    '青海大学': { id: 'qhu' },
    '新疆大学': { id: 'xju' },
    '石河子大学': { id: 'shzu' },
    '内蒙古大学': { id: 'imu' },
    '西藏大学': { id: 'tibetu' },
    '延边大学': { id: 'ybu' },
    '东北电力大学': { id: 'neepu' },
    '昆明理工大学': { id: 'kmust' },
    '西安理工大学': { id: 'xaut' },
    '西安建筑科技大学': { id: 'xauat' },
    '陕西科技大学': { id: 'sust' },
    '西安科技大学': { id: 'xust' },
    '西安工业大学': { id: 'xatu' },
    '西安邮电大学': { id: 'xupt' },
    '西安工程大学': { id: 'xpu' },
    '中北大学': { id: 'nuc' },
    '山西大学': { id: 'sxu' },
    '河南大学': { id: 'henu' },
    '河南理工大学': { id: 'hpu' },
    '河南工业大学': { id: 'haut' },
    '河南科技大学': { id: 'haust' },
    '河南师范大学': { id: 'htu' },
    '湖北大学': { id: 'hubu' },
    '武汉科技大学': { id: 'wust' },
    '三峡大学': { id: 'ctgu' },
    '长沙理工大学': { id: 'csust' },
    '湘潭大学': { id: 'xtu' },
    '南华大学': { id: 'usc' },
    '湖南科技大学': { id: 'hnust' },
    '中南林业科技大学': { id: 'csfu' },
    '湖南工商大学': { id: 'hutb' },
    '青岛大学': { id: 'qdu' },
    '济南大学': { id: 'ujn' },
    '烟台大学': { id: 'ytu' },
    '鲁东大学': { id: 'ldu' },
    '山东科技大学': { id: 'sdkd' },
    '青岛科技大学': { id: 'qust' },
    '齐鲁工业大学': { id: 'qlu' },
    '山东师范大学': { id: 'sdnu' },
    '曲阜师范大学': { id: 'qfnu' },
    '河北大学': { id: 'hbu' },
    '燕山大学': { id: 'ysu' },
    '河北师范大学': { id: 'hebtu' },
    '浙江理工大学': { id: 'zstu' },
    '浙江工业大学': { id: 'zjut' },
    '中国计量大学': { id: 'cjlu' },
    '杭州师范大学': { id: 'hznu' },
    '宁波大学': { id: 'nbu' },
    '温州大学': { id: 'wzu' },
    '浙江师范大学': { id: 'zjnu' },
    '上海理工大学': { id: 'usst' },
    '上海海事大学': { id: 'shmtu' },
    '上海师范大学': { id: 'shnu' },
  };

  // 先看看samescore3 API能拿到什么数据
  console.log('=== 测试 samescore3 API ===');
  
  for (const score of [650, 600, 550, 500, 450, 400]) {
    try {
      const r = await axios.get('https://static-data.gaokao.cn/www/2.0/samescore3/2025/' + score + '.json', {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const data = r.data.data;
      if (!data) continue;
      
      let totalRecords = 0;
      Object.values(data).forEach(provData => {
        Object.values(provData).forEach(items => {
          totalRecords += items.length;
        });
      });
      
      console.log('Score ' + score + ': ' + totalRecords + ' records');
      
      // 看一条样例数据的完整结构
      if (score === 650) {
        const firstProv = Object.values(data)[0];
        const firstType = Object.values(firstProv)[0];
        if (firstType && firstType[0]) {
          console.log('  完整字段:', Object.keys(firstType[0]));
          console.log('  样例:', JSON.stringify(firstType[0], null, 2));
        }
        
        // 统计type/batch的分布
        const types = new Set();
        const batches = new Set();
        Object.values(data).forEach(provData => {
          Object.entries(provData).forEach(([type, items]) => {
            types.add(type);
            items.forEach(item => batches.add(item.batch));
          });
        });
        console.log('  Types:', [...types].join(', '));
        console.log('  Batches:', [...batches].join(', '));
      }
    } catch (e) {
      if (e.response?.status !== 404) {
        console.log('Score ' + score + ': ' + (e.response?.status || e.message));
      }
    }
  }
}

exploreSamescore().catch(console.error);
