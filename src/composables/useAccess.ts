import { computed, ref } from 'vue'

type Role = 'guest' | 'user'

const role = ref<Role>('guest')
const loadingRole = ref(true)

/** ключ для localStorage */
const GUEST_OK_KEY = 'acadenice_guest_ok'

/** было: ref(false) */
const guestContinued = ref<boolean>(false)

/** подхватываем сохранённое значение при старте */
try {
  guestContinued.value = localStorage.getItem(GUEST_OK_KEY) === '1'
} catch {
  /* noop */
}

async function refreshRole() {
  loadingRole.value = true
  try {
    const res = await fetch('/api/auth/status', { credentials: 'include' })
    const data = await res.json()
    role.value = data?.role === 'user' ? 'user' : 'guest'
  } catch {
    role.value = 'guest'
  } finally {
    loadingRole.value = false
  }
}

async function login(password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) {
    let msg = 'Login failed'
    try {
      msg = (await res.json())?.error ?? msg
    } catch {}
    throw new Error(msg)
  }
  await refreshRole()
  // для user гейт не нужен, чистим флаг гостя
  try {
    localStorage.removeItem(GUEST_OK_KEY)
  } catch {}
  guestContinued.value = false
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
  role.value = 'guest'
  // после явного логаута — снова показываем гейт
  guestContinued.value = false
  try {
    localStorage.removeItem(GUEST_OK_KEY)
  } catch {}
}

function setRole(next: Role) {
  role.value = next
}

/** <- ВАЖНО: сохраняем маркер в localStorage */
function continueAsGuest() {
  guestContinued.value = true
  try {
    localStorage.setItem(GUEST_OK_KEY, '1')
  } catch {}
}

const isUser = computed(() => role.value === 'user')
const isGuest = computed(() => role.value === 'guest')
const unlocked = computed(() => isUser.value || guestContinued.value)

refreshRole()

export function useAccess() {
  return {
    role,
    isUser,
    isGuest,
    unlocked,
    loadingRole,
    login,
    logout,
    continueAsGuest,
    refreshRole,
    setRole,
  }
}
