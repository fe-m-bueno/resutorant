'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { AnimatePresence, motion } from 'framer-motion';

export function LoadingBar() {
  const pathname = usePathname();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const isLoading = isFetching > 0 || isMutating > 0;

  // Handle route change "flash"
  useEffect(() => {
    setIsVisible(true);
    setProgress(30);

    const timer = setTimeout(() => {
      setProgress(100);
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 500);
      return () => clearTimeout(hideTimer);
    }, 200);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Handle global loading state (fetching/mutating)
  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
      setProgress((prev) => Math.min(prev + 10, 90));

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + (90 - prev) * 0.1;
        });
      }, 500);

      return () => clearInterval(interval);
    } else if (!isLoading && progress < 100 && isVisible) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isVisible]);

  return (
    <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] overflow-hidden pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Progress
              value={progress}
              className="h-full w-full rounded-none bg-transparent"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
