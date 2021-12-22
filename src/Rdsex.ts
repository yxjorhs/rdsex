import assert from "assert";
import lua from "./lua";

/**
 * redis expand function with lua scripts
 */
class Rdsex {
  /** store lua script sha */
  private shaStore = new Map<keyof typeof lua, string>()

  /**
   * @param {Rdsex.RedisLike} redis redis instance
   */
  constructor(
      readonly redis: Rdsex.RedisLike,
  ) {
    this.scriptLoadAll()
  }

  /**
   * incr {key} with {increment}, limit result between {minVal} and
   * {maxVal}, return number while success, otherwise return null
   * @param {string} key
   * @param {number} increament
   * @param {number} minVal
   * @param {number} maxVal
   * @param {number} pexpireAt
   * @return {number | null}
   */
  public async incrBetween(
      key: string,
      increament: number,
      minVal: number,
      maxVal: number,
      pexpireAt?: number,
  ): Promise<number | null> {
    return this.evalsha(
      await this.shaGet('incrBetween'),
      [key],
      [increament, minVal, maxVal, pexpireAt]
    );
  }

  /**
   * hincr {key} {field} with {increment}, limit result between {minVal} and
   * {maxVal}, return number while success, otherwise return null
   * @param {string} key
   * @param {string} field
   * @param {number} increament
   * @param {number} minVal
   * @param {number} maxVal
   * @param {number} pexpireAt
   * @return {number | null}
   */
  public async hincrBetween(
      key: string,
      field: string | number,
      increament: number,
      minVal: number,
      maxVal: number,
      pexpireAt?: number,
  ): Promise<number | null> {
    return this.evalsha(
        await this.shaGet('hincrBetween'),
        [key],
        [
          field,
          increament,
          minVal,
          maxVal,
          pexpireAt,
        ]
    );
  }

  /**
   * zincr {key} {member} with {increment}, limit result between {minVal} and
   * {maxVal}, return number while success, otherwise return null
   * @param {string} key
   * @param {string} member
   * @param {number} increament
   * @param {number} minVal
   * @param {number} maxVal
   * @param {number} pexpireAt
   * @return {number | null}
   */
  public async zincrBetween(
      key: string,
      member: string | number,
      increament: number,
      minVal: number,
      maxVal: number,
      pexpireAt?: number,
  ): Promise<number | null> {
    return this.evalsha(
        await this.shaGet('zincrBetween'),
        [key],
        [
          member,
          increament,
          minVal,
          maxVal,
          pexpireAt,
        ]
    );
  }

  private async evalsha(
    sha: string,
    keys?: string[],
    args?: any[]
  ): Promise<any> {
    let ret: any | undefined
    keys = keys || []
    args = args || []

    ret = this.redis.evalSha && await this.redis.evalSha(sha, {
      keys,
      arguments: args.map(v => {
        if (v === undefined || v === null) return ''
        if (typeof v === 'number') return v.toString()
        return v
      })
    })

    if (ret !== undefined) return ret

    ret = this.redis.evalsha && await this.redis.evalsha(sha, keys.length, ...keys, ...args)

    assert(ret !== undefined, 'evalsha fail' )

    return ret
  }

  private async scriptLoad(script: string): Promise<string> {
    let ret: string | undefined

    ret = this.redis.scriptLoad && await this.redis.scriptLoad(script)

    if (ret !== undefined) return ret

    ret = this.redis.script && await this.redis.script('load', script)

    assert(ret !== undefined, 'script load fail')

    return ret
  }

  private async scriptLoadAll() {
    for (const key of Object.keys(lua) as (keyof typeof lua)[]) {
      this.shaStore.set(key, await this.scriptLoad(lua[key]))
    }
  }

  private async shaGet(key: keyof typeof lua) {
    let ret = this.shaStore.get(key)

    if (ret === undefined) {
      this.shaStore.set(key, await this.scriptLoad(lua[key]))
      ret = this.shaStore.get(key)
    }

    assert(ret !== undefined, `can not found sha by key`)

    return ret
  }
}

namespace Rdsex {
  export type RedisLike = {
    evalSha?: (sha: string, options?: { keys?: string[], arguments?: string[] }) => any,
    evalsha?: (sha: string, numKeys: number, ...args: any[]) => Promise<any>,
    scriptLoad?: (script: string) => Promise<string>,
    script?: (...args: any[]) => Promise<any>,
  }
}

export default Rdsex;
