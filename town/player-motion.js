// Small deterministic kinematic controller. World geometry is supplied by the
// viewer so jumping, stairs and sprint speed can be verified without WebGL.
export class PlayerMotion {
 constructor(position){this.grounded=true;this.vy=0;this.speed=0;this.jumping=false;this.safe={x:position.x,y:position.y,z:position.z};}
 jump(){if(this.grounded){this.vy=8.2;this.grounded=false;this.jumping=true;return true;}return false;}
 update(position,input,dt,world){
  const steps=Math.max(1,Math.ceil(dt/(1/60))),h=dt/steps;
  for(let i=0;i<steps;i++){
   const wanted=input.moving?(input.sprint?7.6:2.8):0;
   // Getting going bites, stopping coasts: acceleration that differs by
   // direction is what reads as mass rather than a cursor.
   this.speed+= (wanted-this.speed)*(1-Math.exp(-h*(wanted>this.speed?9:6)));
   const distance=this.speed*h;
   if(input.moving&&distance>0){
    const x=position.x+input.x*distance,z=position.z+input.z*distance;
    if(world.canMove(position,x,z,!this.grounded)){
     const floor=world.ground(x,z,position.y);
     if(!this.grounded||floor===null||floor-position.y<=.85){position.x=x;position.z=z;}
    }
   }
   const floor=world.ground(position.x,position.z,position.y);
   if(this.grounded){
    if(floor!==null&&position.y-floor<.45){position.y=floor;this.safe={x:position.x,y:position.y,z:position.z};}
    else{this.grounded=false;this.vy=0;}
   }
   if(!this.grounded){
    // Falling pulls harder than rising: the arc keeps its height but lands
    // instead of drifting down.
    this.vy-=(this.vy>0?30:52)*h;const nextY=position.y+this.vy*h;
    if(floor!==null&&this.vy<=0&&nextY<=floor&&floor<=position.y+.1){position.y=floor;this.vy=0;this.grounded=true;this.jumping=false;this.safe={x:position.x,y:position.y,z:position.z};}
    else position.y=nextY;
    if(position.y<-1.5){Object.assign(position,this.safe);this.vy=0;this.grounded=true;this.jumping=false;}
   }
  }
 }
}
