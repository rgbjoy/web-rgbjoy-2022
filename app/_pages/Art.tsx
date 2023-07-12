"use client"

import Layout from '@/components/Layout';
import Masonry from 'react-masonry-css'
import style from './Art.module.scss'
import Media from '@/components/Media';
import LightBox from '@/components/Lightbox';
import { SplitText } from '@/components/SplitText';

import { useState, useEffect, useRef } from "react";

export default function Art(page) {

  const artwork = page.artwork;

  function useHover<HTMLDivElement>() {
    const [value, setValue] = useState<boolean>(false);
    const ref: any = useRef<HTMLDivElement | null>(null);
    const handleMouseOver = (): void => setValue(true)
    const handleMouseOut = (): void => setValue(false)

    useEffect(() => {
      const node: any = ref.current;
      if (node) {
        node.addEventListener("mouseover", handleMouseOver);
        node.addEventListener("mouseout", handleMouseOut);
        node.addEventListener("click", handleMouseOut);

        return () => {
          node.removeEventListener("mouseover", handleMouseOver);
          node.removeEventListener("mouseout", handleMouseOut);
          node.removeEventListener("click", handleMouseOut);
        };
      }
    }, []);
    return [ref, value];
  }

  const DoodleImage = ({ media, ...props }) => {
    const [hoverRef, isHovered] = useHover<HTMLDivElement>();

    return (
      <div {...props} ref={hoverRef} className={style.media}>
        <LightBox media={media}>
          <div className={`thumbnail ${isHovered ? "hovered" : ""}`}>
            <Media media={media} thumbnail />
          </div>
          <div className="caption">{media.title}</div>
        </LightBox>
      </div>
    )
  }

  return (
    <Layout className={style.art}>
      <h1 className={style.header}>
        <SplitText

        >
          Art & Design
        </SplitText>
      </h1>

      <div dangerouslySetInnerHTML={{ __html: page.content }} />
      <Masonry
        breakpointCols={2}
        className={style['my-masonry-grid']}
        columnClassName="my-masonry-grid_column">
        {
          artwork?.gallery.map((media, i) => {
            return (
              <DoodleImage key={"media" + i} media={media} />
            )
          })
        }
      </Masonry>
    </Layout>
  )
}
