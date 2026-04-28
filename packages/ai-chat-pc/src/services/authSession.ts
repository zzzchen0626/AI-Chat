import { authApi } from '@pc/apis/user'
import { useUserStore } from '@pc/store'

import { calcDefaultAccessTokenExpiresAt, shouldRefreshToken } from './tokenLifecycle'

let refreshPromise: Promise<string | null> | null = null

// access token 带并发锁的自动刷新
async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = authApi
      .refreshToken()
      .then((response) => {
        if (response.code === 1 && response.data?.token) {
          const { user } = useUserStore.getState()

          useUserStore.getState().setAuthSession({
            user,
            token: response.data.token,
            accessTokenExpiresAt: calcDefaultAccessTokenExpiresAt()
          })
          return response.data.token
        }

        return null
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

// 判断是否需要自动刷新
async function resolveAuthSessionToken() {
  const { token, isAuthenticated, accessTokenExpiresAt } = useUserStore.getState()

  if (!token || !isAuthenticated) {
    return null
  }

  if (!shouldRefreshToken(accessTokenExpiresAt)) {
    return token
  }

  const refreshedToken = await refreshAccessToken()
  if (!refreshedToken) {
    clearAuthSession()
    return null
  }

  return refreshedToken
}

// 应用启动时的刷新token检测
export async function initializeAuthSession() {
  await resolveAuthSessionToken()
}

// 请求需要auth的接口时检测
export async function ensureAuthSessionValid() {
  return resolveAuthSessionToken()
}

// 退出登录的清理
export async function logoutSession() {
  try {
    await authApi.logout()
  } finally {
    clearAuthSession()
  }
}

// 设置登录状态
export function setAuthSession(token: string, user = null) {
  useUserStore.getState().setAuthSession({
    user,
    token,
    accessTokenExpiresAt: calcDefaultAccessTokenExpiresAt()
  })
}

export function clearAuthSession() {
  useUserStore.getState().clearAuthSession()
}
