/* =========================================
   COMMUNITY RESOURCES DIRECTORY STYLES
========================================= */

:root {
  --navy: #0f1f38;
  --blue: #1c5d99;
  --blue-hover: #144470;
  --blue-light: #eef5fc;
  --text: #1e293b;
  --muted: #556980;
  --bg: #f5f7fa;
  --surface: #ffffff;
  --border: #d7e0e9;
  --radius: 10px;
  --shadow: 0 2px 10px rgba(15, 31, 56, 0.06);

  /* Category tag colors */
  --tag-food-bg: #fef3c7;
  --tag-food-text: #92400e;
  --tag-crisis-bg: #fee2e2;
  --tag-crisis-text: #991b1b;
  --tag-health-bg: #e0f2fe;
  --tag-health-text: #075985;
  --tag-housing-bg: #ede9fe;
  --tag-housing-text: #5b21b6;
  --tag-default-bg: #eef2f6;
  --tag-default-text: #334155;
}

*, *::before, *::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.5;
  font-size: 16px;
}

:focus-visible {
  outline: 3px solid #d97706;
  outline-offset: 3px;
}

.container {
  width: min(1160px, calc(100% - 36px));
  margin-inline: auto;
}

/* SKIP LINK */
.skip-link {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #ffffff;
  color: var(--navy);
  padding: 8px 14px;
  font-weight: 700;
  border-radius: 6px;
  transform: translateY(-160%);
  z-index: 1000;
}
.skip-link:focus {
  transform: translateY(0);
}

/* CRISIS BANNER */
.crisis-banner {
  background: #fef2f2;
  border-bottom: 1px solid #fecaca;
  padding: 8px 0;
  color: #991b1b;
  font-size: 0.88rem;
}
.crisis-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.crisis-badge {
  background: #dc2626;
  color: #ffffff;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
}
.crisis-banner p { margin: 0; }

/* HEADER */
.site-header {
  background: var(--navy);
  color: #ffffff;
}
.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-block: 14px;
}
.site-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffffff;
  font-size: 1.15rem;
  font-weight: 700;
  text-decoration: none;
}
.logo-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  font-size: 1.2rem;
}
.header-location {
  margin: 0;
  color: #cbd5e1;
  font-size: 0.9rem;
}

/* HERO */
.hero {
  background: #ffffff;
  padding: 44px 0 36px;
  border-bottom: 1px solid var(--border);
}
.eyebrow {
  margin: 0 0 6px;
  color: var(--blue);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}
.hero h1 {
  margin: 0 0 10px;
  font-size: clamp(1.8rem, 4vw, 2.7rem);
  color: var(--navy);
}
.hero-description {
  margin: 0;
  max-width: 680px;
  color: var(--muted);
  font-size: 1.05rem;
}

/* SECTIONS */
.essential-section, .directory-section {
  padding-block: 40px;
}
.essential-section {
  background: #fdfdf9;
  border-bottom: 1px solid var(--border);
}
.section-heading h2 {
  margin: 0 0 16px;
  font-size: 1.6rem;
  color: var(--navy);
}

/* QUICK PILLS */
.quick-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.pill-btn {
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: #ffffff;
  color: var(--text);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.pill-btn:hover {
  background: var(--blue-light);
  border-color: var(--blue);
}
.pill-btn.active {
  background: var(--navy);
  color: #ffffff;
  border-color: var(--navy);
}

/* FILTER PANEL */
.filter-panel {
  display: grid;
  grid-template-columns: minmax(240px, 2fr) minmax(170px, 1fr) minmax(170px, 1fr) auto;
  gap: 14px;
  align-items: end;
  padding: 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.search-field label, .filter-field label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--navy);
}
.search-wrap {
  position: relative;
}
input[type="search"], select {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #b8c5d1;
  border-radius: 6px;
  background: #ffffff;
  font-size: 0.95rem;
}
.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  font-size: 1.4rem;
  color: var(--muted);
  cursor: pointer;
}

/* BUTTONS */
.button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  padding: 9px 14px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
}
.button-primary {
  background: var(--blue);
  color: #ffffff;
}
.button-primary:hover {
  background: var(--blue-hover);
}
.button-secondary {
  border-color: #b8c5d1;
  background: #ffffff;
  color: var(--navy);
}
.button-secondary:hover {
  background: var(--blue-light);
}
.full-width { width: 100%; }

/* RESULTS GRID */
.results-heading {
  margin: 20px 0 14px;
  font-weight: 700;
  color: var(--muted);
}
.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 20px;
}

/* RESOURCE CARDS */
.resource-card, .featured-card {
  display: flex;
  flex-direction: column;
  padding: 22px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.resource-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(15, 31, 56, 0.08);
}
.card-topline {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}
.card-icon {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  background: var(--blue-light);
  border-radius: 8px;
  font-size: 1.35rem;
}
.card-topline h3 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--navy);
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.tag {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.76rem;
  font-weight: 700;
  background: var(--tag-default-bg);
  color: var(--tag-default-text);
}
.tag.food { background: var(--tag-food-bg); color: var(--tag-food-text); }
.tag.crisis { background: var(--tag-crisis-bg); color: var(--tag-crisis-text); }
.tag.health { background: var(--tag-health-bg); color: var(--tag-health-text); }
.tag.housing { background: var(--tag-housing-bg); color: var(--tag-housing-text); }

.resource-offer {
  margin: 0 0 16px;
  color: var(--text);
  font-size: 0.92rem;
  flex-grow: 1; /* Aligns card buttons evenly */
}
.resource-meta {
  display: grid;
  gap: 5px;
  padding-block: 10px;
  border-top: 1px solid #f0f3f6;
  font-size: 0.86rem;
  color: var(--muted);
}
.resource-meta p { margin: 0; }

/* DIRECT ACTIONS ROW */
.card-actions {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 6px;
  margin-top: 8px;
}
.action-btn-call {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  padding: 8px 11px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  display: flex;
  align-items: center;
}
.action-btn-call:hover { background: #d1fae5; }

.action-btn-web {
  background: #ffffff;
  color: var(--blue);
  border: 1px solid var(--border);
  padding: 8px 11px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  display: flex;
  align-items: center;
}
.action-btn-web:hover { background: var(--blue-light); }

/* FEATURED CARDS */
.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 16px;
}
.featured-card {
  border-left: 5px solid #d97706;
  background: #fffdf5;
}
.featured-badge {
  align-self: flex-start;
  padding: 2px 7px;
  background: #ffffff;
  border: 1px solid #fde68a;
  border-radius: 4px;
  font-size: 0.74rem;
  font-weight: 800;
  color: #92400e;
  text-transform: uppercase;
}
.featured-card h3 { margin: 8px 0 4px; }
.featured-card p { margin: 0 0 12px; font-size: 0.92rem; }

/* CONTRIBUTION SECTION */
.contribute-section {
  padding: 30px 0 60px;
}
.contribute-card {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 28px;
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.contribute-icon {
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--blue-light);
  color: var(--blue);
  font-size: 2rem;
  font-weight: 300;
}
.contribute-content h2 { margin: 0 0 6px; font-size: 1.35rem; }
.contribute-content p { margin: 0 0 16px; color: var(--muted); }
.contribute-buttons { display: flex; flex-wrap: wrap; gap: 10px; }

/* FORMS */
.form-group {
  margin-bottom: 14px;
}
.form-group label {
  display: block;
  font-weight: 700;
  font-size: 0.88rem;
  margin-bottom: 5px;
}
.form-group input, .form-group select, .form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #b8c5d1;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
}
.contribute-sub { margin-top: 0; color: var(--muted); font-size: 0.9rem; }

/* MODALS / DIALOG */
.resource-dialog {
  width: min(650px, calc(100% - 32px));
  max-height: 85vh;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  background: #ffffff;
}
.resource-dialog::backdrop {
  background: rgba(15, 31, 56, 0.6);
  backdrop-filter: blur(2px);
}
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border);
}
.dialog-header h2 { margin: 0; }
.dialog-close {
  border: none;
  background: transparent;
  font-size: 1.8rem;
  cursor: pointer;
  color: var(--muted);
  line-height: 1;
}
.dialog-content { padding: 22px 24px; display: grid; gap: 14px; overflow-y: auto; }
.detail-item h4 { margin: 0 0 3px; font-size: 0.88rem; color: var(--muted); text-transform: uppercase; }
.detail-item p { margin: 0; }
.dialog-footer { padding: 14px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; }

/* EMPTY & ERROR */
.empty-state, .error-message {
  padding: 30px;
  text-align: center;
  border-radius: var(--radius);
  background: #ffffff;
  border: 1px solid var(--border);
}
.empty-icon { font-size: 2rem; }
.error-message { border-color: #fca5a5; background: #fff5f5; color: #991b1b; }

/* FOOTER */
.site-footer {
  background: var(--navy);
  color: #ffffff;
  padding: 28px 0;
  text-align: center;
  font-size: 0.88rem;
}
.site-footer p { margin: 4px 0; }
.footer-subtext { color: #94a3b8; font-size: 0.8rem; }

/* RESPONSIVE */
@media (max-width: 900px) {
  .filter-panel { grid-template-columns: 1fr 1fr; }
  .filter-actions { grid-column: 1 / -1; }
}
@media (max-width: 600px) {
  .filter-panel { grid-template-columns: 1fr; }
  .card-actions { grid-template-columns: 1fr 1fr; }
  .card-actions .button { grid-column: 1 / -1; }
  .contribute-card { flex-direction: column; }
}
