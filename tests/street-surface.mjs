import assert from 'node:assert/strict';
import * as T from 'three';
import {buildStreetSurface} from '../town/street-surface.js';
const mat=new T.MeshStandardMaterial();
const street=(ax,az,bx,bz,width)=>({a:new T.Vector3(ax,0,az),b:new T.Vector3(bx,0,bz),width});
for(const {roads,area} of [
 {roads:[street(-2,0,2,0,2),street(0,-2,0,2,2)],area:12},
 {roads:[street(-2,0,2,0,2),street(-2,0,2,0,2)],area:8},
 {roads:[street(-2,0,2,0,2),street(0,0,0,3,2)],area:12},
]){
 const model=buildStreetSurface(roads,mat,mat),p=model.children[0].geometry.attributes.position,n=model.children[0].geometry.attributes.normal;
 let actual=0;
 for(let i=0;i<p.count;i+=3){actual+=Math.abs((p.getX(i+1)-p.getX(i))*(p.getZ(i+2)-p.getZ(i))-(p.getZ(i+1)-p.getZ(i))*(p.getX(i+2)-p.getX(i)))/2;assert.ok(n.getY(i)>.99);}
 assert.ok(Math.abs(actual-area)<1e-5,`union area ${actual} expected ${area}`);
}
console.log('Street union: crossing, duplicate, T-junction area and normals passed');
