"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
      fill={active ? '#0d9488' : 'none'}
      stroke={active ? '#0d9488' : '#9ca3af'}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
)

const TaskIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect
      x="4" y="3" width="16" height="18" rx="2"
      stroke={active ? '#0d9488' : '#9ca3af'}
      strokeWidth="1.8"
      fill={active ? '#0d948820' : 'none'}
    />
    <path d="M8 8H16M8 12H16M8 16H12" stroke={active ? '#0d9488' : '#9ca3af'} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="6.5" cy="8" r="0.8" fill={active ? '#0d9488' : '#9ca3af'} />
    <circle cx="6.5" cy="12" r="0.8" fill={active ? '#0d9488' : '#9ca3af'} />
    <circle cx="6.5" cy="16" r="0.8" fill={active ? '#0d9488' : '#9ca3af'} />
  </svg>
)

const JoinIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
      fill="white" fillOpacity="0.2"
    />
    <path d="M12 7V17M7 12H17" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)

const TeamIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="7" r="3" stroke={active ? '#0d9488' : '#9ca3af'} strokeWidth="1.8" fill={active ? '#0d948820' : 'none'} />
    <circle cx="17" cy="8" r="2.5" stroke={active ? '#0d9488' : '#9ca3af'} strokeWidth="1.6" fill="none" />
    <path
      d="M3 19C3 16.2386 5.68629 14 9 14C12.3137 14 15 16.2386 15 19"
      stroke={active ? '#0d9488' : '#9ca3af'} strokeWidth="1.8" strokeLinecap="round"
    />
    <path
      d="M17 13C19.2091 13 21 14.567 21 16.5"
      stroke={active ? '#0d9488' : '#9ca3af'} strokeWidth="1.6" strokeLinecap="round"
    />
  </svg>
)

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle
      cx="12" cy="8" r="4"
      stroke={active ? '#0d9488' : '#9ca3af'}
      strokeWidth="1.8"
      fill={active ? '#0d948820' : 'none'}
    />
    <path
      d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20"
      stroke={active ? '#0d9488' : '#9ca3af'} strokeWidth="1.8" strokeLinecap="round"
    />
  </svg>
)

const navItems = [
  { href: '/dashboard',         label: 'Home',    Icon: HomeIcon },
  { href: '/tasks',     label: 'Task',    Icon: TaskIcon },
  { href: '/team',     label: 'Team',    Icon: TeamIcon },
  { href: '/profile',  label: 'Profile', Icon: ProfileIcon },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Soft top shadow line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      <div className="bg-white relative flex items-end justify-around px-2 pb-safe"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>

        {/* Left two items */}
        {navItems.slice(0, 2).map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center pt-2 pb-3 gap-1 group"
            >
              <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
                <Icon active={active} />
              </span>
              <span className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${
                active ? 'text-teal-600' : 'text-gray-400'
              }`}>
                {label}
              </span>
              {active && (
                <span className="absolute top-0 left-0 right-0 h-[2.5px] rounded-b-full bg-teal-500 mx-auto"
                  style={{ width: '24px', marginLeft: 'auto', marginRight: 'auto' }}
                />
              )}
            </Link>
          )
        })}

        {/* Center Join button */}
        <div className="flex-1 flex flex-col items-center" style={{ marginTop: '-20px' }}>
          <Link
            href="/joining-process"
            className="flex flex-col items-center gap-1 group"
          >
            <span className="flex items-center justify-center w-14 h-14 rounded-full bg-teal-500 shadow-lg ring-4 ring-white transition-all duration-200 group-hover:bg-teal-600 group-hover:scale-105 group-active:scale-95"
              style={{
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.45)',
              }}>
              <JoinIcon />
            </span>
            <span className="text-[10px] font-medium text-gray-400 tracking-wide -mt-0.5 pb-1">
              Join
            </span>
          </Link>
        </div>

        {/* Right two items */}
        {navItems.slice(2, 4).map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center pt-2 pb-3 gap-1 group"
            >
              <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
                <Icon active={active} />
              </span>
              <span className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${
                active ? 'text-teal-600' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}