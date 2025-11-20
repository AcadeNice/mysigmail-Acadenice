<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { version } from '../../../package.json'

const year = new Date().getFullYear()

const links = computed(() => [
  { name: 'Acadenice', href: 'https://acadenice.fr/' },
  { name: 'GitHub', href: 'https://github.com/AcadeNice/mysigmail-Acadenice' },
  { name: 'Conditions d’utilisation', to: '/cgu' },
])
</script>

<template>
  <div
    data-footer
    class="text-xs text-muted-foreground text-right space-y-1"
  >
    <div>
      <span
        v-for="i in links"
        :key="i.name"
        class="not-last:after:content-['•'] not-last:after:px-1"
      >
        <UiButton
          variant="link"
          size="link-xs"
        >
          <!-- internal route -->
          <RouterLink
            v-if="i.to"
            :to="i.to"
          >
            {{ i.name }}
          </RouterLink>

          <!-- external link -->
          <a
            v-else
            :href="i.href"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ i.name }}
          </a>
        </UiButton>
      </span>
    </div>

    <div>©{{ year }} • Acadenice</div>
    <div>v{{ version }}</div>
  </div>
</template>
