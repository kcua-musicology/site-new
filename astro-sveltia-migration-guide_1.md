# 音楽学専攻サイト移行手順書
## WordPress静的書き出し → Astro + Sveltia CMS + GitHub Actions

対象サイト: https://kcua-musicology.github.io
（現状: ローカルWordPress 6.6.2 + Lightningテーマ → 静的書き出し → 手動でgit push）

---

## 0. 移行後の運用イメージ

| | 現在 | 移行後 |
|---|---|---|
| 記事を書く | ローカルWordPressを起動 | ブラウザで `/admin/` を開く |
| 画像を追加 | WordPressのメディア | 同じ画面にドラッグ&ドロップ |
| 公開する | 静的書き出し→コピー→git push | 「保存」を押すだけ |
| 必要なもの | 各自のPCにWordPress環境 | GitHubアカウントとブラウザだけ |
| 費用 | 無料 | 無料（広告なし） |

「保存」を押すとGitHubにコミットが作られ、GitHub Actionsが自動でサイトをビルドして公開します。反映まで1〜2分です。スマートフォンからでも編集できます。

---

## 1. 全体構成

```
kcua-musicology.github.io/        ← 今のリポジトリをそのまま使う
├─ .github/workflows/deploy.yml   ← 自動ビルド・公開の設定
├─ astro.config.mjs               ← サイト全体の設定
├─ package.json
├─ src/
│  ├─ content.config.ts           ← どんな種類の記事があるかの定義
│  ├─ content/
│  │  ├─ blog/                    ← ブログ記事（Markdown）
│  │  └─ labs/                    ← 教員紹介
│  ├─ layouts/
│  │  └─ Base.astro               ← 共通のヘッダー・フッター
│  ├─ components/
│  └─ pages/                      ← 各ページ
│     ├─ index.astro              ← トップ
│     ├─ [slug].astro             ← ブログ記事のURL（/conf_2025/ など）
│     ├─ musicology/
│     ├─ labs/
│     ├─ campuslife.astro
│     └─ admin.astro は不要（下のpublic/adminを使う）
└─ public/                        ← そのまま公開されるファイル
   ├─ admin/
   │  ├─ index.html               ← CMSの管理画面
   │  └─ config.yml               ← CMSの設定
   ├─ uploads/                    ← これから追加する画像
   └─ wp-content/uploads/         ← 既存画像（URL維持のためそのまま移す）
```

---

## 2. 事前準備

### 2.1 Node.jsを入れる

https://nodejs.org/ からLTS版をインストールします。ターミナル（Windowsならコマンドプロンプト）で確認:

```bash
node -v    # v22 以上ならOK
```

### 2.2 作業用にリポジトリを複製

いきなり本番リポジトリを書き換えると事故るので、**別リポジトリで作って完成後に切り替える**のが安全です。

```bash
# 新しい作業用リポジトリ（例: kcua-musicology/site-new）をGitHubで作成しておく
git clone https://github.com/kcua-musicology/site-new.git
cd site-new
```

現行サイトの `wp-content/uploads` フォルダ（画像類）は後で使うので、手元にコピーしておいてください。

---

## 3. Astroプロジェクトを作る

```bash
npm create astro@latest .
```

対話式で聞かれるので:

- テンプレート → **Empty**（または Blog）
- TypeScript → **Yes（Strict でなく Relaxed）**
- 依存関係のインストール → **Yes**
- git初期化 → **No**（すでにリポジトリなので）

作成後、動作確認:

```bash
npm run dev
# → http://localhost:4321 が開けばOK
```

---

## 4. astro.config.mjs

リポジトリ名が `kcua-musicology.github.io` なので `base` の設定は不要です。

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kcua-musicology.github.io',
  build: {
    format: 'directory', // /conf_2025/ のようなURLになる（既存URLと同じ形）
  },
});
```

---

## 5. コンテンツの定義（src/content.config.ts）

ブログ記事と教員紹介をコレクションとして定義します。

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    thumbnail: z.string().optional(),
    description: z.string().optional(),
  }),
});

const labs = defineCollection({
  loader: glob({ base: './src/content/labs', pattern: '**/*.md' }),
  schema: z.object({
    name: z.string(),
    field: z.string(),
    photo: z.string().optional(),
    order: z.number().default(0),
  }),
});

export const collections = { blog, labs };
```

> 補足: Astroのバージョンによっては `z` の読み込み先が `astro/zod` になります。エラーが出たら `import { z } from 'astro/zod';` に変えてください。

### ブログ記事のファイル例

`src/content/blog/conf_2025.md`

```markdown
---
title: 【学会発表報告】ISPS2025，日本音楽知覚認知学会
date: 2025-11-18
category: 学生の活躍
thumbnail: /wp-content/uploads/2025/11/conf1.jpg
---

正田ゼミの学部生・大学院生・教員が，上海で行われた……
```

ファイル名がそのままURL（`/conf_2025/`）になります。**既存記事のファイル名は現在のURLと同じにしてください。**そうすれば外部からのリンクや検索結果が切れません。

---

## 6. ページを作る

### 6.1 共通レイアウト（src/layouts/Base.astro）

現行サイトのHTMLソースを開いて、ヘッダー・グローバルナビ・フッターの部分をそのまま貼り付けます。Lightningテーマの見た目を維持したい場合は、`style.css` も `public/css/` にコピーして読み込んでください。

```astro
---
const { title, description } = Astro.props;
---
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title} | 京都市立芸術大学音楽学専攻</title>
  {description && <meta name="description" content={description} />}
  <link rel="stylesheet" href="/css/style.css" />
</head>
<body>
  <header>
    <!-- 現行サイトのヘッダーHTMLをここに貼る -->
  </header>
  <main>
    <slot />
  </main>
  <footer>
    <!-- 現行サイトのフッターHTMLをここに貼る -->
  </footer>
</body>
</html>
```

### 6.2 ブログ記事ページ（src/pages/[slug].astro）

```astro
---
import { getCollection, render } from 'astro:content';
import Base from '../layouts/Base.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---
<Base title={post.data.title}>
  <article>
    <h1>{post.data.title}</h1>
    <time>{post.data.date.toLocaleDateString('ja-JP')}</time>
    <Content />
  </article>
</Base>
```

### 6.3 トップページ（src/pages/index.astro）

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';

const posts = (await getCollection('blog'))
  .sort((a, b) => b.data.date - a.data.date)
  .slice(0, 3);
---
<Base title="京都市立芸術大学音楽学専攻">
  <h1>京都市立芸術大学音楽学部・大学院音楽研究科 音楽学専攻</h1>

  <h2>音楽学専攻blog</h2>
  <ul>
    {posts.map((post) => (
      <li>
        {post.data.thumbnail && <img src={post.data.thumbnail} alt="" />}
        <a href={`/${post.id}/`}>{post.data.title}</a>
        <time>{post.data.date.toLocaleDateString('ja-JP')}</time>
      </li>
    ))}
  </ul>
</Base>
```

### 6.4 固定ページ

「京芸の音楽学」「キャンパスライフ」「受験生の皆さんへ」などは更新頻度が低いので、最初は `.astro` ファイルとして直接作るのが手軽です（`src/pages/campuslife.astro` など）。あとからCMSで編集したくなったら、手順7のfilesコレクションとして追加できます。

---

## 7. Sveltia CMSを設置する

**これがWordPress管理画面の代わりになります。** インストールは不要で、HTMLファイル1つと設定ファイル1つを置くだけです。

### 7.1 public/admin/index.html

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex" />
    <title>Sveltia CMS</title>
  </head>
  <body>
    <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
  </body>
</html>
```

> 注意: CSSの `<link>` タグや `type="module"` 属性は**不要**です。付けると動作がおかしくなることがあります。

### 7.2 public/admin/config.yml

```yaml
# yaml-language-server: $schema=https://unpkg.com/@sveltia/cms/schema/sveltia-cms.json

backend:
  name: github
  repo: kcua-musicology/kcua-musicology.github.io
  branch: main

media_folder: /public/uploads
public_folder: /uploads

collections:
  - name: blog
    label: 音楽学専攻ブログ
    label_singular: 記事
    folder: /src/content/blog
    create: true
    slug: '{{slug}}'
    preview_path: '{{slug}}'
    sortable_fields: [date, title]
    fields:
      - { label: タイトル, name: title, widget: string }
      - { label: 日付, name: date, widget: datetime, type: date }
      - label: カテゴリ
        name: category
        widget: select
        options:
          - お知らせ
          - 音楽学専攻の活動
          - 教員の活動
          - 学生の活躍
          - 卒業生の活動
      - { label: サムネイル画像, name: thumbnail, widget: image, required: false }
      - { label: 抜粋, name: description, widget: string, required: false }
      - { label: 本文, name: body, widget: richtext }

  - name: labs
    label: 教員紹介
    label_singular: 教員
    folder: /src/content/labs
    create: true
    fields:
      - { label: 氏名, name: name, widget: string }
      - { label: 専門分野, name: field, widget: string }
      - { label: 顔写真, name: photo, widget: image, required: false }
      - { label: 表示順, name: order, widget: number, default: 0 }
      - { label: 紹介文, name: body, widget: richtext }

  # トップページの「更新情報」欄をCMSから編集する例
  - name: settings
    label: サイト設定
    files:
      - name: news
        label: トップページの更新情報
        file: /src/data/news.yml
        fields:
          - label: 更新情報
            name: items
            widget: list
            fields:
              - { label: 日付, name: date, widget: string }
              - { label: 内容, name: text, widget: text }
```

`widget: richtext` がWordPressのブロックエディタに近い見た目の編集画面になります。

---

## 8. ログインの設定

### 8.1 まずは個人用トークンで動かす（すぐできる）

CMSの設定は不要です。`/admin/` を開いてログイン画面の「Sign In with Token」を押すと、必要な権限が選択済みのGitHubトークン発行ページへのリンクが表示されます。トークンを作って貼り付ければログイン完了です。

管理者ひとりで試す段階はこれで十分です。

### 8.2 学生・教員にも使ってもらう段階（OAuthログイン）

トークンを配るのは現実的でないので、認証サーバーを立てます。Cloudflare Workersの無料枠で動きます。

1. https://github.com/sveltia/sveltia-cms-auth を開く
2. READMEの「Deploy to Cloudflare」ボタンから自分のCloudflareアカウントにデプロイ
3. GitHubで OAuth App を登録し（Settings → Developer settings → OAuth Apps）、Client IDとSecretをWorkerの環境変数に設定
4. `config.yml` の `backend:` に、デプロイしたWorkerのURLを追加:

```yaml
backend:
  name: github
  repo: kcua-musicology/kcua-musicology.github.io
  branch: main
  base_url: https://xxxx.workers.dev   # ← 自分のWorkerのURL
```

以降は、リポジトリに書き込み権限のあるGitHubアカウントを持つ人なら誰でも、`/admin/` から「GitHubでログイン」できます。

---

## 9. 自動デプロイの設定

### 9.1 .github/workflows/deploy.yml

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout your repository using git
        uses: actions/checkout@v7
      - name: Install, build, and upload your site
        uses: withastro/action@v6

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

> `package-lock.json` を必ずコミットしてください。これがないとビルドに失敗します。

### 9.2 GitHub側の設定

リポジトリの **Settings → Pages → Source** を **「GitHub Actions」** に変更します（現在は「Deploy from a branch」になっているはずです）。

---

## 10. 既存コンテンツの移行

### 10.1 画像

現行の `wp-content/uploads/` フォルダをまるごと `public/wp-content/uploads/` にコピーします。これで既存記事の画像URLがそのまま生き続けます。新しく追加する画像は `public/uploads/` に入るので、混ざりません。

### 10.2 記事

現在ブログ記事は10本程度なので、**手作業でコピーするのが結局いちばん速い**です。WordPressの投稿編集画面から本文をコピーして、上記のMarkdown形式で保存してください。

数が多い場合は、WordPressの「ツール → エクスポート」でXMLを書き出し、`wordpress-export-to-markdown` というツールで一括変換できます。

```bash
npx wordpress-export-to-markdown
```

### 10.3 URL

以下は必ず現行と同じにしてください。変わるとリンク切れになります。

- `/musicology/`, `/musicology/lecture/`, `/musicology/dissertation/`, `/musicology/facilities/`
- `/labs/`, `/labs/ota/`, `/labs/ikegami/`, `/labs/kawabata/`, `/labs/shoda/`
- `/campuslife/`, `/admission/`
- 各記事: `/conf_2025/`, `/fest2025/`, `/2025opencampus/`, `/20241005oc/` など

カテゴリページ（`/category/blog/info/` など）も必要なら `src/pages/category/blog/[category].astro` として作れます。

---

## 11. 切り替えの順番

1. 作業用リポジトリでサイトを完成させる
2. そのリポジトリのGitHub PagesでURL（`https://kcua-musicology.github.io/site-new/`）を確認し、教員間でレビュー
3. 本番リポジトリの現行ファイルを別ブランチ（`old-wordpress`）に退避
4. 本番リポジトリのmainを新しい中身に置き換え、Settings → Pages → Source を「GitHub Actions」に変更
5. 公開後、主要ページのURLと画像表示を一通り確認

作業用リポジトリでレビューする際、`base` 設定が必要になる点だけ注意してください（`base: '/site-new'`）。本番へ移すときに削除します。

---

## 12. 運用

### 執筆者を増やす

1. リポジトリの Settings → Collaborators で、学生・教員のGitHubアカウントを**Write権限**で招待
2. `https://kcua-musicology.github.io/admin/` のURLを共有

### 注意点

- Sveltia CMSは複数人の同時編集を正式サポートしていません。同じ記事を同時に編集すると上書きが起きる可能性があるので、「誰がどの記事を書くか」だけ事前に共有してください
- Sveltia CMSはまだベータ版（1.0前）です。実運用サイトは多数ありますが、大きな仕様変更が入る可能性があります
- CDNから最新版を読み込む形なので、バージョンを固定したい場合は `<script src="https://unpkg.com/@sveltia/cms@0.166.1/dist/sveltia-cms.js">` のようにバージョンを指定できます

---

## 参考リンク

- Sveltia CMS ドキュメント: https://sveltiacms.app/en/docs/start
- GitHubバックエンドの設定: https://sveltiacms.app/en/docs/backends/github
- 認証サーバー: https://github.com/sveltia/sveltia-cms-auth
- Astro公式（日本語あり）: https://docs.astro.build/ja/
- AstroのGitHub Pagesデプロイ: https://docs.astro.build/en/guides/deploy/github/
- Astroのコンテンツコレクション: https://docs.astro.build/en/guides/content-collections/

---

## 作業量の目安

| 工程 | 目安 |
|---|---|
| 環境構築（手順2〜4） | 1時間 |
| レイアウト移植（手順6） | 半日〜1日 |
| CMS設置・認証設定（手順7〜8） | 2時間 |
| 記事・画像の移行（手順10） | 半日 |
| 切り替え・確認（手順11） | 1時間 |

一度作ってしまえば、以後の更新作業はブラウザで数分です。
