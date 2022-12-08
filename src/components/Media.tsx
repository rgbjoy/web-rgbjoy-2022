import Image from 'next/legacy/image'

const Media = ({media, thumbnail = null}) => {
  if (media.mediaType !== "image") {
    return (
      <video autoPlay loop width={thumbnail ? 300 : media.mediaDetails.width} height={thumbnail ? 300 : media.mediaDetails.height}>
        <source
          src={media.mediaItemUrl}
        />
      </video>
    )
  } else {
    return (
      <Image
        src={media.mediaItemUrl}
        width={media.mediaDetails.width}
        height={media.mediaDetails.height}
        alt=""
        placeholder="blur"
        blurDataURL={media.mediaDetails.sizes[0].sourceUrl}
        quality={100}
      />
    )
  }
}

export default Media;