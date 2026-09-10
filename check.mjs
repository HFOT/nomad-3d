// Syntax-checks every module the site ships, so a broken character never reaches Pages.
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';

const files=['shared/series.js','shared/switcher.js','build.mjs','residences/model.js','residences/architecture.js','residences/network.js','residences/viewer.js','arcade/model.js','arcade/mechanics.js','arcade/machines.js','arcade/viewer.js'];
for(const id of ['nomad','ward','quorum','lex','catalyst','treasury','pip','forge','game','rush','racer','chain','type','depot','gate','assembly','vault','archive','town'])
  for(const name of ['model.js','materials.js','buildings.js','districts.js','courses.js','racers.js','words.js','romaji.js','groundwork.js','player-motion.js','street-furniture.js','canal-crossings.js','street-surface.js','neighborhood.js','residence-quarter.js','landmarks.js','cast.js','lab.js','merge.js','viewer.js','ward.js'])
    if(existsSync(`${id}/${name}`))files.push(`${id}/${name}`);

let failed=0;
for(const file of files){
  try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}
  catch(error){failed++;console.error(`FAIL ${file}\n${error.stderr}`)}
}
if(failed)process.exit(1);
console.log(`checked ${files.length} modules`);
