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
  { universityId: 'fzu', province: '福建', year: 2024, category: '物理类', minScore: 590, avgScore: 596, minRank: 16000, avgRank: 14000, enrollment: 8 },

  // ===== 天津 =====
  { universityId: 'tju', province: '天津', year: 2024, category: '物理类', minScore: 650, avgScore: 656, minRank: 2800, avgRank: 2200, enrollment: 6 },
  { universityId: 'tju', province: '天津', year: 2023, category: '物理类', minScore: 646, avgScore: 652, minRank: 3000, avgRank: 2400, enrollment: 6 },
  { universityId: 'nankai', province: '天津', year: 2024, category: '物理类', minScore: 648, avgScore: 654, minRank: 2600, avgRank: 2000, enrollment: 5 },
  { universityId: 'nankai', province: '天津', year: 2023, category: '物理类', minScore: 644, avgScore: 650, minRank: 2800, avgRank: 2200, enrollment: 5 },
  { universityId: 'tsinghua', province: '天津', year: 2024, category: '物理类', minScore: 690, avgScore: 695, minRank: 100, avgRank: 70, enrollment: 3 },
  { universityId: 'pku', province: '天津', year: 2024, category: '物理类', minScore: 688, avgScore: 693, minRank: 120, avgRank: 85, enrollment: 3 },
  { universityId: 'buaa', province: '天津', year: 2024, category: '物理类', minScore: 662, avgScore: 668, minRank: 1900, avgRank: 1500, enrollment: 5 },
  { universityId: 'bupt', province: '天津', year: 2024, category: '物理类', minScore: 640, avgScore: 646, minRank: 4200, avgRank: 3600, enrollment: 5 },

  // ===== 上海 =====
  { universityId: 'sjtu', province: '上海', year: 2024, category: '物理类', minScore: 680, avgScore: 685, minRank: 300, avgRank: 220, enrollment: 5 },
  { universityId: 'sjtu', province: '上海', year: 2023, category: '物理类', minScore: 677, avgScore: 682, minRank: 320, avgRank: 240, enrollment: 5 },
  { universityId: 'fudan', province: '上海', year: 2024, category: '物理类', minScore: 678, avgScore: 683, minRank: 310, avgRank: 230, enrollment: 4 },
  { universityId: 'fudan', province: '上海', year: 2023, category: '物理类', minScore: 675, avgScore: 680, minRank: 340, avgRank: 260, enrollment: 4 },
  { universityId: 'tongji', province: '上海', year: 2024, category: '物理类', minScore: 660, avgScore: 666, minRank: 1800, avgRank: 1400, enrollment: 5 },
  { universityId: 'ecnu', province: '上海', year: 2024, category: '物理类', minScore: 642, avgScore: 648, minRank: 4800, avgRank: 4100, enrollment: 5 },
  { universityId: 'nuaa_cqu', province: '上海', year: 2024, category: '物理类', minScore: 635, avgScore: 641, minRank: 5800, avgRank: 5000, enrollment: 5 },
  { universityId: 'tsinghua', province: '上海', year: 2024, category: '物理类', minScore: 688, avgScore: 693, minRank: 110, avgRank: 75, enrollment: 3 },

  // ===== 山西 =====
  { universityId: 'sxu', province: '山西', year: 2024, category: '理科', minScore: 530, avgScore: 538, minRank: 28000, avgRank: 24000, enrollment: 8 },
  { universityId: 'sxu', province: '山西', year: 2023, category: '理科', minScore: 522, avgScore: 530, minRank: 30000, avgRank: 26000, enrollment: 8 },
  { universityId: 'tsinghua', province: '山西', year: 2024, category: '理科', minScore: 692, avgScore: 697, minRank: 60, avgRank: 40, enrollment: 2 },
  { universityId: 'pku', province: '山西', year: 2024, category: '理科', minScore: 690, avgScore: 695, minRank: 70, avgRank: 48, enrollment: 2 },
  { universityId: 'hust', province: '山西', year: 2024, category: '理科', minScore: 630, avgScore: 636, minRank: 4200, avgRank: 3500, enrollment: 4 },
  { universityId: 'bupt', province: '山西', year: 2024, category: '理科', minScore: 600, avgScore: 606, minRank: 8500, avgRank: 7200, enrollment: 5 },

  // ===== 内蒙古 =====
  { universityId: 'imust', province: '内蒙古', year: 2024, category: '理科', minScore: 460, avgScore: 470, minRank: 30000, avgRank: 26000, enrollment: 6 },
  { universityId: 'tsinghua', province: '内蒙古', year: 2024, category: '理科', minScore: 688, avgScore: 693, minRank: 50, avgRank: 35, enrollment: 2 },
  { universityId: 'pku', province: '内蒙古', year: 2024, category: '理科', minScore: 686, avgScore: 691, minRank: 55, avgRank: 38, enrollment: 2 },
  { universityId: 'hust', province: '内蒙古', year: 2024, category: '理科', minScore: 610, avgScore: 616, minRank: 3800, avgRank: 3100, enrollment: 4 },

  // ===== 吉林 =====
  { universityId: 'jlu', province: '吉林', year: 2024, category: '理科', minScore: 570, avgScore: 578, minRank: 9500, avgRank: 8000, enrollment: 10 },
  { universityId: 'jlu', province: '吉林', year: 2023, category: '理科', minScore: 562, avgScore: 570, minRank: 10000, avgRank: 8500, enrollment: 10 },
  { universityId: 'tsinghua', province: '吉林', year: 2024, category: '理科', minScore: 690, avgScore: 695, minRank: 55, avgRank: 38, enrollment: 2 },
  { universityId: 'pku', province: '吉林', year: 2024, category: '理科', minScore: 688, avgScore: 693, minRank: 60, avgRank: 42, enrollment: 2 },
  { universityId: 'hust', province: '吉林', year: 2024, category: '理科', minScore: 600, avgScore: 606, minRank: 5500, avgRank: 4600, enrollment: 4 },

  // ===== 黑龙江 =====
  { universityId: 'hit', province: '黑龙江', year: 2024, category: '理科', minScore: 610, avgScore: 618, minRank: 3500, avgRank: 2800, enrollment: 8 },
  { universityId: 'hit', province: '黑龙江', year: 2023, category: '理科', minScore: 604, avgScore: 612, minRank: 3800, avgRank: 3100, enrollment: 8 },
  { universityId: 'hrbeu', province: '黑龙江', year: 2024, category: '理科', minScore: 555, avgScore: 563, minRank: 12000, avgRank: 10000, enrollment: 6 },
  { universityId: 'nepu', province: '黑龙江', year: 2024, category: '理科', minScore: 460, avgScore: 470, minRank: 38000, avgRank: 33000, enrollment: 5 },
  { universityId: 'tsinghua', province: '黑龙江', year: 2024, category: '理科', minScore: 692, avgScore: 697, minRank: 50, avgRank: 35, enrollment: 2 },

  // ===== 江西 =====
  { universityId: 'jxnu', province: '江西', year: 2024, category: '理科', minScore: 530, avgScore: 538, minRank: 42000, avgRank: 36000, enrollment: 6 },
  { universityId: 'nchu', province: '江西', year: 2024, category: '理科', minScore: 520, avgScore: 528, minRank: 48000, avgRank: 42000, enrollment: 5 },
  { universityId: 'tsinghua', province: '江西', year: 2024, category: '理科', minScore: 694, avgScore: 699, minRank: 55, avgRank: 38, enrollment: 2 },
  { universityId: 'pku', province: '江西', year: 2024, category: '理科', minScore: 692, avgScore: 697, minRank: 60, avgRank: 42, enrollment: 2 },
  { universityId: 'hust', province: '江西', year: 2024, category: '理科', minScore: 620, avgScore: 626, minRank: 5500, avgRank: 4600, enrollment: 4 },
  { universityId: 'bupt', province: '江西', year: 2024, category: '理科', minScore: 595, avgScore: 601, minRank: 10000, avgRank: 8500, enrollment: 5 },

  // ===== 广西 =====
  { universityId: 'gxu', province: '广西', year: 2024, category: '理科', minScore: 540, avgScore: 548, minRank: 28000, avgRank: 24000, enrollment: 6 },
  { universityId: 'guet', province: '广西', year: 2024, category: '理科', minScore: 510, avgScore: 518, minRank: 40000, avgRank: 35000, enrollment: 6 },
  { universityId: 'tsinghua', province: '广西', year: 2024, category: '理科', minScore: 694, avgScore: 699, minRank: 45, avgRank: 30, enrollment: 2 },
  { universityId: 'hust', province: '广西', year: 2024, category: '理科', minScore: 618, avgScore: 624, minRank: 4800, avgRank: 4000, enrollment: 4 },

  // ===== 海南 =====
  { universityId: 'hainanu', province: '海南', year: 2024, category: '综合', minScore: 600, avgScore: 608, minRank: 10000, avgRank: 8500, enrollment: 6 },
  { universityId: 'tsinghua', province: '海南', year: 2024, category: '综合', minScore: 860, avgScore: 870, minRank: 30, avgRank: 20, enrollment: 2 },
  { universityId: 'hust', province: '海南', year: 2024, category: '综合', minScore: 740, avgScore: 750, minRank: 1200, avgRank: 1000, enrollment: 3 },

  // ===== 重庆 =====
  { universityId: 'cqu', province: '重庆', year: 2024, category: '物理类', minScore: 600, avgScore: 608, minRank: 12000, avgRank: 10000, enrollment: 6 },
  { universityId: 'cqu', province: '重庆', year: 2023, category: '物理类', minScore: 594, avgScore: 602, minRank: 13000, avgRank: 11000, enrollment: 6 },
  { universityId: 'cqupt', province: '重庆', year: 2024, category: '物理类', minScore: 545, avgScore: 553, minRank: 32000, avgRank: 28000, enrollment: 8 },
  { universityId: 'cqjtu', province: '重庆', year: 2024, category: '物理类', minScore: 510, avgScore: 518, minRank: 50000, avgRank: 44000, enrollment: 5 },
  { universityId: 'tsinghua', province: '重庆', year: 2024, category: '物理类', minScore: 692, avgScore: 697, minRank: 65, avgRank: 45, enrollment: 2 },
  { universityId: 'uestc', province: '重庆', year: 2024, category: '物理类', minScore: 640, avgScore: 646, minRank: 4500, avgRank: 3800, enrollment: 5 },

  // ===== 贵州 =====
  { universityId: 'gsu', province: '贵州', year: 2024, category: '理科', minScore: 520, avgScore: 528, minRank: 28000, avgRank: 24000, enrollment: 6 },
  { universityId: 'tsinghua', province: '贵州', year: 2024, category: '理科', minScore: 694, avgScore: 699, minRank: 40, avgRank: 28, enrollment: 2 },
  { universityId: 'hust', province: '贵州', year: 2024, category: '理科', minScore: 615, avgScore: 621, minRank: 4200, avgRank: 3500, enrollment: 4 },

  // ===== 云南 =====
  { universityId: 'ynu', province: '云南', year: 2024, category: '理科', minScore: 530, avgScore: 538, minRank: 26000, avgRank: 22000, enrollment: 6 },
  { universityId: 'tsinghua', province: '云南', year: 2024, category: '理科', minScore: 696, avgScore: 701, minRank: 40, avgRank: 28, enrollment: 2 },
  { universityId: 'hust', province: '云南', year: 2024, category: '理科', minScore: 612, avgScore: 618, minRank: 4800, avgRank: 4000, enrollment: 4 },

  // ===== 西藏 =====
  { universityId: 'tibetu', province: '西藏', year: 2024, category: '理科', minScore: 420, avgScore: 430, minRank: 6000, avgRank: 5200, enrollment: 5 },

  // ===== 甘肃 =====
  { universityId: 'lzu', province: '甘肃', year: 2024, category: '理科', minScore: 560, avgScore: 568, minRank: 7000, avgRank: 5800, enrollment: 6 },
  { universityId: 'lzu', province: '甘肃', year: 2023, category: '理科', minScore: 552, avgScore: 560, minRank: 7500, avgRank: 6300, enrollment: 6 },
  { universityId: 'tsinghua', province: '甘肃', year: 2024, category: '理科', minScore: 692, avgScore: 697, minRank: 40, avgRank: 28, enrollment: 2 },
  { universityId: 'hust', province: '甘肃', year: 2024, category: '理科', minScore: 600, avgScore: 606, minRank: 4500, avgRank: 3800, enrollment: 4 },

  // ===== 青海 =====
  { universityId: 'qhnu', province: '青海', year: 2024, category: '理科', minScore: 400, avgScore: 410, minRank: 8000, avgRank: 6800, enrollment: 5 },
  { universityId: 'tsinghua', province: '青海', year: 2024, category: '理科', minScore: 680, avgScore: 685, minRank: 15, avgRank: 10, enrollment: 2 },

  // ===== 宁夏 =====
  { universityId: 'nxu', province: '宁夏', year: 2024, category: '理科', minScore: 470, avgScore: 478, minRank: 8000, avgRank: 6800, enrollment: 5 },
  { universityId: 'tsinghua', province: '宁夏', year: 2024, category: '理科', minScore: 685, avgScore: 690, minRank: 15, avgRank: 10, enrollment: 2 },

  // ===== 新疆 =====
  { universityId: 'xju', province: '新疆', year: 2024, category: '理科', minScore: 490, avgScore: 498, minRank: 7000, avgRank: 6000, enrollment: 6 },
  { universityId: 'tsinghua', province: '新疆', year: 2024, category: '理科', minScore: 688, avgScore: 693, minRank: 15, avgRank: 10, enrollment: 2 },
  { universityId: 'hust', province: '新疆', year: 2024, category: '理科', minScore: 580, avgScore: 586, minRank: 3000, avgRank: 2500, enrollment: 4 },

  // ===== 补充新增高校在各已有省份的分数线 =====
  // 北京理工大学
  { universityId: 'bit', province: '北京', year: 2024, category: '物理类', minScore: 658, avgScore: 664, minRank: 2200, avgRank: 1800, enrollment: 6 },
  { universityId: 'bit', province: '河南', year: 2024, category: '理科', minScore: 654, avgScore: 660, minRank: 2400, avgRank: 1900, enrollment: 4 },
  { universityId: 'bit', province: '广东', year: 2024, category: '物理类', minScore: 652, avgScore: 658, minRank: 2600, avgRank: 2100, enrollment: 4 },

  // 复旦大学
  { universityId: 'fudan', province: '河南', year: 2024, category: '理科', minScore: 680, avgScore: 685, minRank: 460, avgRank: 340, enrollment: 3 },
  { universityId: 'fudan', province: '广东', year: 2024, category: '物理类', minScore: 676, avgScore: 681, minRank: 580, avgRank: 430, enrollment: 3 },

  // 国防科技大学
  { universityId: 'nudt', province: '河南', year: 2024, category: '理科', minScore: 640, avgScore: 646, minRank: 4200, avgRank: 3500, enrollment: 4 },
  { universityId: 'nudt', province: '湖南', year: 2024, category: '物理类', minScore: 632, avgScore: 638, minRank: 4800, avgRank: 4000, enrollment: 8 },

  // 西安电子科技大学
  { universityId: 'xidian', province: '河南', year: 2024, category: '理科', minScore: 618, avgScore: 624, minRank: 7400, avgRank: 6400, enrollment: 6 },
  { universityId: 'xidian', province: '陕西', year: 2024, category: '理科', minScore: 600, avgScore: 606, minRank: 8000, avgRank: 6800, enrollment: 10 },
  { universityId: 'xidian', province: '广东', year: 2024, category: '物理类', minScore: 612, avgScore: 618, minRank: 8500, avgRank: 7200, enrollment: 5 },

  // 东北大学
  { universityId: 'neu', province: '辽宁', year: 2024, category: '物理类', minScore: 590, avgScore: 596, minRank: 14000, avgRank: 12000, enrollment: 8 },
  { universityId: 'neu', province: '河南', year: 2024, category: '理科', minScore: 608, avgScore: 614, minRank: 9000, avgRank: 7800, enrollment: 5 },

  // 四川大学
  { universityId: 'scu', province: '四川', year: 2024, category: '理科', minScore: 620, avgScore: 626, minRank: 12000, avgRank: 10000, enrollment: 8 },
  { universityId: 'scu', province: '河南', year: 2024, category: '理科', minScore: 624, avgScore: 630, minRank: 6800, avgRank: 5800, enrollment: 4 },

  // 山东大学
  { universityId: 'sdu', province: '山东', year: 2024, category: '综合', minScore: 630, avgScore: 636, minRank: 8000, avgRank: 6800, enrollment: 6 },
  { universityId: 'sdu', province: '河南', year: 2024, category: '理科', minScore: 622, avgScore: 628, minRank: 7200, avgRank: 6200, enrollment: 4 },

  // 重庆大学
  { universityId: 'cqu', province: '河南', year: 2024, category: '理科', minScore: 610, avgScore: 616, minRank: 8600, avgRank: 7400, enrollment: 4 },

  // 北京师范大学
  { universityId: 'bnu', province: '北京', year: 2024, category: '物理类', minScore: 650, avgScore: 656, minRank: 2800, avgRank: 2300, enrollment: 4 },
  { universityId: 'bnu', province: '河南', year: 2024, category: '理科', minScore: 636, avgScore: 642, minRank: 5000, avgRank: 4200, enrollment: 3 },

  // 华东师范大学
  { universityId: 'ecnu', province: '河南', year: 2024, category: '理科', minScore: 630, avgScore: 636, minRank: 5800, avgRank: 4900, enrollment: 3 },

  // 兰州大学
  { universityId: 'lzu', province: '河南', year: 2024, category: '理科', minScore: 598, avgScore: 604, minRank: 11000, avgRank: 9500, enrollment: 4 },

  // 南京航空航天大学
  { universityId: 'nuaa', province: '江苏', year: 2024, category: '物理类', minScore: 630, avgScore: 636, minRank: 8000, avgRank: 6800, enrollment: 5 },
  { universityId: 'nuaa', province: '河南', year: 2024, category: '理科', minScore: 612, avgScore: 618, minRank: 8200, avgRank: 7000, enrollment: 4 },

  // 南京理工大学
  { universityId: 'njust', province: '江苏', year: 2024, category: '物理类', minScore: 626, avgScore: 632, minRank: 9000, avgRank: 7600, enrollment: 5 },
  { universityId: 'njust', province: '河南', year: 2024, category: '理科', minScore: 608, avgScore: 614, minRank: 9000, avgRank: 7800, enrollment: 4 },

  // 武汉理工大学
  { universityId: 'hust_wut', province: '湖北', year: 2024, category: '物理类', minScore: 600, avgScore: 606, minRank: 12000, avgRank: 10000, enrollment: 6 },
  { universityId: 'hust_wut', province: '河南', year: 2024, category: '理科', minScore: 600, avgScore: 606, minRank: 10000, avgRank: 8600, enrollment: 5 },

  // 西南交通大学
  { universityId: 'swjtu', province: '四川', year: 2024, category: '理科', minScore: 590, avgScore: 596, minRank: 22000, avgRank: 19000, enrollment: 6 },
  { universityId: 'swjtu', province: '河南', year: 2024, category: '理科', minScore: 596, avgScore: 602, minRank: 12000, avgRank: 10400, enrollment: 5 },

  // 南京邮电大学
  { universityId: 'njupt', province: '江苏', year: 2024, category: '物理类', minScore: 590, avgScore: 596, minRank: 16000, avgRank: 13800, enrollment: 6 },
  { universityId: 'njupt', province: '河南', year: 2024, category: '理科', minScore: 580, avgScore: 586, minRank: 18000, avgRank: 15600, enrollment: 5 },

  // 杭州电子科技大学
  { universityId: 'hdu', province: '浙江', year: 2024, category: '综合', minScore: 600, avgScore: 606, minRank: 50000, avgRank: 44000, enrollment: 6 },
  { universityId: 'hdu', province: '河南', year: 2024, category: '理科', minScore: 575, avgScore: 581, minRank: 20000, avgRank: 17400, enrollment: 5 },

  // 南方科技大学
  { universityId: 'sustech', province: '广东', year: 2024, category: '物理类', minScore: 620, avgScore: 626, minRank: 9500, avgRank: 8000, enrollment: 5 },

  // 深圳大学
  { universityId: 'szu', province: '广东', year: 2024, category: '物理类', minScore: 598, avgScore: 604, minRank: 12000, avgRank: 10200, enrollment: 6 },

  // 电子科大沙河
  { universityId: 'uestc_us', province: '四川', year: 2024, category: '理科', minScore: 620, avgScore: 626, minRank: 12000, avgRank: 10000, enrollment: 6 },
  { universityId: 'uestc_us', province: '河南', year: 2024, category: '理科', minScore: 628, avgScore: 634, minRank: 6400, avgRank: 5400, enrollment: 4 },

  // 北京工业大学
  { universityId: 'bjut', province: '北京', year: 2024, category: '物理类', minScore: 610, avgScore: 616, minRank: 8600, avgRank: 7400, enrollment: 6 },

  // 华南师范大学
  { universityId: 'scnu', province: '广东', year: 2024, category: '物理类', minScore: 580, avgScore: 586, minRank: 18000, avgRank: 15500, enrollment: 5 },

  // 浙大城市学院
  { universityId: 'zucc', province: '浙江', year: 2024, category: '综合', minScore: 550, avgScore: 558, minRank: 100000, avgRank: 90000, enrollment: 6 },

  // 上海大学
  { universityId: 'nuaa_cqu', province: '河南', year: 2024, category: '理科', minScore: 608, avgScore: 614, minRank: 9000, avgRank: 7800, enrollment: 4 },

  // 苏州大学
  { universityId: 'suda', province: '江苏', year: 2024, category: '物理类', minScore: 600, avgScore: 606, minRank: 13000, avgRank: 11000, enrollment: 5 },

  // 郑州大学
  { universityId: 'zzu', province: '河南', year: 2024, category: '理科', minScore: 580, avgScore: 586, minRank: 18000, avgRank: 15600, enrollment: 8 },
  { universityId: 'zzu', province: '河南', year: 2023, category: '理科', minScore: 572, avgScore: 578, minRank: 19500, avgRank: 17000, enrollment: 8 },

  // 河南大学
  { universityId: 'henu', province: '河南', year: 2024, category: '理科', minScore: 545, avgScore: 551, minRank: 32000, avgRank: 28000, enrollment: 6 },

  // 哈工大威海
  { universityId: 'hit_wh', province: '山东', year: 2024, category: '综合', minScore: 620, avgScore: 626, minRank: 10000, avgRank: 8500, enrollment: 5 },
  { universityId: 'hit_wh', province: '河南', year: 2024, category: '理科', minScore: 620, avgScore: 626, minRank: 7200, avgRank: 6200, enrollment: 4 },

  // 长沙理工大学
  { universityId: 'ccsu', province: '湖南', year: 2024, category: '物理类', minScore: 545, avgScore: 551, minRank: 42000, avgRank: 36000, enrollment: 5 },

  // 湖南师范大学
  { universityId: 'hunnu', province: '湖南', year: 2024, category: '物理类', minScore: 565, avgScore: 571, minRank: 28000, avgRank: 24000, enrollment: 5 },

  // 湖北工业大学
  { universityId: 'hbut', province: '湖北', year: 2024, category: '物理类', minScore: 540, avgScore: 546, minRank: 45000, avgRank: 39000, enrollment: 5 },

  // 河北科技大学
  { universityId: 'hebust', province: '河北', year: 2024, category: '物理类', minScore: 510, avgScore: 516, minRank: 75000, avgRank: 65000, enrollment: 5 },

  // 安徽师范大学
  { universityId: 'ahnu', province: '安徽', year: 2024, category: '理科', minScore: 520, avgScore: 526, minRank: 65000, avgRank: 56000, enrollment: 5 },

  // 西安理工大学
  { universityId: 'xaut', province: '陕西', year: 2024, category: '理科', minScore: 510, avgScore: 516, minRank: 32000, avgRank: 28000, enrollment: 5 },

  // 福州大学
  { universityId: 'fzu', province: '河南', year: 2024, category: '理科', minScore: 590, avgScore: 596, minRank: 14000, avgRank: 12000, enrollment: 4 },

  // 重庆邮电大学
  { universityId: 'cqupt', province: '河南', year: 2024, category: '理科', minScore: 565, avgScore: 571, minRank: 24000, avgRank: 20800, enrollment: 5 },

  // 北京理工大学补充
  { universityId: 'bit', province: '四川', year: 2024, category: '理科', minScore: 650, avgScore: 656, minRank: 2800, avgRank: 2300, enrollment: 4 },
  { universityId: 'bit', province: '湖北', year: 2024, category: '物理类', minScore: 648, avgScore: 654, minRank: 3000, avgRank: 2500, enrollment: 4 },

  // 天津大学补充
  { universityId: 'tju', province: '河南', year: 2024, category: '理科', minScore: 636, avgScore: 642, minRank: 5000, avgRank: 4200, enrollment: 4 },
  { universityId: 'tju', province: '广东', year: 2024, category: '物理类', minScore: 634, avgScore: 640, minRank: 5200, avgRank: 4400, enrollment: 4 },

  // 吉林大学补充
  { universityId: 'jlu', province: '河南', year: 2024, category: '理科', minScore: 598, avgScore: 604, minRank: 11000, avgRank: 9500, enrollment: 4 },

  // 大连理工大学补充
  { universityId: 'dlut', province: '辽宁', year: 2024, category: '物理类', minScore: 600, avgScore: 606, minRank: 11000, avgRank: 9400, enrollment: 6 },

  // 中山大学补充
  { universityId: 'sysu', province: '广东', year: 2024, category: '物理类', minScore: 628, avgScore: 634, minRank: 6800, avgRank: 5800, enrollment: 8 },

  // 厦门大学补充
  { universityId: 'xmu', province: '河南', year: 2024, category: '理科', minScore: 618, avgScore: 624, minRank: 7400, avgRank: 6400, enrollment: 3 },

  // 南开大学补充
  { universityId: 'nankai', province: '河南', year: 2024, category: '理科', minScore: 638, avgScore: 644, minRank: 4200, avgRank: 3500, enrollment: 3 },

  // 同济大学补充
  { universityId: 'tongji', province: '上海', year: 2024, category: '物理类', minScore: 660, avgScore: 666, minRank: 1800, avgRank: 1400, enrollment: 5 },

  // 东南大学补充
  { universityId: 'seu', province: '河南', year: 2024, category: '理科', minScore: 640, avgScore: 646, minRank: 3800, avgRank: 3100, enrollment: 4 },

  // 华南理工补充
  { universityId: 'scut', province: '广东', year: 2024, category: '物理类', minScore: 630, avgScore: 636, minRank: 6200, avgRank: 5200, enrollment: 8 },

  // 中科大补充
  { universityId: 'ustc', province: '安徽', year: 2024, category: '理科', minScore: 670, avgScore: 675, minRank: 600, avgRank: 450, enrollment: 5 },
  { universityId: 'ustc', province: '安徽', year: 2023, category: '理科', minScore: 666, avgScore: 671, minRank: 640, avgRank: 480, enrollment: 5 },
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
export function getAvailableProvinces(): string[
  // ===== 2025年录取数据 =====
  { universityId: 'tsinghua', province: '北京', year: 2025, category: '物理类', minScore: 691, avgScore: 696, minRank: 380, avgRank: 280, enrollment: 5 },
  { universityId: 'pku', province: '北京', year: 2025, category: '物理类', minScore: 688, avgScore: 693, minRank: 428, avgRank: 316, enrollment: 4 },
  { universityId: 'buaa', province: '北京', year: 2025, category: '物理类', minScore: 665, avgScore: 671, minRank: 2163, avgRank: 1751, enrollment: 8 },
  { universityId: 'bupt', province: '北京', year: 2025, category: '物理类', minScore: 646, avgScore: 652, minRank: 4223, avgRank: 3605, enrollment: 10 },
  { universityId: 'ruc', province: '北京', year: 2025, category: '物理类', minScore: 667, avgScore: 672, minRank: 1836, avgRank: 1530, enrollment: 5 },
  { universityId: 'cug', province: '北京', year: 2025, category: '物理类', minScore: 630, avgScore: 636, minRank: 5916, avgRank: 5202, enrollment: 8 },
  { universityId: 'tsinghua', province: '河南', year: 2025, category: '理科', minScore: 701, avgScore: 706, minRank: 94, avgRank: 60, enrollment: 3 },
  { universityId: 'pku', province: '河南', year: 2025, category: '理科', minScore: 698, avgScore: 703, minRank: 112, avgRank: 73, enrollment: 3 },
  { universityId: 'zju', province: '河南', year: 2025, category: '理科', minScore: 680, avgScore: 685, minRank: 592, avgRank: 428, enrollment: 4 },
  { universityId: 'sjtu', province: '河南', year: 2025, category: '理科', minScore: 679, avgScore: 684, minRank: 670, avgRank: 494, enrollment: 4 },
  { universityId: 'nju', province: '河南', year: 2025, category: '理科', minScore: 672, avgScore: 677, minRank: 836, avgRank: 632, enrollment: 3 },
  { universityId: 'ustc', province: '河南', year: 2025, category: '理科', minScore: 675, avgScore: 680, minRank: 773, avgRank: 577, enrollment: 3 },
  { universityId: 'hust', province: '河南', year: 2025, category: '理科', minScore: 653, avgScore: 659, minRank: 2884, avgRank: 2266, enrollment: 5 },
  { universityId: 'xjtu', province: '河南', year: 2025, category: '理科', minScore: 651, avgScore: 657, minRank: 3193, avgRank: 2575, enrollment: 4 },
  { universityId: 'uestc', province: '河南', year: 2025, category: '理科', minScore: 649, avgScore: 655, minRank: 3395, avgRank: 2716, enrollment: 5 },
  { universityId: 'hit', province: '河南', year: 2025, category: '理科', minScore: 648, avgScore: 654, minRank: 3264, avgRank: 2652, enrollment: 4 },
  { universityId: 'buaa', province: '河南', year: 2025, category: '理科', minScore: 659, avgScore: 665, minRank: 2369, avgRank: 1854, enrollment: 4 },
  { universityId: 'bupt', province: '河南', year: 2025, category: '理科', minScore: 635, avgScore: 641, minRank: 5974, avgRank: 5047, enrollment: 6 },
  { universityId: 'whu', province: '河南', year: 2025, category: '理科', minScore: 646, avgScore: 652, minRank: 3672, avgRank: 2958, enrollment: 5 },
  { universityId: 'scut', province: '河南', year: 2025, category: '理科', minScore: 639, avgScore: 645, minRank: 4738, avgRank: 3914, enrollment: 5 },
  { universityId: 'hit_sz', province: '河南', year: 2025, category: '理科', minScore: 653, avgScore: 659, minRank: 2450, avgRank: 1960, enrollment: 4 },
  { universityId: 'seu', province: '河南', year: 2025, category: '理科', minScore: 642, avgScore: 648, minRank: 3876, avgRank: 3162, enrollment: 4 },
  { universityId: 'dlut', province: '河南', year: 2025, category: '理科', minScore: 633, avgScore: 639, minRank: 5459, avgRank: 4635, enrollment: 4 },
  { universityId: 'nwpu', province: '河南', year: 2025, category: '理科', minScore: 641, avgScore: 647, minRank: 4326, avgRank: 3605, enrollment: 4 },
  { universityId: 'hnu', province: '河南', year: 2025, category: '理科', minScore: 624, avgScore: 630, minRank: 7140, avgRank: 6120, enrollment: 4 },
  { universityId: 'csu', province: '河南', year: 2025, category: '理科', minScore: 626, avgScore: 632, minRank: 6732, avgRank: 5712, enrollment: 4 },
  { universityId: 'nankai', province: '河南', year: 2025, category: '理科', minScore: 639, avgScore: 645, minRank: 4116, avgRank: 3430, enrollment: 3 },
  { universityId: 'tongji', province: '河南', year: 2025, category: '理科', minScore: 655, avgScore: 661, minRank: 2352, avgRank: 1862, enrollment: 3 },
  { universityId: 'sysu', province: '河南', year: 2025, category: '理科', minScore: 637, avgScore: 643, minRank: 4635, avgRank: 3914, enrollment: 3 },
  { universityId: 'xmu', province: '河南', year: 2025, category: '理科', minScore: 620, avgScore: 626, minRank: 7548, avgRank: 6528, enrollment: 3 },
  { universityId: 'cug', province: '河南', year: 2025, category: '理科', minScore: 616, avgScore: 622, minRank: 7956, avgRank: 6936, enrollment: 5 },
  { universityId: 'tsinghua', province: '广东', year: 2025, category: '物理类', minScore: 695, avgScore: 700, minRank: 120, avgRank: 80, enrollment: 3 },
  { universityId: 'pku', province: '广东', year: 2025, category: '物理类', minScore: 692, avgScore: 697, minRank: 143, avgRank: 92, enrollment: 3 },
  { universityId: 'zju', province: '广东', year: 2025, category: '物理类', minScore: 674, avgScore: 679, minRank: 694, avgRank: 510, enrollment: 4 },
  { universityId: 'sjtu', province: '广东', year: 2025, category: '物理类', minScore: 673, avgScore: 678, minRank: 773, avgRank: 577, enrollment: 4 },
  { universityId: 'nju', province: '广东', year: 2025, category: '物理类', minScore: 666, avgScore: 671, minRank: 1020, avgRank: 796, enrollment: 3 },
  { universityId: 'hust', province: '广东', year: 2025, category: '物理类', minScore: 645, avgScore: 651, minRank: 4635, avgRank: 3708, enrollment: 5 },
  { universityId: 'uestc', province: '广东', year: 2025, category: '物理类', minScore: 642, avgScore: 648, minRank: 5044, avgRank: 4074, enrollment: 5 },
  { universityId: 'hit_sz', province: '广东', year: 2025, category: '物理类', minScore: 651, avgScore: 657, minRank: 2744, avgRank: 2156, enrollment: 6 },
  { universityId: 'scut', province: '广东', year: 2025, category: '物理类', minScore: 633, avgScore: 639, minRank: 6386, avgRank: 5356, enrollment: 8 },
  { universityId: 'sysu', province: '广东', year: 2025, category: '物理类', minScore: 631, avgScore: 637, minRank: 7004, avgRank: 5974, enrollment: 8 },
  { universityId: 'bupt', province: '广东', year: 2025, category: '物理类', minScore: 629, avgScore: 635, minRank: 7210, avgRank: 6180, enrollment: 5 },
  { universityId: 'tsinghua', province: '四川', year: 2025, category: '理科', minScore: 698, avgScore: 703, minRank: 80, avgRank: 52, enrollment: 3 },
  { universityId: 'pku', province: '四川', year: 2025, category: '理科', minScore: 695, avgScore: 700, minRank: 97, avgRank: 63, enrollment: 3 },
  { universityId: 'zju', province: '四川', year: 2025, category: '理科', minScore: 678, avgScore: 683, minRank: 530, avgRank: 388, enrollment: 4 },
  { universityId: 'uestc', province: '四川', year: 2025, category: '理科', minScore: 652, avgScore: 658, minRank: 3104, avgRank: 2522, enrollment: 10 },
  { universityId: 'hust', province: '四川', year: 2025, category: '理科', minScore: 649, avgScore: 655, minRank: 3605, avgRank: 2884, enrollment: 5 },
  { universityId: 'hit_sz', province: '四川', year: 2025, category: '理科', minScore: 653, avgScore: 659, minRank: 2548, avgRank: 2058, enrollment: 4 },
  { universityId: 'bupt', province: '四川', year: 2025, category: '理科', minScore: 635, avgScore: 641, minRank: 6180, avgRank: 5253, enrollment: 5 },
  { universityId: 'scut', province: '四川', year: 2025, category: '理科', minScore: 637, avgScore: 643, minRank: 5768, avgRank: 4841, enrollment: 4 },
  { universityId: 'tsinghua', province: '湖北', year: 2025, category: '物理类', minScore: 693, avgScore: 698, minRank: 100, avgRank: 68, enrollment: 3 },
  { universityId: 'hust', province: '湖北', year: 2025, category: '物理类', minScore: 641, avgScore: 647, minRank: 5356, avgRank: 4429, enrollment: 12 },
  { universityId: 'whu', province: '湖北', year: 2025, category: '物理类', minScore: 636, avgScore: 642, minRank: 5610, avgRank: 4692, enrollment: 8 },
  { universityId: 'bupt', province: '湖北', year: 2025, category: '物理类', minScore: 625, avgScore: 631, minRank: 7622, avgRank: 6592, enrollment: 5 },
  { universityId: 'nju', province: '江苏', year: 2025, category: '物理类', minScore: 670, avgScore: 675, minRank: 612, avgRank: 459, enrollment: 5 },
  { universityId: 'seu', province: '江苏', year: 2025, category: '物理类', minScore: 648, avgScore: 654, minRank: 3264, avgRank: 2652, enrollment: 6 },
  { universityId: 'zju', province: '江苏', year: 2025, category: '物理类', minScore: 676, avgScore: 681, minRank: 459, avgRank: 337, enrollment: 4 },
  { universityId: 'tsinghua', province: '山东', year: 2025, category: '综合', minScore: 694, avgScore: 699, minRank: 110, avgRank: 75, enrollment: 3 },
  { universityId: 'pku', province: '山东', year: 2025, category: '综合', minScore: 691, avgScore: 696, minRank: 133, avgRank: 90, enrollment: 3 },
  { universityId: 'zju', province: '山东', year: 2025, category: '综合', minScore: 676, avgScore: 681, minRank: 612, avgRank: 449, enrollment: 4 },
  { universityId: 'hust', province: '山东', year: 2025, category: '综合', minScore: 649, avgScore: 655, minRank: 3914, avgRank: 3193, enrollment: 5 },
  { universityId: 'uestc', province: '山东', year: 2025, category: '综合', minScore: 646, avgScore: 652, minRank: 4268, avgRank: 3492, enrollment: 4 },
  { universityId: 'bupt', province: '山东', year: 2025, category: '综合', minScore: 631, avgScore: 637, minRank: 7416, avgRank: 6386, enrollment: 5 },
  { universityId: 'hit_sz', province: '山东', year: 2025, category: '综合', minScore: 653, avgScore: 659, minRank: 2744, avgRank: 2156, enrollment: 4 },
  { universityId: 'tsinghua', province: '河北', year: 2025, category: '物理类', minScore: 697, avgScore: 702, minRank: 60, avgRank: 38, enrollment: 3 },
  { universityId: 'zju', province: '河北', year: 2025, category: '物理类', minScore: 678, avgScore: 683, minRank: 388, avgRank: 275, enrollment: 4 },
  { universityId: 'hust', province: '河北', year: 2025, category: '物理类', minScore: 647, avgScore: 653, minRank: 3502, avgRank: 2781, enrollment: 5 },
  { universityId: 'uestc', province: '河北', year: 2025, category: '物理类', minScore: 644, avgScore: 650, minRank: 3880, avgRank: 3201, enrollment: 5 },
  { universityId: 'bupt', province: '河北', year: 2025, category: '物理类', minScore: 629, avgScore: 635, minRank: 7004, avgRank: 5974, enrollment: 5 },
  { universityId: 'zju', province: '浙江', year: 2025, category: '综合', minScore: 674, avgScore: 679, minRank: 510, avgRank: 377, enrollment: 15 },
  { universityId: 'nju', province: '浙江', year: 2025, category: '综合', minScore: 668, avgScore: 673, minRank: 663, avgRank: 500, enrollment: 4 },
  { universityId: 'sjtu', province: '浙江', year: 2025, category: '综合', minScore: 673, avgScore: 678, minRank: 567, avgRank: 422, enrollment: 4 },
  { universityId: 'xjtu', province: '陕西', year: 2025, category: '理科', minScore: 631, avgScore: 637, minRank: 3296, avgRank: 2781, enrollment: 8 },
  { universityId: 'nwpu', province: '陕西', year: 2025, category: '理科', minScore: 621, avgScore: 627, minRank: 4120, avgRank: 3502, enrollment: 6 },
  { universityId: 'hnu', province: '湖南', year: 2025, category: '物理类', minScore: 620, avgScore: 626, minRank: 6936, avgRank: 5916, enrollment: 5 },
  { universityId: 'csu', province: '湖南', year: 2025, category: '物理类', minScore: 622, avgScore: 628, minRank: 6528, avgRank: 5508, enrollment: 6 },
  { universityId: 'ustc', province: '安徽', year: 2025, category: '理科', minScore: 663, avgScore: 669, minRank: 824, avgRank: 618, enrollment: 8 },
  { universityId: 'dlut', province: '辽宁', year: 2025, category: '物理类', minScore: 621, avgScore: 627, minRank: 6386, avgRank: 5459, enrollment: 6 },
  { universityId: 'xmu', province: '福建', year: 2025, category: '物理类', minScore: 622, avgScore: 628, minRank: 5916, avgRank: 4998, enrollment: 5 },
  { universityId: 'fzu', province: '福建', year: 2025, category: '物理类', minScore: 592, avgScore: 598, minRank: 16320, avgRank: 14280, enrollment: 8 },
  { universityId: 'tju', province: '天津', year: 2025, category: '物理类', minScore: 652, avgScore: 658, minRank: 2856, avgRank: 2244, enrollment: 6 },
  { universityId: 'nankai', province: '天津', year: 2025, category: '物理类', minScore: 649, avgScore: 655, minRank: 2548, avgRank: 1960, enrollment: 5 },
  { universityId: 'tsinghua', province: '天津', year: 2025, category: '物理类', minScore: 693, avgScore: 698, minRank: 100, avgRank: 70, enrollment: 3 },
  { universityId: 'pku', province: '天津', year: 2025, category: '物理类', minScore: 690, avgScore: 695, minRank: 122, avgRank: 87, enrollment: 3 },
  { universityId: 'buaa', province: '天津', year: 2025, category: '物理类', minScore: 665, avgScore: 671, minRank: 1957, avgRank: 1545, enrollment: 5 },
  { universityId: 'bupt', province: '天津', year: 2025, category: '物理类', minScore: 643, avgScore: 649, minRank: 4326, avgRank: 3708, enrollment: 5 },
  { universityId: 'sjtu', province: '上海', year: 2025, category: '物理类', minScore: 683, avgScore: 688, minRank: 309, avgRank: 227, enrollment: 5 },
  { universityId: 'fudan', province: '上海', year: 2025, category: '物理类', minScore: 682, avgScore: 687, minRank: 301, avgRank: 223, enrollment: 4 },
  { universityId: 'tongji', province: '上海', year: 2025, category: '物理类', minScore: 661, avgScore: 667, minRank: 1764, avgRank: 1372, enrollment: 5 },
  { universityId: 'ecnu', province: '上海', year: 2025, category: '物理类', minScore: 645, avgScore: 651, minRank: 4944, avgRank: 4223, enrollment: 5 },
  { universityId: 'nuaa_cqu', province: '上海', year: 2025, category: '物理类', minScore: 638, avgScore: 644, minRank: 5800, avgRank: 5000, enrollment: 5 },
  { universityId: 'tsinghua', province: '上海', year: 2025, category: '物理类', minScore: 691, avgScore: 696, minRank: 110, avgRank: 75, enrollment: 3 },
  { universityId: 'sxu', province: '山西', year: 2025, category: '理科', minScore: 532, avgScore: 540, minRank: 28560, avgRank: 24480, enrollment: 8 },
  { universityId: 'tsinghua', province: '山西', year: 2025, category: '理科', minScore: 695, avgScore: 700, minRank: 60, avgRank: 40, enrollment: 2 },
  { universityId: 'pku', province: '山西', year: 2025, category: '理科', minScore: 692, avgScore: 697, minRank: 71, avgRank: 49, enrollment: 2 },
  { universityId: 'hust', province: '山西', year: 2025, category: '理科', minScore: 633, avgScore: 639, minRank: 4326, avgRank: 3605, enrollment: 4 },
  { universityId: 'bupt', province: '山西', year: 2025, category: '理科', minScore: 603, avgScore: 609, minRank: 8755, avgRank: 7416, enrollment: 5 },
  { universityId: 'imust', province: '内蒙古', year: 2025, category: '理科', minScore: 461, avgScore: 471, minRank: 29400, avgRank: 25480, enrollment: 6 },
  { universityId: 'tsinghua', province: '内蒙古', year: 2025, category: '理科', minScore: 692, avgScore: 697, minRank: 51, avgRank: 35, enrollment: 2 },
  { universityId: 'pku', province: '内蒙古', year: 2025, category: '理科', minScore: 689, avgScore: 694, minRank: 57, avgRank: 39, enrollment: 2 },
  { universityId: 'hust', province: '内蒙古', year: 2025, category: '理科', minScore: 614, avgScore: 620, minRank: 3686, avgRank: 3007, enrollment: 4 },
  { universityId: 'jlu', province: '吉林', year: 2025, category: '理科', minScore: 572, avgScore: 580, minRank: 9690, avgRank: 8160, enrollment: 10 },
  { universityId: 'tsinghua', province: '吉林', year: 2025, category: '理科', minScore: 693, avgScore: 698, minRank: 55, avgRank: 38, enrollment: 2 },
  { universityId: 'pku', province: '吉林', year: 2025, category: '理科', minScore: 690, avgScore: 695, minRank: 61, avgRank: 43, enrollment: 2 },
  { universityId: 'hust', province: '吉林', year: 2025, category: '理科', minScore: 603, avgScore: 609, minRank: 5665, avgRank: 4738, enrollment: 4 },
  { universityId: 'hit', province: '黑龙江', year: 2025, category: '理科', minScore: 613, avgScore: 621, minRank: 3605, avgRank: 2884, enrollment: 8 },
  { universityId: 'hrbeu', province: '黑龙江', year: 2025, category: '理科', minScore: 556, avgScore: 564, minRank: 11760, avgRank: 9800, enrollment: 6 },
  { universityId: 'nepu', province: '黑龙江', year: 2025, category: '理科', minScore: 464, avgScore: 474, minRank: 36860, avgRank: 32010, enrollment: 5 },
  { universityId: 'tsinghua', province: '黑龙江', year: 2025, category: '理科', minScore: 696, avgScore: 701, minRank: 51, avgRank: 35, enrollment: 2 },
  { universityId: 'jxnu', province: '江西', year: 2025, category: '理科', minScore: 533, avgScore: 541, minRank: 43260, avgRank: 37080, enrollment: 6 },
  { universityId: 'nchu', province: '江西', year: 2025, category: '理科', minScore: 523, avgScore: 531, minRank: 49440, avgRank: 43260, enrollment: 5 },
  { universityId: 'tsinghua', province: '江西', year: 2025, category: '理科', minScore: 697, avgScore: 702, minRank: 55, avgRank: 38, enrollment: 2 },
  { universityId: 'pku', province: '江西', year: 2025, category: '理科', minScore: 694, avgScore: 699, minRank: 61, avgRank: 43, enrollment: 2 },
  { universityId: 'hust', province: '江西', year: 2025, category: '理科', minScore: 623, avgScore: 629, minRank: 5665, avgRank: 4738, enrollment: 4 },
  { universityId: 'bupt', province: '江西', year: 2025, category: '理科', minScore: 598, avgScore: 604, minRank: 10300, avgRank: 8755, enrollment: 5 },
  { universityId: 'gxu', province: '广西', year: 2025, category: '理科', minScore: 542, avgScore: 550, minRank: 28560, avgRank: 24480, enrollment: 6 },
  { universityId: 'guet', province: '广西', year: 2025, category: '理科', minScore: 513, avgScore: 521, minRank: 41200, avgRank: 36050, enrollment: 6 },
  { universityId: 'tsinghua', province: '广西', year: 2025, category: '理科', minScore: 697, avgScore: 702, minRank: 45, avgRank: 30, enrollment: 2 },
  { universityId: 'hust', province: '广西', year: 2025, category: '理科', minScore: 621, avgScore: 627, minRank: 4944, avgRank: 4120, enrollment: 4 },
  { universityId: 'hainanu', province: '海南', year: 2025, category: '综合', minScore: 602, avgScore: 610, minRank: 9900, avgRank: 8415, enrollment: 6 },
  { universityId: 'tsinghua', province: '海南', year: 2025, category: '综合', minScore: 863, avgScore: 873, minRank: 30, avgRank: 20, enrollment: 2 },
  { universityId: 'hust', province: '海南', year: 2025, category: '综合', minScore: 743, avgScore: 753, minRank: 1236, avgRank: 1030, enrollment: 3 },
  { universityId: 'cqu', province: '重庆', year: 2025, category: '物理类', minScore: 602, avgScore: 610, minRank: 12240, avgRank: 10200, enrollment: 6 },
  { universityId: 'cqupt', province: '重庆', year: 2025, category: '物理类', minScore: 549, avgScore: 557, minRank: 31040, avgRank: 27160, enrollment: 8 },
  { universityId: 'cqjtu', province: '重庆', year: 2025, category: '物理类', minScore: 514, avgScore: 522, minRank: 48500, avgRank: 42680, enrollment: 5 },
  { universityId: 'tsinghua', province: '重庆', year: 2025, category: '物理类', minScore: 695, avgScore: 700, minRank: 65, avgRank: 45, enrollment: 2 },
  { universityId: 'uestc', province: '重庆', year: 2025, category: '物理类', minScore: 644, avgScore: 650, minRank: 4365, avgRank: 3686, enrollment: 5 },
  { universityId: 'gsu', province: '贵州', year: 2025, category: '理科', minScore: 522, avgScore: 530, minRank: 28560, avgRank: 24480, enrollment: 6 },
  { universityId: 'tsinghua', province: '贵州', year: 2025, category: '理科', minScore: 697, avgScore: 702, minRank: 40, avgRank: 28, enrollment: 2 },
  { universityId: 'hust', province: '贵州', year: 2025, category: '理科', minScore: 618, avgScore: 624, minRank: 4326, avgRank: 3605, enrollment: 4 },
  { universityId: 'ynu', province: '云南', year: 2025, category: '理科', minScore: 532, avgScore: 540, minRank: 26520, avgRank: 22440, enrollment: 6 },
  { universityId: 'tsinghua', province: '云南', year: 2025, category: '理科', minScore: 699, avgScore: 704, minRank: 40, avgRank: 28, enrollment: 2 },
  { universityId: 'hust', province: '云南', year: 2025, category: '理科', minScore: 615, avgScore: 621, minRank: 4944, avgRank: 4120, enrollment: 4 },
  { universityId: 'tibetu', province: '西藏', year: 2025, category: '理科', minScore: 421, avgScore: 431, minRank: 5880, avgRank: 5096, enrollment: 5 },
  { universityId: 'lzu', province: '甘肃', year: 2025, category: '理科', minScore: 562, avgScore: 570, minRank: 7140, avgRank: 5916, enrollment: 6 },
  { universityId: 'tsinghua', province: '甘肃', year: 2025, category: '理科', minScore: 695, avgScore: 700, minRank: 40, avgRank: 28, enrollment: 2 },
  { universityId: 'hust', province: '甘肃', year: 2025, category: '理科', minScore: 603, avgScore: 609, minRank: 4635, avgRank: 3914, enrollment: 4 },
  { universityId: 'qhnu', province: '青海', year: 2025, category: '理科', minScore: 403, avgScore: 413, minRank: 8240, avgRank: 7004, enrollment: 5 },
  { universityId: 'tsinghua', province: '青海', year: 2025, category: '理科', minScore: 683, avgScore: 688, minRank: 15, avgRank: 10, enrollment: 2 },
  { universityId: 'nxu', province: '宁夏', year: 2025, category: '理科', minScore: 472, avgScore: 480, minRank: 8160, avgRank: 6936, enrollment: 5 },
  { universityId: 'tsinghua', province: '宁夏', year: 2025, category: '理科', minScore: 688, avgScore: 693, minRank: 15, avgRank: 10, enrollment: 2 },
  { universityId: 'xju', province: '新疆', year: 2025, category: '理科', minScore: 492, avgScore: 500, minRank: 7140, avgRank: 6120, enrollment: 6 },
  { universityId: 'tsinghua', province: '新疆', year: 2025, category: '理科', minScore: 691, avgScore: 696, minRank: 15, avgRank: 10, enrollment: 2 },
  { universityId: 'hust', province: '新疆', year: 2025, category: '理科', minScore: 583, avgScore: 589, minRank: 3090, avgRank: 2575, enrollment: 4 },
  { universityId: 'bit', province: '北京', year: 2025, category: '物理类', minScore: 660, avgScore: 666, minRank: 2244, avgRank: 1836, enrollment: 6 },
  { universityId: 'bit', province: '河南', year: 2025, category: '理科', minScore: 656, avgScore: 662, minRank: 2448, avgRank: 1938, enrollment: 4 },
  { universityId: 'bit', province: '广东', year: 2025, category: '物理类', minScore: 654, avgScore: 660, minRank: 2652, avgRank: 2142, enrollment: 4 },
  { universityId: 'fudan', province: '河南', year: 2025, category: '理科', minScore: 684, avgScore: 689, minRank: 446, avgRank: 330, enrollment: 3 },
  { universityId: 'fudan', province: '广东', year: 2025, category: '物理类', minScore: 680, avgScore: 685, minRank: 563, avgRank: 417, enrollment: 3 },
  { universityId: 'nudt', province: '河南', year: 2025, category: '理科', minScore: 643, avgScore: 649, minRank: 4326, avgRank: 3605, enrollment: 4 },
  { universityId: 'nudt', province: '湖南', year: 2025, category: '物理类', minScore: 635, avgScore: 641, minRank: 4944, avgRank: 4120, enrollment: 8 },
  { universityId: 'xidian', province: '河南', year: 2025, category: '理科', minScore: 619, avgScore: 625, minRank: 7252, avgRank: 6272, enrollment: 6 },
  { universityId: 'xidian', province: '陕西', year: 2025, category: '理科', minScore: 601, avgScore: 607, minRank: 7840, avgRank: 6664, enrollment: 10 },
  { universityId: 'xidian', province: '广东', year: 2025, category: '物理类', minScore: 613, avgScore: 619, minRank: 8330, avgRank: 7056, enrollment: 5 },
  { universityId: 'neu', province: '辽宁', year: 2025, category: '物理类', minScore: 592, avgScore: 598, minRank: 14280, avgRank: 12240, enrollment: 8 },
  { universityId: 'neu', province: '河南', year: 2025, category: '理科', minScore: 610, avgScore: 616, minRank: 9180, avgRank: 7956, enrollment: 5 },
  { universityId: 'scu', province: '四川', year: 2025, category: '理科', minScore: 622, avgScore: 628, minRank: 12240, avgRank: 10200, enrollment: 8 },
  { universityId: 'scu', province: '河南', year: 2025, category: '理科', minScore: 626, avgScore: 632, minRank: 6936, avgRank: 5916, enrollment: 4 },
  { universityId: 'sdu', province: '山东', year: 2025, category: '综合', minScore: 632, avgScore: 638, minRank: 8160, avgRank: 6936, enrollment: 6 },
  { universityId: 'sdu', province: '河南', year: 2025, category: '理科', minScore: 624, avgScore: 630, minRank: 7344, avgRank: 6324, enrollment: 4 },
  { universityId: 'cqu', province: '河南', year: 2025, category: '理科', minScore: 612, avgScore: 618, minRank: 8772, avgRank: 7548, enrollment: 4 },
  { universityId: 'bnu', province: '北京', year: 2025, category: '物理类', minScore: 652, avgScore: 658, minRank: 2856, avgRank: 2346, enrollment: 4 },
  { universityId: 'bnu', province: '河南', year: 2025, category: '理科', minScore: 638, avgScore: 644, minRank: 5100, avgRank: 4284, enrollment: 3 },
  { universityId: 'ecnu', province: '河南', year: 2025, category: '理科', minScore: 633, avgScore: 639, minRank: 5974, avgRank: 5047, enrollment: 3 },
  { universityId: 'lzu', province: '河南', year: 2025, category: '理科', minScore: 600, avgScore: 606, minRank: 11220, avgRank: 9690, enrollment: 4 },
  { universityId: 'nuaa', province: '江苏', year: 2025, category: '物理类', minScore: 633, avgScore: 639, minRank: 8240, avgRank: 7004, enrollment: 5 },
  { universityId: 'nuaa', province: '河南', year: 2025, category: '理科', minScore: 615, avgScore: 621, minRank: 8446, avgRank: 7210, enrollment: 4 },
  { universityId: 'njust', province: '江苏', year: 2025, category: '物理类', minScore: 630, avgScore: 636, minRank: 8730, avgRank: 7372, enrollment: 5 },
  { universityId: 'njust', province: '河南', year: 2025, category: '理科', minScore: 612, avgScore: 618, minRank: 8730, avgRank: 7566, enrollment: 4 },
  { universityId: 'hust_wut', province: '湖北', year: 2025, category: '物理类', minScore: 603, avgScore: 609, minRank: 12000, avgRank: 10000, enrollment: 6 },
  { universityId: 'hust_wut', province: '河南', year: 2025, category: '理科', minScore: 603, avgScore: 609, minRank: 10000, avgRank: 8600, enrollment: 5 },
  { universityId: 'swjtu', province: '四川', year: 2025, category: '理科', minScore: 594, avgScore: 600, minRank: 21340, avgRank: 18430, enrollment: 6 },
  { universityId: 'swjtu', province: '河南', year: 2025, category: '理科', minScore: 600, avgScore: 606, minRank: 11640, avgRank: 10088, enrollment: 5 },
  { universityId: 'njupt', province: '江苏', year: 2025, category: '物理类', minScore: 594, avgScore: 600, minRank: 15520, avgRank: 13386, enrollment: 6 },
  { universityId: 'njupt', province: '河南', year: 2025, category: '理科', minScore: 584, avgScore: 590, minRank: 17460, avgRank: 15132, enrollment: 5 },
  { universityId: 'hdu', province: '浙江', year: 2025, category: '综合', minScore: 602, avgScore: 608, minRank: 51000, avgRank: 44880, enrollment: 6 },
  { universityId: 'hdu', province: '河南', year: 2025, category: '理科', minScore: 577, avgScore: 583, minRank: 20400, avgRank: 17748, enrollment: 5 },
  { universityId: 'sustech', province: '广东', year: 2025, category: '物理类', minScore: 622, avgScore: 628, minRank: 9405, avgRank: 7920, enrollment: 5 },
  { universityId: 'szu', province: '广东', year: 2025, category: '物理类', minScore: 600, avgScore: 606, minRank: 12240, avgRank: 10404, enrollment: 6 },
  { universityId: 'uestc_us', province: '四川', year: 2025, category: '理科', minScore: 623, avgScore: 629, minRank: 12000, avgRank: 10000, enrollment: 6 },
  { universityId: 'uestc_us', province: '河南', year: 2025, category: '理科', minScore: 631, avgScore: 637, minRank: 6400, avgRank: 5400, enrollment: 4 },
  { universityId: 'bjut', province: '北京', year: 2025, category: '物理类', minScore: 613, avgScore: 619, minRank: 8858, avgRank: 7622, enrollment: 6 },
  { universityId: 'scnu', province: '广东', year: 2025, category: '物理类', minScore: 583, avgScore: 589, minRank: 18540, avgRank: 15965, enrollment: 5 },
  { universityId: 'zucc', province: '浙江', year: 2025, category: '综合', minScore: 553, avgScore: 561, minRank: 103000, avgRank: 92700, enrollment: 6 },
  { universityId: 'nuaa_cqu', province: '河南', year: 2025, category: '理科', minScore: 611, avgScore: 617, minRank: 9000, avgRank: 7800, enrollment: 4 },
  { universityId: 'suda', province: '江苏', year: 2025, category: '物理类', minScore: 603, avgScore: 609, minRank: 13390, avgRank: 11330, enrollment: 5 },
  { universityId: 'zzu', province: '河南', year: 2025, category: '理科', minScore: 582, avgScore: 588, minRank: 18360, avgRank: 15912, enrollment: 8 },
  { universityId: 'henu', province: '河南', year: 2025, category: '理科', minScore: 548, avgScore: 554, minRank: 32960, avgRank: 28840, enrollment: 6 },
  { universityId: 'hit_wh', province: '山东', year: 2025, category: '综合', minScore: 621, avgScore: 627, minRank: 9800, avgRank: 8330, enrollment: 5 },
  { universityId: 'hit_wh', province: '河南', year: 2025, category: '理科', minScore: 621, avgScore: 627, minRank: 7056, avgRank: 6076, enrollment: 4 },
  { universityId: 'ccsu', province: '湖南', year: 2025, category: '物理类', minScore: 548, avgScore: 554, minRank: 43260, avgRank: 37080, enrollment: 5 },
  { universityId: 'hunnu', province: '湖南', year: 2025, category: '物理类', minScore: 569, avgScore: 575, minRank: 27160, avgRank: 23280, enrollment: 5 },
  { universityId: 'hbut', province: '湖北', year: 2025, category: '物理类', minScore: 543, avgScore: 549, minRank: 46350, avgRank: 40170, enrollment: 5 },
  { universityId: 'hebust', province: '河北', year: 2025, category: '物理类', minScore: 511, avgScore: 517, minRank: 73500, avgRank: 63700, enrollment: 5 },
  { universityId: 'ahnu', province: '安徽', year: 2025, category: '理科', minScore: 523, avgScore: 529, minRank: 66950, avgRank: 57680, enrollment: 5 },
  { universityId: 'xaut', province: '陕西', year: 2025, category: '理科', minScore: 513, avgScore: 519, minRank: 32960, avgRank: 28840, enrollment: 5 },
  { universityId: 'fzu', province: '河南', year: 2025, category: '理科', minScore: 592, avgScore: 598, minRank: 14280, avgRank: 12240, enrollment: 4 },
  { universityId: 'cqupt', province: '河南', year: 2025, category: '理科', minScore: 569, avgScore: 575, minRank: 23280, avgRank: 20176, enrollment: 5 },
  { universityId: 'bit', province: '四川', year: 2025, category: '理科', minScore: 652, avgScore: 658, minRank: 2856, avgRank: 2346, enrollment: 4 },
  { universityId: 'bit', province: '湖北', year: 2025, category: '物理类', minScore: 650, avgScore: 656, minRank: 3060, avgRank: 2550, enrollment: 4 },
  { universityId: 'tju', province: '河南', year: 2025, category: '理科', minScore: 638, avgScore: 644, minRank: 5100, avgRank: 4284, enrollment: 4 },
  { universityId: 'tju', province: '广东', year: 2025, category: '物理类', minScore: 636, avgScore: 642, minRank: 5304, avgRank: 4488, enrollment: 4 },
  { universityId: 'jlu', province: '河南', year: 2025, category: '理科', minScore: 600, avgScore: 606, minRank: 11220, avgRank: 9690, enrollment: 4 },
  { universityId: 'dlut', province: '辽宁', year: 2025, category: '物理类', minScore: 603, avgScore: 609, minRank: 11330, avgRank: 9682, enrollment: 6 },
  { universityId: 'sysu', province: '广东', year: 2025, category: '物理类', minScore: 631, avgScore: 637, minRank: 7004, avgRank: 5974, enrollment: 8 },
  { universityId: 'xmu', province: '河南', year: 2025, category: '理科', minScore: 620, avgScore: 626, minRank: 7548, avgRank: 6528, enrollment: 3 },
  { universityId: 'nankai', province: '河南', year: 2025, category: '理科', minScore: 639, avgScore: 645, minRank: 4116, avgRank: 3430, enrollment: 3 },
  { universityId: 'tongji', province: '上海', year: 2025, category: '物理类', minScore: 661, avgScore: 667, minRank: 1764, avgRank: 1372, enrollment: 5 },
  { universityId: 'seu', province: '河南', year: 2025, category: '理科', minScore: 642, avgScore: 648, minRank: 3876, avgRank: 3162, enrollment: 4 },
  { universityId: 'scut', province: '广东', year: 2025, category: '物理类', minScore: 633, avgScore: 639, minRank: 6386, avgRank: 5356, enrollment: 8 },
  { universityId: 'ustc', province: '安徽', year: 2025, category: '理科', minScore: 673, avgScore: 678, minRank: 618, avgRank: 464, enrollment: 5 },
] {
  const provinces = new Set(scoreRecords.map(s => s.province))
  return Array.from(provinces).sort()
}
