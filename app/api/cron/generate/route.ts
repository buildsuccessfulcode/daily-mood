import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  generateDailyQuotes,
  getGeminiApiKey,
  getGeminiModel,
} from "@/lib/generate";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const left = Buffer.from(header, "utf8");
  const right = Buffer.from(expected, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const [apiKey, model] = await Promise.all([
      getGeminiApiKey(),
      getGeminiModel(),
    ]);
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "AI key Gemini belum diatur" },
        { status: 400 },
      );
    }

    const generated = await generateDailyQuotes(apiKey, model);
    return NextResponse.json({ success: true, generated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "error" },
      { status: 500 },
    );
  }
}
