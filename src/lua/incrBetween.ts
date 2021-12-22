export default `
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
`