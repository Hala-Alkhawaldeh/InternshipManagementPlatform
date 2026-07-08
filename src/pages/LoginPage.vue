<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { login, loading } = useAuth()

const email = ref('')
const password = ref('')

const isDev = import.meta.env.DEV

const devAccounts = [
  { label: 'Admin', email: 'admin@sitech.me', color: '#6366f1' },
  { label: 'Mentor', email: 'mentor@sitech.me', color: '#14b8a6' },
  { label: 'Trainee', email: 'trainee@sitech.me', color: '#f97316' },
]

async function handleSubmit() {
  await login(email.value, password.value)
}

async function quickLogin(account: { email: string }) {
  email.value = account.email
  password.value = 'test1234'
  await login(account.email, 'test1234')
}
</script>

<template>
  <div
    class="min-h-screen bg-[#0c0e12] flex items-center justify-center p-5 relative overflow-hidden"
  >
    <!-- Animated dot grid -->
    <div class="absolute inset-0 dot-grid" />

    <!-- Subtle radial glow behind the card -->
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
      style="background: radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)"
    />

    <!-- Content -->
    <div class="relative z-10 w-full max-w-[380px]">
      <!-- Brand mark — animates in first -->
      <div class="brand-mark flex items-center gap-3 mb-8 justify-center">
        <div
          class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg"
          style="box-shadow: 0 0 20px rgba(99,102,241,0.35)"
        >
          <span class="text-white font-bold font-mono text-sm leading-none">SI</span>
        </div>
        <div>
          <p class="text-white font-semibold text-base leading-tight">Sitech</p>
          <p class="text-white/35 text-[11px] leading-tight tracking-wide">Internship Platform</p>
        </div>
      </div>

      <!-- Form card — animates in after brand -->
      <div class="login-card bg-white rounded-2xl p-8" style="box-shadow: 0 32px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)">
        <!-- Heading -->
        <div class="mb-7">
          <h1 class="text-gray-900 text-[22px] font-semibold tracking-tight leading-tight">
            Welcome back
          </h1>
          <p class="text-gray-500 text-sm mt-1.5 leading-relaxed">
            Sign in to your Sitech account to continue
          </p>
        </div>

        <!-- Form -->
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <!-- Email -->
          <div>
            <label
              for="email"
              class="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2"
            >
              Email
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              placeholder="you@sitech.me"
              class="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/80 text-sm text-gray-900 placeholder:text-gray-300 outline-none transition-all duration-200 focus:border-indigo-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(129,140,248,0.12)]"
            />
          </div>

          <!-- Password -->
          <div>
            <label
              for="password"
              class="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2"
            >
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              placeholder="••••••••"
              class="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/80 text-sm text-gray-900 placeholder:text-gray-300 outline-none transition-all duration-200 focus:border-indigo-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(129,140,248,0.12)]"
            />
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="submit-btn w-full py-2.5 mt-1 rounded-lg bg-[#0c0e12] text-white text-sm font-medium transition-all duration-150 hover:bg-[#181b22] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
          >
            <span v-if="loading" class="btn-spinner" />
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
      </div>

      <!-- Dev quick-login (only in development) -->
      <div v-if="isDev" class="mt-4">
        <p class="text-center text-white/25 text-[10px] uppercase tracking-widest mb-2.5">
          Dev shortcuts
        </p>
        <div class="flex gap-2">
          <button
            v-for="account in devAccounts"
            :key="account.label"
            :disabled="loading"
            class="flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-150 hover:opacity-90 active:scale-95 disabled:opacity-40"
            :style="{ backgroundColor: account.color + '22', color: account.color, border: `1px solid ${account.color}33` }"
            @click="quickLogin(account)"
          >
            {{ account.label }}
          </button>
        </div>
      </div>

      <!-- Footer -->
      <p class="text-center text-white/20 text-xs mt-5 leading-relaxed">
        Access is managed by your Sitech admin
      </p>
    </div>
  </div>
</template>

<style scoped>
/* ── Background dot grid ─────────────────────────────────────────── */
.dot-grid {
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.18) 1px, transparent 1px);
  background-size: 28px 28px;
  animation: grid-breathe 12s ease-in-out infinite alternate;
}

@keyframes grid-breathe {
  0%   { opacity: 0.55; background-position: 0px 0px; }
  50%  { opacity: 0.75; background-position: 7px 14px; }
  100% { opacity: 0.55; background-position: 14px 0px; }
}

/* ── Brand mark entrance ─────────────────────────────────────────── */
.brand-mark {
  animation: slide-down 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Card entrance (delayed after brand) ─────────────────────────── */
.login-card {
  animation: card-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
}

@keyframes card-rise {
  from { opacity: 0; transform: translateY(18px) scale(0.975); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Submit button shine sweep on hover ──────────────────────────── */
.submit-btn {
  position: relative;
  overflow: hidden;
}

.submit-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%);
  transform: translateX(-100%);
  transition: transform 0s;
}

.submit-btn:not(:disabled):hover::after {
  transform: translateX(100%);
  transition: transform 0.45s ease;
}

/* ── Loading spinner ─────────────────────────────────────────────── */
.btn-spinner {
  display: inline-block;
  width: 13px;
  height: 13px;
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
