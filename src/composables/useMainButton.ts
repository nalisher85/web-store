// src/composables/useMainButton.ts
import { onMounted, onUnmounted, ref } from "vue";
import WebApp from "@twa-dev/sdk";

type Options = {
  text: string;                   // подпись кнопки
  onClick: () => void | Promise<void>; // обработчик
  enabled?: boolean;              // доступность (по умолчанию true)
  show?: boolean;                 // показывать (по умолчанию true)
  isLoadingInitially?: boolean;   // крутилка
};

export function useMainButton(opts: Options) {
  const isActive = ref(false);
  const isLoading = ref(!!opts.isLoadingInitially);

  const setText = (text: string) => {
    try { WebApp.MainButton.setText(text); } catch {}
  };

  const setEnabled = (v: boolean) => {
    try { v ? WebApp.MainButton.enable() : WebApp.MainButton.disable(); } catch {}
  };

  const setLoading = (v: boolean) => {
    isLoading.value = v;
    try { v ? WebApp.MainButton.showProgress(false) : WebApp.MainButton.hideProgress(); } catch {}
  };

  const show = () => {
    try {
      WebApp.MainButton.show();
      isActive.value = true;
    } catch {}
  };

  const hide = () => {
    try {
      WebApp.MainButton.hide();
      isActive.value = false;
    } catch {}
  };

  const clickHandler = async () => {
    try {
      await opts.onClick();
    } catch (e) {
      console.warn("[TMA] MainButton onClick error:", e);
    }
  };

  onMounted(() => {
    // несколько шагов — чтобы на iOS кнопка точно отрисовалась
    const attempts = [0, 120, 360];
    attempts.forEach((d) =>
      setTimeout(() => {
        try {
          WebApp.MainButton.offClick(clickHandler);
          WebApp.MainButton.onClick(clickHandler);
          WebApp.MainButton.setText(opts.text);
          (opts.enabled ?? true) ? WebApp.MainButton.enable() : WebApp.MainButton.disable();
          if (isLoading.value) WebApp.MainButton.showProgress(false); else WebApp.MainButton.hideProgress();
          (opts.show ?? true) ? show() : hide();
        } catch (e) {
          console.warn("[TMA] MainButton mount attempt error:", e);
        }
      }, d)
    );
  });

  onUnmounted(() => {
    try {
      WebApp.MainButton.offClick(clickHandler);
      WebApp.MainButton.hide();
      WebApp.MainButton.hideProgress();
    } catch {}
  });

  return {
    // управление из страницы
    isMainButtonActive: isActive,
    isMainButtonLoading: isLoading,
    setText, setEnabled, setLoading, show, hide,
  };
}