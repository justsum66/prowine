import { InquiryForm } from '@/components/inquiry/InquiryForm'
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-16 text-center">
        <h1 className="font-display text-5xl font-bold text-primary-dark mb-4">
          聯絡我們
        </h1>
        <p className="font-sans text-lg text-secondary-grey-600">
          有任何問題或需求，歡迎與我們聯繫
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
        {/* Contact Info */}
        <div className="space-y-8">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-primary-dark mb-6">
              聯絡資訊
            </h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <MapPin className="w-6 h-6 text-primary-burgundy mt-1" />
                <div>
                  <p className="font-sans font-semibold text-primary-dark mb-1">
                    會所
                  </p>
                  <p className="font-sans text-base text-secondary-grey-600">
                    台北市大安區樂利路56號
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <MapPin className="w-6 h-6 text-primary-burgundy mt-1" />
                <div>
                  <p className="font-sans font-semibold text-primary-dark mb-1">
                    公司
                  </p>
                  <p className="font-sans text-base text-secondary-grey-600">
                    新北市新店區中興路二段192號9樓
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <MapPin className="w-6 h-6 text-primary-burgundy mt-1" />
                <div>
                  <p className="font-sans font-semibold text-primary-dark mb-1">
                    倉庫
                  </p>
                  <p className="font-sans text-base text-secondary-grey-600">
                    新北市汐止區新台五路一段102號4樓
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Phone className="w-6 h-6 text-primary-burgundy mt-1" />
                <div>
                  <p className="font-sans font-semibold text-primary-dark mb-1">
                    電話
                  </p>
                  <p className="font-sans text-base text-secondary-grey-600">
                    +886-2-27329490
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Mail className="w-6 h-6 text-primary-burgundy mt-1" />
                <div>
                  <p className="font-sans font-semibold text-primary-dark mb-1">
                    Email
                  </p>
                  <p className="font-sans text-base text-secondary-grey-600">
                    service@prowine.com.tw
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <MessageCircle className="w-6 h-6 text-primary-burgundy mt-1" />
                <div>
                  <p className="font-sans font-semibold text-primary-dark mb-1">
                    LINE@
                  </p>
                  <a
                    href={`https://line.me/R/ti/p/${process.env.NEXT_PUBLIC_LINE_ID?.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-base text-primary-burgundy hover:text-primary-gold transition-colors"
                  >
                    {process.env.NEXT_PUBLIC_LINE_ID}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inquiry Form */}
        <div>
          <InquiryForm inquiryType="general" />
        </div>
      </div>
    </div>
  )
}

