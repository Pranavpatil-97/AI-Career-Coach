import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./CareerPilotLogin.css";

const PATHS = {
  target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /><circle cx="12" cy="16" r="1" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeoff: <><path d="M9.9 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A16.7 16.7 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M3 3l18 18M10 10a3 3 0 0 0 4 4" /></>,
  arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
  back: <path d="M19 12H5M12 19l-7-7 7-7" />,
  code: <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />,
  trend: <path d="m22 7-8.5 8.5-5-5L2 17M16 7h6v6" />,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><circle cx="11.5" cy="14.5" r="2.5" /><path d="m13.5 16.5 2 2" /></>,
  branch: <><path d="M6 3v12" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></>,
  ok: <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>,
};

const Icon = ({ name }) => (
  <svg className="cpa-i" viewBox="0 0 24 24" aria-hidden="true">{PATHS[name]}</svg>
);

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/**
 * Props (optional):
 *   onLogin({ email, password }) – async; throw an Error to show a message under the form.
 *   redirectTo  – where to go after success (default "/app")
 *   signupPath  – "Create one" link (default "/signup")
 *   homePath    – "Back to home" link (default "/")
 */
export default function Login({
  onLogin,
  redirectTo = "/dashboard",
  signupPath = "/signup",
  homePath = "/",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!emailOk(email.trim())) next.email = "Enter a valid email address.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      if (onLogin) await onLogin({ email: email.trim(), password });
      else await signIn({ email: email.trim(), password });
      navigate(location.state?.from?.pathname || redirectTo, { replace: true });
    } catch (err) {
      setFormError(err?.message || "Could not sign in. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cpa">
      {/* ---------- Left: brand panel ---------- */}
      <aside className="cpa-left">
        <div className="cpa-top">
          <Link to={homePath} className="cpa-logo">
            <b><Icon name="target" /></b>
            <span>CareerPilot AI</span>
          </Link>
          <span className="cpa-pill"><Icon name="code" />Your career workspace</span>
          <h2>Welcome Back to Your Career Journey.</h2>
          <p>Sign in to explore your skills, track your progress, and discover your next career opportunity.</p>
        </div>

        <div className="cpa-glass" aria-hidden="true">
          <div className="cpa-gh">
            <div><small>CAREER OVERVIEW</small><strong>Frontend Developer</strong></div>
            <span className="cpa-upd">Updated</span>
          </div>
          <div className="cpa-grid2">
            <div className="cpa-tile">
              <div className="cpa-trow"><span className="cpa-sq"><Icon name="trend" /></span><small>Match</small></div>
              <div className="cpa-big">78<sup>%</sup></div>
              <div className="cpa-bar"><span style={{ width: "78%" }} /></div>
            </div>
            <div className="cpa-tile">
              <div className="cpa-ttl"><Icon name="file" />Resume analysis</div>
              <div className="cpa-li"><span>Skills identified</span><b>12</b></div>
              <div className="cpa-li"><span>Project claims</span><b>4</b></div>
              <div className="cpa-li"><span>Source sections</span><b>8</b></div>
            </div>
          </div>
          <div className="cpa-tile cpa-gith">
            <div className="cpa-ttl"><Icon name="branch" />GitHub skill evidence<span className="cpa-okc"><Icon name="ok" /></span></div>
            <div className="cpa-chips">
              {[["React", "Verified", "v"], ["REST APIs", "Verified", "v"], ["TypeScript", "Partial", "p"]].map(([n, s, c]) => (
                <div key={n}><small>{n}</small><b className={c}>{s}</b></div>
              ))}
            </div>
          </div>
        </div>

        <p className="cpa-foot">Evidence-backed guidance. Clearer career decisions.</p>
      </aside>

      {/* ---------- Right: form ---------- */}
      <main className="cpa-right">
        <div className="cpa-form">
          <Link to={homePath} className="cpa-logo cpa-mobile-logo">
            <b><Icon name="target" /></b>
            <span>CareerPilot AI</span>
          </Link>

          <span className="cpa-eyebrow">Welcome back</span>
          <h1>Sign in to CareerPilot AI</h1>
          <p className="cpa-sub">Continue building your career with confidence.</p>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="cpa-email">Email address</label>
            <div className={`cpa-field ${errors.email ? "bad" : ""}`}>
              <Icon name="mail" />
              <input
                id="cpa-email" type="email" autoComplete="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && <p className="cpa-err" role="alert">{errors.email}</p>}

            <label htmlFor="cpa-pass">Password</label>
            <div className={`cpa-field ${errors.password ? "bad" : ""}`}>
              <Icon name="lock" />
              <input
                id="cpa-pass" type={show ? "text" : "password"} autoComplete="current-password"
                placeholder="Enter your password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                maxLength={72}
                aria-invalid={!!errors.password}
              />
              <button type="button" className="cpa-eye" onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}>
                <Icon name={show ? "eyeoff" : "eye"} />
              </button>
            </div>
            {errors.password && <p className="cpa-err" role="alert">{errors.password}</p>}

            {formError && <p className="cpa-err cpa-formerr" role="alert">{formError}</p>}

            <button type="submit" className="cpa-submit" disabled={loading}>
              {loading ? "Signing in…" : <>Sign In <Icon name="arrow" /></>}
            </button>
          </form>

          <p className="cpa-alt">Don't have an account? <Link to={signupPath}>Create one</Link></p>
          <Link to={homePath} className="cpa-home"><Icon name="back" />Back to home</Link>
        </div>
      </main>
    </div>
  );
}