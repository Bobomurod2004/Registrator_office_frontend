import { ref } from 'vue'

export const isMobileMenuOpen = ref(false)

export function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

export function closeMobileMenu() {
  isMobileMenuOpen.value = false
}
