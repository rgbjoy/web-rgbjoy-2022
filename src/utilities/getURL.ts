import canUseDOM from './canUseDOM'

export const getServerSideURL = () => {
  let url = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL

  if (!url) {
    url = 'http://localhost:3000'
  }

  return url
}

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  return ''
}
