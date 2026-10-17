import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./CareerPilotLogin.css"; // shared auth styles (login + signup)
import { useAuth } from "../context/AuthContext";

const PATHS = {
  target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /><circle cx="12" cy="16" r="1" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeoff: <><path d="M9.9 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A16.7 16.7 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M3 3l18 18M10 10a3 3 0 0 0 4 4" /></>,
  arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
  back: <path d="M19 12H5M12 19l-7-7 7-7" />,
  check: <path d="M20 6 9 17l-5-5" />,
  chart: <path d="M3 3v18h18M8 17v-5M13 17V8M18 17v-8" />,
  route: <><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" /></>,
};

const Icon = ({ name }) => (
  <svg className="cpa-i" viewBox="0 0 24 24" aria-hidden="true">{PATHS[name]}</svg>
);

const FEATURES = [
  ["target", "Understand your skills", "See what your resume and real project work demonstrate."],
  ["chart", "Discover skill gaps", "Compare your evidence with the roles you want next."],
  ["route", "Build your career roadmap", "Get focused next steps grounded in verifiable evidence."],
];

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function PasswordField({ id, label, placeholder, value, onChange, error, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div className={`cpa-field ${error ? "bad" : ""}`}>
        <Icon name="lock" />
        <input
          id={id} type={show ? "text" : "password"} autoComplete={autoComplete}
          placeholder={placeholder} value={value} onChange={onChange} maxLength={72} aria-invalid={!!error}
        />
        <button type="button" className="cpa-eye" onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}>
          <Icon name={show ? "eyeoff" : "eye"} />
        </button>
      </div>
      {error && <p className="cpa-err" role="alert">{error}</p>}
    </div>
  );
}

/**
 * Props (optional):
 *   onSignup({ name, email, password }) – async; throw an Error to show a message under the form.
 *   redirectTo  – where to go after success (default "/app")
 *   loginPath   – "Sign in" link (default "/login")
 *   homePath    – "Back to home" link (default "/")
 *   termsPath / privacyPath – legal page links
 */
export default function Signup({
  onSignup,
  redirectTo = "/dashboard",
  loginPath = "/login",
  homePath = "/",
  termsPath = "/terms",
  privacyPath = "/privacy",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", agree: false });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = "Enter your full name.";
    if (!emailOk(form.email.trim())) next.email = "Enter a valid email address.";
    if (form.password.length < 8) next.password = "Use at least 8 characters.";
    if (!form.confirm || form.confirm !== form.password) next.confirm = "Passwords do not match.";
    if (!form.agree) next.agree = "Please accept the Terms and Privacy Policy.";
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      if (onSignup) await onSignup({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      else await signUp({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate(location.state?.from?.pathname || redirectTo, { replace: true });
    } catch (err) {
      setFormError(err?.message || "Could not create your account. Please try again.");
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
          <span className="cpa-pill"><Icon name="target" />Evidence-backed guidance</span>
          <h2>Your Next Career Move Starts Here.</h2>
          <p>Bring your resume, GitHub projects, and career goals together in one intelligent workspace.</p>
        </div>

        <div className="cpa-feats">
          {FEATURES.map(([icon, title, text]) => (
            <div className="cpa-feat" key={title}>
              <span className="cpa-sq"><Icon name={icon} /></span>
              <div>
                <h3>{title}<Icon name="check" /></h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
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

          <span className="cpa-eyebrow">Get started free</span>
          <h1>Create Your Account</h1>
          <p className="cpa-sub">Start your personalized career journey for free.</p>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="cpa-name">Full name</label>
            <div className={`cpa-field ${errors.name ? "bad" : ""}`}>
              <Icon name="user" />
              <input id="cpa-name" type="text" autoComplete="name" placeholder="Your full name" maxLength={120}
                value={form.name} onChange={set("name")} aria-invalid={!!errors.name} />
            </div>
            {errors.name && <p className="cpa-err" role="alert">{errors.name}</p>}

            <label htmlFor="cpa-email">Email address</label>
            <div className={`cpa-field ${errors.email ? "bad" : ""}`}>
              <Icon name="mail" />
              <input id="cpa-email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254}
                value={form.email} onChange={set("email")} aria-invalid={!!errors.email} />
            </div>
            {errors.email && <p className="cpa-err" role="alert">{errors.email}</p>}

            <div className="cpa-two">
              <PasswordField id="cpa-pass" label="Password" placeholder="8+ characters"
                autoComplete="new-password" value={form.password} onChange={set("password")} error={errors.password} />
              <PasswordField id="cpa-confirm" label="Confirm password" placeholder="Repeat password"
                autoComplete="new-password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} />
            </div>

            <label className={`cpa-terms ${errors.agree ? "bad" : ""}`}>
              <input type="checkbox" checked={form.agree} onChange={set("agree")} />
              <span>I agree to the <Link to={termsPath}>Terms</Link> and <Link to={privacyPath}>Privacy Policy</Link>.</span>
            </label>
            {errors.agree && <p className="cpa-err" role="alert" style={{ marginTop: -14 }}>{errors.agree}</p>}

            {formError && <p className="cpa-err cpa-formerr" role="alert">{formError}</p>}

            <button type="submit" className="cpa-submit" disabled={loading}>
              {loading ? "Creating account…" : <>Create Account <Icon name="arrow" /></>}
            </button>
          </form>

          <p className="cpa-alt">Already have an account? <Link to={loginPath}>Sign in</Link></p>
          <Link to={homePath} className="cpa-home"><Icon name="back" />Back to home</Link>
        </div>
      </main>
    </div>
  );
}