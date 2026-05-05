import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function InstallPrompt() {
  const { shouldShowPrompt, isSafariIOS, installApp, dismissPrompt } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [localShow, setLocalShow] = useState(false);

  useEffect(() => {
    if (isSafariIOS && !localShow) {
      const timer = setTimeout(() => setLocalShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSafariIOS, localShow]);

  useEffect(() => {
    if (shouldShowPrompt) {
      setLocalShow(true);
    }
  }, [shouldShowPrompt]);

  if (!localShow) return null;

  const handleInstall = async () => {
    if (isSafariIOS) {
      dismissPrompt();
      return;
    }
    setIsInstalling(true);
    await installApp();
    setIsInstalling(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto animate-fade-in" />
      
      <div className="relative w-full max-w-md pointer-events-auto animate-slide-in">
        <div className="glass-card border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
          <button
            onClick={dismissPrompt}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4 pr-10">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              {isSafariIOS ? (
                <Smartphone className="w-6 h-6 text-white" />
              ) : (
                <Download className="w-6 h-6 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {isSafariIOS ? (
                <>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Adicione à Tela Inicial
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Toque em <span className="text-emerald-400 font-medium">Compartilhar</span> e depois em <span className="text-emerald-400 font-medium">Adicionar à Tela Inicial</span> para usar como app.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Instale o app
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Instale o <span className="text-emerald-400 font-medium">VSFit Gym</span> no seu celular para uma experiência completa e acesso offline.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            {isSafariIOS ? (
              <button
                onClick={handleInstall}
                className="flex-1 h-11 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Entendi</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="flex-1 h-11 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isInstalling ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Instalar</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={dismissPrompt}
                  disabled={isInstalling}
                  className="px-5 h-11 rounded-lg border border-white/20 text-zinc-300 hover:text-white hover:bg-white/10 font-medium transition-colors"
                >
                  Agora não
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}