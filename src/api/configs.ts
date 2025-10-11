
import { api } from "@/api/axios";
import type { Config } from "@/types/config";

/** Возвращает массив Config из обёртки ResponsePayload или напрямую */
export async function apiFetchConfigs(): Promise<Config[]> {
  const { data } = await api.get("/telegram/configs", {
    // cache-busting: уникальный параметр, чтобы обойти кэш WebView/CDN
    params: { _t: Date.now() },
    // на всякий случай — просим не кэшировать
    headers: { "Cache-Control": "no-cache" },
  });
  const list = Array.isArray(data) ? data : data?.data;
  return Array.isArray(list) ? (list as Config[]) : [];
}