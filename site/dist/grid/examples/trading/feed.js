// Reproducible quotes in USD. Exchange symbols and illustrative prices are fixtures.
const markets = {
  Nasdaq: [
    ['NVDA', 'NVIDIA', 142.26],
    ['AAPL', 'Apple', 238.14],
    ['MSFT', 'Microsoft', 416.38],
    ['AMZN', 'Amazon', 213.55],
    ['GOOGL', 'Alphabet', 175.61],
    ['META', 'Meta Platforms', 592.48],
    ['TSLA', 'Tesla', 327.44],
    ['AVGO', 'Broadcom', 183.76],
    ['AMD', 'Advanced Micro Devices', 147.82],
    ['NFLX', 'Netflix', 842.16],
    ['COST', 'Costco Wholesale', 914.89],
    ['INTC', 'Intel', 23.45],
    ['QCOM', 'Qualcomm', 168.64],
    ['ADBE', 'Adobe', 491.72],
    ['CSCO', 'Cisco Systems', 57.14],
  ],
  NYSE: [
    ['JPM', 'JPMorgan Chase', 241.26],
    ['V', 'Visa', 312.42],
    ['WMT', 'Walmart', 87.13],
    ['XOM', 'Exxon Mobil', 119.85],
    ['ORCL', 'Oracle', 168.35],
    ['MA', 'Mastercard', 509.25],
    ['HD', 'Home Depot', 406.32],
    ['DIS', 'Walt Disney', 105.48],
    ['KO', 'Coca-Cola', 63.14],
    ['IBM', 'IBM', 218.77],
    ['CAT', 'Caterpillar', 381.62],
    ['GE', 'GE Aerospace', 179.48],
  ],
};
export const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD'];
const fxOpening = [1, 1.084, 1.274, 0.00668, 1.13, 0.724];
export const fxKey = (a, b) => a + '/' + b;

function generator(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export class QuoteFeed {
  constructor(market, count, start = Date.now()) {
    this.market = market;
    this.start = start;
    this.random = generator(market === 'Nasdaq' ? 7081 : 4193);
    this.records = [];
    this.lookup = new Map();
    this.traces = new Map();
    const names = markets[market];
    for (let i = 0; i < count; i++) {
      const [ticker, company, base] = names[i % names.length];
      const synthetic = i >= names.length;
      const symbol = synthetic ? 'SIM' + String(i + 1).padStart(5, '0') : ticker;
      const price = synthetic ? Math.round((20 + this.random() * 380) * 100) / 100 : base;
      const close = Math.round(price * (i === 0 ? 0.988 : 0.985 + this.random() * 0.03) * 100) / 100;
      const record = {
        id: symbol,
        company: synthetic ? 'Simulated equity ' + (i + 1) : company,
        price,
        initial: price,
        close,
        open: close,
        low: Math.min(price, close) * 0.996,
        high: Math.max(price, close) * 1.004,
        bid: price - 0.01,
        ask: price + 0.01,
        volume: Math.floor(200000 + this.random() * 3000000),
        change: price - close,
        pct: (price / close - 1) * 100,
        direction: 0,
        seed: i + 123,
      };
      record.initialLow = record.low;
      record.initialHigh = record.high;
      this.records.push(record);
      this.lookup.set(symbol, record);
    }
    this.fx = fxOpening.map((v, i) => v * (1 + [0, 0.0018, -0.0014, 0.0022, 0.0008, -0.0011][i]));
    this.fxRecords = new Map();
    const pairs = currencies
      .filter((c) => c === 'USD' || c === 'EUR')
      .flatMap((base) => currencies.filter((quote) => quote !== base).map((quote) => fxKey(base, quote)));
    const snapshot = this.fxBatch(start, currencies, pairs, false);
    this.matrix = snapshot.matrix;
    this.movers = snapshot.movers;
  }

  remember(id, now, value) {
    let trace = this.traces.get(id);
    if (!trace) {
      trace = [];
      this.traces.set(id, trace);
    }
    const bucket = Math.floor(now / 5000) * 5000;
    if (trace.length && trace.at(-1)[0] === bucket) trace.at(-1)[1] = value;
    else {
      trace.push([bucket, value]);
      if (trace.length > 181) trace.shift();
    }
  }

  tick(id, now) {
    const r = this.lookup.get(id),
      previous = r.price;
    const step = Math.max(0.01, Math.round(r.price * 0.00018 * this.random() * 100) / 100);
    r.price = Math.max(0.02, Math.round((r.price + (this.random() < 0.5 ? -step : step)) * 100) / 100);
    r.asOf = now;
    r.direction = Math.sign(r.price - previous);
    r.bid = r.price - 0.01;
    r.ask = r.price + 0.01;
    r.low = Math.min(r.low, r.price);
    r.high = Math.max(r.high, r.price);
    r.change = r.price - r.close;
    r.pct = (r.change / r.close) * 100;
    r.volume += 1 + Math.floor(this.random() * 140);
    this.remember(r.id, now, r.price);
    return r;
  }

  fxBatch(now, bases, moverIds, move = true) {
    // Both panels share the same underlying currency rates for a given tick.
    if (move) for (let i = 1; i < this.fx.length; i++) this.fx[i] *= 1 + (this.random() - 0.5) * 0.00016;
    const quotes = new Map();
    const quoteFor = (base, quote) => {
      const id = fxKey(base, quote);
      if (quotes.has(id)) return quotes.get(id);
      const i = currencies.indexOf(base),
        j = currencies.indexOf(quote);
      const price = this.fx[i] / this.fx[j],
        close = fxOpening[i] / fxOpening[j];
      const prev = this.fxRecords.get(id);
      const high = Math.max(prev?.high ?? price, price, close),
        low = Math.min(prev?.low ?? price, price, close);
      const data = {
        id,
        company: base + ' / ' + quote,
        price,
        close,
        open: close,
        asOf: now,
        initial: prev?.initial ?? price,
        change: price - close,
        pct: (price / close - 1) * 100,
        high,
        low,
        initialLow: prev?.initialLow ?? low,
        initialHigh: prev?.initialHigh ?? high,
        seed: 811 + i * 13 + j,
      };
      this.fxRecords.set(id, data);
      quotes.set(id, data);
      if (move && i !== j) this.remember(id, now, price);
      return data;
    };
    const matrix = bases.map((base) => {
      const row = { id: base };
      for (const quote of currencies) {
        const data = quoteFor(base, quote);
        row[quote] = data.price;
        row[quote + 'Pct'] = data.pct;
      }
      return row;
    });
    const movers = moverIds.map((id) => quoteFor(...id.split('/')));
    return { matrix, movers };
  }

  record(id) {
    return this.lookup.get(id) || this.fxRecords.get(id);
  }

  history(id, minutes, now) {
    const r = this.record(id),
      trace = this.traces.get(id) || [],
      rng = generator(r.seed);
    const step = 5000,
      end = Math.floor(this.start / step) * step;
    // Build the pre-session history backwards so it joins the first quote exactly.
    const past = [];
    let price = r.initial;
    for (let i = 0; i <= 180; i++) {
      past.push([end - i * step, price]);
      price = Math.max(r.initialLow, Math.min(r.initialHigh, price + (rng() - 0.49) * r.initial * 0.00095));
    }
    const all = past
      .reverse()
      .filter((p) => p[0] < (trace[0]?.[0] ?? Infinity))
      .concat(trace, [[now, r.price]]);
    const from = now - minutes * 60000;
    const first = all.findIndex((p) => p[0] >= from);
    const points = all.slice(Math.max(0, first));
    if (first > 0) points.unshift([from, all[first - 1][1]]);
    return points;
  }
}
