// src/utils/tma.ts

// Кэш в памяти на время жизни вкладки
let CACHED_INIT_DATA: string | null = null

function fromHash(): string | null {
  const h = location.hash?.startsWith('#') ? location.hash.slice(1) : location.hash || ''
  if (!h) return null
  const p = new URLSearchParams(h)
  // Telegram Desktop часто кладёт initData сюда
  return p.get('tgWebAppData') || null
}

function fromTelegram(): string | null {
  // @ts-ignore
  const tg = (globalThis as any)?.Telegram?.WebApp
  if (tg && typeof tg.initData === 'string' && tg.initData.length > 0) {
    return tg.initData
  }
  return fromHash()
}

/**
 * Вернуть актуальный initData:
 * 1) из кэша в памяти,
 * 2) из sessionStorage,
 * 3) свежий из Telegram (WebApp.initData или #tgWebAppData),
 *    и сохранить его в кэш + sessionStorage.
 */
export function getTmaInitData(): string | null {
  if (CACHED_INIT_DATA) return CACHED_INIT_DATA

  try {
    const s = sessionStorage.getItem('__TMA_INIT_DATA')
    if (s && s.length > 0) {
      CACHED_INIT_DATA = s
      return CACHED_INIT_DATA
    }
  } catch {}

  const fresh = fromTelegram()
  if (fresh) {
    CACHED_INIT_DATA = fresh
    try { sessionStorage.setItem('__TMA_INIT_DATA', fresh) } catch {}
    return CACHED_INIT_DATA
  }

  return null
}

/**
 * Вызови один раз на старте приложения (в main.ts) перед первыми запросами.
 * Фиксирует initData и убирает мусорный hash из адресной строки.
 */
export function primeTmaInitData(): void {
  const fresh = fromTelegram()
  if (fresh) {
    CACHED_INIT_DATA = fresh
    try { sessionStorage.setItem('__TMA_INIT_DATA', fresh) } catch {}
    if (location.hash.includes('tgWebAppData')) {
      try { history.replaceState({}, '', location.pathname + location.search) } catch {}
    }
  } else {
    // если Telegram сейчас не дал initData, попробуем поднять из sessionStorage
    try {
      const s = sessionStorage.getItem('__TMA_INIT_DATA')
      if (s && s.length > 0) CACHED_INIT_DATA = s
    } catch {}
  }
}

/** Опционально: очистка при выходе пользователя */
export function clearTmaInitData(): void {
  CACHED_INIT_DATA = null
  try { sessionStorage.removeItem('__TMA_INIT_DATA') } catch {}
}

export function getStartParam(): string | null {
  try {
    const tg = (window as any).Telegram?.WebApp
    return tg?.initDataUnsafe?.start_param || null
  } catch {
    return null
  }
}
