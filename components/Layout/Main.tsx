import { ReactNode } from 'react';
import Head from 'next/head';
import Helmet from 'react-helmet';

import { Footer } from 'components/Layout';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
}

const MainLayout = ({
  children,
  title,
  description,
  keywords,
}: MainLayoutProps) => {
  const metaTags = [
    { property: 'og:title', content: title },
    {
      name: 'description',
      content: description,
    },
    {
      name: 'keywords',
      content: keywords,
    },
  ];

  const SEOOverride =
    title && description ? <Helmet title={title} meta={metaTags} /> : null;

  return (
    <>
      <Head>
        {title && <title>{title}</title>}
        {title && <meta property="og:title" content={title} />}
        {description && <meta name="description" content={description} />}
        {keywords && <meta name="keywords" content={keywords} />}
      </Head>
      {SEOOverride}
      <div className="wrapper">{children}</div>
      <Footer />
    </>
  );
};

export default MainLayout;
