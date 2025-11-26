'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wine, Building2, BookOpen, MessageCircle, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: '首頁', icon: Home },
  { href: '/wines', label: '酒款', icon: Wine },
  { href: '/wineries', label: '酒莊', icon: Building2 },
  { href: '/blog', label: '知識', icon: BookOpen },
  { href: '/contact', label: '聯絡', icon: MessageCircle },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-secondary-grey-200 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 transition-colors',
                isActive
                  ? 'text-primary-burgundy'
                  : 'text-secondary-grey-400 hover:text-primary-dark'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-sans font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

