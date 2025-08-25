import { useRouter } from "next/router";
import { useContext, useEffect, useLayoutEffect, useState } from "react";

import { TransitionContext } from "../customtypes/transition";
import { UseWindowSize } from "../hooks/UseWindowSize";

export const Transition = () => {
  const router = useRouter();

  const { transition, setTransition } = useContext(TransitionContext);

  const { width, height } = UseWindowSize();

  const [inTransition, setInTransition] = useState(false);

  const isBrowser = () => typeof window !== "undefined";

  useLayoutEffect(() => {
    if (transition.transition) {
      setInTransition(true);
      router.prefetch(transition.uid);
      const timeOut = setTimeout(() => {
        router.push(transition.uid);
        router.events.on("routeChangeComplete", () => {
          if (!isBrowser()) return;
          setInTransition(false);
          setTransition({ transition: false, uid: "/placeholder" });
        });
      }, 1000);

      return () => clearTimeout(timeOut);
    }
  }, [router, setTransition, transition]);

  useEffect(() => {
    if (transition.transition) {
      return;
    } else {
      router.beforePopState(({ as }) => {
        setTransition({ transition: true, uid: as });
        return false;
      });
    }
  }, [router, setTransition, transition.transition]);

  const path = router.asPath.split("?")[0]; // Remove query parameters

  return (
    <div className="fixed z-20 w-screen h-screen p-4 pointer-events-none font-inter">
      {inTransition && (
        <span className="flex items-center justify-center text-white text-2xl font-black w-full h-full bg-zinc-800">
          <p>Transition</p>
        </span>
      )}
    </div>
  );
};
