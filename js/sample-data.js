// ========================================
// sample-data.js
// サンプル車両データ（デモ用）
// ★実運用時はここを削除し、DB/APIからデータを読み込む想定
// ========================================

function makeSampleCars() {
  const t = todayStr();
  return [
    {
      id:'c1', num:'CAR-2025-001', maker:'トヨタ', model:'プリウス Z',
      year:'2023', color:'パールホワイト', size:'コンパクト', km:'28000', price:'1580000',
      purchaseDate:dateAddDays(t,-20), contract:1, deliveryDate:dateAddDays(t,10),
      memo:'', photo:null, col:'regen',
      regenTasks:{...mkTaskState(REGEN_TASKS), t_equip:{e1:true,e2:true,e3:false,e4:false,e5:false}},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'c2', num:'CAR-2025-002', maker:'ホンダ', model:'N-BOX G',
      year:'2022', color:'ブルー', size:'軽自動車', km:'15000', price:'980000',
      purchaseDate:dateAddDays(t,-15), contract:0, deliveryDate:'',
      memo:'', photo:null, col:'exhibit',
      regenTasks:{...mkTaskState(REGEN_TASKS), t_photo:true, t_webup:true},
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'c3', num:'CAR-2025-003', maker:'日産', model:'セレナ e-Power',
      year:'2021', color:'ブラック', size:'ミニバン', km:'45000', price:'2180000',
      purchaseDate:dateAddDays(t,-30), contract:1, deliveryDate:dateAddDays(t,7),
      memo:'', photo:null, col:'delivery',
      regenTasks:{
        t_equip:{e1:true,e2:true,e3:true,e4:true,e5:true},
        t_regen:{r1:true,r2:true,r3:true,r4:true},
        t_photo:true, t_webup:true,
        t_exhibit:{ex1:true,ex2:true,ex3:true,ex4:true}
      },
      deliveryTasks:{...mkTaskState(DELIVERY_TASKS), d_docs:true}, logs:[]
    },
    {
      id:'c4', num:'CAR-2025-004', maker:'スズキ', model:'ジムニー XC',
      year:'2020', color:'カーキ', size:'軽自動車', km:'32000', price:'1280000',
      purchaseDate:dateAddDays(t,-5), contract:0, deliveryDate:'',
      memo:'', photo:null, col:'purchase',
      regenTasks:mkTaskState(REGEN_TASKS),
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
    {
      id:'c5', num:'CAR-2025-005', maker:'マツダ', model:'CX-5 25S',
      year:'2022', color:'ソウルレッド', size:'SUV', km:'22000', price:'2480000',
      purchaseDate:dateAddDays(t,-18), contract:1, deliveryDate:dateAddDays(t,18),
      memo:'', photo:null, col:'exhibit',
      regenTasks:{
        t_equip:{e1:true,e2:true,e3:true,e4:false,e5:false},
        t_regen:{r1:true,r2:true,r3:false,r4:false},
        t_photo:false, t_webup:false,
        t_exhibit:{ex1:false,ex2:false,ex3:false,ex4:false}
      },
      deliveryTasks:mkTaskState(DELIVERY_TASKS), logs:[]
    },
  ];
}

// 車両データの実体
let cars = makeSampleCars();
