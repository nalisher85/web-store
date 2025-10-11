<script setup lang="ts">
import { computed } from "vue";
import { useConfigStore } from "@/stores/configStore";
import { useBackButton } from "@/composables/useBackButton";

useBackButton();

const cfg = useConfigStore();

const phone = computed(() => cfg.contactNumber || "");
const email = computed(() => cfg.contactEmail || "");

const minOrderAmount = computed(() => cfg.minOrderAmount);      // number|null
const deliveryCharge = computed(() => cfg.deliveryCharge);      // number|null
const freeDeliveryFrom = computed(() => cfg.freeDeliveryFrom);    // number|null

const hasMin = computed(() => minOrderAmount.value != null);
const hasDelivery = computed(() => deliveryCharge.value != null);
const hasFreeFrom = computed(() => freeDeliveryFrom.value != null);

const hasAnyParams = computed(() => hasMin.value || hasDelivery.value || hasFreeFrom.value);
const hasAnyContacts = computed(() => !!phone.value || !!email.value);

const formatMoney = (v: number | null) =>
    v == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "TJS" }).format(v);
</script>

<template>
    <div class="p-4 pb-24 max-w-screen-sm mx-auto">
        <h1 class="text-xl font-semibold mb-3">О нас</h1>

        <p class="text-sm opacity-80 mb-6">
            Это официальный мини-магазин. Контакты и параметры заказа подтягиваются из конфигурации.
        </p>

        <div class="space-y-4">
            <section v-if="hasAnyContacts" class="rounded-2xl p-4 border border-black/5 bg-white/70 dark:bg-white/5">
                <h2 class="font-medium mb-2">Контакты</h2>
                <ul class="text-sm space-y-1">
                    <li v-if="phone">
                        Телефон:
                        <a class="underline" :href="`tel:${phone}`">{{ phone }}</a>
                    </li>
                    <li v-if="email">
                        Email:
                        <a class="underline" :href="`mailto:${email}`">{{ email }}</a>
                    </li>
                </ul>
            </section>

            <section v-if="hasAnyParams" class="rounded-2xl p-4 border border-black/5 bg-white/70 dark:bg-white/5">
                <h2 class="font-medium mb-2">Параметры заказа</h2>
                <ul class="text-sm space-y-1">
                    <li v-if="hasMin">
                        Минимальная сумма заказа:
                        <span class="font-medium">{{ formatMoney(minOrderAmount) }}</span>
                    </li>

                    <li v-if="hasDelivery">
                        Стоимость доставки:
                        <span class="font-medium">
                            {{ deliveryCharge === 0 ? "Бесплатно" : formatMoney(deliveryCharge) }}
                        </span>
                    </li>

                    <li v-if="hasFreeFrom">
                        Бесплатная доставка от:
                        <span class="font-medium">{{ formatMoney(freeDeliveryFrom) }}</span>
                    </li>
                </ul>
            </section>
        </div>
    </div>
</template>