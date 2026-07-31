'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';

type Faq = { q: string; a: string };

export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      {faqs.map((faq, i) => {
        const isOpen = openFaq === i;
        return (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-teal-200"
          >
            <button
              onClick={() => setOpenFaq(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-slate-900"
            >
              {faq.q}
              <Plus
                size={18}
                className={`shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-45 text-teal-600' : ''}`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-[14px] leading-relaxed text-slate-600">{faq.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
