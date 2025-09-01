import axios from 'axios'
import { BASE_URL } from '@/config'
import { getTmaInitData } from '@/utils/tma'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    //'Authorization': '', // ← здесь укажешь реальный токен
  },
})

/**
 * REQUEST: приклеиваем Telegram initData в заголовок "tma-data"
 */
api.interceptors.request.use((config) => {
  const initData = getTmaInitData()
  if (initData) {
    ;(config.headers as any)['tma-data'] = initData
  }
  return config
})

/**
 * RESPONSE: если бэк вернул 401 (подпись невалидна или истекла),
 * показываем понятную подсказку. Можно перезапустить Mini App.
 */
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status
    if (status === 401) {
      // подсказка
      alert('Авторизация Telegram не подтверждена. Откройте приложение через кнопку бота.')

      // при желании — мягко перезапустить во «внутреннем» браузере Telegram
      // @ts-ignore
      const tg = (window as any)?.Telegram?.WebApp
      if (tg?.openLink) {
        const url = `${location.origin}${location.pathname}`
        tg.openLink(url) // откроет тот же URL внутри Telegram
      }
    }
    return Promise.reject(err)
  }
)