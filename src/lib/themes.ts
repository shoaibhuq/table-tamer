export interface Theme {
  id: string;
  name: string;
  description: string;
  preview: string;
  category: "elegant" | "festive" | "natural" | "modern";
  colors: {
    background: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
    cardBg: string;
    inputBg: string;
  };
  animations: {
    entrance: string;
    hover: string;
    focus: string;
  };
  decorations?: {
    particles?: boolean;
    orbs?: boolean;
    shapes?: boolean;
    flora?: boolean;
  };
  accessibility: {
    highContrast: boolean;
    reduceMotion: boolean;
    focusRing: string;
  };
}

export const themes: Theme[] = [
  {
    id: "cosmic-purple",
    name: "Cosmic Purple",
    description:
      "A stunning dark theme with purple gradients and cosmic animations",
    preview: "🌌",
    category: "modern",
    colors: {
      background: "from-indigo-900 via-purple-900 to-pink-800",
      primary: "from-purple-600 via-pink-500 to-indigo-600",
      secondary: "from-purple-100 to-pink-100",
      accent: "from-purple-400 to-pink-400",
      text: "text-white",
      textSecondary: "text-purple-100",
      cardBg: "bg-white/90 backdrop-blur-xl",
      inputBg: "bg-white/95",
    },
    animations: {
      entrance: "animate-fade-in",
      hover: "hover:scale-105 hover:-translate-y-1",
      focus: "focus:ring-4 focus:ring-purple-300",
    },
    decorations: {
      particles: true,
      orbs: true,
    },
    accessibility: {
      highContrast: true,
      reduceMotion: false,
      focusRing: "focus:ring-purple-500",
    },
  },
  {
    id: "enchanted-garden",
    name: "Enchanted Garden",
    description:
      "A romantic wedding theme with green flora and floral animations",
    preview: "🌿",
    category: "natural",
    colors: {
      background: "from-emerald-900 via-green-800 to-teal-900",
      primary: "from-emerald-500 via-green-400 to-teal-500",
      secondary: "from-green-100 to-emerald-100",
      accent: "from-emerald-300 to-green-300",
      text: "text-white",
      textSecondary: "text-green-100",
      cardBg: "bg-white/90 backdrop-blur-xl",
      inputBg: "bg-white/95",
    },
    animations: {
      entrance: "animate-fade-in animate-float",
      hover: "hover:scale-105 hover:shadow-emerald-500/25",
      focus: "focus:ring-4 focus:ring-emerald-300",
    },
    decorations: {
      flora: true,
      particles: true,
    },
    accessibility: {
      highContrast: true,
      reduceMotion: false,
      focusRing: "focus:ring-emerald-500",
    },
  },
  {
    id: "golden-elegance",
    name: "Golden Elegance",
    description:
      "A luxurious theme with gold accents and sophisticated animations",
    preview: "✨",
    category: "elegant",
    colors: {
      background: "from-amber-900 via-yellow-900 to-orange-900",
      primary: "from-amber-500 via-yellow-400 to-orange-500",
      secondary: "from-amber-100 to-yellow-100",
      accent: "from-amber-300 to-yellow-300",
      text: "text-white",
      textSecondary: "text-amber-100",
      cardBg: "bg-white/90 backdrop-blur-xl",
      inputBg: "bg-white/95",
    },
    animations: {
      entrance: "animate-fade-in animate-sparkle",
      hover: "hover:scale-105 hover:shadow-amber-500/25",
      focus: "focus:ring-4 focus:ring-amber-300",
    },
    decorations: {
      particles: true,
      shapes: true,
    },
    accessibility: {
      highContrast: true,
      reduceMotion: false,
      focusRing: "focus:ring-amber-500",
    },
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    description: "A refreshing blue theme with wave-like animations",
    preview: "🌊",
    category: "festive",
    colors: {
      background: "from-blue-900 via-cyan-800 to-teal-900",
      primary: "from-blue-500 via-cyan-400 to-teal-500",
      secondary: "from-blue-100 to-cyan-100",
      accent: "from-cyan-300 to-blue-300",
      text: "text-white",
      textSecondary: "text-blue-100",
      cardBg: "bg-white/90 backdrop-blur-xl",
      inputBg: "bg-white/95",
    },
    animations: {
      entrance: "animate-fade-in animate-wave",
      hover: "hover:scale-105 hover:shadow-blue-500/25",
      focus: "focus:ring-4 focus:ring-blue-300",
    },
    decorations: {
      orbs: true,
      shapes: true,
    },
    accessibility: {
      highContrast: true,
      reduceMotion: false,
      focusRing: "focus:ring-blue-500",
    },
  },
  {
    id: "lotus-shapla",
    name: "Lotus Shapla",
    description:
      "A Bengali-Vietnamese wedding theme inspired by the sacred Lotus and pure Shapla flowers",
    preview: "🪷",
    category: "elegant",
    colors: {
      background: "from-rose-900 via-pink-800 to-amber-900",
      primary: "from-pink-500 via-rose-400 to-amber-500",
      secondary: "from-pink-100 to-amber-100",
      accent: "from-rose-300 to-amber-300",
      text: "text-white",
      textSecondary: "text-pink-100",
      cardBg: "bg-white/95 backdrop-blur-xl",
      inputBg: "bg-white/98",
    },
    animations: {
      entrance: "animate-fade-in animate-bloom",
      hover: "hover:scale-105 hover:shadow-pink-500/30",
      focus: "focus:ring-4 focus:ring-pink-300",
    },
    decorations: {
      flora: true,
      particles: true,
      orbs: true,
    },
    accessibility: {
      highContrast: true,
      reduceMotion: false,
      focusRing: "focus:ring-pink-500",
    },
  },
];

export const getThemeById = (id: string): Theme => {
  return themes.find((theme) => theme.id === id) || themes[0];
};

export const getThemeClasses = (theme: Theme) => {
  return {
    backgroundGradient: `bg-gradient-to-br ${theme.colors.background}`,
    primaryGradient: `bg-gradient-to-r ${theme.colors.primary}`,
    secondaryGradient: `bg-gradient-to-r ${theme.colors.secondary}`,
    accentGradient: `bg-gradient-to-r ${theme.colors.accent}`,
    textColor: theme.colors.text,
    textSecondaryColor: theme.colors.textSecondary,
    cardBackground: theme.colors.cardBg,
    inputBackground: theme.colors.inputBg,
    entrance: theme.animations.entrance,
    hover: theme.animations.hover,
    focus: theme.animations.focus,
    focusRing: theme.accessibility.focusRing,
  };
};
