"use client";

import Image from "next/image";
import { useState } from "react";
import { BottleArt } from "@/components/BottleArt";

export function ProductGallery({ images, name, bottleVariant }: { images: string[]; name: string; bottleVariant: string }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="pdp-stage">
        <BottleArt variant={bottleVariant} label={`${name} bottle`} />
      </div>
    );
  }

  return (
    <div>
      <div className="pdp-stage">
        <Image
          src={images[active]}
          alt={`${name} — image ${active + 1} of ${images.length}`}
          fill
          priority={active === 0}
          sizes="(max-width: 820px) 100vw, 52vw"
        />
      </div>
      {images.length > 1 && (
        <div className="pdp-thumbs" role="group" aria-label="Product images">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-pressed={i === active}
              aria-label={`Show image ${i + 1}`}
              onClick={() => setActive(i)}
            >
              <Image src={src} alt="" fill sizes="66px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
