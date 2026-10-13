import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const root=path.resolve(import.meta.dirname,'..');
const cli=path.join(root,'bin/lbp.mjs');
function call(...args){return spawnSync(process.execPath,[cli,...args],{cwd:root,encoding:'utf8'});}
test('doctor shows available runtime',()=>{const r=call('doctor');assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/codexSkillsDir/);});
test('providers advertise standalone upstream',()=>{const r=call('providers');assert.equal(r.status,0);assert.match(r.stdout,/mono-color/);assert.match(r.stdout,/gc-minimal-zine-poster/);});
test('missing source blocks unsupported numeric claim',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lbp-'));
 try{
  const input=path.join(dir,'bad.json');fs.writeFileSync(input,JSON.stringify({slides:[{headline:'KPI',type:'metrics',metrics:[{label:'Revenue',value:'99%'}]}]}));
  const r=call('create',input,'--out',path.join(dir,'bad.pptx'));assert.notEqual(r.status,0);assert.match(r.stderr,/needs sourceId or assumption/);
 }finally{fs.rmSync(dir,{force:true,recursive:true});}
});
test('sample PPTX is editable and structurally inspectable',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lbp-'));
 try{
  const out=path.join(dir,'demo.pptx');
  const r=call('create','examples/maillardhelp-demo.json','--out',out,'--qc');
  assert.equal(r.status,0,r.stderr);assert.ok(fs.existsSync(out));const report=JSON.parse(fs.readFileSync(out+'.report.json'));
  assert.ok(report.slides>=5);assert.equal(report.qc.status,'STRUCTURE_PASS');assert.ok(report.qc.nativeShapes>20);assert.ok(report.qc.textRuns>20);
 }finally{fs.rmSync(dir,{force:true,recursive:true});}
});
