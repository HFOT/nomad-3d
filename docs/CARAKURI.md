# CARAKURI — プロジェクト全体記録
## Updated: 2026-09-08 / Created by CORN · Published by HFOT

公開: https://hfot.github.io/nomad-3d/
リポジトリ: https://github.com/HFOT/nomad-3d (mainへのpushでGitHub Actions→Pages自動デプロイ)

---

## コンセプト

「難解」と言われるCardanoの構造を、ブラウザで動く3Dの世界として可視化する。
キャラクター(からくり)・建築物・町のすべてが手続き型Three.jsで組み上がり、
外部アセット・API・アカウント登録なしで動く。

標語は「灯りを運ぶ」。トレジャリーの大灯台から炎を分けてもらい、
自分の町へ持ち帰る — この寓話がそのまま資金フローの絵になる。

---

## 公開コンテンツ一覧

### キャラクター(SERIES 01–08)

| # | 名前 | 役割 | 担当領域 |
|---|---|---|---|
| 01 | NOMAD | FIELD COMPANION | 灯りを運ぶ旅人(ホルダー) |
| 02 | WARD | RELAY GUARDIAN | リレーの番人 |
| 03 | QUORUM | MANDATE KEEPER | 委任の書記官(DRep委任) |
| 04 | LEX | CONSTITUTION KEEPER | 憲法の灯守 |
| 05 | CATALYST | PROJECT BUILDER | Catalystで築く者 |
| 06 | TREASURY | TREASURY KEEPER | 国庫の器 |
| 07 | PIP | TRANSACTION COURIER | 光のはこび屋(tx) |
| 08 | FORGE | BLOCK FORGER | まとめて刻む者(ブロック生成) |

※ 09 NOX(Midnight)・10 HYDRA(L2)は制作後にCORNの判断で撤退。
git履歴(commit 28a20d7以前)に全実装が残っており、復活可能。

### ARCHITECTURE(建築物 01–04)

| # | ページ | 名前 |
|---|---|---|
| 01 | /depot/ | PIPの配送所(運河・クレーン稼働) |
| 02 | /gate/ | SPOの監視門(3基の監視灯) |
| 03 | /assembly/ | DRepの議事堂(半円議席・吊り天秤) |
| 04 | /vault/ | 炎の大金庫(シェーダー炎・歯車錠) |

### WORLD

- **/town/ からくりの町** — 六角形の城郭都市(RING=132)。
  - 6つの監視門 = リレー健全性6シグナル(北から時計回りに
    到達不足=赤 / IP共有=橙 / KES同期=黄 / Tip未同期=緑 /
    endpoint共有=シアン / 冗長性不足=紫。炎とライトを着色)
  - 門同士をレンガ城壁で接続、内部は全面レンガ床
  - 市街: 表通り商店街・裏街道の怪しい店・北の官庁街・民家・鍛冶場・中央の大灯台
  - **マスタープラン表示**: 実物ページがある建物は実体
    (門6・配送所・議事堂3.2倍・大金庫)、未制作は半透明ゴースト+
    浮遊名前ラベル(実物=炎色/仮=青白+「(仮)」)
  - **NOMAD操作モード**(自動開始): WASD/矢印で歩行、階段は登れる、
    建物・城壁は衝突、ゴーストは通り抜け可。Escで俯瞰へ
  - 住人: 8体が縄張り巡回(WARDは城壁の天端)、配送所からPIP便3体
- **/town/lab.html 構造ラボ** — 運営者の町の文法テスト(下記)

---

## 運営者の町 — 4軸の構造文法

町の主語は「プール」ではなく**運営者(複合キャラ)**。
一人がプール群・DRep票権・Catalyst受領という複数の顔を持ち、
その釣り合いの崩れを**構造**で表現する。

| 軸 | 建物 | 崩れた姿 |
|---|---|---|
| 権力(DRep) | 議事堂 | 灯台を見下ろす巨塔 |
| 防衛(プール) | 城壁と門 | 薄壁・欠け・門1つの多重長屋 |
| 資金の炎(Catalyst) | 持ち帰った炎の炉 | 資材の山だけの更地 |
| 灯台(トレジャリー) | 大陸中央に一本だけ | (各町には建たない=公金は共有物) |

構造語彙: 高さ序列の逆転 / 壁の完成度 / 門の数 / 囲いの門共有 /
建てかけの足場 / 資材の山 / 空き家。
ラボの4プロファイル: 健全な村 / 権力肥大都市 / 資材置き場の町 / 一門長屋。

公平性原則: 公開オンチェーン/公開自己申告データのみ・全運営者に同一生成規則・
町は評価コメントを持たない・名寄せは本人公表の紐付けに限定。

将来: relay-health自前収集データ(6軸スコア)で実運営者の町を生成 → 大陸ビュー。

---

## ファイル構成

```
C:\nomad-3d\                 ← 本線チェックアウト(この1つに全部入り)
├── index.html / hub.css     ハブ(ティーザー・上映・カード一覧)
├── shared/series.js         キャラ登録の単一ソース(ハブ&スイッチャー)
├── <キャラ名>/              model.js + viewer.js + ward.js + index.html
│                            + style.css + preview.png(1600×1100)
├── depot/ gate/ assembly/ vault/   建築物ページ(model+viewer+index)
├── town/                    町 — viewer.js(シーン・道路・衝突・NOMAD操作)
│   ├── cast.js              8体+PIP便のアダプタと縄張り経路
│   ├── buildings.js         大灯台・官庁3棟・商店・民家・鍛冶場の生成器
│   ├── merge.js             汎用結合最適化(下記)
│   └── lab.html / lab.js    運営者の町 構造ラボ
├── check.mjs                全モジュールのsyntaxチェック
├── build.mjs                dist/生成(three同梱・パス書き換え)
├── server.cjs               開発サーバ(PORT環境変数対応、既定8846)
└── docs/
    ├── CARAKURI.md          ← この文書
    └── superpowers/specs|plans/   各機能の設計書・実装プラン
```

**開発2拠点**: Codex側クローン
`C:\Users\CORN\Documents\Codex\2026-09-06\nan\outputs\lantern-robot`
(FORGE・建築物モデルの制作元、server.cjs常駐8846)。
push前に必ず `git fetch` して衝突(check.mjs/build.mjs/series.jsの配列)を
両取りマージすること。

---

## 技術メモ(ハマりどころ)

- **merge.js(結合最適化)**: モデルを数秒シミュレートして「動くノード」を
  行列比較で検出し、静的メッシュを関節×マテリアル毎に1つへ焼き込む。
  色だけ違うマテリアルcloneは頂点カラーに焼いて統合。
  22,499メッシュ → 約1,000ドローまで削減した実績。
  - 検知後に `updateMatrixWorld(true)` を忘れると全部「静的」誤判定になる
  - 炎など**頂点書き換え式アニメは行列に現れない** → skip引数で除外必須
  - colorを持たないShaderMaterialは結合不可(uuid単独バケット)
  - 同一モデルの複数体は1体目の `dynNames` を使い回してロード短縮
- **Codex製モデルのtickは頂点変形式**: 町側でtickを呼ばないと
  炎が「生の球」のまま表示される(議事堂の紫球事件)
- **実行時負荷**: 影マップは静的化(`shadowMap.autoUpdate=false`+焼き1回)、
  炎tickは距離+隔フレーム間引き、遠方キャラはlite更新
- **プレビューブラウザの罠**: rAFがほぼ止まる → `window.town.step()` を
  busy-waitループで手動駆動して検証する
- キャラのビルダーAPI: robot系は `createMaterials()`→`buildRobot(M)`
  (装備addWardはmodel.js内部で自動)、PIPは `buildMouse()`。
  歩行クリップは robot系=Walk、PIP=Run

---

## 運用ルール

- push はCORNの明示指示があった時のみ(ローカルmainにコミットで進める)
- 設計は `docs/superpowers/specs/`、実装プランは `plans/` に日付付きで残す
- 撤退した実装も履歴に残す(削除コミットにその旨を書く)

## ロードマップ

1. 町のゴースト建物を実物ページに順次置き換え(ARCHITECTURE 05〜:
   憲法堂・大灯台・商店街・民家・鍛冶場)
2. 構造ラボに relay-health 実データのプロファイルローダ
3. 名寄せ(本人公表のみ)による実在運営者の町生成
4. 複数の町が並ぶ大陸ビュー+世界の中枢(議事堂・金庫堂・憲法堂・配炎所)
