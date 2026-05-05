import { motion, AnimatePresence } from "framer-motion"

interface SplashScreenProps {
  isVisible: boolean
}

export const SplashScreen = ({ isVisible }: SplashScreenProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center bg-[#05070D] text-white"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0B0F1A] to-[#111827] shadow-[0_24px_70px_rgba(34,197,94,0.28)] ring-2 ring-[#22C55E]/50">
                <img src="/icons/logo.png" alt="VSFit" className="h-full w-full object-contain" />
              </div>
              <motion.div
                animate={{ opacity: [0.55, 0.9, 0.55], scale: [0.96, 1.04, 0.96] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="absolute inset-0 rounded-[2rem] border border-white/20"
              />
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="text-lg font-semibold uppercase tracking-[0.24em]"
            >
              VSFit Gym
            </motion.h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
