import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // 現行サイトの記事は複数カテゴリを持つものが多いので配列にする
    categories: z.array(z.string()).default([]),
    thumbnail: z.string().optional(),
    description: z.string().optional(),
  }),
});

// 教員紹介。1教員 = 1ファイル。CMSでは「追加」もできる
const labs = defineCollection({
  loader: glob({ base: './src/content/labs', pattern: '**/*.md' }),
  schema: z.object({
    name: z.string(),
    field: z.string(),
    photo: z.string().optional(),
    order: z.number().default(0),
    links: z
      .array(z.object({ label: z.string(), url: z.string() }))
      .default([]),
  }),
});

// 固定ページ。ファイル名と表示先URLはコード側（src/pages/*.astro）で対応づける
const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    // トップページのメイン画像（他のページでは使わない）
    hero: z.string().optional(),
    hero_mobile: z.string().optional(),
  }),
});

export const collections = { blog, labs, pages };
