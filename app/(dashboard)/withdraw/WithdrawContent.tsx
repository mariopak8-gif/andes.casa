"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import toast from "@/lib/clientToast";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const MIN_WITHDRAWAL = { trc20: 5 };

function formatTimeRemaining(ms: number | null): string {
  if (!ms || ms <= 0) return "Ready";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

export default function WithdrawContent() {
  const { data: session } = useSession();
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [txPassword, setTxPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const network = "trc20";

  // ✅ ONE query replaces 7 — no waterfall
  const data = useQuery(
    api.user.getWithdrawPageData,
    session?.user?.contact ? { contact: session.user.contact } : "skip",
  );

  const user = data?.user;
  const canBypassPassword = data?.canBypassPassword ?? false;
  const isPasswordLocked = data?.isPasswordLocked ?? false;
  const withdrawals = data?.withdrawals;

  // ✅ Countdown timer — only starts once data arrives
  useEffect(() => {
    const base = isPasswordLocked
      ? data?.lockTimeRemaining
      : data?.bypassTimeRemaining;

    if (!base || base <= 0) { setCountdown(null); return; }

    setCountdown(base);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        const next = Math.max(0, prev - 1000);
        return next > 0 ? next : null;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [data?.lockTimeRemaining, data?.bypassTimeRemaining, isPasswordLocked]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !address || parseFloat(amount) <= 0) {
      toast.error("Please fill in all fields with valid amounts");
      return;
    }
    if (!canBypassPassword && !isPasswordLocked && !txPassword.trim()) {
      toast.error("Please enter your transaction password");
      return;
    }
    if (!user) { toast.error("User not found"); return; }

    const withdrawable = Math.max(0, user.earnings);
    if (parseFloat(amount) > withdrawable) {
      toast.error(`Insufficient balance. Available: ${withdrawable.toFixed(2)} USDT`);
      return;
    }
    if (parseFloat(amount) < MIN_WITHDRAWAL.trc20) {
      toast.error(`Minimum withdrawal is ${MIN_WITHDRAWAL.trc20} USDT`);
      return;
    }

    setServerError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/tron/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          address,
          network,
          transactionPassword: txPassword,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        const msg = resData?.error || "Withdrawal failed";
        if (response.status === 403 && msg.toLowerCase().includes("locked")) {
          toast.error(msg); setServerError(msg); return;
        }
        if (response.status === 400 && msg.toLowerCase().includes("not configured")) {
          toast.error("Transaction password not configured. Contact support.");
          setServerError("Transaction password not configured."); return;
        }
        if (response.status === 401 && msg.toLowerCase().includes("invalid transaction password")) {
          toast.error("Invalid transaction password.");
          setTxPassword(""); setServerError("Invalid transaction password."); return;
        }
        setServerError(msg); toast.error(msg); return;
      }

      toast.success("Withdrawal successful! TX: " + resData.txId);
      setAmount(""); setAddress(""); setTxPassword(""); setServerError(null);
    } catch (err: any) {
      const msg = err?.message || "Failed to process withdrawal";
      setServerError(msg); toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Show skeleton while data loads — no blank screen hang
  if (!data && session?.user?.contact) {
    return (
      <main className="bg-gradient-to-br from-green-300 via-cyan-200 to-white min-h-screen px-4 py-8 md:mt-14 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-white/60 rounded-xl" />
          <div className="h-32 bg-white/60 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-96 bg-white/60 rounded-2xl" />
            <div className="h-96 bg-white/60 rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  if (!user) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
    </div>
  );

  return (
    <main className="bg-gradient-to-br md:mt-14 pb-20 md:pb-0 from-green-300 via-cyan-200 to-white min-h-screen px-4 py-8 font-montserrat">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Withdraw Funds</h1>
          <p className="text-gray-600">Securely withdraw your earnings to your crypto wallet.</p>
        </div>

        {/* Balance Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Available Balance</p>
              <h2 className="text-4xl font-bold text-gray-800">
                ${user.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Withdrawable (profit): ${user.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              <div className="text-xs text-gray-500">Invested principal is locked and cannot be withdrawn.</div>
            </div>
            <div className="p-3 bg-cyan-50 rounded-xl">
              <span className="text-cyan-700 font-semibold">TRC20 Network</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-600 to-teal-600 p-6">
              <h3 className="text-white font-bold text-xl">Request Withdrawal</h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleWithdraw} noValidate className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination Address</label>
                  <input
                    type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter TRON (TRC20) address"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USDT)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input
                      type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00" min={MIN_WITHDRAWAL.trc20} step="0.01"
                      className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1 text-gray-500">
                    <span>Min: ${MIN_WITHDRAWAL.trc20}.00</span>
                    <button type="button" onClick={() => setAmount(String(user.earnings))} className="text-cyan-600 hover:text-cyan-700 font-medium">Max</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Password</label>
                  {isPasswordLocked ? (
                    <div className="w-full px-4 py-4 rounded-lg bg-red-50 border border-red-300 space-y-1">
                      <p className="text-red-700 font-bold text-sm">⚠ Withdrawal Locked — Password Recently Reset</p>
                      <p className="text-red-600 text-xs">Withdrawals are locked for 24 hours after a password reset.</p>
                      {countdown && <p className="text-red-600 text-xs font-semibold">Time remaining: {formatTimeRemaining(countdown)}</p>}
                    </div>
                  ) : canBypassPassword ? (
                    <div className="w-full px-4 py-3 rounded-lg bg-green-50 border border-green-300 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                      <span className="text-green-700 font-medium text-sm">Password bypass active — proceed</span>
                    </div>
                  ) : (
                    <>
                      <input
                        type="password" value={txPassword} onChange={(e) => setTxPassword(e.target.value)}
                        placeholder="Enter your transaction password"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                      />
                      {countdown && (
                        <p className="text-amber-600 text-xs mt-1 bg-amber-50 p-2 rounded">
                          24h bypass countdown: {formatTimeRemaining(countdown)}
                        </p>
                      )}
                    </>
                  )}
                  <Link href="/forgot-transaction-password" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium mt-2 inline-block">
                    Reset password via email
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading || !amount || !address || isPasswordLocked}
                  className={`w-full py-4 px-6 rounded-lg font-bold text-white shadow-lg transition-all duration-200
                    ${loading || !amount || !address || isPasswordLocked
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 hover:scale-[1.02]"
                    }`}
                >
                  {isPasswordLocked ? "🔒 Locked — Wait 24 Hours"
                    : loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Processing...
                      </span>
                    ) : "Withdraw Funds"}
                </button>

                {serverError && <p className="text-sm text-red-600">{serverError}</p>}
              </form>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Recent Withdrawals</h3>
            </div>
            <div className="overflow-y-auto flex-1">
              {!withdrawals ? (
                <div className="p-6 text-center text-gray-500">Loading history...</div>
              ) : withdrawals.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No withdrawal history yet</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {withdrawals.map((tx: any) => (
                    <div key={tx._id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          tx.status === "completed" ? "bg-green-100 text-green-700"
                          : tx.status === "pending" ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"}`}>
                          {tx.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">{formatDistanceToNow(tx.createdAt, { addSuffix: true })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-800">-${tx.amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500 font-mono truncate max-w-[150px]">{tx.walletAddress}</p>
                        </div>
                        {tx.transactionHash && (
                          <a href={`https://nile.tronscan.org/#/transaction/${tx.transactionHash}`} target="_blank" rel="noopener noreferrer"
                            className="text-cyan-600 hover:text-cyan-700 text-xs flex items-center gap-1">
                            View <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}