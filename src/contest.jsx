import { useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  FileText,
  Image,
  Paperclip,
  X,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useEmail } from "./EmailContext.jsx";

const MAX_ATTACHMENTS = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 25 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getErrorMessage(response, result) {
  const detail = result && typeof result === "object" ? result.detail : null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) =>
        item && typeof item.msg === "string" ? item.msg : "",
      )
      .filter(Boolean);
    if (messages.length) return messages.join(" ");
  }
  return `Unable to submit your request (status ${response.status}).`;
}

export default function Contest() {
  const location = useLocation();
  const { email } = useEmail();
  const books = Array.isArray(location.state?.author?.books)
    ? location.state.author.books
    : [];
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");
  const fileInputRef = useRef(null);

  function addFiles(fileList) {
    const additions = Array.from(fileList || []);
    setError("");
    const uniqueAdditions = additions.filter(
      (file) =>
        !attachments.some(
          (existing) =>
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified,
        ),
    );
    const next = [...attachments, ...uniqueAdditions];
    if (next.length > MAX_ATTACHMENTS) {
      setError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
      return;
    }
    const oversizeFile = next.find((file) => file.size > MAX_FILE_SIZE);
    if (oversizeFile) {
      setError(`${oversizeFile.name} exceeds the 10 MB file limit.`);
      return;
    }
    if (next.reduce((size, file) => size + file.size, 0) > MAX_TOTAL_SIZE) {
      setError("Attachments must total no more than 25 MB.");
      return;
    }
    setAttachments(next);
  }

  function removeFile(fileToRemove) {
    setAttachments((current) =>
      current.filter((file) => file !== fileToRemove),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (isSubmitting || !form.reportValidity()) return;

    const formData = new FormData(form);
    formData.delete("attachments");
    attachments.forEach((file) => formData.append("attachments", file));
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/support-requests`, {
        method: "POST",
        body: formData,
      });
      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(response, result));
      }
      if (typeof result?.request_id !== "string" || !result.request_id) {
        throw new Error("The server did not return a request ID.");
      }

      setRequestId(result.request_id);
      setAttachments([]);
      form.reset();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit your request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="page-content">
        <section className="form-column">
          <div className="eyebrow">
            <span className="eyebrow-icon">
              <BookOpen size={14} />
            </span>
            AUTHOR SUPPORT
          </div>
          <h1>Raise a support ticket</h1>
          <p className="intro">
            Tell us what you need help with. Our author care team will get back
            to you as soon as possible.
          </p>
          {email && <p className="field-hint">Signed in as {email}</p>}

          {requestId ? (
            <section className="success-card" aria-live="polite">
              <span className="success-icon">
                <CheckCircle2 size={28} />
              </span>
              <h2>Your request has been submitted</h2>
              <p>Our author care team will be in touch soon.</p>
              <p>Request ID: {requestId}</p>
              <button
                className="text-button"
                onClick={() => setRequestId("")}
                type="button"
              >
                Submit another request <ArrowRight size={15} />
              </button>
            </section>
          ) : (
            <form className="ticket-form" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="ticket-book">What is your query about?</label>
                <div className="select-wrap">
                  <BookOpen className="field-leading-icon" size={17} />
                  <select
                    id="ticket-book"
                    name="book"
                    defaultValue=""
                    required
                  >
                    <option value="" disabled>
                      Select a book or account support
                    </option>
                    <option value="general">General / Account Level</option>
                    {books.map((book) => (
                      <option key={book.book_id} value={book.title}>
                        {book.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="select-chevron"
                    size={17}
                    aria-hidden="true"
                  />
                </div>
              </div>

              {books.length === 0 && (
                <p className="field-hint">
                  Sign in to choose one of your books. General account support
                  is still available.
                </p>
              )}

              <div className="field">
                <label htmlFor="ticket-subject">Subject</label>
                <input
                  id="ticket-subject"
                  name="subject"
                  type="text"
                  maxLength={200}
                  placeholder="A short summary of your question"
                  required
                />
              </div>

              <div className="field">
                <div className="label-row">
                  <label htmlFor="ticket-description">Description</label>
                  <span className="field-hint">Be as detailed as you can</span>
                </div>
                <textarea
                  id="ticket-description"
                  name="description"
                  maxLength={10000}
                  placeholder="Include any details that might help us understand and resolve your query..."
                  rows="6"
                  required
                />
              </div>

              <div className="field attachment-field">
                <div className="label-row">
                  <label htmlFor="ticket-attachments">Attachments</label>
                  <span className="optional-tag">OPTIONAL</span>
                </div>
                <input
                  ref={fileInputRef}
                  className="visually-hidden"
                  id="ticket-attachments"
                  name="attachments"
                  type="file"
                  multiple
                  onChange={(event) => {
                    addFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
                <button
                  className={`upload-area${isDragging ? " is-dragging" : ""}`}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    addFiles(event.dataTransfer.files);
                  }}
                  aria-label="Choose files or drop them here to attach"
                >
                  <span className="upload-icon">
                    <Paperclip size={18} />
                  </span>
                  <span className="upload-copy">
                    <span>
                      <strong>Click to upload</strong> or drag and drop
                    </span>
                    <span className="upload-hint">
                      Up to 10 files, 10 MB each (25 MB total)
                    </span>
                  </span>
                  <span className="browse-label">Browse</span>
                </button>

                {attachments.length > 0 && (
                  <ul className="file-list" aria-label="Attached files">
                    {attachments.map((file, index) => (
                      <li
                        className="file-item"
                        key={`${file.name}-${file.lastModified}-${index}`}
                      >
                        <span className="file-type-icon">
                          {file.type.startsWith("image/") ? (
                            <Image size={17} />
                          ) : (
                            <FileText size={17} />
                          )}
                        </span>
                        <span className="file-details">
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">
                            {formatFileSize(file.size)}
                          </span>
                        </span>
                        <button
                          className="remove-file"
                          type="button"
                          onClick={() => removeFile(file)}
                          aria-label={`Remove ${file.name}`}
                        >
                          <X size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              <div className="form-footer">
                <p>
                  <span className="secure-dot" />
                  Your information is kept private and secure
                </p>
                <button
                  className="submit-button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send request"}
                  {!isSubmitting && <ArrowRight size={17} />}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
