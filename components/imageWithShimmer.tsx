"use client"

import { Suspense, useState } from 'react';
import Image from 'next/image';
import style from "@/components/imageShimmer.module.scss";

function ImageWithShimmer({ imageUrl, post, imageWidth, imageHeight }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Suspense fallback={<div style={{background: "grey"}}></div>}>
      <div className={style.featuredImageContainer}>
        <Image
          itemProp="image"
          className={isLoading ? style.imageLoading : style.featuredImage}
          src={imageUrl}
          alt={`Featured image for ${post.title}`}
          width={imageWidth || 500}
          height={imageHeight || 300}
          priority
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </Suspense>
  );
}

export default ImageWithShimmer