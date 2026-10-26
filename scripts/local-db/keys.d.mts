export const LOCAL_JWT_SECRET: string
export function signApiKey(jwtSecret: string, role: string): Promise<string>
export function localKeys(): Promise<{ url: string; anonKey: string; serviceKey: string; jwtSecret: string }>
