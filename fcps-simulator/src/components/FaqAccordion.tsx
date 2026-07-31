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
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-white/20"
          >
            <button
              onClick={() => setOpenFaq(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-zinc-100"
            >
              {faq.q}
              <Plus
                size={18}
                className={`shrink-0 text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-45 text-teal-400' : ''}`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-[14px] leading-relaxed text-zinc-400">{faq.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
