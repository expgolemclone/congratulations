import photo from './aperture.jpg';
import chocolate from './conche.svg';
import bicycle from './halfstep.svg';
import terrain from './northbound.svg';
import terrainSource from './northbound.svg?raw';

const TAU = Math.PI * 2;
const pictures = { photo, chocolate, bicycle, terrain };

export async function createArtwork(canvas, kind) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw Error('この端末では祝福の描画を開始できません.');
  let picture, route;
  if (pictures[kind]) {
    picture = new Image(); picture.src = pictures[kind]; await picture.decode();
    if (kind === 'terrain') route = new Path2D(new DOMParser().parseFromString(terrainSource, 'image/svg+xml').querySelector('path').getAttribute('d'));
  }
  return {
    draw(time, value, framing = 1) {
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * ratio) || canvas.height !== Math.round(h * ratio)) {
        canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, unit = Math.min(w, h);
      ctx.translate(cx, cy); ctx.scale(framing, framing); ctx.translate(-cx, -cy);
      const line = (points, color, width = 1) => {
        ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
      };
      if (picture) {
        const fit = kind === 'photo' ? Math.max(w / picture.naturalWidth, h / picture.naturalHeight) : Math.min(w / picture.naturalWidth, h / picture.naturalHeight) * 0.95;
        const zoom = kind === 'photo' ? 1.06 + Math.sin(time * 0.16) * 0.025 : 1;
        const dw = picture.naturalWidth * fit * zoom, dh = picture.naturalHeight * fit * zoom;
        ctx.save(); ctx.translate(cx, cy);
        if (kind === 'chocolate') { ctx.translate(0, Math.sin(time * 1.1) * 7); ctx.rotate(Math.sin(time * 0.5) * 0.035); }
        if (kind === 'bicycle') { ctx.translate(0, Math.sin(time * 5) * 2); ctx.rotate(Math.sin(time * 2) * 0.008); }
        if (kind === 'photo') ctx.translate(Math.sin(time * 0.12) * 4, Math.cos(time * 0.14) * 3);
        ctx.drawImage(picture, -dw / 2, -dh / 2, dw, dh);
        if (route) {
          ctx.translate(-dw / 2, -dh / 2); ctx.scale(dw / 1200, dh / 800);
          ctx.setLineDash([24, 72]); ctx.lineDashOffset = -time * 90;
          ctx.strokeStyle = '#d3f9d8'; ctx.lineWidth = 5; ctx.stroke(route);
        }
        ctx.restore();
        if (kind === 'bicycle') for (let i = 0; i < 5; i++) {
          const x = w - ((time * (70 + value) + i * w / 5) % (w + 80));
          line([[x, h * (0.25 + i * 0.13)], [x + 28, h * (0.25 + i * 0.13)]], '#879c6044', 2);
        }
      } else if (kind === 'lettering') {
        const text = ['おつかれさま', 'できた', 'ひと休み'][Math.floor(value / 1000)];
        const size = Math.min(68, w / (text.length + 1));
        ctx.font = `${400 + value % 1000 * 5} ${size}px system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#343a40';
        Array.from(text).forEach((letter, i) => {
          const x = cx + (i - (text.length - 1) / 2) * size;
          ctx.fillText(letter, x, cy + Math.sin(time * 1.8 + i * 0.55) * 12);
        });
      } else if (kind === 'waves') {
        // Layered summed sine bands from Driftline Ocean's original WaveField.
        for (let layer = 0; layer < 5; layer++) {
          const points = [];
          for (let x = 0; x <= w + 8; x += 8) points.push([x, h * (0.3 + layer * 0.12) +
            Math.sin(x / 90 + time * 0.65 + layer) * (10 + value / 5) + Math.sin(x / 55 - time * 0.4) * 8]);
          ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
          ctx.lineTo(w + 8, h); ctx.lineTo(0, h); ctx.closePath();
          ctx.fillStyle = `hsla(${175 + layer * 8}, 65%, ${45 - layer * 5}%, 0.22)`; ctx.fill();
          line(points, '#8be3d3', 1);
        }
      } else if (kind === 'contour') {
        for (let ring = 1; ring <= 19; ring++) {
          const points = [];
          for (let a = 0; a <= TAU + 0.04; a += 0.04) {
            const r = unit * ring / 42 * (1 + 0.14 * Math.sin(a * 3 + time * 0.25) + 0.08 * Math.cos(a * 5 + value / 35));
            points.push([cx + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r]);
          }
          line(points, ring % 5 === 0 ? '#c65d2e' : '#969c80', ring % 5 === 0 ? 2 : 1);
        }
        if (value >= 100) {
          line([[cx, cy + 22], [cx, cy - 35]], '#495b3c', 3);
          ctx.fillStyle = '#e8590c'; ctx.beginPath(); ctx.moveTo(cx, cy - 35); ctx.lineTo(cx + 35, cy - 25); ctx.lineTo(cx, cy - 15); ctx.fill();
        }
      } else if (kind === 'gauge') {
        ctx.strokeStyle = '#56524c'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, unit * 0.34, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();
        for (let i = 0; i <= 24; i++) {
          const a = Math.PI * (0.75 + i / 24 * 1.5);
          line([[cx + Math.cos(a) * unit * 0.3, cy + Math.sin(a) * unit * 0.3],
            [cx + Math.cos(a) * unit * 0.33, cy + Math.sin(a) * unit * 0.33]], '#e8b570', 2);
        }
        const angle = Math.PI * (0.8 + (1 - value / 100) * 1.4) + Math.sin(time * 0.9) * 0.08;
        line([[cx, cy], [cx + Math.cos(angle) * unit * 0.27, cy + Math.sin(angle) * unit * 0.27]], '#e8b570', 4);
        ctx.fillStyle = '#e8b570'; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, TAU); ctx.fill();
      } else if (kind === 'halo') {
        const radius = unit * (0.25 + Math.sin(time * 0.8) * 0.035);
        const gradient = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.5);
        gradient.addColorStop(0, '#b197fc00'); gradient.addColorStop(0.4, '#b197fc90'); gradient.addColorStop(1, '#b197fc00');
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#d0bfff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, TAU); ctx.stroke();
        ctx.fillStyle = '#ffe8cc';
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * TAU + value / 100 * TAU + time * 0.18;
          ctx.beginPath(); ctx.arc(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, i % 4 === 0 ? 4 : 1.5, 0, TAU); ctx.fill();
        }
      } else if (kind === 'depth' || kind === 'stars') {
        for (let i = 0; i < 150; i++) {
          const x = ((i * 0.618033 + value / 500 + time * 0.002) % 1) * w;
          const y = ((i * 0.414214 + time * (kind === 'depth' ? 0.016 : 0.002)) % 1) * h;
          ctx.globalAlpha = 0.25 + (1 + Math.sin(time * 0.8 + i)) * 0.35;
          ctx.fillStyle = kind === 'stars' ? '#dbe4ff' : '#99e9f2';
          ctx.beginPath(); ctx.arc(x, y, i % 13 === 0 ? 2.5 : 1, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (kind === 'stars') {
          ctx.strokeStyle = '#748ffc'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(cx, cy, unit * 0.35, 0, TAU); ctx.stroke();
          line([[cx - unit * 0.4, cy], [cx + unit * 0.4, cy]], '#748ffc');
          line([[cx, cy - unit * 0.4], [cx, cy + unit * 0.4]], '#748ffc');
          const flight = time % 8;
          if (flight > 4 && flight < 5.2) {
            const x = w * (0.15 + (flight - 4) * 0.6), y = h * (0.1 + (flight - 4) * 0.4);
            line([[x - 28, y - 18], [x, y]], '#dbe4ff', 2);
          }
          ctx.fillStyle = '#ffec99'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, TAU); ctx.fill();
        } else {
          const gradient = ctx.createRadialGradient(cx + Math.sin(time * 0.3) * w * 0.2, -20, 0, cx, 0, h);
          gradient.addColorStop(0, '#99e9f280'); gradient.addColorStop(1, '#0b728500');
          ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
        }
      } else throw Error(`Unknown artwork: ${kind}`);
    },
    dispose() { ctx.clearRect(0, 0, canvas.width, canvas.height); },
  };
}
