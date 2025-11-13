import { ref } from 'vue'

const imageVersion = ref<number>(0)
export function useImageVersion() {
  return { imageVersion }
}
