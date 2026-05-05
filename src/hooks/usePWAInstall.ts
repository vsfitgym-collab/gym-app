import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'pwa_install_dismissed';
const INSTALL_DELAY_MS = 2000;

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches;
}

function isSafariIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/Chrome/.test(ua);
}

function wasDeclined(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function setDeclined(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // localStorage unavailable
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandalone());
  }, []);

  useEffect(() => {
    if (isInstalled || wasDeclined()) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const changeHandler = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    mediaQuery.addEventListener('change', changeHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      mediaQuery.removeEventListener('change', changeHandler);
    };
  }, [isInstalled]);

  useEffect(() => {
    if (!isInstallable || isInstalled || wasDeclined() || !deferredPrompt) {
      return;
    }

    const timer = setTimeout(() => {
      setShouldShowPrompt(true);
    }, INSTALL_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, deferredPrompt]);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setIsInstallable(false);
    setShouldShowPrompt(false);

    if (outcome === 'accepted') {
      setIsInstalled(true);
      return true;
    }

    return false;
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    setShouldShowPrompt(false);
    setDeclined(true);
  }, []);

  const resetDeclined = useCallback(() => {
    setDeclined(false);
  }, []);

  return {
    isInstallable,
    isInstalled,
    shouldShowPrompt,
    isSafariIOS: isSafariIOS(),
    installApp,
    dismissPrompt,
    resetDeclined,
  };
}