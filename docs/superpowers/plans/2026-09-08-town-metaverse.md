# CARAKURI TOWN Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** depot と gate を建てた夕暮れの町 `/town/` で、8体のキャラクターが周回路を歩き続けるメタバースページを作る。

**Architecture:** 既存の建物ページ(gate/depot)の単発ビューア流儀を踏襲しつつ、キャラ取込みを `town/cast.js`(アダプタ層)に分離。`town/viewer.js` がシーン・建物・歩行ループ・クリック追従を持つ。ハブに WORLD セクションを追加。

**Tech Stack:** Three.js (importmap `../node_modules/three/`)、素のES modules、server.cjs

## Global Constraints

- 夕暮れ: 低い暖色の太陽(西)、空/霧 茜〜藍、街灯・ランタン点灯
- 8体全員が歩く。robot系7体= `createMaterials()`→`buildRobot(M)`+`Walk`、pip= `buildMouse()`+`Run`
- 装備は model.js 内の addWard で自動。ward があれば `ward.tick(elapsed,dt,motion)`、rig.flame/rig.fire があれば炎フリッカー、pipは `tick(t,'Run',0)`
- 視点: OrbitControls 俯瞰 + キャラクリック追従。追従解除ボタンあり
- 性能: pixelRatio≤1.3 / 影は太陽1灯 map2048 / Bloom控えめ+OutputPass のみ
- push しない(明示指示があるまでローカル完結)

---

### Task 1: ページ骨組み + ビルド登録 + ハブWORLDセクション

**Files:**
- Create: `town/index.html`
- Modify: `check.mjs`(id配列に `'town'`、name配列に `'cast.js'`)
- Modify: `build.mjs`(characters配列に `'town'`、ファイルリストに `'cast.js'`)
- Modify: `index.html`(ハブ: WORLDセクションをARCHITECTUREの上に)
- Modify: `hub.css`(WORLDカードスタイル)

**Interfaces:**
- Produces: `town/index.html` のDOM ID: `#pause`(checkbox) `#unfollow`(button) `#front`(button)、キャプション `#follow-name`、`viewer.js` を module 読込み

- [ ] **Step 1: town/index.html** — gate/index.html を雛形に。title `CARAKURI — からくりの町`、header小見出し `CARAKURI / WORLD 01 · CORN`、h1 `からくりの町`、small `CARAKURI TOWN`。パネル: `SIMULATION · 町の営みは演出です` 注記、`一時停止` checkbox、`追従解除` button、`正面` button、説明文(クリックでキャラ追従の案内)。`#follow-name` は header 下の空要素
- [ ] **Step 2: check.mjs / build.mjs 登録**(townはviewer.js/cast.jsのみ、model.jsなし — check.mjsのname配列に `'cast.js'` を足し、build.mjsのコピー対象にも `'cast.js'`)
- [ ] **Step 3: ハブ index.html** — `<section class="intro">…WORLD…</section><nav id="worldnav"><a class="arch-link world-link" href="./town/">…</a></nav>` を ARCHITECTURE introの直前に。文言: eyebrow `WORLD`、h1 `からくりの、暮らす町。`、カード: `01 / からくりの町 / CARAKURI TOWN / 8体が暮らす、夕暮れの町。門をくぐり、配送所の灯りへ。`
- [ ] **Step 4: hub.css** — `.world-link{flex-basis:100%;max-width:856px}` を末尾に追加(arch-linkスタイルを流用)
- [ ] **Step 5: `node check.mjs` → コミット**

```bash
cd /c/nomad-3d && node check.mjs && git add town check.mjs build.mjs index.html hub.css && git commit -m "feat(town): page scaffold, build registration, hub WORLD section"
```

### Task 2: cast.js — 8体のアダプタと周回路

**Files:**
- Create: `town/cast.js`

**Interfaces:**
- Produces: `export async function loadCast(scene)` → `Promise<Walker[]>`
  - `Walker = {id, name, accent, root:Group, update(dt,elapsed):void}`
  - update() は mixer前進・固有演出・経路上の位置/向き更新まで全部やる

- [ ] **Step 1: 静的import** — 8モジュールを namespace import(`import * as Nomad from '../nomad/model.js'` …)。pipのみ `buildMouse`
- [ ] **Step 2: アダプタ生成**

```js
function robotWalker(mod,def){
 const M=mod.createMaterials(),r=mod.buildRobot(M);
 const mixer=new T.AnimationMixer(r.root);
 mixer.clipAction(r.clips.find(c=>c.name==='Walk')).play();
 return {...def,root:r.root,update(dt,elapsed){
  mixer.update(dt);
  if(r.rig.flame&&r.rig.fire){r.rig.flame.scale.set(1+.08*Math.sin(elapsed*19),1+.12*Math.sin(elapsed*13),1);r.rig.fire.intensity=2.5+.2*Math.sin(elapsed*17);}
  if(r.ward)r.ward.tick(elapsed,dt,'Walk');
  walk(this,dt);
 }};
}
```

pip版は `buildMouse()`+Run再生+`figure.tick(elapsed,'Run',0)`。
- [ ] **Step 3: 周回路** — 各キャラ `{center:[x,z], rx, rz, speed, phase, dir}` の楕円周回。`walk(w,dt)` が `w.u+=dt*w.speed` を進め、位置 `(cx+Math.sin(a)*rx, 0, cz+Math.cos(a)*rz)`、向き `rotation.y=Math.atan2(dx,dz)`(接線)。8体の経路は広場(原点)周り・道沿い・depot前・gate前に分散、半径3〜14で重なりを避ける
- [ ] **Step 4: `node --check town/cast.js` → コミット**

```bash
cd /c/nomad-3d && node --check town/cast.js && git add town/cast.js && git commit -m "feat(town): cast adapters and walk loops for all eight characters"
```

### Task 3: viewer.js — 町のシーンと追従カメラ

**Files:**
- Create: `town/viewer.js`

**Interfaces:**
- Consumes: `loadCast(scene)`(Task 2)、`buildGate()`(gate/model.js)、`buildDepot()`(depot/model.js)、Task 1 のDOM ID
- Produces: `window.town = {scene,camera,controls,walkers,follow,get state(){frames,following,drawCalls,triangles}}`

- [ ] **Step 1: 夕暮れシーン** — renderer(pixelRatio≤1.3, shadowMap PCFSoft, ACES)。背景 `#2b2030`、FogExp2 `#2b2030` .018。Hemisphere(空 `#e8a06a` / 地 `#2a2026`, .5)。太陽 DirectionalLight `#ffb36b` 2.0、position(-30,12,8)(西の低い位置)、castShadow、shadowカメラ ±35。青藍のrim(3,10,-20, `#5a6bd8`, .8)
- [ ] **Step 2: 地面と道** — 地面 Plane 120×120 `#3a3433` roughness1。石畳の道: 細長Box(4×.05×30)を gate(0,0,22)→広場(0,0,0) に、広場は Circle r7 `#4a423d`。運河: depotビューアと同じ法線Canvas+Water(20×60)を x=30 に。街灯×5: brassポール(cyl h2.6)+琥珀球(emissive)+PointLight(.35, 距離6)を道沿い x=±3 に交互
- [ ] **Step 3: 建物配置** — `buildGate()` root を (0,0,22) rotation.y=Math.PI(北向き=町側へ開口)、`buildDepot()` root を (14,0,-12) rotation.y=-Math.PI/4。両方 `tick` を毎フレーム呼ぶ(gate.tick(t,dt) / depot.tick(t))
- [ ] **Step 4: キャスト投入** — `const walkers=await loadCast(scene)`; 各 root を scene.add。ループで `w.update(dt,elapsed)`
- [ ] **Step 5: クリック追従** — pointerdown で Raycaster。`walkers` の root を対象(recursive)。ヒットしたら `following=w`、`#follow-name` に名前表示。毎フレーム `controls.target.lerp(w.root.position.clone().setY(1), .08)`。空ヒットで解除。`#unfollow` も解除。`#front` は初期カメラ(門越しに町を見渡す (0,9,38)/target(0,1.5,0))へ
- [ ] **Step 6: ポスト+ループ** — EffectComposer: RenderPass+UnrealBloom(.35,.4,1.1)+OutputPass。resize対応。reduced-motionで `#pause` 初期ON。`window.town` ハンドル
- [ ] **Step 7: `node check.mjs` → コミット**

```bash
cd /c/nomad-3d && node check.mjs && git add town/viewer.js && git commit -m "feat(town): dusk scene, buildings, canal, walking cast, click-to-follow camera"
```

### Task 4: ブラウザ検証と調整

**Files:**
- Modify: `town/viewer.js` / `town/cast.js`(配置・経路・光量の調整)

- [ ] **Step 1: プレビューで /town/ を開き、コンソールエラーゼロ確認**(rAF停止環境では `window.town` を busy-wait ループ+`step` 相当で駆動)
- [ ] **Step 2: スクリーンショットで確認** — 建物2棟が景観に収まる、8体が道・広場を歩く、経路が建物にめり込まない、夕暮れの色味
- [ ] **Step 3: drawCalls/triangles を確認**(`window.town.state`)。60fps相当が無理なら影解像度→1024、Bloom削除の順で削る
- [ ] **Step 4: クリック追従・解除・一時停止・正面・ハブからの遷移を確認**
- [ ] **Step 5: モバイル幅(375px)確認 → コミット**

```bash
cd /c/nomad-3d && git add town && git commit -m "polish(town): layout, paths and lighting tuned in browser"
```
