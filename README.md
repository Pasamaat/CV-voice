# Erik's CV assistant

React/Vite frontend with an Express API that calls Gemini on the server.

## Local development

Use Node.js 22.12+ (or a newer supported LTS), then run:

```sh
npm ci
```

Copy `.env.example` to `.env` and set `GEMINI_API_KEY`, then run `npm run dev`.
Check the code with `npm run lint` and build with `npm run build`.
To serve the production build locally, set `NODE_ENV=production` and run `npm start`.

## Vercel

Connect the Vercel project to **Pasamaat/CV-voice**, with the repository root as
the root directory. `Pasamaat/cvvoice` is a separate repository.

The checked-in configuration uses the Vite preset, `npm ci`, `npm run build`,
and `dist` as the output directory. `api/index.ts` runs the shared Express API;
the rewrites send API requests there and frontend routes to `index.html`.

Set `GEMINI_API_KEY` in the Vercel project's Environment Variables for each
deployment environment you use, then redeploy. Keep this secret server-side;
do not give it a `VITE_` prefix.

After deployment, `/api/status` should return JSON with `status: "ok"` and
`hasApiKey: true`. Check a chat question to verify the Gemini key, model access,
and streaming response. Without a configured key, chat returns a 401 JSON error.

## Dependency resolution

The old direct `esbuild@^0.25.0` dependency conflicted with Vite 8's optional
peer dependency. No application code uses esbuild directly, so it is removed.
Commit `package-lock.json` with dependency updates and use `npm ci` for repeatable
deployments. No `--force` or `--legacy-peer-deps` flags are needed.
