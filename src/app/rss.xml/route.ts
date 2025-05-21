import { getAllPostsMeta } from '@/lib/posts'

export async function GET() {
  const posts = await getAllPostsMeta()

  // Sort posts by date, newest first
  const sortedPosts = posts.sort(
    (a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime(),
  )

  const siteUrl = 'https://w11i.me'
  const rssTitle = 'Filip Wojciechowski - Blog'
  const rssDescription =
    'Personal blog about software development, TypeScript, Python, Go, and web technologies'

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${rssTitle}</title>
    <link>${siteUrl}</link>
    <description>${rssDescription}</description>
    <language>en-us</language>
    <managingEditor>filip@w11i.me (Filip Wojciechowski)</managingEditor>
    <webMaster>filip@w11i.me (Filip Wojciechowski)</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${sortedPosts
      .map(
        ({ slug, meta }) => `
    <item>
      <title><![CDATA[${meta.title}]]></title>
      <link>${siteUrl}/${slug}</link>
      <guid isPermaLink="true">${siteUrl}/${slug}</guid>
      <description><![CDATA[${meta.excerpt}]]></description>
      <pubDate>${new Date(meta.date).toUTCString()}</pubDate>
      <author>filip@w11i.me (${meta.author})</author>
      ${meta.tags.map((tag) => `<category><![CDATA[${tag}]]></category>`).join('\n      ')}
    </item>`,
      )
      .join('')}
  </channel>
</rss>`

  return new Response(rssXml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
