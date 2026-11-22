import React, { useLayoutEffect, useRef } from 'react';
import { mountTrading } from '/grid/examples/trading/trading.js';

export default function TradingDesk() {
  const host = useRef(null);
  useLayoutEffect(() => mountTrading(host.current), []);
  return (
    <section ref={host} data-application="trading-desk" className="trading-app ui-root">
      <div className="top">
        <div>
          <h1>Trading desk</h1>
          <p>
            Equity quotes and foreign exchange · <span className="session">Simulated feed</span>
          </p>
        </div>
        <div className="controls">
          <label>
            Exchange
            <select id="market" aria-label="Exchange">
              <option>Nasdaq</option>
              <option>NYSE</option>
            </select>
          </label>
          <details className="settings">
            <summary>Feed settings</summary>
            <div>
              <label>
                Instruments
                <select id="size" aria-label="Instruments" defaultValue="10000">
                  <option value="1000">1,000</option>
                  <option value="10000">10,000</option>
                  <option value="50000">50,000</option>
                </select>
              </label>
              <label>
                Ticks per visible equity / sec
                <select id="rate" defaultValue="2" aria-label="Ticks per visible equity / sec">
                  <option value="2">2</option>
                  <option value="5">5</option>
                  <option value="15">15</option>
                </select>
              </label>
            </div>
          </details>
          <button id="pause" type="button">
            Pause feed
          </button>
        </div>
      </div>
      <div className="desk">
        <section className="panel stocks">
          <header>
            <h2>Market watch</h2>
            <div id="search-slot"></div>
          </header>
          <div id="stock-grid"></div>
          <footer>
            <span id="watch-count"></span>
            <span id="throughput"></span>
          </footer>
        </section>
        <section className="panel detail">
          <header>
            <h2>Instrument detail</h2>
            <span id="venue"></span>
          </header>
          <div className="detail-body">
            <div className="identity">
              <strong id="symbol"></strong>
              <span id="company"></span>
            </div>
            <div className="quote">
              <strong id="price"></strong>
              <span id="change"></span>
            </div>
            <div className="chart-head">
              <span>Price history</span>
              <div id="ranges" aria-label="Chart range">
                <button data-min="1">1m</button>
                <button data-min="5" aria-pressed="true">
                  5m
                </button>
                <button data-min="15">15m</button>
              </div>
            </div>
            <canvas id="history" role="img" aria-label="Instrument price history"></canvas>
            <dl>
              <div>
                <dt>Open</dt>
                <dd id="open"></dd>
              </div>
              <div>
                <dt>Day low</dt>
                <dd id="low"></dd>
              </div>
              <div>
                <dt>Day high</dt>
                <dd id="high"></dd>
              </div>
              <div>
                <dt>Prev. close</dt>
                <dd id="close"></dd>
              </div>
            </dl>
          </div>
        </section>
        <section className="panel heat">
          <header>
            <h2>FX cross rates</h2>
            <span>Quote per unit of base</span>
          </header>
          <div id="fx-grid"></div>
        </section>
        <section className="panel movers">
          <header>
            <h2>Currency movers</h2>
            <span>USD and EUR crosses</span>
          </header>
          <div id="movers-grid"></div>
        </section>
      </div>
      <footer className="bottom">
        <span>
          Colibri Grid <b> / </b> Trading example
        </span>
        <time id="clock"></time>
      </footer>
    </section>
  );
}
