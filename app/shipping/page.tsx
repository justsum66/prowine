"use client";

import { Truck, Package, Store, MapPin, Clock, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

const shippingMethods = [
  {
    icon: Truck,
    title: "宅配到府",
    description: "直接送到您指定的地址",
    details: [
      "全台本島皆可配送",
      "單筆訂單滿 3,000 元免運費",
      "未滿 3,000 元運費 150 元",
      "下單後 3-5 個工作天送達",
      "可指定送貨時段（需提前預約）",
    ],
    price: "滿 3,000 元免運，未滿 150 元",
  },
  {
    icon: Package,
    title: "超商取貨",
    description: "7-11、全家、萊爾富、OK便利商店",
    details: [
      "全台超商門市皆可取貨",
      "運費統一 60 元",
      "下單後 2-3 個工作天到店",
      "到店後保留 7 天",
      "收到簡訊通知後即可取貨",
    ],
    price: "統一 60 元",
  },
  {
    icon: Store,
    title: "門市自取",
    description: "台北、台中、高雄門市",
    details: [
      "下單後 1-2 個工作天可自取",
      "需先確認庫存",
      "免運費",
      "可現場試飲（需預約）",
      "專業侍酒師現場服務",
    ],
    price: "免運費",
  },
];

const deliveryInfo = [
  {
    icon: Clock,
    title: "配送時間",
    content: "週一至週五 9:00-18:00 配送，週末及國定假日不配送",
  },
  {
    icon: MapPin,
    title: "配送範圍",
    content: "全台本島皆可配送，離島地區請聯繫客服確認運費",
  },
  {
    icon: DollarSign,
    title: "運費說明",
    content: "宅配滿 3,000 元免運，未滿 150 元；超商取貨統一 60 元；門市自取免運",
  },
];

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <section className="bg-white border-b border-neutral-200">
        <div className="container-custom py-16">
          <div className="flex items-center gap-4 mb-4">
            <Truck className="w-12 h-12 text-primary-600" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900">
              運送資訊
            </h1>
          </div>
          <p className="text-lg text-neutral-600">
            多種運送方式，滿足您的需求
          </p>
        </div>
      </section>

      {/* Shipping Methods */}
      <section className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {shippingMethods.map((method, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md border border-neutral-200 p-8 hover:shadow-xl transition-shadow"
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <method.icon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-2xl font-serif font-semibold text-neutral-900 mb-2">
                {method.title}
              </h3>
              <p className="text-neutral-600 mb-4">{method.description}</p>
              <div className="mb-4">
                <p className="text-sm font-semibold text-primary-600 mb-2">
                  運費：{method.price}
                </p>
                <ul className="space-y-2">
                  {method.details.map((detail, i) => (
                    <li key={i} className="text-sm text-neutral-600 flex items-start gap-2">
                      <span className="text-primary-600 mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-8">
          <h2 className="text-3xl font-serif font-semibold text-neutral-900 mb-8">
            運送說明
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {deliveryInfo.map((info, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <info.icon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    {info.title}
                  </h3>
                  <p className="text-sm text-neutral-600">{info.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-primary-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-serif font-semibold text-neutral-900 mb-4">
            需要協助？
          </h3>
          <p className="text-neutral-600 mb-6">
            如有任何運送相關問題，歡迎聯繫我們
          </p>
          <a
            href="https://line.me/R/ti/p/@415znht"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            聯繫客服
          </a>
        </div>
      </section>
    </div>
  );
}

