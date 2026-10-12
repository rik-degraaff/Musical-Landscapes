import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { visualEditorPlugin } from '../scripts/visual-editor-plugin.mjs';

test('editor saves atomically to its one project file and refuses stale or unsafe writes', async () => {
  const root = await mkdtemp(join(tmpdir(),'farmjam-editor-'));
  const file = join(root,'src/data/visual-overrides.json');
  await mkdir(join(root,'src/data'),{recursive:true});
  const original = '{"version":1,"rules":[]}\n';
  await writeFile(file,original);
  let handler;
  visualEditorPlugin().configureServer({config:{root},middlewares:{use(path,middleware){assert.equal(path,'/__editor/api/visuals');handler=middleware;}}});
  const server = createServer((request,response)=>handler(request,response));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url = `http://127.0.0.1:${server.address().port}/__editor/api/visuals`;
  const headers = {'Content-Type':'application/json','X-FarmJam-Editor':'1',Origin:new URL(url).origin};
  try {
    const loaded = await fetch(url).then(response=>response.json());
    const document = {version:1,rules:[{selector:'.art-moo > path:nth-of-type(1)',attributes:{fill:'#135724'},styles:{}}]};
    const denied = await fetch(url,{method:'POST',headers:{...headers,Origin:'https://untrusted.example'},body:JSON.stringify({document,revision:loaded.revision})});
    assert.equal(denied.status,403);
    const unsafe = await fetch(url,{method:'POST',headers,body:JSON.stringify({document:{version:1,rules:[{selector:'.art-moo',attributes:{onclick:'bad'},styles:{}}]},revision:loaded.revision})});
    assert.equal(unsafe.status,400);
    assert.equal(await readFile(file,'utf8'),original);
    const saved = await fetch(url,{method:'POST',headers,body:JSON.stringify({document,revision:loaded.revision})});
    assert.equal(saved.status,200);
    assert.deepEqual(JSON.parse(await readFile(file,'utf8')),document);
    const stale = await fetch(url,{method:'POST',headers,body:JSON.stringify({document:{version:1,rules:[]},revision:loaded.revision})});
    assert.equal(stale.status,409);
    assert.deepEqual(JSON.parse(await readFile(file,'utf8')),document);
    const missingHeader = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    assert.equal(missingHeader.status,403);
  } finally {
    await new Promise(resolve=>server.close(resolve));
    await rm(root,{recursive:true,force:true});
  }
});