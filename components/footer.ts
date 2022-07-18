import { html } from '../lib/utils.ts';

export default function footer() {
  return html`
    <footer>
      <section class="faq">
        <h3>Frequently asked questions</h3>

        <div class="faq-items">
          <article class="faq-item" data-has-invalid-session>
            <h4>What is Loggit?</h4>
            <p>
              Simple and encrypted event management.
              <a href="https://loggit.net">Read more here</a>.
            </p>
          </article>

          <article class="faq-item hidden" data-has-valid-session>
            <h4>How can I import/export data?</h4>
            <p>
              <a href="/settings">In your settings</a>.
            </p>
          </article>

          <article class="faq-item">
            <h4>Where's the code for this web app?</h4>
            <p>
              <a href="https://github.com/BrunoBernardino/loggit-web">It's in GitHub</a>.
            </p>
          </article>

          <article class="faq-item hidden" data-has-valid-session>
            <h4>How can I change my email or password / ecryption key?</h4>
            <p>
              <a href="/settings">In your settings</a>.
            </p>
          </article>

          <article class="faq-item hidden" data-has-valid-session>
            <h4>How can I manage my subscription?</h4>
            <p>
              <a href="/billing">In your billing section</a>.
            </p>
          </article>

          <article class="faq-item" data-has-invalid-session>
            <h4>How can I subscribe?</h4>
            <p>
              <a href="/pricing">In the pricing section</a>.
            </p>
          </article>
        </div>
      </section>
      <h3 class="links">
        <a href="https://loggit.net/blog">Blog</a> | 
        <a href="https://loggit.net/privacy">Privacy Policy</a> | 
        <a href="mailto:me@brunobernardino.com">Get Help</a> | <span class="by">by</span> 
        <a href="https://brunobernardino.com">Bruno Bernardino</a>
      </h3>
    </footer>
  `;
}
