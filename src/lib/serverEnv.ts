import "server-only";

export const serverEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  midtransMerchantId: process.env.MIDTRANS_MERCHANT_ID,
  midtransClientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
  midtransSecretKey: process.env.MIDTRANS_SECRET_KEY,
  midtransIsProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL,
};

export function getAppUrl() {
  const rawUrl = serverEnv.appUrl;
  if (!rawUrl) return "http://localhost:3000";
  return rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
}
