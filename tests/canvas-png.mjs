// Minimal deterministic raster adapter for the authored procedural texture and
// GLTFExporter in Node. Real browsers use their native canvas implementation.
import {deflateSync} from 'node:zlib';
const crc=b=>{let c=0xffffffff;for(const v of b){c^=v;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;};
function chunk(type,data){const b=Buffer.concat([Buffer.from(type),data]),head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);tail.writeUInt32BE(crc(b));return Buffer.concat([head,b,tail]);}
class Raster {
 constructor(w=1,h=1){this.width=w;this.height=h;this.pixels=null;this.flip=false;}
 getContext(){return {createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h}),putImageData:im=>{this.pixels=new Uint8Array(im.data);},drawImage:source=>{this.pixels=new Uint8Array(source.pixels);},translate:()=>{},scale:(x,y)=>{this.flip=y===-1;}};}
 async convertToBlob(){const header=Buffer.alloc(13);header.writeUInt32BE(this.width,0);header.writeUInt32BE(this.height,4);header[8]=8;header[9]=6;const pixels=this.pixels||new Uint8Array(this.width*this.height*4),raw=Buffer.alloc((this.width*4+1)*this.height);for(let y=0;y<this.height;y++){const row=this.flip?this.height-1-y:y;raw.set(pixels.subarray(row*this.width*4,(row+1)*this.width*4),y*(this.width*4+1)+1);}return new Blob([Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))])],{type:'image/png'});}
}
globalThis.OffscreenCanvas=Raster;
globalThis.document={scripts:[],createElement:name=>{if(name!=='canvas')throw Error('Only procedural canvas is supported');return new Raster();}};
globalThis.ImageData=class {constructor(data,width,height){Object.assign(this,{data,width,height});}};
