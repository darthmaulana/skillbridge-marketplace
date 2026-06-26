
# SkillBridge

Mobile-first Next.js job and skill marketplace PWA based on the supplied Figma design.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

Copy `.env.example` to `.env.local` and add your Supabase project URL and anon key before enabling database-backed features.

## Current implementation

- Responsive marketplace feed, search, filters, post details, and profile
- Job and skill post creation with offline verification rules
- Chat, reporting, identity verification, and admin review screens
- Persistent demo posts and verification state using local storage
- Installable PWA manifest, service worker, icon, and offline fallback
- Supabase PostgreSQL schema, private verification bucket, and RLS policies in `supabase/schema.sql`
- Next.js App Router foundation and Supabase browser/server client helpers
- Real routes for home, search, create, posts, chat, profile, verification, login, and admin verification
- Shared mobile app shell, route-aware bottom navigation, protected user layout, and admin layout
- Supabase email/password and Google authentication, password reset, session listening, and automatic profile creation
- Supabase-backed home feed with newest sorting, safe public author summaries, filters, search, loading, error, and empty states
- Database-backed job and skill creation with complete fields, verification enforcement, image upload, validation, and publish feedback
- Full post details with job/skill-specific fields, safe author preview, bilateral offline verification, and database-level location privacy
- Editable profiles with avatar upload, bio, skills, portfolio, and location
- Privacy-safe public profile routes with verification badges and each user's published posts
- Supabase-backed conversation list, post-linked chats, persistent text messages, and realtime message updates
- Database-enforced chat blocking and bilateral verification rules for offline work
- Private KTP and selfie submission with file validation, persisted review status, rejection reasons, and resubmission
- Admin verification queue with expiring signed previews, approval, rejection, resubmission, account bans, and audit logs
- Data-backed admin overview plus searchable user, post, and report management pages
- Persistent post/user reporting with optional blocking and cross-feed, profile, chat, and contact restrictions
- Mobile polish pass covering safe-area action bars, accessible controls, clean admin/report text, and fresh demo feed dates
- Final Milestone 16 testing summary in `FINAL_TESTING_CHECKLIST.md`

Without Supabase credentials, authentication automatically uses a clearly labeled local demo mode. Never place KTP images in a public bucket.
  


