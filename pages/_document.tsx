import Document, {
  DocumentContext,
  Html,
  Head,
  Main,
  NextScript,
} from 'next/document';
import { ServerStyleSheet } from 'styled-components';

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <meta name="theme-color" content="#ffffff" />
          <link rel="icon" type="image/png" href="/images/favicon.png" />
          <link rel="apple-touch-icon" href="/images/favicon.png" />
          <link
            rel="alternate"
            type="application/rss+xml"
            href="https://news.onbrn.com/rss.xml"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
          <script
            src="https://cdn.usefathom.com/script.js"
            data-site="NCGAAGVZ"
            defer
          />
        </body>
      </Html>
    );
  }
}
