"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import TeamReport from "@/components/TeamReport";
import InviteCard from "@/components/InviteCard";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const TeamPage = () => {
  const { data: session } = useSession();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const user = useQuery(api.user.getUserByContact, {
    contact: session?.user?.contact || "",
  });
  const inviteCode =
    user?.invitationCode || (session as any)?.user?.invitationCode || "";
  const inviteUrl = inviteCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?${inviteCode}`
    : "";

  const handleCopyUrl = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };
   const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="min-h-screen mb-20 bg-gray-50 font-montserrat text-gray-800">
      {/* Header: consistent, sticky, simple */}
      <header className="sticky z-50 top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <Link
                href="/profile"
                className="inline-flex items-center text-gray-700 hover:opacity-80"
              >
                ← Back
              </Link>
            </div>
            <div className="text-center flex-1">
              <h1 className="text-lg font-semibold text-gray-900">
                Team report
              </h1>
            </div>
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* Main content container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Responsive grid: main report + invite card on the side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <TeamReport />
            </div>
          </div>

          <aside className="md:col-span-1">
            {/* ── Invitation Card ── */}
            <div className="fade-up fade-up-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white border border-slate-700/50 shadow-lg relative overflow-hidden">
              {/* decorative ring */}
              <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[24px] border-white/5 pointer-events-none" />
              <div className="absolute -right-2 -bottom-6 w-24 h-24 rounded-full border-[16px] border-white/5 pointer-events-none" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="w-4 h-4 text-emerald-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <h4 className="text-sm font-bold text-white">Invitation</h4>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Share your code or link to grow your team
                </p>

                {/* Code row */}
                <div className="mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                    Code
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 font-mono text-sm font-bold tracking-widest text-center text-white overflow-hidden text-ellipsis whitespace-nowrap"
                      title={inviteCode || "------"}
                    >
                      {inviteCode || "——————"}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="copy-btn shrink-0 w-9 h-9 flex items-center justify-center bg-white/15 hover:bg-white/25 border border-white/15 rounded-lg text-sm"
                      title="Copy code"
                    >
                      {copiedCode ? (
                        <svg
                          className="w-4 h-4 text-emerald-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 text-slate-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            strokeWidth="1.8"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                            d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* URL row */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                    Invite Link
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap"
                      title={inviteUrl || "No code available"}
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {inviteUrl ? inviteUrl.replace(/^https?:\/\//, "") : "——"}
                    </div>
                    <button
                      onClick={handleCopyUrl}
                      className="copy-btn shrink-0 w-9 h-9 flex items-center justify-center bg-emerald-500/80 hover:bg-emerald-500 border border-emerald-400/30 rounded-lg text-sm"
                      title="Copy invite URL"
                      disabled={!inviteUrl}
                    >
                      {copiedUrl ? (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    {copiedUrl
                      ? "✓ Link copied!"
                      : copiedCode
                        ? "✓ Code copied!"
                        : "Tap the link icon to copy the full URL"}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default TeamPage;
