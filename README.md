# Loggit - Web App

[![](https://github.com/BrunoBernardino/loggit-web/workflows/Run%20Tests/badge.svg)](https://github.com/BrunoBernardino/loggit-web/actions?workflow=Run+Tests)

This is the web app for the [Loggit app](https://loggit.net), built with Next.js and deployed to AWS with Serverless.

This is v2, which is [end-to-end encrypted via userbase](https://userbase.com), and works via web on any device (it's a PWA - Progressive Web App).

It's not compatible with Loggit v1 (not end-to-end encrypted), which you can still get locally from [this commit](https://github.com/BrunoBernardino/loggit-web/tree/84052355f46472998b8b60975304d69740513f21) and built in [here](https://v1.loggit.net). You can still export and import the data as the JSON format is the same (unencrypted).

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
- [ ] Improve UI/UX in general
- [ ] Improve dark/light mode
