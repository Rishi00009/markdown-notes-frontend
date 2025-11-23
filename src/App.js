import { useEffect, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

// IMPORTANT: point to /api/notes
const API_URL = "https://notes-backend-0g16.onrender.com/api/notes";

function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // simple theme: light / dark
  const [mode, setMode] = useState("light"); // "light" | "dark"

  // popup notification
  const [popup, setPopup] = useState(null); // { message, type } | null

  const isDark = mode === "dark";

  const theme = {
    pageBg: isDark ? "#020617" : "#F3F4F6",
    headerBg: isDark ? "#020617" : "#FFFFFF",
    headerBorder: isDark ? "#111827" : "#E5E7EB",
    cardBg: isDark ? "#020617" : "#FFFFFF",
    cardBorder: isDark ? "#1F2937" : "#E5E7EB",
    nestedBg: isDark ? "#020617" : "#F9FAFB",
    textMain: isDark ? "#F9FAFB" : "#111827",
    textMuted: isDark ? "#9CA3AF" : "#6B7280",
    textSoft: isDark ? "#6B7280" : "#9CA3AF",
    accent: isDark ? "#38f862ff" : "#25aa42ff",
  };

  const showPopup = (message, type = "info") => {
    setPopup({ message, type });
    setTimeout(() => {
      setPopup(null);
    }, 2500);
  };

  // ====== DATA LOGIC ======

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      // console.log("API response:", res.data);

      if (Array.isArray(res.data)) {
        setNotes(res.data);
      } else {
        setNotes([]);
        showPopup("Unexpected response from server", "error");
      }
    } catch (err) {
      console.log("Error fetching notes", err);
      showPopup("Could not load notes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      showPopup("Please enter a title", "error");
      return;
    }

    try {
      if (editingId) {
        const res = await axios.put(`${API_URL}/${editingId}`, {
          title,
          content,
        });
        setNotes((prev) =>
          prev.map((n) => (n._id === editingId ? res.data : n))
        );
        showPopup("Note updated", "success");
      } else {
        const res = await axios.post(API_URL, { title, content });
        setNotes((prev) => [res.data, ...prev]);
        showPopup("Note saved", "success");
      }

      setTitle("");
      setContent("");
      setEditingId(null);
    } catch (err) {
      console.log("Error saving note", err);
      showPopup("Could not save note", "error");
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this note?");
    if (!ok) return;

    try {
      await axios.delete(`${API_URL}/${id}`);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      showPopup("Note deleted", "success");
    } catch (err) {
      console.log("Error deleting note", err);
      showPopup("Could not delete note", "error");
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (!search.trim()) return true;

    const titleText = (n.title || "").toLowerCase();
    const contentText = (n.content || "").toLowerCase();
    const searchText = search.toLowerCase();

    return titleText.includes(searchText) || contentText.includes(searchText);
  });

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: theme.pageBg, color: theme.textMain }}
    >
      {/* POPUP */}
      {popup && (
        <div className="fixed top-3 inset-x-0 flex justify-center z-20">
          <div
            className={`px-4 py-2 rounded-xl shadow-lg text-sm flex items-center gap-2 border ${
              popup.type === "error"
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            <span>{popup.message}</span>
            <button
              onClick={() => setPopup(null)}
              className="text-xs font-semibold opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header
        className="border-b"
        style={{ backgroundColor: theme.headerBg, borderColor: theme.headerBorder }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Markdown Notes
            </h1>
            <p className="text-xs md:text-sm" style={{ color: theme.textMuted }}>
              Simple split layout — left for writing, right for your notes.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span style={{ color: theme.textSoft }}>Mode</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="px-2 py-1 rounded-full text-[11px] border focus:outline-none"
              style={{
                backgroundColor: theme.nestedBg,
                borderColor: theme.cardBorder,
                color: theme.textMain,
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-7">
        {/* LEFT: EDITOR */}
        <section className="flex flex-col">
          <div
            className="rounded-3xl shadow-md p-5 md:p-6 flex flex-col gap-4 border"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingId ? "Edit note" : "New note"}
                </h2>
                <p className="text-[11px]" style={{ color: theme.textMuted }}>
                  {editingId
                    ? "Update your existing note."
                    : "Write your note here. Markdown syntax is supported."}
                </p>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setTitle("");
                    setContent("");
                  }}
                  className="text-[11px] px-3 py-1 rounded-full border"
                  style={{
                    borderColor: theme.cardBorder,
                    color: theme.textMuted,
                    backgroundColor: theme.nestedBg,
                  }}
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Title */}
              <div className="flex flex-col gap-1">
                <label
                  className="text-[11px] uppercase tracking-wide"
                  style={{ color: theme.textSoft }}
                >
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. React interview notes"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border text-sm focus:outline-none"
                  style={{
                    backgroundColor: theme.nestedBg,
                    borderColor: theme.cardBorder,
                    color: theme.textMain,
                  }}
                />
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1">
                <label
                  className="text-[11px] uppercase tracking-wide"
                  style={{ color: theme.textSoft }}
                >
                  Content
                </label>
                <textarea
                  rows={12}
                  placeholder={`Write your note here...

- tasks
- ideas
- code snippets`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border text-sm focus:outline-none resize-none"
                  style={{
                    backgroundColor: theme.nestedBg,
                    borderColor: theme.cardBorder,
                    color: theme.textMain,
                  }}
                />
              </div>

              {/* Save button */}
              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-white shadow-md"
                style={{ backgroundColor: theme.accent }}
              >
                {editingId ? "Update note" : "Save note"}
              </button>
            </form>
          </div>
        </section>

        {/* RIGHT: OUTPUT (NOTES LIST) */}
        <section className="flex flex-col">
          <div
            className="rounded-3xl shadow-md p-5 md:p-6 border flex flex-col gap-4 flex-1"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            {/* Header + Search */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Your notes</h2>
                <p className="text-[11px]" style={{ color: theme.textMuted }}>
                  {loading ? "Loading..." : `Total notes: ${notes.length}`}
                </p>
              </div>
              <input
                type="text"
                placeholder="Search by title or content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-72 px-3 py-2 rounded-full border text-xs focus:outline-none"
                style={{
                  backgroundColor: theme.nestedBg,
                  borderColor: theme.cardBorder,
                  color: theme.textMain,
                }}
              />
            </div>

            {/* Notes list container */}
            <div
              className="rounded-2xl flex-1 overflow-y-auto"
              style={{
                backgroundColor: theme.nestedBg,
                border: `1px solid ${theme.cardBorder}`,
                maxHeight: "440px",
                padding: "10px",
              }}
            >
              {!loading && filteredNotes.length === 0 && (
                <div className="px-2 py-3 text-xs" style={{ color: theme.textMuted }}>
                  No notes yet. Create one on the left.
                </div>
              )}

              <div className="space-y-3">
                {filteredNotes.map((note) => (
                  <article
                    key={note._id}
                    className="rounded-2xl border px-4 py-3 flex flex-col gap-2 hover:shadow-sm transition-shadow"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.cardBorder,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <h3
                          className="font-semibold text-sm truncate"
                          style={{ color: theme.textMain }}
                        >
                          {note.title || "Untitled note"}
                        </h3>
                        <span className="text-[10px]" style={{ color: theme.textSoft }}>
                          {new Date(note.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <span
                        className="text-[10px] px-2 py-1 rounded-full"
                        style={{
                          border: `1px solid ${theme.cardBorder}`,
                          color: theme.textSoft,
                          backgroundColor: theme.nestedBg,
                        }}
                      >
                        {note.content && note.content.length > 0
                          ? `${note.content.length} chars`
                          : "Empty"}
                      </span>
                    </div>

                    <div
                      className="text-[11px] leading-relaxed line-clamp-3"
                      style={{ color: theme.textMuted }}
                    >
                      <ReactMarkdown>{note.content || "_(empty note)_"}</ReactMarkdown>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setEditingId(note._id);
                          setTitle(note.title);
                          setContent(note.content);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="px-3 py-1 text-[11px] rounded-full border"
                        style={{
                          backgroundColor: theme.nestedBg,
                          borderColor: theme.cardBorder,
                          color: theme.textMain,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(note._id)}
                        className="px-3 py-1 text-[11px] rounded-full text-white"
                        style={{ backgroundColor: theme.accent }}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
