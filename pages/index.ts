import { helpEmail, html, PageContentResult } from '/lib/utils.ts';
import verificationCodeModal from '/components/modals/verification-code.ts';

export function pageAction() {
  return new Response('Not Implemented', { status: 501 });
}

export function pageContent() {
  const htmlContent = html`
    <section class="main-section">
      <div data-has-invalid-session>
        <h1>Simple + Encrypted Event Management</h1>
        <section class="hero">
          <p>
            Loggit is a simple and <strong>encrypted</strong> event management
            app. You can <a href="https://loggit.net">learn more about it here</a>, as this
            is the app.
          </p>
          <p>
            Currently it's available on every device via web browser, and you
            can browse its source code.
          </p>
          <p>
            You have a <strong>30-day free trial</strong> (no credit card
            required), and at the end, you can pay <strong>€18 / year</strong>,
            or <strong>€2 / month</strong>, no limits.
          </p>
          <form id="login-form">
            <fieldset class="input-wrapper">
              <label for="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                name="email"
              />
            </fieldset>
            <fieldset class="input-wrapper">
              <label for="password">Password / Encryption Key</label>
              <input
                id="password"
                type="password"
                placeholder="something secret"
                name="password"
              />
            </fieldset>
            <div class="buttons-wrapper">
              <button type="submit" id="login-button">
                Login
              </button>
              <span class="or">or</span>
              <button type="button" id="signup-button">
                Signup
              </button>
            </div>
          </form>
          <p>
            Note that logging in will take up a few seconds. This is
            intentional, in order to generate a safer assymetric encryption key.
            After logging in, the app should be blazing fast in any device.
          </p>
        </section>
        <h2>Need help?</h2>
        <p>
          If you're having any issues or have any questions, <strong><a href="mailto:${helpEmail}">please reach out</a></strong>.
        </p>
      </div>
      
      <div data-has-valid-session class="hidden panels">
        <div class="left-panel">
          <div class="panels">
            <section class="event-stats-wrapper">
              <span class="text">
                Below you can see some stats for your top 10 logged events, and the date they were last logged.
              </span>
              <section id="event-stats">
              
              </section>
            </section>

            <section class="events-wrapper">
              <section id="month-navigation">
                <svg id="month-navigation-previous" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M224 480c-8.188 0-16.38-3.125-22.62-9.375l-192-192c-12.5-12.5-12.5-32.75 0-45.25l192-192c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25L77.25 256l169.4 169.4c12.5 12.5 12.5 32.75 0 45.25C240.4 476.9 232.2 480 224 480z"/></svg>
                <span id="current-month">...</span>
                <svg id="month-navigation-next" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M96 480c-8.188 0-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L242.8 256L73.38 86.63c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l192 192c12.5 12.5 12.5 32.75 0 45.25l-192 192C112.4 476.9 104.2 480 96 480z"/></svg>
              </section>
              
              <section id="events">

              </section>
            </section>
          </div>
        </div>

        <section id="add-event">
          <span class="text">
            Tap on a frequent event below to quickly add it for today.
          </span>

          <section id="top-events">

          </section>

          <form id="add-event-form">
            <span class="text">
              Fill out the form below to add a new event.
            </span>
            <fieldset class="input-wrapper">
              <label for="event-name">Name</label>
              <input
                id="event-name"
                placeholder="Volunteering"
                autocomplete="off"
                type="text"
              />
            </fieldset>

            <fieldset class="input-wrapper">
              <label for="event-date">Date</label>
              <input
                id="event-date"
                placeholder="Today"
                autocomplete="off"
                type="date"
              />
            </fieldset>
            
            <button type="submit" id="add-event-button">Add Event</button>
          </form>
        </section>
      </div>
    </section>

    <template id="event-item">
      <section class="event-item" data-id="{event.id}">
        <article>
          <span>{event.name}</span>
        </article>
        <time>{event.date}</time>
      </section>
    </template>

    <template id="top-event-item">
      <section class="event-item top" data-event-name="{event.name}">
        <article>
          <span>{event.name}</span>
        </article>
      </section>
    </template>

    <template id="event-stat-item">
      <section class="event-item stat" data-id="{event.id}">
        <span class="name">{event.name}</span>
        <span class="frequency">{event.frequency}</span>
        <time>{event.lastDate}</time>
      </section>
    </template>

    <template id="edit-event-modal">
      <swal-title>
        Edit event
      </swal-title>
      <swal-html>
        <form id="edit-event-form">
          <fieldset class="input-wrapper">
            <label for="event-name">Name</label>
            <input
              id="edit-event-name"
              placeholder="Volunteering"
              autocomplete="off"
              type="text"
            />
          </fieldset>

          <fieldset class="input-wrapper">
            <label for="event-date">Date</label>
            <input
              id="edit-event-date"
              placeholder="Today"
              autocomplete="off"
              type="date"
            />
          </fieldset>
        </form>
      </swal-html>
      <swal-button type="confirm">
        Save
      </swal-button>
      <swal-button type="cancel">
        Cancel
      </swal-button>
      <swal-button type="deny">
        Delete
      </swal-button>
    </template>

    <template id="choose-month-modal">
      <swal-title>
        Navigate to month
      </swal-title>
      <swal-html>
        <form id="choose-month-form">
          <fieldset class="input-wrapper">
            <label for="choose-month-input">Month</label>
            <input
              id="choose-month-input"
              type="date"
            />
          </fieldset>
        </form>
      </swal-html>
      <swal-button type="confirm">
        Go
      </swal-button>
      <swal-button type="cancel">
        Cancel
      </swal-button>
    </template>

    ${verificationCodeModal()}

    <script src="/public/ts/index.ts" type="module"></script>
  `;

  return {
    htmlContent,
    titlePrefix: '',
  } as PageContentResult;
}
