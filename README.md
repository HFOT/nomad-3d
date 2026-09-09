# CARAKURI — 灯りを運ぶ8体

コンセプト画像を参考に、形状・素材・装備・動作を新しく組み立てた3Dキャラクター8体です。
ブラウザ上でその場で組み立てて動かします。

**Created by CORN · Published by HFOT**

[公開ビューア](https://hfot.github.io/nomad-3d/)

| | キャラクター | 役割 | ページ |
| --- | --- | --- | --- |
| 01 | NOMAD 灯りを運ぶ旅人 | FIELD COMPANION | [/nomad/](https://hfot.github.io/nomad-3d/nomad/) |
| 02 | WARD リレーの番人 | RELAY GUARDIAN | [/ward/](https://hfot.github.io/nomad-3d/ward/) |
| 03 | QUORUM 委任の書記官 | MANDATE KEEPER | [/quorum/](https://hfot.github.io/nomad-3d/quorum/) |
| 04 | LEX 知識の灯守 | CONSTITUTION KEEPER | [/lex/](https://hfot.github.io/nomad-3d/lex/) |
| 05 | CATALYST 築く者 | PROJECT BUILDER | [/catalyst/](https://hfot.github.io/nomad-3d/catalyst/) |
| 06 | TREASURY 国庫の器 | TREASURY KEEPER | [/treasury/](https://hfot.github.io/nomad-3d/treasury/) |
| 07 | PIP 光の、はこび屋 | TRANSACTION COURIER | [/pip/](https://hfot.github.io/nomad-3d/pip/) |
| 08 | FORGE まとめて、刻む者 | BLOCK FORGER | [/forge/](https://hfot.github.io/nomad-3d/forge/) |

![NOMAD](nomad/NOMAD-portrait.png)

## ゲーム — PIP RUN

[/game/](https://hfot.github.io/nomad-3d/game/) — PIPを走らせて、路上の琥珀のtransactionをFORGEのゲートまで運びます。

- 左右キー（またはA/D、画面下のボタン）で噴射移動。
- SPACE / ↑ でジャンプ。木箱と横壁は跳び越せますが、リレー支柱は高すぎて越えられません。
- SHIFT / ↓ でダッシュ。ギアボックスが焼き切れると自動で止まり、冷めるまで使えません。
- 1スロット＝ゲート1つ。持ったまま通ればそのブロックに刻まれ、手ぶらなら空のブロックになります。
- ぶつかると荷を落とします。ギアは3つ。無くなると走行終了です。

PIPのモデルとアニメーションは `pip/model.js` をそのまま読み込んでいます。コースは `game/model.js`、
ルールと進行は `game/viewer.js` です。`node tests/pip-run.cjs`（ローカルサーバー起動中）でブラウザ上の
挙動を検証できます。

## ゲーム — PIP RUSH

[/rush/](https://hfot.github.io/nomad-3d/rush/) — 四方から寄ってくる滞留を、投げて捌く60秒。

- 動かすのは移動だけ。スマホは画面のどこでも指をずらす、PCはカーソルを追いかけます。
- 投げるのは自動。一番近い相手へ投げ続けます。
- アイテムは拾った瞬間に発動。ボタンもメニューもありません。多面投げ、ブロックバリア、
  巨大ブロック、レーザー、ギア加速、修復の6種。
- 寄ってくるものは4種類。岩、速い小型、二つに割れるもの、投擲4発を要する大型。
  時間が経つほど種類が増えます。
- ヒビ（HP）は3つ。60秒を走り切るとブロックが1つ刻まれ、力尽きると空のブロックになります。
  結果はブラウザにだけ残ります。

場は `rush/model.js`、ルールと進行は `rush/viewer.js`。検証は `node tests/pip-rush.cjs`。

## ゲーム — PIPレーサー

[/racer/](https://hfot.github.io/nomad-3d/racer/) — 噴射でドリフトしながら3周走ります。

- アクセルは自動。曲げるだけです。スマホは画面のどこでも指をずらす、PCはカーソルか矢印キー。
- 速度が乗った状態で切り続けると滑り出し、離すとミニターボ。ドリフトのボタンはありません。
- 道には**滞留**が居座っています。ぶつかると失速。バリアかブースト中なら弾いて通れます。
- アイテムは通り抜けた瞬間に発動。ギア加速、ブロックバリア、巨大ブロック、レーザーの4種。
- 相手は自分の前回の走り。ベストを更新するとゴーストが入れ替わります。記録はブラウザにだけ残ります。

コースは `racer/model.js` の中心線ひとつから、路面・ラップ判定・コース外判定・小物の配置が
すべて導かれます。走りは `racer/viewer.js`。検証は `node tests/pip-racer.cjs`。

## ローカルで開く

**START.bat をダブルクリック**してください。ブラウザで8体の一覧が開きます。
このPCにある Node.js を使用します。制作フォルダと `node_modules` を一緒に保管してください。
起動後は http://127.0.0.1:8846 からも開けます。ローカルでの閲覧時に外部通信は不要です。公開版はGitHub Pagesで配信します。

## 操作

- 一覧から選ぶ、または各ページ上部の切り替えバーで全キャラを行き来できます。
- ドラッグ：360°回転。ホイール／ピンチ：拡大。右ドラッグ：平行移動。
- 待機／歩く／手を振る／見回す：動作を滑らかに切り替えます。02〜08には各キャラ固有の動作が加わります。
- 動きの速さ、一時停止、自動回転を変更できます。
- 黄昏／スタジオ／夜の照明と、仕上げ／クレイ／ワイヤーの表面表示を切り替えられます。
- 原画・解説の表示、PNGでの写真保存に対応しています。
- 「モデルを保存」で、動作と埋め込みテクスチャを含むGLBをその場で書き出して保存できます。

## 3Dモデル

各キャラクターはページを開くたびに `model.js` から組み立てられます。GLBはサイトに置かず、
「モデルを保存」を押した時点で書き出します。背景の岩やビューアの文字は含めていません。

NOMADは599個のメッシュを使い、陶器の頭、光学レンズ、肩・肘・股・膝の機構、分節した指、マフラー、リュック、寝袋、水筒、ブーツ、ガラス入りランタンを立体化しています。
塗装・革・布の色と微細な凹凸は、埋め込みのカラーテクスチャ／法線マップとして保存されています。

| 動作名 | 長さ | 内容 |
| --- | --- | --- |
| Idle | 4秒 | 呼吸のような胴体の揺れ、首・布・ランタンの揺れ |
| Walk | 2秒 | その場歩行、股・膝・足首・腕の連動 |
| Wave | 4秒 | 左手の挨拶、肘と手首の動き |
| Look | 6秒 | 首を左右に振って周囲を確認 |

関節は硬いパーツを親子関係で動かす方式です。18の可動ノードを30fpsでキーフレーム化しています。人型スキンメッシュ／Humanoid共通骨格へのリターゲット用データではありません。
布とランタンの揺れはアニメーションで作っており、物理シミュレーションではありません。
炎の輪郭はGLBに含まれ、光量の細かな明滅と画面の光のにじみはビューア側の演出です。

BlenderなどGLB対応ソフトにインポートして編集できます。この制作環境にはBlender本体がなかったため、`.blend` ファイルの作成・Blender内での確認は行っていません。
原画の写真に近い傷・布の繊維を完全に復元したものではなく、原画を立体向けに再設計したモデルです。

## 制作ファイル

- `index.html` / `hub.css`：4体の一覧。
- `shared/series.js`：全キャラの名前・肩書・一覧カードの切り出し範囲。一覧と切り替えバーはここだけを見ています。
- `shared/switcher.js` / `switcher.css`：各ページ上部の切り替えバー。
- `<キャラ名>/model.js`：全形状、素材、テクスチャ生成、アニメーション。
- `<キャラ名>/ward.js`：そのキャラ固有の装備・演出（02〜06、08）。PIPは model.js に内蔵。
- `<キャラ名>/viewer.js`：照明、影、環境反射、陰影補助、カメラ、操作、GLB書き出し。
- `<キャラ名>/index.html` / `style.css`：日本語のビューア画面。
- `<キャラ名>/preview.png`：実際の3D表示。一覧のカードにも使っています。
- `<キャラ名>/verification.json`：ブラウザ操作・GLB再読み込みの検証記録（01〜04）。
- `<キャラ名>/gltf-validation.json`：Khronos glTF Validatorによる形式検証。エラー0、警告0、情報指摘0（01〜04）。

描画・ファイル書き出しには Three.js（MIT）を使用しています。全キャラで1つのコピーを共有します。
書き出し仕様：[Three.js GLTFExporter](https://threejs.org/docs/pages/GLTFExporter.html)。

## ビルドと公開

`npm ci` → `npm run check` → `npm run build` で `dist/` に静的配信ファイルを生成します。mainブランチへのpushでGitHub ActionsがGitHub Pagesへデプロイします。外部API、アカウント登録、アクセス解析は使用していません。
