"use client";

import Link from "next/link";
import { Home, ArrowLeft, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-9xl font-serif font-light text-primary-600 mb-4">404</h1>
          <h2 className="text-3xl font-serif font-light text-neutral-900 mb-6">
            頁面不存在
          </h2>
          <p className="text-neutral-600 mb-12 leading-relaxed">
            抱歉，您訪問的頁面不存在或已被移除。
            <br />
            請返回首頁或使用搜尋功能尋找您需要的內容。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              <span>返回首頁</span>
            </Link>
            <Link
              href="/wines"
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              <span>瀏覽酒款</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

