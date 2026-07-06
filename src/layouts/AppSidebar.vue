<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CheckSquare,
  ClipboardList,
  ChevronLeft,
  LogOut,
} from 'lucide-vue-next'
import type { Component } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useAuth } from '@/composables/useAuth'

interface NavItem {
  label: string
  icon: Component
  routeName?: string
}

const { isMobileOpen } = defineProps<{
  isMobileOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'update:mobileOpen', v: boolean): void
}>()

const route = useRoute()
const authStore = useAuthStore()
const { logout } = useAuth()

const isCollapsed = ref(false)

const navItems = computed<NavItem[]>(() => {
  if (authStore.isAdmin) {
    return [
      { label: 'Dashboard', icon: LayoutDashboard, routeName: 'admin' },
      { label: 'Mentors', icon: Users },
      { label: 'Trainees', icon: GraduationCap },
      { label: 'Evaluations', icon: ClipboardList, routeName: 'evaluations' },
    ]
  }
  if (authStore.isMentor) {
    return [
      { label: 'Dashboard', icon: LayoutDashboard, routeName: 'mentor' },
      { label: 'My Trainees', icon: Users },
      { label: 'Tasks', icon: CheckSquare },
      { label: 'Evaluations', icon: ClipboardList, routeName: 'evaluations' },
    ]
  }
  if (authStore.isTrainee) {
    return [
      { label: 'My Tasks', icon: CheckSquare, routeName: 'trainee' },
      { label: 'My Evaluation', icon: ClipboardList },
    ]
  }
  return [{ label: 'Dashboard', icon: LayoutDashboard, routeName: 'admin' }]
})

const userInitials = computed(() => {
  const name = authStore.profile?.full_name ?? ''
  return (
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  )
})

const roleLabel = computed(() => {
  const r = authStore.role
  if (r === 'admin') return 'Admin'
  if (r === 'mentor') return 'Mentor'
  if (r === 'trainee') return 'Trainee'
  if (r === 'team_lead') return 'Team Lead'
  return 'User'
})

const trackAvatarColor: Record<string, string> = {
  frontend: '#6366f1',
  devops: '#f97316',
  python: '#ca8a04',
  qa: '#0d9488',
  typescript: '#3b82f6',
  performance: '#a855f7',
  security: '#ef4444',
}

const avatarBg = computed(() => {
  const track = authStore.profile?.track
  return track ? (trackAvatarColor[track] ?? '#475569') : '#475569'
})

function isActive(routeName?: string) {
  if (!routeName) return false
  return route.name === routeName
}

function closeOnMobile() {
  emit('update:mobileOpen', false)
}
</script>

<template>
  <!-- Backdrop (mobile only) -->
  <Transition name="sidebar-backdrop">
    <div
      v-if="isMobileOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 md:hidden"
      @click="closeOnMobile"
    />
  </Transition>

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-50 flex flex-col',
      'bg-[#0c0e12] border-r border-white/[0.06]',
      'transition-all duration-300 ease-in-out',
      /* Mobile: slide in/out */
      isMobileOpen ? 'translate-x-0' : '-translate-x-full',
      /* Desktop: always visible, width-based collapse */
      'md:relative md:translate-x-0 md:inset-auto md:z-auto',
      isCollapsed ? 'md:w-[60px]' : 'md:w-[240px]',
      /* Mobile always full width */
      'w-[240px]',
    ]"
  >
    <!-- Brand -->
    <div
      :class="[
        'flex items-center h-14 border-b border-white/[0.06] shrink-0',
        isCollapsed ? 'px-0 justify-center' : 'px-4 gap-3',
      ]"
    >
      <!-- Logo mark -->
      <div class="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
        <span class="text-white text-xs font-bold font-mono leading-none">SI</span>
      </div>
      <!-- Name — fades out when collapsed -->
      <div
        :class="[
          'overflow-hidden transition-all duration-200',
          isCollapsed ? 'md:max-w-0 md:opacity-0' : 'max-w-[160px] opacity-100',
        ]"
      >
        <p class="text-white text-sm font-semibold whitespace-nowrap leading-tight">Sitech</p>
        <p class="text-white/40 text-[10px] whitespace-nowrap leading-tight tracking-wide uppercase">
          Internship Platform
        </p>
      </div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
      <div v-for="item in navItems" :key="item.label" class="group/item relative">
        <!-- Linked item -->
        <RouterLink
          v-if="item.routeName"
          :to="{ name: item.routeName }"
          custom
          v-slot="{ navigate }"
        >
          <button
            :class="[
              'w-full flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-all duration-150',
              isActive(item.routeName)
                ? 'bg-indigo-500/10 text-indigo-300'
                : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]',
              isCollapsed ? 'md:justify-center md:px-0' : '',
            ]"
            @click="() => { navigate(); closeOnMobile() }"
          >
            <!-- Active indicator bar -->
            <span
              v-if="isActive(item.routeName)"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-indigo-400"
              style="box-shadow: 0 0 6px 1px rgba(129, 140, 248, 0.5)"
            />
            <component
              :is="item.icon"
              :size="16"
              :class="isActive(item.routeName) ? 'text-indigo-400' : ''"
              class="shrink-0"
            />
            <span
              :class="[
                'overflow-hidden whitespace-nowrap transition-all duration-200',
                isCollapsed ? 'md:max-w-0 md:opacity-0' : 'max-w-[160px] opacity-100',
              ]"
            >
              {{ item.label }}
            </span>
          </button>
        </RouterLink>

        <!-- Unlinked item (coming soon) -->
        <div
          v-else
          :class="[
            'w-full flex items-center gap-3 rounded-md px-2 py-2 text-sm cursor-default',
            'text-white/20',
            isCollapsed ? 'md:justify-center md:px-0' : '',
          ]"
        >
          <component :is="item.icon" :size="16" class="shrink-0" />
          <span
            :class="[
              'overflow-hidden whitespace-nowrap transition-all duration-200',
              isCollapsed ? 'md:max-w-0 md:opacity-0' : 'max-w-[160px] opacity-100',
            ]"
          >
            {{ item.label }}
          </span>
        </div>

        <!-- Tooltip (desktop collapsed only) -->
        <div
          :class="[
            'absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50',
            'bg-[#1a1d24] border border-white/[0.08] text-white/80 text-xs',
            'px-2.5 py-1.5 rounded-md whitespace-nowrap pointer-events-none shadow-lg',
            'opacity-0 group-hover/item:opacity-100 transition-opacity duration-150',
            isCollapsed ? 'md:block hidden' : 'hidden',
          ]"
        >
          {{ item.label }}
          <span v-if="!item.routeName" class="ml-1.5 text-white/30 text-[10px]">soon</span>
        </div>
      </div>
    </nav>

    <!-- Collapse toggle (desktop only) -->
    <button
      class="hidden md:flex items-center justify-center mx-2 mb-2 h-8 rounded-md text-white/20 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-150"
      @click="isCollapsed = !isCollapsed"
    >
      <ChevronLeft
        :size="15"
        :class="['transition-transform duration-300', isCollapsed ? 'rotate-180' : '']"
      />
    </button>

    <!-- User profile -->
    <div class="border-t border-white/[0.06] p-2 shrink-0">
      <div
        :class="[
          'flex items-center gap-3 rounded-md px-2 py-2',
          isCollapsed ? 'md:justify-center md:px-0' : '',
        ]"
      >
        <!-- Avatar -->
        <div
          class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
          :style="{ backgroundColor: avatarBg }"
        >
          {{ userInitials }}
        </div>

        <!-- Name + role -->
        <div
          :class="[
            'flex-1 overflow-hidden transition-all duration-200 min-w-0',
            isCollapsed ? 'md:max-w-0 md:opacity-0' : 'max-w-[120px] opacity-100',
          ]"
        >
          <p class="text-white/80 text-xs font-medium whitespace-nowrap truncate leading-tight">
            {{ authStore.profile?.full_name ?? 'Loading...' }}
          </p>
          <p class="text-white/30 text-[10px] whitespace-nowrap leading-tight">{{ roleLabel }}</p>
        </div>

        <!-- Sign out -->
        <button
          :class="[
            'text-white/20 hover:text-rose-400 transition-colors duration-150 shrink-0',
            isCollapsed ? 'md:hidden' : '',
          ]"
          title="Sign out"
          @click="logout"
        >
          <LogOut :size="14" />
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-backdrop-enter-active,
.sidebar-backdrop-leave-active {
  transition: opacity 0.25s ease;
}
.sidebar-backdrop-enter-from,
.sidebar-backdrop-leave-to {
  opacity: 0;
}
</style>
