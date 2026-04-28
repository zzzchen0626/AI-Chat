const ACCESS_TOKEN_EXPIRE_MS = 15 * 60 * 1000
const ACCESS_TOKEN_REFRESH_SKEW_MS = 2 * 60 * 1000

// 是否到达自动刷新区间
export function shouldRefreshToken(expiresAt?: number | null) {
  if (!expiresAt) {
    return false
  }

  return expiresAt - Date.now() <= ACCESS_TOKEN_REFRESH_SKEW_MS
}

// 计算到期时间
export function calcDefaultAccessTokenExpiresAt() {
  return Date.now() + ACCESS_TOKEN_EXPIRE_MS
}
