import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Check, ClipboardList } from "lucide-react";

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

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ยังไม่เสร็จ" },
  { key: "completed", label: "เสร็จแล้ว" },
];

const EMPTY_TEXT = {
  all: "ยังไม่มีงาน เพิ่มงานแรกของคุณได้เลย",
  active: "ไม่มีงานค้าง เยี่ยมมาก",
  completed: "ยังไม่มีงานที่เสร็จ",
};

function TodoItem({ todo, removing, onToggle, onDelete, onEdit, onCyclePriority }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const inputRef = useRef(null);
  const cancelled = useRef(false);
  const p = PRIORITIES[todo.priority];

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
          <div className="relative flex items-center gap-3 rounded-xl bg-white py-3 pl-5 pr-3 shadow-md ring-1 ring-slate-100">
            <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r ${p.stripe}`} />

            <button
              onClick={() => onToggle(todo.id)}
              aria-label={todo.done ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
              aria-pressed={todo.done}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
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
            </div>

            <button
              onClick={() => onCyclePriority(todo.id)}
              title="คลิกเพื่อเปลี่ยนความสำคัญ"
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${p.badge}`}
            >
              {p.label}
            </button>

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

export default function TodoApp() {
  const nextId = useRef(4);
  const [todos, setTodos] = useState([
    { id: 1, text: "ส่งรายงานความคืบหน้าโปรเจกต์", priority: "high", done: false },
    { id: 2, text: "รีวิวโค้ดของเพื่อนร่วมทีม", priority: "medium", done: false },
    { id: 3, text: "อัปเดตเอกสารประกอบการใช้งาน", priority: "low", done: true },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");
  const [removing, setRemoving] = useState([]);

  const add = () => {
    const t = text.trim();
    if (!t) return;
    setTodos((prev) => [{ id: nextId.current++, text: t, priority, done: false }, ...prev]);
    setText("");
  };

  const removeIds = (ids) => {
    if (!ids.length) return;
    setRemoving((r) => [...r, ...ids]);
    setTimeout(() => {
      setTodos((prev) => prev.filter((t) => !ids.includes(t.id)));
      setRemoving((r) => r.filter((id) => !ids.includes(id)));
    }, 260);
  };

  const toggle = (id) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const edit = (id, newText) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text: newText } : t)));
  const cyclePriority = (id) =>
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, priority: ORDER[(ORDER.indexOf(t.priority) + 1) % ORDER.length] }
          : t
      )
    );

  const remaining = todos.filter((t) => !t.done).length;
  const completedIds = todos.filter((t) => t.done).map((t) => t.id);
  const visible = todos.filter((t) =>
    filter === "active" ? !t.done : filter === "completed" ? t.done : true
  );

  return (
    <div
      className="min-h-screen bg-slate-50 px-4 py-8 sm:py-14"
      style={{ fontFamily: "'Noto Sans Thai', 'Sarabun', 'Leelawadee UI', system-ui, sans-serif" }}
    >

      <div className="mx-auto w-full max-w-xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-800 sm:text-3xl">รายการงานของฉัน</h1>

        {/* Add form */}
        <div className="mb-5 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-100">
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

          <div className="mt-3 flex items-center gap-2">
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
                filter === f.key
                  ? "bg-white text-slate-800 shadow"
                  : "text-slate-500 hover:text-slate-700"
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
            <p className="text-slate-500">{EMPTY_TEXT[filter]}</p>
          </div>
        ) : (
          <ul>
            {visible.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                removing={removing.includes(todo.id)}
                onToggle={toggle}
                onDelete={(id) => removeIds([id])}
                onEdit={edit}
                onCyclePriority={cyclePriority}
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

        <p className="mt-6 text-center text-xs text-slate-400">
          ดับเบิลคลิกที่ชื่องานเพื่อแก้ไข · คลิกป้ายความสำคัญเพื่อเปลี่ยนระดับ
        </p>
      </div>
    </div>
  );
}
