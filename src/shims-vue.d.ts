declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  //  {} → Record<string, never>
  const component: DefineComponent<Record<string, never>, Record<string, never>, any>
  export default component
}
