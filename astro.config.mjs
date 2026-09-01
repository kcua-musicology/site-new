import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kcua-musicology.github.io',
  build: {
    format: 'directory', // /conf_2025/ のようなURLになる（既存URLと同じ形）
  },
  integrations: [
    // 現行サイトの /sitemap.xml はJekyllが作っていた。
    // Astroに移るとJekyllが動かなくなるので、こちらで生成する
    sitemap({
      filter: (page) => !page.includes('/admin/'),
    }),
  ],
});
