import { useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEmail } from "./EmailContext.jsx";
const baseUrl = import.meta.env.VITE_API_URL;
const booksUrl = import.meta.env.BOOKS_API_URL;


export default function LoginPanel() {
  const navigate = useNavigate();
  const { setEmail } = useEmail();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const baseUrl = import.meta.env.VITE_API_URL;
const booksUrl = import.meta.env.BOOKS_API_URL

  async function handleLogin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (isSubmitting || !form.reportValidity()) return;

    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BOOKS_API_URL}/authors?email=${encodeURIComponent(email)}`,
      );
      if (!response.ok) {
        throw new Error(`Unable to reach the author API (${response.status}).`);
      }

      let authors;
      try {
        authors = await response.json();
      } catch {
        throw new Error("The author API returned an invalid response.");
      }

      if (!Array.isArray(authors)) {
        throw new Error("The author API returned an invalid author list.");
      }
      console.log("authors:");

      const author = authors.find(
        (candidate) =>
          candidate &&
          typeof candidate.email === "string" &&
          candidate.email.trim().toLowerCase() === email &&
          candidate.phone === password,
      );

      if (!author) {
        throw new Error("Invalid email or password.");
      }

      setEmail(email);
      navigate("${import.meta.env.VITE_API_URL}/mybooks");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <a className="brand auth-brand" href="#" aria-label="Bookleaf home">
        <span className="brand-mark">
          <BookOpen size={19} strokeWidth={2.2} />
        </span>
        <span>bookleaf</span>
      </a>
      <section className="auth-card">
        <span className="eyebrow">AUTHOR PORTAL</span>
        <h1>Welcome back</h1>
        <p className="auth-intro">
          Sign in to view your books and royalty details.
        </p>
        <form className="auth-form" onSubmit={handleLogin}>
          <label className="auth-field">
            <span>Email address</span>
            <input
              autoComplete="username"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              name="password"
              required
              type="password"
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="submit-button auth-submit"
            disabled={isSubmitting}
            type="submit"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
            {!isSubmitting && <ArrowRight size={17} />}
          </button>
        </form>
        <p className="auth-footnote">
          Author accounts are provisioned by Bookleaf. Contact support if you
          need access.
        </p>
      </section>
    </main>
  );
}
