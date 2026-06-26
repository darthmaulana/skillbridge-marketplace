# Final Testing Checklist

Date: 2026-06-20

## Verification Performed

- `npm run typecheck` passed.
- `npm run build` passed with all app, admin, dynamic post/profile, and PWA routes generated.
- Production local route probes returned HTTP 200 for:
  - `/`, `/login`, `/home`, `/search`, `/create`, `/chat`, `/profile`, `/profile/edit`, `/verification`
  - `/posts/1`, `/posts/1/report`, `/profile/demo-rizky`, `/profile/demo-rizky/report`
  - `/admin`, `/admin/users`, `/admin/posts`, `/admin/reports`, `/admin/verifications`
  - `/manifest.webmanifest`, `/offline.html`, `/icon.svg`
- PWA manifest, service worker, icon, and offline fallback files are present.
- Demo mode is available when Supabase env vars are not configured.

## Milestone 16 Flow Results

1. New user registers: supported in demo mode and Supabase mode through the login/register screen.
2. User edits profile: supported with validation, avatar preview/upload path, and persisted demo/Supabase profile update.
3. User creates online job post: supported through create-post flow and persisted demo/Supabase insert path.
4. User creates skill post: supported through create-post flow with price/rate and portfolio fields.
5. Unverified user tries to create offline post and is blocked: verified in UI and hardened in the shared create-post helper.
6. User submits KTP verification: supported with private-file validation, consent, pending status, and private Supabase bucket upload path.
7. Admin approves verification: supported through admin verification dashboard and review_verification_request RPC/demo fallback.
8. Verified user creates offline job post: supported once verification_status is approved and offline_job_access is true.
9. Verified user contacts another verified user: supported through post-linked chat and offline bilateral verification checks.
10. User reports a post: supported through post report route and submit_safety_report RPC/demo fallback.
11. User blocks another user: supported during report submission; blocked users are hidden from feeds/profiles/chats where possible.
12. Admin reviews report: supported through /admin/reports and admin_review_report RPC/demo fallback.
13. Mobile PWA works properly: manifest, theme color, service worker registration, icon, and offline fallback are present and route-tested.

## Known Issues / Limits

- Browser click-through testing could not be completed in this Codex session because the in-app browser control tool was not exposed.
- Real Supabase end-to-end testing still requires a live Supabase project, env vars, applying supabase/schema.sql, and real Storage/Auth configuration.
- Demo KTP preview uses placeholders; real signed image previews only work after Supabase Storage is configured.
- The F: drive development server was slow in next dev; production next start route checks were healthy.

## Suggested Next Improvements

- Deploy to Vercel or another Next.js host with Supabase env vars.
- Run manual mobile-device QA for camera/file upload, install prompt, offline fallback, and touch ergonomics.
- Add automated Playwright tests for auth/demo flows, post creation, verification, chat, report/block, and admin review.
- Add seed SQL or admin setup instructions for creating the first admin profile in Supabase.
