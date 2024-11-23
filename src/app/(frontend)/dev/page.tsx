import Dev from './dev.client'
import { getData } from '@/utilities/getData'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Development',
  description: 'Multidisciplinary digital creator & software engineer',
}

export default async function Page() {
  const query = `
    query GetDevPage {
      page(id: "cG9zdDoxNQ==") {
        content(format: RENDERED)
        dev {
          pastProjects {
            title
            link {
              url
            }
            description
          }
        }
      }
    }
  `

  const { data } = await getData(query)

  return <Dev {...data} />
}
