const SECONDS_IN_MILLISECOND = 1000;

module.exports = class HeaderOrderRateLimiter {
  rates = {};
  optionsMemento = {
    blockWhenAttemptsReach: 3,
    perLastMilliseconds: 3000,
    useBackOffFactor: true,
    calculateBackOffDeltaMilliseconds: (blockWhenAttemptsReach, rate) =>
      SECONDS_IN_MILLISECOND * (rate.length - blockWhenAttemptsReach),
  };

  get options() {
    return { ...this.optionsMemento };
  }

  set options(value) {
    this.optionsMemento = value;
  }

  /**
   * Creates new rate limiter
   * @param {{
   * blockWhenAttemptsReach: number;
   * perLastMilliseconds: number;
   * useBackOffFactor: boolean;
   * }} options
   */
  constructor(options) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  /**
   * Tracks request's instant
   * @param {{[key: string]: string}} headers
   * @param {{dateNow: EpochTimeStamp}} options
   * @returns {EpochTimeStamp} when request was tracked
   */
  track(headers, { dateNow } = {}) {
    const rate = this.rates[JSON.stringify(Object.keys(headers))];
    const now = dateNow || Date.now();

    if (rate) {
      rate.push(now);
    } else {
      this.rates[JSON.stringify(Object.keys(headers))] = [now];
    }

    return now;
  }

  /**
   * Checks if request hit rate limit
   * @param {{[key: string]: string}} headers
   * @param {{dateNow: EpochTimeStamp}} options
   * @returns {boolean} `true` if request hit rate limit, else `false`
   */
  check(headers, { dateNow } = {}) {
    const {
      blockWhenAttemptsReach,
      perLastMilliseconds,
      useBackOffFactor,
      calculateBackOffDeltaMilliseconds,
    } = this.options;
    const rate = this.rates[JSON.stringify(Object.keys(headers))];
    const now = dateNow || Date.now();

    if (rate) {
      return (
        rate.filter((date) => {
          return (
            now - date <=
            perLastMilliseconds +
              (useBackOffFactor
                ? calculateBackOffDeltaMilliseconds(
                    blockWhenAttemptsReach,
                    rate
                  )
                : 0)
          );
        }).length >= blockWhenAttemptsReach
      );
    }

    return false;
  }
};
