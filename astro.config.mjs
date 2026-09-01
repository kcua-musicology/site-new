import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kcua-musicology.github.io',
  build: {
    format: 'directory', // /conf_2025/ のようなURLになる（既存URLと同じ形）
  },
});
