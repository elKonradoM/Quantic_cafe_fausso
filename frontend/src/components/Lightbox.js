import React, { useCallback, useEffect, useMemo, useState } from "react";

export default function Lightbox({ images, startIndex = 0, onClose }) {
  const safeImages = useMemo(() => images || [], [images]);
  const [idx, setIdx] = useState(startIndex);

  const length = safeImages.length;

  // Keep index in sync with the requested start index
  useEffect(() => {
    setIdx(startIndex);
  }, [startIndex]);

  // If the images array changes and the current index is now out of range,
  // snap back to 0 to avoid rendering null.
  useEffect(() => {
    if (length === 0) return;
    setIdx((v) => (v >= length ? 0 : v));
  }, [length]);

  const prev = useCallback(() => {
    if (!length) return;
    setIdx((v) => (v - 1 + length) % length);
  }, [length]);

  const next = useCallback(() => {
    if (!length) return;
    setIdx((v) => (v + 1) % length);
  }, [length]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, prev, next]);

  const current = safeImages[idx];
  if (!current) return null;

  const caption = current.caption || current.title || "";

  return (
    <div className="lightbox-backdrop" onClick={() => onClose?.()}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="lightbox-close"
          type="button"
          onClick={() => onClose?.()}
        >
          ✕
        </button>

        {length > 1 && (
          <>
            <button className="lightbox-prev" type="button" onClick={prev}>
              ‹
            </button>
            <button className="lightbox-next" type="button" onClick={next}>
              ›
            </button>
          </>
        )}

        <img
          className="lightbox-image"
          src={current.src}
          alt={current.alt || current.title || "Image"}
        />

        {caption ? <div className="lightbox-caption">{caption}</div> : null}
      </div>
    </div>
  );
}
