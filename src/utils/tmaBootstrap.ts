// src/utils/tmaBootstrap.ts

/**
 * TMA bootstrap:
 * 1) Fullscreen: requestFullscreen() -> expand() (+ретраи и на viewportChanged)
 * 2) Disable swipe-down close/minimize
 * 3) Отключаем системный диалог закрытия (disableClosingConfirmation)
 * 4) Safe-area -> CSS vars + поддержка изменений
 * 5) --tma-native-side: резерв под нативные кнопки (Close / меню)
 * 6) setHeaderColor / setBottomBarColor — чтобы статус-бар был читаемым
 */

export interface FullscreenOptions {
  /** при желании: ссылка на Main Mini App, чтобы принудительно открыть фуллскрин */
  fallbackStartAppLink?: string;
}

export function initTmaUx(opts: FullscreenOptions = {}) {
  const WA: any = (window as any)?.Telegram?.WebApp;
  if (!WA) return;

  // --- базовая инициализация ---
  try {
    WA.ready?.();
    WA.setBackgroundColor?.("#ffffff");
  } catch {}

  // Цвет хедера/нижней панели → корректный контраст статус-бара
  const applyHeaderColors = () => {
    try {
      // светлый фон => тёмные иконки статус-бара
      WA.setHeaderColor?.("#ffffff");      // можно #F7F8FA, если хочется чуть серее
      WA.setBottomBarColor?.("#ffffff");   // опционально, для единообразия низа
    } catch {}
  };
  applyHeaderColors();

  // --- резерв под нативные кнопки (лево/право) ---
  try {
    const ios = /iPad|iPhone|iPod/i.test(navigator.userAgent);
    const side = ios ? 72 : 56;
    document.documentElement.style.setProperty("--tma-native-side", `${side}px`);
  } catch {}

  // --- фуллскрин + ретраи ---
  const tryFullscreen = () => {
    let ok = false;
    try {
      if (typeof WA.requestFullscreen === "function") {
        WA.requestFullscreen();
        ok = true;
      } else if (typeof WA.expand === "function") {
        WA.expand();
        ok = true;
      }
    } catch {}
    // после попытки ещё раз проставим цвета — на iOS иногда первый вызов игнорится
    setTimeout(applyHeaderColors, 150);
    return ok;
  };

  tryFullscreen();
  setTimeout(tryFullscreen, 200);
  setTimeout(tryFullscreen, 500);
  WA.onEvent?.("viewportChanged", tryFullscreen);

  // --- запрет свайпа вниз (с повтором) ---
  try { WA.disableVerticalSwipes?.(); } catch {}
  setTimeout(() => { try { WA.disableVerticalSwipes?.(); } catch {} }, 200);

  // --- отключаем системный диалог закрытия ---
  try { WA.disableClosingConfirmation?.(); } catch {}

  // --- safe-area -> CSS vars ---
  const applySafeArea = () => {
    const s = WA.safeAreaInset || {};
    const root = document.documentElement;
    root.style.setProperty("--tma-safe-area-top", `${s.top ?? 0}px`);
    root.style.setProperty("--tma-safe-area-bottom", `${s.bottom ?? 0}px`);
    root.style.setProperty("--tma-safe-area-left", `${s.left ?? 0}px`);
    root.style.setProperty("--tma-safe-area-right", `${s.right ?? 0}px`);
  };
  applySafeArea();

  WA.onEvent?.("safeAreaChanged", applySafeArea);
  WA.onEvent?.("contentSafeAreaChanged", applySafeArea);
  WA.onEvent?.("themeChanged", () => {
    applySafeArea();
    applyHeaderColors();
  });
  WA.onEvent?.("viewportChanged", applyHeaderColors);

  // --- (опционально) жёсткая гарантия фуллскрина — редирект на Main Mini App ---
  if (opts.fallbackStartAppLink) {
    const ensureByRedirect = () => {
      try {
        const h = WA.viewportHeight ?? 0;
        const sh = WA.viewportStableHeight ?? 0;
        const compactLikely = h > 0 && sh > 0 && (sh / h) < 0.92;
        if (compactLikely) {
          if (typeof WA.openTelegramLink === "function") {
            WA.openTelegramLink(opts.fallbackStartAppLink);
          } else {
            window.location.href = opts.fallbackStartAppLink!;
          }
        }
      } catch {}
    };
    setTimeout(ensureByRedirect, 800);
  }
}