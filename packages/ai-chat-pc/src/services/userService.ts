import { authApi } from '@pc/apis/user'
import { useUserStore } from '@pc/store'

import { clearAuthSession, logoutSession, setAuthSession } from './authSession'

import type { LoginParams, RegisterParams, CaptchaParams } from '@pc/types/user'

export const userService = {
  async login(params: LoginParams) {
    try {
      useUserStore.getState().setLoading(true)
      useUserStore.getState().setError(null)

      const response = await authApi.login(params)

      if (response.code === 1) {
        setAuthSession(response.data.token)
        useUserStore.setState((state) => ({
          ...state,
          user: {
            nickName: response.data.nickName
          }
        }))
      } else {
        throw new Error(response.msg || '登录失败')
      }
    } catch (error) {
      useUserStore.setState({
        loading: false,
        error: error instanceof Error ? error.message : '登录失败'
      })
      throw error
    }
  },

  async createAccount(params: RegisterParams) {
    try {
      useUserStore.getState().setLoading(true)
      useUserStore.getState().setError(null)

      const response = await authApi.register(params)

      if (response.code === 1) {
        // 注册成功后，自动登录
        await this.login({
          userName: params.userName,
          password: params.password
        })
      } else {
        throw new Error(response.msg || '注册失败')
      }
    } catch (error) {
      useUserStore.setState({
        loading: false,
        error: error instanceof Error ? error.message : '注册失败'
      })
      throw error
    }
  },

  async sendCaptcha(params: CaptchaParams) {
    try {
      useUserStore.getState().setLoading(true)
      useUserStore.getState().setError(null)

      const response = await authApi.sendCaptcha(params)

      if (response.code !== 1) {
        throw new Error(response.msg || '验证码发送失败')
      }

      useUserStore.getState().setLoading(false)
    } catch (error) {
      useUserStore.setState({
        loading: false,
        error: error instanceof Error ? error.message : '验证码发送失败'
      })
      throw error
    }
  },

  async logout() {
    await logoutSession()
  },

  clearLocalAuth() {
    clearAuthSession()
  }
}
