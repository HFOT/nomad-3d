import {mkdir,copyFile,cp,readFile,writeFile,access,rm} from 'node:fs/promises';
import path from 'node:path';
const root=import.meta.dirname;
const dist=path.join(root,'dist');
const characters=['nomad','ward','quorum','lex','catalyst'];
const exists=async p=>{try{await access(p);return true}catch{return false}};
// Every character page reaches three through ../node_modules in dev; in dist it is one shared copy.
const forDist=html=>html.replaceAll('../node_modules/three/','../vendor/three/');

await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
await copyFile(path.join(root,'hub.css'),path.join(dist,'hub.css'));
await copyFile(path.join(root,'index.html'),path.join(dist,'index.html'));
await cp(path.join(root,'shared'),path.join(dist,'shared'),{recursive:true});

for(const id of characters){
  const src=path.join(root,id),out=path.join(dist,id);
  await mkdir(out,{recursive:true});
  for(const file of ['viewer.js','model.js','ward.js','style.css','concept.png','preview.png']){
    if(await exists(path.join(src,file)))await copyFile(path.join(src,file),path.join(out,file));
  }
  await writeFile(path.join(out,'index.html'),forDist(await readFile(path.join(src,'index.html'),'utf8')));
}

await mkdir(path.join(dist,'vendor/three'),{recursive:true});
await cp(path.join(root,'node_modules/three/build'),path.join(dist,'vendor/three/build'),{recursive:true});
await cp(path.join(root,'node_modules/three/examples/jsm'),path.join(dist,'vendor/three/examples/jsm'),{recursive:true});
await copyFile(path.join(root,'node_modules/three/LICENSE'),path.join(dist,'vendor/three/LICENSE'));
await writeFile(path.join(dist,'.nojekyll'),'');
console.log('Built static CARAKURI viewer in dist/ ('+characters.join(', ')+')');
