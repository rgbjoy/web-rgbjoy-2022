import React from 'react'
import Link from 'next/link'

import { Project } from '../interfaces'

type Props = {
  data: Project
}

const ListItem = ({ data }: Props) => (
  <>
    <div>{data.name}</div>
    <div>{data.description}</div>
    {/* <div>{getImages(data.images)}</div> */}
    <Link href="/projects/[slug]" as={`/projects/${data.slug}`}>
      <a>More</a>
    </Link>
  </>
)

export default ListItem
