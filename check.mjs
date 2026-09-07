// Syntax-checks every module the site ships, so a broken character never reaches Pages.
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';

const files=['shared/series.js','shared/switcher.js','build.mjs'];
for(const id of ['nomad','ward','quorum','lex','catalyst'])
  for(const name of ['model.js','viewer.js','ward.js'])
    if(existsSync(`${id}/${name}`))files.push(`${id}/${name}`);

let failed=0;
for(const file of files){
  try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}
  catch(error){failed++;console.error(`FAIL ${file}\n${error.stderr}`)}
}
if(failed)process.exit(1);
console.log(`checked ${files.length} modules`);
