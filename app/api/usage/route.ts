import { NextResponse } from "next/server";

const GLOBAL_DAILY_LIMIT = 30;
const PER_IP_DAILY_LIMIT = 5;

const g = globalThis as any;
g.__talkscope = g.__talkscope || { day: "", globalCount: 0, byIp: {} };

function todayKeyUTC() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}

export async function GET(req: Request) {
  const state = g.__talkscope;
  const day = todayKeyUTC();

  if (state.day !== day) {
    state.day = day;
    state.globalCount = 0;
    state.byIp = {};
  }

  const ip = getClientIp(req);
  const used = state.byIp[ip] ?? 0;

  return NextResponse.json({
    used,
    remaining: Math.max(0, PER_IP_DAILY_LIMIT - used),
    globalUsed: state.globalCount,
    globalRemaining: Math.max(0, GLOBAL_DAILY_LIMIT - state.globalCount),
    limit: PER_IP_DAILY_LIMIT,
  });
}
