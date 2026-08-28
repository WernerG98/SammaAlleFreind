import { useEffect, useRef } from "react";

export default function RichTextEditor({ value, onChange }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exec(command) {
    document.execCommand(command, false, null);
    ref.current?.focus();
    onChange(ref.current.innerHTML);
  }

  function handleInput() {
    onChange(ref.current.innerHTML);
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex gap-1 border-b bg-gray-50 px-2 py-1">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("bold")}
          className="w-7 h-7 rounded hover:bg-gray-200 font-bold text-sm"
          title="Fett"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("italic")}
          className="w-7 h-7 rounded hover:bg-gray-200 italic text-sm"
          title="Kursiv"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("underline")}
          className="w-7 h-7 rounded hover:bg-gray-200 underline text-sm"
          title="Unterstrichen"
        >
          U
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={handleInput}
        className="w-full px-3 py-2 min-h-[120px] focus:outline-none text-sm"
        suppressContentEditableWarning
      />
    </div>
  );
}
