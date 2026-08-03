'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'

type Faq = { q: string; a: string }

export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
      {faqs.map((faq, i) => {
        const isOpen = openFaq === i
        return (
          <div
            key={i}
            className={`overflow-hidden rounded-2xl border bg-white backdrop-blur-xl shadow-sm transition-all duration-300 ${
              isOpen
                ? 'border-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.12)]'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <button
              onClick={() => setOpenFaq(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[13.5px] font-medium text-slate-800"
            >
              {faq.q}
              <Plus
                size={18}
                className={`shrink-0 transition-all duration-300 ${
                  isOpen ? 'rotate-45 text-emerald-400' : 'text-slate-500'
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <p className="border-t border-slate-100 px-4 py-3 text-[12.5px] leading-relaxed text-slate-600">
                  {faq.a}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
