<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md'
  }>(),
  { size: 'sm' },
)
</script>

<template>
  <span class="app-logo" :class="`app-logo--${size}`" role="img" aria-label="UzSWLU">
    <span class="app-logo__mark" />
  </span>
</template>

<style scoped>
.app-logo {
  --logo-size: 52px;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

.app-logo--md {
  --logo-size: 60px;
}

/* Qora fon mask orqali olib tashlanadi — faqat yorug qism (gerb) ko'rinadi */
.app-logo__mark {
  width: var(--logo-size);
  height: var(--logo-size);
  display: block;
  background: linear-gradient(155deg, #3ef5ad 0%, #1adfa0 42%, #00c4e0 100%);
  -webkit-mask-image: url('/16976310475940.png');
  mask-image: url('/16976310475940.png');
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-mode: luminance;
  mask-mode: luminance;
}
</style>
