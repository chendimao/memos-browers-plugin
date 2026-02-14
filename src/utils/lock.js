const ensureCrypto = () => {
  if (!globalThis.crypto?.subtle) {
    throw new Error('当前环境不支持安全加密能力')
  }
}

const bytesToHex = (buffer) => {
  const bytes = new Uint8Array(buffer)
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export const hashPassword = async (password) => {
  if (!password || !password.trim()) {
    throw new Error('密码不能为空')
  }

  ensureCrypto()
  const text = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', text)
  return bytesToHex(digest)
}

export const verifyPassword = async (password, passwordHash) => {
  if (!passwordHash) {
    return false
  }
  const hash = await hashPassword(password)
  return hash === passwordHash
}
