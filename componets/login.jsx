// src/components/Login.jsx
import { useNavigate } from "react-router-dom";
import "../style.css";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://xidjslcicqwbgcyjkbnj.supabase.co", // PUBLIC SUPABASE URL
  "sb_publishable_vbSoXWaeZgXTtr56mGn5ig_UFivSe5r" // PUBLIC SUPABASE KEY
);

const MAX_ATTEMPTS = 3;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState(MAX_ATTEMPTS);
  const [locked, setLocked] = useState(false);
    const navigate = useNavigate();
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const newAttempts = attemptsRemaining - 1;
      setAttemptsRemaining(newAttempts);

      if (newAttempts > 0) {
        setErrorMessage(`Incorrect email or password. Attempts remaining: ${newAttempts}`);
      } else {
        setErrorMessage("No attempts remaining. Your account has been locked.");
        setLocked(true);
        setTimeout(() => alert("Your account has been locked. Please contact support."), 100);
      }
    } else {
      navigate("/homepage");
    }
  };

return (
  <div className="Login-section">
    <div className="login-logo" />
    <h1>Welcome back</h1>
    <p className="login-subtitle">Sign in to your account</p>

    <div className="form-group">
      <label htmlFor="email">Email address</label>
      <input
        type="email"
        id="email"
        name="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
    </div>

    <div className="form-group">
      <label htmlFor="password">Password</label>
      <input
        type="password"
        id="password"
        name="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
    </div>

    <button
      id="login-button"
      onClick={handleLogin}
      disabled={locked}
    >
      Sign in
    </button>

    <span id="error-message">{errorMessage}</span>
  </div>
  );
}
