# HYDRA — Settlement Gunner (10)

漆黒の装甲に白磁の頭。Hydra（Layer 2）を担う10体目。

背中の真鍮ハブから五本のアームが扇状に伸び、先端の特殊ランタンでは
赤い炎が高速で回り続ける。五つのランタン = 五つのHydra Head。
静止していても、炎だけは止まらない — 速さは、外で生まれる。

## 操作

- しぐさ: 待機 / 歩く（フィールド歩行トグルつき）
- L1へ、返す: 五つの炎が加速し、光の筋が銃のチャンバーへ収束。
  充填された光弾を撃ち出し、遠方で弾ける（= L1決済）。status「決済完了 · n shots」
- 写真を撮る / モデルを保存 (GLB) / 一時停止 / 自動回転

## ファイル

- `model.js` — 手続き型モデル。`buildHydra()` が root / rig / clips / anchors / tick を返す。
  anchors（flames×5 / chamber / muzzle）は viewer が光の筋・光弾の座標取得に使う
- `viewer.js` — シーン・パネル配線・充填→発射シーケンス。`window.hydra.step()` は手動1フレーム実行（デバッグ用）
- `index.html` / `style.css` — ページ。赤い夜のパレット（アクセント #e8384f）
- `preview.png` — ハブカード用 1600×1100 レンダー

炎の回転と発射演出は tick / viewer 側の実装のため、書き出したGLBには
Idle / Walk のキーフレームのみが含まれる。
