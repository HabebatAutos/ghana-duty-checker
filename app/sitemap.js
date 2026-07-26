// app/sitemap.js
export default function sitemap() {
  return [
    { url: 'https://www.cediduty.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://www.cediduty.com/how-it-works', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://www.cediduty.com/about', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://www.cediduty.com/contact', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://www.cediduty.com/faq', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]
}