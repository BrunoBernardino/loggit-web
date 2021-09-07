# Loggit - Web App

[![](https://github.com/BrunoBernardino/loggit-web/workflows/Run%20Tests/badge.svg)](https://github.com/BrunoBernardino/loggit-web/actions?workflow=Run+Tests)

This is the web app for the [Loggit app](https://loggit.net), built with Next.js and deployed to AWS with Serverless.

It runs completely in the browser, using `localStorage` and `IndexedDB`.

It's not thoroughly tested just yet, so it's available but not announced.

## Development

```bash
make install  # installs dependencies
make start  # starts the app
make pretty  # prettifies the code
make test  # runs linting and tests
make deploy  # deploys to app.loggit.net (requires `serverless` to be installed globally)
```

## TODOs

- [ ] Tweak colors + UI
- [ ] Allow using app without a Sync Token
- [ ] Improve UI/UX in general
- [ ] Improve dark/light mode
- [ ] Improve mobile view (collapse panels and show tab bar to navigate between them?)
