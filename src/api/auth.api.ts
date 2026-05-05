import axios from 'axios'
import type { ApiResponse, AuthTokens, ForgotPasswordRequest, ResetPasswordRequest, SignInRequest, SignUpRequest } from '../types'

const authClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export const authApi = {
  signIn: (data: SignInRequest) =>
    authClient.post<ApiResponse<AuthTokens>>('/auth/sign-in', data).then((r) => r.data),

  signUp: (data: SignUpRequest) =>
    authClient.post<ApiResponse<{ id: string; email: string }>>('/auth/sign-up', data).then((r) => r.data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    authClient.post<ApiResponse<string | null>>('/auth/forgot-password', data).then((r) => r.data),

  resetPassword: (userId: string, data: ResetPasswordRequest) =>
    authClient.post<ApiResponse<null>>(`/auth/${userId}/reset-password`, data).then((r) => r.data),
}
