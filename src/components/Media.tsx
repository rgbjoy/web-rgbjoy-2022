import Image from 'next/image'

const Media = ({media, thumbnail = null}) => {

  const keyStr =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

  const triplet = (e1: number, e2: number, e3: number) =>
    keyStr.charAt(e1 >> 2) +
    keyStr.charAt(((e1 & 3) << 4) | (e2 >> 4)) +
    keyStr.charAt(((e2 & 15) << 2) | (e3 >> 6)) +
    keyStr.charAt(e3 & 63)

  const rgbDataURL = (r: number, g: number, b: number) =>
  `data:image/gif;base64,R0lGODlhAQABAPAA${
    triplet(0, r, g) + triplet(b, 255, 255)
  }/yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==`

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
        sizes="(max-width: 800px) 100vw"
        placeholder="blur"
        blurDataURL={rgbDataURL(90, 90, 90)}
        alt={media.title}
        quality={thumbnail ? 75 : 100}
        style={{maxWidth:media.mediaDetails.width, maxHeight:media.mediaDetails.height}}
        className={thumbnail ? "image" : "image-fill"}
      />
    )
  }
}

export default Media;