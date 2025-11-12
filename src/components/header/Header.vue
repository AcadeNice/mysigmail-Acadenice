<template>
  <div
    data-header
    class="p-3 pr-6 flex items-center justify-between gap-4"
  >
    <RouterLink to="/basic">
      <div class="flex items-center">
        <img
          src="/logo_acadenice.png"
          alt="Acadenice"
          class="w-[88px]"
        >
      </div>
    </RouterLink>
    <div class="flex items-center gap-3">
      <HeaderColorMode />
    </div>
  </div>
</template>
