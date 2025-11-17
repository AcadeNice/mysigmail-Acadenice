<script setup lang="ts">
import { computed } from 'vue'

import { useAccess } from '@/composables/useAccess'

import { main } from './navigation'

const { isUser } = useAccess()

// скрываем пункты с requiresUser для гостя
const navItems = computed(() =>
  main.filter((item: any) => {
    if (item.requiresUser && !isUser.value) return false
    return true
  }),
)
</script>

<template>
  <div data-sidebar-nav>
    <template
      v-for="i in navItems"
      :key="i.path"
    >
      <a
        v-if="i.path.startsWith('http')"
        :href="i.path"
      >
        <SidebarNavItem
          :icon="i.icon"
          :name="i.name"
        />
      </a>
      <RouterLink
        v-else
        v-slot="{ navigate, isActive }"
        :to="i.path"
      >
        <SidebarNavItem
          :icon="i.icon"
          :name="i.name"
          :is-active="isActive"
          @click="navigate"
        />
      </RouterLink>
    </template>
  </div>
</template>
