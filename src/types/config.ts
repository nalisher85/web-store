// src/types/config.ts

// Вместо enum — объект констант, чтобы не было runtime-эмита
export const CONFIG_KEYS = {
  CONTACT_NUMBER: "CONTACT_NUMBER",
  CONTACT_EMAIL: "CONTACT_EMAIL",
  MIN_ORDER_AMOUNT: "MIN_ORDER_AMOUNT",
  DELIVERY_CHARGE: "DELIVERY_CHARGE",
  FREE_DELIVERY_FROM: "FREE_DELIVERY_FROM",
} as const;

// Тип "значения" (строковый юнион из значений объекта)
export type ConfigEnum = typeof CONFIG_KEYS[keyof typeof CONFIG_KEYS];

// Тип "ключи" объекта (если понадобится)
export type ConfigKey = keyof typeof CONFIG_KEYS;

export interface Config {
  // Бэкенд присылает строку-имя значения — она попадает в этот юнион
  key: ConfigEnum;
  value: string; // сервер шлёт строку; числа парсим на фронте
}

export type ConfigRecord = Partial<Record<ConfigEnum, string>>;

export const toNumberOrNull = (v?: string | null): number | null => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};