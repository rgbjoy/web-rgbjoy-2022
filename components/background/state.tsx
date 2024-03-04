import { proxy } from 'valtio'

const state = proxy({ scale: 1 })
export default state