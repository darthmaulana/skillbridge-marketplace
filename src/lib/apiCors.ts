import { NextResponse } from "next/server";

export const apiCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function corsJson(body: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...apiCorsHeaders,
      ...init?.headers,
    },
  });
}

export function corsOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: apiCorsHeaders,
  });
}
