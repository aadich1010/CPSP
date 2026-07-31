'use client';
import { useState } from 'react';

type Faq = { q: string; a: string };

export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="faq-wrap">
      {faqs.map((faq, i) => (
        <div className="faq-item" key={i}>
          <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
            {faq.q}
            <span className={`faq-icon ${openFaq === i ? 'open' : ''}`}>
              {openFaq === i ? '−' : '+'}
            </span>
          </button>
          {openFaq === i && <p className="faq-ans">{faq.a}</p>}
        </div>
      ))}
    </div>
  );
}
