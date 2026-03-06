"use client";
import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const user = useQuery(api.user.getUserByContact, {
    contact: session?.user?.contact || "",
  });

  const name =
    user?.fullname || session?.user?.name || session?.user?.firstName || "User";
  const email = user?.email || session?.user?.email || "—";
  const phone = user?.contact || (session?.user as any)?.phone || "—";
  const role = user?.role || "Member";
  const position = user?.position || "Partner";
  const country = user?.countryCode || "—";
  const joinDate = user?._creationTime
    ? new Date(user._creationTime).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const inviteCode =
    user?.invitationCode || (session as any)?.user?.invitationCode || "";
  const inviteUrl = inviteCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?${inviteCode}`
    : "";

  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyUrl = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const balance = (
    user?.depositAmount ||
    (session as any)?.user?.depositAmount ||
    0
  ).toLocaleString("en-US", { minimumFractionDigits: 2 });

  const earnings = (
    user?.earnings ||
    (session as any)?.user?.earnings ||
    0
  ).toLocaleString("en-US", { minimumFractionDigits: 2 });

  return (
    <main
      style={{ fontFamily: "'DM Sans', sans-serif" }}
      className="min-h-screen bg-[#F0F4F3] text-gray-800 selection:bg-emerald-100 selection:text-emerald-900"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        
        .stat-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.07); }
        .action-link { transition: all 0.2s ease; }
        .action-link:hover { transform: translateX(3px); }
        .copy-btn { transition: all 0.15s ease; }
        .copy-btn:hover { transform: scale(1.05); }
        .copy-btn:active { transform: scale(0.97); }
        .nav-link { position: relative; }
        .nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1.5px; background: #059669; border-radius: 2px; transition: width 0.2s ease; }
        .nav-link:hover::after { width: 100%; }
        .nav-active::after { width: 100% !important; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.45s ease both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.12s; }
        .fade-up-3 { animation-delay: 0.19s; }
        .fade-up-4 { animation-delay: 0.26s; }
      `}</style>

     

      {/* ── Page Body ── */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Page header */}
          <div className="fade-up fade-up-1 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-1">Account</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your personal information and settings.</p>
            </div>
            <button
              onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
              className="sm:hidden flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

            {/* ── Left column ── */}
            <div className="space-y-5">

              {/* Profile card */}
              <div className="fade-up fade-up-2 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                {/* Banner */}
                <div className="h-20 bg-gradient-to-r from-emerald-500 to-teal-500 relative">
                  <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E\")" }}
                  />
                </div>

                {/* Avatar */}
                <div className="px-6 pb-6">
                  <div className="-mt-5 mb-4">
                    <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-emerald-600 bg-emerald-50">
                      {name.charAt(0)}
                    </div>
                  </div>

                  <h2 className="text-lg font-bold text-gray-900 leading-tight">{name}</h2>
                  <p className="text-sm text-gray-400 mb-3">{email}</p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-semibold uppercase tracking-wide">
                      {role}
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-semibold uppercase tracking-wide">
                      {position}
                    </span>
                  </div>

                  <div className="divide-y divide-gray-50 text-sm">
                    {[
                      { label: "Status", value: <span className="flex items-center gap-1.5 text-emerald-600 font-semibold"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />Verified</span> },
                      { label: "Joined", value: joinDate },
                      { label: "Country", value: country },
                      { label: "Phone", value: phone },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between items-center py-2.5">
                        <span className="text-gray-400">{row.label}</span>
                        <span className="font-medium text-gray-800">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Invitation Card ── */}
              <div className="fade-up fade-up-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white border border-slate-700/50 shadow-lg relative overflow-hidden">
                {/* decorative ring */}
                <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[24px] border-white/5 pointer-events-none" />
                <div className="absolute -right-2 -bottom-6 w-24 h-24 rounded-full border-[16px] border-white/5 pointer-events-none" />

                <div className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <h4 className="text-sm font-bold text-white">Invitation</h4>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">Share your code or link to grow your team</p>

                  {/* Code row */}
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Code</p>
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
                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="1.8" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* URL row */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Invite Link</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap"
                        title={inviteUrl || "No code available"}
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        {inviteUrl
                          ? inviteUrl.replace(/^https?:\/\//, "")
                          : "——"}
                      </div>
                      <button
                        onClick={handleCopyUrl}
                        className="copy-btn shrink-0 w-9 h-9 flex items-center justify-center bg-emerald-500/80 hover:bg-emerald-500 border border-emerald-400/30 rounded-lg text-sm"
                        title="Copy invite URL"
                        disabled={!inviteUrl}
                      >
                        {copiedUrl ? (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5">
                      {copiedUrl ? "✓ Link copied!" : copiedCode ? "✓ Code copied!" : "Tap the link icon to copy the full URL"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right column ── */}
            <div className="space-y-5">

              {/* Stats row */}
              <div className="fade-up fade-up-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Balance */}
                <div className="stat-card bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Balance</p>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${balance}</p>
                  <p className="text-xs text-gray-400 mt-1">Total wallet balance</p>
                </div>

                {/* Earnings */}
                <div className="stat-card bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Earnings</p>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${earnings}</p>
                  <Link href="/withdraw" className="text-xs text-blue-500 hover:text-blue-700 font-semibold mt-1 inline-block underline underline-offset-2">
                    Withdraw →
                  </Link>
                </div>

                {/* Devices */}
                <div className="stat-card bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">My Devices</p>
                    <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">1</p>
                  <p className="text-xs text-gray-400 mt-1">Active device</p>
                </div>
              </div>

              {/* Actions card */}
              <div className="fade-up fade-up-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5">Account Actions</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Deposit */}
                  <Link
                    href="/deposit"
                    className="action-link group flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/60 transition-all"
                  >
                    <div className="w-11 h-11 shrink-0 rounded-xl bg-gray-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors text-xl">
                      💰
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">Deposit</p>
                      <p className="text-xs text-gray-400 truncate">Add funds to your wallet</p>
                    </div>
                    <svg className="w-4 h-4 ml-auto shrink-0 text-gray-300 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  {/* Withdraw */}
                  <Link
                    href="/withdraw"
                    className="action-link group flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/60 transition-all"
                  >
                    <div className="w-11 h-11 shrink-0 rounded-xl bg-gray-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors text-xl">
                      💸
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">Withdraw</p>
                      <p className="text-xs text-gray-400 truncate">Cash out your earnings</p>
                    </div>
                    <svg className="w-4 h-4 ml-auto shrink-0 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Info strip */}
              <div className="fade-up fade-up-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Role", value: role },
                  { label: "Position", value: position },
                  { label: "Country", value: country },
                  { label: "Member since", value: joinDate.split(",")[0] },
                ].map((item) => (
                  <div key={item.label} className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}