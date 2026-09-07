# CARAKURI TOWN — からくりの町(メタバース空間) 設計書

Created: 2026-09-08
Series: CARAKURI (HFOT/nomad-3d)
Status: 設計承認済み

---

## コンセプト

配送所(depot)と監視門(gate)を1つの夕暮れの町に建て、
8体のキャラクター全員がそれぞれの周回路を歩き続ける「生きたジオラマ」。
ページを開くだけで町が動いている。視点は俯瞰オービット+キャラクリック追従。

## ページ

- URL: `/town/`(`town/` フォルダ新設。`world/` はアセット置き場なので使わない)
- タイトル: `CARAKURI — からくりの町` / 見出し「からくりの町」+ CARAKURI TOWN
- ハブ: ARCHITECTUREセクションの上に **WORLD** セクションを新設、横長リンクカード1枚
  (「からくりの町 — 8体が暮らす、夕暮れの町。」)

## 空間レイアウト(地面 約60×60、原点=広場中心)

- **監視門(gate)**: 南端 (0, 0, 22) に北向き配置。門から広場へ石畳の道(幅4)
- **配送所(depot)**: 北東 (14, 0, -12) に南西向き配置
- **運河**: 東側に帯状のWater(depotビューアの法線Canvas方式を流用)
- **街灯**: 道沿いに4〜6本(brassポール+琥珀ランタン、簡易な手続き生成)
- **雰囲気**: 夕暮れ — 低い暖色の太陽(西)、空/霧は茜〜藍のグラデーション、
  街灯とキャラのランタンが点き始めている

## キャスト(8体全員)

各キャラの `model.js` をそのまま import してビルド。装備(`addWard`)は
model.js 内部で自動付与されるため追加作業なし。

| 系統 | キャラ | ビルド | 歩行クリップ | 毎フレーム |
|---|---|---|---|---|
| robot系 | nomad, ward, quorum, lex, catalyst, treasury, forge | `createMaterials()` → `buildRobot(M)` | `Walk` | mixer.update + 炎フリッカー(rig.flame/rig.fire があれば) + `ward.tick(elapsed, dt, motion)`(ward があれば) |
| pip | pip | `buildMouse()` | `Run` | mixer.update + `figure.tick(t,'Run',0)` |

- 各キャラは自分の**閉じた周回路**(CatmullRomCurve3ループ)を歩く。
  半径・中心・速度・位相を全員変え、道と広場を通るルートを混在させる
- 進行方向に `rotation.y` を向ける(接線から算出)
- キャラのスケールは1.0のまま(建物との対比はレイアウトで調整、必要なら微調整)

## 視点・操作

- OrbitControls 俯瞰(既存ページと同じ操作感)。初期カメラは門越しに町を見渡す位置
- **クリック追従**: レイキャストでキャラを拾ったら、そのキャラの root を
  controls.target に毎フレーム lerp。キャプションに名前(accent色)表示
- 空クリック or「追従解除」ボタンで俯瞰へ戻る
- パネル: 一時停止 / 追従解除 / 視点リセット / SIMULATION注記

## ファイル構成

新規:
- `town/index.html` — gate/depot ページ流儀のインラインCSS+パネル
- `town/cast.js` — 8体のビルダー取込み・アダプタ(クリップ/tick差の吸収)・周回路定義
- `town/viewer.js` — シーン、建物・運河・街灯の配置、歩行ループ、クリック追従

変更:
- `check.mjs` — id配列に `'town'`、name配列に `'cast.js'`
- `build.mjs` — characters配列に `'town'`、コピー対象に `'cast.js'`
- `index.html`(ハブ) — WORLDセクション追加
- `hub.css` — WORLDカードのスタイル(arch-linkの流用+横長)

## 性能対策

- pixelRatio 上限 1.3
- 影: 太陽1灯のみ、shadow map 2048、フラスタムを町サイズに絞る
- ポストは Bloom(控えめ)+ OutputPass のみ。GTAOなし
- `window.town` に drawCalls/triangles を出すデバッグハンドル

## スコープ外

- マルチプレイヤー、音、キャラ同士の相互作用、一人称視点、昼夜サイクル
- GLB書き出し(個別ページにあるので不要)

## 検証

1. `node check.mjs` 通過
2. プレビューで /town/: コンソールエラーなし、8体が歩く、建物2棟+運河+街灯表示
3. クリック追従・解除、一時停止、視点リセット
4. ハブのWORLDカード → /town/ 遷移
5. drawCalls/triangles を確認し、重すぎる場合は影・ポストを削る
6. モバイル幅で崩れないこと

## 進め方の約束

- push は明示的な指示があるまで行わない
