import { getAllPostsMeta } from '@/lib/posts'

export async function GET() {
  const posts = await getAllPostsMeta()
  const siteUrl = 'https://w11i.me'

  // Get unique tags for tag pages
  const allTags = [...new Set(posts.flatMap((post) => post.meta.tags))]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  ${posts
    .map(
      ({ slug, meta }) => `
  <url>
    <loc>${siteUrl}/${slug}</loc>
    <lastmod>${new Date(meta.date).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`,
    )
    .join('')}
  ${allTags
    .map(
      (tag) => `
  <url>
    <loc>${siteUrl}/tags/${encodeURIComponent(tag)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`,
    )
    .join('')}
</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
