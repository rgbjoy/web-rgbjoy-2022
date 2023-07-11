import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://rgbjoy.com',
      lastModified: new Date(),
    },
    {
      url: 'https://rgbjoy.com/info',
      lastModified: new Date(),
    },
    {
      url: 'https://rgbjoy.com/dev',
      lastModified: new Date(),
    },
    {
      url: 'https://rgbjoy.com/art',
      lastModified: new Date(),
    },
  ]
}
