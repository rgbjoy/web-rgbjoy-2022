import 'normalize.css/normalize.css';
// import '../styles/variables.scss';
import '../styles/global.scss';

import { Analytics } from '@vercel/analytics/react';
import { Montserrat } from 'next/font/google'
import localFont from 'next/font/local'

import SiteLayout from "@/components/SiteLayout"

const montserrat = Montserrat({ subsets: ['latin'] })
const myFont = localFont({
  src: '../public/fonts/Rhode-Regular.woff2',
  variable: '--rhode-font',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.className} ${myFont.variable}`}>
        <SiteLayout>{children}</SiteLayout>
        <Analytics />
      </body>
    </html>
  )
}
