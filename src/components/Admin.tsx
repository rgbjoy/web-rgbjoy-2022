import React from 'react'

export const ViewSite = async () => {
  return <a
    href={`${process.env.NEXT_PUBLIC_SERVER_URL}`}
    target="_blank"
    rel="noopener noreferrer"
    style={{ marginBottom: "10px", padding: "10px", border: "1px solid white", color: "white", textDecoration: "none" }}
  >
    Visit Site
  </a>
}