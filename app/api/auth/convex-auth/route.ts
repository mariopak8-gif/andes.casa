import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
const convex = new ConvexHttpClient(convexUrl);

export async function POST(request: Request) {
  try {
    const { contact, password, countryCode } = await request.json();

    if (!contact || !password) {
      return Response.json(
        { error: "Phone number and password are required" },
        { status: 400 }
      );
    }

    // ✅ Password verified inside Convex — same runtime that hashed it
    const result = await convex.query(api.user.authenticateUser, {
      contact,
      password, // raw password — Convex hashes and compares internally
    });
    console.log({result});
    
    if (!result.success || !result.user) {
      console.log("[convex-auth] Auth failed:", result.error);
      return Response.json(
        { error: result.error || "Invalid credentials" },
        { status: 401 }
      );
    }

    // Optional: validate countryCode matches what's stored
    if (countryCode && result.user.countryCode !== countryCode) {
      console.log("[convex-auth] Country code mismatch:", 
        result.user.countryCode, "vs", countryCode);
      return Response.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    console.log("[convex-auth] Auth successful:", contact);
    return Response.json({ user: result.user });

  } catch (error: any) {
    console.error("[convex-auth] Unexpected error:", error);
    return Response.json(
      { error: "Authentication service unavailable" },
      { status: 500 }
    );
  }
}