export default function Honeypot({ value, onChange }) {
  return (
    <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }} aria-hidden="true">
      <label htmlFor="website">Website</label>
      <input
        id="website"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
