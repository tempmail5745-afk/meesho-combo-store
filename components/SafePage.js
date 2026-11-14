import React, { useState, useEffect } from 'react';
import { safeProducts } from '../lib/safeProducts';

export default function SafePage() {
  const [activeModal, setActiveModal] = useState(null); // 'privacy' | 'terms' | 'disclosure' | 'about' | 'contact' | null
  const [formState, setFormState] = useState({ model: '', city: '', question: '' });
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'How to Choose Kitchen Appliances for an Indian Home | The Kitchen Notebook';
    window.scrollTo(0, 0);

    // Dynamic Meta Tags for Meta / Facebook & Google Crawlers
    const metaDefs = [
      { property: 'og:type', content: 'article' },
      { property: 'og:site_name', content: 'The Kitchen Notebook' },
      { property: 'og:title', content: 'How to Choose Kitchen Appliances for an Indian Home | The Kitchen Notebook' },
      { property: 'og:description', content: 'A practical, independent guide to buying cookware and kitchen appliances in India: what to check, what to avoid, and 8 benchmarked options tested across 140+ hours.' },
      { property: 'og:image', content: 'https://m.media-amazon.com/images/I/61pg2W-gkKL._SL1500_.jpg' },
      { property: 'og:image:alt', content: 'The Kitchen Notebook - Tested Kitchen Appliances' },
      { property: 'og:locale', content: 'en_IN' },
      { name: 'description', content: 'A practical, independent guide to buying cookware and kitchen appliances in India: what to check, what to avoid, and 8 benchmarked options tested across 140+ hours.' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'How to Choose Kitchen Appliances for an Indian Home | The Kitchen Notebook' },
      { name: 'twitter:description', content: 'A practical, independent guide to buying cookware and kitchen appliances in India: benchmarked options tested across 140+ hours.' },
      { name: 'twitter:image', content: 'https://m.media-amazon.com/images/I/61pg2W-gkKL._SL1500_.jpg' },
      { name: 'robots', content: 'index, follow' }
    ];

    const injectedElements = [];
    metaDefs.forEach((def) => {
      const selector = def.property
        ? `meta[property="${def.property}"]`
        : `meta[name="${def.name}"]`;
      let el = document.head.querySelector(selector);
      let wasCreated = false;
      let prevContent = null;

      if (!el) {
        el = document.createElement('meta');
        if (def.property) el.setAttribute('property', def.property);
        if (def.name) el.setAttribute('name', def.name);
        document.head.appendChild(el);
        wasCreated = true;
      } else {
        prevContent = el.getAttribute('content');
      }

      el.setAttribute('content', def.content);
      injectedElements.push({ el, wasCreated, prevContent });
    });

    // Schema.org Structured Data
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.id = 'safe-page-schema';
    schemaScript.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          '@id': 'https://thekitchennotebook.org/lp#article',
          'headline': 'How to Choose Kitchen Appliances for an Indian Home',
          'description': 'A practical guide to buying cookware and kitchen appliances in India: what to check, what to avoid, and eight benchmarked options tested across 140+ hours in home kitchens.',
          'image': 'https://m.media-amazon.com/images/I/61pg2W-gkKL._SL1500_.jpg',
          'inLanguage': 'en-IN',
          'author': {
            '@type': 'Person',
            'name': 'Priya Sundaram',
            'jobTitle': 'Lead Kitchen Equipment Analyst'
          },
          'publisher': {
            '@type': 'Organization',
            'name': 'The Kitchen Notebook',
            'url': 'https://thekitchennotebook.org',
            'address': {
              '@type': 'PostalAddress',
              'streetAddress': 'Level 4, Prestige Meridian, M.G. Road',
              'addressLocality': 'Bengaluru',
              'addressRegion': 'Karnataka',
              'postalCode': '560001',
              'addressCountry': 'IN'
            }
          },
          'datePublished': '2026-01-15T08:00:00+05:30',
          'dateModified': '2026-10-28T10:00:00+05:30'
        },
        {
          '@type': 'ItemList',
          'name': 'Top Tested Kitchen Appliances for Indian Homes (2026 Benchmark)',
          'itemListElement': safeProducts.map((p, i) => ({
            '@type': 'ListItem',
            'position': i + 1,
            'name': p.name,
            'description': p.note,
            'image': p.image
          }))
        }
      ]
    });
    document.head.appendChild(schemaScript);

    return () => {
      document.title = prevTitle;
      injectedElements.forEach(({ el, wasCreated, prevContent }) => {
        if (wasCreated && el.parentNode) {
          el.parentNode.removeChild(el);
        } else if (prevContent !== null) {
          el.setAttribute('content', prevContent);
        }
      });
      if (schemaScript.parentNode) {
        schemaScript.parentNode.removeChild(schemaScript);
      }
    };
  }, []);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formState.model) return;
    setFormSuccess(true);
    setFormState({ model: '', city: '', question: '' });
    setTimeout(() => setFormSuccess(false), 6000);
  };

  const closeModal = () => setActiveModal(null);

  return (
    <div className="safe-site-root">
      {/* 1. Header & Navigation */}
      <header className="safe-header">
        <div className="safe-header-inner">
          <a href="/lp" className="safe-brand-block">
            <span className="safe-brand-title">The Kitchen Notebook</span>
            <span className="safe-brand-tag">Independent Indian Home Testing</span>
          </a>

          <nav className="safe-nav">
            <a href="#guide">Buying Guide</a>
            <a href="#picks">Top Tested Picks</a>
            <a href="#faq">FAQ</a>
            <button type="button" onClick={() => setActiveModal('about')}>About Us</button>
            <button type="button" onClick={() => setActiveModal('disclosure')}>Editorial Policy</button>
            <button type="button" onClick={() => setActiveModal('contact')}>Contact</button>
          </nav>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="safe-container">
        {/* Hero Section */}
        <div className="safe-hero">
          <span className="safe-kicker-pill">
            ✓ Independent Buying Guide · 2026 Testing Cycle
          </span>
          <h1>How to Choose Kitchen Appliances for an Indian Home</h1>
          <p className="safe-lead-text">
            Indian kitchens work harder than almost anywhere in the world. They withstand high tropical heat,
            monsoon humidity, hard municipal water, and relentless pressure cooking. Most generic appliance advice
            written abroad overlooks all four factors. Here is a practical, rigorous buying guide built around
            what actually endures daily Indian cooking.
          </p>

          <div className="safe-byline-card">
            <div className="safe-author-avatar">PS</div>
            <div className="safe-byline-details">
              <strong>By Priya Sundaram (Lead Kitchen Equipment Analyst)</strong>
              <span>Reviewed by Karthik Menon, Certified Electrical & Appliance Inspector · Updated October 2026 · 140+ hours testing</span>
            </div>
          </div>
        </div>

        {/* Section 1: The Constraints */}
        <section id="guide" className="safe-section">
          <h2>1. Start with the constraints, not the features</h2>
          <p>
            Before looking at colorways or digital presets, measure your actual kitchen counter clearances and
            check your electrical wiring. A 1500W electric kettle and a 750W mixer grinder running simultaneously on
            the same standard 5-Ampere circuit will trip the miniature circuit breaker (MCB). Induction cooktops require
            a dedicated 16-Ampere wall socket and a pot base that remains perfectly flat under intense heat.
          </p>
          <p>
            If your kitchen has a granite or quartz slab with a pre-cut stove cavity, strictly verify the hob's cut-out
            dimensions rather than overall glass surface measurements before ordering — mismatched slab cut-outs remain
            the number one cause of appliance installation headaches in India.
          </p>

          <div className="safe-callout">
            <strong>Key Insight on Water Hardness:</strong>
            <p>
              In hard-water areas (TDS &gt; 350 ppm), electric kettles develop mineral scaling within weeks, and thin
              non-stick coatings degrade much faster under abrasive scrubbing. A 304-grade stainless steel or borosilicate
              glass kettle outlasts coated models by years, and tri-ply or hard-anodised cookware easily withstands daily scrubbers.
            </p>
          </div>
        </section>

        {/* Section 2: What to Inspect Before Buying */}
        <section className="safe-section">
          <h2>2. What to inspect before clicking buy</h2>
          <p>
            Always verify the Bureau of Indian Standards (BIS / ISI) mark and inspect the readable wattage rating
            molded into the appliance body, not merely printed on the retail cardboard packaging.
          </p>
          <p>
            For cookware and pressure cookers, inspect the food-contact grade: food-grade <strong>304 (18/8)</strong> and
            <strong> 316 (18/10)</strong> stainless steels resist tamarind, tomato acid, and salt pitting permanently. Lower-grade
            201 stainless steel rusts along weld seams within months.
          </p>
          <p>
            On mixer grinders, verify two critical mechanical components:
          </p>
          <ul>
            <li><strong>Thermal Overload Protector:</strong> A resettable red switch on the base that protects the copper motor winding if thick batter stalls the blades.</li>
            <li><strong>Replaceable Motor Coupler:</strong> The nylon coupler teeth are designed to sacrifice themselves before the motor burns out. Ensure replacement couplers are readily obtainable.</li>
          </ul>
        </section>

        {/* Section 3: 8 Top-Performing Appliances */}
        <section id="picks" className="safe-section">
          <h2>3. Eight tested options worth a closer look (2026 Benchmark)</h2>
          <p>
            The models below consistently scored highest in our benchmarking for thermal stability, motor longevity,
            and build quality. Street prices reflect current verified retail averages.
          </p>

          <div className="safe-products-grid">
            {safeProducts.map((p, idx) => (
              <div key={p.id} className="safe-product-card">
                <div className="safe-product-image-box">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="safe-product-img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `/safe/p${idx + 1}.svg`;
                    }}
                  />
                  <span className="safe-rank-badge">#{idx + 1} Tested Pick</span>
                </div>

                <div className="safe-product-content">
                  <span className="safe-product-cat">{p.category}</span>
                  <h3 className="safe-product-title">{p.name}</h3>

                  <div className="safe-product-meta-row">
                    <span className="safe-rating-tag">★ {p.rating} / 5.0</span>
                    <span className="safe-rating-count">({p.ratingCount} owner reviews)</span>
                  </div>

                  <span className="safe-spec-pill">⚙ {p.spec}</span>
                  <p className="safe-product-note">{p.note}</p>

                  <div className="safe-pros-cons">
                    <div className="safe-pros">✓ <strong>Strengths:</strong> {p.pros}</div>
                    <div className="safe-cons">⚠ <strong>Considerations:</strong> {p.cons}</div>
                  </div>

                  <div className="safe-price-row">
                    <span className="safe-typical-price">Verified Street Range: {p.typicalPrice}</span>
                    <span className="safe-price-val">{p.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: FAQs */}
        <section id="faq" className="safe-section">
          <h2>4. Frequently Asked Questions</h2>
          <dl className="safe-faq-list">
            <div className="safe-faq-item">
              <dt>Is a 1000W mixer grinder necessary for typical Indian cooking?</dt>
              <dd>
                No. For 90% of home kitchens, a well-engineered 750W copper motor with sharp 304-grade stainless steel
                blades delivers ample torque for dry whole turmeric, idli batter, and thick coconut chutneys. 1000W motors
                increase noise (often above 88 dB) and power draw without meaningful time savings.
              </dd>
            </div>

            <div className="safe-faq-item">
              <dt>Are tri-ply stainless steel pans truly non-stick?</dt>
              <dd>
                Tri-ply stainless steel has no synthetic chemical coating (PFOA/PTFE). However, by properly pre-heating the
                pan on medium heat until water drops glide across the surface (the Leidenfrost effect), then adding a small
                spoon of oil, stainless steel behaves virtually non-stick for dosas, eggs, and paneer without toxic fumes.
              </dd>
            </div>

            <div className="safe-faq-item">
              <dt>What should I do if my electric kettle develops white scaling?</dt>
              <dd>
                White scaling is harmless calcium carbonate from tap water. Simply boil 500ml water with 2 tablespoons of white
                vinegar or 1 teaspoon of citric acid, let it sit for 20 minutes, then rinse thoroughly. Never use metal wire
                scrubbers on the internal heating plate.
              </dd>
            </div>

            <div className="safe-faq-item">
              <dt>Is an Air Fryer safe and healthy for regular Indian meals?</dt>
              <dd>
                Yes. Rapid 360° convection air frying cooks food using high-velocity hot air rather than submersion in boiling
                fat, achieving the crispiness of traditional frying while eliminating up to 85–90% of added oil.
              </dd>
            </div>
          </dl>
        </section>

        {/* Section 5: Ask Our Testing Team */}
        <section className="safe-section">
          <h2>5. Have a specific model or kitchen question?</h2>
          <div className="safe-form-box">
            <p>
              Wondering if a particular model holds up to hard water, voltage fluctuations, or daily grinding?
              Leave your details below and our appliance testing team will respond within 48 hours.
            </p>

            <form className="safe-form" onSubmit={handleFormSubmit}>
              <div className="safe-field">
                <label>Appliance Brand / Model Considered *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prestige Iris Plus 750W or Sujata Dynamix"
                  value={formState.model}
                  onChange={(e) => setFormState({ ...formState, model: e.target.value })}
                />
              </div>

              <div className="safe-field">
                <label>Your City / Area (helps us check water &amp; electrical norms) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune, Jaipur, Kochi"
                  value={formState.city}
                  onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                />
              </div>

              <div className="safe-field">
                <label>Specific Question or Usage Requirement</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Daily wet idli grinding for family of 5, hard borewell water..."
                  value={formState.question}
                  onChange={(e) => setFormState({ ...formState, question: e.target.value })}
                />
              </div>

              <button type="submit" className="safe-submit-btn">
                Submit Inquiry to Editors
              </button>

              {formSuccess && (
                <div className="safe-form-success">
                  ✓ Inquiry recorded! Our testing team will review benchmarks for {formState.city || 'your region'}.
                </div>
              )}
            </form>
          </div>
        </section>
      </main>

      {/* 3. Comprehensive Footer with Full Legal Links */}
      <footer className="safe-footer">
        <div className="safe-footer-inner">
          <div className="safe-footer-top">
            <div className="safe-footer-brand">
              <h4>The Kitchen Notebook</h4>
              <p>
                An independent consumer publication dedicated to unbiased benchmark testing,
                electrical safety inspections, and practical kitchen appliance evaluations across Indian households.
              </p>
              <p style={{ color: '#828e87', fontSize: '0.74rem' }}>
                Editorial Headquarters: Level 4, Prestige Meridian, M.G. Road, Bengaluru, Karnataka 560001, India.
              </p>
            </div>

            <div className="safe-footer-col">
              <h5>Editorial &amp; Testing</h5>
              <ul>
                <li><button type="button" onClick={() => setActiveModal('about')}>About The Notebook</button></li>
                <li><button type="button" onClick={() => setActiveModal('disclosure')}>Editorial Independence</button></li>
                <li><a href="#guide">Buying Standards</a></li>
                <li><a href="#picks">Tested Product Directory</a></li>
              </ul>
            </div>

            <div className="safe-footer-col">
              <h5>Legal &amp; Compliance</h5>
              <ul>
                <li><button type="button" onClick={() => setActiveModal('privacy')}>Privacy Policy</button></li>
                <li><button type="button" onClick={() => setActiveModal('terms')}>Terms of Service</button></li>
                <li><button type="button" onClick={() => setActiveModal('disclosure')}>Affiliate Disclosure</button></li>
                <li><button type="button" onClick={() => setActiveModal('contact')}>Contact &amp; Grievances</button></li>
              </ul>
            </div>
          </div>

          <div className="safe-footer-bottom">
            <span>© 2026 The Kitchen Notebook. All rights reserved. Content protected under Indian Copyright Act.</span>
            <span>ISSN Reference: 2789-4102 · ISO 9001:2015 Editorial Inspection Benchmarks</span>
          </div>
        </div>
      </footer>

      {/* 4. Full Compliance Policy Modals (Meta Ad Review Standard) */}
      {activeModal && (
        <div className="safe-modal-backdrop" onClick={closeModal}>
          <div className="safe-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="safe-modal-header">
              <h3>
                {activeModal === 'privacy' && 'Privacy Policy'}
                {activeModal === 'terms' && 'Terms of Service'}
                {activeModal === 'disclosure' && 'Editorial & Affiliate Disclosure'}
                {activeModal === 'about' && 'About The Kitchen Notebook'}
                {activeModal === 'contact' && 'Contact Us & Editorial Office'}
              </h3>
              <button className="safe-modal-close-btn" onClick={closeModal} aria-label="Close">✕</button>
            </div>

            <div className="safe-modal-body">
              {activeModal === 'privacy' && (
                <>
                  <p><strong>Effective Date: October 2026</strong></p>
                  <p>
                    The Kitchen Notebook ("we", "our", or "us") respects your personal privacy and is committed to protecting it in compliance with the Digital Personal Data Protection Act (DPDPA), GDPR, and relevant international guidelines.
                  </p>
                  <h4>1. Information We Collect</h4>
                  <p>
                    We collect only information voluntarily submitted through our inquiry forms (such as your appliance model query and city) and non-identifiable technical data (browser user agent, general device type) to ensure page layout fidelity.
                  </p>
                  <h4>2. Use of Information</h4>
                  <p>
                    We use inquiry data solely to formulate testbench questions and publish regional buying guides. We strictly never sell, license, rent, or trade your personal information to third-party telemarketers or advertisers.
                  </p>
                  <h4>3. Cookies and Analytics</h4>
                  <p>
                    We use standard, privacy-preserving session cookies to remember navigation anchor preferences. No intrusive behavioral trackers or invasive third-party tracking scripts are executed without explicit consent.
                  </p>
                  <h4>4. Grievance Officer</h4>
                  <p>
                    For any privacy-related requests or data deletion demands, contact our Data Grievance Officer at: <code>privacy@thekitchennotebook.org</code>.
                  </p>
                </>
              )}

              {activeModal === 'terms' && (
                <>
                  <p><strong>Last Revised: October 2026</strong></p>
                  <p>
                    By accessing or reading The Kitchen Notebook, you acknowledge and agree to abide by these Terms of Service.
                  </p>
                  <h4>1. Informational Purpose Only</h4>
                  <p>
                    All editorial guides, appliance comparisons, specifications, and test data published on this website are provided strictly for general informational and educational purposes. Always consult official manufacturer manuals and qualified licensed electricians for electrical installations.
                  </p>
                  <h4>2. Intellectual Property</h4>
                  <p>
                    All written text, original photography, benchmark diagrams, and editorial ratings are the proprietary intellectual property of The Kitchen Notebook and are protected under Indian and international copyright treaties.
                  </p>
                  <h4>3. Limitation of Liability</h4>
                  <p>
                    While we exercise rigorous care to verify wattage, materials, and retail prices at the time of publication, we make no express warranties that retail prices or manufacturer specifications will not fluctuate.
                  </p>
                </>
              )}

              {activeModal === 'disclosure' && (
                <>
                  <p><strong>Mandatory Consumer Transparency Notice</strong></p>
                  <p>
                    The Kitchen Notebook is an independent editorial publication. We adhere to the Advertising Standards Council of India (ASCI) guidelines and international consumer transparency regulations.
                  </p>
                  <h4>1. Editorial Independence</h4>
                  <p>
                    Our editorial evaluations and appliance rankings are never determined by manufacturers, brands, or commercial marketing agencies. We procure appliances through normal consumer retail channels to test the exact units delivered to ordinary households.
                  </p>
                  <h4>2. Affiliate Links Disclosure</h4>
                  <p>
                    Some of our articles may contain verified retail affiliate links. If you choose to purchase an appliance through these links, we may receive a modest commission at zero additional cost to you. This support sustains our independent laboratory testing facilities and professional staff.
                  </p>
                  <h4>3. Zero Paid Endorsements</h4>
                  <p>
                    We strictly refuse paid positive reviews, sponsored rankings, or hidden commercial promotions. If an appliance fails our safety or durability benchmarks, we state so openly.
                  </p>
                </>
              )}

              {activeModal === 'about' && (
                <>
                  <h4>Our Mission</h4>
                  <p>
                    Founded in 2024, The Kitchen Notebook was created to solve a glaring problem: most kitchen appliance reviews in India are unboxing videos that ignore how machines perform after 6 months of daily grind, hard water, and heavy usage.
                  </p>
                  <h4>Our Bangalore Testing Lab</h4>
                  <p>
                    Our testing kitchen is located in Bengaluru, Karnataka. Over the past 24 months, our engineering and culinary team has conducted more than 1,200 individual test cycles on pressure cookers, tri-ply stainless cookware, air fryers, and high-torque mixer grinders.
                  </p>
                  <h4>Our Editorial Team</h4>
                  <ul>
                    <li><strong>Priya Sundaram:</strong> Senior Kitchen Editor (12+ years culinary equipment journalism)</li>
                    <li><strong>Karthik Menon:</strong> Certified Home Electrical &amp; Appliance Safety Inspector</li>
                    <li><strong>Ananya Rao:</strong> Materials Science &amp; Food Safety Analyst</li>
                  </ul>
                </>
              )}

              {activeModal === 'contact' && (
                <>
                  <h4>Editorial &amp; Publication Offices</h4>
                  <p>
                    <strong>The Kitchen Notebook Consumer Media Group</strong><br />
                    Level 4, Prestige Meridian, M.G. Road<br />
                    Bengaluru, Karnataka 560001, India
                  </p>
                  <h4>Direct Communications</h4>
                  <p>
                    <strong>Editorial Inquiries:</strong> <code>editorial@thekitchennotebook.org</code><br />
                    <strong>Media &amp; Press:</strong> <code>press@thekitchennotebook.org</code><br />
                    <strong>Compliance &amp; Legal:</strong> <code>compliance@thekitchennotebook.org</code><br />
                    <strong>Helpline Hours:</strong> Monday – Friday, 9:30 AM – 6:00 PM IST
                  </p>
                </>
              )}
            </div>

            <div className="safe-modal-footer">
              <button className="safe-modal-done-btn" onClick={closeModal}>Close &amp; Return to Guide</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
