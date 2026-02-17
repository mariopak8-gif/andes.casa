'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TransactionHistory from '@/components/TransactionHistory';
import { api } from '@/convex/_generated/api';
import Image from 'next/image';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [depositModal, setDepositModal] = useState<{ open: boolean; required?: number; network?: string }>({ open: false });
  const [copied, setCopied] = useState(false);

  const user = useQuery(api.user.getUserByContact, { contact: session?.user?.contact || '' });
  
  // Also fetch full user details if available
  // const fullUser = useQuery(api.user.getUserById, user ? { userId: user._id } : "skip");

  const grades = [
    { grade: 'A1', equipment: 20, daily: 2, monthly: 60, annual: 730 },
    { grade: 'A2', equipment: 100, daily: 6.6, monthly: 198, annual: 2409 },
    { grade: 'A3', equipment: 380, daily: 25, monthly: 750, annual: 9125 },
    { grade: 'B1', equipment: 780, daily: 52, monthly: 1560, annual: 18980 },
    { grade: 'B2', equipment: 1800, daily: 120, monthly: 3600, annual: 43800 },
    { grade: 'B3', equipment: 4800, daily: 320, monthly: 9600, annual: 116800 },
  ];

  const onRequestDeposit = (required: number, network: string) => {
    setDepositModal({ open: true, required, network });
  };

  const closeDepositModal = () => setDepositModal({ open: false });

  const goToDeposit = () => {
    if (!depositModal.required) return;
    const q = new URLSearchParams({ amount: String(depositModal.required), network: depositModal.network || 'polygon' });
    router.push('/deposit?' + q.toString());
    setDepositModal({ open: false });
  };
  
  const handleCopyCode = () => {
    if (user?.invitationCode) {
      navigator.clipboard.writeText(user.invitationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
    }
  }, [status, router]);

  function DeviceCard({ item, userBalance, onRequestDeposit, isSignedIn }: { item: { grade: string; equipment: number; daily: number }, userBalance?: number, onRequestDeposit: (required: number, network: string) => void, isSignedIn: boolean }) {
    const storageKey = `andes_device_${item.grade}`;
    const [count, setCount] = useState<number>(1);
    const [deposit, setDeposit] = useState<number>(0);
    const [active, setActive] = useState<boolean>(false);

    useEffect(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          setCount(parsed.count || 1);
          setDeposit(parsed.deposit || 0);
          setActive(!!parsed.active);
        }
      } catch (e) {}
    }, [storageKey]);

    useEffect(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ count, deposit, active }));
      } catch (e) {}
    }, [count, deposit, active, storageKey]);

    const required = item.equipment * count;
    const [network, setNetwork] = useState<string>('polygon');

    const handleStartTask = () => {
      if (!isSignedIn) {
        router.push('/sign-in');
        return;
      }

      if (deposit >= required) return setActive(true);

      const balance = userBalance ?? 0;
      if (balance >= required) {
        setActive(true);
        return;
      }

      onRequestDeposit(required, network);
    };

    return (
      <div className="bg-white border text-gray-800 border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center p-2 border border-gray-100 flex-shrink-0">
            <Image src="/scooter.png" alt="Scooter" width={64} height={64} className="object-contain" />
          </div>
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="font-bold text-xl text-gray-900">{item.grade} Series</h4>
                <div className="text-sm text-emerald-600 font-medium">Daily Profit: {item.daily} USDT</div>
              </div>
              <div className="text-right">
                 <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wide rounded-full">Available</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Price</div>
                <div className="font-bold text-lg text-gray-900">{item.equipment} USDT</div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Quantity</div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setCount((c) => Math.max(1, c - 1))} className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-500 hover:text-emerald-600 transition">-</button>
                  <div className="font-semibold text-gray-900">{count}</div>
                  <button onClick={() => setCount((c) => c + 1)} className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-500 hover:text-emerald-600 transition">+</button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Required Deposit</span>
                  <span className="font-bold text-gray-900">{required} USDT</span>
               </div>
               
               <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="number"
                      min={0}
                      value={deposit}
                      onChange={(e) => setDeposit(Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
                      placeholder="Enter deposit amount"
                    />
                     <select
                      value={network}
                      onChange={(e) => setNetwork(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
                    >
                      <option value="polygon">Polygon</option>
                      <option value="erc20">ERC20</option>
                      <option value="trc20">TRC20</option>
                      <option value="bep20">BEP20</option>
                    </select>
                  </div>
                  
                   {!active ? (
                    <button
                      onClick={handleStartTask}
                      className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                        deposit >= required 
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/30' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Start Machine
                    </button>
                  ) : (
                    <button
                      onClick={() => setActive(false)}
                      className="w-full py-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-sm border border-red-200 transition-colors"
                    >
                      Stop Machine
                    </button>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isMounted || status === 'loading' || user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!session || !user) {
    return (
      <main className="font-montserrat text-gray-800 bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600 mb-8">Please sign in to your account to access the dashboard.</p>
          <Link
            href="/sign-in"
            className="block w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/30"
          >
            Sign In Now
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="font-montserrat text-gray-800 bg-gray-50 min-h-screen">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
              A
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">ANDES</h1>
            </div>
          </div>

          <ul className="hidden lg:flex gap-8 items-center list-none text-sm font-medium">
            <li><Link href="/dashboard" className="text-emerald-600">Dashboard</Link></li>
            <li><Link href="/equipment" className="text-gray-600 hover:text-emerald-600 transition">Equipment</Link></li>
            <li><Link href="/finances" className="text-gray-600 hover:text-emerald-600 transition">Finance</Link></li>
            <li><Link href="/team" className="text-gray-600 hover:text-emerald-600 transition">Team</Link></li>
            <li>
                <Link href="/profile" className="flex items-center gap-2 pl-6 border-l border-gray-200">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                        {user.fullname?.charAt(0) || user.contact?.charAt(0) || 'U'}
                    </div>
                    <span className="text-gray-700 hover:text-gray-900">My Profile</span>
                </Link>
            </li>
          </ul>
        </div>
      </nav>

      <div className="pt-24 px-4 md:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">{user.fullname || 'Partner'}</span>
              </h2>
              <p className="text-gray-500">Here's what's happening with your investments today.</p>
            </div>
            <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
               Last login: {new Date().toLocaleDateString()}
            </div>
          </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
             {/* Left Column: Stats & Actions */}
             <div className="lg:col-span-2 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Balance Card */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/></svg>
                        </div>
                        <div className="text-gray-500 text-sm font-medium mb-2">Total Balance</div>
                        <div className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
                            ${(user.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                         <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded">
                            <span>+0.0% today</span>
                        </div>
                    </div>

                    {/* Earnings Card */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 15.293 6.293A1 1 0 0115 7h-3z" clipRule="evenodd"/></svg>
                        </div>
                        <div className="text-gray-500 text-sm font-medium mb-2">Active Machines</div>
                        <div className="text-4xl font-bold text-gray-900 tracking-tight mb-2">0</div>
                        <div className="text-sm text-gray-400">Generating income</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/deposit" className="group bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-1">
                        <div className="mb-4 bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                            <span className="text-2xl">💰</span>
                        </div>
                        <h3 className="text-lg font-bold mb-1">Deposit</h3>
                        <p className="text-emerald-100 text-sm opacity-90">Add funds instantly</p>
                    </Link>

                    <Link href="/equipment" className="group bg-white border border-gray-200 rounded-2xl p-6 text-gray-800 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1">
                        <div className="mb-4 bg-gray-50 w-12 h-12 rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                            <span className="text-2xl">⚙️</span>
                        </div>
                        <h3 className="text-lg font-bold mb-1 text-gray-900">Equipment</h3>
                        <p className="text-gray-500 text-sm">Manage devices</p>
                    </Link>

                    <Link href="/withdraw" className="group bg-white border border-gray-200 rounded-2xl p-6 text-gray-800 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1">
                        <div className="mb-4 bg-gray-50 w-12 h-12 rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                            <span className="text-2xl">💸</span>
                        </div>
                        <h3 className="text-lg font-bold mb-1 text-gray-900">Withdraw</h3>
                        <p className="text-gray-500 text-sm">Cash out earnings</p>
                    </Link>
                </div>
                
                 {/* Available Machines List */}
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">Available Investment Packages</h3>
                        <Link href="/joining-process" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                            View All <span className="text-lg">›</span>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {grades.map((item) => (
                            <DeviceCard
                            key={item.grade}
                            item={item}
                            userBalance={user?.balance}
                            onRequestDeposit={onRequestDeposit}
                            isSignedIn={!!session?.user}
                            />
                        ))}
                    </div>
                 </div>
             </div>

             {/* Right Column: Profile & Account Details */}
             <div className="space-y-8">
                 {/* Profile Card */}
                 <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="h-24 bg-gradient-to-r from-gray-100 to-gray-200"></div>
                    <div className="px-6 pb-6 relative">
                        <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-md absolute -top-10 flex items-center justify-center font-bold text-2xl text-emerald-600">
                             {user.fullname?.charAt(0) || user.contact?.charAt(0) || 'U'}
                        </div>
                        <div className="pt-12 mb-6">
                             <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{user.fullname || 'Anonymous User'}</h3>
                                    <p className="text-sm text-gray-500">{user.email || user.contact || 'No contact info'}</p>
                                </div>
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold uppercase">
                                    {user.role || 'Member'}
                                </span>
                             </div>
                        </div>
                        
                        <div className="space-y-4">
                             <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <span className="text-sm text-gray-500">Status</span>
                                <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Verified
                                </span>
                             </div>
                             <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <span className="text-sm text-gray-500">Country</span>
                                <span className="text-sm font-medium text-gray-900">{user.countryCode || 'N/A'}</span>
                             </div>
                             <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <span className="text-sm text-gray-500">Position</span>
                                <span className="text-sm font-medium text-gray-900">{user.position || 'Partner'}</span>
                             </div>
                             {user.telegram && (
                                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <span className="text-sm text-gray-500">Telegram</span>
                                    <a href={`https://t.me/${user.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-500 hover:text-blue-600">
                                        {user.telegram}
                                    </a>
                                </div>
                             )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <div className="mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Invitation Code</div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-center font-bold tracking-widest text-gray-700">
                                    {user.invitationCode || '----'}
                                </div>
                                <button 
                                    onClick={handleCopyCode}
                                    className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                                    title="Copy Code"
                                >
                                    {copied ? '✓' : '📋'}
                                </button>
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Recent Activity Mini */}
                 <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-6">Recent Transactions</h3>
                    <TransactionHistory limit={5} />
                    <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                        <Link href="/finances" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">View All History</Link>
                    </div>
                 </div>
             </div>
           </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {depositModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all scale-100">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Insufficient Balance</h3>
            <p className="mb-6 text-gray-600 leading-relaxed">
                You need <strong className="text-emerald-600">{depositModal.required} USDT</strong> on the <strong className="capitalize">{depositModal.network}</strong> network to activate this machine.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={closeDepositModal} 
                className="px-5 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={goToDeposit} 
                className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 transition-all"
              >
                Deposit Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 px-8 mt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-8">
          <div>
            <h4 className="font-bold text-lg mb-4 text-gray-900">ANDES</h4>
            <p className="text-gray-500 text-sm">Global sharing economy platform empowering users worldwide.</p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-gray-900">Platform</h4>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li><Link href="/dashboard" className="hover:text-emerald-600 transition">Dashboard</Link></li>
              <li><Link href="/joining-process" className="hover:text-emerald-600 transition">How it Works</Link></li>
              <li><Link href="/equipment" className="hover:text-emerald-600 transition">Equipment</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-gray-900">Account</h4>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li><Link href="/profile" className="hover:text-emerald-600 transition">Profile Settings</Link></li>
              <li><Link href="/deposit" className="hover:text-emerald-600 transition">Make a Deposit</Link></li>
              <li><Link href="/withdraw" className="hover:text-emerald-600 transition">Withdraw Funds</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-gray-900">Connect</h4>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li><a href="https://t.me/andes" className="hover:text-emerald-600 transition">Telegram Channel</a></li>
              <li><a href="https://youtube.com/andes" className="hover:text-emerald-600 transition">YouTube</a></li>
              <li><a href="mailto:support@andes.com" className="hover:text-emerald-600 transition">support@andes.com</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2026 ANDES. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}