import formatDate from '@/components/formatDate'

const getArticle = ({ post }) => {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    name: post.title,
    headline: post.title,
    datePublished: formatDate(post.date),
    image: post.featuredImage?.node?.sourceUrl,
    description: post.excerpt,
    author: {
      "@type": "Person",
      name: "Tom Fletcher",
      url: "https://instagram.com/rgbjoy",
    },
    publisher: {
      "@type": "Organization",
      name: "RGBJOY",
      url: "https://rgbjoy.com",
      sameAs: [
        "https://www.twitter.com/rgbjoy",
        "https://www.instagram.com/rgbjoy",
      ],
    },
  };
};

const GetSchema = ({ post }) => {
  const jsonLd = getArticle({ post });
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

export default GetSchema;