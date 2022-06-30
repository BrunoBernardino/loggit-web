# Loggit - Web App

[![](https://github.com/BrunoBernardino/loggit-web/workflows/Run%20Tests/badge.svg)](https://github.com/BrunoBernardino/loggit-web/actions?workflow=Run+Tests)

This is the web app for the [Loggit app](https://loggit.net), built with [Deno](https://deno.land) and deployed to [Deno Deploy](https://deno.com/deploy).

This is v2, which is [end-to-end encrypted via userbase](https://userbase.com), and works via web on any device (it's a PWA - Progressive Web App).

It's not compatible with Loggit v1 (not end-to-end encrypted), which you can still get locally from [this commit](https://github.com/BrunoBernardino/loggit-web/tree/84052355f46472998b8b60975304d69740513f21) and built in [here](https://v1.loggit.net). You can still export and import the data as the JSON format is the same (unencrypted).

## Requirements

This was tested with `deno@1.22.0`, though it's possible older versions might work.

There are no other dependencies. **Deno**!

## Development

```sh
$ make start
$ make format
$ make test
```

## Structure

This is vanilla JS, web standards, no frameworks. If you'd like to see/use [the Next.js version deployed to AWS via Serverless, check this commit](https://github.com/BrunoBernardino/loggit-web/tree/065cdc1f3eee3dfd46c70803fcea00906847a5b3).

- Backend routes are defined at `routes.ts`.
- Static files are defined at `public/`.
- Pages are defined at `pages/`.

## Deployment

- Deno Deploy: Just push to the `main` branch. Any other branch will create a preview deployment.

## TODOs:

- [ ] Enable true offline mode (securely cache data, allow read-only)
  - https://github.com/smallbets/userbase/issues/255 has interesting ideas, while it's not natively supported
