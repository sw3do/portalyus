import type { APIRoute } from 'astro';
import { getApiUrl } from "../config/env";
import type { Video, Category, Channel } from "../types/index";

const generateSitemap = async (site: URL) => {
  let videos: Video[] = [];
  let categories: Category[] = [];
  let channels: Channel[] = [];

  try {
    const [videosRes, categoriesRes, channelsRes] = await Promise.all([
      fetch(getApiUrl("/videos?limit=10000")),
      fetch(getApiUrl("/categories")),
      fetch(getApiUrl("/channels"))
    ]);

    const videosData = await videosRes.json();
    const categoriesData = await categoriesRes.json();
    const channelsData = await channelsRes.json();

    if (videosData.success) videos = videosData.data;
    if (categoriesData.success) categories = categoriesData.data;
    if (channelsData.success) channels = channelsData.data;
  } catch (error) {
    console.error("Error fetching sitemap data:", error);
  }

  const baseUrl = site.origin;
  const currentDate = new Date().toISOString();

  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/videolar", priority: "0.9", changefreq: "daily" },
    { url: "/iletisim", priority: "0.5", changefreq: "monthly" }
  ];

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  staticPages.forEach(page => {
    sitemap += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  });

  categories.forEach(category => {
    sitemap += `  <url>
    <loc>${baseUrl}/kategori/${category.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  });

  channels.forEach(channel => {
    sitemap += `  <url>
    <loc>${baseUrl}/kanal/${channel.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  });

  videos.forEach(video => {
    sitemap += `  <url>
    <loc>${baseUrl}/video/${video.slug}</loc>
    <lastmod>${video.created_at}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  });

  sitemap += `</urlset>`;

  return sitemap;
};

export const GET: APIRoute = async ({ site }) => {
  const sitemapContent = await generateSitemap(site!);
  return new Response(sitemapContent, {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
};