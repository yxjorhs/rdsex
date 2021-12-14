import IORedis from "ioredis";

type LuaName = 'incrBetween' | 'hincrBetween' | 'zincrBetween'
type RdsExpand<T extends LuaName, R> = Record<T, (...p: (string | number | undefined)[]) => Promise<R>>
type Rds = IORedis.Redis & RdsExpand<'incrBetween', number | null> &
  RdsExpand<'hincrBetween', number | null> &
  RdsExpand<'zincrBetween', number | null>

const LUA_INCRBETWEEN = `
local key = KEYS[1]
local increament = tonumber(ARGV[1])
local minVal = tonumber(ARGV[2])
local maxVal = tonumber(ARGV[3])
local pexpireAt = ARGV[4]

local currVal = redis.call("get", key)

local newVal = increament
if (currVal) then
  newVal = newVal + tonumber(currVal)
end

if (newVal < minVal) then
  return nil
end

if (newVal > maxVal) then
  return nil
end

newVal = tonumber(redis.call("incrby", key, increament))

if (pexpireAt ~= "") then
  redis.call('pexpireat', key, tonumber(pexpireAt))
end

return newVal
`;
const LUA_HINCRBETWEEN = `
local key = KEYS[1]
local field = ARGV[1]
local increament = tonumber(ARGV[2])
local minVal = tonumber(ARGV[3])
local maxVal = tonumber(ARGV[4])
local pexpireAt = ARGV[5]

local currVal = redis.call("hget", key, field)

local newVal = increament
if (currVal) then
  newVal = newVal + tonumber(currVal)
end

if (newVal < minVal) then
  return nil
end

if (newVal > maxVal) then
  return nil
end

newVal = tonumber(redis.call("hincrby", key, field, increament))

if (pexpireAt ~= "") then
  redis.call('pexpireat', key, tonumber(pexpireAt))
end

return newVal
`;
const LUA_ZINCRBETWEEN = `
local key = KEYS[1]
local member = ARGV[1]
local increament = tonumber(ARGV[2])
local minVal = tonumber(ARGV[3])
local maxVal = tonumber(ARGV[4])
local pexpireAt = ARGV[5]

local currVal = redis.call("zscore", key, member)

local newVal = increament
if (currVal) then
  newVal = newVal + tonumber(currVal)
end

if (newVal < minVal) then
  return nil
end

if (newVal > maxVal) then
  return nil
end

newVal = tonumber(redis.call("zincrby", key, increament, member))

if (pexpireAt ~= "") then
  redis.call('pexpireat', key, tonumber(pexpireAt))
end

return newVal
`;

const luaDict: Record<LuaName, [number, string]> = {
  incrBetween: [1, LUA_INCRBETWEEN],
  hincrBetween: [1, LUA_HINCRBETWEEN],
  zincrBetween: [1, LUA_ZINCRBETWEEN],
};

/**
 * redis expand
 */
class Rdsex {
  private readonly redis: Rds

  /**
   * @param {IORedis.Redis | IORedis.Cluster} redis redis instance
   */
  constructor(
      redis: IORedis.Redis | IORedis.Cluster,
  ) {
    this.defineCommand(redis);
    this.redis = redis as Rds;
  }

  /**
   * define command
   * @param {IORedis.Redis | IORedis.Cluster} redis
   */
  private async defineCommand(redis: IORedis.Redis | IORedis.Cluster) {
    for (const key of Object.keys(luaDict)) {
      const [numberOfKeys, lua] = luaDict[key as LuaName];
      redis.defineCommand(key, {
        numberOfKeys,
        lua,
      });
    }
  }

  /**
   * incr {key} with {increment}, limit result between {minVal} and
   * {maxVal}
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
  ) {
    return this.redis.incrBetween(key, increament, minVal, maxVal, pexpireAt);
  }

  /**
   * hincr {key} {field} with {increment}, limit result between {minVal} and
   * {maxVal}
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
  ) {
    return this.redis.hincrBetween(
        key,
        field,
        increament,
        minVal,
        maxVal,
        pexpireAt,
    );
  }

  /**
   * zincr {key} {member} with {increment}, limit resultbetween {minVal} and
   * {maxVal}
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
  ) {
    return this.redis.zincrBetween(
        key,
        member,
        increament,
        minVal,
        maxVal,
        pexpireAt,
    );
  }

  /**
   * lpush {member} to {key}, and exec ltrim, limit list {maxLen}
   * @param {string} key
   * @param {string} member
   * @param {number} maxLen
   */
  public async lpushTrim(
      key: string,
      member: string | number,
      maxLen: number,
  ) {
    await this.redis.pipeline()
        .lpush(key, member)
        .ltrim(key, 0, maxLen - 1)
        .exec();
  }

  /**
   * rpush {member} to {key}, and exec ltrim, limit list {maxLen}
   * @param {string} key
   * @param {string} member
   * @param {number} maxLen
   */
  public async rpushTrim(
      key: string,
      member: string | number,
      maxLen: number,
  ) {
    await this.redis.pipeline()
        .rpush(key, member)
        .ltrim(key, -maxLen, -1)
        .exec();
  }
}

export default Rdsex;
