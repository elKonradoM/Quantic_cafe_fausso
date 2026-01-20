import React, { useMemo, useState } from "react";
import Lightbox from "../components/Lightbox";
import { galleryImages, AWARDS, REVIEWS } from "../data/gallery";

export default function Gallery() {
  const [selected, setSelected] = useState(null);

  // jeżeli Lightbox oczekuje tablicy - dajemy mu galleryImages
  const images = useMemo(() => galleryImages, []);

  return (
    <main className="page">
      <section className="container">
        <h1>Gallery</h1>

        <div className="gallery-grid">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              className="gallery-card"
              type="button"
              onClick={() => setSelected(idx)}
              aria-label={img.title ? `Open image: ${img.title}` : "Open image"}
            >
              <img
                className="gallery-thumb"
                src={img.src}
                alt={img.alt || img.title || "Gallery image"}
                loading="lazy"
              />

              <div className="gallery-meta">
                <div className="gallery-title">{img.title}</div>
                {img.caption ? (
                  <div className="gallery-caption">{img.caption}</div>
                ) : null}
              </div>
            </button>
          ))}
        </div>

        {selected !== null && (
          <Lightbox
            images={images}
            startIndex={selected}
            onClose={() => setSelected(null)}
          />
        )}

        {/* AWARDS */}
        {Array.isArray(AWARDS) && AWARDS.length > 0 && (
          <section className="awards">
            <h2>AWARDS</h2>
            <ul className="awards-list">
              {AWARDS.map((a, i) => (
                <li key={`${a}-${i}`}>{a}</li>
              ))}
            </ul>
          </section>
        )}

        {/* REVIEWS */}
        {Array.isArray(REVIEWS) && REVIEWS.length > 0 && (
          <section className="reviews">
            <h2>REVIEWS</h2>
            <div className="reviews-grid">
              {REVIEWS.map((r, i) => (
                <article key={`${r.who}-${i}`} className="review-card">
                  <p className="review-text">“{r.text}”</p>
                  <p className="review-who">— {r.who}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
