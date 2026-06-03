<script setup lang="ts">
import { computed } from 'vue'

import { version } from '../../../package.json'

const year = new Date().getFullYear()
const githubRepoUrl = 'https://github.com/AcadeNice/signatures-de-mail-acadenice'

const links = computed(() => [
  { name: 'Acadenice', href: 'https://acadenice.fr/' },
  { name: 'Signatures de mail - AcadéNice', href: githubRepoUrl },
  { name: 'Conditions d’utilisation', href: '/cgu' },
])
</script>

<template>
  <div
    data-footer
    class="text-xs text-muted-foreground text-right space-y-1"
  >
    <p style="margin-left:auto;margin-bottom:.5rem;max-width:34rem;text-align:right;font-size:.75rem;line-height:1.25rem;">
      Cette application est un
      <a
        :href="githubRepoUrl"
        target="_blank"
        rel="noreferrer"
        class="font-semibold text-primary underline-offset-4 hover:underline"
      >fork d’une application open source</a>,
      modifiée pour nos besoins et offerte à nos étudiants ainsi qu’à toute personne qui en a
      besoin.
    </p>

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
          <a
            :href="i.href"
            :target="i.href.startsWith('http') ? '_blank' : undefined"
            :rel="i.href.startsWith('http') ? 'noopener noreferrer' : undefined"
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
