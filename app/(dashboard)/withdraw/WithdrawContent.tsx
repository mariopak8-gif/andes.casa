"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function WithdrawContent() {
  const { data: session } = useSession();
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [network, setNetwork] = useState("trc20");

  const user = useQuery(
    api.user.getUserByContact,
    session?.user?.contact ? { contact: session.user.contact } : "skip"
  );

  const withdrawals = useQuery(
    api.withdrawal.getUserWithdrawals,
    user?._id ? { userId: user._id } : "skip"
  );

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !address) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!user) return;
    
    // Basic validation
    if (parseFloat(amount) > (user.balance || 0)) {
        toast.error("Insufficient balance");
        return;
    }

    if (network !== "trc20") {
        toast.error("Only TRC20 withdrawals are currently supported");
        return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/tron/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          address,
          network,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Withdrawal failed");
      }

      toast.success("Withdrawal successful! Transaction ID: " + data.txId);
      setAmount("");
      setAddress("");
      // No need to manually refresh, Convex subscriptions handle it
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      toast.error(error.message || "Failed to process withdrawal");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
    );
  }

  return (
    <main className="bg-gradient-to-br from-green-300 via-cyan-200 to-white min-h-screen px-4 py-8 font-montserrat">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
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
                ${(user.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="p-3 bg-cyan-50 rounded-xl">
                 <span className="text-cyan-700 font-semibold">TRC20 Network</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Withdrawal Form */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-600 to-teal-600 p-6">
                    <h3 className="text-white font-bold text-xl">Request Withdrawal</h3>
                </div>
                <div className="p-6 space-y-6">
                    <form onSubmit={handleWithdraw} className="space-y-4">
                        
                        {/* Network Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Network</label>
                            <select 
                                value={network}
                                onChange={(e) => setNetwork(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-gray-50 text-gray-800 font-medium"
                                disabled
                            >
                                <option value="trc20">Tron (TRC20) - USDT</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Currently only TRC20 withdrawals are available.</p>
                        </div>

                        {/* Address Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Destination Address</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Enter TRON (TRC20) address"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                                required
                            />
                        </div>

                        {/* Amount Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USDT)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    min="1"
                                    step="0.01"
                                    className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                                    required
                                />
                            </div>
                            <div className="flex justify-between text-xs mt-1 text-gray-500">
                                <span>Min: $10.00</span>
                                <button 
                                    type="button" 
                                    onClick={() => setAmount((user.balance || 0).toString())}
                                    className="text-cyan-600 hover:text-cyan-700 font-medium"
                                >
                                    Max
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !amount || !address}
                            className={`w-full py-4 px-6 rounded-lg font-bold text-white shadow-lg transform transition-all duration-200 
                                ${loading || !amount || !address
                                    ? "bg-gray-400 cursor-not-allowed" 
                                    : "bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 hover:scale-[1.02] hover:shadow-xl"
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                "Withdraw Funds"
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* History Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-full">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800">Recent Withdrawals</h3>
                </div>
                <div className="overflow-y-auto flex-1 p-0">
                    {!withdrawals ? (
                         <div className="p-6 text-center text-gray-500">Loading history...</div>
                    ) : withdrawals.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center text-gray-500">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p>No withdrawal history yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {withdrawals.map((tx) => (
                                <div key={tx._id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                            ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                              tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                              'bg-red-100 text-red-700'
                                            }`}>
                                            {tx.status.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {formatDistanceToNow(tx.createdAt, { addSuffix: true })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-gray-800">-${tx.amount.toFixed(2)}</p>
                                            <p className="text-xs text-gray-500 font-mono truncate max-w-[150px]">
                                                {tx.walletAddress}
                                            </p>
                                        </div>
                                        {tx.transactionHash && (
                                            <a 
                                                href={`https://nile.tronscan.org/#/transaction/${tx.transactionHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-cyan-600 hover:text-cyan-700 text-xs flex items-center gap-1"
                                            >
                                                <span>View</span>
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
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
