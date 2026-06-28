# Public Deployment Guide

This app can be made public in two ways:

- Web app: hosted on a public URL.
- Android app: shared as an APK or published through Google Play.

Start with the web app first. It is faster and easier to test.

## 1. Public Web App

Recommended host: Vercel.

### Deploy To Vercel

1. Push this project to GitHub.
2. Go to:

```text
https://vercel.com
```

3. Import the GitHub repository.
4. Add these environment variables in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zqensbznoeldfzcgoybs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_ADMIN_EMAILS=anfaeydah@gmail.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
MIDTRANS_MERCHANT_ID=your_midtrans_merchant_id_here
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_midtrans_client_key_here
MIDTRANS_SECRET_KEY=your_midtrans_backend_secret_here
MIDTRANS_IS_PRODUCTION=false
```

5. Set build command:

```bash
npm run build
```

6. Leave output directory empty/default.

Do not set output directory to:

```text
out
```

The Android build still uses static export internally, but the Vercel web app needs Next.js server routes for payments and Midtrans webhooks.

7. Deploy.

Before testing payouts, run this Supabase SQL file in the SQL Editor:

```text
supabase/profile-payout-details.sql
```

This adds private payout account fields to user profiles so admins know where to send manual payouts.

Vercel will give a public URL like:

```text
https://your-app.vercel.app
```

## 2. Supabase Auth Settings

After the public web URL exists, update Supabase.

Go to:

```text
Supabase Dashboard -> Authentication -> URL Configuration
```

Set:

```text
Site URL:
https://your-app.vercel.app
```

Add redirect URL:

```text
https://your-app.vercel.app/auth/callback
```

Keep local testing URLs too:

```text
http://localhost:3000/auth/callback
http://127.0.0.1:3000/auth/callback
```

## 3. Android APK

The current debug APK is here:

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

This is okay for testing, but not ideal for public release.

For Google Play, make a signed release build or Android App Bundle.

Typical command:

```bash
cd android
gradlew.bat bundleRelease
```

Before this works for production, release signing must be configured in Android/Gradle.

## Recommended Order

1. Deploy web app on Vercel.
2. Test sign up, login, create post, post detail, profile, chat, report, and admin.
3. Update Supabase redirect URLs.
4. Rebuild APK if needed.
5. Configure Android release signing.
6. Build release `.aab` for Google Play.

## Future Payment System

Payment/escrow is planned as Milestone 17. The implemented flow should work like this:

1. User 1 opens a job/skill post.
2. User 1 starts a chat with User 2, the post owner.
3. Both users agree on the work scope and amount in chat.
4. User 2 creates a bill inside the chat.
5. User 1 pays the bill through SkillBridge/Midtrans.
6. The app marks the payment as held by the platform workflow.
7. User 2 submits completion proof, for example a link and note.
8. User 1 accepts the work if satisfied.
9. Admin can process payout/release according to the platform rules.

This system needs:

- Payment provider account, recommended: Midtrans or Xendit for Indonesia.
- Sandbox keys first, then production keys after testing.
- Server-side environment variables in Vercel for backend payment secrets.
- A webhook URL from the live Vercel domain.
- Supabase tables and RLS policies for orders, payments, disputes, and audit events.

Do not place payment secret keys in client-side `NEXT_PUBLIC_` variables.

Midtrans webhook URL:

```text
https://your-app.vercel.app/api/payments/midtrans-webhook
```

Use sandbox keys first. Rotate any backend payment secret that was pasted into chat or shared outside Vercel/Midtrans.
