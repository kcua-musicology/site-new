import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, excerpt } from '../../lib/blog';

// 現行サイトの /feed/ はWordPressが出していた。移行後も同じURLで配信する
export async function GET(context: APIContext) {
  const posts = (await getPosts()).slice(0, 10);

  return rss({
    title: '京都市立芸術大学音楽学専攻',
    description: '京都市立芸術大学音楽学部・大学院音楽研究科 音楽学専攻',
    site: context.site!,
    trailingSlash: true,
    customData: '<language>ja</language>',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description ?? excerpt(post.body ?? '', 200),
      link: `/${post.id}/`,
      categories: post.data.categories,
    })),
  });
}
