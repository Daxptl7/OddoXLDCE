# GlobeTrotter — frontend

Not built yet. The design lands here.

    src/
      api/          API client — already written, talks to the backend
      components/   shared UI
      pages/        one file per screen
      hooks/        data-fetching hooks
      context/      auth/session context
      lib/          formatters, helpers
      styles/       Tailwind entry
      assets/

Every backend call is already wrapped in `src/api/client.js` — see
`../docs/API.md` for the endpoint list and response shapes.

    npm install
    cp .env.example .env
    npm run dev
