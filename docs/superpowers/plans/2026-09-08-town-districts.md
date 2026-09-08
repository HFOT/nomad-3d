# Town Districts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** /town/ の城郭内部を市街化 — 表通り商店街・裏街道と怪しい店・官庁街3棟・民家・鍛冶場・大灯台・キャラ縄張り動線。

**Architecture:** 建物生成器を `town/buildings.js` に集約(gate/materials.js の材質を注入して共有)。`viewer.js` が道路網と配置、`cast.js` が縄張り経路。全て手続き生成+merge.js結合。

**Tech Stack:** Three.js、素のES modules、既存 merge.js / gateMaterials

## Global Constraints

- 座標系: RING=70、南門(0,70)、中央広場(0,0)、官庁街は北、既存depot(26,-20)は東へ扱い替えなし
- 建材は `gateMaterials()` の stone/wood/brass/slate/dark/glass を共有。emissive窓灯は専用マテリアル
- 全建物 castShadow、キャラ以外は実影。生成後に merge.js の optimize で結合
- push しない

---

### Task 1: 道路網 + 大灯台(Phase 1)

**Files:** Create `town/buildings.js`(buildLighthouse)/ Modify `town/viewer.js`, `check.mjs`, `build.mjs`

- [ ] buildings.js 骨組み: `export function makeBuilders(M)` → 各生成器を返す(Mは gateMaterials() 結果)
- [ ] `buildLighthouse()`: 段付き石積み塔(下段r5→上段r2.6、高さ~26)、螺旋の帯、頂上火室(brass柱+glass)、大炎(gateのflame方式の拡大版)、回転ビーム用アンカー。戻り値 `{root, tick(t)}` — 炎ゆらぎ+ビーム回転(6シグナル色を10秒で一巡)
- [ ] viewer.js: 道路メッシュ群 — 表通り(幅7、z 12..64)、参道(幅6、z -64..-12)、裏街道(折れ線の細道 幅2.8、x≈-11、z 18..58、横路地2本)、環状路(r=40、幅4のRingGeometry)。すべて薄いBox/Ring y=.06、床より明るい石色+brickTex流用
- [ ] viewer.js: 大灯台を(0,0)に配置(中央広場の輪の中)、tick接続。街灯は表通り両側に再配置
- [ ] check.mjs/build.mjs に `'buildings.js'` 追加 → `node check.mjs` → ブラウザ確認 → コミット

### Task 2: 官庁街3棟(Phase 2)

**Files:** Modify `town/buildings.js`, `town/viewer.js`

- [ ] `buildHall(kind)`: 共通骨格(石の基壇+切妻/ドーム+窓灯)で3種:
  - `'assembly'` 議事堂: 幅14奥行10、正面列柱4本、中央ドーム、紫の窓灯
  - `'vault'` 金庫堂: 幅10、厚壁・小窓、正面に大きな真鍮金庫扉(円形)、シアン灯
  - `'archive'` 憲法堂: 幅11、大アーチ窓3、屋根に本の背表紙モチーフの張り出し、琥珀灯
- [ ] viewer.js: 参道の突き当り(0,-34)に議事堂、(-16,-26)金庫堂、(16,-26)憲法堂(全て南向き=正面が広場側)。optimize適用
- [ ] check → ブラウザ確認(3棟のシルエット差) → コミット

### Task 3: 商店街 + 怪しい店(Phase 3)

**Files:** Modify `town/buildings.js`, `town/viewer.js`

- [ ] `buildShop(seed,shady)`: 間口4-5の店 — 石基壇+木骨壁+庇(shady=falseは暖色吊りランタン+立て看板、shady=trueは色温度低い行灯・小窓・看板なし)
- [ ] `buildStall(seed)`: 屋台(天幕+台)
- [ ] viewer.js: 表通り両側に店6軒+屋台3、裏街道沿いに怪しい店3軒(青緑行灯)。裏街道の街灯は無し
- [ ] check → ブラウザ確認(表と裏の明暗差) → コミット

### Task 4: 民家 + 鍛冶場(Phase 4)

**Files:** Modify `town/buildings.js`, `town/viewer.js`

- [ ] `buildHouse(seed)`: 小さな切妻民家(3バリエーション: 平屋/2階/煙突付き)、窓の暖色灯
- [ ] `buildForgeWorks()`: 鍛冶場 — 開放屋根の作業場+石炉(赤い熾火の明滅)+太い煙突
- [ ] viewer.js: 民家クラスタ3箇所(南西(-28,28)付近5棟、南東(28,30)付近5棟、北東(30,-34)付近4棟、向きと間隔に乱数)、鍛冶場(-30,-30)
- [ ] check → ブラウザ確認 → コミット

### Task 5: 動線の縄張り化(Phase 5)

**Files:** Modify `town/cast.js`

- [ ] ROUTES差し替え: nomad=表通り往復(縦長楕円 cx0 cz38 rx4 rz22)、pip=配送所〜表通り大回り、quorum/treasury/lex=官庁街(小さめ楕円を各堂の前)、catalyst=南東民家、forge=鍛冶場周り
- [ ] WARD特別経路: 城壁天端(y=9.6、r=60.5の六角形パス)を歩く — walk()に `w.hexPath=true` 分岐を追加し、六角形周回+高さ固定
- [ ] check → ブラウザ確認(WARDが壁の上、他が縄張り) → コミット

### Task 6: 総合確認

- [ ] メッシュ数(目標<3500)・エラーゼロ・追従クリック・モバイル幅
- [ ] スクリーンショットをユーザーへ送付
