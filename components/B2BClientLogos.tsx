"use client";

import { motion } from "framer-motion";
import Image from "next/image";

// 佔位 LOGO 數據（實際使用時替換為真實客戶 LOGO）
const clientLogos = [
  { id: 1, name: "客戶 A", logo: "/placeholder-logo-1.png" },
  { id: 2, name: "客戶 B", logo: "/placeholder-logo-2.png" },
  { id: 3, name: "客戶 C", logo: "/placeholder-logo-3.png" },
  { id: 4, name: "客戶 D", logo: "/placeholder-logo-4.png" },
  { id: 5, name: "客戶 E", logo: "/placeholder-logo-5.png" },
  { id: 6, name: "客戶 F", logo: "/placeholder-logo-6.png" },
];

// 重複數組以實現無縫循環
const duplicatedLogos = [...clientLogos, ...clientLogos, ...clientLogos];

export default function B2BClientLogos() {
  return (
    <section className="bg-neutral-50 border-y border-neutral-200 py-12 overflow-hidden">
      <div className="container-custom">
        <div className="mb-8 text-center">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
            合作夥伴
          </h3>
          <p className="text-xs text-neutral-400 font-light">
            我們與頂級企業建立長期合作關係
          </p>
        </div>

        {/* 跑馬燈容器 */}
        <div className="relative">
          <div className="flex gap-8 animate-scroll">
            {duplicatedLogos.map((client, index) => (
              <motion.div
                key={`${client.id}-${index}`}
                className="flex-shrink-0 w-32 h-20 relative grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-full h-full bg-white rounded-lg p-4 flex items-center justify-center border border-neutral-200 shadow-sm">
                  {/* 使用佔位符或實際 LOGO */}
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-neutral-400 font-medium">
                      {client.name}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 漸變遮罩（左右兩側） */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-neutral-50 to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-neutral-50 to-transparent pointer-events-none z-10" />
        </div>
      </div>

    </section>
  );
}

