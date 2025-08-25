import { motion } from "motion/react";
import { Inter_Tight } from "next/font/google";
import Head from "next/head";
import { useRouter } from "next/router";
import { useLayoutEffect, useState } from "react";
import { PointerContext } from "../customtypes/pointer";
import { ThemeContext } from "../customtypes/theme";
import { TransitionContext } from "../customtypes/transition";
import "./globals.css";

const inter = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter",
  preload: true,
  weight: "500",
});

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [transition, setTransition] = useState({
    transition: false,
    uid: "/placeholder",
  });
  const [theme, setTheme] = useState("light");

  const [pointer, setPointer] = useState({
    pointer: false,
    text: "",
  });

  useLayoutEffect(() => {
    document.body.classList.add(inter.variable);
  }, []);

  return (
    <TransitionContext.Provider value={{ transition, setTransition }}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <PointerContext.Provider value={{ pointer, setPointer }}>
          <Head>
            <title>{"NextJS Starter"}</title>
            <meta
              name="viewport"
              content="initial-scale=1.0, width=device-width"
              lang={"en"}
            />

            <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
            <meta name="description" content="Next Js Starter Template" />
          </Head>

          <motion.main
            key={router.pathname}
            initial="initial"
            animate="enter"
            exit="exit">
            <Component {...pageProps} />
          </motion.main>
        </PointerContext.Provider>
      </ThemeContext.Provider>
    </TransitionContext.Provider>
  );
}
