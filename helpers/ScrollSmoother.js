import Lenis from "lenis";
import { useEffect } from "react";

export const ScrollSmoother = ({}) => {
  useEffect(() => {
    const lenis = new Lenis();
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  }, []);
};
