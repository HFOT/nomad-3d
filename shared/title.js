// The title screen the games share. A game keeps its own overlay card —
// #o-title, #o-lead, #o-score, .rules, #start — and its own start and finish;
// this only rearranges what is already there into the shape a phone game
// opens with: the live scene as the picture, the logo up top, the record and
// a '?' for the rules, and whatever there is to pick plus a big START at the
// bottom, under the thumb. After a run the game's card comes back as the
// result, with a way home.
//
//   mountTitle({logo:['PIP','RUN'], tag:'...', hint:{pc:'...', touch:'...'}, best:()=>'123'})
//
// The game's #start keeps its onclick; the big button forwards to it. The
// overlay's own hidden attribute is watched: the first time it shows, that is
// the title; every time after a run, that is the result.
export function mountTitle(opt){
 const $=s=>document.querySelector(s);
 const ov=$('#overlay'),card=ov.querySelector('.card'),startBtn=$('#start'),hud=$('#hud'),loading=$('#loading');
 if(!ov||!card||!startBtn)return null;

 // --- the title face ---
 const title=document.createElement('section');title.className='title';
 title.innerHTML=
  '<div class="top">'+
   '<div class="eyebrow"><i></i> '+(opt.eyebrow||(card.querySelector('.eyebrow')?.textContent.trim())||'')+'</div>'+
   '<h1 class="logo">'+opt.logo[0]+'<span>'+opt.logo[1]+'</span></h1>'+
   '<p class="tag">'+(opt.tag||'')+'</p>'+
   '<div class="chips">'+(opt.best?'<span class="chip"><label>'+(opt.bestLabel||'これまでの最高')+'</label><b id="t-best">—</b></span>':'')+
   '<button class="chip btn" id="howto" type="button"><label>遊び方</label><b>?</b></button></div>'+
  '</div>'+
  '<div class="bottom">'+
   '<div class="picks"></div>'+
   '<div class="startslot"></div>'+
   '<p class="hint"><span class="pc">'+(opt.hint?.pc||'ENTER でも開始')+'</span><span class="touch">'+(opt.hint?.touch||'')+'</span></p>'+
  '</div>';
 ov.insertBefore(title,card);
 card.classList.add('result');
 // Whatever the card offered to pick from - courses, figures - is picked here.
 const picks=title.querySelector('.picks');
 card.querySelectorAll('.pick').forEach(p=>picks.appendChild(p));
 if(!picks.children.length)picks.remove();

 // --- the rules, on a sheet ---
 const rules=card.querySelector('.rules');
 const sheet=document.createElement('div');sheet.id='rules';sheet.hidden=true;
 sheet.innerHTML='<div class="sheet"><div class="sheethead"><b>遊び方</b><button id="closerules" type="button" aria-label="閉じる">×</button></div></div>';
 if(rules)sheet.firstChild.appendChild(rules);
 document.body.appendChild(sheet);
 const openRules=()=>{sheet.hidden=false;},closeRules=()=>{sheet.hidden=true;};
 title.querySelector('#howto').onclick=openRules;
 sheet.querySelector('#closerules').onclick=closeRules;
 sheet.addEventListener('click',e=>{if(e.target===sheet)closeRules();});
 addEventListener('keydown',e=>{if(e.key==='Escape')closeRules();});

 // --- the result face gets a way back ---
 const home=document.createElement('button');home.id='tohome';home.type='button';home.textContent='タイトルへ';
 card.appendChild(home);
 const hint=card.querySelector('.hint');if(hint)card.appendChild(hint);

 // --- faces ---
 let ran=false;
 const slot=title.querySelector('.startslot');
 const face=which=>{
  ov.classList.toggle('land',which==='title');
  title.hidden=which!=='title';
  card.hidden=which!=='result';
  if(hud)hud.hidden=which==='title';
  // The game's own START button is the one big button, on whichever face is
  // up: it keeps the game's onclick, and a test that presses #start finds it.
  if(which==='title'){slot.appendChild(startBtn);if(!startBtn.disabled)startBtn.textContent='START';}
  else{card.insertBefore(startBtn,home);}
  if(which==='title'&&opt.best){const b=opt.best();title.querySelector('#t-best').textContent=b||'—';}
 };
 home.onclick=()=>face('title');
 startBtn.addEventListener('click',()=>{ran=true;});
 // When the overlay goes, a run is on and the HUD is the game's again.
 new MutationObserver(()=>{if(ov.hidden){if(hud)hud.hidden=false;}else face(ran?'result':'title');}).observe(ov,{attributes:true,attributeFilter:['hidden']});
 // The games start on Enter themselves; here it only counts as a run.
 addEventListener('keydown',e=>{if(e.key==='Enter'||e.key.toLowerCase()==='r')ran=true;});

 // --- ready: the game's loader fading is the signal ---
 ov.classList.add('land','building');
 face('title');
 startBtn.disabled=true;startBtn.textContent='準備中…';
 const ready=()=>{startBtn.disabled=false;if(!ran)startBtn.textContent='START';ov.classList.remove('building');};
 if(loading){
  loading.hidden=true; // the title stands in for it
  if(loading.classList.contains('done'))ready();
  else new MutationObserver(()=>{if(loading.classList.contains('done'))ready();}).observe(loading,{attributes:true,attributeFilter:['class']});
 }else ready();
 return {face,ready};
}
