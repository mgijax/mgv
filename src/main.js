import Vue from 'vue'
import App from './App.vue'
import u from '@/lib/utils'

Vue.config.productionTip = false

u.fetch('./runtimeConfig.json', 'json').then(cfg => {
  const r = new Vue({ render: h => h(App) })
  r.config = cfg 
  r.$mount('#app')
})
