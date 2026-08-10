export interface User {
    id: string
    user_name: string
    auth_id: string
    role_id: string
    status: string
    email?: string
    mobile_number?: string
}

export interface AuthState {
    token: string | null
    user: User | null
}
