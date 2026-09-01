/**
 * サブパス公開用の後処理。
 *
 * このサイトは本番（https://kcua-musicology.github.io/）で動くことを前提に、
 * リンクや画像を全てルート絶対パス（/musicology/ など）で書いている。
 * 作業用リポジトリのレビュー公開はサブパス（/site-new/）になるため、
 * ビルド結果の dist/ に対してだけ接頭辞を足す。
 *
 * 環境変数 BASE_PATH が未設定なら何もしない（＝本番ビルドは素通り）。
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const base = (process.env.BASE_PATH ?? '').replace(/\/+$/, '');

if (!base) {
  console.log('BASE_PATH が未設定のため、パスの書き換えは行いません。');
  process.exit(0);
}

if (!base.startsWith('/')) {
  console.error(`BASE_PATH は "/" で始めてください（現在: ${base}）`);
  process.exit(1);
}

const DIST = 'dist';
const TARGET_EXT = new Set(['.html', '.css']);

/** すでに接頭辞が付いているもの、プロトコル相対（//）は触らない */
const skip = (path) => path.startsWith('//') || path === base || path.startsWith(`${base}/`);

const prefix = (path) => (skip(path) ? path : base + path);

function rewrite(text) {
  let n = 0;
  const bump = (v) => {
    const out = prefix(v);
    if (out !== v) n++;
    return out;
  };

  let out = text
    // href="/..." src="/..." content="/..."
    .replace(/\b(href|src|content)="(\/[^"]*)"/g, (_, attr, v) => `${attr}="${bump(v)}"`)
    // srcset="/a.png 1x, /b.png 2x"
    .replace(/\bsrcset="([^"]*)"/g, (m, v) => {
      if (!v.includes('/')) return m;
      const parts = v.split(',').map((part) => {
        const [url, ...rest] = part.trim().split(/\s+/);
        return url.startsWith('/') ? [bump(url), ...rest].join(' ') : part.trim();
      });
      return `srcset="${parts.join(', ')}"`;
    })
    // CSS の url(/...)
    .replace(/url\(\s*(['"]?)(\/[^'")]*)\1\s*\)/g, (_, q, v) => `url(${q}${bump(v)}${q})`);

  return { out, n };
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

let files = 0;
let total = 0;

for await (const file of walk(DIST)) {
  if (!TARGET_EXT.has(extname(file))) continue;
  const text = await readFile(file, 'utf8');
  const { out, n } = rewrite(text);
  if (n > 0) {
    await writeFile(file, out);
    files++;
    total += n;
  }
}

console.log(`BASE_PATH="${base}" を ${files} ファイル / ${total} 箇所に適用しました。`);
