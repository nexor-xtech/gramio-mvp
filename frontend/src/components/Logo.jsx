const Logo = ({ size = 32 }) => {
  const s = size;
  const c = s / 2;
  const r = s * 0.38;

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background rounded square */}
      <rect width="100" height="100" rx="24" fill="#0a0a0a" />

      {/* Outer gold border */}
      <rect
        x="3" y="3"
        width="94" height="94"
        rx="22"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="2"
      />

      {/* Crown points at top */}
      <polygon
        points="50,14 42,26 34,18 36,32 64,32 66,18 58,26"
        fill="#D4AF37"
      />

      {/* Outer lens ring */}
      <circle
        cx="50" cy="58"
        r="26"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="3"
      />

      {/* Middle lens ring */}
      <circle
        cx="50" cy="58"
        r="18"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />

      {/* Inner lens fill */}
      <circle
        cx="50" cy="58"
        r="10"
        fill="#D4AF37"
      />

      {/* Center dark dot */}
      <circle
        cx="50" cy="58"
        r="4"
        fill="#0a0a0a"
      />

      {/* Lens glare */}
      <circle
        cx="44" cy="52"
        r="2.5"
        fill="rgba(255,255,255,0.4)"
      />

      {/* Side decorative lines */}
      <line x1="16" y1="58" x2="20" y2="58" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
      <line x1="80" y1="58" x2="84" y2="58" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="86" x2="50" y2="90" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />

      {/* Corner accent dots */}
      <circle cx="18" cy="18" r="2" fill="#D4AF37" opacity="0.5" />
      <circle cx="82" cy="18" r="2" fill="#D4AF37" opacity="0.5" />
    </svg>
  );
};

export default Logo;