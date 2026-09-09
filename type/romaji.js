// Kana to keystrokes, with every common spelling accepted at once. The matcher
// is a small set-of-states automaton: each key advances every reading that
// still fits, so shi/si, cha/tya, kko/xtuko and n/nn are all the same word.
const KANA={
 'あ':['a'],'い':['i'],'う':['u','wu'],'え':['e'],'お':['o'],
 'か':['ka','ca'],'き':['ki'],'く':['ku','cu','qu'],'け':['ke'],'こ':['ko','co'],
 'さ':['sa'],'し':['si','shi','ci'],'す':['su'],'せ':['se','ce'],'そ':['so'],
 'た':['ta'],'ち':['ti','chi'],'つ':['tu','tsu'],'て':['te'],'と':['to'],
 'な':['na'],'に':['ni'],'ぬ':['nu'],'ね':['ne'],'の':['no'],
 'は':['ha'],'ひ':['hi'],'ふ':['fu','hu'],'へ':['he'],'ほ':['ho'],
 'ま':['ma'],'み':['mi'],'む':['mu'],'め':['me'],'も':['mo'],
 'や':['ya'],'ゆ':['yu'],'よ':['yo'],
 'ら':['ra'],'り':['ri'],'る':['ru'],'れ':['re'],'ろ':['ro'],
 'わ':['wa'],'を':['wo'],
 'が':['ga'],'ぎ':['gi'],'ぐ':['gu'],'げ':['ge'],'ご':['go'],
 'ざ':['za'],'じ':['zi','ji'],'ず':['zu'],'ぜ':['ze'],'ぞ':['zo'],
 'だ':['da'],'ぢ':['di'],'づ':['du'],'で':['de'],'ど':['do'],
 'ば':['ba'],'び':['bi'],'ぶ':['bu'],'べ':['be'],'ぼ':['bo'],
 'ぱ':['pa'],'ぴ':['pi'],'ぷ':['pu'],'ぺ':['pe'],'ぽ':['po'],
};
const DIGRAPH={
 'きゃ':['kya'],'きゅ':['kyu'],'きょ':['kyo'],
 'しゃ':['sya','sha'],'しゅ':['syu','shu'],'しょ':['syo','sho'],
 'ちゃ':['tya','cha','cya'],'ちゅ':['tyu','chu','cyu'],'ちょ':['tyo','cho','cyo'],
 'にゃ':['nya'],'にゅ':['nyu'],'にょ':['nyo'],
 'ひゃ':['hya'],'ひゅ':['hyu'],'ひょ':['hyo'],
 'みゃ':['mya'],'みゅ':['myu'],'みょ':['myo'],
 'りゃ':['rya'],'りゅ':['ryu'],'りょ':['ryo'],
 'ぎゃ':['gya'],'ぎゅ':['gyu'],'ぎょ':['gyo'],
 'じゃ':['zya','ja','jya'],'じゅ':['zyu','ju','jyu'],'じょ':['zyo','jo','jyo'],
 'びゃ':['bya'],'びゅ':['byu'],'びょ':['byo'],
 'ぴゃ':['pya'],'ぴゅ':['pyu'],'ぴょ':['pyo'],
};
const altsOf=r=>DIGRAPH[r]||KANA[r]||[r];

// The word as typing units. っ is folded into what follows it (kko / xtuko /
// ltuko); ん offers the single n only where no reading of the next unit could
// mistake it for the start of something else.
function unitsOf(kana){
 const raw=[];
 for(let i=0;i<kana.length;i++){
  const c=kana[i],pair=kana[i+1]?c+kana[i+1]:null;
  if(c==='っ'||c==='ん'){raw.push(c);continue;}
  if(pair&&DIGRAPH[pair]){raw.push(pair);i++;continue;}
  raw.push(c);
 }
 const us=[];
 for(let j=0;j<raw.length;j++){
  const r=raw[j];
  if(r==='っ'&&raw[j+1]){
   const alts=[];
   for(const a of altsOf(raw[j+1])){
    if(!'aiueon'.includes(a[0]))alts.push(a[0]+a);
    alts.push('xtu'+a,'ltu'+a);
   }
   us.push({alts});j++;
   continue;
  }
  if(r==='ん'){
   const nxt=raw[j+1],alts=['nn'];
   const firsts=nxt?altsOf(nxt).map(a=>a[0]):null;
   if(!nxt||firsts.every(f=>!'aiueoyn'.includes(f)))alts.push('n');
   us.push({alts});
   continue;
  }
  us.push({alts:altsOf(r)});
 }
 return us;
}

export function makeMatcher(kana){
 const us=unitsOf(kana);
 let states=[{u:0,a:null,p:0}],typed='';
 function step(sts,ch){
  const out=[];
  for(const st of sts){
   if(st.u>=us.length)continue;
   if(st.a===null){
    for(const a of us[st.u].alts){
     if(a[0]!==ch)continue;
     out.push(a.length===1?{u:st.u+1,a:null,p:0}:{u:st.u,a,p:1});
    }
   }else if(st.a[st.p]===ch){
    out.push(st.p+1===st.a.length?{u:st.u+1,a:null,p:0}:{u:st.u,a:st.a,p:st.p+1});
   }
  }
  return out;
 }
 const shortest=alts=>{let s=alts[0];for(const a of alts)if(a.length<s.length)s=a;return s;};
 return {
  first(){const set=new Set();for(const a of us[0].alts)set.add(a[0]);return set;},
  tryChar(ch){
   const out=step(states,ch);
   if(!out.length)return false;
   states=out;typed+=ch;return true;
  },
  done(){return states.some(st=>st.u>=us.length);},
  // What has been typed, and the cheapest way to finish from here. This is
  // the line under the word, and it follows whichever spelling was chosen.
  guide(){
   let best=states[0];
   for(const st of states)if(st.u>best.u||(st.u===best.u&&st.p>best.p))best=st;
   let rest=best.a?best.a.slice(best.p):'';
   for(let j=best.u+(best.a?1:0);j<us.length;j++)rest+=shortest(us[j].alts);
   return {typed,rest};
  },
 };
}
export function minLen(kana){return makeMatcher(kana).guide().rest.length;}
