import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface ErrorFallbackProps {
  error?: Error;
  reset: () => void;
}

export const ErrorFallback = ({ error, reset }: ErrorFallbackProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-sm space-y-6"
      >
        <div className="flex justify-center">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600">
            <AlertCircle size={48} />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Oops! Algo deu errado</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {error ? error.message : "Ocorreu um erro inesperado enquanto carregávamos a página."}
          </p>
        </div>

        <button
          onClick={reset}
          className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all active:scale-95 shadow-lg"
        >
          <RefreshCcw size={20} />
          Tentar Novamente
        </button>
      </motion.div>
    </div>
  );
};
