import * as React from 'react'
import ListItem from './ListItem'
import { Project } from '../interfaces'

type Props = {
  items: Project[]
}

const List = ({ items }: Props) => (
  <ul>
    {items.map((item) => (
      <li key={item.name}>
        <ListItem data={item} />
      </li>
    ))}
  </ul>
)

export default List
