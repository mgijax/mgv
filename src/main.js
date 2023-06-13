import { createApp } from 'vue'
import App from './App.vue'
import u from './lib/utils'

u.fetch('./runtimeConfig.json', 'json').then(cfg => {
  createApp(App).mount('#app')
})
