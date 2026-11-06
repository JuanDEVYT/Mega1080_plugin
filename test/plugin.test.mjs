import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
describe('Mega1080 v1.0.2',()=>{
 it('has a Kino-valid manifest',async()=>{const {stdout,stderr}=await run('node',['sdk/validate.mjs','.','--repo','JuanDEVYT/Mega1080_plugin']);assert.match(stdout+stderr,/✓ Kino would accept this plugin/)});
 it('uses Mega1080 API and packed Vimeos HLS resolver',async()=>{const s=await readFile('src/mega1080.js','utf8');assert.match(s,/\/api\/rest/);assert.match(s,/unpackPacker/);assert.match(s,/\.m3u8/)});
 it('provides native declarative screen exports',async()=>{const s=await readFile('src/plugin.js','utf8');assert.match(s,/export async function screen/);assert.match(s,/export async function screenEvent/);assert.match(s,/makeBrowse/)});
 it('has the official Mega1080 purple identity',async()=>{const m=JSON.parse(await readFile('kino-plugin.json','utf8'));assert.equal(m.theme.accent,'#8C52FF');assert.equal(m.enhancements['14'].screen.label,'Mega1080')});
});
