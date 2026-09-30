// The three bottle illustrations, lifted from razed-ui-source/home.html.
// Rendered once in the root layout; <BottleArt> references the symbols by id.
// Kept as a zero-size (not display:none) SVG so gradients resolve everywhere.

export function SvgSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#C6A15B" stopOpacity=".20" />
          <stop offset=".45" stopColor="#C6A15B" stopOpacity=".05" />
          <stop offset="1" stopColor="#C6A15B" stopOpacity=".13" />
        </linearGradient>
        <linearGradient id="juice" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9D6AC" stopOpacity=".55" />
          <stop offset=".35" stopColor="#B9873A" stopOpacity=".55" />
          <stop offset="1" stopColor="#3A2409" stopOpacity=".75" />
        </linearGradient>
        <linearGradient id="capg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8A6F3C" />
          <stop offset=".28" stopColor="#E9D6AC" />
          <stop offset=".62" stopColor="#C6A15B" />
          <stop offset="1" stopColor="#6E5628" />
        </linearGradient>
        <clipPath id="clipA"><rect x="38" y="94" width="124" height="216" rx="10" /></clipPath>
        <clipPath id="clipB"><rect x="34" y="104" width="132" height="200" rx="62" /></clipPath>
        <clipPath id="clipC"><path d="M100 78 L164 128 L150 302 L50 302 L36 128 Z" /></clipPath>
      </defs>

      {/* A · tall flacon, cube cap */}
      <symbol id="bottle-a" viewBox="0 0 200 330">
        <rect x="76" y="14" width="48" height="48" fill="url(#capg)" />
        <rect x="76" y="14" width="48" height="48" fill="none" stroke="#E9D6AC" strokeOpacity=".45" />
        <rect x="86" y="62" width="28" height="11" fill="#8A6F3C" />
        <rect x="88" y="73" width="24" height="23" fill="url(#glass)" stroke="#C6A15B" strokeOpacity=".5" />
        <g clipPath="url(#clipA)">
          <rect x="38" y="94" width="124" height="216" fill="url(#glass)" />
          <rect x="38" y="178" width="124" height="132" fill="url(#juice)" />
          <rect x="52" y="94" width="10" height="216" fill="#E9D6AC" fillOpacity=".10" />
        </g>
        <rect x="38" y="94" width="124" height="216" rx="10" fill="none" stroke="#C6A15B" strokeOpacity=".62" />
        <rect x="64" y="196" width="72" height="70" fill="none" stroke="#E9D6AC" strokeOpacity=".38" />
        <text x="100" y="230" textAnchor="middle" style={{ fontFamily: "var(--font-mark)" }} fontSize="26" fill="#E9D6AC" fillOpacity=".85">R</text>
        <rect x="80" y="240" width="40" height="1" fill="#E9D6AC" fillOpacity=".35" />
        <text x="100" y="256" textAnchor="middle" style={{ fontFamily: "var(--font-sans)" }} fontSize="7" letterSpacing="2.6" fill="#E9D6AC" fillOpacity=".6">EXTRAIT</text>
      </symbol>

      {/* B · squat flacon, long slim cap */}
      <symbol id="bottle-b" viewBox="0 0 200 330">
        <rect x="88" y="8" width="24" height="78" fill="url(#capg)" />
        <rect x="88" y="8" width="24" height="78" fill="none" stroke="#E9D6AC" strokeOpacity=".4" />
        <rect x="84" y="86" width="32" height="9" fill="#8A6F3C" />
        <rect x="90" y="95" width="20" height="14" fill="url(#glass)" stroke="#C6A15B" strokeOpacity=".5" />
        <g clipPath="url(#clipB)">
          <rect x="34" y="104" width="132" height="200" fill="url(#glass)" />
          <rect x="34" y="192" width="132" height="112" fill="url(#juice)" />
          <ellipse cx="66" cy="160" rx="13" ry="34" fill="#E9D6AC" fillOpacity=".10" />
        </g>
        <rect x="34" y="104" width="132" height="200" rx="62" fill="none" stroke="#C6A15B" strokeOpacity=".62" />
        <circle cx="100" cy="222" r="36" fill="none" stroke="#E9D6AC" strokeOpacity=".34" />
        <text x="100" y="231" textAnchor="middle" style={{ fontFamily: "var(--font-mark)" }} fontSize="25" fill="#E9D6AC" fillOpacity=".85">R</text>
      </symbol>

      {/* C · faceted decanter, dome cap */}
      <symbol id="bottle-c" viewBox="0 0 200 330">
        <path d="M82 56 L82 32 Q100 10 118 32 L118 56 Z" fill="url(#capg)" />
        <path d="M82 56 L82 32 Q100 10 118 32 L118 56 Z" fill="none" stroke="#E9D6AC" strokeOpacity=".4" />
        <rect x="88" y="56" width="24" height="24" fill="url(#glass)" stroke="#C6A15B" strokeOpacity=".5" />
        <g clipPath="url(#clipC)">
          <path d="M100 78 L164 128 L150 302 L50 302 L36 128 Z" fill="url(#glass)" />
          <rect x="30" y="190" width="146" height="120" fill="url(#juice)" />
          <path d="M100 78 L110 302 L90 302 Z" fill="#E9D6AC" fillOpacity=".07" />
        </g>
        <path d="M100 78 L164 128 L150 302 L50 302 L36 128 Z" fill="none" stroke="#C6A15B" strokeOpacity=".62" />
        <path d="M36 128 L164 128" stroke="#C6A15B" strokeOpacity=".3" />
        <text x="100" y="246" textAnchor="middle" style={{ fontFamily: "var(--font-mark)" }} fontSize="24" fill="#E9D6AC" fillOpacity=".85">R</text>
        <rect x="80" y="256" width="40" height="1" fill="#E9D6AC" fillOpacity=".3" />
      </symbol>
    </svg>
  );
}
