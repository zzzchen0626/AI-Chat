import { lazy, Suspense } from 'react'
import { createBrowserRouter, createRoutesFromElements, Outlet, Route } from 'react-router-dom'

import App from '@pc/App'
import { LayoutWithSidebar } from '@pc/components/Layout/LayoutWithSidebar'
import { PageTransition } from '@pc/components/PageTransition/PageTransition'
import { WithPermission } from '@pc/components/WithPermission/WithPermission'

const Login = lazy(() => import('@pc/pages/Login'))
const CreateAccount = lazy(() => import('@pc/pages/CreateAccount'))
const SharedChat = lazy(() => import('@pc/pages/SharedChat'))
const Home = lazy(() => import('@pc/pages/Home'))
const Agents = lazy(() => import('@pc/pages/Agents'))
// const ConversationDetail = lazy(() => import('@pc/pages/ConversationDetail'))

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-gray-500 dark:text-gray-400">加载中...</div>
    </div>
  )
}

function LazyRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

// 创建React Router路由
const routeElements = createRoutesFromElements(
  <Route path="/" element={<App />}>
    <Route
      element={
        <PageTransition>
          <Outlet />
        </PageTransition>
      }>
      <Route
        path="/login"
        element={
          <LazyRoute>
            <Login />
          </LazyRoute>
        }
      />
      <Route
        path="/create-account"
        element={
          <LazyRoute>
            <CreateAccount />
          </LazyRoute>
        }
      />
      {/* 分享会话路由 - 不需要登录验证 */}
      <Route
        path="/shared/:shareId"
        element={
          <LazyRoute>
            <SharedChat />
          </LazyRoute>
        }
      />
    </Route>
    <Route
      element={
        <WithPermission>
          <LayoutWithSidebar />
        </WithPermission>
      }>
      <Route path="/" element={<Home />} />
      <Route path="/conversation" element={<Home />} />
      <Route path="/conversation/:id" element={<Home />} />
      <Route
        path="/agents"
        element={
          <LazyRoute>
            <Agents />
          </LazyRoute>
        }
      />
    </Route>
  </Route>
)

const router = createBrowserRouter(routeElements)

export default router
