import { GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'

import { Project } from '../../interfaces'
import { sampleProjectData } from '../../utils/sample-data'
import List from '../../components/List'
import Layout from '../../components/Layout';

type Props = {
  items: Project[]
}

const WithStaticProps = ({ items }: Props) => (
  <Layout page="project">
    <Head><title>Projects</title></Head>
    <h1>Projects</h1>
    <List items={items} />
  </Layout>
)

export const getStaticProps: GetStaticProps = async () => {
  // Example for including static props in a Next.js function component page.
  // Don't forget to include the respective types for any props passed into
  // the component.
  const items: Project[] = sampleProjectData
  return { props: { items } }
}

export default WithStaticProps
