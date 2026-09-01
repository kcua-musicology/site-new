import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/**
 * カテゴリ名 → URLスラッグ。現行サイトのURLをそのまま維持する。
 * 「卒業生の活動」だけ日本語スラッグなので、リンクを書くときはURLエンコードする
 */
export const CATEGORY_SLUGS: Record<string, string> = {
  お知らせ: 'info',
  音楽学専攻の活動: 'musicology',
  教員の活動: 'professors',
  学生の活躍: 'students',
  卒業生の活動: '卒業生の活動-blog',
};

/** サイドバーのCategoryウィジェットの並び順（現行サイトと同じ） */
export const CATEGORY_ORDER = [
  'お知らせ',
  '卒業生の活動',
  '学生の活躍',
  '教員の活動',
  '音楽学専攻の活動',
];

export const POSTS_PER_PAGE = 10;

export function categoryPath(name: string): string {
  return `/category/blog/${encodeURIComponent(CATEGORY_SLUGS[name])}/`;
}

/** 新しい順（現行サイトの一覧と同じ並び） */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog');
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function primaryCategory(post: Post): string | undefined {
  return post.data.categories[0];
}

export function formatDate(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

/** 一覧カード用の抜粋。本文の記法を落として先頭だけ取り出す */
export function excerpt(body: string, length = 110): string {
  const text = body
    .replace(/^---[\s\S]*?---/, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[#*_`>|-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > length ? text.slice(0, length) + ' […]' : text;
}
