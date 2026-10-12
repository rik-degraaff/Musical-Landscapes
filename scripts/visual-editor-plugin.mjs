import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { validateVisualOverrides } from '../src/utils/visualOverrides.js';

export const visualRevision = text => createHash('sha256').update(text).digest('hex');

export function visualEditorPlugin() {
  return {
    name: 'farmjam-visual-editor',
    apply: 'serve',
    configureServer(server) {
      const file = resolve(server.config.root, 'src/data/visual-overrides.json');
      let saving = false;
      server.middlewares.use('/__editor/api/visuals', async (request, response) => {
        const reply = (status, value) => {
          response.statusCode = status;
          response.setHeader('Content-Type', 'application/json');
          response.setHeader('Cache-Control', 'no-store');
          response.end(JSON.stringify(value));
        };
        const host = request.headers.host;
        const origin = request.headers.origin;
        if (!host || !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host) || (origin && origin !== `http://${host}`)) return reply(403, { error: 'The visual editor only saves from a same-origin localhost browser.' });
        try {
          if (request.method === 'GET') {
            const text = await readFile(file, 'utf8');
            return reply(200, { document: JSON.parse(text), revision: visualRevision(text) });
          }
          if (request.method !== 'POST') return reply(405, { error: 'Use GET or POST.' });
          if (request.headers['content-type'] !== 'application/json' || request.headers['x-farmjam-editor'] !== '1') return reply(403, { error: 'Invalid editor request.' });
          if (saving) return reply(409, { error: 'Another save is in progress. Try again.' });
          saving = true;
          let temporary;
          try {
            let body = '';
            for await (const chunk of request) {
              body += chunk;
              if (Buffer.byteLength(body) > 2 * 1024 * 1024) return reply(413, { error: 'Visual document is too large.' });
            }
            const payload = JSON.parse(body);
            validateVisualOverrides(payload.document);
            const current = await readFile(file, 'utf8');
            if (payload.revision !== visualRevision(current)) return reply(409, { error: 'The project changed since you opened it. Export your draft, then reload before saving.' });
            const text = `${JSON.stringify(payload.document, null, 2)}\n`;
            temporary = `${file}.${randomUUID()}.tmp`;
            await writeFile(temporary, text, { flag: 'wx' });
            await rename(temporary, file);
            temporary = undefined;
            return reply(200, { revision: visualRevision(text) });
          } finally {
            saving = false;
            if (temporary) await unlink(temporary).catch(() => {});
          }
        } catch (error) {
          return reply(400, { error: error.message });
        }
      });
    },
  };
}