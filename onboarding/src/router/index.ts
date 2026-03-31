import { createRouter, createWebHistory } from 'vue-router'
import { useOnboardingState } from '@/composables/useOnboardingState'
import { supabase } from '@/lib/supabase'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0, left: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/LandingView.vue'),
      meta: { title: 'Уральский бёрн' },
    },
    {
      path: '/onboarding',
      name: 'start',
      component: () => import('@/views/StartView.vue'),
      meta: { title: 'Начало' },
    },
    {
      path: '/principles',
      name: 'principles',
      component: () => import('@/views/PrinciplesView.vue'),
      meta: { title: '10 принципов подробно' },
    },
    {
      path: '/info',
      name: 'info',
      component: () => import('@/views/InfoView.vue'),
      meta: { title: 'О бёрне и принципах' },
    },
    {
      path: '/attestation',
      name: 'attestation',
      component: () => import('@/views/AttestationView.vue'),
      meta: { title: 'Аттестация' },
    },
    {
      path: '/register',
      redirect: { name: 'certificate' },
    },
    {
      path: '/success',
      redirect: { name: 'certificate' },
    },
    {
      path: '/certificate',
      name: 'certificate',
      component: () => import('@/views/CertificateView.vue'),
      meta: { title: 'Сертификат онбординга' },
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/AdminLoginView.vue'),
      meta: { title: 'Админ вход' },
    },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: () => import('@/views/AdminDashboardView.vue'),
      meta: { title: 'Админ', requiresAdmin: true },
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const { canAccessCertificate } = useOnboardingState()
  if (to.name === 'certificate' && !canAccessCertificate.value) {
    next({ name: 'attestation' })
    return
  }

  if ((to.meta as any)?.requiresAdmin) {
    if (!supabase) {
      next({ name: 'admin-login', query: { unauthorized: '1' } })
      return
    }

    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData?.session) {
      next({ name: 'admin-login', query: { unauthorized: '1' } })
      return
    }

    const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin')
    if (isAdminError || !isAdminData) {
      next({ name: 'admin-login', query: { unauthorized: '1' } })
      return
    }
  }

  next()
})

export default router
