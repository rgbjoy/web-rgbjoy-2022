import React from "react"
import Layout from "../../components/layout"

export const getServerSideProps = async ({ params }) => {
  const post = await prisma.post.findUnique({
    where: {
      id: String(params?.id),
    },
    include: {
      author: {
        select: { name: true },
      },
    },
  });
  return {
    props: post,
  };
};

const Post = (props) => {
  let title = props.title

  return (
    <Layout>
      <div>
        <h2>{title} By {props?.author?.name || "Unknown author"}</h2>
        <p>{props.content}</p>
      </div>
    </Layout>
  )
}

export default Post