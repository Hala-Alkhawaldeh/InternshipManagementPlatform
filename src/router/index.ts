import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { profilesService } from '@/services/profiles.service'
import type { Profile } from '@/types/app.types'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: string[]
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      // Layout shell — all authenticated pages live here
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '/admin',
          name: 'admin',
          component: () => import('@/pages/admin/AdminDashboard.vue'),
          meta: { requiresAuth: true, roles: ['admin'] },
        },
        {
          path: '/mentor',
          name: 'mentor',
          component: () => import('@/pages/mentor/MentorDashboard.vue'),
          meta: { requiresAuth: true, roles: ['mentor'] },
        },
        {
          path: '/trainee',
          name: 'trainee',
          component: () => import('@/pages/trainee/TraineeDashboard.vue'),
          meta: { requiresAuth: true, roles: ['trainee'] },
        },
        {
          path: '/evaluations',
          name: 'evaluations',
          component: () => import('@/pages/evaluations/EvaluationsPage.vue'),
          meta: { requiresAuth: true, roles: ['admin', 'mentor'] },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue'),
    },
  ],
})

// Restores session + profile from Supabase before the first navigation resolves,
// so the guard below never runs against a not-yet-hydrated auth store. Without
// this, a hard refresh races App.vue's session restore against this guard and
// can misroute an authenticated user to the trainee dashboard by default.
let authReady: Promise<void> | null = null

function restoreAuth(): Promise<void> {
  const authStore = useAuthStore()

  return (async () => {
    const { data } = await authService.getSession()
    if (!data.session) return

    authStore.setSession(data.session)
    const { data: profile } = await profilesService.getMyProfile()
    if (profile) authStore.setProfile(profile as Profile)
  })()
}

router.beforeEach(async (to) => {
  authReady ??= restoreAuth()
  await authReady

  const authStore = useAuthStore()

  // Not authenticated → send to login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  // Already logged in, visiting /login → send to own dashboard
  if (to.name === 'login' && authStore.isAuthenticated) {
    return roleDashboard(authStore.role)
  }

  // Wrong role for this route → send to own dashboard
  const allowed = to.meta.roles
  if (allowed && authStore.role && !allowed.includes(authStore.role)) {
    return roleDashboard(authStore.role)
  }
})

function roleDashboard(role: string | null) {
  if (role === 'admin') return { name: 'admin' }
  if (role === 'mentor') return { name: 'mentor' }
  return { name: 'trainee' }
}

export default router
