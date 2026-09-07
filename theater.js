import { SERIES } from './shared/series.js';

// The teaser's screening room. The score is GRANDXP (theme.mp3, by CORN),
// routed through WebAudio so the film can colour it: in the dark act the
// sound sinks behind a lowpass, and it opens again when the holders move.
export class Score{
 constructor(){this.audio=null;this.ctx=null;this.playing=false;}
 start(){
  if(this.audio){this.resume();return;}
  const audio=this.audio=new Audio('theme.mp3?v=1');
  audio.loop=true;audio.crossOrigin='anonymous';
  const ctx=this.ctx=new (window.AudioContext||window.webkitAudioContext)();
  const src=ctx.createMediaElementSource(audio);
  this.filter=ctx.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=18000;this.filter.Q.value=.4;
  this.master=ctx.createGain();this.master.gain.value=0;
  src.connect(this.filter);this.filter.connect(this.master);this.master.connect(ctx.destination);
  audio.play();
  this.master.gain.linearRampToValueAtTime(.85,ctx.currentTime+2.5);
  this.playing=true;
 }
 // 0 birth: open and warm / 1 slip: sunken and muffled / 2 answer: open again, a little louder
 setMood(mood){
  if(!this.ctx||mood===this._mood)return;this._mood=mood;
  const t=this.ctx.currentTime,T=3.5;
  const filter=[18000,650,18000][mood],gain=[.85,.62,.95][mood];
  this.filter.frequency.exponentialRampToValueAtTime(filter,t+T);
  this.master.gain.linearRampToValueAtTime(gain,t+T);
 }
 resume(){if(this.ctx){this.ctx.resume();this.audio.play();this.playing=true;this.master.gain.linearRampToValueAtTime(.85,this.ctx.currentTime+1.2);}}
 hush(){if(this.ctx){this.playing=false;this.master.gain.linearRampToValueAtTime(0,this.ctx.currentTime+1);setTimeout(()=>{if(!this.playing)this.audio.pause()},1100);}}
 get running(){return this.playing;}
}

const IMG={w:1600,h:1100};
const framed=c=>{const zoom=c.zoom??1,w=c.crop.w/zoom,h=c.crop.h/zoom;return {w,h,x:c.crop.x+(c.crop.w-w)/2,y:c.crop.y+(c.crop.h-h)/2}};
const byId=id=>SERIES.find(c=>c.id===id);

// The film: full-screen letterboxed shots. Text cards from the story section
// are intercut with character shots that drift like camera moves. The cold
// grade and the sunken score arrive together in act two.
// NOTE: the storyboard indexes #story .s-line by position — if story lines
// are added or reordered, adjust the interleave below.
export function cinema(score,onDone){
 const lines=[...document.querySelectorAll('#story .s-line')];
 const text=i=>({type:'text',el:lines[i]});
 const img=(id,grade,cap)=>({type:'img',c:byId(id),grade,cap});
 const shots=[
  {type:'title'},
  text(0),text(1),
  img('nomad','warm'),img('ward','warm'),img('quorum','warm'),
  text(2),
  img('lex','warm'),
  text(3),
  text(4),
  img('quorum','cold swell'),
  text(5),text(6),
  img('ward','cold flicker'),
  text(7),text(8),
  img('treasury','cold'),img('catalyst','cold'),
  text(9),
  text(10),
  img('nomad','warm rise'),
  text(11),
 ].filter(s=>s.type!=='text'||s.el);
 // Build the screen.
 const room=document.createElement('div');room.id='cinema';
 room.innerHTML='<div class="c-bar c-top"></div><div class="c-bar c-bottom"></div><div class="c-skip">クリックでスキップ</div>';
 document.body.append(room);
 requestAnimationFrame(()=>room.classList.add('on'));
 let cancelled=false,timer=null,current=null;
 function moodOf(shot){
  if(shot.type==='text'&&shot.el){if(shot.el.classList.contains('s-hope'))return 2;if(shot.el.classList.contains('s-dark'))return 1;return 0;}
  if(shot.type==='img')return shot.grade.includes('cold')?1:(shot.grade.includes('rise')?2:0);
  return 0;
 }
 function render(shot){
  const layer=document.createElement('div');layer.className='c-shot';
  if(shot.type==='title'){
   layer.innerHTML='<div class="c-text c-title">CARAKURI<span>STORY</span></div>';
  }else if(shot.type==='text'){
   const tone=shot.el.classList.contains('s-dark')?' c-cold':(shot.el.classList.contains('s-hope')?' c-hope':'');
   layer.innerHTML=`<div class="c-text${tone}">${shot.el.innerHTML}</div>`;
  }else{
   const f=framed(shot.c);
   const grades=shot.grade.split(' ').map(g=>'g-'+g).join(' ');
   layer.innerHTML=`<figure class="c-frame ${grades}"><div class="c-crop"><img src="./${shot.c.id}/preview.png" alt="" style="width:${(IMG.w/f.w*100).toFixed(2)}%;left:${(-f.x/f.w*100).toFixed(2)}%;top:${(-f.y/f.h*100).toFixed(2)}%"></div><figcaption><b>${shot.c.no}</b> ${shot.c.name}</figcaption></figure>`;
  }
  room.append(layer);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   layer.classList.add('show');
   if(current){const old=current;old.classList.remove('show');setTimeout(()=>old.remove(),1400);}
   current=layer;
  }));
 }
 const finish=skipped=>{
  if(cancelled)return;cancelled=true;clearTimeout(timer);
  room.removeEventListener('click',onSkip);removeEventListener('keydown',onKey);
  score.setMood(2);
  document.getElementById('gallery').scrollIntoView({behavior:'auto'});
  room.classList.remove('on');
  setTimeout(()=>room.remove(),1100);
  onDone&&onDone(skipped);
 };
 const onSkip=()=>finish(true);
 const onKey=e=>{if(e.key==='Escape'||e.key===' ')finish(true)};
 room.addEventListener('click',onSkip);
 addEventListener('keydown',onKey);
 let i=0;
 const step=()=>{
  if(cancelled)return;
  if(i>=shots.length){finish(false);return;}
  const shot=shots[i++];
  score.setMood(moodOf(shot));
  render(shot);
  const hold=shot.type==='title'?3000:shot.type==='img'?3000:2400+shot.el.textContent.length*52;
  timer=setTimeout(step,hold);
 };
 step();
 return ()=>finish(true);
}
