import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Particles from '@tsparticles/vue3'
import { loadSlim } from '@tsparticles/slim'
import { loadLineShape } from '@tsparticles/shape-line'
import { loadEmittersPlugin } from '@tsparticles/plugin-emitters'
import './index.css'

const app = createApp(App)
app.use(router)
app.use(Particles, {
  init: async (engine) => {
    await loadSlim(engine)
    await loadLineShape(engine)
    await loadEmittersPlugin(engine)
  },
})
app.mount('#app')
