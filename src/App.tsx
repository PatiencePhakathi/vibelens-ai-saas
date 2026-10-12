import { useEffect, useMemo, useRef, useState } from "react";

type Page = "dashboard" | "analyse" | "datasets" | "analytics" | "insights" | "reports" | "about";
type Sentiment = "Positive" | "Neutral" | "Negative";
type Review = {
  id: number;
  review: string;
  date?: string;
  category?: string;
  rating?: number;
  sentiment: Sentiment;
  score: number;
};

const positiveWords = new Set([
  "amazing", "awesome", "best", "clear", "delighted", "easy", "efficient", "excellent", "fast",
  "friendly", "good", "great", "helpful", "impressed", "intuitive", "love", "perfect", "pleased",
  "quick", "reliable", "responsive", "satisfied", "smooth", "superb", "value", "wonderful",
]);
const negativeWords = new Set([
  "awful", "bad", "broken", "confusing", "difficult", "disappointed", "expensive", "frustrating",
  "late", "missing", "poor", "problem", "refund", "rude", "slow", "terrible", "unhelpful",
  "unreliable", "waste", "worst", "delayed", "delay", "crashed", "overpriced", "damaged",
]);
const stopWords = new Set([
  "about", "after", "again", "also", "been", "being", "but", "could", "customer", "did", "does",
  "from", "have", "into", "just", "more", "much", "only", "really", "review", "service", "than",
  "that", "the", "their", "there", "they", "this", "very", "was", "were", "what", "when", "with",
  "would", "your", "you", "and", "for", "not", "our", "are", "had", "has", "its", "too",
]);

const sampleRows: Array<[string, string, string, number]> = [
  ["The support agent was friendly and solved my issue in minutes.", "2026-01-04", "Support", 5],
  ["Delivery arrived two days late with no update.", "2026-01-05", "Delivery", 2],
  ["The product quality is excellent and feels built to last.", "2026-01-06", "Product Quality", 5],
  ["Pricing is fair for the features included.", "2026-01-07", "Pricing", 4],
  ["The dashboard is clean but took some time to learn.", "2026-01-08", "User Experience", 3],
  ["Customer service was helpful and genuinely listened.", "2026-01-10", "Customer Service", 5],
  ["My package was damaged when it arrived.", "2026-01-11", "Delivery", 1],
  ["Setup was quick and the instructions were clear.", "2026-01-13", "User Experience", 5],
  ["It works as described. Nothing exceptional so far.", "2026-01-14", "Product Quality", 3],
  ["The monthly plan feels expensive for a small team.", "2026-01-16", "Pricing", 2],
  ["I love how responsive the app feels on my phone.", "2026-01-18", "User Experience", 5],
  ["Support answered my question, though it took a day.", "2026-01-20", "Support", 3],
  ["Excellent experience from ordering through delivery.", "2026-01-22", "Overall Satisfaction", 5],
  ["The refund process was confusing and frustrating.", "2026-01-24", "Customer Service", 1],
  ["Good quality and a sensible price.", "2026-01-27", "Product Quality", 4],
  ["The courier was fast and kept me informed.", "2026-01-29", "Delivery", 5],
  ["A reliable product that does exactly what I need.", "2026-02-01", "Product Quality", 4],
  ["I had to contact support twice for the same problem.", "2026-02-03", "Support", 2],
  ["The interface is intuitive and easy to navigate.", "2026-02-06", "User Experience", 5],
  ["No issues, but I have only used it for a week.", "2026-02-08", "Overall Satisfaction", 3],
  ["The agent was polite but could not resolve the issue.", "2026-02-10", "Customer Service", 3],
  ["Delivery was smooth and arrived earlier than expected.", "2026-02-12", "Delivery", 5],
  ["There are cheaper alternatives with similar features.", "2026-02-14", "Pricing", 2],
  ["Superb quality. I am impressed by the finish.", "2026-02-16", "Product Quality", 5],
  ["The latest update crashed twice during checkout.", "2026-02-18", "User Experience", 1],
  ["Quick response and a clear solution from support.", "2026-02-20", "Support", 5],
  ["The onboarding call made getting started easy.", "2026-02-22", "Customer Service", 5],
  ["My order arrived on the date promised.", "2026-02-25", "Delivery", 4],
  ["The basic plan is okay, but key features cost extra.", "2026-02-27", "Pricing", 3],
  ["I am pleased with the consistent performance.", "2026-03-01", "Product Quality", 4],
  ["Search is slow when I have many records.", "2026-03-03", "User Experience", 2],
  ["A friendly team and an efficient resolution.", "2026-03-05", "Support", 5],
  ["The representative sounded rushed and was unhelpful.", "2026-03-07", "Customer Service", 1],
  ["Package tracking was accurate and useful.", "2026-03-09", "Delivery", 4],
  ["The annual discount offers good value.", "2026-03-11", "Pricing", 4],
  ["Build quality is fine, though the packaging is basic.", "2026-03-13", "Product Quality", 3],
  ["The mobile menu can be difficult to use.", "2026-03-15", "User Experience", 2],
  ["Support followed up to make sure everything worked.", "2026-03-17", "Support", 5],
  ["The exchange was handled quickly and professionally.", "2026-03-19", "Customer Service", 5],
  ["Delivery was delayed during the holiday period.", "2026-03-21", "Delivery", 2],
  ["Useful product overall, with room for improvement.", "2026-03-23", "Overall Satisfaction", 3],
  ["I would recommend it for its reliability.", "2026-03-25", "Product Quality", 4],
  ["Billing is clear and there were no surprise charges.", "2026-03-27", "Pricing", 4],
  ["The new layout is a great improvement.", "2026-03-29", "User Experience", 5],
  ["Wait times were long, but the final answer was helpful.", "2026-03-31", "Support", 3],
  ["The team made me feel valued as a customer.", "2026-04-02", "Customer Service", 5],
  ["The parcel was missing an item.", "2026-04-04", "Delivery", 1],
  ["Performance meets my expectations.", "2026-04-06", "Overall Satisfaction", 3],
  ["Great value, especially on the annual plan.", "2026-04-08", "Pricing", 5],
  ["A wonderful experience. Everything worked smoothly.", "2026-04-10", "Overall Satisfaction", 5],
];

function analyseSentiment(text: string) {
  const words = text.toLowerCase().match(/[a-z']+/g) || [];
  let score = 0;
  const matched: string[] = [];
  words.forEach((word, i) => {
    let value = positiveWords.has(word) ? 1 : negativeWords.has(word) ? -1 : 0;
    if (value && ["not", "never", "no", "hardly"].includes(words[i - 1])) value *= -1;
    if (value && ["very", "really", "extremely"].includes(words[i - 1])) value *= 1.5;
    if (value) matched.push(word);
    score += value;
  });
  const normalized = Math.max(-1, Math.min(1, score / Math.max(2, Math.sqrt(words.length))));
  const sentiment: Sentiment = normalized > 0.12 ? "Positive" : normalized < -0.12 ? "Negative" : "Neutral";
  return { sentiment, score: normalized, matched };
}

function makeReviews(rows: Array<[string, string?, string?, number?]>): Review[] {
  return rows.map(([review, date, category, rating], id) => {
    const result = analyseSentiment(review);
    return { id, review, date, category, rating, sentiment: result.sentiment, score: result.score };
  });
}

const sampleReviews = makeReviews(sampleRows);

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    spark: <><path d="m13 2-1.7 5.3a2 2 0 0 1-1.3 1.3L5 10l5 1.5a2 2 0 0 1 1.3 1.3L13 18l1.7-5.2a2 2 0 0 1 1.3-1.3l5-1.5-5-1.4a2 2 0 0 1-1.3-1.3L13 2Z"/><path d="m5 16-.6 1.8a1 1 0 0 1-.6.6L2 19l1.8.6a1 1 0 0 1 .6.6L5 22l.6-1.8a1 1 0 0 1 .6-.6L8 19l-1.8-.6a1 1 0 0 1-.6-.6L5 16Z"/></>,
    upload: <><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/></>,
    chart: <><path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-7"/></>,
    bulb: <><path d="M9 18h6"/><path d="M10 22h4"/><path d="M8.5 14.5A7 7 0 1 1 15.5 14.5c-.9.6-1.5 1.4-1.5 2.5h-4c0-1.1-.6-1.9-1.5-2.5Z"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8"/></>,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 21h14"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="logo"><span className="logo-mark"><span /></span>{!compact && <strong>VibeLens</strong>}</div>;
}

function Button({ children, variant = "primary", onClick, type = "button", disabled = false }: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "ghost"; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean;
}) {
  return <button type={type} className={`btn ${variant}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Badge({ sentiment }: { sentiment: Sentiment }) {
  return <span className={`sentiment ${sentiment.toLowerCase()}`}><i />{sentiment}</span>;
}

function Landing({ enter, demo, theme, toggleTheme }: { enter: () => void; demo: () => void; theme: string; toggleTheme: () => void }) {
  return <div className="landing">
    <header className="landing-nav">
      <Logo />
      <nav><a href="#features">Features</a><a href="#how">How it works</a><a href="#about">About</a></nav>
      <div className="nav-actions"><button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme"><Icon name={theme === "dark" ? "sun" : "moon"} /></button><Button onClick={enter}>Open app <Icon name="arrow" size={17}/></Button></div>
    </header>
    <main>
      <section className="hero">
        <div className="hero-glow" />
        <div className="eyebrow"><span /> Customer intelligence, clarified</div>
        <h1>See What Your<br/><em>Data Is Saying.</em></h1>
        <p>Turn customer feedback into clear sentiment, meaningful patterns, and actionable business insights.</p>
        <div className="hero-actions"><Button onClick={enter}>Start Analysing <Icon name="arrow" size={17}/></Button><Button variant="secondary" onClick={demo}>Explore Demo</Button></div>
        <div className="hero-proof"><span className="avatar-stack"><i>JD</i><i>MK</i><i>AL</i></span><span><b>Built for better decisions</b><small>From raw feedback to a clear next step</small></span></div>
        <DashboardPreview />
      </section>
      <section className="value-section" id="features">
        <div className="section-heading"><div><span className="kicker">THE VIBELENS METHOD</span><h2>Understand feedback<br/>at a glance.</h2></div><p>One focused workspace to move from thousands of unstructured comments to evidence-backed decisions.</p></div>
        <div className="value-grid">
          {[
            ["01", "Analyse", "Turn thousands of reviews into structured sentiment data."],
            ["02", "Understand", "Discover patterns and trends hidden inside feedback."],
            ["03", "Act", "Turn evidence into practical recommendations."],
            ["04", "Improve", "Make better decisions using the customer voice."],
          ].map(([n,t,d]) => <article className="value-card" key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p><i><Icon name="arrow" size={18}/></i></article>)}
        </div>
      </section>
      <section className="how-section" id="how">
        <span className="kicker">SIMPLE BY DESIGN</span><h2>From CSV to clarity in three steps.</h2>
        <div className="steps">
          {[["upload","Upload","Add a customer feedback CSV or begin with our sample dataset."],["spark","Analyse","VibeLens classifies sentiment and identifies meaningful patterns."],["bulb","Understand","Explore visual insights and evidence-based recommendations."]].map((s,i) =>
            <article key={s[1]}><span className="step-num">0{i+1}</span><div className="step-icon"><Icon name={s[0]}/></div><h3>{s[1]}</h3><p>{s[2]}</p></article>)}
        </div>
      </section>
      <section className="feature-section">
        <span className="kicker">BUILT FOR CLARITY</span><h2>Everything you need to hear<br/>the voice of your customer.</h2>
        <div className="feature-grid">
          {[
            ["spark","AI Sentiment Analysis","Classify feedback as positive, neutral, or negative using transparent lexicon analysis."],
            ["chart","Smart Analytics","Understand sentiment distribution, categories, keywords, and trends."],
            ["bulb","Insight Generation","Translate calculated patterns into meaningful business insights."],
            ["upload","CSV Analysis","Upload real-world datasets and analyse them directly in your browser."],
            ["grid","Visual Reports","Transform your data into clear, presentation-ready visual summaries."],
            ["file","Actionable Recommendations","Identify specific areas where the customer experience can improve."],
          ].map(([icon,title,text]) => <article key={title}><span><Icon name={icon}/></span><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>
      <section className="final-cta"><Logo compact/><h2>Ready to understand<br/>your customer voice?</h2><p>Your next useful insight is already in the feedback.</p><Button onClick={enter}>Analyse Your Data <Icon name="arrow" size={17}/></Button></section>
    </main>
    <footer><Logo/><p>AI-powered feedback intelligence, made clear.</p><span>© 2026 VibeLens</span></footer>
  </div>;
}

function DashboardPreview() {
  return <div className="preview-shell">
    <div className="preview-side"><Logo compact/><i/><i/><i/><i/><i/></div>
    <div className="preview-main">
      <div className="preview-top"><div><small>OVERVIEW</small><b>Good morning, Analyst.</b></div><span>Sample dataset</span></div>
      <div className="preview-kpis"><article><small>Total reviews</small><b>1,250</b><span>Current dataset</span></article><article><small>Positive</small><b>68.4%</b><span className="up">Strongest signal</span></article><article><small>Neutral</small><b>18.2%</b><span>228 reviews</span></article><article><small>Negative</small><b>13.4%</b><span>Needs attention</span></article></div>
      <div className="preview-charts"><article><div><small>SENTIMENT OVERVIEW</small><b>What customers feel</b></div><div className="donut demo"><span><b>68%</b><small>positive</small></span></div><ul><li><i className="p"/>Positive <b>855</b></li><li><i className="n"/>Neutral <b>228</b></li><li><i className="m"/>Negative <b>167</b></li></ul></article><article className="ai-card"><span className="ai-badge"><Icon name="spark" size={14}/> AI INSIGHT</span><h3>Customers value service quality.</h3><p>Positive feedback frequently mentions friendly staff and fast resolutions.</p><div className="mini-bars"><i/><i/><i/><i/><i/></div></article></div>
    </div>
  </div>;
}

const navItems: Array<[Page, string, string]> = [
  ["dashboard", "grid", "Overview"], ["analyse", "spark", "Analyse Text"], ["datasets", "upload", "Datasets"],
  ["analytics", "chart", "Analytics"], ["insights", "bulb", "Insights"], ["reports", "file", "Reports"],
];

function AppShell({ page, setPage, theme, toggleTheme, children, onHome }: {
  page: Page; setPage: (p: Page) => void; theme: string; toggleTheme: () => void; children: React.ReactNode; onHome: () => void;
}) {
  const [mobile, setMobile] = useState(false);
  return <div className="app-shell">
    <aside className={mobile ? "open" : ""}>
      <div className="side-head"><Logo/><button className="mobile-close" onClick={() => setMobile(false)} aria-label="Close menu"><Icon name="close"/></button></div>
      <span className="side-label">WORKSPACE</span>
      <nav>{navItems.map(([key,icon,label]) => <button key={key} className={page === key ? "active" : ""} onClick={() => {setPage(key);setMobile(false)}}><Icon name={icon}/><span>{label}</span></button>)}</nav>
      <div className="side-bottom">
        <button onClick={() => setPage("about")} className={page === "about" ? "active" : ""}><span className="help-icon">?</span><span>About & methodology</span></button>
        <button onClick={toggleTheme}><Icon name={theme === "dark" ? "sun" : "moon"}/><span>{theme === "dark" ? "Light mode" : "Dark mode"}</span></button>
        <div className="profile"><span>AN</span><div><b>Alex Morgan</b><small>Data Analyst</small></div><i>•••</i></div>
      </div>
    </aside>
    {mobile && <button className="backdrop" onClick={() => setMobile(false)} aria-label="Close menu" />}
    <div className="app-main">
      <header className="mobile-header"><button onClick={() => setMobile(true)} aria-label="Open menu"><Icon name="menu"/></button><button onClick={onHome} aria-label="Back to home"><Logo/></button><button onClick={toggleTheme} aria-label="Toggle theme"><Icon name={theme === "dark" ? "sun" : "moon"}/></button></header>
      {children}
    </div>
    <nav className="bottom-nav">{navItems.slice(0,5).map(([key,icon,label]) => <button key={key} className={page === key ? "active" : ""} onClick={() => setPage(key)}><Icon name={icon}/><span>{label === "Analyse Text" ? "Analyse" : label}</span></button>)}</nav>
  </div>;
}

function EmptyState({ loadSample, goUpload }: { loadSample: () => void; goUpload: () => void }) {
  return <div className="empty-state"><span><Icon name="chart" size={28}/></span><h2>No dataset analysed yet</h2><p>Upload a CSV or try our sample dataset to start discovering insights.</p><div><Button onClick={loadSample}>Try Sample Dataset</Button><Button variant="secondary" onClick={goUpload}>Upload CSV</Button></div></div>;
}

function getStats(reviews: Review[]) {
  const total = reviews.length;
  const count = (s: Sentiment) => reviews.filter(r => r.sentiment === s).length;
  return {
    total, positive: count("Positive"), neutral: count("Neutral"), negative: count("Negative"),
    pct: (n: number) => total ? Math.round(n / total * 100) : 0,
  };
}

function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: React.ReactNode }) {
  return <div className="page-header"><div><span className="kicker">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

function Dashboard({ reviews, loadSample, setPage, datasetName }: { reviews: Review[]; loadSample: () => void; setPage: (p: Page) => void; datasetName: string }) {
  if (!reviews.length) return <main className="workspace"><PageHeader eyebrow="OVERVIEW" title="Good morning, Analyst." subtitle="Here’s what your customer feedback is telling you."/><EmptyState loadSample={loadSample} goUpload={() => setPage("datasets")}/></main>;
  const s = getStats(reviews);
  const topCategory = categoryStats(reviews).sort((a,b) => b.positive - a.positive)[0];
  return <main className="workspace">
    <PageHeader eyebrow="OVERVIEW" title="Good morning, Analyst." subtitle="Here’s what your customer feedback is telling you." action={<div className="dataset-pill"><i/><span><small>ACTIVE DATASET</small>{datasetName}</span></div>}/>
    <div className="kpi-grid">
      <Kpi label="TOTAL REVIEWS" value={s.total.toLocaleString()} note="Current dataset" tone="indigo"/>
      <Kpi label="POSITIVE" value={`${s.pct(s.positive)}%`} note={`${s.positive} classified reviews`} tone="green"/>
      <Kpi label="NEUTRAL" value={`${s.pct(s.neutral)}%`} note={`${s.neutral} classified reviews`} tone="amber"/>
      <Kpi label="NEGATIVE" value={`${s.pct(s.negative)}%`} note={`${s.negative} classified reviews`} tone="red"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel overview-panel"><PanelTitle overline="SENTIMENT OVERVIEW" title="What customers feel"/><div className="overview-content"><Donut reviews={reviews}/><div className="legend"><Legend name="Positive" count={s.positive} pct={s.pct(s.positive)} cls="p"/><Legend name="Neutral" count={s.neutral} pct={s.pct(s.neutral)} cls="n"/><Legend name="Negative" count={s.negative} pct={s.pct(s.negative)} cls="m"/></div></div></section>
      <section className="panel ai-summary"><span className="ai-badge"><Icon name="spark" size={14}/> AI INSIGHT</span><h2>{s.positive > s.negative ? "Overall sentiment leans positive." : "Negative feedback needs attention."}</h2><p>{topCategory ? `${topCategory.name} is the strongest positive category. ${topCategory.positive} of ${topCategory.total} reviews in this category are positive.` : "Analyse categorized reviews to find your strongest themes."}</p><button onClick={() => setPage("insights")}>View all insights <Icon name="arrow" size={16}/></button></section>
    </div>
    <Trend reviews={reviews}/>
    <ReviewTable reviews={reviews} compact/>
  </main>;
}

function Kpi({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return <article className={`kpi ${tone}`}><div><span>{label}</span><i/></div><strong>{value}</strong><small>{note}</small></article>;
}
function PanelTitle({ overline, title }: { overline: string; title: string }) { return <div className="panel-title"><span>{overline}</span><h2>{title}</h2></div>; }
function Legend({ name, count, pct, cls }: { name: string; count: number; pct: number; cls: string }) { return <div className="legend-row"><i className={cls}/><span>{name}<small>{count} reviews</small></span><b>{pct}%</b></div>; }
function Donut({ reviews }: { reviews: Review[] }) {
  const s = getStats(reviews); const p = s.pct(s.positive); const n = s.pct(s.neutral);
  return <div className="donut" style={{"--positive": `${p}%`, "--neutral": `${p+n}%`} as React.CSSProperties}><span><b>{p}%</b><small>positive</small></span></div>;
}

function Trend({ reviews }: { reviews: Review[] }) {
  const dated = reviews.filter(r => r.date && !Number.isNaN(Date.parse(r.date)));
  if (!dated.length) return <section className="panel trend-empty"><span><Icon name="chart"/></span><div><h2>Sentiment trend unavailable</h2><p>Add a valid date column to your dataset to unlock sentiment trends.</p></div></section>;
  const months = new Map<string, Review[]>();
  dated.forEach(r => { const key = new Date(r.date!).toLocaleDateString("en-US",{month:"short"}); months.set(key,[...(months.get(key)||[]),r]); });
  const values = [...months].map(([name,rs]) => ({name, value: getStats(rs).pct(getStats(rs).positive)}));
  const points = values.map((v,i) => `${values.length === 1 ? 50 : 5+i*(90/(values.length-1))},${90-v.value*.7}`).join(" ");
  return <section className="panel trend"><PanelTitle overline="SENTIMENT TREND" title="Positive sentiment over time"/><div className="line-chart"><div className="grid-lines"/><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke"/>{values.map((v,i)=><circle key={v.name} cx={values.length === 1 ? 50 : 5+i*(90/(values.length-1))} cy={90-v.value*.7} r="1.5" fill="currentColor"/>)}</svg><div className="x-labels">{values.map(v=><span key={v.name}>{v.name}</span>)}</div></div></section>;
}

function ReviewTable({ reviews, compact = false }: { reviews: Review[]; compact?: boolean }) {
  const [filter,setFilter] = useState<"All"|Sentiment>("All"); const [search,setSearch] = useState(""); const [sort,setSort] = useState<"new"|"score">("new"); const [page,setPage] = useState(0);
  const filtered = reviews.filter(r => (filter === "All" || r.sentiment === filter) && r.review.toLowerCase().includes(search.toLowerCase())).sort((a,b) => sort === "score" ? b.score-a.score : b.id-a.id);
  const size = compact ? 5 : 8; const shown = filtered.slice(page*size,page*size+size);
  useEffect(() => setPage(0),[filter,search,sort]);
  return <section className="panel review-panel">
    <div className="table-head"><PanelTitle overline="FEEDBACK" title={compact ? "Recent feedback" : "All reviews"}/>{!compact && <div className="table-tools"><label className="search"><Icon name="search" size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search reviews" aria-label="Search reviews"/></label><select value={sort} onChange={e=>setSort(e.target.value as "new"|"score")} aria-label="Sort reviews"><option value="new">Newest</option><option value="score">Highest score</option></select></div>}</div>
    {!compact && <div className="filter-tabs">{(["All","Positive","Neutral","Negative"] as const).map(f=><button key={f} className={filter===f?"active":""} onClick={()=>setFilter(f)}>{f}</button>)}</div>}
    <div className="table-wrap"><table><thead><tr><th>Review</th><th>Sentiment</th><th>Score</th><th>Category</th><th>Date</th></tr></thead><tbody>{shown.map(r=><tr key={r.id}><td>{r.review}</td><td><Badge sentiment={r.sentiment}/></td><td>{r.score > 0 ? "+" : ""}{r.score.toFixed(2)}</td><td>{r.category || "Not provided"}</td><td>{r.date ? new Date(`${r.date}T00:00:00`).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "Not provided"}</td></tr>)}</tbody></table></div>
    {!shown.length && <div className="no-results">No reviews match your filters.</div>}
    {!compact && filtered.length > size && <div className="pagination"><span>Showing {page*size+1}–{Math.min((page+1)*size,filtered.length)} of {filtered.length}</span><div><button disabled={!page} onClick={()=>setPage(p=>p-1)}>Previous</button><button disabled={(page+1)*size>=filtered.length} onClick={()=>setPage(p=>p+1)}>Next</button></div></div>}
  </section>;
}

function AnalysePage() {
  const [text,setText] = useState(""); const [result,setResult] = useState<ReturnType<typeof analyseSentiment>|null>(null); const [loading,setLoading] = useState(false);
  const run = () => { if (!text.trim()) return; setLoading(true); setTimeout(()=>{setResult(analyseSentiment(text));setLoading(false)},650); };
  const strength = result ? Math.min(100, Math.round(Math.abs(result.score)*100)) : 0;
  return <main className="workspace narrow"><PageHeader eyebrow="SINGLE REVIEW" title="Analyse a Review" subtitle="Understand the sentiment behind any piece of text."/>
    <section className="panel text-analyser"><label htmlFor="review-text">Customer feedback</label><div className="textarea-wrap"><textarea id="review-text" maxLength={1000} value={text} onChange={e=>{setText(e.target.value);setResult(null)}} placeholder="Paste customer feedback here…"/><span>{text.length} / 1,000</span></div><Button onClick={run} disabled={!text.trim()||loading}>{loading ? <><span className="spinner"/> Analysing feedback…</> : <><Icon name="spark" size={17}/> Analyse Sentiment</>}</Button></section>
    {result && <section className={`result-card ${result.sentiment.toLowerCase()}`}><div className="result-top"><div><span className="kicker">SENTIMENT RESULT</span><h2>{result.sentiment}</h2><p>Lexicon sentiment score <b>{result.score > 0 ? "+" : ""}{result.score.toFixed(2)}</b></p></div><div className="result-orb">{result.sentiment === "Positive" ? "✓" : result.sentiment === "Negative" ? "!" : "•"}</div></div><div className="score-track"><i style={{width:`${Math.max(4,strength)}%`}}/></div><small>Signal strength: {strength}% — this is a normalized lexicon score, not a model confidence probability.</small><div className="why"><span><Icon name="bulb"/></span><div><h3>Why this result?</h3><p>{result.matched.length ? `The analysis found sentiment-bearing terms including ${result.matched.slice(0,4).map(w=>`“${w}”`).join(", ")}. Negation and intensity modifiers are considered where present.` : "The text contains few words in the sentiment lexicon, so it is classified as neutral. Context and domain-specific language may affect this result."}</p></div></div></section>}
  </main>;
}

function parseCSV(text: string): Record<string,string>[] {
  const rows: string[][] = []; let row: string[]=[]; let cell=""; let quote=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quote&&text[i+1]==='"'){cell+='"';i++;}else quote=!quote;}else if(c===","&&!quote){row.push(cell.trim());cell="";}else if((c==="\n"||c==="\r")&&!quote){if(c==="\r"&&text[i+1]==="\n")i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell="";}else cell+=c;}
  row.push(cell.trim()); if(row.some(Boolean))rows.push(row); if(quote) throw new Error("The CSV contains an unclosed quoted field.");
  if(rows.length<2) throw new Error("The dataset is empty or has no data rows.");
  const headers=rows[0].map(h=>h.toLowerCase().trim()); if(!headers.includes("review")) throw new Error('Missing required "review" column.');
  return rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||""]))).filter(r=>r.review);
}

function DatasetPage({ onLoaded, loadSample, reviews, datasetName }: { onLoaded: (r: Review[],name:string)=>void; loadSample: ()=>void; reviews: Review[]; datasetName: string }) {
  const [error,setError]=useState(""); const [drag,setDrag]=useState(false); const input=useRef<HTMLInputElement>(null);
  const process=(file:File)=>{setError("");if(!file.name.toLowerCase().endsWith(".csv")){setError("Unsupported file type. Please upload a CSV file.");return;}const reader=new FileReader();reader.onerror=()=>setError("We couldn’t read this file. Please try again.");reader.onload=()=>{try{const rows=parseCSV(String(reader.result));if(!rows.length)throw new Error("The dataset does not contain any valid review rows.");const parsed=makeReviews(rows.map(r=>[r.review,r.date||undefined,r.category||undefined,r.rating&&Number.isFinite(Number(r.rating))?Number(r.rating):undefined]));onLoaded(parsed,file.name);}catch(e){setError(e instanceof Error?e.message:"Invalid CSV file.");}};reader.readAsText(file);};
  return <main className="workspace"><PageHeader eyebrow="DATASETS" title="Analyse Your Dataset" subtitle="Upload customer feedback and let VibeLens uncover the patterns." action={reviews.length?<div className="dataset-pill"><i/><span><small>ACTIVE DATASET</small>{datasetName}</span></div>:undefined}/>
    <section className={`upload-zone ${drag?"drag":""}`} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);if(e.dataTransfer.files[0])process(e.dataTransfer.files[0])}}>
      <input ref={input} type="file" accept=".csv,text/csv" onChange={e=>e.target.files?.[0]&&process(e.target.files[0])} aria-label="Upload CSV file"/>
      <span className="upload-icon"><Icon name="upload" size={26}/></span><h2>Drop your CSV here</h2><p>or select a file from your computer</p><Button variant="secondary" onClick={()=>input.current?.click()}>Browse files</Button><small>CSV only · Maximum recommended size 10 MB</small>
    </section>
    {error&&<div className="error-message" role="alert"><b>!</b><span><strong>We couldn’t analyse that file</strong>{error}</span><button onClick={()=>setError("")} aria-label="Dismiss error"><Icon name="close" size={17}/></button></div>}
    <div className="dataset-options"><section className="panel sample-card"><span><Icon name="spark"/></span><div><h3>Not ready with your own data?</h3><p>Explore VibeLens with 50 realistic, pre-analysed customer reviews.</p></div><Button onClick={loadSample}>Try Sample Dataset</Button></section><section className="panel columns-card"><h3>CSV column guide</h3><div><span><b>review</b><small>Required</small></span><span><b>date</b><small>Optional</small></span><span><b>category</b><small>Optional</small></span><span><b>rating</b><small>Optional</small></span></div></section></div>
    {reviews.length>0&&<ReviewTable reviews={reviews}/>}
  </main>;
}

function categoryStats(reviews: Review[]) {
  const map=new Map<string,Review[]>();reviews.filter(r=>r.category).forEach(r=>map.set(r.category!,[...(map.get(r.category!)||[]),r]));
  return [...map].map(([name,rs])=>({name,total:rs.length,positive:rs.filter(r=>r.sentiment==="Positive").length,neutral:rs.filter(r=>r.sentiment==="Neutral").length,negative:rs.filter(r=>r.sentiment==="Negative").length}));
}
function keywords(reviews: Review[]) {
  const counts=new Map<string,number>();reviews.forEach(r=>(r.review.toLowerCase().match(/[a-z']+/g)||[]).forEach(w=>{if(w.length>3&&!stopWords.has(w))counts.set(w,(counts.get(w)||0)+1)}));
  return [...counts].sort((a,b)=>b[1]-a[1]).slice(0,12);
}

function AnalyticsPage({ reviews, loadSample, goUpload }: { reviews: Review[]; loadSample:()=>void;goUpload:()=>void }) {
  if(!reviews.length)return <main className="workspace"><PageHeader eyebrow="ANALYTICS" title="Feedback Analytics" subtitle="Explore the signals and patterns within your data."/><EmptyState loadSample={loadSample} goUpload={goUpload}/></main>;
  const s=getStats(reviews), cats=categoryStats(reviews), keys=keywords(reviews), rated=reviews.filter(r=>r.rating!==undefined); const avg=rated.length?rated.reduce((a,r)=>a+r.rating!,0)/rated.length:null;
  return <main className="workspace"><PageHeader eyebrow="ANALYTICS" title="Feedback Analytics" subtitle="Explore the signals and patterns within your data."/>
    <div className="analytics-summary"><Kpi label="REVIEW VOLUME" value={String(s.total)} note="Analysed reviews" tone="indigo"/><Kpi label="POSITIVE SHARE" value={`${s.pct(s.positive)}%`} note="Of current dataset" tone="green"/><Kpi label="AVERAGE RATING" value={avg?`${avg.toFixed(1)} / 5`:"—"} note={avg?`${rated.length} rated reviews`:"No rating column"} tone="amber"/></div>
    <div className="analytics-grid"><section className="panel"><PanelTitle overline="DISTRIBUTION" title="Sentiment percentages"/><div className="overview-content"><Donut reviews={reviews}/><div className="legend"><Legend name="Positive" count={s.positive} pct={s.pct(s.positive)} cls="p"/><Legend name="Neutral" count={s.neutral} pct={s.pct(s.neutral)} cls="n"/><Legend name="Negative" count={s.negative} pct={s.pct(s.negative)} cls="m"/></div></div></section>
    <section className="panel keyword-panel"><PanelTitle overline="LANGUAGE" title="Most common keywords"/>{keys.length?<div className="keyword-cloud">{keys.map(([w,c],i)=><span key={w} className={i<3?"top":""}>{w}<small>{c}</small></span>)}</div>:<p className="muted">Not enough text to calculate keywords.</p>}</section></div>
    <section className="panel category-panel"><PanelTitle overline="CATEGORIES" title="Sentiment by category"/>{cats.length?<div className="category-bars">{cats.map(c=><div className="category-row" key={c.name}><span>{c.name}<small>{c.total} reviews</small></span><div><i className="p" style={{width:`${c.positive/c.total*100}%`}}/><i className="n" style={{width:`${c.neutral/c.total*100}%`}}/><i className="m" style={{width:`${c.negative/c.total*100}%`}}/></div><b>{Math.round(c.positive/c.total*100)}%</b></div>)}</div>:<div className="inline-empty">Add a category column to compare sentiment across themes.</div>}</section>
    <Trend reviews={reviews}/>
  </main>;
}

function buildInsights(reviews: Review[]) {
  const s=getStats(reviews), cats=categoryStats(reviews); const strongest=[...cats].filter(c=>c.positive).sort((a,b)=>b.positive/b.total-a.positive/a.total)[0]; const concern=[...cats].filter(c=>c.negative).sort((a,b)=>b.negative-a.negative)[0];
  const out=[{title:`Overall sentiment is ${s.positive>s.negative?"positive":"mixed"}.`,text:`${s.positive} of ${s.total} analysed reviews were classified as positive.`,stat:`${s.pct(s.positive)}%`,category:"Overall sentiment",impact:"A clear baseline for measuring future customer experience."}];
  if(strongest)out.unshift({title:`${strongest.name} is the strongest positive theme.`,text:`${strongest.positive} of ${strongest.total} reviews in this category were classified as positive.`,stat:`${Math.round(strongest.positive/strongest.total*100)}%`,category:strongest.name,impact:"Protect and reinforce the experience driving positive feedback."});
  if(concern)out.push({title:`${concern.name} has the most negative feedback.`,text:`${concern.negative} negative ${concern.negative===1?"review was":"reviews were"} found in this category.`,stat:`${concern.negative}`,category:concern.name,impact:"Addressing this theme may reduce the largest visible source of dissatisfaction."});
  return out;
}
function InsightsPage({ reviews,loadSample,goUpload }:{reviews:Review[];loadSample:()=>void;goUpload:()=>void}) {
  if(!reviews.length)return <main className="workspace"><PageHeader eyebrow="INTELLIGENCE" title="AI Insights" subtitle="Turn customer feedback into decisions."/><EmptyState loadSample={loadSample} goUpload={goUpload}/></main>;
  const insights=buildInsights(reviews); const concern=categoryStats(reviews).sort((a,b)=>b.negative-a.negative)[0];
  return <main className="workspace"><PageHeader eyebrow="INTELLIGENCE" title="AI Insights" subtitle="Turn customer feedback into decisions." action={<span className="method-pill"><Icon name="spark" size={15}/> Derived from {reviews.length} reviews</span>}/>
    <div className="insight-list">{insights.map((x,i)=><article className="insight-card" key={x.title}><div className="insight-index">0{i+1}</div><div className="insight-copy"><span>{x.category}</span><h2>{x.title}</h2><p>{x.text}</p><div className="impact"><b>Business impact</b>{x.impact}</div></div><div className="insight-stat"><strong>{x.stat}</strong><small>SUPPORTING<br/>STATISTIC</small></div></article>)}</div>
    <section className="recommendations"><div className="section-heading"><div><span className="kicker">RECOMMENDATIONS</span><h2>Turn evidence into action.</h2></div><p>These next steps are connected directly to patterns in the current dataset.</p></div>
      <article className="recommend-card"><span className="rec-num">01</span><div><span>PRIORITY ACTION</span><h3>{concern?.negative?`Improve the ${concern.name.toLowerCase()} experience`:"Maintain the strongest customer experiences"}</h3><p><b>Why:</b> {concern?.negative?`${concern.negative} negative reviews are associated with ${concern.name}.`:"The dataset has no category-level negative reviews."}</p><p><b>Suggested action:</b> {concern?.negative?`Review the negative ${concern.name.toLowerCase()} comments, identify repeated operational causes, and track this category in the next dataset.`:"Continue monitoring feedback and compare future datasets against this baseline."}</p></div><Icon name="arrow"/></article>
    </section>
  </main>;
}

function ReportsPage({reviews,loadSample,goUpload,datasetName}:{reviews:Review[];loadSample:()=>void;goUpload:()=>void;datasetName:string}) {
  if(!reviews.length)return <main className="workspace"><PageHeader eyebrow="REPORTS" title="Generate Insight Report" subtitle="Create an exportable record of your analysis."/><EmptyState loadSample={loadSample} goUpload={goUpload}/></main>;
  const s=getStats(reviews); const downloadCSV=()=>{const esc=(v:string|number|undefined)=>`"${String(v??"").replaceAll('"','""')}"`;const body=["review,date,category,rating,sentiment,score",...reviews.map(r=>[r.review,r.date,r.category,r.rating,r.sentiment,r.score.toFixed(3)].map(esc).join(","))].join("\n");download(body,"vibelens-analysis.csv","text/csv");};
  return <main className="workspace"><PageHeader eyebrow="REPORTS" title="Generate Insight Report" subtitle="Create a clear, professional record of your analysis."/>
    <div className="report-layout"><section className="report-preview"><div className="report-cover"><Logo/><span>INSIGHT REPORT · 2026</span><h2>Customer Feedback<br/>Intelligence Report</h2><p>{datasetName} · {reviews.length} analysed reviews</p></div><div className="report-body"><h3>Executive summary</h3><p>The current dataset contains {reviews.length} reviews. {s.pct(s.positive)}% were classified as positive, {s.pct(s.neutral)}% as neutral, and {s.pct(s.negative)}% as negative.</p><div className="report-metrics"><span><b>{s.pct(s.positive)}%</b>Positive</span><span><b>{s.pct(s.neutral)}%</b>Neutral</span><span><b>{s.pct(s.negative)}%</b>Negative</span></div><h3>Included sections</h3><div className="section-list">{["Dataset overview","Sentiment results","Data visualisations","Key insights","Recommendations","Methodology & limitations","Conclusion"].map((x,i)=><span key={x}><i>{i+1}</i>{x}<b>✓</b></span>)}</div></div></section>
    <aside className="export-panel panel"><span className="export-icon"><Icon name="file" size={27}/></span><h2>Export your analysis</h2><p>Download the enriched dataset or print this page as a polished PDF report.</p><Button onClick={downloadCSV}><Icon name="download" size={17}/> Export CSV</Button><Button variant="secondary" onClick={()=>window.print()}><Icon name="file" size={17}/> Print / Save as PDF</Button><small>PDF export uses your browser’s secure print dialog.</small></aside></div>
  </main>;
}
function download(content:string,name:string,type:string){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href);}

function AboutPage(){
  return <main className="workspace about"><PageHeader eyebrow="ABOUT" title="Clarity for every customer voice." subtitle="VibeLens is an educational AI and data analysis project built to turn unstructured feedback into understandable evidence."/>
    <section className="about-hero panel"><div><span className="ai-badge"><Icon name="spark" size={14}/> TRANSPARENT BY DESIGN</span><h2>Analysis that helps humans make better decisions.</h2><p>VibeLens was created to demonstrate how text classification, data aggregation, and thoughtful visualisation can make qualitative customer feedback more useful—without overstating what AI can understand.</p></div><Logo compact/></section>
    <div className="about-grid">{[
      ["What is VibeLens?","A browser-based customer feedback intelligence platform for analysing individual reviews and CSV datasets."],
      ["How analysis works","Text is cleaned and tokenized, then scored using a transparent sentiment lexicon with basic negation and intensity handling."],
      ["Technology used","React 19, TypeScript, Vite, Tailwind CSS, native SVG visualisations, and browser File APIs."],
      ["Methodology","Collection → cleaning → classification → aggregation → visualisation → insights → recommendations."],
      ["Limitations","Lexicon analysis may miss sarcasm, context, idioms, domain language, and mixed sentiment. Scores are signals, not probability confidence."],
      ["Future improvements","A validated transformer model, multilingual support, aspect-based sentiment, backend persistence, and dataset comparison."],
    ].map(([t,p],i)=><article className="panel" key={t}><span>0{i+1}</span><h3>{t}</h3><p>{p}</p></article>)}</div>
  </main>;
}

export default function App() {
  const [landed,setLanded]=useState(true); const [page,setPage]=useState<Page>("dashboard"); const [reviews,setReviews]=useState<Review[]>([]); const [datasetName,setDatasetName]=useState("No active dataset");
  const [theme,setTheme]=useState(()=>localStorage.getItem("vibelens-theme")||"light");
  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem("vibelens-theme",theme)},[theme]);
  const toggleTheme=()=>setTheme(t=>t==="dark"?"light":"dark"); const loadSample=()=>{setReviews(sampleReviews);setDatasetName("Sample Customer Reviews");setLanded(false);setPage("dashboard")};
  const content=useMemo(()=>{
    if(page==="dashboard")return <Dashboard reviews={reviews} loadSample={loadSample} setPage={setPage} datasetName={datasetName}/>;
    if(page==="analyse")return <AnalysePage/>;
    if(page==="datasets")return <DatasetPage reviews={reviews} datasetName={datasetName} loadSample={loadSample} onLoaded={(r,n)=>{setReviews(r);setDatasetName(n);setPage("dashboard")}}/>;
    if(page==="analytics")return <AnalyticsPage reviews={reviews} loadSample={loadSample} goUpload={()=>setPage("datasets")}/>;
    if(page==="insights")return <InsightsPage reviews={reviews} loadSample={loadSample} goUpload={()=>setPage("datasets")}/>;
    if(page==="reports")return <ReportsPage reviews={reviews} loadSample={loadSample} goUpload={()=>setPage("datasets")} datasetName={datasetName}/>;
    return <AboutPage/>;
  },[page,reviews,datasetName]);
  if(landed)return <Landing enter={()=>{setLanded(false);setPage("dashboard")}} demo={loadSample} theme={theme} toggleTheme={toggleTheme}/>;
  return <AppShell page={page} setPage={setPage} theme={theme} toggleTheme={toggleTheme} onHome={()=>setLanded(true)}>{content}</AppShell>;
}
