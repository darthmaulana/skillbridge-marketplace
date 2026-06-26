# Public Deployment Guide

This app can be made public in two ways:

- Web app: hosted on a public URL.
- Android app: shared as an APK or published through Google Play.

Start with the web app first. It is faster and easier to test.

## 1. Public Web App

The project uses Next.js static export. After building, the public website files are generated in:

```text
out
```

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
```

5. Set build command:

```bash
npm run build
```

6. Set output directory:

```text
out
```

7. Deploy.

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

