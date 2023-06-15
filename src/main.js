import { createApp } from 'vue'
import App from './App.vue'
import u from './lib/utils'
import emitter from 'tiny-emitter/instance'

u.fetch('./runtimeConfig.json', 'json').then(cfg => {
  const app = createApp(App, {
      runtimeConfig:cfg, 
      ebus: emitter
  })
  app.mount('#app')
})
