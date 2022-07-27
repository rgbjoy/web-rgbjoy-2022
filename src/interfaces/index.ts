// You can include shared interfaces/types in a separate file
// and then use them in any component by importing them. For
// example, to import the interface below do:
//
// import { Project } from 'path/to/interfaces';

export type Project = {
  name: string
  slug: string
  description: string
  images: string[]
}
