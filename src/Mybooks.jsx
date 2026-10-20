import { useEffect, useState } from "react";
import { BookOpen, Headphones, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEmail } from "./EmailContext.jsx";

function formatCurrency(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date) {
  if (typeof date !== "string" || !date) return "—";
  const parsedDate = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsedDate.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(parsedDate);
}

function formatCount(count) {
  return typeof count === "number" && Number.isFinite(count)
    ? new Intl.NumberFormat("en-IN").format(count)
    : "—";
}

export default function Mybooks() {
  const { email, setEmail } = useEmail();
  const navigate = useNavigate();
  const [author, setAuthor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email) {
      setIsLoading(false);
      setAuthor(null);
      return undefined;
    }
    const booksUrl = import.meta.env.BOOKS_API_URL

    const controller = new AbortController();

    async function loadAuthorBooks() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${booksUrl}/authors?email=${encodeURIComponent(email)}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(`Unable to load your books (${response.status}).`);
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

        const currentAuthor = authors.find(
          (candidate) =>
            candidate &&
            typeof candidate.email === "string" &&
            candidate.email.trim().toLowerCase() === email.toLowerCase(),
        );
        if (!currentAuthor) {
          throw new Error("No author account was found for this email.");
        }

        setAuthor({
          ...currentAuthor,
          books: Array.isArray(currentAuthor.books) ? currentAuthor.books : [],
        });
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setAuthor(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load your books. Please try again.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadAuthorBooks();
    return () => controller.abort();
  }, [email]);

  function signOut() {
    setEmail("");
    navigate("/login", { replace: true });
  }

  const books = author?.books ?? [];
  const totals = books.reduce(
    (summary, book) => ({
      copiesSold:
        summary.copiesSold +
        (typeof book.total_copies_sold === "number"
          ? book.total_copies_sold
          : 0),
      earned:
        summary.earned +
        (typeof book.total_royalty_earned === "number"
          ? book.total_royalty_earned
          : 0),
      paid:
        summary.paid +
        (typeof book.royalty_paid === "number" ? book.royalty_paid : 0),
      pending:
        summary.pending +
        (typeof book.royalty_pending === "number" ? book.royalty_pending : 0),
    }),
    { copiesSold: 0, earned: 0, paid: 0, pending: 0 },
  );

  return (
    <main className="page-shell">
      <header className="topbar">
        <Link className="brand" to="/mybooks" aria-label="Bookleaf My Books">
          <span className="brand-mark">
            <BookOpen size={19} strokeWidth={2.2} />
          </span>
          <span>bookleaf</span>
        </Link>
        <nav className="topbar-right" aria-label="Author navigation">
          <Link className="topbar-link" to="/support" state={{ author }}>
            <Headphones size={15} />
            <span>Contact support</span>
          </Link>
          <button className="sign-out-button" onClick={signOut} type="button">
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </nav>
      </header>

      <div className="page-content books-page-content">
        {!email ? (
          <section className="books-message" role="status">
            <h1>Sign in to view your books</h1>
            <p>Your book and royalty details are available after signing in.</p>
            <Link className="submit-button books-login-link" to="/login">
              Sign in
            </Link>
          </section>
        ) : (
          <>
            <div className="eyebrow">
              <span className="eyebrow-icon">
                <BookOpen size={14} />
              </span>
              AUTHOR PORTAL
            </div>
            <h1>My Books</h1>
            <p className="intro">
              View your titles, sales, and royalty details in one place.
            </p>

            {isLoading ? (
              <p className="books-message" role="status">
                Loading your books...
              </p>
            ) : error ? (
              <p className="form-error books-error" role="alert">
                {error}
              </p>
            ) : author ? (
              <>
                <section className="author-dashboard" aria-label="Author overview">
                  <div className="author-profile">
                    <div>
                      <h2>{author.name || "Author"}</h2>
                      <p>{author.email}</p>
                    </div>
                    {author.joined_date && (
                      <span className="joined-date">
                        Member since {formatDate(author.joined_date)}
                      </span>
                    )}
                  </div>

                  <div className="author-stats">
                    <div className="author-stat">
                      <span>Total copies sold</span>
                      <strong>{formatCount(totals.copiesSold)}</strong>
                    </div>
                    <div className="author-stat">
                      <span>Total royalty earned</span>
                      <strong>{formatCurrency(totals.earned)}</strong>
                    </div>
                    <div className="author-stat">
                      <span>Royalty paid</span>
                      <strong>{formatCurrency(totals.paid)}</strong>
                    </div>
                    <div className="author-stat">
                      <span>Royalty pending</span>
                      <strong>{formatCurrency(totals.pending)}</strong>
                    </div>
                  </div>

                  <div className="books-table-wrap">
                    <h3>Your titles</h3>
                    {books.length ? (
                      <div className="books-table-scroll">
                        <table className="books-table my-books-table">
                          <thead>
                            <tr>
                              <th scope="col">Title</th>
                              <th scope="col">ISBN</th>
                              <th scope="col">Genre</th>
                              <th scope="col">Publication date</th>
                              <th scope="col">Status</th>
                              <th scope="col">MRP</th>
                              <th scope="col">Copies sold</th>
                              <th scope="col">Royalty earned</th>
                              <th scope="col">Royalty paid</th>
                              <th scope="col">Royalty pending</th>
                            </tr>
                          </thead>
                          <tbody>
                            {books.map((book, index) => (
                              <tr key={book.book_id || `${book.title}-${index}`}>
                                <th scope="row">
                                  <span className="book-title">
                                    {book.title || "Untitled"}
                                  </span>
                                </th>
                                <td>{book.isbn || "—"}</td>
                                <td>{book.genre || "—"}</td>
                                <td>{formatDate(book.publication_date)}</td>
                                <td>
                                  <span className="book-status">
                                    {book.status || "—"}
                                  </span>
                                </td>
                                <td>{formatCurrency(book.mrp)}</td>
                                <td>{formatCount(book.total_copies_sold)}</td>
                                <td>
                                  {formatCurrency(book.total_royalty_earned)}
                                </td>
                                <td>{formatCurrency(book.royalty_paid)}</td>
                                <td>{formatCurrency(book.royalty_pending)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="books-empty">
                        There are no books associated with your account yet.
                      </p>
                    )}
                  </div>
                </section>
              </>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}