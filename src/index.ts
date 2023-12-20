import { effectScope, reactive, computed, markRaw, getCurrentInstance, inject, Raw } from "vue"
import Big from "big.js"
import { LocalCurrency as LocalCurrencyType, SetCurrency, ComputeTypeEnum, LocalCurrencyPlugin } from "./types"
export type LocalCurrency = LocalCurrencyType
const createInitLocalCurrency = (): LocalCurrency => {
  return {
    currency: {
      isoCode: "USD",
      locales: "en-US",
      stuExchangeRate: 1,
      utsExchangeRate: 1
    },
    _computeTypeEnum: {
      DEFAULT: "default", // Default ICU standard full data format
      ROUNDING: "rounding", // Round to two decimal places
      CARRY: "carry", // Keep two decimal places, carry if there is a value after
      TRUNCATION: "truncation", // Keep two decimal places and directly discard the following decimal places.
      INT: "int", // Keep integer, round up
      INT_CARRY: "int_carry", // Integer carry
      INT_FIXED: "int_fixed", // Round first to two decimal places, then round up.
      INT_TRUNCATION: "int_truncation", // Round off decimals from integers
      INT_RT: "int_rt", // First keep two decimal places and round, then take the integer and round off the decimals to avoid critical rounding of decimals and only round to the integer.
      ORIGINAL: "original" // Keep original calculation results
    },
    uts: (usdAmount) => "",
    stu: (selfAmount) => "",
    tUts: (usdText) => "",
    setCurrency: (currency) => ""
  }
}

let activeLocalCurrency = createInitLocalCurrency()
/**
 * @description only
 */
const SymbolLocalCurrency = Symbol("localCurrency")

const setActiveLocalCurrency = (localCurrency: LocalCurrency) => (activeLocalCurrency = localCurrency)

/**
 * @description Create localCurrency instance
 * @returns {LocalCurrency}
 */

export const createLocalCurrency = (
  plugin?: LocalCurrencyPlugin
): Raw<{
  install: (app: any) => void;
}> => {
  let localCurrency = createInitLocalCurrency()
  localCurrency._plugin = plugin
  const setUp = () => {
    localCurrency = reactive(localCurrency)
    const uts = computed(() => {
      return (usdAmount: number, type?: ComputeTypeEnum) => {
        let selfAmount: any
        const usdToSelfExchangeRate = new Big(localCurrency.currency.utsExchangeRate)
        if (usdAmount) {
          const usdAmountTmp = new Big(usdAmount)
          selfAmount = usdAmountTmp.times(usdToSelfExchangeRate).toNumber()
        } else {
          selfAmount = usdAmount * usdToSelfExchangeRate.toNumber()
        }
        return _formatLocalCurrency(localCurrency, selfAmount, type)
      }
    })

    const stu = computed(() => {
      return (usdAmount: number, type?: ComputeTypeEnum) => {
        return _formatLocalCurrency(localCurrency, usdAmount * localCurrency.currency.stuExchangeRate, type)
      }
    })

    const tUts = computed(() => {
      return (usdText: string | number, type?: ComputeTypeEnum) => {
        let selfText = usdText
        if (typeof usdText === "string" && usdText !== "") {
          if (usdText.includes("$")) {
            const reg = /(\$\d*(\.\d*|\d*))/g
            const replaceTxt = usdText.replace(reg, function (value) {
              const usdAmount = Number(value.slice(1))
              const selfAmount = usdAmount * localCurrency.currency.utsExchangeRate
              return _formatLocalCurrency(localCurrency, selfAmount, type)
            })
            selfText = replaceTxt
          }
        }
        return selfText
      }
    })

    const setCurrency: SetCurrency = (currency) => {
      if (typeof currency === 'function') {
        localCurrency.currency = currency(localCurrency.currency)
      } else {
        localCurrency.currency = currency
      }
      if (localCurrency._plugin && localCurrency._plugin.setCurrency) {
        // Provide plug-in functionality
        localCurrency._plugin.setCurrency.reduce((prev, curr) => {
          return curr(prev)
        }, localCurrency.currency)
      }
    }
    // merge
    Object.assign(localCurrency, {
      uts,
      stu,
      tUts,
      setCurrency
    })
  }
  const scope = effectScope()
  scope.run(setUp)
  setActiveLocalCurrency(localCurrency)
  // Create an object so that its users do not become proxies
  const localCurrencyInstance = markRaw({
    install: (app: any) => {
      app.provide(SymbolLocalCurrency, localCurrency)
      app.config.globalProperties.$currency = localCurrency
    }
  })
  return localCurrencyInstance
}

export function useLocalCurrency(): LocalCurrency {
  // Get app instance
  const currentInstance = getCurrentInstance()
  if (currentInstance != null) {
    const localCurrency: undefined | LocalCurrency = inject(SymbolLocalCurrency)
    if (localCurrency) {
      setActiveLocalCurrency(localCurrency)
      return localCurrency
    }
  }
  return activeLocalCurrency
}

const currencyMantissa: Partial<Record<ComputeTypeEnum, string[]>> = {
  int: ["MYR", "THB", "PHP", "HKD", "JPY", "KRW", "INR", "PKP", "CLP", "SGD", "MVR", "TWD", "IDR"]
}

function findMantissaHelper(isoCode: string) {
  return Object.keys(currencyMantissa).find((mantissaType) => currencyMantissa[mantissaType as ComputeTypeEnum]?.includes(isoCode)) as ComputeTypeEnum | undefined
}

const _formatLocalCurrency = (localCurrency: LocalCurrency, amount: number, type?: ComputeTypeEnum) => {
  let computeType = type ?? findMantissaHelper(localCurrency.currency.isoCode)
  if (localCurrency.currency.isoCode === "PKR" && type !== localCurrency._computeTypeEnum.ORIGINAL) {
    // It has been confirmed that the amount of PKR currency in local e-commerce refers to keeping integers,
    // so it is uniformly corrected to integers here (the data formatting of the IUC library contains decimals, which is not in line with local customs)
    computeType = localCurrency._computeTypeEnum.INT
  }
  const notRoundingType = [
    localCurrency._computeTypeEnum.ORIGINAL,
    localCurrency._computeTypeEnum.INT,
    localCurrency._computeTypeEnum.INT_CARRY,
    localCurrency._computeTypeEnum.INT_TRUNCATION,
    localCurrency._computeTypeEnum.INT_RT,
    localCurrency._computeTypeEnum.INT_FIXED
  ]
  if (["KWD", "OMR", "BHD", "TND", "JOD", "LYD"].includes(localCurrency.currency.isoCode) && computeType && !notRoundingType.includes(computeType)) {
    // Currency with 3 decimal places only retains two decimal places, rounded
    computeType = localCurrency._computeTypeEnum.ROUNDING
  }

  let computeResult: any
  let amountBig: Big.Big
  switch (computeType) {
    case localCurrency._computeTypeEnum.DEFAULT:
      computeResult = amount
      break
    case localCurrency._computeTypeEnum.ROUNDING:
      amountBig = new Big(amount)
      computeResult = amountBig.toFixed(2)
      break
    case localCurrency._computeTypeEnum.CARRY:
      amountBig = new Big(amount)
      amount = amountBig.times(100).toNumber()
      computeResult = Math.ceil(amount) / 100
      break
    case localCurrency._computeTypeEnum.TRUNCATION:
      amountBig = new Big(amount)
      amount = amountBig.times(100).toNumber()
      computeResult = Math.floor(amount) / 100
      break
    case localCurrency._computeTypeEnum.INT:
      computeResult = amount.toFixed()
      break
    case localCurrency._computeTypeEnum.INT_CARRY:
      computeResult = Math.ceil(amount)
      break
    case localCurrency._computeTypeEnum.INT_TRUNCATION:
      computeResult = Math.floor(amount)
      break
    case localCurrency._computeTypeEnum.INT_FIXED:
      amountBig = new Big(amount)
      computeResult = amountBig.toFixed(2)
      computeResult = Math.ceil(computeResult)
      break
    case localCurrency._computeTypeEnum.INT_RT:
      amountBig = new Big(amount)
      computeResult = amountBig.toFixed(2)
      computeResult = Math.floor(computeResult)
      break
    case localCurrency._computeTypeEnum.ORIGINAL:
      computeResult = amount
      break
    default:
      computeResult = amount
      break
  }
  let formatResult = computeResult.toString()
  if (computeType != localCurrency._computeTypeEnum.ORIGINAL) {
    const options: Intl.NumberFormatOptions = {
      style: "currency",
      currency: localCurrency.currency.isoCode
    }
    const intTypeArr = [
      localCurrency._computeTypeEnum.INT,
      localCurrency._computeTypeEnum.INT_CARRY,
      localCurrency._computeTypeEnum.INT_TRUNCATION,
      localCurrency._computeTypeEnum.INT_RT,
      localCurrency._computeTypeEnum.INT_FIXED
    ]
    const decimalsTypeArr = [localCurrency._computeTypeEnum.ROUNDING, localCurrency._computeTypeEnum.CARRY, localCurrency._computeTypeEnum.TRUNCATION]
    if (computeType && intTypeArr.includes(computeType)) {
      options.minimumFractionDigits = 0
      options.maximumFractionDigits = 0
    } else if (computeType && decimalsTypeArr.includes(computeType)) {
      options.minimumFractionDigits = 2
    }
    const newLocales = `${localCurrency.currency.locales}-u-nu-latn`
    formatResult = new Intl.NumberFormat(newLocales, options).format(computeResult)
  }
  if (localCurrency._plugin && localCurrency._plugin.format) {
    // Plug-in processing
    formatResult = localCurrency._plugin.format.reduce((acc, cur) => {
      return cur(acc)
    }, formatResult)
  }
  return formatResult
}
