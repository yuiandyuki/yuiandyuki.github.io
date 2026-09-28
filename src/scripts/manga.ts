// Hand-inked line art, generated for each panel at its real size:
// 集中線 (focus), 流線 (speed), 吹き出し (balloons), ホワイト stars.
// Plus the nixie flicker.

type Gen = (el: HTMLElement, w: number, h: number) => void;

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const rng = (seed: number) => () => {
  let a = seed | 0;
  a = (a + 0x6d2b79f5) | 0;
  seed = a;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const h32 = (s: string) => {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.codePointAt(0)!, 16777619);
  return h >>> 0;
};
const f = (n: number) => Math.round(n * 10) / 10;
const svg = (w: number, h: number, body: string) =>
  `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false">${body}</svg>`;

const generators: Record<string, Gen> = {
  focus(el, w, h) {
    const d = el.dataset;
    const r = rng(+(d.seed ?? 7));
    const fx = w * +(d.fx ?? 0.5), fy = h * +(d.fy ?? 0.5), ix = w * +(d.ix ?? 0.3), iy = h * +(d.iy ?? 0.3);
    const n = +(d.n ?? 380), wt = +(d.wt ?? 1);
    const R = Math.hypot(Math.max(fx, w - fx), Math.max(fy, h - fy)) + 12;
    let p = '';
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      let k = 1 + Math.pow(r(), 2) * 0.5;
      if (r() < 0.2) k += 0.3 + r() * 0.75;
      const sx = fx + ix * k * c, sy = fy + iy * k * s, hw = (0.3 + Math.pow(r(), 2.4) * 2.9) * wt, ex = fx + R * c, ey = fy + R * s;
      p += `M${f(sx)} ${f(sy)}L${f(ex - s * hw)} ${f(ey + c * hw)}L${f(ex + s * hw)} ${f(ey - c * hw)}Z`;
    }
    el.innerHTML = svg(w, h, `<path d="${p}" fill="currentColor"/>`);
  },
  speed(el, w, h) {
    const d = el.dataset;
    const r = rng(+(d.seed ?? 5)), n = +(d.n ?? 60);
    let p = '';
    for (let i = 0; i < n; i++) {
      const y = r() * h, len = w * (0.2 + r() * 0.72), x0 = -w * 0.12 + r() * (w * 1.05 - len * 0.35);
      const t = 0.25 + Math.pow(r(), 2.2) * 2.2, x1 = x0 + len, xm = x0 + len * 0.78;
      p += `M${f(x0)} ${f(y)}Q${f(xm)} ${f(y - t)} ${f(x1)} ${f(y)}Q${f(xm)} ${f(y + t)} ${f(x0)} ${f(y)}Z`;
    }
    el.innerHTML = svg(w, h, `<path d="${p}" fill="currentColor"/>`);
  },
  stars(el, w, h) {
    const d = el.dataset;
    const r = rng(+(d.seed ?? 3)), n = +(d.n ?? 30), top = +(d.top ?? 0.5);
    let c = '';
    for (let i = 0; i < n; i++) {
      const x = r() * w, y = Math.pow(r(), 1.4) * h * top, rad = 0.7 + Math.pow(r(), 3) * 2.3;
      c += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}"/>`;
    }
    el.innerHTML = svg(w, h, `<g fill="currentColor">${c}</g>`);
  },
  balloon(el, w, h) {
    const d = el.dataset;
    const type = d.b ?? 'talk';
    const r = rng(h32(el.textContent ?? '') + +(d.seed ?? 0));
    const sw = +(d.sw ?? 2), cx = w / 2, cy = h / 2, rx = w / 2, ry = h / 2;
    const tail = d.tail ? d.tail.split(',').map(Number) : null;
    const T = tail ? [tail[0] * w, tail[1] * h] : null;
    const ell = (x: number, y: number, a: number, b: number) =>
      `M${f(x - a)} ${f(y)}a${f(a)} ${f(b)} 0 1 0 ${f(2 * a)} 0a${f(a)} ${f(b)} 0 1 0 ${f(-2 * a)} 0Z`;
    const per = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
    const S: string[] = [], F: string[] = [];
    const nearestTo = (pts: number[][], ta: number) => {
      let bi = 0, bd = 9;
      pts.forEach((p, i) => {
        if (i % 2) return;
        const dd = Math.abs(Math.atan2(Math.sin(p[2] - ta), Math.cos(p[2] - ta)));
        if (dd < bd) { bd = dd; bi = i; }
      });
      return bi;
    };
    if (type === 'talk') {
      const e = ell(cx, cy, rx, ry);
      S.push(e); F.push(e);
      if (T) {
        const ang = Math.atan2((T[1] - cy) / ry, (T[0] - cx) / rx), sp = +(d.ts ?? 0.2), bend = d.bend ? +d.bend : 0.16;
        const P = (a: number) => [cx + rx * 0.97 * Math.cos(a), cy + ry * 0.97 * Math.sin(a)];
        const p1 = P(ang - sp), p2 = P(ang + sp);
        const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2, vx = T[0] - mx, vy = T[1] - my;
        const c1 = [p1[0] + vx * 0.5 - vy * bend, p1[1] + vy * 0.5 + vx * bend];
        const c2 = [p2[0] + vx * 0.42 - vy * bend, p2[1] + vy * 0.42 + vx * bend];
        const t = `M${f(p1[0])} ${f(p1[1])}Q${f(c1[0])} ${f(c1[1])} ${f(T[0])} ${f(T[1])}Q${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}Z`;
        S.push(t); F.push(t);
      }
    } else if (type === 'shout') {
      const n = Math.max(12, Math.round(per / +(d.sp ?? 30))), pts: number[][] = [];
      for (let i = 0; i < n * 2; i++) {
        const a = ((i + (r() - 0.5) * 0.55) / (n * 2)) * Math.PI * 2, k = i % 2 ? 0.84 + r() * 0.07 : 1.1 + r() * 0.24;
        pts.push([cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a), a]);
      }
      if (T) pts[nearestTo(pts, Math.atan2((T[1] - cy) / ry, (T[0] - cx) / rx))] = [T[0], T[1], 0];
      const s = 'M' + pts.map((p) => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
      S.push(s); F.push(s);
    } else if (type === 'elec') {
      const n = Math.max(16, Math.round(per / +(d.sp ?? 13))), pts: number[][] = [];
      for (let i = 0; i < n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI * 2, k = i % 2 ? 0.93 : 1.05;
        pts.push([cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a), a]);
      }
      if (T) {
        const bi = nearestTo(pts, Math.atan2((T[1] - cy) / ry, (T[0] - cx) / rx));
        const b = pts[bi], mx = (b[0] + T[0]) / 2, my = (b[1] + T[1]) / 2, dx = T[0] - b[0], dy = T[1] - b[1];
        pts.splice(bi, 1, [mx - dy * 0.18, my + dx * 0.18, 0], [mx + dy * 0.12, my - dx * 0.12, 0], [T[0], T[1], 0]);
      }
      const s = 'M' + pts.map((p) => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
      S.push(s); F.push(s);
    } else {
      // think: a ring of puffs and a trail of bubbles
      const n = Math.max(9, Math.round(per / +(d.sp ?? 34)));
      for (let i = 0; i < n; i++) {
        const a = ((i + (r() - 0.5) * 0.35) / n) * Math.PI * 2, rb = (per / n) * (0.5 + r() * 0.16);
        const x = cx + (rx - rb * 0.42) * Math.cos(a), y = cy + (ry - rb * 0.42) * Math.sin(a);
        const c = `M${f(x - rb)} ${f(y)}a${f(rb)} ${f(rb)} 0 1 0 ${f(2 * rb)} 0a${f(rb)} ${f(rb)} 0 1 0 ${f(-2 * rb)} 0Z`;
        S.push(c); F.push(c);
      }
      F.push(ell(cx, cy, rx * 0.9, ry * 0.86));
      if (T) {
        const ang = Math.atan2((T[1] - cy) / ry, (T[0] - cx) / rx), ex = cx + rx * 1.02 * Math.cos(ang), ey = cy + ry * 1.02 * Math.sin(ang);
        for (const [t, rr] of [[0.34, 7], [0.64, 5], [0.92, 3.4]]) {
          const c = ell(ex + (T[0] - ex) * t, ey + (T[1] - ey) * t, rr * 1.15, rr);
          S.push(c); F.push(c);
        }
      }
    }
    el.querySelector(':scope>.bsvg')?.remove();
    el.insertAdjacentHTML('afterbegin',
      `<svg class="bsvg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false"><g class="bs" stroke-width="${sw * 2}">${S.map((s) => `<path d="${s}"/>`).join('')}</g><g class="bf">${F.map((s) => `<path d="${s}"/>`).join('')}</g></svg>`);
    el.classList.add('drawn');
  },
};

const sizes = new WeakMap<Element, string>();
const observer = new ResizeObserver((entries) => {
  for (const { target } of entries) {
    const el = target as HTMLElement;
    const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
    const key = `${w}x${h}`;
    if (!w || !h || sizes.get(el) === key) continue;
    sizes.set(el, key);
    generators[el.dataset.gen!]?.(el, w, h);
  }
});
document.querySelectorAll<HTMLElement>('[data-gen]').forEach((el) => observer.observe(el));

// Nixie: the last digit has just ticked over (that's you) — strike it once. No idle flicker.
if (!reducedMotion.matches) {
  document.querySelectorAll<HTMLElement>('.nixie').forEach((nx) => {
    for (const i of (nx.dataset.changed ?? '').split(',').filter(Boolean).map(Number)) {
      nx.children[i]?.classList.add('flk');
    }
  });
}


// ※ 作者注: in the margin beside its paragraph on wide screens; on phones,
// right after the paragraph that cites it.
const narrow = matchMedia('(max-width: 900px)');
const notes = [...document.querySelectorAll<HTMLElement>('.prose > .sidenote')]
  .map((note) => ({ note, block: note.nextElementSibling }))
  .filter((n): n is { note: HTMLElement; block: Element } => !!n.block);
const placeNotes = () => notes.forEach(({ note, block }) => (narrow.matches ? block.after(note) : block.before(note)));
placeNotes();
narrow.addEventListener('change', placeNotes);
