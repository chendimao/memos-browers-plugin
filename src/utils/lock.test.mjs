import test from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword } from './lock.js'

test('hashPassword 生成稳定的 64 位十六进制哈希', async () => {
  const hashA = await hashPassword('abc123')
  const hashB = await hashPassword('abc123')

  assert.equal(hashA, hashB)
  assert.equal(hashA.length, 64)
  assert.match(hashA, /^[a-f0-9]{64}$/)
})

test('verifyPassword 对正确密码返回 true，错误密码返回 false', async () => {
  const hash = await hashPassword('password-1')
  assert.equal(await verifyPassword('password-1', hash), true)
  assert.equal(await verifyPassword('password-2', hash), false)
})

test('hashPassword 对空密码抛错', async () => {
  await assert.rejects(() => hashPassword(''), /密码不能为空/)
})
