'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import Link from 'next/link'
import { cva, type VariantProps } from 'class-variance-authority'
import { motion, HTMLMotionProps, TargetAndTransition, Transition } from 'framer-motion'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-none font-medium transition-all duration-300 ease-out-expo disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wide text-sm px-8 py-3 touch-target',
  {
    variants: {
      variant: {
        default:
          'bg-primary-dark text-white hover:bg-primary-gold hover:text-primary-dark shadow-lg hover:shadow-xl',
        outline:
          'border-2 border-primary-dark text-primary-dark hover:bg-primary-dark hover:text-white hover:border-primary-gold',
        ghost: 'text-primary-dark hover:bg-primary-cream hover:text-primary-gold',
        gold: 'bg-primary-gold text-primary-dark hover:bg-primary-burgundy hover:text-white shadow-lg hover:shadow-xl',
      },
      size: {
        default: 'px-8 py-3',
        sm: 'px-6 py-2 text-xs',
        lg: 'px-12 py-4 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

// 排除與motion衝突的props
type ButtonPropsWithoutDrag = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'>

// 只提取需要的motion props，避免類型衝突
type MotionButtonProps = Pick<HTMLMotionProps<'button'>, 'whileHover' | 'whileTap' | 'transition' | 'initial' | 'animate' | 'exit'>

// 合併button props和motion props
export interface ButtonProps
  extends ButtonPropsWithoutDrag,
    VariantProps<typeof buttonVariants>,
    Partial<MotionButtonProps> {
  asChild?: boolean
  href?: string
}

/**
 * Button - 升級版：精緻設計、流暢動畫、金色hover、觸控優化
 * 風格：200萬等級精品感
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, href, children, whileHover, whileTap, transition, initial, animate, exit, ...props }, ref) => {
    const buttonClasses = cn(buttonVariants({ variant, size, className }))
    
    // Motion props（如果沒有提供，使用默認值）
    const motionProps = {
      whileHover: whileHover || { scale: 1.02 },
      whileTap: whileTap || { scale: 0.98 },
      transition: transition || { duration: 0.2 },
      ...(initial && { initial }),
      ...(animate && { animate }),
      ...(exit && { exit }),
    }
    
    if (asChild && href) {
      return (
        <motion.div
          {...motionProps}
        >
          <Link
            href={href}
            className={buttonClasses}
          >
            {children}
          </Link>
        </motion.div>
      )
    }

    // 將標準button props和motion props分離傳遞
    return (
      <motion.button
        className={buttonClasses}
        ref={ref}
        {...motionProps}
        {...(props as Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'>)}
      >
        {children}
      </motion.button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }

