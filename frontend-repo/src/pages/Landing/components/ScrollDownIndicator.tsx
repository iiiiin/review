// src/pages/Landing/components/ScrollDownIndicator.tsx
import { motion } from 'framer-motion';

const ScrollDownIndicator = () => (
  <button
    aria-label="다음 섹션으로 스크롤"
    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 p-2"
    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
  >
    <motion.div
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg className="w-8 h-8 text-white opacity-70 hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </motion.div>
  </button>
);

export default ScrollDownIndicator;
