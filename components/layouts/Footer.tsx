import Link from 'next/link'
import { Facebook, Instagram, MessageCircle } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-primary-dark text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="font-serif text-xl font-semibold mb-4">關於 ProWine</h3>
            <p className="font-sans text-sm text-secondary-grey-400 leading-relaxed">
              台灣頂級葡萄酒進口商，專注法國優質產區，提供專業選酒服務。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif text-xl font-semibold mb-4">快速連結</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/wines"
                  className="font-sans text-sm text-secondary-grey-400 hover:text-primary-gold transition-colors"
                >
                  所有酒款
                </Link>
              </li>
              <li>
                <Link
                  href="/wineries"
                  className="font-sans text-sm text-secondary-grey-400 hover:text-primary-gold transition-colors"
                >
                  所有酒莊
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="font-sans text-sm text-secondary-grey-400 hover:text-primary-gold transition-colors"
                >
                  品酩知識
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="font-sans text-sm text-secondary-grey-400 hover:text-primary-gold transition-colors"
                >
                  聯絡我們
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-serif text-xl font-semibold mb-4">聯絡資訊</h3>
            <ul className="space-y-2 font-sans text-sm text-secondary-grey-400">
              <li>會所：台北市大安區樂利路56號</li>
              <li>Tel：+886-2-27329490</li>
              <li>Email：service@prowine.com.tw</li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-serif text-xl font-semibold mb-4">追蹤我們</h3>
            <div className="flex space-x-4">
              <a
                href={`https://line.me/R/ti/p/${process.env.NEXT_PUBLIC_LINE_ID?.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/10 hover:bg-primary-gold rounded-full transition-colors"
                aria-label="LINE"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href={`https://www.facebook.com/profile.php?id=${process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/10 hover:bg-primary-gold rounded-full transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={`https://www.instagram.com/${process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/10 hover:bg-primary-gold rounded-full transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="font-sans text-sm text-secondary-grey-400">
            © {new Date().getFullYear()} ProWine 酩陽實業股份有限公司. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

