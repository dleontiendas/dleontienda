import { useState } from "react";

export default function FilterAccordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="filter-accordion">
      <button
        type="button"
        className="filter-header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className={`chevron ${open ? "open" : ""}`}>⌄</span>
      </button>

      {open && <div className="filter-body">{children}</div>}
    </div>
  );
}