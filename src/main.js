import { createApp } from 'vue'
import App from './App.vue'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './assets/main.css'
import { runtimeTarget } from './utils/runtimeTarget'

const app = createApp(App)
document.documentElement.dataset.appTarget = runtimeTarget
app.mount('#app')
