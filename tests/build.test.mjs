import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function run(cmd, args, opts = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(cmd, args, { stdio: 'pipe', shell: false, ...opts });
    let out = '';
    let err = '';
    child.stdout.on('data', d => { out += d.toString(); });
    child.stderr.on('data', d => { err += d.toString(); });
    child.on('error', reject);
    child.on('exit', code => {
      if (code !== 0) {
        reject(new Error(`${cmd} ${args.join(' ')} failed (${code})\n${out}\n${err}`));
      } else {
        resolvePromise({ out, err, code });
      }
    });
  });
}

before(async () => {
  // Build once for all tests in this file
  await run('npm', ['run', 'clean']);
  await run('npm', ['run', 'build']);
});

test('production build excludes /setup and hides link', async () => {

  const siteDir = resolve(__dirname, '..', '_site');
  const setupExists = existsSync(resolve(siteDir, 'setup', 'index.html'));
  assert.equal(setupExists, false, 'setup page should not be built in prod');

  const indexHtml = readFileSync(resolve(siteDir, 'index.html'), 'utf8');
  assert.ok(!indexHtml.includes('/setup'), 'Setup link should be hidden in prod');
});

function listHtmlFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...listHtmlFiles(p));
    else if (e.isFile() && p.endsWith('.html')) files.push(p);
  }
  return files;
}

test('no server-only paths in generated HTML', async () => {
  const siteDir = resolve(__dirname, '..', '_site');
  const htmlFiles = listHtmlFiles(siteDir);
  assert.ok(htmlFiles.length > 0, 'Expected some generated HTML files');

  const forbidden = [
    '/setup',
    '/api/save-config',
    '/config.json',
    'http://localhost',
    'https://localhost'
  ];

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    for (const needle of forbidden) {
      assert.ok(!html.includes(needle), `Prod HTML should not include ${needle} (${file})`);
    }
  }
});
