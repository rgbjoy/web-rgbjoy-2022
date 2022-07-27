import * as React from 'react'
import Link from 'next/link'

import { Project } from '../interfaces'
import { Gallery } from './Gallery'

type ListDetailProps = {
  item: Project
}

const ListDetail = ({ item: project }: ListDetailProps) => (
  <div>
    <h1>{project.name}</h1>
    <h2>{project.description}</h2>
    <div className="example-container">
      <Gallery images={project.images} />
    </div>
    <Link href="/projects">
        <a>Go back</a>
      </Link>
  </div>

)

export default ListDetail
