"use client";

import React, { useEffect, useState, useRef } from "react";
import { useQuery } from "convex/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";

const MOCK_ACTIVITY = [
  "User ****1234 deposited 500 USDT",
  "User ****5678 withdrew 1,200 USDT",
  "User ****9012 deposited 800 USDT",
  "User ****3456 withdrew 250 USDT",
  "User ****7890 deposited 2,000 USDT",
  "User ****2345 withdrew 600 USDT",
  "User ****6789 deposited 150 USDT",
  "User ****0123 withdrew 3,500 USDT",
];

function ActivityTicker({ items }: { items: string[] }) {
  const tickerRef = useRef<HTMLDivElement>(null);
  const doubled = [...items, ...items];
  useEffect(() => {
    const el = tickerRef.current;
    if (!el) return;
    let frame: number;
    let pos = 0;
    const tick = () => {
      pos += 0.5;
      if (pos >= el.scrollWidth / 2) pos = 0;
      el.style.transform = `translateX(-${pos}px)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div className="bg-white border-b border-gray-100 overflow-hidden py-2 flex items-center gap-2 px-4">
      <span className="text-teal-500 flex-shrink-0">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
      </span>
      <div className="overflow-hidden flex-1">
        <div
          ref={tickerRef}
          className="flex gap-8 whitespace-nowrap will-change-transform"
        >
          {doubled.map((item, i) => (
            <span key={i} className="text-xs text-gray-500 flex-shrink-0">
              <span className="text-teal-500 font-semibold">●</span> {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroBanner({
  balance,
  earnings,
}: {
  balance: number;
  earnings: number;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg h-52 sm:h-56">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="absolute top-4 left-5">
        <span className="text-white/90 text-xs font-bold uppercase tracking-widest">
          ANDES Global
        </span>
        <p className="text-white/55 text-[10px] mt-0.5">
          The best investment platform
        </p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 grid grid-cols-2 gap-3">
        <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20">
          <p className="text-white/60 text-[10px] uppercase tracking-wide mb-1">
            Account Balance
          </p>
          <p className="text-white font-bold text-xl leading-none">
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-white/40 text-[10px] mt-1">USDT</p>
        </div>
        <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20">
          <p className="text-white/60 text-[10px] uppercase tracking-wide mb-1">
            Total Earnings
          </p>
          <p className="text-white font-bold text-xl leading-none">
            ${earnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-white/40 text-[10px] mt-1">Cumulative</p>
        </div>
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    {
      label: "Deposit",
      href: "/deposit",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
        >
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18" />
          <circle cx="7" cy="15" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "Withdraw",
      href: "/withdraw",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M9 12h6M12 9v6" />
        </svg>
      ),
    },
    {
      label: "Help",
      href: "/support",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <circle cx="12" cy="17" r="0.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "Check-in",
      href: "/tasks",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <path d="M8 14l2.5 2.5L16 11" />
        </svg>
      ),
    },
  ];
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-5">
      <div className="grid grid-cols-4 gap-2">
        {actions.map(({ label, href, icon }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-11 h-11 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:border-teal-100 transition-all active:scale-95">
              {icon}
            </div>
            <span className="text-[11px] text-gray-500 group-hover:text-teal-600 transition-colors font-medium">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatsRow({
  activeTasks,
  invitationCode,
}: {
  activeTasks: number;
  invitationCode?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
        <div className="text-2xl font-bold text-teal-600">{activeTasks}</div>
        <div className="text-[11px] text-gray-400 mt-0.5">Active Tasks</div>
      </div>
      <Link
        href="/team"
        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center block hover:border-indigo-200 transition-colors"
      >
        <div className="text-xl font-bold text-indigo-600">Team</div>
        <div className="text-[11px] text-gray-400 mt-0.5">View report →</div>
      </Link>
      <button
        onClick={() => {
          if (invitationCode) {
            navigator.clipboard.writeText(invitationCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        }}
        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center active:scale-95 transition-transform hover:border-teal-200"
      >
        <div
          className={`text-sm font-bold truncate ${copied ? "text-teal-500" : "text-gray-800"}`}
        >
          {copied ? "Copied!" : invitationCode || "—"}
        </div>
        <div className="text-[11px] text-gray-400 mt-0.5">Invite code</div>
      </button>
    </div>
  );
}

const GRADE_GRADIENTS: Record<string, string> = {
  A1: "from-emerald-400 to-teal-500",
  A2: "from-teal-400 to-cyan-500",
  A3: "from-cyan-400 to-blue-500",
  B1: "from-blue-400 to-indigo-500",
  B2: "from-indigo-400 to-violet-500",
  B3: "from-violet-500 to-purple-600",
};

function DeviceCards({
  grades,
  activeTasks,
}: {
  grades: { grade: string; equipment: number; daily: number }[];
  activeTasks: Record<string, number>;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 text-sm">Investment Packages</h3>
        <Link
          href="/tasks"
          className="text-teal-500 text-xs font-medium hover:underline"
        >
          See all →
        </Link>
      </div>
      {/* 2 cols on mobile, 3 on sm, 6 on lg — all 6 side by side on large screens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {grades.map((item) => {
          const isActive = !!activeTasks[item.grade];
          const bg = GRADE_GRADIENTS[item.grade] || "from-gray-400 to-gray-500";
          return (
            <Link key={item.grade} href="/tasks" className="block group">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group-hover:shadow-md group-hover:-translate-y-0.5 transition-all">
                <div
                  className={`bg-gradient-to-r ${bg} px-3 py-2 flex items-center justify-between`}
                >
                  <span className="text-white font-bold text-sm">
                    {item.grade}
                  </span>
                  {isActive && (
                    <span className="text-[9px] bg-white/30 text-white rounded-full px-1.5 py-0.5 font-semibold animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <div className="text-gray-800 font-bold text-sm">
                    ${item.equipment.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-400 mb-2">Cost</div>
                  <div className="pt-2 border-t border-gray-50">
                    <div className="text-teal-600 font-bold text-sm">
                      ${item.daily}
                    </div>
                    <div className="text-[10px] text-gray-400">Daily</div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function RecentActivity({
  transactions,
}: {
  transactions: {
    type: string;
    amount: number;
    status: string;
    createdAt: number;
    network: string;
  }[];
}) {
  if (!transactions?.length) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 text-sm">Recent Activity</h3>
        <Link
          href="/transactions"
          className="text-teal-500 text-xs font-medium hover:underline"
        >
          See all →
        </Link>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {transactions.slice(0, 5).map((tx, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === "deposit" ? "bg-emerald-50" : "bg-red-50"}`}
            >
              {tx.type === "deposit" ? (
                <svg
                  className="w-4 h-4 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 12H4"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-800 capitalize">
                {tx.type}
              </div>
              <div className="text-[10px] text-gray-400 uppercase">
                {tx.network} · {new Date(tx.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div
                className={`font-bold text-sm ${tx.type === "deposit" ? "text-emerald-600" : "text-red-500"}`}
              >
                {tx.type === "deposit" ? "+" : "-"}${tx.amount.toLocaleString()}
              </div>
              <span
                className={`text-[10px] rounded-full px-2 py-0.5 font-medium inline-block mt-0.5 ${tx.status === "completed" ? "bg-emerald-50 text-emerald-600" : tx.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"}`}
              >
                {tx.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTasks, setActiveTasks] = useState<Record<string, number>>({});
  const [depositModal, setDepositModal] = useState<{
    open: boolean;
    required?: number;
  }>({ open: false });

  const user = useQuery(api.user.getUserByContact, {
    contact: (session as any)?.user?.contact || "",
  });
  const recentTx = useQuery(
    (api as any).deposit?.getUserDeposits,
    user?._id ? { userId: user._id, limit: 6 } : "skip",
  ) as any[] | undefined;
  const allTx = React.useMemo(() => (recentTx || []).slice(0, 5), [recentTx]);

  const grades = [
    { grade: "A1", equipment: 20, daily: 2 },
    { grade: "A2", equipment: 100, daily: 6.6 },
    { grade: "A3", equipment: 380, daily: 25 },
    { grade: "B1", equipment: 780, daily: 52 },
    { grade: "B2", equipment: 1800, daily: 120 },
    { grade: "B3", equipment: 4800, daily: 320 },
  ];

  useEffect(() => {
    const map: Record<string, number> = {
      A1: 20,
      A2: 100,
      A3: 380,
      B1: 780,
      B2: 1800,
      B3: 4800,
    };
    const found: Record<string, number> = {};
    Object.keys(map).forEach((g) => {
      try {
        const raw = localStorage.getItem(`andes_device_${g}`);
        if (raw && JSON.parse(raw).active) found[g] = map[g];
      } catch {}
    });
    setActiveTasks(found);
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/sign-in");
  }, [status, router]);

  const availableBalance =
    (user?.depositAmount || 0) -
    Object.values(activeTasks).reduce((s, c) => s + c, 0);

  if (!isMounted || status === "loading" || user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
          <span className="text-sm text-gray-400">Loading…</span>
        </div>
      </div>
    );
  }

  if (!session || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
          <span className="text-4xl">🔒</span>
          <h1 className="text-xl font-bold text-gray-900 mt-4 mb-2">
            Access Restricted
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Sign in to view your dashboard.
          </p>
          <Link
            href="/sign-in"
            className="block w-full py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      {/* ── Activity ticker (full-width) ── */}

      {/* ── Page body — constrained ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-6 space-y-4">
        {/* Hero */}
        <HeroBanner balance={availableBalance} earnings={user.earnings || 0} />
        <ActivityTicker items={MOCK_ACTIVITY} />

        {/* Quick actions */}
        <QuickActions />

        {/* Stats */}
        <StatsRow
          activeTasks={Object.keys(activeTasks).length}
          invitationCode={(user as any).invitationCode}
        />

        {/* Two-column layout on lg+ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main: investment packages */}
          <div className="lg:col-span-2">
            <DeviceCards grades={grades} activeTasks={activeTasks} />
          </div>

          {/* Sidebar: deposit CTA + referral */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-5 text-white shadow-md shadow-teal-200">
              <p className="font-bold text-base mb-1">Grow your balance</p>
              <p className="text-white/80 text-xs mb-4 leading-relaxed">
                Deposit USDT and start earning daily passive income.
              </p>
              <Link
                href="/deposit"
                className="block text-center bg-white text-teal-600 font-bold text-sm py-2.5 rounded-xl hover:bg-teal-50 transition-colors"
              >
                Deposit Now →
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="font-bold text-gray-900 text-sm mb-1">
                Referral Program
              </p>
              <p className="text-gray-500 text-xs mb-3">
                Earn commissions on your team's deposits.
              </p>
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                {[
                  ["18%", "L1"],
                  ["3%", "L2"],
                  ["2%", "L3"],
                ].map(([pct, label]) => (
                  <div key={label} className="bg-teal-50 rounded-lg py-2">
                    <div className="text-teal-600 font-bold text-sm">{pct}</div>
                    <div className="text-[10px] text-gray-400">{label}</div>
                  </div>
                ))}
              </div>
              <Link
                href="/team"
                className="block text-center border border-teal-200 text-teal-600 font-semibold text-xs py-2 rounded-xl hover:bg-teal-50 transition-colors"
              >
                View Team Report →
              </Link>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        {allTx.length > 0 && <RecentActivity transactions={allTx} />}
      </div>

      {/* Deposit modal */}
      {depositModal.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-3xl text-center mb-3">💰</div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Insufficient Balance
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              You need{" "}
              <strong className="text-teal-600">
                ${depositModal.required?.toLocaleString()} USDT
              </strong>{" "}
              to start this task.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDepositModal({ open: false })}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (depositModal.required)
                    router.push(
                      "/deposit?" +
                        new URLSearchParams({
                          amount: String(depositModal.required),
                        }),
                    );
                  setDepositModal({ open: false });
                }}
                className="flex-1 py-3 rounded-xl bg-teal-500 text-white font-semibold text-sm shadow-md shadow-teal-200"
              >
                Deposit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
