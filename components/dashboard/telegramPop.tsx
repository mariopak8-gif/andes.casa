'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

const STORAGE_KEY = 'andes_telegram_popup_dismissed';

const TelegramLogo = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="48" height="48" rx="24" fill="url(#tgp-grad)" />
    <defs>
      <linearGradient id="tgp-grad" x1="24" y1="0" x2="24" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#37BBFE" />
        <stop offset="1" stopColor="#007DBB" />
      </linearGradient>
    </defs>
    <path d="M10.6 23.8l5.8 2.2 2.3 7.2c.15.47.73.63 1.1.3l3.2-2.7a1 1 0 011.2-.04l5.8 4.2c.42.3 1.02.07 1.13-.44l4.4-20.3c.12-.55-.43-1.02-.96-.82L10.6 22.3c-.57.22-.56 1.03.0 1.5z" fill="white" />
    <path d="M18.6 25.6l-.7 5.1c0 .3.13.44.4.28l2.4-2" fill="#C8DAEA" />
    <path d="M18.6 25.6l9.6-6-9 8" fill="#A9C9DD" />
  </svg>
);

const links = [
  {
    label: 'Official Channel',
    sublabel: 'News & announcements',
    href: 'https://t.me/+axsqbbrcO0o5ZWVk',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
      </svg>
    ),
  },
  {
    label: 'Official Group',
    sublabel: 'Community & support',
    href: 'https://t.me/+XlTjD69BWFAwZDA0',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
];

export default function TelegramPopup() {
  const { data: session, status } = useSession();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [joined, setJoined] = useState<Record<string, boolean>>({});

  // Show popup once per session after login
  useEffect(() => {
    if (status !== 'authenticated' || !session) return;
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        // Small delay so dashboard loads first
        const t = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {}
  }, [status, session]);

  const dismiss = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch {}
    }, 300);
  };

  const handleJoin = (href: string, label: string) => {
    window.open(href, '_blank', 'noopener,noreferrer');
    setJoined((prev) => ({ ...prev, [label]: true }));
  };

  const allJoined = links.every((l) => joined[l.label]);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${closing ? 'opacity-0' : 'opacity-100'}`}
        onClick={dismiss}
      />

      {/* Modal */}
      <div
        className={`fixed z-50 left-1/2 -translate-x-1/2 w-full max-w-sm px-4
          transition-all duration-300
          ${closing ? 'opacity-0 translate-y-4 bottom-0' : 'opacity-100 translate-y-0'}
          bottom-24 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2`}
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Header gradient */}
          <div className="bg-gradient-to-br from-teal-400 to-cyan-500 px-6 pt-7 pb-10 text-center relative">
            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Telegram logo */}
            <div className="w-16 h-16 mx-auto mb-4 drop-shadow-lg">
              <TelegramLogo />
            </div>

            <h2 className="text-white font-bold text-xl leading-tight">Join ANDES on Telegram</h2>
            <p className="text-white/80 text-sm mt-1.5 leading-relaxed">
              Stay updated with the latest news, announcements and get community support.
            </p>
          </div>

          {/* Cards — overlap the header slightly */}
          <div className="px-5 mt-5 space-y-3">
            {links.map((link) => (
              <div
                key={link.label}
                className="bg-white rounded-2xl shadow-md border border-gray-100 flex items-center gap-4 px-4 py-3.5"
              >
                {/* Icon */}
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                  {link.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{link.label}</p>
                  <p className="text-[11px] text-gray-400">{link.sublabel}</p>
                </div>

                {/* Join button */}
                <button
                  onClick={() => handleJoin(link.href, link.label)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                    joined[link.label]
                      ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                      : 'bg-teal-500 hover:bg-teal-600 text-white shadow-sm shadow-teal-200'
                  }`}
                >
                  {joined[link.label] ? '✓ Joined' : 'Join'}
                </button>
              </div>
            ))}
          </div>

          {/* Bottom area */}
          <div className="px-5 pt-4 pb-6">
            {allJoined ? (
              <button
                onClick={dismiss}
                className="w-full py-3 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm transition-colors shadow-md shadow-teal-200 active:scale-95"
              >
                Done — Let's go! 🚀
              </button>
            ) : (
              <button
                onClick={dismiss}
                className="w-full py-2.5 rounded-2xl border border-gray-200 text-gray-400 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Maybe later
              </button>
            )}

            <p className="text-center text-[10px] text-gray-300 mt-3">
              Official staff will never ask for your password or funds.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}