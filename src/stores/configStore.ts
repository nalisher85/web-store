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
        loadedOnce: false as boolean, // только в рамках сессии
        map: {} as ConfigRecord,
        lastUpdatedAt: 0 as number,
        loading: false as boolean,
    }),

    getters: {
        contactNumber: (s) => s.map[CONFIG_KEYS.CONTACT_NUMBER] ?? null,
        contactEmail: (s) => s.map[CONFIG_KEYS.CONTACT_EMAIL] ?? null,

        minOrderAmount: (s): number | null =>
            toNumberOrNull(s.map[CONFIG_KEYS.MIN_ORDER_AMOUNT]),

        deliveryCharge: (s): number | null =>
            toNumberOrNull(s.map[CONFIG_KEYS.DELIVERY_CHARGE]),

        freeDeliveryFrom: (s): number | null =>
            toNumberOrNull(s.map[CONFIG_KEYS.FREE_DELIVERY_FROM]),
    },

    actions: {
        /**
         * Загружает конфиги с сервера.
         * В рамках одной сессии — только один раз,
         * при перезагрузке страницы — снова.
         */
        async refreshFromServer(force = false): Promise<void> {
            if (this.loading) return;
            if (!force && this.loadedOnce) return;

            this.loading = true;
            this.loadedOnce = true;

            try {
                const list: Config[] = await apiFetchConfigs();
                const next: ConfigRecord = {};

                for (const c of list) {
                    next[c.key as ConfigEnum] = c.value ?? "";
                }

                this.map = next;
                this.lastUpdatedAt = Date.now();
            } catch (e) {
                console.error("config refresh failed:", e);
            } finally {
                this.loading = false;
            }
        },
    },
});
