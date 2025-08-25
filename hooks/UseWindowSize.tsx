import { useEffect, useState } from "react";

export const UseWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: 200,
    height: 200,
  });

  useEffect(() => {
    window.addEventListener("resize", () => {
      handleResize();
    });
    handleResize();
  }, []);
  function handleResize() {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }

  return windowSize;
};
