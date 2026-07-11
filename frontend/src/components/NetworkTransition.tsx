/**
 * NetworkTransition — wraps children with online/offline transition animations.
 * Fades content slightly and shows a quick toast when transitioning.
 */

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

interface Props {
  children: ReactNode;
}

export default function NetworkTransition({ children }: Props) {
  const { online } = useOnlineStatus();

  return (
    <motion.div
      animate={{
        opacity: online ? 1 : 0.85,
        filter: online ? "grayscale(0%)" : "grayscale(5%)",
      }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      style={{ width: "100%", minHeight: "100%" }}
    >
      {children}
    </motion.div>
  );
}