import Link from 'next/link';

import styles from './Footer.module.scss';

const Footer = ({ hasValidSession }: { hasValidSession: boolean }) => {
  return (
    <footer className={styles.Footer}>
      <section className={styles.Footer__faq}>
        <h3>Frequently asked questions</h3>

        <div className={styles['Footer__faq-items']}>
          <div className={styles['Footer__faq-item']}>
            <h4>What is Loggit?</h4>
            <p>
              Simple and encrypted event management.{' '}
              <a href="https://loggit.net">Read more here</a>.
            </p>
          </div>

          {hasValidSession ? (
            <>
              <div className={styles['Footer__faq-item']}>
                <h4>How can I manage my subscription?</h4>
                <p>
                  <Link href="/billing">
                    <a>In your billing section</a>
                  </Link>
                  .
                </p>
              </div>
              <div className={styles['Footer__faq-item']}>
                <h4>How can I change my email or password / ecryption key?</h4>
                <p>
                  <Link href="/email-password">
                    <a>Right here</a>
                  </Link>
                  .
                </p>
              </div>
            </>
          ) : (
            <div className={styles['Footer__faq-item']}>
              <h4>How can I subscribe?</h4>
              <p>
                <Link href="/pricing">
                  <a>In the pricing section</a>
                </Link>
                .
              </p>
            </div>
          )}

          <div className={styles['Footer__faq-item']}>
            <h4>Where's the code for this web app?</h4>
            <p>
              <a href="https://github.com/BrunoBernardino/loggit-web">
                It's in GitHub
              </a>
              .
            </p>
          </div>
        </div>
      </section>
      <h3 className={styles.Footer__links}>
        <a href="https://loggit.net/privacy">Privacy Policy</a> |{' '}
        <a href="mailto:me@brunobernardino.com">Get Help</a> | by{' '}
        <a href="https://brunobernardino.com">Bruno Bernardino</a>
      </h3>
    </footer>
  );
};

export default Footer;
