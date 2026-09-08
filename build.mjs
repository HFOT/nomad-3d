import {mkdir,copyFile,cp,readFile,writeFile,access,rm} from 'node:fs/promises';
import path from 'node:path';
const root=import.meta.dirname;
const dist=path.join(root,'dist');
const characters=['nomad','ward','quorum','lex','catalyst','treasury','pip','forge','depot','gate','town'];
const exists=async p=>{try{await access(p);return true}catch{return false}};
// Every character page reaches three through ../node_modules in dev; in dist it is one shared copy.
const forDist=html=>html.replaceAll('../node_modules/three/','../vendor/three/');

await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
for(const file of ['hub.css','theater.js','theme.mp3','courier.js'])await copyFile(path.join(root,file),path.join(dist,file));
// The hub reaches three through ./node_modules in dev, the character pages
// through ../node_modules; in dist both point at the one shared copy.
await writeFile(path.join(dist,'index.html'),(await readFile(path.join(root,'index.html'),'utf8')).replaceAll('./node_modules/three/','./vendor/three/'));
await cp(path.join(root,'shared'),path.join(dist,'shared'),{recursive:true});
if(await exists(path.join(root,'clips')))await cp(path.join(root,'clips'),path.join(dist,'clips'),{recursive:true});

const built=[];
for(const id of characters){
  const src=path.join(root,id),out=path.join(dist,id);
  // A listed character that is not in this checkout (work in progress on
  // another machine) is skipped instead of failing the whole build.
  if(!await exists(path.join(src,'index.html'))){console.warn('skipping '+id+': no source in this checkout');continue;}
  built.push(id);
  await mkdir(out,{recursive:true});
  for(const file of ['viewer.js','materials.js','buildings.js','cast.js','merge.js','model.js','ward.js','style.css','concept.png','preview.png']){
    if(await exists(path.join(src,file)))await copyFile(path.join(src,file),path.join(out,file));
  }
  await writeFile(path.join(out,'index.html'),forDist(await readFile(path.join(src,'index.html'),'utf8')));
}

await mkdir(path.join(dist,'vendor/three'),{recursive:true});
await cp(path.join(root,'node_modules/three/build'),path.join(dist,'vendor/three/build'),{recursive:true});
await cp(path.join(root,'node_modules/three/examples/jsm'),path.join(dist,'vendor/three/examples/jsm'),{recursive:true});
await copyFile(path.join(root,'node_modules/three/LICENSE'),path.join(dist,'vendor/three/LICENSE'));
if(await exists(path.join(root,'world')))await cp(path.join(root,'world'),path.join(dist,'world'),{recursive:true});
await writeFile(path.join(dist,'.nojekyll'),'');
console.log('Built static CARAKURI viewer in dist/ ('+built.join(', ')+')');
