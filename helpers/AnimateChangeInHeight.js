import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export const AnimateChangeInHeight = ({
  children,
  className,
  secondClassName,
}) => {
  const containerRef = useRef(null);
  const [height, setHeight] = useState("auto");

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const observedHeight = entries[0].contentRect.height;
      setHeight(observedHeight);
    });

    const currentRef = containerRef.current;
    if (currentRef) {
      resizeObserver.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        resizeObserver.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <motion.div
      className={`${className || ""}`}
      style={{ height }}
      animate={{ height }}
      transition={{ duration: 0.5, ease: "circInOut" }}>
      <div className={`${secondClassName || ""}`} ref={containerRef}>
        {children}
      </div>
    </motion.div>
  );
};
