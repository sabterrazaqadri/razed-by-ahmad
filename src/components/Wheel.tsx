// SVG gift wheel — geometry ported from razed-ui-source/build.py `wheel()`.
// Segment 0 is centred under the pointer (12 o'clock); segments run clockwise.
// Labels in the lower half are flipped 180° so they stay readable.

const CX = 150;
const CY = 150;
const R = 132;

type Props = {
  labels: string[];
  /** Clockwise rotation in degrees applied to the segment ring. */
  rotation?: number;
  animate?: boolean;
  className?: string;
  title?: string;
};

export function segmentAngle(count: number) {
  return count > 0 ? 360 / count : 360;
}

/**
 * Total clockwise rotation that lands segment `index` under the pointer
 * after `turns` full turns, with a little jitter so it never looks rigged.
 */
export function rotationFor(index: number, count: number, turns = 5, jitter = 0) {
  const step = segmentAngle(count);
  const offset = (360 - ((index * step) % 360)) % 360;
  return turns * 360 + offset + jitter * step * 0.3;
}

export function Wheel({ labels, rotation = 0, animate = false, className = "wheel", title }: Props) {
  const n = labels.length;
  const step = segmentAngle(n);
  const fontSize = n > 10 ? 8 : n > 8 ? 9 : 10;

  return (
    <svg className={className} viewBox="0 0 300 300" role="img" aria-label={title ?? "Gift wheel"}>
      <circle cx={CX} cy={CY} r={142} fill="none" stroke="#C6A15B" strokeOpacity=".28" />
      <g
        className={animate ? "wheel-rotor" : undefined}
        style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "150px 150px" }}
      >
        {n === 1 && (
          <circle cx={CX} cy={CY} r={R} fill="rgba(198,161,91,.14)" stroke="#C6A15B" strokeOpacity=".45" />
        )}
        {n > 1 &&
          labels.map((_, i) => {
            const a0 = ((i * step - 90 - step / 2) * Math.PI) / 180;
            const a1 = (((i + 1) * step - 90 - step / 2) * Math.PI) / 180;
            const x0 = CX + R * Math.cos(a0);
            const y0 = CY + R * Math.sin(a0);
            const x1 = CX + R * Math.cos(a1);
            const y1 = CY + R * Math.sin(a1);
            const large = step > 180 ? 1 : 0;
            return (
              <path
                key={`s${i}`}
                d={`M${CX} ${CY} L${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`}
                fill={i % 2 === 0 ? "rgba(198,161,91,.14)" : "rgba(13,11,16,.9)"}
                stroke="#C6A15B"
                strokeOpacity=".45"
                strokeWidth="1"
              />
            );
          })}
        {labels.map((label, i) => {
          const mid = i * step;
          const flip = mid > 90 && mid < 270;
          return (
            <g key={`l${i}`} transform={`rotate(${flip ? mid + 180 : mid} ${CX} ${CY})`}>
              <text
                x="150"
                y={flip ? 258 : 42}
                textAnchor="middle"
                style={{ fontFamily: "var(--font-sans)" }}
                fontSize={fontSize}
                letterSpacing="1.6"
                fill="#EDE7DC"
                fillOpacity=".92"
              >
                {label.toUpperCase()}
              </text>
            </g>
          );
        })}
      </g>
      <circle cx={CX} cy={CY} r={30} fill="#0D0B10" stroke="#C6A15B" strokeOpacity=".7" />
      <text x="150" y="157" textAnchor="middle" style={{ fontFamily: "var(--font-mark)" }} fontSize="22" fill="#E9D6AC">
        R
      </text>
      <path d="M150 6 L158 26 L142 26 Z" fill="#C6A15B" />
    </svg>
  );
}
