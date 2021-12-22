import Rdsex from '../src'
import assert from 'assert';
import IORedis from 'ioredis';
import * as Redis from 'redis';

(async function() {
  const rds1 = new IORedis()
  testRedis(rds1, async () => {
    await rds1.flushdb()
  }, 'ioredis')

  const rds2 = Redis.createClient()
  await rds2.connect()
  testRedis(rds2, async () => {
    await rds2.flushDb()
  }, 'redis')
})()

function testRedis(
  redis: Rdsex.RedisLike,
  flushdb: () => Promise<void>,
  name: string
) {
  describe(`test ${name}`, () => {
    const rdsex = new Rdsex(redis)
  
    beforeEach(async () => {
      await flushdb()
    })
  
    it("incrBetween", async () => {
      assert.strictEqual(
        await rdsex.incrBetween('k', 1, 1, 1),
        1
      )
  
      assert.strictEqual(
        await rdsex.incrBetween('k2', 1, 0, 0),
        null
      )
    })
  
    it('hincrBetween', async () => {
      assert.strictEqual(
        await rdsex.hincrBetween('k', 'field', 1, 1, 1),
        1
      )
      assert.strictEqual(
        await rdsex.hincrBetween('k', 'field2', 1, 0, 0),
        null
      )
    })
  
    it('zincrBetween', async () => {
      assert.strictEqual(
        await rdsex.zincrBetween('k', 'member', 1, 1, 1),
        1
      )
      assert.strictEqual(
        await rdsex.zincrBetween('k', 'member2', 1, 0, 0),
        null
      )
    })
  })
}
