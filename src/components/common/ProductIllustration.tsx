import React from 'react';

interface ProductIllustrationProps {
  type: 'audio' | 'watch' | 'lamp' | 'speaker' | 'keyboard' | 'hub' | 'desk' | 'camera';
  className?: string;
  colorTheme?: string;
}

export const ProductIllustration: React.FC<ProductIllustrationProps> = ({
  type,
  className = 'w-full h-full',
  colorTheme,
}) => {
  switch (type) {
    case 'audio':
      return (
        <div className={`relative flex items-center justify-center bg-gradient-to-b from-zinc-100 to-zinc-200 overflow-hidden ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
          <svg viewBox="0 0 240 240" className="w-4/5 h-4/5 drop-shadow-2xl transition-transform duration-500 hover:scale-105" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="headband" x1="40" y1="40" x2="200" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#27272a" />
                <stop offset="0.5" stopColor="#52525b" />
                <stop offset="1" stopColor="#27272a" />
              </linearGradient>
              <linearGradient id="earcupLeft" x1="40" y1="110" x2="80" y2="190" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3f3f46" />
                <stop offset="1" stopColor="#18181b" />
              </linearGradient>
              <linearGradient id="earcupRight" x1="160" y1="110" x2="200" y2="190" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3f3f46" />
                <stop offset="1" stopColor="#18181b" />
              </linearGradient>
              <radialGradient id="cushionGlow" cx="60" cy="150" r="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#71717a" />
                <stop offset="1" stopColor="#27272a" />
              </radialGradient>
            </defs>
            {/* Top Headband curve */}
            <path d="M55 125 C 55 45, 185 45, 185 125" stroke="url(#headband)" strokeWidth="14" strokeLinecap="round" />
            <path d="M68 95 C 68 55, 172 55, 172 95" stroke="#71717a" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            {/* Left Hinge */}
            <rect x="50" y="115" width="10" height="24" rx="3" fill="#a1a1aa" />
            {/* Right Hinge */}
            <rect x="180" y="115" width="10" height="24" rx="3" fill="#a1a1aa" />
            {/* Left Ear Cushion */}
            <ellipse cx="55" cy="150" rx="22" ry="34" fill="url(#cushionGlow)" />
            <ellipse cx="55" cy="150" rx="15" ry="24" fill="#09090b" opacity="0.8" />
            {/* Left Outer Cup */}
            <ellipse cx="48" cy="150" rx="14" ry="28" fill="url(#earcupLeft)" />
            {/* Right Ear Cushion */}
            <ellipse cx="185" cy="150" rx="22" ry="34" fill="url(#cushionGlow)" />
            <ellipse cx="185" cy="150" rx="15" ry="24" fill="#09090b" opacity="0.8" />
            {/* Right Outer Cup */}
            <ellipse cx="192" cy="150" rx="14" ry="28" fill="url(#earcupRight)" />
            {/* Accent Ring */}
            <circle cx="192" cy="150" r="6" stroke="#fbbf24" strokeWidth="1.5" fill="none" opacity="0.8" />
          </svg>
        </div>
      );

    case 'watch':
      return (
        <div className={`relative flex items-center justify-center bg-gradient-to-b from-stone-100 to-stone-200 overflow-hidden ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
          <svg viewBox="0 0 240 240" className="w-4/5 h-4/5 drop-shadow-2xl transition-transform duration-500 hover:scale-105" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="watchStrap" x1="120" y1="20" x2="120" y2="220" gradientUnits="userSpaceOnUse">
                <stop stopColor="#334155" />
                <stop offset="0.5" stopColor="#1e293b" />
                <stop offset="1" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="watchCase" x1="80" y1="80" x2="160" y2="160" gradientUnits="userSpaceOnUse">
                <stop stopColor="#94a3b8" />
                <stop offset="0.5" stopColor="#475569" />
                <stop offset="1" stopColor="#1e293b" />
              </linearGradient>
            </defs>
            {/* Top Strap */}
            <path d="M96 20 L144 20 L140 85 L100 85 Z" fill="url(#watchStrap)" />
            {/* Bottom Strap */}
            <path d="M100 155 L140 155 L144 220 L96 220 Z" fill="url(#watchStrap)" />
            {/* Watch Case */}
            <rect x="75" y="75" width="90" height="90" rx="26" fill="url(#watchCase)" />
            <rect x="77" y="77" width="86" height="86" rx="24" stroke="#e2e8f0" strokeWidth="1.5" fill="none" opacity="0.4" />
            {/* Digital Crown */}
            <rect x="165" y="98" width="6" height="18" rx="2" fill="#94a3b8" />
            <rect x="165" y="125" width="4" height="12" rx="1.5" fill="#64748b" />
            {/* AMOLED Screen */}
            <rect x="83" y="83" width="74" height="74" rx="20" fill="#020617" />
            {/* Watch Face UI */}
            <circle cx="120" cy="120" r="28" stroke="#38bdf8" strokeWidth="2" strokeDasharray="140 40" fill="none" />
            <circle cx="120" cy="120" r="23" stroke="#f43f5e" strokeWidth="2" strokeDasharray="90 80" fill="none" />
            <text x="120" y="118" fill="#f8fafc" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">10:42</text>
            <text x="120" y="132" fill="#94a3b8" fontSize="8" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">7.420 BƯỚC</text>
          </svg>
        </div>
      );

    case 'lamp':
      return (
        <div className={`relative flex items-center justify-center bg-gradient-to-b from-amber-50/50 to-orange-100/40 overflow-hidden ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
          <svg viewBox="0 0 240 240" className="w-4/5 h-4/5 drop-shadow-xl transition-transform duration-500 hover:scale-105" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="lampGlow" cx="120" cy="90" r="65" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fef08a" stopOpacity="0.8" />
                <stop offset="0.6" stopColor="#fef08a" stopOpacity="0.2" />
                <stop offset="1" stopColor="#fef08a" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="metalStand" x1="110" y1="80" x2="130" y2="210" gradientUnits="userSpaceOnUse">
                <stop stopColor="#d4d4d8" />
                <stop offset="0.5" stopColor="#71717a" />
                <stop offset="1" stopColor="#27272a" />
              </linearGradient>
            </defs>
            {/* Ambient Halo */}
            <circle cx="120" cy="85" r="55" fill="url(#lampGlow)" />
            {/* Lamp Shade Dome */}
            <path d="M75 100 C 75 55, 165 55, 165 100 Z" fill="#27272a" />
            <ellipse cx="120" cy="100" rx="45" ry="8" fill="#fef08a" opacity="0.9" />
            {/* Slim Brass Neck */}
            <rect x="117" y="100" width="6" height="95" rx="3" fill="url(#metalStand)" />
            {/* Base Pedestal */}
            <ellipse cx="120" cy="195" rx="42" ry="12" fill="#27272a" />
            <ellipse cx="120" cy="192" rx="40" ry="10" fill="#3f3f46" />
            {/* Brass touch dimmer button */}
            <circle cx="120" cy="192" r="4" fill="#fbbf24" />
          </svg>
        </div>
      );

    case 'speaker':
      return (
        <div className={`relative flex items-center justify-center bg-gradient-to-b from-zinc-100 to-zinc-200 overflow-hidden ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
          <svg viewBox="0 0 240 240" className="w-4/5 h-4/5 drop-shadow-2xl transition-transform duration-500 hover:scale-105" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="speakerCylinder" x1="70" y1="50" x2="170" y2="190" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3f3f46" />
                <stop offset="0.7" stopColor="#18181b" />
                <stop offset="1" stopColor="#09090b" />
              </linearGradient>
            </defs>
            {/* Speaker body */}
            <rect x="75" y="45" width="90" height="145" rx="45" fill="url(#speakerCylinder)" />
            {/* Acoustic Grille lines */}
            <line x1="88" y1="85" x2="152" y2="85" stroke="#71717a" strokeWidth="1.5" strokeDasharray="2 3" />
            <line x1="85" y1="100" x2="155" y2="100" stroke="#71717a" strokeWidth="1.5" strokeDasharray="2 3" />
            <line x1="84" y1="115" x2="156" y2="115" stroke="#71717a" strokeWidth="1.5" strokeDasharray="2 3" />
            <line x1="85" y1="130" x2="155" y2="130" stroke="#71717a" strokeWidth="1.5" strokeDasharray="2 3" />
            <line x1="88" y1="145" x2="152" y2="145" stroke="#71717a" strokeWidth="1.5" strokeDasharray="2 3" />
            {/* Top Cap */}
            <ellipse cx="120" cy="50" rx="36" ry="12" fill="#52525b" />
            <ellipse cx="120" cy="48" rx="32" ry="10" fill="#27272a" />
            {/* Status LED ring */}
            <ellipse cx="120" cy="48" rx="20" ry="6" stroke="#38bdf8" strokeWidth="2" fill="none" opacity="0.9" />
          </svg>
        </div>
      );

    case 'keyboard':
      return (
        <div className={`relative flex items-center justify-center bg-gradient-to-b from-stone-100 to-zinc-200 overflow-hidden ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
          <svg viewBox="0 0 240 240" className="w-4/5 h-4/5 drop-shadow-xl transition-transform duration-500 hover:scale-105" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Aluminum Case */}
            <rect x="35" y="70" width="170" height="100" rx="14" fill="#27272a" />
            <rect x="37" y="72" width="166" height="96" rx="12" stroke="#52525b" strokeWidth="1.5" fill="none" opacity="0.6" />
            {/* Keycap Rows */}
            <g fill="#e4e4e7">
              <rect x="45" y="80" width="14" height="12" rx="3" />
              <rect x="63" y="80" width="14" height="12" rx="3" />
              <rect x="81" y="80" width="14" height="12" rx="3" />
              <rect x="99" y="80" width="14" height="12" rx="3" />
              <rect x="117" y="80" width="14" height="12" rx="3" />
              <rect x="135" y="80" width="14" height="12" rx="3" />
              <rect x="153" y="80" width="14" height="12" rx="3" />
              <rect x="171" y="80" width="24" height="12" rx="3" fill="#ea580c" />

              <rect x="45" y="96" width="18" height="12" rx="3" />
              <rect x="67" y="96" width="14" height="12" rx="3" />
              <rect x="85" y="96" width="14" height="12" rx="3" />
              <rect x="103" y="96" width="14" height="12" rx="3" />
              <rect x="121" y="96" width="14" height="12" rx="3" />
              <rect x="139" y="96" width="14" height="12" rx="3" />
              <rect x="157" y="96" width="14" height="12" rx="3" />
              <rect x="175" y="96" width="20" height="12" rx="3" />

              <rect x="45" y="112" width="22" height="12" rx="3" />
              <rect x="71" y="112" width="14" height="12" rx="3" />
              <rect x="89" y="112" width="14" height="12" rx="3" />
              <rect x="107" y="112" width="14" height="12" rx="3" />
              <rect x="125" y="112" width="14" height="12" rx="3" />
              <rect x="143" y="112" width="14" height="12" rx="3" />
              <rect x="161" y="112" width="34" height="12" rx="3" fill="#0284c7" />

              <rect x="45" y="128" width="28" height="12" rx="3" />
              <rect x="77" y="128" width="14" height="12" rx="3" />
              <rect x="95" y="128" width="14" height="12" rx="3" />
              <rect x="113" y="128" width="14" height="12" rx="3" />
              <rect x="131" y="128" width="14" height="12" rx="3" />
              <rect x="149" y="128" width="46" height="12" rx="3" />

              {/* Spacebar row */}
              <rect x="45" y="144" width="20" height="14" rx="3" />
              <rect x="70" y="144" width="18" height="14" rx="3" />
              <rect x="93" y="144" width="68" height="14" rx="4" fill="#f43f5e" />
              <rect x="166" y="144" width="14" height="14" rx="3" />
              <rect x="184" y="144" width="14" height="14" rx="3" />
            </g>
          </svg>
        </div>
      );

    case 'hub':
      return (
        <div className={`relative flex items-center justify-center bg-gradient-to-b from-slate-100 to-zinc-200 overflow-hidden ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
          <svg viewBox="0 0 240 240" className="w-4/5 h-4/5 drop-shadow-xl transition-transform duration-500 hover:scale-105" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Aluminum Dock */}
            <rect x="50" y="85" width="140" height="70" rx="16" fill="#475569" />
            <rect x="52" y="87" width="136" height="66" rx="14" stroke="#94a3b8" strokeWidth="1.5" fill="none" opacity="0.6" />
            {/* Ports */}
            <rect x="68" y="112" width="22" height="16" rx="3" fill="#0f172a" />
            <rect x="71" y="117" width="16" height="6" rx="1" fill="#3b82f6" />
            <rect x="98" y="112" width="22" height="16" rx="3" fill="#0f172a" />
            <rect x="101" y="117" width="16" height="6" rx="1" fill="#3b82f6" />
            {/* USB-C PD */}
            <rect x="130" y="116" width="14" height="8" rx="4" fill="#0f172a" />
            <circle cx="160" cy="120" r="3" fill="#22c55e" />
            {/* Braided cable */}
            <path d="M50 120 C 30 120, 20 80, 20 40" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'desk':
      return (
        <div className={`relative flex items-center justify-center bg-gradient-to-b from-stone-100 to-amber-100/50 overflow-hidden ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(#d6d3d1_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
          <svg viewBox="0 0 240 240" className="w-4/5 h-4/5 drop-shadow-xl transition-transform duration-500 hover:scale-105" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Solid Walnut Tabletop */}
            <rect x="40" y="90" width="160" height="16" rx="4" fill="#78350f" />
            <rect x="40" y="90" width="160" height="4" fill="#92400e" opacity="0.7" />
            {/* Matte Steel Legs */}
            <rect x="58" y="106" width="10" height="80" rx="2" fill="#18181b" />
            <rect x="172" y="106" width="10" height="80" rx="2" fill="#18181b" />
            <rect x="52" y="186" width="22" height="6" rx="2" fill="#27272a" />
            <rect x="166" y="186" width="22" height="6" rx="2" fill="#27272a" />
            {/* Integrated LED touch bar under table */}
            <rect x="80" y="106" width="80" height="3" fill="#fde047" opacity="0.8" />
          </svg>
        </div>
      );

    case 'camera':
    default:
      return (
        <div className={`relative flex items-center justify-center bg-gradient-to-b from-zinc-100 to-zinc-200 overflow-hidden ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
          <svg viewBox="0 0 240 240" className="w-4/5 h-4/5 drop-shadow-2xl transition-transform duration-500 hover:scale-105" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="50" y="80" width="140" height="95" rx="18" fill="#27272a" />
            {/* Viewfinder bump */}
            <rect x="85" y="65" width="45" height="18" rx="6" fill="#18181b" />
            {/* Grip texture */}
            <rect x="155" y="88" width="28" height="78" rx="8" fill="#18181b" />
            {/* Big Prime Lens */}
            <circle cx="108" cy="128" r="38" fill="#18181b" stroke="#71717a" strokeWidth="3" />
            <circle cx="108" cy="128" r="28" fill="#09090b" />
            <circle cx="108" cy="128" r="20" fill="#0f172a" stroke="#0284c7" strokeWidth="2" opacity="0.8" />
            {/* Lens Reflection */}
            <ellipse cx="100" cy="120" rx="8" ry="12" fill="#38bdf8" opacity="0.3" transform="rotate(-30 100 120)" />
            {/* Shutter button */}
            <circle cx="170" cy="74" r="6" fill="#f43f5e" />
          </svg>
        </div>
      );
  }
};
