import * as T from 'three';
function surface(kind){
 const size=512,c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d'),im=ctx.createImageData(size,size);
 function hash(x,y){const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);}
 function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y);let u=x-ix,v=y-iy;u=u*u*(3-2*u);v=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),u),T.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),u),v);}
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let f=0;for(let k=0;k<5;k++)f+=noise(x/(90/2**k),y/(90/2**k))/(2**k);
  const pore=hash(x,y),edge=Math.min(x,y,511-x,511-y)/512;
  let v=kind==='wood'?110+65*noise(x*.12+noise(x*.015,y*.015)*5,y*.008)+20*Math.sin(x*.48+noise(x*.03,y*.018)*10):120+f*62+pore*18;
  if(kind==='metal')v=100+f*55+(pore>.992?65:0);
  const grime=(1-Math.min(1,edge*18))*.17;v*=1-grime;
  const i=(y*size+x)*4;im.data[i]=v;im.data[i+1]=v*(kind==='metal'?.94:.97);im.data[i+2]=v*.90;im.data[i+3]=255;
 }ctx.putImageData(im,0,0);const tex=new T.CanvasTexture(c);tex.anisotropy=8;tex.colorSpace=T.SRGBColorSpace;return tex;
}

export function materials(){const stoneMap=surface('stone'),woodMap=surface('wood'),metalMap=surface('metal');return {
stone:new T.MeshStandardMaterial({color:0xc5b79e,map:stoneMap,bumpMap:stoneMap,bumpScale:.065,roughness:.96}),
mortar:new T.MeshStandardMaterial({color:0x746c5e,roughness:1}),
wood:new T.MeshStandardMaterial({color:0x75563a,map:woodMap,bumpMap:woodMap,bumpScale:.035,roughness:.85}),
brass:new T.MeshStandardMaterial({color:0xb28b4b,map:metalMap,roughnessMap:metalMap,bumpMap:metalMap,bumpScale:.007,metalness:.78,roughness:.65}),
slate:new T.MeshStandardMaterial({color:0x354659,map:stoneMap,bumpMap:stoneMap,bumpScale:.023,roughness:.72,metalness:.18}),
dark:new T.MeshStandardMaterial({color:0x152129,roughness:.55,metalness:.5}),
flame:new T.MeshStandardMaterial({color:0xb2f1ff,emissive:0x36b9ff,emissiveIntensity:3}),
glass:new T.MeshPhysicalMaterial({color:0x92cce0,transparent:true,opacity:.13,roughness:.12,depthWrite:false}),
leaf:new T.MeshStandardMaterial({color:0x425939,roughness:1})};}
