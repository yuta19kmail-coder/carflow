// ========================================
// sample-data.js
// サンプル車両データ（v1.0.4 実運用イメージで再構築）
//
// 配置方針：
//   その他    4台（買取・廃車・保留など、売り物じゃない車両）
//   仕入れ    4台（入荷直後、整備待ち）
//   再生中    4台（再生作業中、進捗バラバラ）
//   展示中   15台（再生完了済み、店頭展示中）
//   納車準備  4台（売約済み、納車近い）
//   納車完了  3台（今月納車済み、月次集計待ち）
//   合計     34台
// ========================================

function makeSampleCars() {
  const t = todayStr();

  // 再生完了済みのフルタスク状態（展示中・納車準備・納車完了で使う）
  const REGEN_FULL = {
    t_equip: {e1:true,e2:true,e3:true,e4:true,e5:true},
    t_regen: {r1:true,r2:true,r3:true,r4:true},
    t_photo: true,
    t_estim: true,
    t_webup: true,
    t_exhibit: {ex1:true,ex2:true,ex3:true,ex4:true}
  };

  // 納車準備フルタスク状態（納車完了で使う）
  const DELIVERY_FULL = {
    d_prep: {dp1:true,dp2:true},
    d_maint: {dm1:true,dm2:true,dm3:true},
    d_docs: true,
    d_reg: true
  };

  return [
    // ===== その他 4台（買取・廃車・保留） =====
    {
      id:'o1', num:'KM2901', maker:'スズキ', model:'アルト F',
      year:'2015', color:'シルバー', size:'軽自動車', km:'82000', price:'',
      purchaseDate:dateAddDays(t,-12), contract:0, deliveryDate:'',
      memo:'買取車両、簡単に仕上げてオークション出品予定', workMemo:'',
      photo:'images/sample/car1.jpg', col:'other',
      regenTasks:mkTaskState(REGEN_TASKS),
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'o2', num:'KM2905', maker:'ホンダ', model:'ライフ',
      year:'2010', color:'ホワイト', size:'軽自動車', km:'135000', price:'',
      purchaseDate:dateAddDays(t,-25), contract:0, deliveryDate:'',
      memo:'廃車予定、書類待ち。客先で引取済み', workMemo:'解体屋への手配済',
      photo:'images/sample/car2.jpg', col:'other',
      regenTasks:mkTaskState(REGEN_TASKS),
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'o3', num:'KM2912', maker:'トヨタ', model:'プロボックス',
      year:'2018', color:'ホワイト', size:'トラック', km:'98000', price:'',
      purchaseDate:dateAddDays(t,-6), contract:0, deliveryDate:'',
      memo:'下取り車両、買取りで保留中。再生して販売 or オークション検討', workMemo:'',
      photo:'images/sample/car3.jpg', col:'other',
      regenTasks:mkTaskState(REGEN_TASKS),
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'o4', num:'KM2918', maker:'ダイハツ', model:'ハイゼット',
      year:'2016', color:'ホワイト', size:'トラック', km:'72000', price:'',
      purchaseDate:dateAddDays(t,-3), contract:0, deliveryDate:'',
      memo:'社用車として保留。販売 or 自社使用判断中', workMemo:'',
      photo:'images/sample/car4.jpg', col:'other',
      regenTasks:mkTaskState(REGEN_TASKS),
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },

    // ===== 仕入れ 4台（入荷直後、整備待ち） =====
    {
      id:'p1', num:'KM2015', maker:'スズキ', model:'ジムニー XC',
      year:'2020', color:'カーキ', size:'軽自動車', km:'32000', price:'1280000',
      purchaseDate:dateAddDays(t,-3), contract:0, deliveryDate:'',
      memo:'人気車種、入荷直後', workMemo:'',
      photo:'images/sample/car1.jpg', col:'purchase',
      regenTasks:mkTaskState(REGEN_TASKS),
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'p2', num:'KM2027', maker:'ダイハツ', model:'タント カスタム',
      year:'2021', color:'ホワイト', size:'軽自動車', km:'24000', price:'1180000',
      purchaseDate:dateAddDays(t,-5), contract:0, deliveryDate:'',
      memo:'', workMemo:'',
      photo:'images/sample/car2.jpg', col:'purchase',
      regenTasks:mkTaskState(REGEN_TASKS),
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'p3', num:'KM2058', maker:'ホンダ', model:'フィット ホーム',
      year:'2023', color:'シルバー', size:'コンパクト', km:'8000', price:'1680000',
      purchaseDate:dateAddDays(t,-2), contract:0, deliveryDate:'',
      memo:'年式新しめ、優先的に再生', workMemo:'',
      photo:'images/sample/car4.jpg', col:'purchase',
      regenTasks:mkTaskState(REGEN_TASKS),
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'p4', num:'KM2065', maker:'日産', model:'ルークス ハイウェイスター',
      year:'2022', color:'ブラック', size:'軽自動車', km:'19000', price:'1420000',
      purchaseDate:dateAddDays(t,-7), contract:0, deliveryDate:'',
      memo:'', workMemo:'',
      photo:'images/sample/car5.jpg', col:'purchase',
      regenTasks:mkTaskState(REGEN_TASKS),
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },

    // ===== 再生中 4台（進捗バラバラ） =====
    {
      id:'r1', num:'KM2043', maker:'トヨタ', model:'ヤリス X',
      year:'2022', color:'レッド', size:'コンパクト', km:'18000', price:'1380000',
      purchaseDate:dateAddDays(t,-7), contract:0, deliveryDate:'',
      memo:'', workMemo:'装備品チェック完了、エンジン点検中',
      photo:'images/sample/car3.jpg', col:'regen',
      regenTasks:{
        t_equip: {e1:true,e2:true,e3:true,e4:true,e5:true},
        t_regen: {r1:true,r2:false,r3:false,r4:false},
        t_photo:false, t_estim:false, t_webup:false,
        t_exhibit: {ex1:false,ex2:false,ex3:false,ex4:false}
      },
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'r2', num:'KM2072', maker:'マツダ', model:'CX-3 XD',
      year:'2021', color:'ソウルレッド', size:'SUV', km:'38000', price:'1780000',
      purchaseDate:dateAddDays(t,-25), contract:0, deliveryDate:'',
      memo:'', workMemo:'再生ほぼ完了、磨き残り',
      photo:'images/sample/car6.jpg', col:'regen',
      regenTasks:{
        t_equip: {e1:true,e2:true,e3:true,e4:true,e5:true},
        t_regen: {r1:true,r2:true,r3:true,r4:true},
        t_photo:true, t_estim:true, t_webup:false,
        t_exhibit: {ex1:true,ex2:false,ex3:false,ex4:false}
      },
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'r3', num:'KM2089', maker:'スバル', model:'フォレスター X',
      year:'2020', color:'ネイビー', size:'SUV', km:'52000', price:'1980000',
      purchaseDate:dateAddDays(t,-35), contract:0, deliveryDate:'',
      memo:'', workMemo:'板金塗装に時間かかってる',
      photo:'images/sample/car7.jpg', col:'regen',
      regenTasks:{
        t_equip: {e1:true,e2:true,e3:true,e4:true,e5:false},
        t_regen: {r1:true,r2:true,r3:false,r4:false},
        t_photo:false, t_estim:false, t_webup:false,
        t_exhibit: {ex1:false,ex2:false,ex3:false,ex4:false}
      },
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'r4', num:'KM2061', maker:'トヨタ', model:'プリウス Z',
      year:'2023', color:'パールホワイト', size:'コンパクト', km:'28000', price:'1580000',
      purchaseDate:dateAddDays(t,-20), contract:0, deliveryDate:'',
      memo:'', workMemo:'',
      photo:'images/sample/car5.jpg', col:'regen',
      regenTasks:{
        t_equip: {e1:true,e2:true,e3:false,e4:false,e5:false},
        t_regen: {r1:false,r2:false,r3:false,r4:false},
        t_photo:false, t_estim:false, t_webup:false,
        t_exhibit: {ex1:false,ex2:false,ex3:false,ex4:false}
      },
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },

    // ===== 展示中 15台（再生完了済み） =====
    // 軽自動車エリア（4台）
    {
      id:'e1', num:'KM2094', maker:'ホンダ', model:'N-BOX G',
      year:'2022', color:'ブルー', size:'軽自動車', km:'15000', price:'980000',
      purchaseDate:dateAddDays(t,-15), contract:0, deliveryDate:'',
      memo:'', workMemo:'',
      photo:'images/sample/car8.jpg', col:'exhibit',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'e2', num:'KM2095', maker:'スズキ', model:'ハスラー G',
      year:'2021', color:'オレンジ', size:'軽自動車', km:'21000', price:'1180000',
      purchaseDate:dateAddDays(t,-22), contract:0, deliveryDate:'',
      memo:'', workMemo:'',
      photo:'images/sample/car6.jpg', col:'exhibit',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'e3', num:'KM2096', maker:'ダイハツ', model:'ムーヴ キャンバス',
      year:'2020', color:'ピンク', size:'軽自動車', km:'34000', price:'880000',
      purchaseDate:dateAddDays(t,-28), contract:0, deliveryDate:'',
      memo:'', workMemo:'',
      photo:'images/sample/car7.jpg', col:'exhibit',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'e4', num:'KM2097', maker:'スズキ', model:'ワゴンR',
      year:'2019', color:'シルバー', size:'軽自動車', km:'48000', price:'780000',
      purchaseDate:dateAddDays(t,-50), contract:0, deliveryDate:'',
      memo:'長期在庫', workMemo:'値下げ検討中',
      photo:'images/sample/car8.jpg', col:'exhibit',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },

    // コンパクトエリア（4台）
    {
      id:'e5', num:'KM2118', maker:'日産', model:'ノート オーラ',
      year:'2023', color:'ブロンズ', size:'コンパクト', km:'12000', price:'2080000',
      purchaseDate:dateAddDays(t,-40), contract:0, deliveryDate:'',
      memo:'長期在庫アラート検証用', workMemo:'',
      photo:'images/sample/car10.jpg', col:'exhibit',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'e6', num:'KM2119', maker:'トヨタ', model:'アクア G',
      year:'2022', color:'ホワイト', size:'コンパクト', km:'18000', price:'1680000',
      purchaseDate:dateAddDays(t,-19), contract:0, deliveryDate:'',
      memo:'', workMemo:'',
      photo:'images/sample/car9.jpg', col:'exhibit',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'e7', num:'KM2120', maker:'ホンダ', model:'フリード G',
      year:'2021', color:'ブラック', size:'コンパクト', km:'29000', price:'1880000',
      purchaseDate:dateAddDays(t,-12), contract:0, deliveryDate:'',
      memo:'', workMemo:'',
      photo:'images/sample/car10.jpg', col:'exhibit',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'e8', num:'KM2121', maker:'マツダ', model:'マツダ2',
      year:'2020', color:'グレー', size:'コンパクト', km:'42000', price:'1380000',
      purchaseDate:dateAddDays(t,-32), contract:0, deliveryDate:'',
      memo:'', workMemo:'',
      photo:'images/sample/car11.jpg', col:'exhibit',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },

    // SUVエリア（4台）
    {
      id:'e9', num:'KM2107', maker:'マツダ', model:'CX-5 25S',
      year:'2022', color:'ソウルレッド', size:'SUV', km:'22000', price:'2480000',
      purchaseDate:dateAddDays(t,-18), contract:0, deliveryDate:'',
      memo:'', workMemo:'',
      photo:'images/sample/car9.jpg', col:'exhibit',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'e10', num:'KM2122', maker:'トヨタ', model:'ハリアー Z',
      year:'2022', color:'ブラック', size:'SUV', km:'26000', price:'3680000',
      purchaseDate:dateAddDays(t,-24), contract:0, deliveryDate:'',
      memo:'', workMemo:'',
      photo:'images/sample/car12.jpg', col:'exhibit',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'e11', num:'KM2123', maker:'ホンダ', model:'ヴェゼル',
      year:'2021', color:'ホワイトパール', size:'SUV', km:'33000', price:'2280000',
      purchaseDate:dateAddDays(t,-16), contract:0, deliveryDate:'',
      memo:'', workMemo:'',
      photo:'images/sample/car13.jpg', col:'exhibit',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'e12', num:'KM2124', maker:'スバル', model:'XV',
      year:'2020', color:'シルバー', size:'SUV', km:'48000', price:'1880000',
      purchaseDate:dateAddDays(t,-46), contract:0, deliveryDate:'',
      memo:'長期在庫', workMemo:'',
      photo:'images/sample/car1.jpg', col:'exhibit',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },

    // ミニバンエリア（2台）
    {
      id:'e13', num:'KM2125', maker:'トヨタ', model:'ヴォクシー',
      year:'2022', color:'ブラック', size:'ミニバン', km:'24000', price:'2980000',
      purchaseDate:dateAddDays(t,-21), contract:0, deliveryDate:'',
      memo:'', workMemo:'',
      photo:'images/sample/car2.jpg', col:'exhibit',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'e14', num:'KM2127', maker:'ホンダ', model:'ステップワゴン スパーダ',
      year:'2020', color:'パールホワイト', size:'ミニバン', km:'58000', price:'2380000',
      purchaseDate:dateAddDays(t,-38), contract:0, deliveryDate:'',
      memo:'', workMemo:'',
      photo:'images/sample/car3.jpg', col:'exhibit',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },

    // セダンエリア（1台）
    {
      id:'e15', num:'KM2128', maker:'トヨタ', model:'カローラ',
      year:'2021', color:'シルバー', size:'セダン', km:'32000', price:'1880000',
      purchaseDate:dateAddDays(t,-26), contract:0, deliveryDate:'',
      memo:'', workMemo:'',
      photo:'images/sample/car4.jpg', col:'exhibit',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },

    // ===== 納車準備 4台（売約済み・納車近い） =====
    {
      id:'d1', num:'KM2126', maker:'日産', model:'セレナ e-Power',
      year:'2021', color:'ブラック', size:'ミニバン', km:'45000', price:'2180000',
      purchaseDate:dateAddDays(t,-30), contract:1, contractDate:dateAddDays(t,-10), deliveryDate:dateAddDays(t,7),
      memo:'', workMemo:'整備中、書類完了',
      photo:'images/sample/car11.jpg', col:'delivery',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:{...mkTaskState(DELIVERY_TASKS), d_docs:true}, logs:[]
    },
    {
      id:'d2', num:'KM2131', maker:'トヨタ', model:'アルファード S',
      year:'2022', color:'ブラック', size:'ミニバン', km:'18000', price:'4580000',
      purchaseDate:dateAddDays(t,-22), contract:1, contractDate:dateAddDays(t,-4), deliveryDate:dateAddDays(t,3),
      memo:'', workMemo:'納車3日前、最終チェック中',
      photo:'images/sample/car12.jpg', col:'delivery',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:{
        d_prep: {dp1:true,dp2:false},
        d_maint: {dm1:true,dm2:true,dm3:false},
        d_docs:true,
        d_reg:false
      }, logs:[]
    },
    {
      id:'d3', num:'KM2133', maker:'ホンダ', model:'N-BOX カスタム',
      year:'2022', color:'パールホワイト', size:'軽自動車', km:'19000', price:'1480000',
      purchaseDate:dateAddDays(t,-18), contract:1, contractDate:dateAddDays(t,-2), deliveryDate:dateAddDays(t,12),
      memo:'', workMemo:'',
      photo:'images/sample/car5.jpg', col:'delivery',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'d4', num:'KM2135', maker:'スズキ', model:'スイフト RS',
      year:'2021', color:'レッド', size:'コンパクト', km:'27000', price:'1280000',
      purchaseDate:dateAddDays(t,-15), contract:1, contractDate:dateAddDays(t,-1), deliveryDate:dateAddDays(t,14),
      memo:'', workMemo:'',
      photo:'images/sample/car6.jpg', col:'delivery',
      regenTasks: {...REGEN_FULL},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },

    // ===== 納車完了 3台（今月納車済み） =====
    {
      id:'f1', num:'KM2149', maker:'スバル', model:'レヴォーグ STI',
      year:'2022', color:'WRブルー', size:'セダン', km:'18000', price:'3280000',
      purchaseDate:dateAddDays(t,-60), contract:1, contractDate:dateAddDays(t,-15), deliveryDate:dateAddDays(t,-5),
      memo:'納車済み', workMemo:'',
      photo:'images/sample/car13.jpg', col:'done',
      regenTasks: {...REGEN_FULL},
      deliveryTasks: {...DELIVERY_FULL}, logs:[]
    },
    {
      id:'f2', num:'KM2150', maker:'トヨタ', model:'ライズ Z',
      year:'2022', color:'ブラック', size:'SUV', km:'22000', price:'1980000',
      purchaseDate:dateAddDays(t,-45), contract:1, contractDate:dateAddDays(t,-12), deliveryDate:dateAddDays(t,-2),
      memo:'納車済み', workMemo:'',
      photo:'images/sample/car7.jpg', col:'done',
      regenTasks: {...REGEN_FULL},
      deliveryTasks: {...DELIVERY_FULL}, logs:[]
    },
    {
      id:'f3', num:'KM2151', maker:'ホンダ', model:'フィット e:HEV',
      year:'2023', color:'ホワイト', size:'コンパクト', km:'9000', price:'1980000',
      purchaseDate:dateAddDays(t,-35), contract:1, contractDate:dateAddDays(t,-9), deliveryDate:dateAddDays(t,-1),
      memo:'納車済み', workMemo:'',
      photo:'images/sample/car8.jpg', col:'done',
      regenTasks: {...REGEN_FULL},
      deliveryTasks: {...DELIVERY_FULL}, logs:[]
    },
  ];
}

// 車両データの実体
let cars = makeSampleCars();

// ========================================
// 過去12ヶ月のアーカイブ済みサンプル
// 月販10台ベースに調整、季節変動あり（3月・9月ピーク、1月・8月低め）
// ========================================
function makeArchivedSamples() {
  const makers = ['トヨタ','ホンダ','日産','マツダ','スバル','スズキ','ダイハツ','ミツビシ'];
  const models = {
    'トヨタ':['プリウス S','ヤリス X','ヴォクシー','アクア','カローラ ツーリング','ライズ Z','アルファード'],
    'ホンダ':['フィット ホーム','N-BOX カスタム','フリード G','ヴェゼル','ステップワゴン'],
    '日産':['ノート オーラ','セレナ e-Power','ルークス ハイウェイスター','エクストレイル','デイズ'],
    'マツダ':['CX-3 XD','CX-5 25S','デミオ','マツダ3','CX-30'],
    'スバル':['フォレスター X','インプレッサ','レヴォーグ','XV'],
    'スズキ':['ジムニー XC','スイフト','ハスラー','ワゴンR'],
    'ダイハツ':['タント カスタム','ムーヴ キャンバス','ミラ トコット','ロッキー'],
    'ミツビシ':['ekスペース','デリカ D:5','アウトランダー'],
  };
  const colors = ['パールホワイト','ブラック','シルバー','ブルー','レッド','ネイビー','カーキ','グレー'];
  const sizeBands = [
    {size:'軽自動車', priceMin:800000, priceMax:1600000},
    {size:'コンパクト', priceMin:1000000, priceMax:2000000},
    {size:'SUV', priceMin:1500000, priceMax:3500000},
    {size:'ミニバン', priceMin:1800000, priceMax:4500000},
    {size:'セダン', priceMin:1500000, priceMax:3800000},
    {size:'トラック', priceMin:1200000, priceMax:2500000},
  ];
  // v1.0.4: 月販10台ベースに調整（3月・9月ピーク、1月・8月低め）
  const monthly = {1:7, 2:9, 3:14, 4:11, 5:10, 6:10, 7:10, 8:6, 9:13, 10:11, 11:10, 12:11};
  const out = [];
  const now = new Date();
  let numSeq = 1001;
  for (let back = 12; back >= 1; back--) {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const y = d.getFullYear(), m = d.getMonth()+1;
    const dim = new Date(y, m, 0).getDate();
    const n = monthly[m] || 10;
    for (let i = 0; i < n; i++) {
      const maker = makers[Math.floor(Math.random()*makers.length)];
      const mList = models[maker];
      const model = mList[Math.floor(Math.random()*mList.length)];
      const band = sizeBands[Math.floor(Math.random()*sizeBands.length)];
      const price = Math.round((band.priceMin + Math.random()*(band.priceMax - band.priceMin))/10000)*10000;
      const delivDay = 1 + Math.floor(Math.random()*dim);
      const deliveryDate = `${y}-${String(m).padStart(2,'0')}-${String(delivDay).padStart(2,'0')}`;
      const invDays = 5 + Math.floor(Math.random()*56);
      const purchaseDate = dateAddDays(deliveryDate, -invDays);
      const contractDate = dateAddDays(deliveryDate, -(Math.floor(Math.random()*20)+3));
      const year = 2018 + Math.floor(Math.random()*7);
      const km = 5000 + Math.floor(Math.random()*90000);
      out.push({
        id:'a'+numSeq, num:'KM'+(3000+numSeq),
        maker, model,
        year: fmtYearDisplay(year),
        color: colors[Math.floor(Math.random()*colors.length)],
        size: band.size, km: String(km),
        price: String(price),
        purchaseDate, contractDate, deliveryDate, contract:1,
        memo:'', photo:'images/sample/car'+((numSeq % 13) + 1)+'.jpg', col:'done',
        regenTasks:mkTaskState(REGEN_TASKS),
        deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[],
        _archivedAt: dateAddDays(`${y}-${String(m).padStart(2,'0')}-${String(dim).padStart(2,'0')}`, 3),
        _archivedYM: ymKeyFromYM(y, m),
      });
      numSeq++;
    }
  }
  return out;
}
// 初期アーカイブ投入
archivedCars = makeArchivedSamples();
