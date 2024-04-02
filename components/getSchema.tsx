import formatDate from '@/components/formatDate'
import { PostData } from '@/models/types';

interface Author {
  "@type": string;
  name: string;
  url: string;
}

interface Publisher {
  "@type": string;
  name: string;
  url: string;
  sameAs: string[];
}

interface Post {
  title: string;
  date: string;
  featuredImage?: {
    node?: {
      sourceUrl: string;
    };
  };
  excerpt: string;
}

interface ArticleSchema {
  "@context": string;
  "@type": string;
  name: string;
  headline: string;
  datePublished: string;
  image?: string;
  description: string;
  author: Author;
  publisher: Publisher;
}

const getArticle = ({ post }: { post:PostData }): ArticleSchema => {
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

const GetSchema: React.FC<{ post: PostData }> = ({ post }) => {
  const jsonLd: ArticleSchema = getArticle({ post });
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

export default GetSchema;