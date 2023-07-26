# header-order-rate-limit

`Rate limits http requests based on header order`

# Installation

`npm install header-order-rate-limit`

## Usage

```javascript
const express = require("express");

const HeaderOrderRateLimiter = require("header-order-rate-limit");

const limiter = new HeaderOrderRateLimiter({
  perLastMilliseconds: 10000,
});

const port = 3000;
const app = express();

app.use(({ headers }, res, next) => {
  delete headers["if-none-match"];
  delete headers["cache-control"];
  delete headers["pragma"];

  if (limiter.check(headers)) return res.end("blocked!");

  limiter.track(headers);

  return next();
});

app.get("/", (_, res) => {
  res.send("passed!");
});

app.listen(port);
```

## API

### `constructor(options)`

Creates a new `HeaderOrderRateLimiter` instance with the specified options.

`options`: (optional) An object containing the rate limiting options:
`blockWhenAttemptsReach`: Number of attempts allowed within the specified time window. Default: `3`.

`perLastMilliseconds`: Time window in milliseconds to track attempts. Default: `3000`.

`useBackOffFactor`: Expands the track window as new requests come so it becomes harder to make periodic fetches to avoid detection. Default: `true`.

### `track(headers, { dateNow })`

Tracks the timestamp of a request based on the provided headers.

`headers`: An object representing the headers of the request.

`dateNow`: (optional) A timestamp (EpochTimeStamp) representing the current time. If not provided, the current system time will be used.
Returns the timestamp when the request was tracked.

### `check(headers, { dateNow })`

Checks if a request has hit the rate limit based on the provided headers.

`headers`: An object representing the headers of the request.

`dateNow`: (optional) A timestamp (`EpochTimeStamp`) representing the current time. If not provided, the current system time will be used.
Returns `true` if the request has hit the rate limit, otherwise `false`.

## Test

`npm test`
