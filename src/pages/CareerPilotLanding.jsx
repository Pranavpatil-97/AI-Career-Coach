import { useEffect } from "react";
import "./CareerPilotLanding.css";

/* ---------- Icons (inline SVG sprite, no extra dependency) ---------- */
const Sprite = () => (
  <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
    <symbol id="target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></symbol>
    <symbol id="arrow" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></symbol>
    <symbol id="chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6" /></symbol>
    <symbol id="check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></symbol>
    <symbol id="spark" viewBox="0 0 24 24"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></symbol>
    <symbol id="scan" viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><circle cx="12" cy="12" r="3" /><path d="m16 16-2-2" /></symbol>
    <symbol id="file" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><circle cx="11.5" cy="14.5" r="2.5" /><path d="m13.5 16.5 2 2" /></symbol>
    <symbol id="code" viewBox="0 0 24 24"><path d="m16 18 6-6-6-6M8 6l-6 6 6 6" /></symbol>
    <symbol id="branch" viewBox="0 0 24 24"><path d="M6 3v12" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></symbol>
    <symbol id="brief" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16M2 13h20" /></symbol>
    <symbol id="upload" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></symbol>
    <symbol id="bulb" viewBox="0 0 24 24"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4" /></symbol>
    <symbol id="shield" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.7 8.9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" /></symbol>
    <symbol id="route" viewBox="0 0 24 24"><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" /></symbol>
    <symbol id="trend" viewBox="0 0 24 24"><path d="m22 7-8.5 8.5-5-5L2 17M16 7h6v6" /></symbol>
    <symbol id="link" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></symbol>
    <symbol id="info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></symbol>
    <symbol id="cc" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></symbol>
    <symbol id="dash" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeDasharray="3 3" /></symbol>
    <symbol id="menu" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></symbol>
  </svg>
);

const Icon = ({ name, style }) => (
  <svg className="cp-i" style={style} aria-hidden="true"><use href={`#${name}`} /></svg>
);

/* ---------- Content ---------- */
const FEATURES = [
  ["file", "AI Resume Analyzer", "Upload PDF or DOCX resumes and extract skills, education, experience, and project claims.", "#EEF0FF", "#4F46E5"],
  ["branch", "GitHub Portfolio Analysis", "Analyze connected repositories and cite actual files and code lines as evidence.", "#F3E8FF", "#7C3AED"],
  ["brief", "Real Job Matching", "Compare your demonstrated skills against real job vacancies with direct source links.", "#E8F1FF", "#2563EB"],
  ["scan", "Skill Gap Detection", "Identify required skills that are not demonstrated in the evidence analyzed so far.", "#E0F7FA", "#0891B2"],
  ["bulb", "Evidence-Based Insights", "Understand why each result was reached, with uncertainty communicated clearly.", "#FFF4DB", "#D97706"],
  ["branch", "Automatic Portfolio Updates", "Reassess selected repositories after new commits and follow your assessment history.", "#E3F8EC", "#059669"],
];

const STEPS = [
  ["upload", "Upload your resume", "Add a PDF or DOCX to map your experience and project claims."],
  ["branch", "Connect GitHub", "Choose which repositories should count as technical evidence."],
  ["brief", "Select a real role", "Pick a live job posting that matches your career direction."],
  ["target", "Get your roadmap", "Review your match, evidence, gaps, and recommended next moves."],
];

const ROWS = [
  ["React & TypeScript", "Frontend Developer · 2 years", "dashboard/src/App.tsx · L14–86", "ok", "cc", "Demonstrated", "High confidence"],
  ["Automated testing", "Testing listed in project skills", "portfolio/tests/app.test.tsx · L8–42", "pa", "dash", "Partial", "Medium confidence"],
  ["Cloud deployment", "No supporting project detail", "No deployment config in selected repos", "no", "info", "Not demonstrated in this scope", "Scope-limited"],
];

/* ---------- Page ---------- */
/**
 * Props (all optional) let you wire the buttons into your app/router:
 *   onGetStarted – "Get Started Free" / "Analyze My Career" buttons
 *   onSignIn     – "Sign In" link
 *   onRoadmap    – "View my roadmap" button
 */
export default function CareerPilotLanding({
  onGetStarted = () => {},
  onSignIn = () => {},
  onRoadmap = () => {},
}) {
  // Reveal sections as they scroll into view (one-time, respects reduced motion)
  useEffect(() => {
    const els = document.querySelectorAll(".cp-landing [data-reveal]");
    if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("cp-in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("cp-in"); io.unobserve(en.target); } });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const stop = (fn) => (e) => { e.preventDefault(); fn(); };

  return (
    <div className="cp-landing">
      <Sprite />

      <header className="cp-nav" id="home">
        <div className="cp-wrap">
          <a className="cp-logo" href="#home">
            <b><Icon name="target" /></b>
            <span> <em>AI</em> CareerCoach </span>
          </a>
          <nav className="cp-links" aria-label="Main">
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
            <a href="#about">About</a>
          </nav>
          <div className="cp-right">
            <a className="cp-signin" href="#" onClick={stop(onSignIn)}>Sign In</a>
            <button className="cp-btn cp-dark cp-sm" onClick={onGetStarted}>
              Get Started Free <Icon name="arrow" />
            </button>
            <button className="cp-menu" aria-label="Menu"><Icon name="menu" /></button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="cp-wrap cp-hero">
          <div>
            <a className="cp-badge" href="#features">
              Career clarity, backed by your real work <Icon name="chev" />
            </a>
            <h1>Your Skills. Your Potential. <span className="cp-g">Your Next Career.</span></h1>
            <p className="cp-lede">
              Turn your resume, GitHub projects, and real job opportunities into a clear career roadmap with evidence-backed AI guidance.
            </p>
            <div className="cp-cta">
              <button className="cp-btn cp-dark" onClick={onGetStarted}>
                <Icon name="scan" /> Analyze My Career <Icon name="arrow" />
              </button>
              <a className="cp-btn cp-light" href="#features"><Icon name="spark" /> Explore Features</a>
            </div>
            <div className="cp-ticks">
              {["Evidence-first insights", "Clear source citations", "No guesswork"].map((t) => (
                <span key={t}><Icon name="check" />{t}</span>
              ))}
            </div>
          </div>

          <div className="cp-mock" aria-label="Product preview">
            <div className="cp-bar">
              <i /><i /><i />
              <span className="cp-url">app.careercoach.ai/analysis</span>
              <span className="cp-av" />
            </div>
            <div className="cp-body">
              <div className="cp-side">
                <div className="cp-logo"><b><Icon name="target" /></b>CareerCoach</div>
                <p style={{ marginTop: 70 }}><Icon name="file" />Resume</p>
                <p><Icon name="code" />GitHub</p>
                <p><Icon name="route" />Roadmap</p>
              </div>
              <div className="cp-main">
                <div className="cp-mh">
                  <div><small>CAREER ANALYSIS</small><h4>Frontend Developer</h4></div>
                  <span className="cp-ready">ANALYSIS READY</span>
                </div>
                <div className="cp-two">
                  <div className="cp-score">
                    <span className="cp-t"><Icon name="trend" /></span>
                    <small>Job match score</small>
                    <strong>78<sup>%</sup></strong>
                    <div className="cp-pb"><span style={{ width: "62%" }} /></div>
                    <p>Strong alignment across demonstrated frontend skills.</p>
                  </div>
                  <div className="cp-box">
                    <h5>Evidence overview <Icon name="link" style={{ color: "var(--mute)" }} /></h5>
                    {[
                      ["Resume analysis", "8 skills", "80%", undefined],
                      ["GitHub evidence", "12 citations", "60%", "#8B2FE8"],
                      ["Skill coverage", "7 of 9", "75%", "#2563EB"],
                    ].map(([l, v, w, c]) => (
                      <div className="cp-pr" key={l}>
                        <div><span>{l}</span><b>{v}</b></div>
                        <i><b style={{ width: w, background: c }} /></i>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="cp-two" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className="cp-box">
                    <h5><span><b className="cp-ico"><Icon name="code" /></b>GitHub skill evidence</span></h5>
                    <div className="cp-li"><span>React architecture</span><span className="cp-ok">Demonstrated</span></div>
                    <div className="cp-li"><span>REST API integration</span><span className="cp-ok">Demonstrated</span></div>
                    <div className="cp-li"><span>Testing patterns</span><span className="cp-pa">Partial</span></div>
                  </div>
                  <div className="cp-box">
                    <h5><span><b className="cp-ico"><Icon name="route" /></b>Recommended actions</span></h5>
                    <div className="cp-ra"><Icon name="check" />Strengthen testing evidence with one focused project.</div>
                    <div className="cp-ra"><Icon name="check" />Add measurable outcomes to resume projects.</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="cp-float cp-f1">
              <span className="cp-ok2"><Icon name="cc" /></span>
              <div><b>Evidence verified</b>12 source citations</div>
            </div>
            <div className="cp-float cp-f2">
              <span className="cp-ico"><Icon name="route" /></span>
              <div><b>Next best action</b></div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="cp-sec cp-alt" id="features">
          <div className="cp-wrap">
            <span className="cp-pill"><Icon name="spark" />One intelligent workspace</span>
            <h2 data-reveal>Every signal you need to make a confident career move</h2>
            <p className="cp-sub" data-reveal style={{ "--d": "80ms" }}>CareerPilot connects your experience, your code, and the market—then shows the evidence behind every recommendation.</p>
            <div className="cp-cards">
              {FEATURES.map(([icon, title, text, bg, fg], i) => (
                <article className="cp-card" data-reveal style={{ "--d": `${(i % 3) * 90}ms` }} key={title}>
                  <span>0{i + 1}</span>
                  <div className="cp-t" style={{ background: bg, color: fg }}><Icon name={icon} /></div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <a href="#">Learn more <Icon name="arrow" /></a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="cp-sec" id="how">
          <div className="cp-wrap">
            <span className="cp-pill"><Icon name="spark" />How it works</span>
            <h2 data-reveal>From scattered signals to a focused plan</h2>
            <p className="cp-sub" data-reveal style={{ "--d": "80ms" }}>Four clear steps. Evidence is linked throughout, so you always know what shaped your result.</p>
            <div className="cp-steps">
              {STEPS.map(([icon, title, text], i) => (
                <div className="cp-st" data-reveal style={{ "--d": `${i * 110}ms` }} key={title}>
                  <div className="cp-t"><Icon name={icon} /><em>{i + 1}</em></div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Evidence */}
        <section className="cp-dark" id="about">
          <div className="cp-wrap">
            <div className="cp-dh" data-reveal>
              <div>
                <span className="cp-pill"><Icon name="shield" />Trust through transparency</span>
                <h2 data-reveal>See the evidence, not just the answer</h2>
              </div>
              <p>Each assessment separates what is demonstrated from what is simply not visible in the selected scope—without turning missing evidence into a false claim.</p>
            </div>
            <div className="cp-tbl" data-reveal>
              <div className="cp-th">
                <div className="cp-l">
                  <span className="cp-t"><Icon name="brief" /></span>
                  <div><b>Frontend Engineer</b><small>Requirement-to-evidence comparison</small></div>
                </div>
                <div className="cp-chips">
                  <span className="cp-chip cp-g1">4 Demonstrated</span>
                  <span className="cp-chip cp-g2">2 Partial</span>
                  <span className="cp-chip">1 Scope-limited</span>
                </div>
              </div>
              <div className="cp-row cp-h">
                <span>JOB REQUIREMENT</span><span>RESUME EVIDENCE</span><span>GITHUB CODE EVIDENCE</span><span>MATCH STATUS</span>
              </div>
              {ROWS.map(([req, resume, code, cls, icon, label, conf]) => (
                <div className="cp-row" key={req}>
                  <b>{req}</b>
                  <span className="cp-d">{resume}</span>
                  <a href="#"><Icon name="file" />{code}</a>
                  <div className="cp-stt">
                    <span className={`cp-tag cp-${cls}`}><Icon name={icon} />{label}</span>
                    <small>{conf}</small>
                  </div>
                </div>
              ))}
              <div className="cp-next">
                <div className="cp-l">
                  <span className="cp-t"><Icon name="route" /></span>
                  <div>
                    <b>Recommended next step</b>
                    <small>Add one tested, deployed React project to strengthen the two requirements with incomplete evidence.</small>
                  </div>
                </div>
                <button className="cp-btn" onClick={onRoadmap}>View my roadmap <Icon name="arrow" /></button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="cp-final cp-wrap" style={{ maxWidth: 1700 }}>
          <div className="cp-fc" data-reveal>
            <div className="cp-t"><Icon name="target" /></div>
            <h2 data-reveal>Build your next career move with evidence, not guesswork.</h2>
            <p>Bring your resume, code, and target role together in one transparent career intelligence workspace.</p>
            <button className="cp-btn" onClick={onGetStarted}>Get Started Free <Icon name="arrow" /></button>
          </div>
        </section>
      </main>

      <footer>
        <div className="cp-wrap">
          <div className="cp-ft">
            <div>
              <a className="cp-logo" href="#home"><b><Icon name="target" /></b><span>CareerPilot <em>AI</em></span></a>
              <p>Evidence-backed AI career guidance for more confident next steps.</p>
            </div>
            <div className="cp-fl">
              <a href="#about">About</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms</a>
              <a href="#"><Icon name="branch" />GitHub integration</a>
              <a href="#">Contact</a>
            </div>
          </div>
          <div className="cp-fb">
            <p>© 2026 CareerPilot AI. Built for better career decisions.</p>
            <span><Icon name="shield" />Your evidence stays yours</span>
          </div>
        </div>
      </footer>
    </div>
  );
}