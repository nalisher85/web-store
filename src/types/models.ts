export namespace StockNS {
  // Значение свойства варианта (зеркало sealed интерфейса в Kotlin).
  // По умолчанию считаем дискриминатором ключ "type".
  export type PropertyValue =
    | { type: 'StringValue'; value: string }
    | { type: 'NumberValue'; value: number }
    | { type: 'IntValue'; value: number }
    | { type: 'BooleanValue'; value: boolean };

  export interface Property {
    propertyName: string;
    value: PropertyValue;
  }
}

export interface Stock {
  id: number
  goodId: number
  overriddenName: string
  count: number
  webPrice?: number
  barcode: string
  sku: string
  updatedAt: number
  images: string[]
  extraProperties: Record<string, string>, //доп опциональные свойства
  goodProperties: StockNS.Property[];
}

export interface Good {
  id: number
  name: string
  country: string
  manufacturer?: string
  sku?: string
  description?: string
  countInPack: number
  updatedAt: number
  defaultImages: string[]
  properties: GoodProperty[]
}

export interface GoodWithStock {
  good: Good
  stock: Stock[]
}

export interface GoodProperty {
  name: string;
  isRequired: boolean;
  valueType: PropertyValueType;
  /** только для valueType == STRING_LIST */
  options?: string[] | null;
}

export type PropertyValueType = 'STRING' | 'NUMBER' | 'INT' | 'BOOLEAN' | 'STRING_LIST';

export interface CategoryDataModel {
  id: number
  name: string
  parentId: number | null
  updatedAt: number
}
