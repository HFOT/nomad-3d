# NOX (09) Character Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CARAKURIシリーズに9体目のキャラ NOX（Midnight/プライバシー担当、浮遊する仮面の影の旅人）を追加する。

**Architecture:** 既存キャラ（PIPが最も近い雛形）と同じ構成 — `nox/` フォルダに手続き型Three.jsモデル(`model.js`) + ビューア(`viewer.js`) + ページ(`index.html`/`style.css`)。`shared/series.js` に登録するとハブカードとスイッチャーに自動で乗る。テストは `node --check`（check.mjs方式）+ ブラウザでの目視検証。

**Tech Stack:** Three.js (importmap経由、`../node_modules/three/`)、素のES modules、`server.cjs`（開発サーバ）

## Global Constraints

- キャラシート（specより厳守）: id `nox` / no `09` / name `NOX` / role `PROOF BEARER` / eyebrow `PROVE IT. DON'T SHOW IT.` / title `夜をまとう、証し人。` / tagline `見せない。それでも、証せる。` / accent `#939bf0`
- 足を作らない。浮遊のみ。しぐさは `Idle`（その場で漂う）と `Drift`（フィールド巡回）
- 仮面は白磁・無表情、細い目のスリットのみ発光。提灯はシャッター付きで開かない
- 「見せずに、証す」= 提灯は閉じたまま、足元にシジルリングが浮かんで消える。status「証明完了 · n proofs」
- 外部アセット禁止（全ジオメトリを手続き生成）。concept.png は作らない
- push しない（明示指示があるまでローカル完結）
- wordmark 表記: `NOX` / `PROOF BEARER / 09 · BY CORN`

---

### Task 1: ページの骨組み（index.html + style.css）

**Files:**
- Create: `nox/index.html`（`pip/index.html` を雛形にNOX向けに書き換え）
- Create: `nox/style.css`（`pip/style.css` を雛形に夜インディゴのパレットへ）

**Interfaces:**
- Produces: `nox/index.html` が `viewer.js` を読み込み、パネルに以下のIDを持つ:
  `#capture` `#collapse` `#travel` `#speed` `#speed-value` `#prove` `#status` `#pause` `#rotate` `#reset` `#export`、しぐさボタンは `[data-motion="Idle"]` と `[data-motion="Drift"]`

- [ ] **Step 1: pip/index.html をコピーして nox/index.html を作成し、以下を書き換える**
  - `<title>NOX — Proof Bearer</title>`
  - wordmark: `NOX<span>PROOF BEARER / 09 · BY CORN</span>`
  - eyebrow: `PROVE IT. DON'T SHOW IT.` / h1: `夜をまとう、証し人。` / p: `見せない。それでも、証せる。`
  - panel-heading: `PROOF BEARER`
  - demo-label: `SIMULATION · 実際のproofとは未接続`
  - しぐさ: `待機`(Idle, active) / `漂う`(Drift)。Dashボタンと strafe ボタン行は削除
  - トグル文言: `フィールドを漂う`
  - 特別アクション: `<button id="prove">見せずに、証す ✶</button>`（`#deliver` の置き換え）
  - explanation: 白磁の仮面と宵闇のマントの説明文（キャラ紹介、2〜3文）
  - switcher: `data-character="nox"`
  - footer: `BY CORN · NOX`
- [ ] **Step 2: pip/style.css をコピーして nox/style.css を作成し、パレットを夜へ**
  - 背景系 `#151d1d`/`#1c211e` → 夜藍 `#12141f`/`#141726`
  - アクセント系（active/accent/slider色）→ `#939bf0` 系（activeボタン `#8a93e830`/border `#939bf055`、accent-color `#939bf0`、eyebrowドット `#939bf0`）
  - `#capture` ボタンも同系色に
- [ ] **Step 3: 構文確認とコミット**

```bash
cd /c/nomad-3d && git add nox && git commit -m "feat(nox): page scaffold"
```

### Task 2: モデル（nox/model.js — buildNox）

**Files:**
- Create: `nox/model.js`

**Interfaces:**
- Produces: `export function buildNox()` → `{root, rig, clips, tick(t, motion='Idle', proof=0)}`
  - `clips`: `AnimationClip` の `Idle`(4s) と `Drift`(3s)。PIP方式（poseをサンプリングしてキーフレーム化）
  - `tick(t, motion, proof)`: 提灯の灯りの明滅、マントの頂点アニメ、目スリットの明滅、proof>0 のとき内部発光を強める
  - `root.userData = {author:'CORN', concept:'Hovering masked proof bearer. Fictional simulation.'}`

- [ ] **Step 1: マテリアル定義**
  - 宵闇マント `night`: color `#232842` roughness .9
  - 白磁 `porcelain`: color `#e8e2d5` metalness .1 roughness .4
  - 真鍮 `brass`（提灯金具）: PIPと同系 `#a7864b` metalness .8
  - 目スリット/印 `glow`: emissive `#939bf0` emissiveIntensity 2.5
  - 提灯の灯 `amber`: emissive `#ffa324`（シリーズの灯り色を継承）
- [ ] **Step 2: 体を組む（足なし・浮遊体）**
  - マント: `LatheGeometry`（肩から裾へ広がり、裾は内側へ巻き込んで閉じる曲線）。裾は宙に溶ける = 下端を絞る
  - フード: マント上部に前傾した開口（Lathe or 変形Sphere）。開口の奥は暗色球で「闇」を作る
  - 仮面: 扁平化した球（能面プロポーション）を闇の中に少し沈めて配置。細い目スリット2本を `glow` の薄いboxで
  - 袖と手: 布の袖（Cone系）から白磁の小さな手。片手が提灯の吊り手を持つ
  - 提灯: 縦シリンダー+上下の真鍮蓋+縦シャッター板（6〜8枚、隙間わずか）。内部に amber の小球 + PointLight。スリットから光が漏れる
- [ ] **Step 3: クリップ生成（PIP方式のposeサンプリング）**
  - `Idle`: root浮遊は viewer 側でなく body group の y を ±0.03 でゆっくり上下、マント微揺れ、提灯がわずかに揺れる
  - `Drift`: 前傾 .15rad、マント後方へなびく角度、提灯が後ろへ流れる
- [ ] **Step 4: tick 実装**（灯りの明滅 `intensity = .8+.2*sin(t*3.7)`、目スリット明滅、proof引数で内部光ブースト）
- [ ] **Step 5: `node --check nox/model.js` 通過 → コミット**

```bash
cd /c/nomad-3d && node --check nox/model.js && git add nox/model.js && git commit -m "feat(nox): procedural model"
```

### Task 3: ビューア（nox/viewer.js）

**Files:**
- Create: `nox/viewer.js`（`pip/viewer.js` を雛形に）

**Interfaces:**
- Consumes: `buildNox()`（Task 2）、Task 1 のDOM ID群
- Produces: `window.nox = {figure, mixer, scene, camera, controls, setMotion, get state(){...}}`

- [ ] **Step 1: シーンを夜に** — 背景/霧 `#12141f`、HemisphereLight を月光寄り（上 `#aab4e8` / 下 `#141726`）、rim光を `#939bf0`、床 `#181b2a`
- [ ] **Step 2: モーション配線** — `setMotion('Idle'|'Drift')`、status文言 `{Idle:'静かに漂っています', Drift:'夜を渡っています'}`。`#travel` チェック時、Driftで緩やかな8の字経路を滑走（PIPのtravelロジック流用、速度は0.35倍でゆっくり）。root.position.y は常に浮遊高 0.55 を基準
- [ ] **Step 3: 証明の印** — `#prove` クリック:
  - 事前生成した sigilグループ（TorusGeometry のリング + 内側に小リング/刻み矢印状のboxを円周配置、材質 `glow` 系 emissive、transparent）を足元 y=0.02 に出現
  - 2.2秒かけて y +0.9 まで上昇しつつ opacity 1→0、回転。完了で非表示
  - 実行中は `tick` の proof 引数に 1 を渡し提灯内部光がわずかに強まる
  - status: `証明完了 · ${++count} proofs`
- [ ] **Step 4: 共通機能をNOX名義に** — capture保存名 `NOX.png`、export `NOX-animated.glb`、`window.nox` ハンドル、reduced-motion対応、リサイズ対応（PIPのまま）
- [ ] **Step 5: `node --check nox/viewer.js` → コミット**

```bash
cd /c/nomad-3d && node --check nox/viewer.js && git add nox/viewer.js && git commit -m "feat(nox): viewer with proof sigil"
```

### Task 4: シリーズ登録

**Files:**
- Modify: `shared/series.js`（末尾にnoxエントリ追加）
- Modify: `check.mjs`（キャラ配列に `'nox'`）
- Modify: `build.mjs`（characters配列に `'nox'`）

- [ ] **Step 1: series.js に追加**（cropは仮値、Task 6で調整）

```js
  {
    id: 'nox',
    crop: {x: 440, y: 200, w: 560, h: 747},
    no: '09',
    name: 'NOX',
    role: 'PROOF BEARER',
    eyebrow: 'PROVE IT. DON\'T SHOW IT.',
    title: '夜をまとう、証し人。',
    tagline: '見せない。それでも、証せる。',
    accent: '#939bf0',
  },
```

- [ ] **Step 2: check.mjs / build.mjs の配列に `'nox'` 追加**
- [ ] **Step 3: `npm install`（未実施なら）→ `node check.mjs` 全通過 → コミット**

```bash
cd /c/nomad-3d && node check.mjs && git add shared/series.js check.mjs build.mjs && git commit -m "feat(nox): register in series"
```

### Task 5: ブラウザ検証と造形イテレーション

**Files:**
- Modify: `nox/model.js` / `nox/viewer.js`（見た目調整）

- [ ] **Step 1: `node server.cjs` をプレビューブラウザで起動、`/nox/` を開く**
- [ ] **Step 2: コンソールエラーゼロを確認**
- [ ] **Step 3: スクリーンショットで造形確認・調整**（仮面が見えるか、マントのシルエット、提灯の漏れ光、浮遊の揺れ）— 納得いくまで反復
- [ ] **Step 4: 機能確認** — Idle/Drift切替、フィールド巡回、速さ、証明の印、写真、GLB保存、一時停止、自動回転、視点リセット、スイッチャー表示
- [ ] **Step 5: モバイル幅(375px)でパネル崩れがないか確認**
- [ ] **Step 6: コミット**

```bash
cd /c/nomad-3d && git add nox && git commit -m "polish(nox): visual iteration"
```

### Task 6: preview.png とハブカード

**Files:**
- Create: `nox/preview.png`（1600×1100）
- Modify: `shared/series.js`（crop実測調整）
- Create: `nox/README.md`

- [ ] **Step 1: ブラウザを1600×1100にリサイズし、Idleの良い瞬間をcaptureボタン相当（canvas.toBlob）で保存 → `nox/preview.png`**
- [ ] **Step 2: ハブ(`/`)でNOXカードの見え方を確認、cropを実測調整**（他キャラとサイズ感が揃うよう、3:4比率で）
- [ ] **Step 3: README.md**（キャラ紹介・操作・ファイル構成を既存READMEの粒度で）
- [ ] **Step 4: 最終確認 — ハブ→NOXページ遷移、`node check.mjs` → コミット**

```bash
cd /c/nomad-3d && node check.mjs && git add nox shared/series.js && git commit -m "feat(nox): preview and hub card"
```
