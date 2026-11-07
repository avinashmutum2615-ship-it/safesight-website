# SafeSight website and clinic workspace

Static clinic website with connected booking and role-based staff pages.

- `Appointment.html`: doctor/slot selection and appointment requests.
- `login.html`: email/password staff sign-in.
- `dashboard.html`: appointments, patients, consultation queue, staff creation, doctor availability and AI chat.
- `appointment-details.html`: confirmation, rescheduling and check-in.
- `consultation.html`: examination, prescription, printing and completion.
- `config.js`: backend origin for separate hosting. Leave empty for same-origin hosting.

Use the companion `safesight-ai-backend` repository and its `SETUP.md`. Put both repositories in the same parent directory, configure the backend `.env`, seed the first administrator, and start the backend. With `FRONTEND_DIR=../safesight-website`, open http://localhost:3000/.

This static website requires no build. `npm ci` and `npm test` install/run the DOM interaction test suite only. Tests use API fixtures; they do not establish real database or AI behavior. Backend integration tests cover the database workflow.

There is no shared admin access code. Each staff member uses their own account, created by an administrator. Requests remain pending until staff confirm them. No SMS/email delivery is configured. Patient data is rendered as text; staff API calls send the session token.

For separate hosting, set `window.SAFESIGHT_API_BASE` in `config.js` to the backend HTTPS origin and configure that frontend origin in backend `CORS_ORIGINS`.
