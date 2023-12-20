export interface Currency {
  isoCode: string
  locales: string
  stuExchangeRate: number
  utsExchangeRate: number
}

export interface LocalCurrencyPlugin {
  setCurrency?: ((currency: Currency) => Currency)[]
  format?:  ((str: string) => string)[]
}

export type SetCurrency = (currency: Currency | ((currency: Currency) => Currency)) => void

/**
 * @description "default" // Default ICU standard full data format
 * @description "rounding" // Round to two decimal places
 * @description "carry" // Keep two decimal places, carry if there is a value after
 * @description "truncation" // Keep two decimal places and directly discard the following decimal places.
 * @description "int" // Keep integer, round up
 * @description "int_carry" // Integer carry
 * @description "int_fixed" // Round first to two decimal places, then round up.
 * @description "int_truncation" // Round off decimals from integers
 * @description "int_rt" // First keep two decimal places and round, then take the integer and round off the decimals to avoid critical rounding of decimals and only round to the integer.
 * @description "original" // Keep original calculation results
 */
export type ComputeTypeEnum =
  | "default"
  | "rounding"
  | "carry"
  | "truncation"
  | "int"
  | "int_carry"
  | "int_fixed"
  | "int_truncation"
  | "int_rt"
  | "original"
export interface LocalCurrency {
  /**
   * @desc USD to local currency amount
   * @param {*} usdAmount
   * @param {*} type _computeTypeEnum Local configuration>Global configuration
   * @returns
   */
  uts: (usdAmount: string | number, type?: ComputeTypeEnum) => string

  /**
   * Local currency to USD amount
   * @param {*} selfAmount
   * @param {*} type _computeTypeEnum Local configuration>Global configuration
   * @returns
   */
  stu: (selfAmount: string | number, type?: ComputeTypeEnum) => string

  /**
   * USD string to local currency string
   * @param {*} usdText
   * @param {*} type _computeTypeEnum Local configuration>Global configuration
   * @returns
   */
  tUts: (usdText: string | number, type?: ComputeTypeEnum) => string

  currency: Currency

  _computeTypeEnum: {
    [key: string]: ComputeTypeEnum
  }

  setCurrency: SetCurrency

  _plugin?: LocalCurrencyPlugin
}
