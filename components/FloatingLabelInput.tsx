"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface FloatingLabelInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  autoComplete?: string;
}

/**
 * 浮動標籤輸入組件（P1 BATCH7）
 * 實現表單輸入欄位的浮動標籤效果
 */
export default function FloatingLabelInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  required = false,
  placeholder,
  className = "",
  autoComplete,
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = value.length > 0;
  const isFloating = isFocused || hasValue;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          placeholder={isFloating ? placeholder : undefined}
          required={required}
          autoComplete={autoComplete}
          inputMode={type === "tel" ? "tel" : type === "email" ? "email" : type === "number" ? "numeric" : undefined}
          className={`
            w-full px-4 pt-6 pb-2 
            bg-white dark:bg-neutral-800
            border rounded-lg
            text-neutral-900 dark:text-neutral-100
            placeholder:text-transparent
            focus:outline-none focus:ring-2 focus:ring-primary-500
            transition-all duration-200
            ${error ? "border-red-500 focus:ring-red-500" : "border-neutral-300 dark:border-neutral-600"}
            ${className}
          `}
          aria-label={label}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={error ? "true" : "false"}
          aria-required={required}
          aria-errormessage={error ? `${id}-error` : undefined}
        />
        
        {/* 浮動標籤 */}
        <motion.label
          htmlFor={id}
          initial={false}
          animate={{
            y: isFloating ? -8 : 0,
            scale: isFloating ? 0.85 : 1,
            x: isFloating ? -4 : 0,
          }}
          transition={{
            duration: 0.2,
            ease: "easeOut",
          }}
          className={`
            absolute left-4 top-1/2 -translate-y-1/2
            pointer-events-none
            transition-colors duration-200
            ${isFloating 
              ? "text-primary-600 dark:text-accent-gold" 
              : "text-neutral-500 dark:text-neutral-400"
            }
            ${error ? "text-red-500" : ""}
          `}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </motion.label>
      </div>
      
      {/* 錯誤訊息 - 無障礙設計優化（P1 BATCH19） */}
      {error && (
        <motion.p
          id={`${id}-error`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
          aria-atomic="true"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

