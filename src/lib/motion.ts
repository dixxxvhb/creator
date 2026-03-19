import type { Variants, Transition } from 'framer-motion';

// ─── Shared spring configs ───
export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
};

export const springGentle: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
};

// ─── Page transition ───
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export const pageTransition: Transition = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1], // cubic-bezier for iOS feel
};

// ─── Staggered container ───
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// ─── Staggered child (fade up) ───
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// ─── Card hover / tap ───
export const cardHover = {
  whileHover: { y: -2, transition: { duration: 0.15 } },
  whileTap: { scale: 0.98, transition: springSnappy },
};

// ─── Button tap ───
export const buttonTap = {
  whileTap: { scale: 0.96, transition: springSnappy },
};

// ─── Modal / overlay ───
export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 5,
    transition: { duration: 0.15 },
  },
};

// Mobile sheet (slides up from bottom)
export const sheetVariants: Variants = {
  initial: { y: '100%' },
  animate: {
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 35 },
  },
  exit: {
    y: '100%',
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};
