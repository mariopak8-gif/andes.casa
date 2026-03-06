import CredentialsProvider from "next-auth/providers/credentials";
import type { DefaultSession, NextAuthOptions, Session } from "next-auth";
import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import { isAuthorizedAdmin } from "@/lib/adminAuth";

// Extend the default session types

declare module "next-auth" {
  interface User {
    id?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    contact?: string;
    status?: string;
  }
  interface Session {
    user: {
      id?: string;
      role?: string;
      firstName?: string;
      lastName?: string;
      contact?: string;
      status?: string;
    } & DefaultSession["user"];
  }
}

// Custom error for authentication failures
class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

// Types for better type safety
export interface ConvexUser {
  _id: string;
  contact: string;
  firstname?: string;
  lastname?: string;
  password?: string;
  role: string;
  image?: string;
  resetToken?: string;
  resetTokenExpiry: number;
  status?: string;
}

// Centralized logging utility
const logger = {
  error: (context: string, error: unknown) => {
    console.error(
      `[AUTH ERROR - ${context}]`,
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error,
    );
  },
  info: (context: string, message: string) => {
    // console.log(`[AUTH INFO - ${context}]`, message);
  },
};

// Utility for safe fetch with improved error handling
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  context: string = "Fetch",
): Promise<any> {
  try {
    const response = await fetch(url, {
      ...options,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new AuthenticationError(
        `${context} failed: ${response.status} ${errorBody}`,
      );
    }

    return await response.json();
  } catch (error) {
    logger.error(context, error);
    throw error;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        contact: { label: "contact or Username", type: "text" },
        password: { label: "Password", type: "password" },
        countryCode: { label: "Country Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.contact || !credentials?.password) {
          throw new Error("Phone number and password are required");
        }

        // ✅ This is why it "sometimes" fails — relative URL has no base in SSR
        const baseUrl =
          process.env.NEXTAUTH_URL ??
          (process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:3000");

        console.log({credentials,baseUrl})
        try {
          const response = await fetch(`${baseUrl}/api/auth/convex-auth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contact: credentials.contact,
              password: credentials.password,
              countryCode: credentials.countryCode ?? "",
            }),
          });

          const result = await response.json().catch(() => null);

          if (!response.ok || !result?.user) {
            // ✅ Throw real message — NextAuth will pass it as ?error= on sign-in page
            throw new Error(result?.error ?? "Invalid credentials");
          }

          return result.user;
        } catch (error: any) {
          throw new Error(error.message ?? "Authentication failed");
        }
      },
    }),
  ],

  pages: {
    signIn: "/sign-in",
    error: "/error",
    signOut: "/",
  },

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.contact = user.contact;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.status = user.status;
        token.invitationCode = user.invitationCode;
        token.invitationExpiry = user.invitationExpiry;
        // Set role based on authorization - NOT hardcoded
        token.role = "user";
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.email = (token.email as string) || session.user.email;
        session.user.contact = (token.contact as string) || "";
        (session.user as any).firstName = token.firstName as string;
        (session.user as any).lastName = token.lastName as string;
        (session.user as any).status = token.status as string;
        (session.user as any).invitationCode = token.invitationCode as string;
        (session.user as any).invitationExpiry =
          token.invitationExpiry as number;

        // Check if user is authorized admin
        if (isAuthorizedAdmin(session)) {
          session.user.role = "admin";
        } else {
          session.user.role = "user";
        }
      }
      return session;
    },

    async signIn({ account }: { account?: any }) {
      if (account?.provider === "credentials") {
        return true;
      }
      return true;
    },

    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      try {
        if (
          url === baseUrl ||
          url.includes("/sign-in") ||
          url.includes("/register")
        ) {
          return `${baseUrl}/dashboard`;
        }
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        if (new URL(url).origin === baseUrl) return url;
        return `${baseUrl}/dashboard`;
      } catch (error) {
        logger.error("Redirect", error);
        return `${baseUrl}/dashboard`;
      }
    },
  },

  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },

  secret:
    process.env.NEXTAUTH_SECRET || "your-default-secret-change-in-production",
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export const GET = handler;
export const POST = handler;
