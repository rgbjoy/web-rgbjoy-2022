interface Link {
  title: string
  url: string
}

interface ImageSize {
  sourceUrl: string
  width: number
  height: number
  name: string
}

interface Strength {
  title: string
  strengths: string[]
}

interface MediaDetails {
  width: number
  height: number
  sizes: ImageSize[]
}

interface FeaturedImage {
  node: {
    sourceUrl: string
    mediaDetails: MediaDetails
  }
}

interface ProfileImage {
  mediaDetails: MediaDetails
}

interface PastProjects {
  title: string
  link: Link
  description: string
}

interface HomeData {
  header: string
  subhead: string
  intro: string
  button: string
}

interface InfoData {
  content: string
  info: {
    profileImage: ProfileImage
    links: Link[]
    strengths: Strength[]
  }
}

interface DevData {
  content: string
  dev: {
    pastProjects: PastProjects[]
  }
}

interface ArtData {
  content: string
  artwork: {
    gallery: {
      title: string
      mediaItemUrl: string
      mediaType: string
      mediaDetails: MediaDetails
    }[]
  }
}

interface SiteSettings {
  footerLinks: Link[]
  badge: string
  homeHeader: String
  homeSubhead: String
  intro: String
  buttonText: String
}

interface PostsData {
  nodes: {
    slug: string
    title: string
    date: string
  }[]
}

interface PostData {
  title: string
  date: string
  excerpt: string
  content: string
  featuredImage: FeaturedImage
}

export type {
  HomeData,
  InfoData,
  DevData,
  ArtData,
  SiteSettings,
  PostsData,
  PostData,
}
