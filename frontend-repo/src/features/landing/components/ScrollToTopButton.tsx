// src/ui/ScrollToTopButton.tsx
import { motion, AnimatePresence } from 'framer-motion';

interface ScrollToTopButtonProps {
  onClick: () => void;
  isVisible: boolean;
}

const ScrollToTopButton = ({ onClick, isVisible }: ScrollToTopButtonProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          onClick={onClick}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-8 right-8 z-50 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="맨 위로 이동"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTopButton;
