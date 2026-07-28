/**
 * Authoritative Shared Tailwind CSS Theme Configuration (§19.3)
 * Guarantees visual coherence, vibrant status colors, and sleek obsidian dark mode across dashboards.
 */
const config = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        background: '#090D16',
        surface: '#111726',
        surfaceHover: '#182136',
        border: 'rgba(255, 255, 255, 0.1)',
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          glow: 'rgba(99, 102, 241, 0.35)',
        },
        accent: {
          cyan: '#06B6D4',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
          purple: '#A855F7',
        },
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
        'glow-purple': 'radial-gradient(circle at top right, rgba(168, 85, 247, 0.15), transparent 60%)',
        'glow-cyan': 'radial-gradient(circle at bottom left, rgba(6, 182, 212, 0.15), transparent 60%)',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 20px -5px rgba(99, 102, 241, 0.5)',
      },
    },
  },
};

export default config;
