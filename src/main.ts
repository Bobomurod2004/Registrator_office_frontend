import { createApp } from 'vue'
import App from './App.vue'
import { pinia } from './stores'
import { router } from './router'
import 'bootstrap/dist/css/bootstrap.min.css'
import './style.css'
import './styles/leadership.css'
import './styles/person-search.css'

const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')
