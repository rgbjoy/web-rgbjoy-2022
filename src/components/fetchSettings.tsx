import { getData } from '@/utilities/getData'
import { SiteSettings, PostsData } from '@/models/types'

export async function fetchSettings() {
  const query = `
    query GetOptions {
      siteSettings {
        options {
          footerLinks {
            link {
              title
              url
            }
          }
          badge
        }
      }
      posts {
        nodes {
        slug
        }
      }
    }
  `
  const response = await getData(query)
  const options: SiteSettings = response.data.siteSettings.options
  const posts: PostsData = response.data.posts.nodes
  return { options, posts }
}
