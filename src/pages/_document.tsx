import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="Multidisciplinary digital creator & web engineer"/>

        <link rel="apple-touch-icon" sizes="180x180" href="/social/apple-touch-icon.png"/>
        <link rel="icon" type="image/png" sizes="32x32" href="/social/favicon-32x32.png"/>
        <link rel="icon" type="image/png" sizes="16x16" href="/social/favicon-16x16.png"/>
        <link rel="manifest" href="/social/site.webmanifest"/>
        <link rel="mask-icon" href="/social/safari-pinned-tab.svg" color="#5bbad5"/>
        <link rel="shortcut icon" href="/social/favicon.ico"/>
        <meta name="msapplication-TileColor" content="#da532c"/>
        <meta name="msapplication-config" content="/social/browserconfig.xml"/>
        <meta name="theme-color" content="#121212"/>

        <meta property="og:url" content="https://rgbjoy.com"/>
        <meta property="og:site_name" content="RGBJOY"/>
        <meta property="og:type" content="website"/>
        <meta property="og:title" content="Tom Fletcher"/>
        <meta property="og:description" content="Multidisciplinary digital creator & web engineer"/>
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@rgbjoy" />
        <meta property="twitter:image" content="https://rgbjoy.com/social/rgbjoy.jpg"/>
        <meta property="og:image" content="https://rgbjoy.com/social/rgbjoy.jpg"/>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}