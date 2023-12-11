import { motion, useAnimation } from 'framer-motion';
import Image from 'next/image'
import { useEffect, useState } from 'react';
import style from "@/pages/art.module.scss"

const Media = ({ media, thumbnail = false }) => {

  const animationVariants = {
    visible: {
      opacity: 1,
      background: "rgba(35, 35, 35, 0)",
    },
    hidden: {
      opacity: 0.5,
      background: "rgba(35, 35, 35, 1)",
    },
  }

  const [loaded, setLoaded] = useState(false);
  const animationControls = useAnimation();
  useEffect(
    () => {
      if (loaded) {
        animationControls.start("visible");
      }
    },
    [loaded, animationControls]
  );

  if (media.mediaType !== "image") {
    return (
      <video playsInline muted autoPlay loop width={thumbnail ? 300 : media.mediaDetails.width} height={thumbnail ? 300 : media.mediaDetails.height}>
        <source
          src={media.mediaItemUrl}
          type="video/mp4"
        />
      </video>
    )
  } else {
    return (
      <motion.div
        className={style.image_wrapper}
        initial={"hidden"}
        animate={animationControls}
        variants={animationVariants}
        transition={{ ease: "easeOut", duration: 0.25 }}
      >
        <Image
          src={thumbnail ? media.mediaDetails.sizes[0].sourceUrl : media.mediaItemUrl}
          width={thumbnail ? media.mediaDetails.sizes[0].width : media.mediaDetails.width}
          height={thumbnail ? media.mediaDetails.sizes[0].height : media.mediaDetails.height}
          alt={media.title}
          quality={thumbnail ? 75 : 100}
          onLoad={() => setLoaded(true)}
        />
      </motion.div>
    )
  }
}

export default Media;