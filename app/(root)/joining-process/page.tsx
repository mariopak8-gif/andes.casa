'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';

const grades = [
  { grade: 'A1', equipment: 20, daily: 2, monthly: 60, annual: 730 },
  { grade: 'A2', equipment: 100, daily: 6.6, monthly: 198, annual: 2409 },
  { grade: 'A3', equipment: 380, daily: 25, monthly: 750, annual: 9125 },
  { grade: 'B1', equipment: 780, daily: 52, monthly: 1560, annual: 18980 },
  { grade: 'B2', equipment: 1800, daily: 120, monthly: 3600, annual: 43800 },
  { grade: 'B3', equipment: 4800, daily: 320, monthly: 9600, annual: 116800 },
  { grade: 'S1', equipment: 12800, daily: 853, monthly: 25590, annual: 311345 },
  { grade: 'S2', equipment: 25800, daily: 1720, monthly: 51600, annual: 627800 },
  { grade: 'S3', equipment: 58000, daily: 3850, monthly: 115500, annual: 1405250 },
  { grade: 'SS', equipment: 128000, daily: 8530, monthly: 255900, annual: 3113450 },
  { grade: 'SSS', equipment: 280000, daily: 18600, monthly: 558000, annual: 6789000 },
];

function DeviceCard({
  item,
  userBalance,
  onRequestDeposit,
  isSignedIn,
}: {
  item: { grade: string; equipment: number; daily: number };
  userBalance?: number;
  onRequestDeposit: (required: number) => void;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const storageKey = `andes_device_${item.grade}`;
  const [count, setCount] = useState(1);
  const [deposit, setDeposit] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setCount(parsed.count || 1);
        setDeposit(parsed.deposit || 0);
        setActive(!!parsed.active);
      }
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ count, deposit, active }));
    } catch {}
  }, [count, deposit, active, storageKey]);

  const required = item.equipment * count;

  const handleStartTask = () => {
    if (!isSignedIn) { router.push('/sign-in'); return; }
    if (deposit >= required) { setActive(true); return; }
    const balance = userBalance ?? 0;
    if (balance >= required) { setActive(true); return; }
    onRequestDeposit(required);
  };

  const gradeColor: Record<string, string> = {
    A1: 'from-emerald-400 to-teal-500',
    A2: 'from-teal-400 to-cyan-500',
    A3: 'from-cyan-400 to-blue-500',
    B1: 'from-blue-400 to-indigo-500',
    B2: 'from-indigo-400 to-violet-500',
    B3: 'from-violet-400 to-purple-500',
  };
  const bg = gradeColor[item.grade] || 'from-gray-400 to-gray-600';

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      {/* Grade header strip */}
      <div className={`bg-gradient-to-r ${bg} px-4 py-3 flex items-center justify-between`}>
        <span className="text-white font-bold text-lg tracking-wide">{item.grade}</span>
        <span className="text-white/90 text-sm font-medium">Daily: ${item.daily}/device</span>
      </div>

      <div className="p-4">
        {/* Top row: image + price info */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200">
            <Image src="/scooter.png" alt="Scooter" width={52} height={52} className="object-contain" />
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Price</div>
              <div className="font-bold text-gray-800">${item.equipment.toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Daily profit</div>
              <div className="font-bold text-teal-600">${item.daily}</div>
            </div>
          </div>
        </div>

        {/* Quantity row */}
        <div className="flex items-center justify-between mb-3 bg-gray-50 rounded-xl px-4 py-2">
          <span className="text-sm text-gray-500">Devices</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              className="w-7 h-7 rounded-full bg-white shadow text-gray-600 flex items-center justify-center text-lg font-bold border border-gray-200 active:scale-95 transition-transform"
            >−</button>
            <span className="font-bold text-gray-800 w-6 text-center">{count}</span>
            <button
              onClick={() => setCount((c) => c + 1)}
              className="w-7 h-7 rounded-full bg-white shadow text-gray-600 flex items-center justify-center text-lg font-bold border border-gray-200 active:scale-95 transition-transform"
            >+</button>
          </div>
          <span className="text-sm font-semibold text-gray-700">${required.toLocaleString()} USDT</span>
        </div>

        {/* Deposit input + action */}
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            value={deposit || ''}
            onChange={(e) => setDeposit(Number(e.target.value))}
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder-gray-300"
            placeholder="Your deposit"
          />
          {!active ? (
            <button
              onClick={handleStartTask}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                deposit >= required
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-200'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              Start
            </button>
          ) : (
            <button
              onClick={() => setActive(false)}
              className="px-5 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm shadow-md shadow-red-200 active:scale-95 transition-all"
            >
              Stop
            </button>
          )}
        </div>

        {active && (
          <div className="mt-2 text-xs text-teal-600 font-medium text-center animate-pulse">
            ● Running — collecting daily income
          </div>
        )}
      </div>
    </div>
  );
}

export default function JoiningProcessPage() {
  const [selectedGrade, setSelectedGrade] = useState('B1');
  const { data: session } = useSession();
  const user = useQuery(api.user.getUserByContact, {
    contact: (session as any)?.user?.contact || '',
  });
  const router = useRouter();
  const [depositModal, setDepositModal] = useState<{ open: boolean; required?: number }>({ open: false });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const goToDeposit = () => {
    if (!depositModal.required) return;
    router.push('/deposit?' + new URLSearchParams({ amount: String(depositModal.required) }));
    setDepositModal({ open: false });
  };

  return (
    <div className="font-sans text-gray-800 overflow-x-hidden bg-white">


      {/* ── Hero ── */}
      <section className="relative pt-14 sm:pt-16 overflow-hidden bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-8 -left-8 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute top-12 right-0 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white/10 rounded-full" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 py-12 sm:py-20">
          
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-3">Join ANDES</h1>
          <p className="text-lg sm:text-xl text-white/85">Start earning with our equipment sharing economy</p>
        </div>
      </section>

      {/* ── Main Content ── */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">

          {/* Section title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900">ANDES Price List</h2>
            <p className="text-teal-500 mt-1 text-sm sm:text-base">Investment packages &amp; daily income</p>
          </div>

          {/* ── Price Table — scrollable on mobile ── */}
          <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-100 mb-10">
            <table className="w-full border-collapse text-sm min-w-[480px]">
              <thead>
                <tr className="bg-teal-500 text-white">
                  {['Grade', 'Cost ($)', 'Daily ($)', '30-day ($)', '365-day ($)'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap first:rounded-tl-2xl last:rounded-tr-2xl">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grades.map((item, idx) => (
                  <tr
                    key={item.grade}
                    onClick={() => setSelectedGrade(item.grade)}
                    className={`cursor-pointer transition-colors ${
                      selectedGrade === item.grade
                        ? 'bg-teal-50 font-semibold'
                        : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-teal-700">{item.grade}</td>
                    <td className="px-4 py-3 text-gray-700">{item.equipment.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-700">{item.daily.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-700">{item.monthly.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-700">{item.annual.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Referral Banner ── */}
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-5 sm:p-6 mb-10 text-white">
            <p className="font-bold text-base sm:text-lg mb-3">💰 Referral Rebate Program</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[['18%', 'Level 1'], ['3%', 'Level 2'], ['2%', 'Level 3']].map(([pct, label]) => (
                <div key={label} className="bg-white/20 rounded-xl py-3">
                  <div className="text-2xl font-bold">{pct}</div>
                  <div className="text-xs text-white/80 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Device Cards ── */}
          <div className="mb-4">
            <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">Start a Task</h3>
            <p className="text-sm text-gray-500 mb-6">Select devices to begin earning daily income</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {grades.slice(0, 6).map((item) => (
              <DeviceCard
                key={item.grade}
                item={item}
                userBalance={user?.depositAmount}
                onRequestDeposit={(r) => setDepositModal({ open: true, required: r })}
                isSignedIn={!!session?.user}
              />
            ))}
          </div>

          {/* ── How it works cards ── */}
          <h3 className="text-xl sm:text-3xl font-bold text-gray-900 text-center mb-6">How It Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {[
              { emoji: '📱', title: 'Register', color: 'from-blue-50 to-cyan-50 border-blue-100', items: ['Enter your phone number, login password, and withdrawal password.', 'Remember your credentials — keep them safe.'] },
              { emoji: '💵', title: 'Deposit', color: 'from-green-50 to-emerald-50 border-green-100', items: ['Minimum deposit: 20 USDT.', 'Use the correct network or funds will not be credited.', 'Your deposit address is stable — changes will be announced.'] },
              { emoji: '💸', title: 'Withdraw', color: 'from-purple-50 to-pink-50 border-purple-100', items: ['Select network and add your wallet address.', 'Enter withdrawal password and confirm.', 'Choose the correct network to avoid lost funds.'] },
              { emoji: '⚙️', title: 'Run Equipment', color: 'from-orange-50 to-amber-50 border-orange-100', items: ['Choose a device that matches your balance.', 'Click Start — income starts after ~1 minute.', 'Claim daily income before midnight or it is forfeited.'] },
              { emoji: '👥', title: 'Refer & Earn', color: 'from-indigo-50 to-blue-50 border-indigo-100', items: ['Share your referral link.', 'Earn 18% from Level 1, 3% from Level 2, 2% from Level 3.'] },
              { emoji: '🏆', title: 'Team & Ranks', color: 'from-teal-50 to-cyan-50 border-teal-100', items: ['Grow your team to unlock agent salary.', 'Weekly salary + monthly allowance + rewards.'] },
            ].map(({ emoji, title, color, items }) => (
              <div key={title} className={`bg-gradient-to-br ${color} border rounded-2xl p-5`}>
                <div className="text-2xl mb-2">{emoji}</div>
                <h4 className="font-bold text-gray-900 mb-3">{title}</h4>
                <ul className="space-y-2">
                  {items.map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                      <span className="text-teal-500 mt-0.5 flex-shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agent Salary ── */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">ANDES Agent Salary</h2>
            <p className="text-gray-500 text-sm mt-1">Grow your team, unlock bigger rewards</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[380px]">
                  <thead className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
                    <tr>
                      {['Level', 'Members', 'Weekly', 'Monthly', 'Bonus'].map((h) => (
                        <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['L1', '10', '$25', '$200', '—'],
                      ['L2', '30', '$80', '$500', '—'],
                      ['L3', '100', '$250', '$1,500', '$1,000'],
                      ['L4', '500', '$1,250', '$4,000', 'Sedan 🚗'],
                    ].map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {row.map((cell, j) => (
                          <td key={j} className={`px-3 py-3 ${j === 0 ? 'font-bold text-teal-600' : 'text-gray-700'}`}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 text-lg mb-3">How to become Captain</h3>
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                    <p className="text-sm text-gray-700">Purchase 10 devices + A2 equipment to qualify</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                    <p className="text-sm text-gray-700">Wages paid every Sunday + monthly team building budget</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center font-bold">3</span>
                    <p className="text-sm text-gray-700">Contact the manager to apply after meeting requirements</p>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Min Deposit', value: '20 USDT' },
                  { label: 'Min Withdrawal', value: '1 USDT' },
                  { label: 'Daily Update', value: '10:00 AM NY' },
                  { label: 'Withdrawals', value: '1–3 mins' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
                    <div className="font-bold text-gray-800 mt-0.5 text-sm">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Commission + Network */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-6 text-white">
              <p className="font-bold mb-3 text-base">Commission Structure</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Level 1 referral</span><span className="font-bold">18%</span></div>
                <div className="flex justify-between"><span>Level 2 referral</span><span className="font-bold">3%</span></div>
                <div className="flex justify-between"><span>Level 3 referral</span><span className="font-bold">2%</span></div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white">
              <p className="font-bold mb-3 text-base">Supported Networks</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="text-lg">💎</span><span>TRC20 (Tron)</span></div>
                <div className="flex items-center gap-2 opacity-50"><span className="text-lg">🔗</span><span>More coming soon</span></div>
              </div>
              <p className="text-xs text-white/70 mt-3">Each level valid for 365 days</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-white py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img src="https://images.unsplash.com/photo-1589828876954-ec07463ac0e6?w=50&q=80" alt="Logo" className="w-8 h-8 rounded-full" />
                <span className="font-bold text-lg">ANDES</span>
              </div>
              <p className="text-gray-400 text-sm">Global Sharing Economy Platform</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                {[['/', 'Home'], ['/about', 'About'], ['/joining-process', 'Join']].map(([href, label]) => (
                  <li key={href}><Link href={href} className="hover:text-teal-400 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                {['FAQ', 'Contact', 'Privacy'].map((l) => (
                  <li key={l}><Link href="#" className="hover:text-teal-400 transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Connect</h4>
              <div className="flex gap-2">
                {['f', 't', 'in'].map((icon) => (
                  <Link key={icon} href="#" className="w-8 h-8 bg-teal-600 hover:bg-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold transition-colors uppercase">
                    {icon}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-xs">
            © 2026 ANDES. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ── Deposit Modal ── */}
      {depositModal.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-3xl text-center mb-3">💰</div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Insufficient Balance</h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              You need <strong className="text-teal-600">{depositModal.required?.toLocaleString()} USDT</strong> (TRC20) to start this task.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDepositModal({ open: false })}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={goToDeposit}
                className="flex-1 py-3 rounded-xl bg-teal-500 text-white font-semibold text-sm shadow-md shadow-teal-200 active:scale-95 transition-transform"
              >
                Deposit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}