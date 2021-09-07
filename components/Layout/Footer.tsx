import './Footer.scss';

const Footer = () => {
  return (
    <footer className="Footer">
      <section className="Footer__faq">
        <h3>Frequently asked questions</h3>

        <div className="Footer__faq-items">
          <div className="Footer__faq-item">
            <h4>What is Loggit?</h4>
            <p>
              Simple and easy event management.{' '}
              <a href="https://loggit.net">Read more here</a>.
            </p>
          </div>

          <div className="Footer__faq-item">
            <h4>How can I get a Sync Token?</h4>
            <p>
              <a href="https://loggit.net/get-sync-token">
                See instructions here
              </a>
              .
            </p>
          </div>

          <div className="Footer__faq-item">
            <h4>Where's the code for this web app?</h4>
            <p>
              <a href="https://github.com/BrunoBernardino/loggit-app">
                It's in GitHub
              </a>
              .
            </p>
          </div>
        </div>
      </section>
      <h3 className="Footer__links">
        <a href="https://privacy.onbrn.com">Privacy Policy</a> |{' '}
        <a href="mailto:me@brunobernardino.com">Get Help</a> | by{' '}
        <a href="https://brunobernardino.com">Bruno Bernardino</a>
      </h3>
    </footer>
  );
};

export default Footer;
