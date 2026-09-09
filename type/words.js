// The vocabulary the yard throws at you: the series' own world in its own
// language. d is what the word shows; k is what the fingers actually type,
// read through romaji.js so every common spelling counts.
// Long-vowel bars are avoided on purpose: ー would ask for a key that phones
// and layouts disagree about.
export const WORDS_JP=[
 // things
 {d:'炉',k:'ろ'},{d:'火',k:'ひ'},{d:'門',k:'もん'},{d:'街',k:'まち'},{d:'荷',k:'に'},
 {d:'知恵',k:'ちえ'},{d:'鍛冶',k:'かじ'},{d:'票',k:'ひょう'},{d:'灯り',k:'あかり'},
 {d:'炎',k:'ほのお'},{d:'琥珀',k:'こはく'},{d:'歯車',k:'はぐるま'},{d:'荷物',k:'にもつ'},
 {d:'鎖',k:'くさり'},{d:'大金庫',k:'だいきんこ'},
 // deeds
 {d:'刻む',k:'きざむ'},{d:'運ぶ',k:'はこぶ'},{d:'配達',k:'はいたつ'},{d:'監視',k:'かんし'},
 {d:'中継',k:'ちゅうけい'},{d:'承認',k:'しょうにん'},{d:'提出',k:'ていしゅつ'},
 // the ledger's world
 {d:'国庫',k:'こっこ'},{d:'委任',k:'いにん'},{d:'投票',k:'とうひょう'},{d:'提案',k:'ていあん'},
 {d:'分岐',k:'ぶんき'},{d:'世代',k:'せだい'},{d:'台帳',k:'だいちょう'},{d:'報酬',k:'ほうしゅう'},
 {d:'署名',k:'しょめい'},{d:'憲法',k:'けんぽう'},{d:'分散',k:'ぶんさん'},{d:'自律',k:'じりつ'},
 {d:'最長',k:'さいちょう'},{d:'創発',k:'そうはつ'},{d:'委員会',k:'いいんかい'},
 {d:'委任状',k:'いにんじょう'},{d:'手数料',k:'てすうりょう'},{d:'評議会',k:'ひょうぎかい'},
 {d:'合意形成',k:'ごういけいせい'},{d:'ブロック',k:'ぶろっく'},
 {d:'ウロボロス',k:'うろぼろす'},{d:'ガバナンス',k:'がばなんす'},{d:'カタリスト',k:'かたりすと'},
 {d:'トランザクション',k:'とらんざくしょん'},{d:'分散自律',k:'ぶんさんじりつ'},
];
export const WORDS_EN=[
 'ada','utxo','slot','block','stake','pool','mint','hash','node','vote','fee','key','coin','peer',
 'fork','epoch','chain','relay','forge','drep','pip','anchor','wallet','ledger','plutus','oracle',
 'script','reward','address','staking','mainnet','deposit','quorum','mempool','cardano','genesis',
 'preview','builder','courier','ouroboros','delegation','governance','transaction','validator',
 'catalyst','treasury','consensus','blockchain','signature','committee','mithril','stakepool',
].map(w=>({d:w,k:w}));
// Which shelf each arrival reads from: the quick ones carry little to type,
// the heavy ones carry a lot. Shelving happens in the viewer, by how many
// keystrokes the shortest spelling needs.
export const BAND={rock:'short',dart:'short',split:'mid',hulk:'long'};
