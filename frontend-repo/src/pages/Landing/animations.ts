// src/pages/Landing/animations.ts
export const fadeInUp = {
  initial: { y: 60, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.6 } },
};

export const stagger = {
  animate: { transition: { staggerChildren: 0.2 } },
};
