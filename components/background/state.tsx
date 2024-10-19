import { proxy } from 'valtio'

const state = proxy({
  scale: 0,
  minScale: 1,
  maxScale: 2,
})
export default state
