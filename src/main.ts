import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import './assets/tailwind.css'

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from './router'
import { primeTmaInitData } from '@/utils/tma'  
import WebApp from "@twa-dev/sdk";
import { initTmaUx } from "@/utils/tmaBootstrap";
import { useConfigStore } from "@/stores/configStore";
import { BOT_USERNAME } from './config'

// Если хочешь — укажи ссылку на Main Mini App, чтобы из "внутренней" кнопки гарантировать фуллскрин редиректом
const STARTAPP_LINK = `https://t.me/${BOT_USERNAME}?startapp=1` // пример: "https://t.me/<bot_username>/<appname>?startapp=..."

try {
  primeTmaInitData();
  initTmaUx({ fallbackStartAppLink: STARTAPP_LINK });
} catch (e) {
  console.warn("[TMA] init bootstrap error:", e);
}

// Сообщаем Telegram, что интерфейс готов
try {
  WebApp.ready();
} catch (e) {
  // Ок в браузере вне Telegram
  console.warn("[TMA] WebApp.ready() skipped:", e);
}
if (WebApp.setBackgroundColor) {
  WebApp.setBackgroundColor('#ffffff')
}

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)

/* ========= ОБРАБОТКА startapp (deep link) =========
   Поддерживаем:
   - Telegram WebApp: WebApp.initDataUnsafe.start_param
   - Браузер/отладка: ?startapp=good_123 в URL
   Редирект делаем один раз за сессию.
*/
function getStartParam(): string | null {
  try {
    const fromTg = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.start_param
    if (fromTg) return String(fromTg)
  } catch {}
  try {
    const sp = new URLSearchParams(window.location.search)
    return sp.get('startapp')
  } catch {}
  return null
}

async function handleDeepLinkOnce() {
  const FLAG = 'tma_start_param_handled'
  if (sessionStorage.getItem(FLAG)) return

  const start = getStartParam()
  if (!start) return

  if (start.startsWith('good_')) {
    const id = Number(start.slice('good_'.length))
    if (!Number.isNaN(id)) {
      sessionStorage.setItem(FLAG, '1')
      await router.isReady()

      // кладём Home как базу (replace, чтобы не было дублей)
      await router.replace({ name: 'Home' }).catch(() => {})
      // потом пушим Detail — теперь back вернёт на Home
      router.push({ name: 'GoodDetail', params: { id } }).catch(() => {})
    }
  }
}

// Важно: сначала обработать диплинк (включая router.isReady), потом монтировать
;(async () => {
  await handleDeepLinkOnce()

  app.mount('#app')
  useConfigStore().refreshFromServer(true).catch(() => {});

})()