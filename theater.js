// The teaser's screening room. The score is GRANDXP (theme.mp3, by CORN),
// routed through WebAudio so the story can colour it: in the dark act the
// sound sinks behind a lowpass, and it opens up again when the holders move.
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

// The screening: scroll the story past the lens line by line, letting each
// breathe, while the score changes acts underneath.
export function screen(score,onDone){
 const lines=[...document.querySelectorAll('#story .s-eyebrow,#story .s-line')];
 const gallery=document.getElementById('gallery');
 let cancelled=false,timer=null;
 const stopListening=()=>{removeEventListener('wheel',cancel);removeEventListener('touchmove',cancel);removeEventListener('keydown',cancel);};
 const cancel=()=>{cancelled=true;clearTimeout(timer);stopListening();onDone&&onDone(true);};
 addEventListener('wheel',cancel,{passive:true});
 addEventListener('touchmove',cancel,{passive:true});
 addEventListener('keydown',cancel);
 let i=0;
 const step=()=>{
  if(cancelled)return;
  if(i>=lines.length){
   score.setMood(2);
   gallery.scrollIntoView({behavior:'smooth'});
   stopListening();
   onDone&&onDone(false);
   return;
  }
  const el=lines[i++];
  el.scrollIntoView({behavior:'smooth',block:'center'});
  if(el.classList.contains('s-hope'))score.setMood(2);
  else if(el.classList.contains('s-dark'))score.setMood(1);
  const wait=el.classList.contains('s-eyebrow')?2200:2600+(el.textContent.length*55);
  timer=setTimeout(step,wait);
 };
 step();
 return cancel;
}
