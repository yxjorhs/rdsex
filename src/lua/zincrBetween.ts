export default `
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
`