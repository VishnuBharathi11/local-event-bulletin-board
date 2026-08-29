export default function EmptyRequestsIllustration() {
  return (
    <div className="community-empty-card__illustration" aria-hidden="true">
      <svg
        width="160"
        height="140"
        viewBox="0 0 160 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft Background Aura */}
        <circle cx="80" cy="70" r="58" fill="#f8f5ff" opacity="0.8" />

        {/* Left Foliage / Branch */}
        <g opacity="0.65" transform="translate(18, 42)">
          <path
            d="M20 48 C16 35, 12 24, 0 16 C6 18, 12 18, 16 14 C18 6, 22 2, 25 0 C24 8, 26 14, 30 18 C36 20, 38 26, 36 32 C32 30, 26 32, 24 38 Z"
            fill="#e4d7fb"
          />
          <ellipse cx="6" cy="18" rx="5" ry="3" transform="rotate(-30 6 18)" fill="#d6c2fa" />
          <ellipse cx="14" cy="30" rx="5" ry="3" transform="rotate(-15 14 30)" fill="#d6c2fa" />
          <ellipse cx="26" cy="12" rx="4" ry="2.5" transform="rotate(20 26 12)" fill="#c4a5f7" />
        </g>

        {/* Right Foliage / Branch */}
        <g opacity="0.65" transform="translate(108, 42)">
          <path
            d="M10 48 C14 35, 18 24, 30 16 C24 18, 18 18, 14 14 C12 6, 8 2, 5 0 C6 8, 4 14, 0 18 C-6 20, -8 26, -6 32 C-2 30, 4 32, 6 38 Z"
            fill="#e4d7fb"
          />
          <ellipse cx="24" cy="18" rx="5" ry="3" transform="rotate(30 24 18)" fill="#d6c2fa" />
          <ellipse cx="16" cy="30" rx="5" ry="3" transform="rotate(15 16 30)" fill="#d6c2fa" />
          <ellipse cx="4" cy="12" rx="4" ry="2.5" transform="rotate(-20 4 12)" fill="#c4a5f7" />
        </g>

        {/* Sparkles / Stars */}
        <path d="M34 26 L36 30 L40 32 L36 34 L34 38 L32 34 L28 32 L32 30 Z" fill="#d8b4fe" opacity="0.8" />
        <circle cx="122" cy="24" r="2.5" fill="#c084fc" opacity="0.7" />
        <path d="M128 38 L129.5 41 L132.5 42.5 L129.5 44 L128 47 L126.5 44 L123.5 42.5 L126.5 41 Z" fill="#c084fc" opacity="0.8" />
        <circle cx="38" cy="74" r="2" fill="#c4b5fd" opacity="0.6" />

        {/* Clipboard Shadow */}
        <rect x="53" y="27" width="54" height="74" rx="10" fill="#ede4fa" />

        {/* Clipboard Main Body */}
        <rect
          x="52"
          y="25"
          width="56"
          height="74"
          rx="9"
          fill="#ffffff"
          stroke="#c4b5fd"
          strokeWidth="3.2"
        />

        {/* Clipboard Top Clip */}
        <path
          d="M66 25 C66 20, 72 17, 80 17 C88 17, 94 20, 94 25 Z"
          fill="#a78bfa"
          stroke="#8b5cf6"
          strokeWidth="2.5"
        />
        <rect x="68" y="22" width="24" height="7" rx="3.5" fill="#c4b5fd" />
        <circle cx="80" cy="20" r="2" fill="#ffffff" />

        {/* Checklist Item 1 */}
        <circle cx="63" cy="43" r="3.2" fill="#c4b5fd" />
        <rect x="71" y="41.5" width="25" height="3.5" rx="1.75" fill="#ede9fe" />

        {/* Checklist Item 2 */}
        <circle cx="63" cy="57" r="3.2" fill="#c4b5fd" />
        <rect x="71" y="55.5" width="22" height="3.5" rx="1.75" fill="#ede9fe" />

        {/* Checklist Item 3 */}
        <circle cx="63" cy="71" r="3.2" fill="#c4b5fd" />
        <rect x="71" y="69.5" width="16" height="3.5" rx="1.75" fill="#ede9fe" />

        {/* Magnifying Glass Glass/Rim Shadow */}
        <circle cx="99" cy="85" r="19" fill="#f5f0ff" />

        {/* Magnifying Glass Rim */}
        <circle
          cx="99"
          cy="85"
          r="18"
          fill="#fbf9ff"
          stroke="#a78bfa"
          strokeWidth="3.6"
        />

        {/* Magnifying Glass Question Mark */}
        <text
          x="99"
          y="92"
          textAnchor="middle"
          fill="#7c3aed"
          fontSize="21"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, 'Plus Jakarta Sans', sans-serif"
        >
          ?
        </text>

        {/* Magnifying Glass Handle */}
        <line
          x1="112"
          y1="98"
          x2="128"
          y2="114"
          stroke="#a78bfa"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <line
          x1="114"
          y1="100"
          x2="126"
          y2="112"
          stroke="#7c3aed"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
