import { useRouter } from 'next/router'
import PropTypes from 'prop-types'
import Link from 'next/link'
import React, { Children } from 'react'

const ActiveLink = ({ children, activeClassName, ...props }) => {
  const { asPath } = useRouter()

  const thisClassName = props.className || ''

  const className =
    asPath === props.href || asPath === props.as
      ? `${thisClassName} ${activeClassName}`.trim()
      : thisClassName

  return (
    <Link href={null} {...props} scroll={false}>
      <a className={className}>{children}</a>
    </Link>
  )
}

ActiveLink.propTypes = {
  activeClassName: PropTypes.string.isRequired,
}

export default ActiveLink