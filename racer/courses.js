// The courses. A course is data: a plan shape, a height profile, where the
// furniture goes, and a palette. Nothing about how a machine drives lives here,
// so a new course is a new entry and nothing else.
//
// control : the plan, as [x,z]. The first point is the start line and the two
//           either side of it are laid almost in line with it, because a
//           start/finish crossed three times must not sit in a corner.
// height  : [t, y] keys, smoothed between. Keep the first tenth flat.
// pads    : [t, lateral] boost plates.
// crates  : [t] — a row of three item crates across the road.
// jams    : how many queues stand in the road; they are laid out deterministically.
// ramps   : [t] kickers, best placed where the course is already falling away.

export const COURSES=[
 {
  id:'chain',
  name:'CHAIN',
  note:'ブロックの鎖が囲む夜のサーキット',
  control:[
   [-10, -64],[ 24, -64],[ 56, -58],[ 78, -34],[ 82,  -2],
   [ 68,  26],[ 74,  54],[ 48,  76],[ 12,  82],[-22,  74],
   [-52,  80],[-76,  58],[-70,  26],[-82,  -8],[-64, -44],
   [-38, -62],
  ],
  height:[[0,0],[.10,0],[.20,3.4],[.30,3.4],[.355,3],[.45,-1.8],[.53,0],
          [.61,4.4],[.685,4.4],[.745,3.6],[.81,-.6],[.89,2],[.95,0],[1,0]],
  pads:[[.085,-2.4],[.235,2.6],[.42,0],[.60,-2.8],[.78,2.2],[.905,0]],
  crates:[.14,.335,.51,.685,.86],
  jams:16,
  ramps:[.352,.742],
  scenery:'chain',
  theme:{
   background:0x0f1618, fog:[55,155],
   road:['#252b32','#0e131a'], verge:['#141a1d','#080c0f'], bank:['#0d1215','#05080a'],
   kerb:['#b9b3a4','#a2543f'], rail:0x8d7443, lamp:0x48cbff,
   hemi:[0xa8c6d4,0x141a16,.85], key:[0xffe0b2,1.15],
  },
 },
 {
  id:'valley',
  name:'VALLEY',
  note:'谷を渡り、尾根を越える山と川のコース',
  control:[
   [-12, -70],[ 26, -70],[ 62, -62],[ 88, -34],[ 92,   4],
   [ 74,  34],[ 84,  64],[ 52,  86],[ 10,  92],[-28,  82],
   [-58,  90],[-86,  62],[-78,  22],[-92, -12],[-70, -48],
   [-40, -68],
  ],
  // A river runs along the bottom of the dip: the course drops to meet it and
  // climbs out the far side.
  height:[[0,0],[.09,0],[.19,9],[.27,11],[.335,9],[.42,-5.5],[.475,-6],[.55,1],
          [.63,12],[.70,12],[.76,9],[.83,-3],[.90,3],[.96,0],[1,0]],
  pads:[[.075,0],[.30,-2.6],[.44,2.4],[.585,0],[.755,-2.6],[.92,2.4]],
  crates:[.13,.315,.50,.665,.845],
  jams:13,
  ramps:[.345,.775],
  scenery:'valley',
  theme:{
   background:0x0b1218, fog:[60,190],
   road:['#2b3138','#10161c'], verge:['#1b2226','#0b1013'], bank:['#12181c','#070b0e'],
   kerb:['#c3bcab','#8e5a4a'], rail:0x7f8a94, lamp:0x9fd8ff,
   hemi:[0x9fc0d8,0x121a20,.95], key:[0xd8e6ff,1.25],
  },
 },
 {
  id:'grove',
  name:'GROVE',
  note:'木立の中を抜ける、起伏の穏やかな森のコース',
  control:[
   [-14, -56],[ 20, -56],[ 48, -50],[ 66, -28],[ 70,   2],
   [ 56,  26],[ 62,  50],[ 40,  68],[  8,  72],[-20,  64],
   [-46,  70],[-66,  50],[-60,  22],[-72,  -6],[-56, -38],
   [-36, -54],
  ],
  height:[[0,0],[.11,0],[.22,2.2],[.33,2.6],[.40,1.8],[.48,-1.2],[.56,.6],
          [.64,2.8],[.71,2.8],[.775,1.6],[.84,-.8],[.91,1.2],[.96,0],[1,0]],
  pads:[[.10,2.2],[.26,-2.4],[.45,0],[.62,2.6],[.80,-2.2]],
  crates:[.16,.35,.53,.71,.88],
  jams:18,
  ramps:[.395,.785],
  scenery:'grove',
  theme:{
   background:0x101a14, fog:[38,120],
   road:['#2a2f2c','#121614'], verge:['#18211a','#0b120d'], bank:['#111812','#070c08'],
   kerb:['#bdb9a6','#8a6a3e'], rail:0x7a6a3c, lamp:0xd8f0a8,
   hemi:[0xb8d4a8,0x14200f,1], key:[0xffeec4,1.05],
  },
 },
];

export const courseById=id=>COURSES.find(c=>c.id===id)||COURSES[0];
