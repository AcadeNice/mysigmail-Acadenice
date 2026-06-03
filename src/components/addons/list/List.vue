<script setup lang="ts">
import type { AddonTool } from '@/composables/signatures/types'

import { addons as addonsData } from '@/data/addons'

const { addons } = useSignatures()
const { isUser } = useAccess()

const addonsList = computed(() => {
  return addonsData
    .filter((a) => isUser.value || a.type !== 'trackingPixel')
    .filter((a) => !addons.value.find((b) => b.type === a.type))
})

function addAddon(addon: AddonTool) {
  addons.value.push(addon)
}
</script>

<template>
  <div>
    <h3>Installés</h3>
    <div class="space-y-2 mb-4">
      <template v-if="addons.length > 0">
        <AddonsListItemInstaled
          v-for="addon in addons"
          :key="addon.type"
          :name="addon.label"
          :type="addon.type"
        />
      </template>
      <div
        v-else
        class="text-sm text-muted-foreground"
      >
        Aucun module installé
      </div>
    </div>
  </div>
  <div>
    <h3>Modules</h3>
    <div>
      <AddonsListItem
        v-for="addon in addonsList"
        :key="addon.type"
        :name="addon.label"
        :is-new="addon.isNew"
        @click="addAddon(addon)"
      />
    </div>
  </div>
</template>
