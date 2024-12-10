import Link from 'next/link'
import style from '../siteLayout.module.scss'
import { usePathname, useSelectedLayoutSegment } from 'next/navigation'

export default function NavLink({ label, path, targetSegment, color, closeMenu }) {
  const activeSegment = useSelectedLayoutSegment()
  const pathname = usePathname()
  const paths = pathname?.split('/').filter((a) => a.length > 0).length

  const handleClick = () => {
    if (closeMenu) {
      closeMenu()
    }
  }

  return (
    <Link
      className={activeSegment === targetSegment ? style.active : ''}
      data-color={color}
      href={path}
      onClick={handleClick}
    >
      {label === '/' && activeSegment ? (
        paths === 2 ? (
          <>
            .<span>/</span>
          </>
        ) : (
          <>
            ..<span>/</span>
          </>
        )
      ) : (
        <span>{label}</span>
      )}
    </Link>
  )
}
