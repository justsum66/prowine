"use client";

import { Construction, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function ComingSoon({ feature }: { feature?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full">
            <Construction className="w-12 h-12 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          開發中
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          {feature || "此功能正在開發中，敬請期待！"}
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-neutral-500 dark:text-neutral-500">
          <Clock className="w-4 h-4" />
          <span>預計近期推出</span>
        </div>
      </motion.div>
    </div>
  );
}

