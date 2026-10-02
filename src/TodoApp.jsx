import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Check, ClipboardList, Search, X, CalendarDays } from "lucide-react";

const PRIORITIES = {
  low: {
    label: "ต่ำ",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    stripe: "bg-emerald-400",
    active: "bg-emerald-50 text-emerald-700 ring-emerald-300",
  },
  medium: {
    label: "กลาง",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    stripe: "bg-amber-400",
    active: "bg-amber-50 text-amber-700 ring-amber-300",
  },
  high: {
    label: "สูง",
    badge: "bg-rose-50 text-rose-700 ring-rose-200",
    stripe: "bg-rose-500",
    active: "bg-rose-50 text-rose-700 ring-rose-300",
  },
};
const ORDER = ["low", "medium", "high"];

const CATEGORIES = {
  work: { label: "งาน", dot: "bg-sky-500" },
  personal: { label: "ส่วนตัว", dot: "bg-violet-500" },
  shopping: { label: "ช้อปปิ้ง", dot: "bg-pink-500" },
  health: { label: "สุขภาพ", dot: "bg-teal-500" },
};
const CAT_KEYS = Object.keys(CATEGORIES);

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ยังไม่เสร็จ" },
  { key: "completed", label: "เสร็จแล้ว" },
];

/* ---------- date helpers (local time, YYYY-MM-DD strings) ---------- */
const pad = (n) => String(n).padStart(2, "0");
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => toStr(new Date());
const offsetStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toStr(d);
};
const fmtDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
};

const DUE_STYLE = {
  overdue: "bg-red-600 text-white ring-red-600",
  today: "bg-yellow-100 text-yellow-800 ring-yellow-300",
  normal: "bg-slate-100 text-slate-600 ring-slate-200",
};

function TodoItem({ todo, today, removing, onToggle, onDelete, onEdit, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const inputRef = useRef(null);
  const dateRef = useRef(null);
  const cancelled = useRef(false);
  const p = PRIORITIES[todo.priority];
  const cat = todo.category ? CATEGORIES[todo.category] : null;

  const dueState = !todo.due || todo.done ? "normal" : todo.due < today ? "overdue" : todo.due === today ? "today" : "normal";
  const dueLabel = !todo.due
    ? null
    : dueState === "overdue"
    ? `เกินกำหนด · ${fmtDate(todo.due)}`
    : dueState === "today"
    ? "วันนี้"
    : fmtDate(todo.due);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    cancelled.current = false;
    setDraft(todo.text);
    setEditing(true);
  };

  const commit = () => {
    if (!cancelled.current) {
      const t = draft.trim();
      if (t && t !== todo.text) onEdit(todo.id, t);
    }
    setEditing(false);
  };

  const openPicker = () => {
    const el = dateRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
      el.click();
    }
  };

  const cycleCategory = () => {
    const seq = [null, ...CAT_KEYS];
    onUpdate(todo.id, { category: seq[(seq.indexOf(todo.category) + 1) % seq.length] });
  };

  return (
    <li
      style={{
        display: "grid",
        gridTemplateRows: removing ? "0fr" : "1fr",
        opacity: removing ? 0 : 1,
        transition: "grid-template-rows 260ms ease, opacity 200ms ease",
      }}
    >
      <div className="overflow-hidden">
        <div className="pb-3">
          <div className="relative flex items-start gap-3 rounded-xl bg-white py-3 pl-5 pr-3 shadow-md ring-1 ring-slate-100">
            <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r ${p.stripe}`} />

            <button
              onClick={() => onToggle(todo.id)}
              aria-label={todo.done ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
              aria-pressed={todo.done}
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                todo.done
                  ? "border-slate-800 bg-slate-800 text-white"
                  : "border-slate-300 bg-white text-transparent hover:border-slate-500"
              }`}
            >
              <Check size={14} strokeWidth={3} />
            </button>

            <div className="min-w-0 flex-1">
              {editing ? (
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commit();
                    if (e.key === "Escape") {
                      cancelled.current = true;
                      setEditing(false);
                    }
                  }}
                  className="w-full rounded-md border border-slate-300 px-2 py-1 text-base text-slate-800 focus:border-slate-500 focus:outline-none"
                />
              ) : (
                <span
                  onDoubleClick={startEdit}
                  title="ดับเบิลคลิกเพื่อแก้ไข"
                  className={`block cursor-text select-none break-words text-base transition-colors ${
                    todo.done ? "text-slate-400 line-through" : "text-slate-800"
                  }`}
                >
                  {todo.text}
                </span>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => onUpdate(todo.id, { priority: ORDER[(ORDER.indexOf(todo.priority) + 1) % ORDER.length] })}
                  title="คลิกเพื่อเปลี่ยนความสำคัญ"
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${p.badge}`}
                >
                  {p.label}
                </button>

                <button
                  onClick={cycleCategory}
                  title="คลิกเพื่อเปลี่ยนหมวดหมู่"
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    cat
                      ? "bg-slate-100 text-slate-600"
                      : "border border-dashed border-slate-300 text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {cat && <span className={`h-2 w-2 rounded-full ${cat.dot}`} />}
                  {cat ? cat.label : "+ หมวดหมู่"}
                </button>

                <span className="relative inline-flex">
                  <button
                    onClick={openPicker}
                    title="คลิกเพื่อเปลี่ยนวันครบกำหนด"
                    className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      todo.due
                        ? `ring-1 ring-inset ${DUE_STYLE[dueState]}`
                        : "border border-dashed border-slate-300 text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <CalendarDays size={12} />
                    {dueLabel || "กำหนดวัน"}
                  </button>
                  <input
                    ref={dateRef}
                    type="date"
                    value={todo.due || ""}
                    onChange={(e) => onUpdate(todo.id, { due: e.target.value || null })}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 top-full h-px w-px opacity-0"
                  />
                </span>
              </div>
            </div>

            <button
              onClick={() => onDelete(todo.id)}
              aria-label="ลบงาน"
              className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

function Donut({ segments, percent }) {
  const R = 15.9155;
  let cum = 0;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 36 36" className="h-full w-full" role="img" aria-label="สัดส่วนสถานะงาน">
        <circle cx="18" cy="18" r={R} fill="none" stroke="#f1f5f9" strokeWidth="4" />
        {segments.map((s) => {
          const el = s.pct > 0 && (
            <circle
              key={s.label}
              cx="18"
              cy="18"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="4"
              strokeDasharray={`${s.pct} ${100 - s.pct}`}
              strokeDashoffset={-cum}
              transform="rotate(-90 18 18)"
              style={{ transition: "stroke-dasharray 300ms ease" }}
            />
          );
          cum += s.pct;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-700">
        {percent}%
      </div>
    </div>
  );
}

export default function TodoApp() {
  const nextId = useRef(6);
  const [todos, setTodos] = useState(() => [
    { id: 1, text: "ส่งรายงานความคืบหน้าโปรเจกต์", priority: "high", done: false, category: "work", due: offsetStr(-2) },
    { id: 2, text: "รีวิวโค้ดของเพื่อนร่วมทีม", priority: "medium", done: false, category: "work", due: offsetStr(0) },
    { id: 3, text: "ซื้อของเข้าบ้านสุดสัปดาห์", priority: "low", done: false, category: "shopping", due: offsetStr(3) },
    { id: 4, text: "นัดตรวจสุขภาพประจำปี", priority: "medium", done: false, category: "health", due: null },
    { id: 5, text: "อัปเดตเอกสารประกอบการใช้งาน", priority: "low", done: true, category: "work", due: offsetStr(-1) },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [newCat, setNewCat] = useState("");
  const [newDue, setNewDue] = useState("");
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [removing, setRemoving] = useState([]);

  const today = todayStr();

  const add = () => {
    const t = text.trim();
    if (!t) return;
    setTodos((prev) => [
      { id: nextId.current++, text: t, priority, done: false, category: newCat || null, due: newDue || null },
      ...prev,
    ]);
    setText("");
    setNewDue("");
  };

  const removeIds = (ids) => {
    if (!ids.length) return;
    setRemoving((r) => [...r, ...ids]);
    setTimeout(() => {
      setTodos((prev) => prev.filter((t) => !ids.includes(t.id)));
      setRemoving((r) => r.filter((id) => !ids.includes(id)));
    }, 260);
  };

  const update = (id, patch) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const toggle = (id) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const pickCategory = (key) => {
    setCatFilter(key);
    setNewCat(key === "all" ? "" : key);
  };

  const q = search.trim().toLowerCase();
  const visible = todos.filter(
    (t) =>
      (filter === "active" ? !t.done : filter === "completed" ? t.done : true) &&
      (catFilter === "all" || t.category === catFilter) &&
      (!q || t.text.toLowerCase().includes(q))
  );

  const counts = { all: todos.length };
  CAT_KEYS.forEach((k) => (counts[k] = todos.filter((t) => t.category === k).length));

  const total = todos.length;
  const doneCount = todos.filter((t) => t.done).length;
  const overdueCount = todos.filter((t) => !t.done && t.due && t.due < today).length;
  const activeCount = total - doneCount - overdueCount;
  const remaining = total - doneCount;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;
  const pct = (n) => (total ? (n / total) * 100 : 0);
  const segments = [
    { label: "เสร็จแล้ว", n: doneCount, pct: pct(doneCount), color: "#10b981" },
    { label: "กำลังทำ", n: activeCount, pct: pct(activeCount), color: "#94a3b8" },
    { label: "เกินกำหนด", n: overdueCount, pct: pct(overdueCount), color: "#ef4444" },
  ];
  const completedIds = todos.filter((t) => t.done).map((t) => t.id);

  const emptyText = q
    ? `ไม่พบงานที่ตรงกับ "${search.trim()}"`
    : filter === "completed"
    ? "ยังไม่มีงานที่เสร็จ"
    : filter === "active"
    ? "ไม่มีงานค้าง เยี่ยมมาก"
    : "ยังไม่มีงานในหมวดนี้ เพิ่มงานได้เลย";

  return (
    <div
      className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12"
      style={{ fontFamily: "'Noto Sans Thai', 'Sarabun', 'Leelawadee UI', system-ui, sans-serif" }}
    >

      <div className="mx-auto w-full max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-800 sm:text-3xl">รายการงานของฉัน</h1>

        <div className="md:flex md:items-start md:gap-6">
          {/* Sidebar */}
          <aside className="mb-5 md:mb-0 md:w-60 md:shrink-0">
            <nav
              aria-label="หมวดหมู่"
              className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-100 md:flex-col md:overflow-visible"
            >
              {[{ key: "all", label: "ทั้งหมด" }, ...CAT_KEYS.map((k) => ({ key: k, ...CATEGORIES[k] }))].map((c) => (
                <button
                  key={c.key}
                  onClick={() => pickCategory(c.key)}
                  aria-pressed={catFilter === c.key}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    catFilter === c.key ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {c.dot ? (
                    <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
                  ) : (
                    <ClipboardList size={14} />
                  )}
                  <span className="flex-1 text-left">{c.label}</span>
                  <span
                    className={`rounded-full px-2 text-xs ${
                      catFilter === c.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {counts[c.key]}
                  </span>
                </button>
              ))}
            </nav>

            {/* Stats */}
            <div className="mt-4 hidden rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-100 md:block">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">สถิติ</h2>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-2xl font-bold text-slate-800">{total}</div>
                  <div className="text-xs text-slate-500">งานทั้งหมด</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">{percent}%</div>
                  <div className="text-xs text-slate-500">เสร็จแล้ว</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Donut segments={segments} percent={percent} />
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {segments.map((s) => (
                    <li key={s.label} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                      <span>
                        {s.label} {s.n}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0 flex-1">
            {/* Add form */}
            <div className="mb-4 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-100">
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && add()}
                  placeholder="เพิ่มงานใหม่..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-base text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
                />
                <button
                  onClick={add}
                  disabled={!text.trim()}
                  aria-label="เพิ่มงาน"
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">เพิ่ม</span>
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">ความสำคัญ</span>
                  {ORDER.map((key) => (
                    <button
                      key={key}
                      onClick={() => setPriority(key)}
                      aria-pressed={priority === key}
                      className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
                        priority === key
                          ? PRIORITIES[key].active
                          : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {PRIORITIES[key].label}
                    </button>
                  ))}
                </div>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  aria-label="หมวดหมู่"
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-600 focus:border-slate-400 focus:outline-none"
                >
                  <option value="">ไม่ระบุหมวดหมู่</option>
                  {CAT_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {CATEGORIES[k].label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  aria-label="วันครบกำหนด"
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-600 focus:border-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหางาน..."
                aria-label="ค้นหางาน"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-base text-slate-800 placeholder-slate-400 shadow-sm focus:border-slate-400 focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="ล้างคำค้นหา"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div role="tablist" className="mb-4 flex gap-1 rounded-xl bg-slate-200/60 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  role="tab"
                  aria-selected={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition-all ${
                    filter === f.key ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* List */}
            {visible.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-12 text-center shadow-md ring-1 ring-slate-100">
                <ClipboardList size={36} className="mb-3 text-slate-300" />
                <p className="text-slate-500">{emptyText}</p>
              </div>
            ) : (
              <ul>
                {visible.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    today={today}
                    removing={removing.includes(todo.id)}
                    onToggle={toggle}
                    onDelete={(id) => removeIds([id])}
                    onEdit={(id, t) => update(id, { text: t })}
                    onUpdate={update}
                  />
                ))}
              </ul>
            )}

            {/* Footer */}
            <div className="mt-2 flex items-center justify-between px-1 text-sm text-slate-500">
              <span>เหลืออีก {remaining} รายการ</span>
              <button
                onClick={() => removeIds(completedIds)}
                disabled={completedIds.length === 0}
                className="rounded-lg px-3 py-1.5 font-medium text-slate-600 transition-colors hover:bg-slate-200/60 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
              >
                ล้างรายการที่เสร็จแล้ว
              </button>
            </div>

            {/* Stats (mobile) */}
            <div className="mt-5 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-100 md:hidden">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">สถิติ</h2>
              <div className="flex items-center gap-4">
                <Donut segments={segments} percent={percent} />
                <div className="text-sm text-slate-600">
                  <p>
                    งานทั้งหมด <b className="text-slate-800">{total}</b> · เสร็จแล้ว{" "}
                    <b className="text-slate-800">{percent}%</b>
                  </p>
                  <ul className="mt-2 space-y-1 text-xs">
                    {segments.map((s) => (
                      <li key={s.label} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                        {s.label} {s.n}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
