import { vi } from 'vitest';

class FakeMap {
  constructor({ container }) {
    this.container = container;
    this._sources = {};
    this._listeners = {};
    queueMicrotask(() => this._fire('load'));
  }
  on(event, layerOrCb, cb) {
    const handler = typeof layerOrCb === 'string' ? cb : layerOrCb;
    (this._listeners[event] ||= []).push(handler);
  }
  _fire(event, payload) {
    (this._listeners[event] || []).forEach((cb) => cb(payload));
  }
  addSource(id, src) {
    this._sources[id] = {
      ...src,
      setData: vi.fn(),
    };
  }
  getSource(id) {
    return this._sources[id];
  }
  addLayer = vi.fn();
  removeLayer = vi.fn();
  removeSource = vi.fn();
  getCanvas() {
    return { style: {} };
  }
  zoomIn = vi.fn();
  zoomOut = vi.fn();
  flyTo = vi.fn();
  remove = vi.fn();
}

const maplibregl = { Map: FakeMap };
export { maplibregl };
export default maplibregl;
