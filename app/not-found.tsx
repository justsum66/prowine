import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-cream">
      <div className="text-center px-4">
        <h1 className="font-display text-7xl font-bold text-primary-dark mb-4">
          404
        </h1>
        <p className="font-serif text-2xl text-secondary-grey-600 mb-8">
          找不到您要的頁面
        </p>
        <Button variant="default" size="lg" href="/">
          返回首頁
        </Button>
      </div>
    </div>
  )
}

