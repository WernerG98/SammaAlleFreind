import { useEffect, useRef, useState } from "react";

const EMOJIS = [
  "🎉", "🎊", "🥳", "🎈", "🎁", "🍻", "🍺", "🍷",
  "🥂", "🍹", "🍕", "🍔", "🍟", "🎶", "🎵", "🎤",
  "💃", "🕺", "🔥", "✨", "⭐", "🌟", "💥", "❤️",
  "💙", "💚", "🧡", "😀", "😁", "😂", "🤣", "😍",
  "😎", "🤩", "😉", "🙌", "👏", "👍", "🙏", "💪",
  "👋", "🚌", "🚗", "🚐", "🕐", "📅", "📍", "🎿",
  "⛷️", "🏂", "❄️", "⛄", "🎃", "👻", "🦇", "🎄",
  "☀️", "🌙", "🏖️", "🚴", "⚽", "🎯", "📢", "✅",
];

export function isEmptyHtml(html) {
  return !html || html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "";
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const toolbarButton = "w-7 h-7 rounded hover:bg-gray-700 text-gray-200 text-sm";

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 120 }) {
  const ref = useRef(null);
  const pickerRef = useRef(null);
  const savedRange = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pickerOpen) return undefined;
    function onPointerDown(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setPickerOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pickerOpen]);

  function saveSelection() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && ref.current?.contains(selection.anchorNode)) {
      savedRange.current = selection.getRangeAt(0).cloneRange();
    }
  }

  function exec(command) {
    document.execCommand(command, false, null);
    ref.current?.focus();
    onChange(ref.current.innerHTML);
  }

  function insertEmoji(emoji) {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const selection = window.getSelection();
    selection.removeAllRanges();
    if (savedRange.current) {
      selection.addRange(savedRange.current);
    } else {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      selection.addRange(range);
    }
    document.execCommand("insertText", false, emoji);
    saveSelection();
    onChange(el.innerHTML);
    setPickerOpen(false);
  }

  function handleInput() {
    saveSelection();
    onChange(ref.current.innerHTML);
  }

  // Eingefügtes Formatierungs-Chaos (Farben, Schriften) würde in Mails und auf der Seite
  // seltsam aussehen, daher immer nur den reinen Text übernehmen.
  function handlePaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertHTML", false, escapeHtml(text).replace(/\r?\n/g, "<br>"));
    handleInput();
  }

  return (
    <div className="border border-gray-700 rounded-lg">
      <div className="relative flex items-center gap-1 border-b border-gray-700 bg-gray-800 px-2 py-1 rounded-t-lg">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("bold")}
          className={`${toolbarButton} font-bold`}
          title="Fett"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("italic")}
          className={`${toolbarButton} italic`}
          title="Kursiv"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("underline")}
          className={`${toolbarButton} underline`}
          title="Unterstrichen"
        >
          U
        </button>

        <div ref={pickerRef} className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              saveSelection();
              setPickerOpen((open) => !open);
            }}
            aria-expanded={pickerOpen}
            className={`${toolbarButton} ${pickerOpen ? "bg-gray-700" : ""}`}
            title="Emoji einfügen"
          >
            😊
          </button>
          {pickerOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 grid w-64 max-w-[calc(100vw-3rem)] grid-cols-8 gap-0.5 rounded-lg border border-gray-700 bg-gray-800 p-2 shadow-xl">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertEmoji(emoji)}
                  className="h-8 w-8 rounded text-xl leading-none hover:bg-gray-700"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onBlur={saveSelection}
        data-placeholder={placeholder || ""}
        style={{ minHeight }}
        className="w-full px-3 py-2 bg-gray-800 text-gray-100 focus:outline-none text-sm rounded-b-lg empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
        suppressContentEditableWarning
      />
    </div>
  );
}
