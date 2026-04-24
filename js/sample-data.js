// ========================================
// sample-data.js
// サンプル車両データ（デモ用・13台）
// ★実運用時はここを削除し、DB/APIからデータを読み込む想定
//
// 配置方針：
//   仕入れ    4台（小表示の発動確認用）
//   再生中    3台
//   展示中    3台
//   納車準備  2台
//   納車完了  1台
// ========================================

function makeSampleCars() {
  const t = todayStr();
  return [
    // ===== 仕入れ 4台 =====
    {
      id:'c1', num:'KM2015', maker:'スズキ', model:'ジムニー XC',
      year:'2020', color:'カーキ', size:'軽自動車', km:'32000', price:'1280000',
      purchaseDate:dateAddDays(t,-3), contract:0, deliveryDate:'',
      memo:'', photo:'images/sample/car1.jpg', col:'purchase',
      regenTasks:mkTaskState(REGEN_TASKS),
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'c2', num:'KM2027', maker:'ダイハツ', model:'タント カスタム',
      year:'2021', color:'ホワイト', size:'軽自動車', km:'24000', price:'1180000',
      purchaseDate:dateAddDays(t,-5), contract:0, deliveryDate:'',
      memo:'', photo:'images/sample/car2.jpg', col:'purchase',
      regenTasks:mkTaskState(REGEN_TASKS),
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'c3', num:'KM2043', maker:'トヨタ', model:'ヤリス X',
      year:'2022', color:'レッド', size:'コンパクト', km:'18000', price:'1380000',
      purchaseDate:dateAddDays(t,-7), contract:0, deliveryDate:'',
      memo:'', photo:'images/sample/car3.jpg', col:'purchase',
      regenTasks:mkTaskState(REGEN_TASKS),
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'c4', num:'KM2058', maker:'ホンダ', model:'フィット ホーム',
      year:'2023', color:'シルバー', size:'コンパクト', km:'8000', price:'1680000',
      purchaseDate:dateAddDays(t,-2), contract:0, deliveryDate:'',
      memo:'', photo:'images/sample/car4.jpg', col:'purchase',
      regenTasks:mkTaskState(REGEN_TASKS),
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },

    // ===== 再生中 3台 =====
    {
      id:'c5', num:'KM2061', maker:'トヨタ', model:'プリウス Z',
      year:'2023', color:'パールホワイト', size:'コンパクト', km:'28000', price:'1580000',
      purchaseDate:dateAddDays(t,-20), contract:1, contractDate:dateAddDays(t,-8), deliveryDate:dateAddDays(t,10),
      memo:'', photo:'images/sample/car5.jpg', col:'regen',
      regenTasks:{...mkTaskState(REGEN_TASKS), t_equip:{e1:true,e2:true,e3:false,e4:false,e5:false}},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'c6', num:'KM2072', maker:'マツダ', model:'CX-3 XD',
      year:'2021', color:'ソウルレッド', size:'SUV', km:'38000', price:'1780000',
      purchaseDate:dateAddDays(t,-25), contract:0, deliveryDate:'',
      memo:'', photo:'images/sample/car6.jpg', col:'regen',
      regenTasks:{
        ...mkTaskState(REGEN_TASKS),
        t_equip:{e1:true,e2:true,e3:true,e4:true,e5:true},
        t_regen:{r1:true,r2:true,r3:false,r4:false}
      },
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'c7', num:'KM2089', maker:'スバル', model:'フォレスター X',
      year:'2020', color:'ネイビー', size:'SUV', km:'52000', price:'1980000',
      purchaseDate:dateAddDays(t,-35), contract:0, deliveryDate:'',
      memo:'', photo:'images/sample/car7.jpg', col:'regen',
      regenTasks:{
        ...mkTaskState(REGEN_TASKS),
        t_equip:{e1:true,e2:true,e3:true,e4:false,e5:false}
      },
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },

    // ===== 展示中 3台 =====
    {
      id:'c8', num:'KM2094', maker:'ホンダ', model:'N-BOX G',
      year:'2022', color:'ブルー', size:'軽自動車', km:'15000', price:'980000',
      purchaseDate:dateAddDays(t,-15), contract:0, deliveryDate:'',
      memo:'', photo:'images/sample/car8.jpg', col:'exhibit',
      regenTasks:{
        ...mkTaskState(REGEN_TASKS),
        t_equip:{e1:true,e2:true,e3:true,e4:true,e5:true},
        t_regen:{r1:true,r2:true,r3:true,r4:true},
        t_photo:true, t_webup:true
      },
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'c9', num:'KM2107', maker:'マツダ', model:'CX-5 25S',
      year:'2022', color:'ソウルレッド', size:'SUV', km:'22000', price:'2480000',
      purchaseDate:dateAddDays(t,-18), contract:0, deliveryDate:'',
      memo:'', photo:'images/sample/car9.jpg', col:'exhibit',
      regenTasks:{
        ...mkTaskState(REGEN_TASKS),
        t_equip:{e1:true,e2:true,e3:true,e4:true,e5:true},
        t_regen:{r1:true,r2:true,r3:true,r4:true},
        t_photo:true, t_webup:true,
        t_exhibit:{ex1:true,ex2:false,ex3:false,ex4:false}
      },
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'c10', num:'KM2118', maker:'日産', model:'ノート オーラ',
      year:'2023', color:'ブロンズ', size:'コンパクト', km:'12000', price:'2080000',
      purchaseDate:dateAddDays(t,-40), contract:0, deliveryDate:'',
      memo:'長期在庫アラート検証用', photo:'images/sample/car10.jpg', col:'exhibit',
      regenTasks:{
        ...mkTaskState(REGEN_TASKS),
        t_equip:{e1:true,e2:true,e3:true,e4:true,e5:true},
        t_regen:{r1:true,r2:true,r3:true,r4:true},
        t_photo:true, t_webup:true,
        t_exhibit:{ex1:true,ex2:true,ex3:true,ex4:true}
      },
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },

    // ===== 納車準備 2台 =====
    {
      id:'c11', num:'KM2126', maker:'日産', model:'セレナ e-Power',
      year:'2021', color:'ブラック', size:'ミニバン', km:'45000', price:'2180000',
      purchaseDate:dateAddDays(t,-30), contract:1, contractDate:dateAddDays(t,-10), deliveryDate:dateAddDays(t,7),
      memo:'', photo:'images/sample/car11.jpg', col:'delivery',
      regenTasks:{
        t_equip:{e1:true,e2:true,e3:true,e4:true,e5:true},
        t_regen:{r1:true,r2:true,r3:true,r4:true},
        t_photo:true, t_webup:true,
        t_exhibit:{ex1:true,ex2:true,ex3:true,ex4:true}
      },
      deliveryTasks:{...mkTaskState(DELIVERY_TASKS), d_docs:true}, logs:[]
    },
    {
      id:'c12', num:'KM2131', maker:'トヨタ', model:'アルファード S',
      year:'2022', color:'ブラック', size:'ミニバン', km:'18000', price:'4580000',
      purchaseDate:dateAddDays(t,-22), contract:1, contractDate:dateAddDays(t,-4), deliveryDate:dateAddDays(t,3),
      memo:'', photo:'images/sample/car12.jpg', col:'delivery',
      regenTasks:{
        t_equip:{e1:true,e2:true,e3:true,e4:true,e5:true},
        t_regen:{r1:true,r2:true,r3:true,r4:true},
        t_photo:true, t_webup:true,
        t_exhibit:{ex1:true,ex2:true,ex3:true,ex4:true}
      },
      deliveryTasks:{...mkTaskState(DELIVERY_TASKS), d_prep:{p1:true,p2:true,p3:false}, d_docs:true}, logs:[]
    },

    // ===== 納車完了 1台 =====
    {
      id:'c13', num:'KM2149', maker:'スバル', model:'レヴォーグ STI',
      year:'2022', color:'WRブルー', size:'セダン', km:'18000', price:'3280000',
      purchaseDate:dateAddDays(t,-60), contract:1, contractDate:dateAddDays(t,-15), deliveryDate:dateAddDays(t,-5),
      memo:'納車済み', photo:'images/sample/car13.jpg', col:'done',
      regenTasks:{
        t_equip:{e1:true,e2:true,e3:true,e4:true,e5:true},
        t_regen:{r1:true,r2:true,r3:true,r4:true},
        t_photo:true, t_webup:true,
        t_exhibit:{ex1:true,ex2:true,ex3:true,ex4:true}
      },
      deliveryTasks:{
        d_prep:{p1:true,p2:true,p3:true},
        d_maint:{m1:true,m2:true,m3:true},
        d_docs:true,
        d_reg:{g1:true,g2:true}
      }, logs:[]
    },
  ];
}

// 車両データの実体
let cars = makeSampleCars();

// ========================================
// 過去12ヶ月のアーカイブ済みサンプル
// 月ごとに季節変動（3月・9月ピーク、1月・8月低め）
// 販売価格も帯をばらして実態に近づける
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
  // 月ごとの販売台数（季節変動。3月9月ピーク、1月8月低め）
  const monthly = {1:9, 2:13, 3:22, 4:15, 5:12, 6:13, 7:14, 8:8, 9:20, 10:14, 11:13, 12:15};
  const out = [];
  const now = new Date();
  let numSeq = 1001;
  for (let back = 12; back >= 1; back--) {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const y = d.getFullYear(), m = d.getMonth()+1;
    const dim = new Date(y, m, 0).getDate();
    const n = monthly[m] || 12;
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
        memo:'', photo:null, col:'done',
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

