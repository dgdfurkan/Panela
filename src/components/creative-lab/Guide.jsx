import { useState } from 'react'
import { Sparkles, Lightbulb, BookOpen, Rocket } from 'lucide-react'

const accordionItems = [
  { title: 'Shopify Mağazası İçin Güven Öğeleri', points: ['Güven rozetlerini fold üstünde göster', 'İade/garanti mesajını CTA yakınında konumlandır', 'Gerçek müşteri fotoğrafları ve yıldızları ekle'] },
  { title: 'Etkileyici Hook Nasıl Yazılır?', points: ['İlk 3 saniyede problemi söyle', 'Somut sonuç ver: 2x hız, %30 indirim', 'Merak uyandır: “Peki ya…” ile devam et'] },
  { title: 'Fiyatlandırma Psikolojisi', points: ['Anchor fiyat: Eski fiyatı silik göster', 'Kısıtlı stok veya süre: “Son 24 saat” etiketi', 'Bonus ekle: Ücretsiz kargo veya mini rehber'] }
]

const smartTips = [
  { title: 'Fiziksel Ürün', desc: 'Video reklamda kullanım demosu ilk 3 saniyede. Ses kapalıyken de anlaşılır altyazı ekle.' },
  { title: 'Dijital Ürün', desc: 'Ekran kaydı + testimonial kombosu. Demo linkini CTA’ya yerleştir.' },
  { title: 'Abonelik', desc: '“İptal etmesi kolay” mesajını vurgula. İlk ay %50 indirim kuponu ekle.' }
]

export default function Guide() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className="guide-view fade-in">
      <div className="hero glass-panel">
        <div>
          <p className="eyebrow">Creative Lab · İlham Alanı</p>
          <h2 className="title text-gradient">“Ben yeniyim, ne yapmalıyım?”</h2>
          <p className="subtitle">Bu panel sana hazır taktikler, kopya formülleri ve güven öğeleri ile rehberlik eder.</p>
          <div className="chips">
            <span className="chip"><Sparkles size={16} /> Adım adım rehber</span>
            <span className="chip"><Lightbulb size={16} /> İlham kartları</span>
            <span className="chip"><Rocket size={16} /> Hızlı başla</span>
          </div>
        </div>
        <BookOpen className="hero-icon" size={64} />
      </div>

      <div className="grid">
        <section className="accordion glass-panel">
          <h3>Hızlı Rehberler</h3>
          {accordionItems.map((item, idx) => (
            <div key={item.title} className={`accordion-item ${openIndex === idx ? 'open' : ''}`}>
              <button className="accordion-header" onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}>
                <span>{item.title}</span>
                <span className="chevron">{openIndex === idx ? '–' : '+'}</span>
              </button>
              {openIndex === idx && (
                <ul className="accordion-body">
                  {item.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>

        <section className="tips">
          {smartTips.map((tip) => (
            <article key={tip.title} className="tip-card glass-panel">
              <div className="tip-header">
                <Lightbulb size={18} />
                <h4>{tip.title}</h4>
              </div>
              <p>{tip.desc}</p>
            </article>
          ))}
        </section>
      </div>

      <style>{`
        .guide-view .hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.75rem;
          border-radius: var(--radius-xl);
          background: linear-gradient(135deg, rgba(139,92,246,0.08), rgba(244,114,182,0.1));
          border: 1px solid rgba(139,92,246,0.15);
        }
        .eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.8px;
          font-size: 0.78rem;
          color: var(--color-text-muted);
          margin-bottom: 0.3rem;
        }
        .title {
          font-size: 1.8rem;
          margin-bottom: 0.35rem;
        }
        .subtitle {
          color: var(--color-text-muted);
          max-width: 520px;
        }
        .muted { color: var(--color-text-muted); }
        .chips {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: 0.75rem;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.75rem;
          border-radius: var(--radius-lg);
          background: white;
          border: 1px solid var(--color-border);
          color: var(--color-text-main);
          font-size: 0.9rem;
        }
        .hero-icon {
          color: var(--color-primary);
          opacity: 0.8;
        }
        .grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 1.25rem;
          margin-top: 1.5rem;
        }
        .accordion {
          padding: 1.25rem;
          border-radius: var(--radius-lg);
        }
        .accordion h3 {
          margin-bottom: 1rem;
        }
        .accordion-item {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: white;
          margin-bottom: 0.75rem;
          overflow: hidden;
        }
        .accordion-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.85rem 1rem;
          font-weight: 600;
          color: var(--color-text-main);
          background: transparent;
        }
        .accordion-body {
          list-style: disc;
          padding: 0.85rem 1.5rem 1rem;
          color: var(--color-text-muted);
        }
        .tips {
          display: grid;
          gap: 0.75rem;
        }
        .tip-card {
          padding: 1rem;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(20,184,166,0.15);
          background: linear-gradient(135deg, rgba(20,184,166,0.06), rgba(255,255,255,0.95));
        }
        .tip-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.35rem;
          color: var(--color-secondary);
        }
        @media (max-width: 960px) {
          .grid {
            grid-template-columns: 1fr;
          }
          .hero {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  )
}

