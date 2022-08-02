import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat&display=swap" rel="stylesheet" />

        <link rel="apple-touch-icon" sizes="180x180" href="/social/apple-touch-icon.png"/>
        <link rel="icon" type="image/png" sizes="32x32" href="/social/favicon-32x32.png"/>
        <link rel="icon" type="image/png" sizes="16x16" href="/social/favicon-16x16.png"/>
        <link rel="manifest" href="/social/site.webmanifest"/>
        <link rel="mask-icon" href="/social/safari-pinned-tab.svg" color="#5bbad5"/>
        <link rel="shortcut icon" href="/social/favicon.ico"/>
        <meta name="msapplication-TileColor" content="#da532c"/>
        <meta name="msapplication-config" content="/social/browserconfig.xml"/>
        <meta name="theme-color" content="#ffffff"/>

        {/* Global Site Tag (gtag.js) - Google Analytics */}
        <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}');
          `,
            }}
          />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}