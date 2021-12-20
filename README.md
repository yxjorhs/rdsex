# rdsex

expand redis function with lua script



## useage

```typescript
import IORedis from 'ioredis'
import Rdsex from 'rdsex'

const rdsex = new Rdsex(new IORedis())

/*
hincr key with 1, limit result between 0 and 1
return number while success, otherwise return null
*/
await rdsex.incrBetween('key', 1, 0, 1)
```

