const { it, beforeEach, describe } = require("node:test");
const assert = require("node:assert");

const HeaderOrderRateLimiter = require("..");

describe("HeaderOrderRateLimiter", () => {
  let limiter;

  beforeEach(() => (limiter = new HeaderOrderRateLimiter()));

  it("should not block a new order", () => {
    const expected = false;
    const order = {
      "user-agent": "node",
      "accept-language": "en",
    };

    limiter.track(order);
    const actual = limiter.check(order);

    assert.strictEqual(expected, actual);
  });

  it("should block order repeating 3 times per last 3000 ms", () => {
    const expected = true;
    const order = {
      "user-agent": "node",
      "accept-language": "en",
    };
    const now = Date.parse("2023-01-01T00:00:00");

    limiter.track(order, { dateNow: now });
    limiter.track(order, { dateNow: new Date(now).setSeconds(1) });
    limiter.track(order, { dateNow: new Date(now).setSeconds(2) });
    const actual = limiter.check(order, {
      dateNow: new Date(now).setSeconds(2),
    });

    assert.strictEqual(expected, actual);
  });

  it("should not block order repeating 2 times per last 3000 ms", () => {
    const expected = false;
    const order = {
      "user-agent": "node",
      "accept-language": "en",
    };
    const now = Date.parse("2023-01-01T00:00:00");

    limiter.track(order, { dateNow: now });
    limiter.track(order, { dateNow: new Date(now).setSeconds(1) });
    const actual = limiter.check(order, {
      dateNow: new Date(now).setSeconds(3),
    });

    assert.strictEqual(expected, actual);
  });

  it("should not block order repeating 3 times per last 4000 ms", () => {
    const expected = false;
    const order = {
      "user-agent": "node",
      "accept-language": "en",
    };
    const now = Date.parse("2023-01-01T00:00:00");

    limiter.track(order, { dateNow: now });
    limiter.track(order, { dateNow: new Date(now).setSeconds(1) });
    limiter.track(order, { dateNow: new Date(now).setSeconds(2) });
    const actual = limiter.check(order, {
      dateNow: new Date(now).setSeconds(4),
    });

    assert.strictEqual(expected, actual);
  });

  it("should not collide with other header orders", () => {
    const legitOrderExpected = false;
    const botOrderExpected = true;
    const botOrder = {
      "user-agent": "node",
      "accept-language": "en",
    };
    const legitOrder = {
      "accept-language": "en",
      "user-agent": "node",
    };
    const now = Date.parse("2023-01-01T00:00:00");

    limiter.track(botOrder, { dateNow: now });
    limiter.track(botOrder, { dateNow: new Date(now).setSeconds(1) });
    limiter.track(botOrder, { dateNow: new Date(now).setSeconds(2) });
    limiter.track(legitOrder, { dateNow: now });
    limiter.track(legitOrder, { dateNow: new Date(now).setSeconds(2) });
    const legitOrderActual = limiter.check(legitOrder, {
      dateNow: new Date(now).setSeconds(2),
    });
    const botOrderActual = limiter.check(botOrder, {
      dateNow: new Date(now).setSeconds(2),
    });

    assert.strictEqual(legitOrderExpected, legitOrderActual);
    assert.strictEqual(botOrderExpected, botOrderActual);
  });

  it("can change blockWhenAttemptsReach and block request when hit", () => {
    const constructorLimiter = new HeaderOrderRateLimiter({
      blockWhenAttemptsReach: 6,
    });

    const expected = true;
    const order = {
      "user-agent": "node",
      "accept-language": "en",
    };
    const now = Date.parse("2023-01-01T00:00:00");
    limiter.track(order, { dateNow: now });
    limiter.track(order, { dateNow: new Date(now).setSeconds(1) });
    limiter.track(order, { dateNow: new Date(now).setSeconds(2) });
    limiter.track(order, { dateNow: new Date(now).setSeconds(3) });
    limiter.track(order, { dateNow: new Date(now).setSeconds(4) });
    limiter.track(order, { dateNow: new Date(now).setSeconds(5) });
    const actual = limiter.check(order, {
      dateNow: new Date(now).setSeconds(5),
    });

    assert.strictEqual(expected, actual);
  });

  it("can change perLastMilliseconds and block request when hit", () => {
    const constructorLimiter = new HeaderOrderRateLimiter({
      perLastMilliseconds: 1000,
    });

    const expected = true;
    const order = {
      "user-agent": "node",
      "accept-language": "en",
    };
    const now = Date.parse("2023-01-01T00:00:00");
    limiter.track(order, { dateNow: now });
    limiter.track(order, { dateNow: new Date(now).setMilliseconds(100) });
    limiter.track(order, { dateNow: new Date(now).setMilliseconds(200) });
    limiter.track(order, { dateNow: new Date(now).setMilliseconds(300) });
    const actual = limiter.check(order, {
      dateNow: new Date(now).setMilliseconds(300),
    });

    assert.strictEqual(expected, actual);
  });

  it("can work with multiple constructor options", () => {
    const constructorLimiter = new HeaderOrderRateLimiter({
      perLastMilliseconds: 1000,
      blockWhenAttemptsReach: 6,
    });

    const expected = true;
    const order = {
      "user-agent": "node",
      "accept-language": "en",
    };
    const now = Date.parse("2023-01-01T00:00:00");
    limiter.track(order, { dateNow: now });
    limiter.track(order, { dateNow: new Date(now).setMilliseconds(100) });
    limiter.track(order, { dateNow: new Date(now).setMilliseconds(200) });
    limiter.track(order, { dateNow: new Date(now).setMilliseconds(300) });
    limiter.track(order, { dateNow: new Date(now).setMilliseconds(400) });
    limiter.track(order, { dateNow: new Date(now).setMilliseconds(500) });
    const actual = limiter.check(order, {
      dateNow: new Date(now).setMilliseconds(500),
    });

    assert.strictEqual(expected, actual);
  });

  it("should ignore header values when block", () => {
    const expected = true;
    const order = {
      "user-agent": "node",
      "accept-language": "en",
    };
    const now = Date.parse("2023-01-01T00:00:00");

    limiter.track(order, { dateNow: now });
    limiter.track(order, { dateNow: new Date(now).setSeconds(1) });
    order["user-agent"] = "js";
    limiter.track(order, { dateNow: new Date(now).setSeconds(2) });
    const actual = limiter.check(order, {
      dateNow: new Date(now).setSeconds(2),
    });

    assert.strictEqual(expected, actual);
  });
});
