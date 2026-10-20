import { ImageResponse } from "next/og"
import { findPageSeo } from "../server/page-seo"

const BARS = ["#ff1f3d", "#25f04a", "#3a5bff"]

/** Share image drawn from a page's title, e.g. /og?path=/experiments/range-day */
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path") ?? ""
  const page = await findPageSeo(path)
  if (!page) return new Response("Not found", { status: 404 })
  const name = page.title.split(" — ")[0]
  return new ImageResponse(<ShareCard name={name} />, {
    width: 1200,
    height: 630,
    headers: { "Cache-Control": "public, max-age=86400" },
  })
}

function ShareCard({ name }: { name: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: 80, background: "#000", color: "#fff" }}>
      <div style={{ display: "flex", gap: 14 }}>
        {BARS.map(color => <div key={color} style={{ width: 44, height: 140, background: color }} />)}
      </div>
      <div style={{ display: "flex", fontSize: name.length > 24 ? 72 : 96, lineHeight: 1.05, letterSpacing: -2 }}>{name}</div>
      <div style={{ display: "flex", fontSize: 32, color: "#8a8a8a" }}>rgbjoy.com</div>
    </div>
  )
}
