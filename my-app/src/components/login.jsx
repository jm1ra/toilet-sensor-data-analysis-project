/* NIT3004 - IT CAPSTONE PROJECT 2 - Toilet Sensors at Cruickshank park
created by John Demelis, Ryan Martinovic and Justin Mira*/
// src/components/Login.jsx
// importing necessary libaries and components for the login
import { useNavigate } from "react-router-dom";
import "../style.css";
import { useState } from "react";
import { supabase } from "../supabaseClient";

const MAX_ATTEMPTS = 3;
// Variable creation for the login fields
export default function Login() {
  const [email, setEmail] = useState(""); //Specify what username field requires
  const [password, setPassword] = useState(""); //Sets password field 
  const [errorMessage, setErrorMessage] = useState(""); //POP-UP when user enters incorrect username or password
  const [attemptsRemaining, setAttemptsRemaining] = useState(MAX_ATTEMPTS); //Counts the amount of failed attempts
  const [locked, setLocked] = useState(false); //Locks user after x amount of attempts
    const navigate = useNavigate();
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
//Incorrect amount of attempts logic
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
/*The login pages visuals and features - Creates all the necessary fields for users to access the homepage */
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
