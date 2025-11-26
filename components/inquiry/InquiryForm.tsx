'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'

const inquirySchema = z.object({
  name: z.string().min(2, '姓名至少需要2個字元'),
  email: z.string().email('請輸入有效的Email'),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().optional(),
  inquiry_type: z.enum(['product', 'bulk', 'general']),
})

type InquiryFormData = z.infer<typeof inquirySchema>

interface InquiryFormProps {
  wineIds?: string[]
  inquiryType?: 'product' | 'bulk' | 'general'
}

export function InquiryForm({ wineIds = [], inquiryType = 'product' }: InquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      inquiry_type: inquiryType,
    },
  })

  const onSubmit = async (data: InquiryFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          wine_ids: wineIds,
        }),
      })

      if (response.ok) {
        setIsSuccess(true)
        reset()
        setTimeout(() => setIsSuccess(false), 5000)
      } else {
        throw new Error('提交失敗')
      }
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      alert('提交失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="bg-primary-cream p-8 rounded-lg text-center">
        <h3 className="font-serif text-2xl font-semibold text-primary-dark mb-2">
          詢價已送出！
        </h3>
        <p className="font-sans text-base text-secondary-grey-600">
          我們會盡快與您聯繫
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-primary-cream p-8 rounded-lg">
      <h3 className="font-serif text-3xl font-semibold text-primary-dark mb-6">
        商品詢價
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <label className="block font-sans text-sm font-medium text-primary-dark mb-2">
            姓名 *
          </label>
          <input
            {...register('name')}
            type="text"
            className="w-full px-4 py-3 border-2 border-secondary-grey-200 focus:border-primary-burgundy focus:outline-none transition-colors text-base md:text-sm"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-error">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block font-sans text-sm font-medium text-primary-dark mb-2">
            Email *
          </label>
          <input
            {...register('email')}
            type="email"
            className="w-full px-4 py-3 border-2 border-secondary-grey-200 focus:border-primary-burgundy focus:outline-none transition-colors text-base md:text-sm"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-error">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block font-sans text-sm font-medium text-primary-dark mb-2">
            電話
          </label>
          <input
            {...register('phone')}
            type="tel"
            className="w-full px-4 py-3 border-2 border-secondary-grey-200 focus:border-primary-burgundy focus:outline-none transition-colors text-base md:text-sm"
          />
        </div>

        <div>
          <label className="block font-sans text-sm font-medium text-primary-dark mb-2">
            公司名稱
          </label>
          <input
            {...register('company')}
            type="text"
            className="w-full px-4 py-3 border-2 border-secondary-grey-200 focus:border-primary-burgundy focus:outline-none transition-colors text-base md:text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block font-sans text-sm font-medium text-primary-dark mb-2">
          詢價類型
        </label>
        <select
          {...register('inquiry_type')}
          className="w-full px-4 py-3 border-2 border-secondary-grey-200 focus:border-primary-burgundy focus:outline-none transition-colors text-base md:text-sm"
        >
          <option value="product">單品詢價</option>
          <option value="bulk">大量採購</option>
          <option value="general">一般詢問</option>
        </select>
      </div>

      <div>
        <label className="block font-sans text-sm font-medium text-primary-dark mb-2">
          備註
        </label>
        <textarea
          {...register('message')}
          rows={4}
          className="w-full px-4 py-3 border-2 border-secondary-grey-200 focus:border-primary-burgundy focus:outline-none transition-colors resize-none text-base md:text-sm"
        />
      </div>

      <Button
        type="submit"
        variant="default"
        size="lg"
        disabled={isSubmitting}
        className="w-full touch-target"
      >
        {isSubmitting ? '提交中...' : '送出詢價'}
      </Button>
    </form>
  )
}

