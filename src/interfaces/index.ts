// You can include shared interfaces/types in a separate file
// and then use them in any component by importing them. For
// example, to import the interface below do:
//
// import { Cleint } from 'path/to/interfaces';

export type Client = {
  name: string
  slug: string
  time?: string
  title?: string
  description: string
  technology?: string[]
  images?: string[]
}