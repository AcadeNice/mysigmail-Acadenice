<script setup lang="ts"></script>

<template>
  <div
    data-layout-default
    class="h-screen grid grid-cols-[85px_550px_1fr] grid-rows-[50px_1fr]"
  >
    <Header class="col-span-3 border-b" />
    <Sidebar class="border-r overflow-y-auto" />
    <div
      data-main
      class="px-6 py-4 overflow-y-auto"
    >
      <div class="mb-4">
        <h1 class="text-2xl font-semibold leading-thin mb-2">
          {{ $route.meta.title }}
        </h1>
        <p
          v-if="$route.meta.description"
          class="text-sm text-muted-foreground"
        >
          {{ $route.meta.description }}
        </p>
      </div>
      <div>
        <slot />
      </div>
    </div>
    <div
      data-preview
      class="p-6 overflow-y-auto"
      style="background: linear-gradient(135deg, #fff 0%, #fff 48%, rgba(76, 204, 184, 0.18) 100%);"
    >
      <Preview />
    </div>
  </div>
</template>
