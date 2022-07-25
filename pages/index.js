import Layout from '../components/layout';
import utilStyles from '../styles/utils.module.scss';
import Link from 'next/link';
import React from 'react';
import prisma from '../lib/prisma';

export async function getStaticProps() {
  const feed = await prisma.post.findMany({
    where: { published: true },
    include: {
      author: {
        select: { name: true },
      },
    },
  });
  return {
    props: { feed },
    revalidate: 10,
  };
};

export default function Home({ feed }) {
  return (
    <Layout home animate={{ opacity: 0 }} transition={{ delay: 1 }}>
      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <h2 className={utilStyles.headingLg}>Blog</h2>
        <ul className={utilStyles.list}>
          {feed.map(({ id, date, title }) => (
            <li className={utilStyles.listItem} key={id}>
              <Link href={`/posts/${id}`}>
                <a>{title}</a>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}