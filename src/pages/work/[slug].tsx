import { GetStaticProps, GetStaticPaths } from 'next'
import Head from 'next/head'

import { Client } from '../../interfaces'
import { clientData } from '../../data/client'
import ClientDetail from '../../components/ClientDetail'
import Layout from '../../components/Layout';

type Props = {
  item?: Client
  errors?: string
}

const StaticPropsDetail = ({ item, errors }: Props) => {
  if (errors) {
    return (
      <p>
        <span style={{ color: 'red' }}>Error:</span> {errors}
      </p>
    )
  }

  return (
    <Layout page="detail">
      <Head><title>{`${item ? item.name : 'Client Detail'}`}</title></Head>
      <ClientDetail item={item} />
    </Layout>
  )
}

export default StaticPropsDetail

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = clientData.map((client) => ({
    params: { slug: client.slug },
  }))

  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  try {
    const slug = params?.slug
    const item = clientData.find((data) => data.slug === slug)

    return { props: { item } }
  } catch (err: any) {
    return { props: { errors: err.message } }
  }
}
