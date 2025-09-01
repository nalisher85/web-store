import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import './assets/tailwind.css'

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from './router'
import { primeTmaInitData } from '@/utils/tma'  
import WebApp from "@twa-dev/sdk";


// Прогреваем initData (без await — как и раньше в проекте)
try {
  primeTmaInitData();
} catch (e) {
  console.warn("[TMA] primeTmaInitData error:", e);
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


app.mount('#app')
