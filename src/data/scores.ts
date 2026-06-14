import { ScoreRecord } from '@/types'

// 各高校历年录取分数线数据（AI专业）
// 数据结构：按省份、年份记录最低分/平均分/最低位次/平均位次
// 注意：以下为参考数据，实际使用时需替换为真实数据

export const scoreRecords: ScoreRecord[] = [
  // ===== 北京 =====
  // 清华大学
  { universityId: 'tsinghua', province: '北京', year: 2024, category: '物理类', minScore: 688, avgScore: 693, minRank: 380, avgRank: 280, enrollment: 5 },
  { universityId: 'tsinghua', province: '北京', year: 2023, category: '物理类', minScore: 685, avgScore: 690, minRank: 400, avgRank: 300, enrollment: 5 },
  { universityId: 'tsinghua', province: '北京', year: 2022, category: '理科', minScore: 688, avgScore: 692, minRank: 390, avgRank: 290, enrollment: 4 },
  // 北京大学
  { universityId: 'pku', province: '北京', year: 2024, category: '物理类', minScore: 686, avgScore: 691, minRank: 420, avgRank: 310, enrollment: 4 },
  { universityId: 'pku', province: '北京', year: 2023, category: '物理类', minScore: 683, avgScore: 688, minRank: 440, avgRank: 320, enrollment: 4 },
  { universityId: 'pku', province: '北京', year: 2022, category: '理科', minScore: 685, avgScore: 690, minRank: 430, avgRank: 310, enrollment: 4 },
  // 北航
  { universityId: 'buaa', province: '北京', year: 2024, category: '物理类', minScore: 662, avgScore: 668, minRank: 2100, avgRank: 1700, enrollment: 8 },
  { universityId: 'buaa', province: '北京', year: 2023, category: '物理类', minScore: 658, avgScore: 664, minRank: 2200, avgRank: 1800, enrollment: 8 },
  { universityId: 'buaa', province: '北京', year: 2022, category: '理科', minScore: 660, avgScore: 666, minRank: 2150, avgRank: 1750, enrollment: 7 },
  // 北邮
  { universityId: 'bupt', province: '北京', year: 2024, category: '物理类', minScore: 643, avgScore: 649, minRank: 4100, avgRank: 3500, enrollment: 10 },
  { universityId: 'bupt', province: '北京', year: 2023, category: '物理类', minScore: 639, avgScore: 645, minRank: 4300, avgRank: 3700, enrollment: 10 },
  { universityId: 'bupt', province: '北京', year: 2022, category: '理科', minScore: 641, avgScore: 647, minRank: 4200, avgRank: 3600, enrollment: 9 },
  // 人大
  { universityId: 'ruc', province: '北京', year: 2024, category: '物理类', minScore: 665, avgScore: 670, minRank: 1800, avgRank: 1500, enrollment: 5 },
  { universityId: 'ruc', province: '北京', year: 2023, category: '物理类', minScore: 661, avgScore: 666, minRank: 1900, avgRank: 1600, enrollment: 5 },
  { universityId: 'ruc', province: '北京', year: 2022, category: '理科', minScore: 663, avgScore: 668, minRank: 1850, avgRank: 1550, enrollment: 5 },
  // 北交大
  { universityId: 'cug', province: '北京', year: 2024, category: '物理类', minScore: 628, avgScore: 634, minRank: 5800, avgRank: 5100, enrollment: 8 },
  { universityId: 'cug', province: '北京', year: 2023, category: '物理类', minScore: 624, avgScore: 630, minRank: 6000, avgRank: 5300, enrollment: 8 },
  { universityId: 'cug', province: '北京', year: 2022, category: '理科', minScore: 626, avgScore: 632, minRank: 5900, avgRank: 5200, enrollment: 7 },

  // ===== 河南 =====
  { universityId: 'tsinghua', province: '河南', year: 2024, category: '理科', minScore: 698, avgScore: 703, minRank: 94, avgRank: 60, enrollment: 3 },
  { universityId: 'tsinghua', province: '河南', year: 2023, category: '理科', minScore: 695, avgScore: 700, minRank: 100, avgRank: 65, enrollment: 3 },
  { universityId: 'tsinghua', province: '河南', year: 2022, category: '理科', minScore: 693, avgScore: 698, minRank: 105, avgRank: 68, enrollment: 3 },
  { universityId: 'pku', province: '河南', year: 2024, category: '理科', minScore: 696, avgScore: 701, minRank: 110, avgRank: 72, enrollment: 3 },
  { universityId: 'pku', province: '河南', year: 2023, category: '理科', minScore: 693, avgScore: 698, minRank: 115, avgRank: 75, enrollment: 3 },
  { universityId: 'zju', province: '河南', year: 2024, category: '理科', minScore: 678, avgScore: 683, minRank: 580, avgRank: 420, enrollment: 4 },
  { universityId: 'zju', province: '河南', year: 2023, category: '理科', minScore: 675, avgScore: 680, minRank: 610, avgRank: 450, enrollment: 4 },
  { universityId: 'zju', province: '河南', year: 2022, category: '理科', minScore: 672, avgScore: 677, minRank: 630, avgRank: 470, enrollment: 4 },
  { universityId: 'sjtu', province: '河南', year: 2024, category: '理科', minScore: 676, avgScore: 681, minRank: 650, avgRank: 480, enrollment: 4 },
  { universityId: 'sjtu', province: '河南', year: 2023, category: '理科', minScore: 673, avgScore: 678, minRank: 680, avgRank: 510, enrollment: 4 },
  { universityId: 'nju', province: '河南', year: 2024, category: '理科', minScore: 670, avgScore: 675, minRank: 820, avgRank: 620, enrollment: 3 },
  { universityId: 'nju', province: '河南', year: 2023, category: '理科', minScore: 667, avgScore: 672, minRank: 860, avgRank: 650, enrollment: 3 },
  { universityId: 'nju', province: '河南', year: 2022, category: '理科', minScore: 664, avgScore: 669, minRank: 890, avgRank: 680, enrollment: 3 },
  { universityId: 'ustc', province: '河南', year: 2024, category: '理科', minScore: 672, avgScore: 677, minRank: 750, avgRank: 560, enrollment: 3 },
  { universityId: 'ustc', province: '河南', year: 2023, category: '理科', minScore: 669, avgScore: 674, minRank: 790, avgRank: 590, enrollment: 3 },
  { universityId: 'hust', province: '河南', year: 2024, category: '理科', minScore: 650, avgScore: 656, minRank: 2800, avgRank: 2200, enrollment: 5 },
  { universityId: 'hust', province: '河南', year: 2023, category: '理科', minScore: 646, avgScore: 652, minRank: 3000, avgRank: 2400, enrollment: 5 },
  { universityId: 'hust', province: '河南', year: 2022, category: '理科', minScore: 643, avgScore: 649, minRank: 3100, avgRank: 2500, enrollment: 5 },
  { universityId: 'xjtu', province: '河南', year: 2024, category: '理科', minScore: 648, avgScore: 654, minRank: 3100, avgRank: 2500, enrollment: 4 },
  { universityId: 'xjtu', province: '河南', year: 2023, category: '理科', minScore: 644, avgScore: 650, minRank: 3300, avgRank: 2700, enrollment: 4 },
  { universityId: 'uestc', province: '河南', year: 2024, category: '理科', minScore: 645, avgScore: 651, minRank: 3500, avgRank: 2800, enrollment: 5 },
  { universityId: 'uestc', province: '河南', year: 2023, category: '理科', minScore: 641, avgScore: 647, minRank: 3700, avgRank: 3000, enrollment: 5 },
  { universityId: 'uestc', province: '河南', year: 2022, category: '理科', minScore: 638, avgScore: 644, minRank: 3800, avgRank: 3100, enrollment: 5 },
  { universityId: 'hit', province: '河南', year: 2024, category: '理科', minScore: 646, avgScore: 652, minRank: 3200, avgRank: 2600, enrollment: 4 },
  { universityId: 'hit', province: '河南', year: 2023, category: '理科', minScore: 642, avgScore: 648, minRank: 3400, avgRank: 2800, enrollment: 4 },
  { universityId: 'buaa', province: '河南', year: 2024, category: '理科', minScore: 656, avgScore: 662, minRank: 2300, avgRank: 1800, enrollment: 4 },
  { universityId: 'buaa', province: '河南', year: 2023, category: '理科', minScore: 652, avgScore: 658, minRank: 2500, avgRank: 2000, enrollment: 4 },
  { universityId: 'bupt', province: '河南', year: 2024, category: '理科', minScore: 632, avgScore: 638, minRank: 5800, avgRank: 4900, enrollment: 6 },
  { universityId: 'bupt', province: '河南', year: 2023, category: '理科', minScore: 628, avgScore: 634, minRank: 6100, avgRank: 5200, enrollment: 6 },
  { universityId: 'bupt', province: '河南', year: 2022, category: '理科', minScore: 625, avgScore: 631, minRank: 6300, avgRank: 5400, enrollment: 6 },
  { universityId: 'whu', province: '河南', year: 2024, category: '理科', minScore: 644, avgScore: 650, minRank: 3600, avgRank: 2900, enrollment: 5 },
  { universityId: 'whu', province: '河南', year: 2023, category: '理科', minScore: 640, avgScore: 646, minRank: 3800, avgRank: 3100, enrollment: 5 },
  { universityId: 'scut', province: '河南', year: 2024, category: '理科', minScore: 636, avgScore: 642, minRank: 4600, avgRank: 3800, enrollment: 5 },
  { universityId: 'scut', province: '河南', year: 2023, category: '理科', minScore: 632, avgScore: 638, minRank: 4900, avgRank: 4100, enrollment: 5 },
  { universityId: 'hit_sz', province: '河南', year: 2024, category: '理科', minScore: 652, avgScore: 658, minRank: 2500, avgRank: 2000, enrollment: 4 },
  { universityId: 'hit_sz', province: '河南', year: 2023, category: '理科', minScore: 648, avgScore: 654, minRank: 2700, avgRank: 2200, enrollment: 4 },
  { universityId: 'seu', province: '河南', year: 2024, category: '理科', minScore: 640, avgScore: 646, minRank: 3800, avgRank: 3100, enrollment: 4 },
  { universityId: 'seu', province: '河南', year: 2023, category: '理科', minScore: 636, avgScore: 642, minRank: 4100, avgRank: 3400, enrollment: 4 },
  { universityId: 'dlut', province: '河南', year: 2024, category: '理科', minScore: 630, avgScore: 636, minRank: 5300, avgRank: 4500, enrollment: 4 },
  { universityId: 'dlut', province: '河南', year: 2023, category: '理科', minScore: 626, avgScore: 632, minRank: 5600, avgRank: 4800, enrollment: 4 },
  { universityId: 'nwpu', province: '河南', year: 2024, category: '理科', minScore: 638, avgScore: 644, minRank: 4200, avgRank: 3500, enrollment: 4 },
  { universityId: 'nwpu', province: '河南', year: 2023, category: '理科', minScore: 634, avgScore: 640, minRank: 4500, avgRank: 3800, enrollment: 4 },
  { universityId: 'hnu', province: '河南', year: 2024, category: '理科', minScore: 622, avgScore: 628, minRank: 7000, avgRank: 6000, enrollment: 4 },
  { universityId: 'hnu', province: '河南', year: 2023, category: '理科', minScore: 618, avgScore: 624, minRank: 7400, avgRank: 6400, enrollment: 4 },
  { universityId: 'csu', province: '河南', year: 2024, category: '理科', minScore: 624, avgScore: 630, minRank: 6600, avgRank: 5600, enrollment: 4 },
  { universityId: 'csu', province: '河南', year: 2023, category: '理科', minScore: 620, avgScore: 626, minRank: 7000, avgRank: 6000, enrollment: 4 },
  { universityId: 'nankai', province: '河南', year: 2024, category: '理科', minScore: 638, avgScore: 644, minRank: 4200, avgRank: 3500, enrollment: 3 },
  { universityId: 'nankai', province: '河南', year: 2023, category: '理科', minScore: 634, avgScore: 640, minRank: 4500, avgRank: 3800, enrollment: 3 },
  { universityId: 'tongji', province: '河南', year: 2024, category: '理科', minScore: 654, avgScore: 660, minRank: 2400, avgRank: 1900, enrollment: 3 },
  { universityId: 'tongji', province: '河南', year: 2023, category: '理科', minScore: 650, avgScore: 656, minRank: 2600, avgRank: 2100, enrollment: 3 },
  { universityId: 'sysu', province: '河南', year: 2024, category: '理科', minScore: 634, avgScore: 640, minRank: 4500, avgRank: 3800, enrollment: 3 },
  { universityId: 'sysu', province: '河南', year: 2023, category: '理科', minScore: 630, avgScore: 636, minRank: 4800, avgRank: 4100, enrollment: 3 },
  { universityId: 'xmu', province: '河南', year: 2024, category: '理科', minScore: 618, avgScore: 624, minRank: 7400, avgRank: 6400, enrollment: 3 },
  { universityId: 'xmu', province: '河南', year: 2023, category: '理科', minScore: 614, avgScore: 620, minRank: 7800, avgRank: 6800, enrollment: 3 },
  { universityId: 'cug', province: '河南', year: 2024, category: '理科', minScore: 614, avgScore: 620, minRank: 7800, avgRank: 6800, enrollment: 5 },
  { universityId: 'cug', province: '河南', year: 2023, category: '理科', minScore: 610, avgScore: 616, minRank: 8200, avgRank: 7200, enrollment: 5 },

  // ===== 广东 =====
  { universityId: 'tsinghua', province: '广东', year: 2024, category: '物理类', minScore: 692, avgScore: 697, minRank: 120, avgRank: 80, enrollment: 3 },
  { universityId: 'pku', province: '广东', year: 2024, category: '物理类', minScore: 690, avgScore: 695, minRank: 140, avgRank: 90, enrollment: 3 },
  { universityId: 'zju', province: '广东', year: 2024, category: '物理类', minScore: 672, avgScore: 677, minRank: 680, avgRank: 500, enrollment: 4 },
  { universityId: 'sjtu', province: '广东', year: 2024, category: '物理类', minScore: 670, avgScore: 675, minRank: 750, avgRank: 560, enrollment: 4 },
  { universityId: 'nju', province: '广东', year: 2024, category: '物理类', minScore: 664, avgScore: 669, minRank: 1000, avgRank: 780, enrollment: 3 },
  { universityId: 'hust', province: '广东', year: 2024, category: '物理类', minScore: 642, avgScore: 648, minRank: 4500, avgRank: 3600, enrollment: 5 },
  { universityId: 'uestc', province: '广东', year: 2024, category: '物理类', minScore: 638, avgScore: 644, minRank: 5200, avgRank: 4200, enrollment: 5 },
  { universityId: 'hit_sz', province: '广东', year: 2024, category: '物理类', minScore: 650, avgScore: 656, minRank: 2800, avgRank: 2200, enrollment: 6 },
  { universityId: 'scut', province: '广东', year: 2024, category: '物理类', minScore: 630, avgScore: 636, minRank: 6200, avgRank: 5200, enrollment: 8 },
  { universityId: 'scut', province: '广东', year: 2023, category: '物理类', minScore: 626, avgScore: 632, minRank: 6600, avgRank: 5600, enrollment: 8 },
  { universityId: 'scut', province: '广东', year: 2022, category: '理科', minScore: 623, avgScore: 629, minRank: 6800, avgRank: 5800, enrollment: 7 },
  { universityId: 'sysu', province: '广东', year: 2024, category: '物理类', minScore: 628, avgScore: 634, minRank: 6800, avgRank: 5800, enrollment: 8 },
  { universityId: 'sysu', province: '广东', year: 2023, category: '物理类', minScore: 624, avgScore: 630, minRank: 7200, avgRank: 6200, enrollment: 8 },
  { universityId: 'bupt', province: '广东', year: 2024, category: '物理类', minScore: 626, avgScore: 632, minRank: 7000, avgRank: 6000, enrollment: 5 },

  // ===== 四川 =====
  { universityId: 'tsinghua', province: '四川', year: 2024, category: '理科', minScore: 695, avgScore: 700, minRank: 80, avgRank: 52, enrollment: 3 },
  { universityId: 'pku', province: '四川', year: 2024, category: '理科', minScore: 693, avgScore: 698, minRank: 95, avgRank: 62, enrollment: 3 },
  { universityId: 'zju', province: '四川', year: 2024, category: '理科', minScore: 676, avgScore: 681, minRank: 520, avgRank: 380, enrollment: 4 },
  { universityId: 'uestc', province: '四川', year: 2024, category: '理科', minScore: 648, avgScore: 654, minRank: 3200, avgRank: 2600, enrollment: 10 },
  { universityId: 'uestc', province: '四川', year: 2023, category: '理科', minScore: 644, avgScore: 650, minRank: 3400, avgRank: 2800, enrollment: 10 },
  { universityId: 'uestc', province: '四川', year: 2022, category: '理科', minScore: 641, avgScore: 647, minRank: 3500, avgRank: 2900, enrollment: 9 },
  { universityId: 'hust', province: '四川', year: 2024, category: '理科', minScore: 646, avgScore: 652, minRank: 3500, avgRank: 2800, enrollment: 5 },
  { universityId: 'hit_sz', province: '四川', year: 2024, category: '理科', minScore: 652, avgScore: 658, minRank: 2600, avgRank: 2100, enrollment: 4 },
  { universityId: 'bupt', province: '四川', year: 2024, category: '理科', minScore: 632, avgScore: 638, minRank: 6000, avgRank: 5100, enrollment: 5 },
  { universityId: 'scut', province: '四川', year: 2024, category: '理科', minScore: 634, avgScore: 640, minRank: 5600, avgRank: 4700, enrollment: 4 },

  // ===== 湖北 =====
  { universityId: 'tsinghua', province: '湖北', year: 2024, category: '物理类', minScore: 690, avgScore: 695, minRank: 100, avgRank: 68, enrollment: 3 },
  { universityId: 'hust', province: '湖北', year: 2024, category: '物理类', minScore: 638, avgScore: 644, minRank: 5200, avgRank: 4300, enrollment: 12 },
  { universityId: 'hust', province: '湖北', year: 2023, category: '物理类', minScore: 634, avgScore: 640, minRank: 5500, avgRank: 4600, enrollment: 12 },
  { universityId: 'hust', province: '湖北', year: 2022, category: '理科', minScore: 631, avgScore: 637, minRank: 5700, avgRank: 4800, enrollment: 11 },
  { universityId: 'whu', province: '湖北', year: 2024, category: '物理类', minScore: 634, avgScore: 640, minRank: 5500, avgRank: 4600, enrollment: 8 },
  { universityId: 'whu', province: '湖北', year: 2023, category: '物理类', minScore: 630, avgScore: 636, minRank: 5800, avgRank: 4900, enrollment: 8 },
  { universityId: 'bupt', province: '湖北', year: 2024, category: '物理类', minScore: 622, avgScore: 628, minRank: 7400, avgRank: 6400, enrollment: 5 },

  // ===== 江苏 =====
  { universityId: 'nju', province: '江苏', year: 2024, category: '物理类', minScore: 668, avgScore: 673, minRank: 600, avgRank: 450, enrollment: 5 },
  { universityId: 'nju', province: '江苏', year: 2023, category: '物理类', minScore: 665, avgScore: 670, minRank: 640, avgRank: 480, enrollment: 5 },
  { universityId: 'seu', province: '江苏', year: 2024, category: '物理类', minScore: 646, avgScore: 652, minRank: 3200, avgRank: 2600, enrollment: 6 },
  { universityId: 'seu', province: '江苏', year: 2023, category: '物理类', minScore: 642, avgScore: 648, minRank: 3500, avgRank: 2900, enrollment: 6 },
  { universityId: 'zju', province: '江苏', year: 2024, category: '物理类', minScore: 674, avgScore: 679, minRank: 450, avgRank: 330, enrollment: 4 },

  // ===== 山东 =====
  { universityId: 'tsinghua', province: '山东', year: 2024, category: '综合', minScore: 691, avgScore: 696, minRank: 110, avgRank: 75, enrollment: 3 },
  { universityId: 'pku', province: '山东', year: 2024, category: '综合', minScore: 689, avgScore: 694, minRank: 130, avgRank: 88, enrollment: 3 },
  { universityId: 'zju', province: '山东', year: 2024, category: '综合', minScore: 674, avgScore: 679, minRank: 600, avgRank: 440, enrollment: 4 },
  { universityId: 'hust', province: '山东', year: 2024, category: '综合', minScore: 646, avgScore: 652, minRank: 3800, avgRank: 3100, enrollment: 5 },
  { universityId: 'uestc', province: '山东', year: 2024, category: '综合', minScore: 642, avgScore: 648, minRank: 4400, avgRank: 3600, enrollment: 4 },
  { universityId: 'bupt', province: '山东', year: 2024, category: '综合', minScore: 628, avgScore: 634, minRank: 7200, avgRank: 6200, enrollment: 5 },
  { universityId: 'hit_sz', province: '山东', year: 2024, category: '综合', minScore: 652, avgScore: 658, minRank: 2800, avgRank: 2200, enrollment: 4 },

  // ===== 河北 =====
  { universityId: 'tsinghua', province: '河北', year: 2024, category: '物理类', minScore: 694, avgScore: 699, minRank: 60, avgRank: 38, enrollment: 3 },
  { universityId: 'zju', province: '河北', year: 2024, category: '物理类', minScore: 676, avgScore: 681, minRank: 380, avgRank: 270, enrollment: 4 },
  { universityId: 'hust', province: '河北', year: 2024, category: '物理类', minScore: 644, avgScore: 650, minRank: 3400, avgRank: 2700, enrollment: 5 },
  { universityId: 'uestc', province: '河北', year: 2024, category: '物理类', minScore: 640, avgScore: 646, minRank: 4000, avgRank: 3300, enrollment: 5 },
  { universityId: 'bupt', province: '河北', year: 2024, category: '物理类', minScore: 626, avgScore: 632, minRank: 6800, avgRank: 5800, enrollment: 5 },

  // ===== 浙江 =====
  { universityId: 'zju', province: '浙江', year: 2024, category: '综合', minScore: 672, avgScore: 677, minRank: 500, avgRank: 370, enrollment: 15 },
  { universityId: 'zju', province: '浙江', year: 2023, category: '综合', minScore: 668, avgScore: 673, minRank: 540, avgRank: 400, enrollment: 15 },
  { universityId: 'nju', province: '浙江', year: 2024, category: '综合', minScore: 666, avgScore: 671, minRank: 650, avgRank: 490, enrollment: 4 },
  { universityId: 'sjtu', province: '浙江', year: 2024, category: '综合', minScore: 670, avgScore: 675, minRank: 550, avgRank: 410, enrollment: 4 },

  // ===== 陕西 =====
  { universityId: 'xjtu', province: '陕西', year: 2024, category: '理科', minScore: 628, avgScore: 634, minRank: 3200, avgRank: 2700, enrollment: 8 },
  { universityId: 'xjtu', province: '陕西', year: 2023, category: '理科', minScore: 624, avgScore: 630, minRank: 3400, avgRank: 2900, enrollment: 8 },
  { universityId: 'xjtu', province: '陕西', year: 2022, category: '理科', minScore: 621, avgScore: 627, minRank: 3500, avgRank: 3000, enrollment: 7 },
  { universityId: 'nwpu', province: '陕西', year: 2024, category: '理科', minScore: 618, avgScore: 624, minRank: 4000, avgRank: 3400, enrollment: 6 },
  { universityId: 'nwpu', province: '陕西', year: 2023, category: '理科', minScore: 614, avgScore: 620, minRank: 4200, avgRank: 3600, enrollment: 6 },

  // ===== 湖南 =====
  { universityId: 'hnu', province: '湖南', year: 2024, category: '物理类', minScore: 618, avgScore: 624, minRank: 6800, avgRank: 5800, enrollment: 5 },
  { universityId: 'hnu', province: '湖南', year: 2023, category: '物理类', minScore: 614, avgScore: 620, minRank: 7200, avgRank: 6200, enrollment: 5 },
  { universityId: 'csu', province: '湖南', year: 2024, category: '物理类', minScore: 620, avgScore: 626, minRank: 6400, avgRank: 5400, enrollment: 6 },
  { universityId: 'csu', province: '湖南', year: 2023, category: '物理类', minScore: 616, avgScore: 622, minRank: 6800, avgRank: 5800, enrollment: 6 },

  // ===== 安徽 =====
  { universityId: 'ustc', province: '安徽', year: 2024, category: '理科', minScore: 660, avgScore: 666, minRank: 800, avgRank: 600, enrollment: 8 },
  { universityId: 'ustc', province: '安徽', year: 2023, category: '理科', minScore: 656, avgScore: 662, minRank: 850, avgRank: 640, enrollment: 8 },
  { universityId: 'ustc', province: '安徽', year: 2022, category: '理科', minScore: 653, avgScore: 659, minRank: 880, avgRank: 660, enrollment: 7 },

  // ===== 辽宁 =====
  { universityId: 'dlut', province: '辽宁', year: 2024, category: '物理类', minScore: 618, avgScore: 624, minRank: 6200, avgRank: 5300, enrollment: 6 },
  { universityId: 'dlut', province: '辽宁', year: 2023, category: '物理类', minScore: 614, avgScore: 620, minRank: 6600, avgRank: 5700, enrollment: 6 },

  // ===== 福建 =====
  { universityId: 'xmu', province: '福建', year: 2024, category: '物理类', minScore: 620, avgScore: 626, minRank: 5800, avgRank: 4900, enrollment: 5 },
  { universityId: 'xmu', province: '福建', year: 2023, category: '物理类', minScore: 616, avgScore: 622, minRank: 6200, avgRank: 5300, enrollment: 5 },
]

// 获取某省份某高校的历年分数线
export function getScoreRecords(universityId: string, province: string): ScoreRecord[] {
  return scoreRecords.filter(
    s => s.universityId === universityId && s.province === province
  ).sort((a, b) => b.year - a.year)
}

// 获取某省份所有可报考的学校分数线
export function getScoreRecordsByProvince(province: string): ScoreRecord[] {
  return scoreRecords.filter(s => s.province === province)
}

// 获取有数据的省份列表
export function getAvailableProvinces(): string[] {
  const provinces = new Set(scoreRecords.map(s => s.province))
  return Array.from(provinces).sort()
}
