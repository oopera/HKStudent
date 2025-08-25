import { createContext } from "react";
export type Transition = {
  transition: boolean;
  uid: string;
};
export type GlobalValues = {
  transition: Transition;
  setTransition: (arg: Transition) => void;
};

export const TransitionContext = createContext<GlobalValues>({
  transition: { transition: false, uid: "/placeholder" },
  setTransition: (e) => {
    e;
  },
});
