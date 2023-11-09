import Link from 'next/link'
import style from './siteLayout.module.scss'
import { usePathname, useSelectedLayoutSegment } from 'next/navigation'

export default function NavLink({ label, path, targetSegment, color }) {
  const activeSegment = useSelectedLayoutSegment()
  const pathname = usePathname()
  const paths = pathname?.split("/").filter(a => a.length > 0).length
  return (<Link
    className={activeSegment === targetSegment ? style.active : ''}
    data-color={color}
    href={path}>
    {label === "/" && activeSegment
      ? (paths === 2 ? <>.<span>/</span></> : <>..<span>/</span></>)
      : `${label}`}
  </Link>)
}