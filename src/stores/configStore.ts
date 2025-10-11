// src/stores/configStore.ts
import { defineStore } from "pinia";
import { apiFetchConfigs } from "@/api/configs";
import {
    CONFIG_KEYS,
    type Config,
    type ConfigEnum,
    type ConfigRecord,
    toNumberOrNull,
} from "@/types/config";

export const useConfigStore = defineStore("config", {
    state: () => ({
        loadedOnce: false as boolean, // пробовали refresh в этой сессии
        map: {} as ConfigRecord,      // персистится
        lastUpdatedAt: 0 as number,   // unix ms
        loading: false as boolean,
    }),

    getters: {
        // Строковые
        contactNumber: (s) => s.map[CONFIG_KEYS.CONTACT_NUMBER] ?? null,
        contactEmail: (s) => s.map[CONFIG_KEYS.CONTACT_EMAIL] ?? null,

        // Числа (nullable)
        minOrderAmount: (s): number | null => toNumberOrNull(s.map[CONFIG_KEYS.MIN_ORDER_AMOUNT]),
        deliveryCharge: (s): number | null => toNumberOrNull(s.map[CONFIG_KEYS.DELIVERY_CHARGE]),
        freeDeliveryFrom: (s): number | null => toNumberOrNull(s.map[CONFIG_KEYS.FREE_DELIVERY_FROM]),
    },

    actions: {
        /**
         * Обновляет конфиги с бэка.
         * @param force если true — игнорирует loadedOnce и обновляет принудительно
         */
        async refreshFromServer(force = false): Promise<void> {
            // инициализируем поле loading в state, если его ещё нет
            // (если у тебя уже есть loading в state — этот комментарий можно игнорировать)
            // @ts-ignore
            if (this.loading === undefined) this.loading = false;

            if (this.loading) return;
            if (!force && this.loadedOnce) return;

            this.loading = true;
            this.loadedOnce = true;

            try {
                const list: Config[] = await apiFetchConfigs();
                const next: ConfigRecord = {};
                for (const c of list) next[c.key as ConfigEnum] = c.value ?? "";
                this.map = next;
                this.lastUpdatedAt = Date.now();
            } catch (e) {
                console.error("config refresh failed:", e);
            } finally {
                this.loading = false;
            }
        },
    },

    // персистим в LocalStorage (pinia-plugin-persistedstate уже подключен у тебя)
    persist: {
        key: "config-store:v3",
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        paths: ["map", "lastUpdatedAt"], // loadedOnce и loading НЕ сохраняем
    } as any,
});