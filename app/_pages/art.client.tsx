"use client"

import PageWrapper from '@/components/pageWrapper';
import Masonry from 'react-masonry-css'
import style from './art.module.scss'
import Media from '@/components/media';
import LightBox from '@/components/lightbox';
import { SplitText } from '@/components/splitText';

import { useState, useEffect, useRef } from "react";
import { ArtData } from '@/models/types';

export default function Art(page:ArtData) {

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
          <div className={`${style.thumbnail} ${isHovered ? "hovered" : ""}`}>
            <Media media={media} thumbnail />
          </div>
          <div className={style.caption}>{media.title}</div>
        </LightBox>
      </div>
    )
  }

  return (
    <PageWrapper className={style.art} page='art'>
      <h1 className={style.header}>
        <SplitText>
          Art & Design
        </SplitText>
      </h1>

      <div dangerouslySetInnerHTML={{ __html: page.content }} />
      <Masonry
        breakpointCols={2}
        className={style['my-masonry-grid']}
        columnClassName={style['my-masonry-grid_column']}>
        {
          artwork?.gallery.map((item, i) => {
            return (
              <DoodleImage key={"media" + i} media={item} />
            )
          })
        }
      </Masonry>
    </PageWrapper>
  )
}
