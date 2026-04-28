import { message } from 'antd'
import axios, { type AxiosError, type Method } from 'axios'

import { BASE_URL } from '@pc/constant'
import router from '@pc/router'
import { ensureAuthSessionValid } from '@pc/services/authSession'
import { useUserStore } from '@pc/store/useUserStore'

// 请求实例
const instance = axios.create({
  baseURL: BASE_URL, // 基地址
  timeout: 30000,
  withCredentials: true
})

// 免token鉴权白名单
const whiteList = [
  '/users/login',
  '/users/register',
  '/users/register-captcha',
  '/users/refresh-token'
]

// 请求拦截器
instance.interceptors.request.use(
  async function (config) {
    // 检查是否在白名单中
    const isWhitelisted = whiteList.some((url) => config.url?.includes(url))

    // 如果在白名单中，不需要token验证
    if (isWhitelisted) {
      return config
    }

    const refreshedToken = await ensureAuthSessionValid()
    const { token } = useUserStore.getState()

    // 添加token到请求头
    config.headers['Authorization'] = `Bearer ${refreshedToken || token}`

    return config
  },
  function (error) {
    return Promise.reject(error)
  }
)

// 添加响应拦截器
instance.interceptors.response.use(
  function (response) {
    // 注意，请求状态码!==业务状态码
    const { code, msg } = response.data
    console.log('响应拦截器', code, msg)
    // 业务统一状态码出错
    if (code === 400 || code === 401 || code === 404) {
      message.error(msg || '请求出错, 请稍后再试')
      return Promise.reject(new Error(msg || '请求出错, 请稍后再试'))
    }

    console.log('响应拦截器', response.data)
    // 数据剥离
    return response.data
  },
  async function (error: AxiosError) {
    if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请稍后重试')
      return Promise.reject(new Error('请求超时，请稍后重试'))
    }

    if (!error.response) {
      message.error('网络异常，请检查网络连接')
      return Promise.reject(new Error('网络异常，请检查网络连接'))
    }

    const status = error.response.status
    const originalRequest = error.config

    if (status === 401 && originalRequest && !originalRequest.headers?.['x-retried']) {
      originalRequest.headers = originalRequest.headers || {}
      originalRequest.headers['x-retried'] = '1'

      const refreshedToken = await ensureAuthSessionValid()
      if (refreshedToken) {
        originalRequest.headers['Authorization'] = `Bearer ${refreshedToken}`
        return instance.request(originalRequest)
      }
    }

    if (status === 403) {
      message.error('没有权限访问该资源')
    } else if (status === 404) {
      message.error('请求资源不存在')
    } else if (status >= 500) {
      message.error('服务器异常，请稍后再试')
    } else if (status === 401) {
      message.warning('当前登录状态有误，请重新登录')
      router.navigate('/login', {
        replace: true
      })
    } else {
      message.error(`请求失败，状态码: ${status}`)
    }

    return Promise.reject(error)
  }
)

export type Data<T> = {
  data: T
  code: string | number
  msg: string | null
}

/**
 * @param url 接口地址
 * @param method 请求方法(默认为GET)
 * @param submitData 请求数据(可选)
 * @returns
 */
export const request = <T>(
  url: string,
  method: Method = 'GET',
  submitData?: object,
  options?: { signal?: AbortSignal }
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return instance.request<any, Data<T>>({
    url,
    method,
    [method.toUpperCase() === 'GET' ? 'params' : 'data']: submitData,
    signal: options?.signal
  })
}
