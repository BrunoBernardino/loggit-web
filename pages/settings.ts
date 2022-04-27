import { html, PageContentResult } from '../lib/utils.ts';

export function pageAction() {
  return new Response('Not Implemented', { status: 501 });
}

export function pageContent() {
  const htmlContent = html`
    <section class="main-section">
      <h1>Settings</h1>
      <section class="hero" data-has-invalid-session>
        <p>Before you can change your settings, you need to <a href="/">Signup or Login</a> first.</p>
      </section>
      <section class="hidden" data-has-valid-session>
        <h2>Import/Export data</h2>
        <p>
          You can import a JSON file exported from Loggit (v1 or v2) before. <a href="https://loggit.net/import-export-file-format">Learn more about the file format</a>.
        </p>
        <div class="buttons-wrapper">
          <button type="button" id="import-button">
            Import data
          </button>
          <span class="or">&nbsp;</span>
          <button type="button" id="export-button">
            Export data
          </button>
        </div>
      </section>
      <section class="hidden" data-has-valid-session style="margin-top: 2rem;">
        <h2>Change Email</h2>
        <p>
          When you change your email or password, you'll need to login in other devices again.
        </p>
        <form id="change-email-form">
          <fieldset class="input-wrapper">
            <label for="new-email">New Email</label>
            <input
              id="new-email"
              type="email"
              placeholder="you@example.com"
              name="new-email"
            />
          </fieldset>
          <button type="submit" id="change-email-button">
            Change email
          </button>
        </form>
      </section>
      <section class="hidden" data-has-valid-session style="margin-top: 2rem;">
        <h2>Change Password / Encryption Key</h2>
        <form id="change-password-form">
          <fieldset class="input-wrapper">
            <label for="current-password">Current Password / Encryption Key</label>
            <input
              id="current-password"
              type="password"
              placeholder="something secret"
              name="current-password"
            />
          </fieldset>
          <fieldset class="input-wrapper">
            <label for="new-password">New Password / Encryption Key</label>
            <input
              id="new-password"
              type="password"
              placeholder="something even more secret"
              name="new-password"
            />
          </fieldset>
          <button type="submit" id="change-password-button">
            Change password / encryption key
          </button>
        </form>
      </section>
    </section>

    <script src="/public/js/settings.js"></script>
  `;

  return {
    htmlContent,
    titlePrefix: 'Settings',
    description: 'Settings for Loggit.',
  } as PageContentResult;
}
