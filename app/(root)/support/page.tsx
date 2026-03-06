'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

const TelegramIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
    <rect width="48" height="48" rx="10" fill="url(#tg-grad)"/>
    <defs>
      <linearGradient id="tg-grad" x1="24" y1="0" x2="24" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#37BBFE"/>
        <stop offset="1" stopColor="#007DBB"/>
      </linearGradient>
    </defs>
    <path d="M10.6 23.8l5.8 2.2 2.3 7.2c.15.47.73.63 1.1.3l3.2-2.7a1 1 0 011.2-.04l5.8 4.2c.42.3 1.02.07 1.13-.44l4.4-20.3c.12-.55-.43-1.02-.96-.82L10.6 22.3c-.57.22-.56 1.03.0 1.5z" fill="white"/>
    <path d="M18.6 25.6l-.7 5.1c0 .3.13.44.4.28l2.4-2" fill="#C8DAEA"/>
    <path d="M18.6 25.6l9.6-6-9 8" fill="#A9C9DD"/>
  </svg>
);

const contacts = [
  {
    label: '@Telegram Official Services',
    sublabel: 'Direct support',
    href: 'https://t.me/Andesscanner',
    type: 'service',
  },
  {
    label: '@Telegram Official Groups',
    sublabel: 'Community group',
    href: 'https://t.me/+XlTjD69BWFAwZDA0',
    type: 'group',
  },
  {
    label: '@Telegram Official Channels',
    sublabel: 'News & announcements',
    href: 'https://t.me/+axsqbbrcO0o5ZWVk',
    type: 'channel',
  },
];

const rules = [
  'If you have any questions, please feel free to contact our online customer service. We are happy to assist you.',
  'Please keep your password safe and never disclose it to others. Official staff will never ask you for your password.',
  'Beware of scammers. ANDES will never contact you first asking for deposits or personal information.',
];

export default function SupportPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen mb-10 md:mb-2 bg-gray-100 flex flex-col">

      {/* ── Header ── */}
      <header className="bg-teal-500 px-4 pt-10 pb-5 text-center relative">
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-10 text-white p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white font-bold text-lg">Customer Service</h1>
        <p className="text-white/80 text-xs mt-0.5">Online time: 9:00 AM–7:00 PM</p>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 max-w-lg w-full mx-auto">

        {/* Telegram section */}
        <div className="bg-white mt-3 mx-0">
          <p className="px-4 pt-4 pb-2 text-xs text-gray-500 font-medium uppercase tracking-wide">Telegram</p>

          <div className="divide-y divide-gray-100">
            {contacts.map((c) => (
              <div key={c.href} className="flex items-center gap-4 px-4 py-4">
                {/* Icon block */}
                <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-b from-sky-400 to-blue-600 flex items-center justify-center shadow-sm">
                  <TelegramIcon />
                </div>

                {/* Text + button */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{c.label}</p>
                  <p className="text-[11px] text-gray-400 mb-2">{c.sublabel}</p>
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-teal-500 hover:bg-teal-600 active:scale-95 text-white text-xs font-semibold px-4 py-1.5 rounded transition-all"
                  >
                    Click to jump
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rules section */}
        <div className="bg-gray-100 mt-3 mx-0 px-4 py-5">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-3">RULE</p>
          <ol className="space-y-3">
            {rules.map((rule, i) => (
              <li key={i} className="text-sm text-gray-600 leading-relaxed flex gap-2">
                <span className="text-gray-400 font-semibold flex-shrink-0">{i + 1}.</span>
                <span>{rule}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Extra spacing for bottom nav */}
        <div className="h-10" />
      </main>
    </div>
  );
}