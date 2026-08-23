<!-- The Intently mark: four bracket corners around a scheduled block.
     Frame inherits currentColor; the block uses --mark-dot so each surface
     (app themes, landing page) can set its own accent. -->
<template>
  <svg
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    stroke-width="6"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <path d="M8 26 L8 16 A8 8 0 0 1 16 8 L26 8" />
    <path d="M38 8 L48 8 A8 8 0 0 1 56 16 L56 26" />
    <path d="M56 38 L56 48 A8 8 0 0 1 48 56 L38 56" />
    <path d="M26 56 L16 56 A8 8 0 0 1 8 48 L8 38" />
    <rect x="26" y="26" width="12" height="12" rx="4" fill="var(--mark-dot, currentColor)" stroke="none" />
  </svg>
</template>
