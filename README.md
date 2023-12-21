
# vue-local-currency
Localized currency conversion for Vue 3

## Installation
```
npm install vue-local-currency
```

## Usage

global use
```
import { createApp } from 'vue'
import App from './App.vue'
import { createLocalCurrency } from 'vue-local-currency'

const app = createApp(App)
const currency = createLocalCurrency()
app.use(currency)
app.mount('#app')

```

###### global support typescript 

src/components.d.ts
```
import { LocalCurrency } from 'vue-local-currency'

declare module "vue" {
  export interface ComponentCustomProperties {
    $currency: LocalCurrency
  }
}
```
## Examples

Composition API

```vue
<template>
  <div>
    price: <span>{{ uts('13.2') }}</span>
  </div>
</template>

<script setup>
import { useLocalCurrency } from 'vue-local-currency'

const { uts, stu, tUts } = useLocalCurrency()
</script>

```

template use

```vue
<template>
  <div>
    price: <span>{{ $currency.uts('13.2') }}</span>
  </div>
</template>

```

## set local currency

```vue
<template>
  <div>
    price: <span>{{ $currency.uts(123) }}</span>
  </div>
   <button @click="changeCurrency">set currency</button>
</template>
<script setup>
import { useLocalCurrency } from 'vue-local-currency'

const { setLocalCurrency } = useLocalCurrency()

const changeCurrency = () => {
  const currency = {
    isoCode: "HKD", // currency code
    locales: "zh-CN", // Localized style configuration
    utsExchangeRate: 6.89, // USD to HKD exchange rate
    stuExchangeRate: 0.14513788098693758 // HKD to USD exchange rate
  }
  setLocalCurrency(currency)
}
</script>

```

## setLocalCurrency arguments

|              | description           | type         |
| --------------- | ---------- | ---------- |
| isoCode      | currency code | string('USD') |
| locales | Localized style configuration | string('en-US') |
| utsExchangeRate |  USD to HKD exchange rate | number |
| stuExchangeRate | HKD to USD exchange rate | number |


#### locales

Localized style configuration， Language splicing country code

|              | description           | type         |
| --------------- | ---------- | ---------- |
| en-US | English | string('en-US') |
| zh-CN | Chinese | string('zh-CN') |
| ja-JP | Japanese | string('ja-JP') |

## plugin

|      key        | description           |
| --------------- | ---------- |
| setCurrency | change locales |
| format | Change the final output |


```js
import { createApp } from 'vue'
import App from './App.vue'
import { createLocalCurrency } from 'vue-local-currency'

const app = createApp(App)
const lang = 'zh'
const currency = createLocalCurrency({
  setCurrency: [(currency) => {
    if (lang === 'zh') {
      currency.locales = 'zh-CN'
    }
    retunn currency
  }],
  format:  [(res) => {
    retunn res
  }]
})
app.use(currency)
app.mount('#app')

```

## type: ComputeTypeEnum

```ts
// ts
$currency.uts('13.2', type: ComputeTypeEnum)
```

|      type        | description           |
| --------------- | ---------- |
| default |  Default ICU standard full data format |
| rounding |  Round to two decimal places |
| carry | Keep two decimal places, carry if there is a value after |
| truncation | Keep two decimal places and directly discard the following decimal places. |
| int | Keep integer, round up |
| int_carry | Integer carry |
| int_fixed | Round first to two decimal places, then round up. |
| int_truncation | Round off decimals from integers |
| int_rt | First keep two decimal places and round, then take the integer and round off the decimals to avoid critical rounding of decimals and only round to the integer. |
| original | Keep original calculation results |
