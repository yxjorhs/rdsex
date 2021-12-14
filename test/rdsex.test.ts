import Rdsex from '../src'
import assert from 'assert';
import IORedis from 'ioredis';

describe("Rdsex", () => {
  const redis = new IORedis()
  const rdsex = new Rdsex(redis)

  beforeEach(async () => {
    await redis.flushdb()
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

  it('lpushTrim', async () => {
    await rdsex.lpushTrim('k', 'v1', 1)

    assert.strictEqual(
      await redis.llen('k'),
      1
    )

    await rdsex.lpushTrim('k', 'v2', 1)

    assert.strictEqual(
      await redis.llen('k'),
      1
    )
    assert.strictEqual(
      await redis.lpop('k'),
      'v2'
    )
  })

  it('rpushTrim', async () => {
    await rdsex.rpushTrim('k', 'v1', 1)

    assert.strictEqual(
      await redis.llen('k'),
      1
    )

    await rdsex.rpushTrim('k', 'v2', 1)

    assert.strictEqual(
      await redis.llen('k'),
      1
    )
    assert.strictEqual(
      await redis.lpop('k'),
      'v2'
    )
  })
})