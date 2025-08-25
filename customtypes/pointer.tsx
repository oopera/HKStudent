import { createContext } from "react";
export type Pointer = {
  pointer: boolean;
  text: string;
};
export type GlobalValues = {
  pointer: Pointer;
  setPointer: (arg: Pointer) => void;
};

export const PointerContext = createContext<GlobalValues>({
  pointer: { pointer: false, text: " " },
  setPointer: (e) => {
    e;
  },
});
