import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Filter,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEmail } from "./EmailContext.jsx";

const ADMIN_EMAIL = "abhaysingh480shiv@gmail.com";

function ticketStatus(ticket) {
  return typeof ticket.status === "string" && ticket.status.trim()
    ? ticket.status.trim()
    : "Open";
}

function dateKey(value) {
  if (typeof value !== "string" || !value) return "";
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

function formatDate(value) {
  const key = dateKey(value);
  if (!key) return "Date unavailable";

  const date = new Date(`${key}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
}

function formatLabel(value) {
  if (typeof value !== "string" || !value.trim()) return "Uncategorized";
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function Admin() {
  const { email, setEmail } = useEmail();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [priorityError, setPriorityError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const hasAdminEmail = email.trim().toLowerCase() === ADMIN_EMAIL;

  async function loadTickets(signal) {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('${VITE_API_URL}/api/support-requests', {
        headers: {
          Authorization: `Basic ${btoa(`${email}:${password}`)}`,
        },
        signal,
      });
      if (!response.ok) {
        throw new Error(`Unable to load support tickets (${response.status}).`);
      }

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("The support API returned invalid JSON.");
      }
      if (!Array.isArray(result)) {
        throw new Error("The support API returned an invalid ticket list.");
      }

      setTickets(result.filter((ticket) => ticket && typeof ticket === "object"));
    } catch (loadError) {
      if (loadError.name !== "AbortError") {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load support tickets. Please try again.",
        );
      }
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }

  async function loadCategories(signal) {
    setCategoryError("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`, { signal });
      if (!response.ok) {
        throw new Error(`Unable to load categories (${response.status}).`);
      }

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("The categories API returned invalid JSON.");
      }
      if (
        !Array.isArray(result) ||
        result.some(
          (category) =>
            !category ||
            typeof category !== "object" ||
            typeof category.name !== "string",
        )
      ) {
        throw new Error("The categories API returned an invalid category list.");
      }

      setCategories(result);
    } catch (loadError) {
      if (loadError.name !== "AbortError") {
        setCategories([]);
        setCategoryError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load categories.",
        );
      }
    }
  }

  async function loadPriorities(signal) {
    setPriorityError("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/priorities`, { signal });
      if (!response.ok) {
        throw new Error(`Unable to load priorities (${response.status}).`);
      }

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("The priorities API returned invalid JSON.");
      }
      if (
        !Array.isArray(result) ||
        result.some(
          (priority) =>
            !priority ||
            typeof priority !== "object" ||
            typeof priority.name !== "string",
        )
      ) {
        throw new Error("The priorities API returned an invalid priority list.");
      }

      setPriorities(result);
    } catch (loadError) {
      if (loadError.name !== "AbortError") {
        setPriorities([]);
        setPriorityError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load priorities.",
        );
      }
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !hasAdminEmail) {
      setTickets([]);
      setCategories([]);
      setPriorities([]);
      return undefined;
    }

    const controller = new AbortController();
    loadTickets(controller.signal);
    loadCategories(controller.signal);
    loadPriorities(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated, hasAdminEmail, email, password]);

  async function handleLogin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (isAuthenticating || !form.reportValidity()) return;

    const formData = new FormData(form);
    const submittedEmail = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const submittedPassword = String(formData.get("password") || "");

    if (submittedEmail !== ADMIN_EMAIL) {
      setError("Invalid administrator email or password.");
      return;
    }

    setIsAuthenticating(true);
    setError("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/support-requests`, {
        headers: {
          Authorization: `Basic ${btoa(
            `${submittedEmail}:${submittedPassword}`,
          )}`,
        },
      });
      if (!response.ok) {
        let result = null;
        try {
          result = await response.json();
        } catch {
          result = null;
        }
        throw new Error(
          response.status === 401
            ? "Invalid administrator email or password."
            : typeof result?.detail === "string"
              ? result.detail
              : `Unable to authenticate (${response.status}).`,
        );
      }

      setEmail(submittedEmail);
      setPassword(submittedPassword);
      setIsAuthenticated(true);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsAuthenticating(false);
    }
  }

  function signOut() {
    setIsAuthenticated(false);
    setTickets([]);
    setPassword("");
    setEmail("");
    navigate("/login", { replace: true });
  }

  const statuses = useMemo(
    () =>
      [...new Set(tickets.map(ticketStatus))].sort((first, second) =>
        first.localeCompare(second),
      ),
    [tickets],
  );
  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        const createdDate = dateKey(ticket.created_at);
        const statusMatches =
          statusFilter === "all" ||
          ticketStatus(ticket).toLowerCase() === statusFilter.toLowerCase();
        const categoryMatches =
          categoryFilter === "all" || ticket.category === categoryFilter;
        const priorityMatches =
          priorityFilter === "all" || ticket.priority === priorityFilter;
        const fromMatches = !fromDate || (createdDate && createdDate >= fromDate);
        const toMatches = !toDate || (createdDate && createdDate <= toDate);
        return (
          statusMatches &&
          categoryMatches &&
          priorityMatches &&
          fromMatches &&
          toMatches
        );
      }),
    [tickets, statusFilter, categoryFilter, priorityFilter, fromDate, toDate],
  );

  if (!isAuthenticated || !hasAdminEmail) {
    return (
      <main className="auth-shell">
        <Link className="brand auth-brand" to="/login" aria-label="Bookleaf login">
          <span className="brand-mark">
            <BookOpen size={19} strokeWidth={2.2} />
          </span>
          <span>bookleaf</span>
        </Link>
        <section className="auth-card">
          <span className="eyebrow">ADMIN PORTAL</span>
          <h1>Administrator sign in</h1>
          <p className="auth-intro">
            Sign in to review incoming author support tickets.
          </p>
          <form className="auth-form" onSubmit={handleLogin}>
            <label className="auth-field">
              <span>Email address</span>
              <input
                autoComplete="username"
                defaultValue={hasAdminEmail ? email : ""}
                name="email"
                placeholder="admin@example.com"
                required
                type="email"
              />
            </label>
            <label className="auth-field">
              <span>Password</span>
              <input
                autoComplete="current-password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="submit-button auth-submit"
              disabled={isAuthenticating}
              type="submit"
              aria-busy={isAuthenticating}
            >
              <ShieldCheck size={16} />
              {isAuthenticating ? "Verifying..." : "Sign in to admin"}
            </button>
          </form>
          <p className="auth-footnote">
            The support API verifies administrator credentials before
            returning tickets.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <Link className="brand" to="/admin" aria-label="Bookleaf admin">
          <span className="brand-mark">
            <BookOpen size={19} strokeWidth={2.2} />
          </span>
          <span>bookleaf</span>
        </Link>
        <nav className="topbar-right" aria-label="Administrator navigation">
          <span className="admin-user">{email}</span>
          <button className="sign-out-button" onClick={signOut} type="button">
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </nav>
      </header>

      <div className="page-content admin-page-content">
        <div className="eyebrow">
          <span className="eyebrow-icon">
            <Ticket size={14} />
          </span>
          SUPPORT ADMINISTRATION
        </div>
        <div className="admin-heading">
          <div>
            <h1>Incoming tickets</h1>
            <p className="intro">
              Review support requests submitted by Bookleaf authors.
            </p>
          </div>
          <button
            className="admin-refresh"
            disabled={isLoading}
            onClick={() => loadTickets(new AbortController().signal)}
            type="button"
          >
            <RefreshCw size={15} className={isLoading ? "is-spinning" : ""} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <section className="admin-summary" aria-label="Ticket summary">
          <div>
            <span>Total tickets</span>
            <strong>{tickets.length}</strong>
          </div>
          <div>
            <span>Matching filters</span>
            <strong>{filteredTickets.length}</strong>
          </div>
        </section>

        <section className="admin-filters" aria-label="Filter support tickets">
          <div className="admin-filter-heading">
            <h2>
              <Filter size={15} />
              Filters
            </h2>
            <button
              className="admin-clear-filters"
              onClick={() => {
                setStatusFilter("all");
                setCategoryFilter("all");
                setPriorityFilter("all");
                setFromDate("");
                setToDate("");
              }}
              type="button"
            >
              Clear filters
            </button>
          </div>
          <div className="admin-filter-grid">
            <label className="admin-filter">
              <span>Status</span>
              <select
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="all">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-filter">
              <span>Category</span>
              <select
                onChange={(event) => setCategoryFilter(event.target.value)}
                value={categoryFilter}
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {formatLabel(category.name)}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-filter">
              <span>Priority</span>
              <select
                onChange={(event) => setPriorityFilter(event.target.value)}
                value={priorityFilter}
              >
                <option value="all">All priorities</option>
                {priorities.map((priority) => (
                  <option key={priority.id} value={priority.name}>
                    {formatLabel(priority.name)}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-filter">
              <span>From date</span>
              <input
                max={toDate || undefined}
                onChange={(event) => setFromDate(event.target.value)}
                type="date"
                value={fromDate}
              />
            </label>
            <label className="admin-filter">
              <span>To date</span>
              <input
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                type="date"
                value={toDate}
              />
            </label>
          </div>
          {categoryError && (
            <p className="admin-status-note" role="alert">
              {categoryError} Category filtering is unavailable.
            </p>
          )}
          {priorityError && (
            <p className="admin-status-note" role="alert">
              {priorityError} Priority filtering is unavailable.
            </p>
          )}
          <p className="admin-status-note">
            Tickets without a status in the API are shown as Open.
          </p>
        </section>

        {error ? (
          <section className="admin-message admin-error" role="alert">
            <p>{error}</p>
            <button
              className="admin-retry"
              onClick={() => loadTickets(new AbortController().signal)}
              type="button"
            >
              Try again
            </button>
          </section>
        ) : isLoading && tickets.length === 0 ? (
          <p className="admin-message" role="status">
            Loading incoming tickets...
          </p>
        ) : filteredTickets.length === 0 ? (
          <section className="admin-message">
            <Ticket size={22} />
            <h2>No tickets found</h2>
            <p>
              {tickets.length
                ? "Try changing or clearing your filters."
                : "New author support requests will appear here."}
            </p>
          </section>
        ) : (
          <section className="admin-ticket-list" aria-label="Support tickets">
            {filteredTickets.map((ticket, index) => (
              <article
                className="admin-ticket"
                key={ticket.id || `${ticket.created_at || "ticket"}-${index}`}
              >
                <div className="admin-ticket-topline">
                  <div className="admin-ticket-id">
                    <Ticket size={15} />
                    <span>
                      {ticket.id ? `Ticket ${ticket.id}` : "Support ticket"}
                    </span>
                  </div>
                  <span
                    className={`admin-status-badge admin-status-${ticketStatus(
                      ticket,
                    )
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")}`}
                  >
                    {formatLabel(ticketStatus(ticket))}
                  </span>
                </div>
                <h2>{ticket.subject || "No subject provided"}</h2>
                <p className="admin-ticket-description">
                  {ticket.description || "No description provided."}
                </p>
                <div className="admin-ticket-meta">
                  <span>
                    <strong>Book / account</strong>
                    {ticket.book || "Not specified"}
                  </span>
                  <span>
                    <strong>Category</strong>
                    {formatLabel(ticket.category)}
                  </span>
                  <span>
                    <strong>Priority</strong>
                    <span
                      className={`admin-priority admin-priority-${String(
                        ticket.priority || "unknown",
                      )
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")}`}
                    >
                      {formatLabel(ticket.priority)}
                    </span>
                  </span>
                  <span>
                    <strong>Date submitted</strong>
                    <span className="admin-date">
                      <CalendarDays size={13} />
                      {formatDate(ticket.created_at)}
                    </span>
                  </span>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
