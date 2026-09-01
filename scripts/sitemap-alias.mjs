/**
 * @astrojs/sitemap は sitemap-index.xml を作るが、
 * 現行サイト（Jekyll）は /sitemap.xml で配信しており、
 * Google Search Console にもそのURLで登録されている。
 * URLを変えないため、同じ内容を sitemap.xml としても置く。
 */
import { copyFile, access } from 'node:fs/promises';

const src = 'dist/sitemap-index.xml';
const dest = 'dist/sitemap.xml';

try {
  await access(src);
} catch {
  console.error(`${src} が見つかりません。sitemap連携が動いているか確認してください。`);
  process.exit(1);
}

await copyFile(src, dest);
console.log('sitemap-index.xml を sitemap.xml としても配置しました。');
