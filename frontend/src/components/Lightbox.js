import React, { useEffect, useMemo, useState } from "react";

export default function Lightbox({ images, startIndex = 0, onClose }) {
  const safeImages = useMemo(() => images || [], [images]);
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    setIdx(startIndex);
  }, [startIndex]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, safeImages.length]);

  const prev = () => {
    if (!safeImages.length) return;
    setIdx((v) => (v - 1 + safeImages.length) % safeImages.length);
  };

  const next = () => {
    if (!safeImages.length) return;
    setIdx((v) => (v + 1) % safeImages.length);
  };

  const current = safeImages[idx];

  if (!current) return null;

  const caption = current.caption || current.title || "";

  return (
    <div className="lightbox-backdrop" onClick={() => onClose?.()}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" type="button" onClick={() => onClose?.()}>
          ✕
        </button>

        {safeImages.length > 1 && (
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
