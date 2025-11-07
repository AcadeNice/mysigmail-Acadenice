/* eslint-disable */
/* prettier-ignore */
import 'vue'
import 'vue-router'

declare global {
  const computed: typeof import('vue')['computed']
  const watch: typeof import('vue')['watch']
  const ref: typeof import('vue')['ref']
  const shallowRef: typeof import('vue')['shallowRef']
  const reactive: typeof import('vue')['reactive']
  const toRefs: typeof import('vue')['toRefs']
  const unref: typeof import('vue')['unref']
  const markRaw: typeof import('vue')['markRaw']
  const nextTick: typeof import('vue')['nextTick']
  const onMounted: typeof import('vue')['onMounted']
  const onBeforeUnmount: typeof import('vue')['onBeforeUnmount']
  const onUnmounted: typeof import('vue')['onUnmounted']
  const useRoute: typeof import('vue-router')['useRoute']
  const useRouter: typeof import('vue-router')['useRouter']
}

export {}

