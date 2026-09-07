# HYDRA (10) Character Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CARAKURIシリーズに10体目のキャラ HYDRA（Cardano L2/Hydra担当、黒装甲+赤い回転炎ランタン×5+ライトキャノン）を追加する。

**Architecture:** 既存キャラ（PIPが立ち姿+Walkの雛形、NOXが特別アクション演出の雛形）と同じ構成 — `hydra/` フォルダに手続き型Three.jsモデル(`model.js`) + ビューア(`viewer.js`) + ページ(`index.html`/`style.css`)。`shared/series.js` に登録するとハブカードとスイッチャーに自動で乗る。テストは `node --check`（check.mjs方式）+ ブラウザでの目視検証。

**Tech Stack:** Three.js (importmap経由、`../node_modules/three/`)、素のES modules、`server.cjs`（開発サーバ）

## Global Constraints

- キャラシート（specより厳守）: id `hydra` / no `10` / name `HYDRA` / role `SETTLEMENT GUNNER` / eyebrow `FIVE FLAMES. ONE SHOT.` / title `五つの炎を、一発に。` / tagline `速さは、外で生まれる。` / accent `#e8384f`
- 体は漆黒装甲+白磁の頭。足あり。しぐさは `Idle`(4s) と `Walk`(2s)
- 背中に真鍮ハブ+5本アーム、先端に赤い炎が**常時高速回転**する特殊ランタン×5
- 片手に銃（ライトキャノン）。「L1へ、返す」= 炎加速→光の筋が銃へ収束→赤い光弾を発射→遠方で弾ける。status「決済完了 · n shots」
- 炎の回転・充填演出は `tick()` / viewer側（NOXのマント/シジルと同方式。クリップには焼かない）
- 外部アセット禁止（全ジオメトリを手続き生成）。concept.png は作らない
- push しない（明示指示があるまでローカル完結）
- wordmark 表記: `HYDRA` / `SETTLEMENT GUNNER / 10 · BY CORN`

---

### Task 1: ページの骨組み（index.html + style.css）+ ビルド登録

**Files:**
- Create: `hydra/index.html`（`nox/index.html` を雛形にHYDRA向けに書き換え）
- Create: `hydra/style.css`（`nox/style.css` を雛形に深紅パレットへ）
- Modify: `check.mjs`（キャラ配列に `'hydra'`）
- Modify: `build.mjs`（characters配列に `'hydra'`）

**Interfaces:**
- Produces: `hydra/index.html` が `viewer.js` を読み込み、パネルに以下のIDを持つ:
  `#capture` `#collapse` `#travel` `#speed` `#speed-value` `#fire` `#status` `#pause` `#rotate` `#reset` `#export`、しぐさボタンは `[data-motion="Idle"]` と `[data-motion="Walk"]`

- [ ] **Step 1: nox/index.html をコピーして hydra/index.html を作成し、以下を書き換える**
  - `<title>HYDRA — Settlement Gunner</title>`
  - wordmark: `HYDRA<span>SETTLEMENT GUNNER / 10 · BY CORN</span>`
  - eyebrow: `FIVE FLAMES. ONE SHOT.` / h1: `五つの炎を、一発に。` / p: `速さは、外で生まれる。`
  - panel-heading: `SETTLEMENT GUNNER`
  - demo-label: `SIMULATION · 実際のHydra Headとは未接続`
  - しぐさ: `待機`(Idle, active) / `歩く`(Walk)
  - トグル文言: `フィールドを歩く`（id `#travel`、checked）
  - 特別アクション: `<button id="fire">L1へ、返す ⚡</button>`（`#prove` の置き換え）
  - explanation: `漆黒の装甲に白磁の頭。背中の五本のアームには、赤い炎が高速で回り続ける特殊ランタン。五つの灯りから力を集め、光弾にして撃ち出します。撃った光は、メインチェーンへ還ります。`
  - status初期文言: `五つの炎が回っています`
  - switcher: `data-character="hydra"`
  - footer: `BY CORN · HYDRA`
- [ ] **Step 2: nox/style.css をコピーして hydra/style.css を作成し、パレットを深紅へ**
  - 全ての `#939bf0` → `#e8384f`（accent-color、eyebrowドット、focus outline、activeボタンborder等）
  - activeボタン背景 `#8a93e830` → `#e8384f30`、border `#939bf055` → `#e8384f55`
  - `#prove` セレクタ → `#fire` に改名、背景 `#2a2f55` → `#4a1d26`、border `#939bf04d` → `#e8384f4d`、hover `#343a68` → `#5c2530`、文字 `#d3d7ff` → `#ffd3d8`
  - 背景系 `#12141f`/`#141726`/`#181b2a`/`#13162a`/`#202541`/`#1b1f38` → 赤みの夜 `#16121a`/`#1a1418`/`#201a20`/`#1c141c`/`#2a1f28`/`#241a22`
  - 文字系 `#d9dcf5`/`#e4e6fb`/`#a3aae0`/`#a9b1f5`/`#aab0d6` 等の藍寄りは `#f0dfe2`/`#f5e2e6`/`#d89aa4`/`#f2a3ae`/`#cfa8b0` 系へ（読みやすさ優先で明度は維持）
- [ ] **Step 3: check.mjs と build.mjs の配列末尾に `'hydra'` を追加**
- [ ] **Step 4: `node check.mjs` 通過（hydraはmodel.js未作成なので existsSync でスキップされる）→ コミット**

```bash
cd /c/nomad-3d && node check.mjs && git add hydra check.mjs build.mjs && git commit -m "feat(hydra): page scaffold and build registration"
```

### Task 2: モデル（hydra/model.js — buildHydra）

**Files:**
- Create: `hydra/model.js`

**Interfaces:**
- Produces: `export function buildHydra()` → `{root, rig, clips, anchors, tick(t, motion='Idle', charge=0)}`
  - `clips`: `AnimationClip` の `Idle`(4s) と `Walk`(2s)。PIP方式（poseをサンプリングしてキーフレーム化）
  - `tick(t, motion, charge)`: 炎スピナーの回転（基本速度 + charge で最大4倍加速）、炎emissiveの明滅、チャンバー発光（charge比例）、残光リングの脈動
  - `anchors`: `{flames: Object3D[5], muzzle: Object3D, chamber: Object3D}` — viewerが光の筋・光弾のワールド座標取得に使う
  - `root.userData = {author:'CORN', concept:'Black-armored settlement gunner with five spinning-flame lanterns. Fictional simulation.'}`

- [ ] **Step 1: マテリアル定義**
  - 黒鉄装甲 `armor`: color `#15171c` metalness .55 roughness .5
  - 白磁 `porcelain`: color `#e8e2d5` metalness .1 roughness .4（シリーズ共通）
  - 真鍮 `brass`: color `#a7864b` metalness .8 roughness .3（シリーズ共通）
  - 暗部 `dark`: color `#0c0e13` metalness .6 roughness .4
  - 炎コア `flameMat`: color `#ffd7cc` emissive `#ff3b30` emissiveIntensity 2.5
  - 残光 `trailMat`: color `#ff8d80` emissive `#e8384f` emissiveIntensity 1.8, transparent, opacity .55, depthWrite false
  - ランタンガラス `glass`: MeshPhysicalMaterial color `#1a0d0f` roughness .1 transmission .85 thickness .04
  - チャンバー光 `chamberMat`: color `#ffe3df` emissive `#ff3b30` emissiveIntensity .3（chargeで最大4へ）
  - 目 `eyeMat`: emissive `#e8384f` emissiveIntensity 1.5
- [ ] **Step 2: 体を組む（立ち姿・足あり、PIPの体格を参考にやや細身）**
  - body group（rig.body、y .48）: RoundedBox の黒装甲胴体 + 胸に真鍮の縦シーム + 小さな赤い計器灯
  - head（rig.head）: 扁平白磁球（PIPのheadPoint方式の簡略版でよい）+ 目スリット2本（eyeMat の薄いbox）
  - 左arm（rig['arm-1']）: PIP式の分節アーム（link+ball関節）
  - 右arm（rig.arm1）: 前腕の先に銃を持つ（銃はarm1の子）
  - 銃: brass+darkのシリンダー構成 — グリップ(box)、機関部(box)、バレル(cyl 長め)、バレル先端にマズルリング(ring brass)、機関部上に**チャンバー**= glassの短cyl + 内部に chamberMat の小球。`anchors.muzzle` = バレル先端の空グループ、`anchors.chamber` = チャンバー中心の空グループ
  - legs ×2（rig['leg±1']）: PIP式（ball関節+box腿+boot）
- [ ] **Step 3: 背中のハブ + 5本アーム + 特殊ランタン×5**
  - 背中に brass の半埋めcyl ハブ。5本のアームを扇状に配置（左右2本ずつ+中央上1本、後方へ弧を描く。TubeGeometry or link連結、各アームは rig.boom0..4 のグループで根元から可動）
  - 各アーム先端に特殊ランタン: brass上下キャップ + glass円筒 + 内部に**炎スピナー**（flameSpinner group）:
    - コア: flameMat の小球
    - ブレード×3: ConeGeometry を横倒し・湾曲配置（scale.z で薄く）して回転で炎の渦に見せる
    - 残光リング: trailMat の TorusGeometry（水平、castShadow false）— 回転が速いほど opacity/scale が上がる
  - `anchors.flames` = 各flameSpinnerの親（ランタン中心）5つ
- [ ] **Step 4: クリップ生成（PIP方式のposeサンプリング）**
  - `Idle`(4s): 呼吸の上下 ±.008、頭の微揺れ、ブーム5本が位相差で ±.03rad 揺れる、銃腕は下げ気味
  - `Walk`(2s): その場歩行 — leg±1.rotation.x = ±.6*sin、腕振り（銃腕は控えめ .25、左腕 .5）、体の上下 .02*cos(2c)、ブームは慣性で後方へ .08rad + 揺れ
- [ ] **Step 5: tick 実装**
  - `spin += dt` は使わず `flameSpinner.rotation.y = t * (9 + charge*27)`（位相差 j*1.3）
  - flameMat.emissiveIntensity = `2.2 + .6*sin(t*15+j) + charge*2`
  - trailMat.opacity = `.45 + charge*.4`、残光リング scale = `1 + .12*sin(t*10) + charge*.35`
  - chamberMat.emissiveIntensity = `.3 + charge*3.7`、チャンバー小球 scale = `1 + charge*.8`
  - ランタン用 PointLight は置かない（emissive+bloomで見せる）。チャンバーに PointLight(色 `#ff5040`) 1灯のみ、intensity = `.1 + charge*1.2`
- [ ] **Step 6: `node --check hydra/model.js` 通過 → コミット**

```bash
cd /c/nomad-3d && node --check hydra/model.js && git add hydra/model.js && git commit -m "feat(hydra): procedural model — black armor, five spinning flames, light cannon"
```

### Task 3: ビューア（hydra/viewer.js）

**Files:**
- Create: `hydra/viewer.js`（`nox/viewer.js` を雛形に）

**Interfaces:**
- Consumes: `buildHydra()`（Task 2）、Task 1 のDOM ID群
- Produces: `window.hydra = {figure, mixer, scene, camera, controls, renderer, setMotion, step, get state(){return{frames,motion,count,paused}}}`（rendererはpreview撮影用に公開）

- [ ] **Step 1: シーンを赤い夜に** — 背景/霧 `#16121a`、HemisphereLight（上 `#e8b4b8` / 下 `#1a1214`）、key光は白 `#ffe9e4`、rim光 `#e8384f` intensity 1.8、床 `#1d171b`
- [ ] **Step 2: モーション配線** — `setMotion('Idle'|'Walk')`、status文言 `{Idle:'五つの炎が回っています', Walk:'歩いています'}`。`#travel` チェック時、Walkで8の字経路を歩行（NOXのtravelロジック流用、速度 .28）
- [ ] **Step 3: 「L1へ、返す」シーケンス** — `#fire` クリックで state machine `firing = {start:time}`:
  - **充填 (0〜1.6s)**: `charge = min(1, f/1.6)` を `figure.tick` に渡す。光の筋 = 事前生成した細cylinder×5（emissive `#ff5040`、transparent）を毎フレーム `anchors.flames[j]` と `anchors.chamber` のワールド座標間に張る（位置=中点、scale.y=距離、quaternion=setFromUnitVectors）。opacity は charge に比例
  - **発射 (1.6s時点)**: 光の筋を消し、光弾（emissiveの球 + 後方に伸びた楕円trail、事前生成）を `anchors.muzzle` のワールド座標から図の前方 `root` の -Z…実装は `muzzle.getWorldDirection` 方向へ 1.1s かけて距離6まで飛ばし、末端で burst（TorusGeometry リングを scale 1→3.5 / opacity 1→0 で0.5s）
  - **完了**: `firing=null`、charge を .12/frame で0へ戻し、status `決済完了 · ${++count} shots`
  - 実行中の再クリックは無視（NOXの `if(proving)return` と同型）
- [ ] **Step 4: 共通機能をHYDRA名義に** — capture保存名 `HYDRA.png`、export `HYDRA-animated.glb`、`window.hydra` ハンドル（renderer含む）、reduced-motion対応、リサイズ対応（NOXのまま）
- [ ] **Step 5: `node --check hydra/viewer.js` → コミット**

```bash
cd /c/nomad-3d && node --check hydra/viewer.js && git add hydra/viewer.js && git commit -m "feat(hydra): viewer with charge-and-fire settlement sequence"
```

### Task 4: シリーズ登録

**Files:**
- Modify: `shared/series.js`（末尾にhydraエントリ追加）

- [ ] **Step 1: series.js に追加**（cropは仮値、Task 6で調整）

```js
  {
    id: 'hydra',
    crop: {x: 430, y: 190, w: 560, h: 747},
    no: '10',
    name: 'HYDRA',
    role: 'SETTLEMENT GUNNER',
    eyebrow: 'FIVE FLAMES. ONE SHOT.',
    title: '五つの炎を、一発に。',
    tagline: '速さは、外で生まれる。',
    accent: '#e8384f',
  },
```

- [ ] **Step 2: `node check.mjs` 全通過 → コミット**

```bash
cd /c/nomad-3d && node check.mjs && git add shared/series.js && git commit -m "feat(hydra): register in series"
```

### Task 5: ブラウザ検証と造形イテレーション

**Files:**
- Modify: `hydra/model.js` / `hydra/viewer.js`（見た目調整）

- [ ] **Step 1: `npm install`（node_modules未取得なら）→ `node server.cjs` をプレビューブラウザで起動、`/hydra/` を開く**
- [ ] **Step 2: コンソールエラーゼロを確認**
- [ ] **Step 3: スクリーンショットで造形確認・調整** — 黒装甲に赤が映えるか、5本アームのシルエット、炎の回転が「回って見える」か（ブレード形状・残光の強さ）、銃の持ち姿 — 納得いくまで反復
- [ ] **Step 4: 機能確認** — Idle/Walk切替、フィールド歩行、速さ、「L1へ、返す」の充填→発射→burst→status更新、写真、GLB保存、一時停止、自動回転、視点リセット、スイッチャー表示
- [ ] **Step 5: モバイル幅(375px)でパネル崩れがないか確認**
- [ ] **Step 6: コミット**

```bash
cd /c/nomad-3d && git add hydra && git commit -m "polish(hydra): visual iteration"
```

### Task 6: preview.png とハブカード

**Files:**
- Create: `hydra/preview.png`（1600×1100）
- Modify: `shared/series.js`（crop実測調整）
- Create: `hydra/README.md`

- [ ] **Step 1: ビューアを1600×1100相当で表示し、Idleの良い瞬間を `window.hydra.renderer.domElement.toDataURL('image/png')` で取得 → base64デコードして `hydra/preview.png` に保存**
- [ ] **Step 2: ハブ(`/`)でHYDRAカードの見え方を確認、cropを実測調整**（他キャラとサイズ感が揃うよう、3:4比率で）
- [ ] **Step 3: README.md**（キャラ紹介・操作・ファイル構成を既存READMEの粒度で）
- [ ] **Step 4: 最終確認 — ハブ→HYDRAページ遷移、`node check.mjs` → コミット**

```bash
cd /c/nomad-3d && node check.mjs && git add hydra shared/series.js && git commit -m "feat(hydra): preview and hub card"
```
