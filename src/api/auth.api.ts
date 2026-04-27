import axios from 'axios'
import type { ApiResponse, AuthTokens, SignInRequest, SignUpRequest } from '../types'

const authClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export const authApi = {
  signIn: (data: SignInRequest) =>
    authClient.post<ApiResponse<AuthTokens>>('/auth/sign-in', data).then((r) => r.data),

  signUp: (data: SignUpRequest) =>
    authClient.post<ApiResponse<{ id: string; email: string }>>('/auth/sign-up', data).then((r) => r.data),
}
