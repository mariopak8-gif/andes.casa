'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/convex/_generated/api';
import { toastError, toastSuccess } from '@/lib/clientToast';

export default function TasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTasks, setActiveTasks] = useState<{ [key: string]: number }>({});
  const [taskDurations, setTaskDurations] = useState<{ [key: string]: number }>({});

  // Renewal time — admin-configurable, tasks are ALWAYS open 24/7
  const [renewalHour, setRenewalHour] = useState(19);
  const [renewalMinute, setRenewalMinute] = useState(0);
  const [renewalTimeZone, setRenewalTimeZone] = useState('local');
  const [showRenewalConfig, setShowRenewalConfig] = useState(false);

  const user = useQuery(api.user.getUserByContact, { contact: session?.user?.contact || '' });

  // Load renewal time from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('andes_task_renewal_time');
      if (stored) {
        const { hour, minute, timeZone } = JSON.parse(stored);
        if (hour !== undefined) setRenewalHour(hour);
        if (minute !== undefined) setRenewalMinute(minute);
        setRenewalTimeZone(timeZone || 'local');
      }
    } catch (e) {
      console.error('Error loading renewal time:', e);
    }
  }, []);

  const saveRenewalTime = () => {
    if (user?.role !== 'admin') {
      toastError('Only admins can configure renewal time.');
      return;
    }
    const cfg = {
      hour: Math.min(23, Math.max(0, Number(renewalHour))),
      minute: Math.min(59, Math.max(0, Number(renewalMinute))),
      timeZone: renewalTimeZone || 'local',
    };
    setRenewalHour(cfg.hour);
    setRenewalMinute(cfg.minute);
    setRenewalTimeZone(cfg.timeZone);
    try {
      localStorage.setItem('andes_task_renewal_time', JSON.stringify(cfg));
      toastSuccess('Renewal time updated successfully.');
    } catch (e) {
      toastError('Failed to save renewal time.');
      console.error('Save renewal time error', e);
    }
  };

  const resetRenewalTime = () => {
    setRenewalHour(19);
    setRenewalMinute(0);
    setRenewalTimeZone('local');
    try {
      localStorage.setItem('andes_task_renewal_time', JSON.stringify({ hour: 19, minute: 0, timeZone: 'local' }));
      toastSuccess('Renewal time reset to default (19:00 Local).');
    } catch (e) {
      console.error('Error resetting renewal time', e);
    }
  };

  // Load active tasks and durations from localStorage
  useEffect(() => {
    if (isMounted) return;
    try {
      const stored = localStorage.getItem('andes_task_durations');
      if (stored) {
        setTaskDurations(JSON.parse(stored));
      } else {
        setTaskDurations({ 'A1': 24, 'A2': 48, 'A3': 72, 'B1': 96, 'B2': 120, 'B3': 144 });
      }
    } catch (e) {
      console.error('Error loading task durations:', e);
    }
    const activeTasksFromStorage: { [key: string]: number } = {};
    const grades = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
    const equipmentMap: { [key: string]: number } = {
      'A1': 20, 'A2': 100, 'A3': 380, 'B1': 780, 'B2': 1800, 'B3': 4800,
    };
    grades.forEach((grade) => {
      try {
        const raw = localStorage.getItem(`andes_device_${grade}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.active === true) activeTasksFromStorage[grade] = equipmentMap[grade];
        }
      } catch (e) {}
    });
    setActiveTasks(activeTasksFromStorage);
    setIsMounted(true);
  }, [isMounted]);

  useEffect(() => {
    const onTaskUpdate = (e: any) => {
      try {
        const { grade, active } = e.detail || {};
        setActiveTasks((prev) => {
          const next = { ...prev };
          const equipmentMap: { [key: string]: number } = {
            'A1': 20, 'A2': 100, 'A3': 380, 'B1': 780, 'B2': 1800, 'B3': 4800,
          };
          if (active) next[grade] = equipmentMap[grade] || 0;
          else delete next[grade];
          return next;
        });
      } catch (err) {
        console.error('Error handling task update event:', err);
      }
    };
    window.addEventListener('andes_task_update', onTaskUpdate as EventListener);
    return () => window.removeEventListener('andes_task_update', onTaskUpdate as EventListener);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/sign-in');
  }, [status, router]);

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600 mb-8">Please sign in to view your tasks.</p>
          <Link href="/sign-in" className="block w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-all">
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  const grades = [
    { grade: 'A1',  equipment: 20,     daily: 2,      monthly: 60,     annual: 730,     color: 'blue',  durationHours: taskDurations['A1']  || 24  },
    { grade: 'A2',  equipment: 100,    daily: 6.6,    monthly: 198,    annual: 2409,    color: 'blue',  durationHours: taskDurations['A2']  || 48  },
    { grade: 'A3',  equipment: 380,    daily: 25,     monthly: 750,    annual: 9125,    color: 'blue',  durationHours: taskDurations['A3']  || 72  },
    { grade: 'B1',  equipment: 780,    daily: 52,     monthly: 1560,   annual: 18980,   color: 'green', durationHours: taskDurations['B1']  || 96  },
    { grade: 'B2',  equipment: 1800,   daily: 120,    monthly: 3600,   annual: 43800,   color: 'green', durationHours: taskDurations['B2']  || 120 },
    { grade: 'B3',  equipment: 4800,   daily: 320,    monthly: 9600,   annual: 116800,  color: 'green', durationHours: taskDurations['B3']  || 144 },
    { grade: 'S1',  equipment: 12800,  daily: 853,    monthly: 25590,  annual: 311345,  color: 'teal',  durationHours: taskDurations['S1']  || 168 },
    { grade: 'S2',  equipment: 25800,  daily: 1720,   monthly: 51600,  annual: 627800,  color: 'teal',  durationHours: taskDurations['S2']  || 192 },
    { grade: 'S3',  equipment: 58000,  daily: 3850,   monthly: 115500, annual: 1405250, color: 'teal',  durationHours: taskDurations['S3']  || 216 },
    { grade: 'SS',  equipment: 128000, daily: 8530,   monthly: 255900, annual: 3113450, color: 'gold',  durationHours: taskDurations['SS']  || 240 },
    { grade: 'SSS', equipment: 280000, daily: 18600,  monthly: 558000, annual: 6789000, color: 'gold',  durationHours: taskDurations['SSS'] || 264 },
  ];

  const activeTaskCount = Object.keys(activeTasks).length;
  const renewalLabel = `${String(renewalHour).padStart(2, '0')}:${String(renewalMinute).padStart(2, '0')} ${renewalTimeZone === 'local' ? 'Local time' : renewalTimeZone}`;

  return (
    <main className="font-montserrat text-gray-800 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="pt-12 md:pt-24 px-4 md:px-8 pb-12">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">My Investment Tasks</h2>
            <p className="text-gray-600">Manage and monitor your active earning tasks</p>
          </div>

          {/* Renewal Time Banner — tasks always open, renewal time is just reset time */}
          <div className="mb-8 rounded-2xl border p-4 bg-emerald-50 border-emerald-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-emerald-700">
                ✅ Tasks are available <span className="font-semibold">24 hours a day</span>. Daily rewards renew at{' '}
                <span className="font-semibold">{renewalLabel}</span> every day.
              </p>
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowRenewalConfig((prev) => !prev)}
                  className="text-xs font-semibold px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-100 ml-4 flex-shrink-0"
                >
                  {showRenewalConfig ? 'Close config' : 'Configure renewal'}
                </button>
              )}
            </div>

            {showRenewalConfig && user?.role === 'admin' && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Renewal hour (0–23)</label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={renewalHour}
                    onChange={(e) => setRenewalHour(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Renewal minute (0–59)</label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={renewalMinute}
                    onChange={(e) => setRenewalMinute(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Time zone</label>
                  <select
                    value={renewalTimeZone}
                    onChange={(e) => setRenewalTimeZone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  >
                    <option value="local">Local system timezone</option>
                    <option value="GMT-12">GMT-12</option>
                    <option value="GMT-11">GMT-11</option>
                    <option value="GMT-10">GMT-10</option>
                    <option value="GMT-9">GMT-9</option>
                    <option value="GMT-8">GMT-8</option>
                    <option value="GMT-7">GMT-7</option>
                    <option value="GMT-6">GMT-6</option>
                    <option value="GMT-5">GMT-5</option>
                    <option value="GMT-4">GMT-4</option>
                    <option value="GMT-3">GMT-3</option>
                    <option value="GMT-2">GMT-2</option>
                    <option value="GMT-1">GMT-1</option>
                    <option value="GMT+0">GMT+0</option>
                    <option value="GMT+1">GMT+1</option>
                    <option value="GMT+2">GMT+2</option>
                    <option value="GMT+3">GMT+3</option>
                    <option value="GMT+4">GMT+4</option>
                    <option value="GMT+5">GMT+5</option>
                    <option value="GMT+6">GMT+6</option>
                    <option value="GMT+7">GMT+7</option>
                    <option value="GMT+8">GMT+8</option>
                    <option value="GMT+9">GMT+9</option>
                    <option value="GMT+10">GMT+10</option>
                    <option value="GMT+11">GMT+11</option>
                    <option value="GMT+12">GMT+12</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={saveRenewalTime}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={resetRenewalTime}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm text-gray-600 font-medium">Active Tasks</h3>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <span className="text-2xl">▶️</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{activeTaskCount}</p>
              <p className="text-xs text-gray-500 mt-2">Currently earning rewards</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm text-gray-600 font-medium">Total Balance</h3>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                ${user?.depositAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
              </p>
              <p className="text-xs text-gray-500 mt-2">Available for use</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm text-gray-600 font-medium">Available Tasks</h3>
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{grades.length - activeTaskCount}</p>
              <p className="text-xs text-gray-500 mt-2">Ready to start</p>
            </div>
          </div>

          {/* Tasks Grid */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">All Investment Packages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {grades.map((item) => (
                <TaskCard
                  key={item.grade}
                  item={item}
                  durationHours={item.durationHours}
                  userBalance={user?.depositAmount || 0}
                  renewalHour={renewalHour}
                  renewalMinute={renewalMinute}
                  renewalTimeZone={renewalTimeZone}
                  userId={user?._id}
                  isActive={!!activeTasks[item.grade]}
                />
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: 1, title: 'Select Package', desc: 'Choose an investment package that matches your budget' },
                { step: 2, title: 'Start Task',     desc: 'Deploy your investment and begin earning immediately' },
                { step: 3, title: 'Earn Rewards',   desc: 'Receive daily profits until task completion' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 font-bold text-emerald-600">
                    {step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────
// TaskCard — tasks always open, cooldown resets at renewal time
// ─────────────────────────────────────────────
function TaskCard({
  item,
  durationHours,
  userBalance,
  userId,
  renewalHour = 19,
  renewalMinute = 0,
  renewalTimeZone = 'local',
  isActive: _isActive,
}: {
  item: any;
  durationHours: number;
  userBalance: number;
  userId?: string;
  renewalHour?: number;
  renewalMinute?: number;
  renewalTimeZone?: string;
  isActive?: boolean;
}) {
  const [showDepositError, setShowDepositError] = useState(false);
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const claimMutation = useMutation((api as any).taskManagement?.instantClaimTask as any);

  const required  = item.equipment;
  const canAfford = userBalance >= required;
  const equipments = [20, 100, 380, 780, 1800, 4800, 12800, 25800, 58000, 128000, 280000];
  const hasHigherAffordable = equipments.slice(equipments.indexOf(required) + 1).some(eq => eq <= userBalance);
  const onCooldown = !!cooldownEndTime;
  // Tasks are ALWAYS open — only gate is balance + cooldown + higher available
  const canClaim = canAfford && !onCooldown && !isLoading && !hasHigherAffordable;

  // Load cooldown from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`andes_cooldown_${item.grade}`);
      if (stored) {
        const endTime = parseInt(stored);
        if (endTime > Date.now()) {
          setCooldownEndTime(endTime);
        } else {
          localStorage.removeItem(`andes_cooldown_${item.grade}`);
        }
      }
    } catch (e) {
      console.error('Error loading cooldown:', e);
    }
  }, [item.grade]);

  // Countdown ticker
  useEffect(() => {
    if (!cooldownEndTime) {
      setCooldownRemaining('');
      return;
    }
    const tick = () => {
      const remaining = cooldownEndTime - Date.now();
      if (remaining <= 0) {
        setCooldownEndTime(null);
        setCooldownRemaining('');
        localStorage.removeItem(`andes_cooldown_${item.grade}`);
        return;
      }
      const h = Math.floor(remaining / 3_600_000);
      const m = Math.floor((remaining % 3_600_000) / 60_000);
      const s = Math.floor((remaining % 60_000) / 1000);
      setCooldownRemaining(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownEndTime, item.grade]);

  // Compute next renewal timestamp
  const getNextRenewal = (): Date => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(renewalHour, renewalMinute, 0, 0);
    if (now >= next) next.setDate(next.getDate() + 1);
    return next;
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'from-blue-500 to-blue-600';
    if (grade.startsWith('S')) return 'from-teal-500 to-teal-600';
    return 'from-green-500 to-green-600';
  };

  const renewalLabel = `${String(renewalHour).padStart(2, '0')}:${String(renewalMinute).padStart(2, '0')} ${renewalTimeZone === 'local' ? 'Local' : renewalTimeZone}`;

  // ── Claim handler ──────────────────────────────────────────────────────────
  const handleClaim = async () => {
    if (!canAfford) {
      setShowDepositError(true);
      setTimeout(() => setShowDepositError(false), 3000);
      return;
    }
    if (!userId) return;
    setIsLoading(true);
    try {
      const res: any = await claimMutation({ userId: userId as any, grade: item.grade });
      if (res?.success) {
        const nextRenewal = getNextRenewal();
        const cooldownEnd = nextRenewal.getTime();
        setCooldownEndTime(cooldownEnd);
        localStorage.setItem(`andes_cooldown_${item.grade}`, cooldownEnd.toString());
        toastSuccess(`🎉 Reward claimed! Next claim available at ${renewalLabel} (tomorrow).`);
      } else if (res?.error) {
        toastError(res.error);
      }
    } catch (e) {
      console.error('Failed to claim task:', e);
      toastError('Failed to claim reward. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 bg-white">

      {/* Card header */}
      <div className={`bg-gradient-to-r ${getGradeColor(item.grade)} p-6 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-1">{item.grade} Series</h3>
            <p className="text-white/80 text-sm">Investment Package</p>
          </div>
          <div className="w-20 h-20 bg-white/20 rounded-lg flex items-center justify-center p-2 flex-shrink-0">
            <Image src="/scooter.png" alt="Scooter" width={64} height={64} className="object-contain" />
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-6">

        {/* Status badge */}
        <div className="mb-4">
          {onCooldown ? (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
              ⏳ Reward claimed — renews {renewalLabel}
            </span>
          ) : hasHigherAffordable ? (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
              🔒 Upgrade available
            </span>
          ) : canAfford ? (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
              ✅ Ready to claim
            </span>
          ) : (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
              🔒 Insufficient balance
            </span>
          )}
        </div>

        {/* Info rows */}
        <div className="space-y-3 mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Investment required</span>
            <span className="font-bold text-gray-900">${item.equipment.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Daily reward</span>
            <span className="font-bold text-emerald-600">+${item.daily}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Your balance</span>
            <span className={`font-bold ${canAfford ? 'text-gray-900' : 'text-red-500'}`}>
              ${userBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Cooldown countdown */}
        {onCooldown && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 text-center">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">
              Next claim available in
            </p>
            <p className="text-3xl font-bold text-orange-700 font-mono tracking-widest">
              {cooldownRemaining || '00:00:00'}
            </p>
            <p className="text-xs text-orange-500 mt-1">Hours : Minutes : Seconds</p>
            <p className="text-xs text-orange-600 mt-2">
              🎉 Reward credited! Renews at {renewalLabel}.
            </p>
          </div>
        )}

        {/* Insufficient balance error */}
        {showDepositError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700 font-semibold">
              ❌ Need ${(required - userBalance).toLocaleString()} more USDT to unlock this package
            </p>
          </div>
        )}

        {/* CTA button */}
        <button
          onClick={handleClaim}
          disabled={!canClaim}
          className={`w-full py-3 rounded-lg font-semibold text-sm transition-all font-mono tracking-wide ${
            isLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : onCooldown
              ? 'bg-orange-100 text-orange-700 cursor-not-allowed'
              : hasHigherAffordable
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : canClaim
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading
            ? '⏳ Claiming...'
            : onCooldown
            ? `⏳ ${cooldownRemaining || '00:00:00'}`
            : hasHigherAffordable
            ? 'Upgrade to higher package'
            : !canAfford
            ? `Need $${(required - userBalance).toLocaleString()} more`
            : '🎯 Claim Daily Reward'}
        </button>

      </div>
    </div>
  );
}