import { mount } from 'svelte'
import Dashboard from './dashboard.svelte'
import '../src/app.css'

const target = document.getElementById('app')

if (!target) {
  throw new Error('#app element not found in DOM')
}

mount(Dashboard, {
  target
})
