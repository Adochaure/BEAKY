"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// TYPES & TAILORED RECRUITER EMAIL TEMPLATES (3-4+ YRS EXPERIENCE)
// -----------------------------------------------------------------------------
interface RecruiterEmail {
  id: string;
  recruiterName: string;
  company: string;
  toEmail: string;
  subject: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  avatar: string;
  body: string;
}

const RECRUITER_EMAILS: RecruiterEmail[] = [
  {
    id: 'stripe',
    recruiterName: 'Sarah',
    company: 'Stripe',
    toEmail: 'sarah.recruiter@stripe.com',
    subject: 'Senior Frontend Lead — Alex (ATS Tailored)',
    city: 'San Francisco',
    country: 'USA',
    lat: 37.7749,
    lng: -122.4194,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=140&auto=format&fit=crop&q=80',
    body: "Hi Sarah,\n\nSaw Stripe is scaling its developer dashboard. With 4+ yrs building high-throughput React/TS interfaces and reducing frontend latency by 40%, I'd love to contribute to Stripe's UI platforms.\n\nMy tailored resume is attached for your review."
  },
  {
    id: 'linear',
    recruiterName: 'Marcus',
    company: 'Linear',
    toEmail: 'marcus.talent@linear.app',
    subject: 'Staff UI & WebGL Engineer — Alex (3.5+ Yrs Exp)',
    city: 'London',
    country: 'UK',
    lat: 51.5072,
    lng: -0.1276,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=140&auto=format&fit=crop&q=80',
    body: "Hi Marcus,\n\nHuge fan of Linear's 60fps interaction craft. Over the past 3.5 years, I've architected local-first state engines and custom WebGL canvas tools serving 200k+ daily users.\n\nMy tailored resume and interactive portfolio are attached."
  },
  {
    id: 'vercel',
    recruiterName: 'Elena',
    company: 'Vercel',
    toEmail: 'elena.hiring@vercel.com',
    subject: 'Design Engineer, Next.js Core — Alex (ATS Tailored)',
    city: 'New York',
    country: 'USA',
    lat: 40.7128,
    lng: -74.0060,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=140&auto=format&fit=crop&q=80',
    body: "Hi Elena,\n\nNoticed Vercel is expanding the DX & Design Engineering team. With 4 years shipping zero-latency design systems, RSC architectures, and edge-cached apps, I'd love to chat.\n\nMy tailored resume is attached—happy to walk through my work."
  },
  {
    id: 'figma',
    recruiterName: 'Kenji',
    company: 'Figma',
    toEmail: 'kenji.recruiting@figma.com',
    subject: 'Senior Canvas Graphics Engineer — Alex (4 Yrs Exp)',
    city: 'Tokyo',
    country: 'Japan',
    lat: 35.6762,
    lng: 139.6503,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=140&auto=format&fit=crop&q=80',
    body: "Hi Kenji,\n\nExcited to see Figma growing its core rendering pipeline. With 4 years optimizing GPU shaders, 2D/3D scene graphs, and real-time multiplayer cursors, I'd be thrilled to contribute.\n\nMy tailored resume is attached."
  }
];

type AppStage = 'composing' | 'sending' | 'landed';

// -----------------------------------------------------------------------------
// MATHEMATICAL & KINEMATIC HELPERS
// -----------------------------------------------------------------------------
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function easeInOutCubic(x: number): number {
  const t = clamp(x, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInOutQuint(x: number): number {
  const t = clamp(x, 0, 1);
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

function rotatePointAroundAxis(
  point: THREE.Vector3,
  origin: THREE.Vector3,
  axis: THREE.Vector3,
  angle: number
): THREE.Vector3 {
  return point.clone().sub(origin).applyAxisAngle(axis, angle).add(origin);
}

// -----------------------------------------------------------------------------
// PROCEDURAL FOLEY SOUND ENGINE (Web Audio API)
// -----------------------------------------------------------------------------
class FoleyAudioEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private init(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playKeyClick() {
    const c = this.init();
    if (!c) return;
    try {
      const now = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1250 + Math.random() * 400, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.025);

      gain.gain.setValueAtTime(0.022, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch {}
  }

  playOrigamiCrease(pitchMultiplier = 1.0) {
    const c = this.init();
    if (!c) return;
    try {
      const now = c.currentTime;
      const len = Math.floor(c.sampleRate * 0.34);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const env = Math.sin((i / len) * Math.PI);
        data[i] = (Math.random() * 2 - 1) * Math.pow(env, 1.4);
      }

      const src = c.createBufferSource();
      src.buffer = buf;

      const filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(950 * pitchMultiplier, now);
      filter.frequency.exponentialRampToValueAtTime(2200 * pitchMultiplier, now + 0.16);
      filter.frequency.exponentialRampToValueAtTime(700 * pitchMultiplier, now + 0.33);
      filter.Q.value = 2.0;

      const gain = c.createGain();
      gain.gain.setValueAtTime(0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.33);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      src.start(now);
    } catch {}
  }

  playOrbitalGlide() {
    const c = this.init();
    if (!c) return;
    try {
      const now = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.85);
      osc.frequency.exponentialRampToValueAtTime(160, now + 2.4);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 2.4);

      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + 2.45);
    } catch {}
  }

  playTouchdownChime() {
    const c = this.init();
    if (!c) return;
    try {
      const now = c.currentTime;
      const notes = [659.25, 987.77, 1318.51]; // E5, B5, E6 bright bell chord
      notes.forEach((freq, idx) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        const start = now + idx * 0.06;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(0.055 / (idx + 1), start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.3);

        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(start);
        osc.stop(start + 1.35);
      });
    } catch {}
  }
}

// -----------------------------------------------------------------------------
// CLEAN WHITE EMAIL PAGE TEXTURE GENERATOR (NO POSTCARD STRIPES OR STAMPS)
// Renders the exact clean white Email Page (TO, SUB, and Body text) onto the
// 3D folding paper sheet so the plane is folded from a pure white email sheet.
// -----------------------------------------------------------------------------
function renderEmailSheetToCanvas(
  canvas: HTMLCanvasElement,
  toEmail: string,
  subject: string,
  bodyText: string,
  creaseStrength: number = 0
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;  // 1024
  const H = canvas.height; // 1024

  // 1. Pure Crisp White Paper Sheet
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Subtle top header bands matching the Email UI
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, W, 196);

  // Clean horizontal dividers
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 98);
  ctx.lineTo(W, 98);
  ctx.moveTo(0, 196);
  ctx.lineTo(W, 196);
  ctx.stroke();

  // Outer crisp paper edge border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  // 2. Row 1: "TO" + Recipient Email + "CC  BCC"
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = '700 24px Inter, system-ui, sans-serif';
  ctx.fillText('TO', 64, 60);

  ctx.fillStyle = '#0f172a';
  ctx.font = '500 28px Inter, system-ui, sans-serif';
  ctx.fillText(toEmail, 168, 60);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748b';
  ctx.font = '600 22px Inter, system-ui, sans-serif';
  ctx.fillText('CC   BCC', W - 64, 60);

  // 3. Row 2: "SUB" + Bold Subject Line
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = '700 24px Inter, system-ui, sans-serif';
  ctx.fillText('SUB', 64, 156);

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 29px Inter, system-ui, sans-serif';
  ctx.fillText(subject, 168, 156);

  // 4. Clean Email Body Text
  ctx.fillStyle = '#1e293b';
  ctx.font = '400 31px Inter, system-ui, sans-serif';
  const paragraphs = (bodyText || '').split('\n');
  const maxWidth = W - 128;
  const lineHeight = 48;
  let y = 285;

  for (let p = 0; p < paragraphs.length; p++) {
    const para = paragraphs[p];
    if (para.trim() === '') {
      y += 26;
      continue;
    }
    const words = para.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, 64, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, 64, y);
      y += lineHeight;
    }
  }

  // 5. Dynamic Origami Crease Lines & Subtle #e63946 Wing Edge Accent during folding
  if (creaseStrength > 0.01) {
    ctx.save();
    ctx.strokeStyle = `rgba(15, 23, 42, ${0.15 * creaseStrength})`;
    ctx.lineWidth = 5;
    // Center keel valley line
    ctx.beginPath();
    ctx.moveTo(W * 0.5, 0);
    ctx.lineTo(W * 0.5, H);
    ctx.stroke();

    // Left & Right wing fold lines & diagonal nose corner hinges
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(W * 0.5, 0);
    ctx.lineTo(W * 0.34, H);
    ctx.moveTo(W * 0.5, 0);
    ctx.lineTo(W * 0.66, H);
    ctx.moveTo(W * 0.5, 0);
    ctx.lineTo(0, H * 0.54);
    ctx.moveTo(W * 0.5, 0);
    ctx.lineTo(W, H * 0.54);
    ctx.stroke();

    // Clean #e63946 wingtip trim
    ctx.strokeStyle = `rgba(230, 57, 70, ${0.85 * creaseStrength})`;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.54);
    ctx.lineTo(0, H);
    ctx.moveTo(W, H * 0.54);
    ctx.lineTo(W, H);
    ctx.stroke();
    ctx.restore();
  }
}

// -----------------------------------------------------------------------------
// HIGH-PRECISION DOTTED WORLD MAP & COUNTRY MATRIX GENERATOR
// -----------------------------------------------------------------------------
const WORLD_COUNTRY_POLYGONS: Array<[number, number][]> = [
  // North America
  [[-168,66],[-162,71],[-140,70],[-125,70],[-110,73],[-82,74],[-65,66],[-55,52],[-60,46],[-67,45],[-70,42],[-76,35],[-81,25],[-83,29],[-90,29],[-97,26],[-97,19],[-87,21],[-83,10],[-78,8],[-85,11],[-95,16],[-105,20],[-112,31],[-117,32],[-122,37],[-124,48],[-135,58],[-150,60],[-162,55],[-168,66]],
  // Greenland
  [[-52,60],[-42,60],[-22,70],[-18,81],[-45,83],[-68,78],[-58,70],[-52,60]],
  // South America
  [[-78,9],[-72,12],[-62,10],[-50,2],[-35,-6],[-38,-14],[-40,-22],[-48,-28],[-54,-34],[-62,-39],[-66,-48],[-68,-55],[-74,-52],[-73,-42],[-71,-30],[-70,-18],[-76,-14],[-81,-5],[-78,2],[-78,9]],
  // UK & Ireland
  [[-10,52],[-6,54],[-6,58],[-2,58],[1,52],[-5,50],[-10,52]],
  // Iceland
  [[-24,64],[-14,64],[-14,66.5],[-24,66.5],[-24,64]],
  // Continental Europe
  [[-9.5,37],[-9.5,43],[-2,43],[-5,48],[2,51],[8,54],[8,58],[5,61],[10,64],[18,70],[28,71],[31,69],[28,60],[22,60],[18,55],[14,54],[22,54],[29,45],[26,38],[22,37],[18,40],[16,38],[12,42],[14,45],[8,44],[5,43],[3,42],[0,38],[-5,36],[-9.5,37]],
  // Africa & Madagascar
  [[-17,15],[-17,22],[-13,28],[-6,36],[10,37],[11,33],[25,32],[33,31],[39,20],[43,12],[51,12],[49,2],[41,-4],[40,-15],[35,-25],[28,-33],[18,-35],[15,-26],[12,-15],[9,-4],[9,4],[2,6],[-8,5],[-14,9],[-17,15]],
  [[44,-25],[47,-14],[50,-15],[47,-25],[44,-25]],
  // Eurasia, India, Southeast Asia, China, Siberia
  [[26,40],[36,37],[35,30],[44,13],[59,22],[56,27],[48,30],[53,26],[62,25],[68,24],[72,20],[77,8],[80,14],[87,22],[92,21],[97,16],[100,13],[103,2],[104,4],[102,12],[108,12],[109,20],[117,23],[122,30],[120,36],[122,40],[126,38],[129,35],[131,42],[140,52],[138,58],[155,60],[162,60],[170,62],[178,66],[170,70],[140,73],[110,74],[100,76],[80,73],[68,70],[55,68],[40,67],[32,68],[30,60],[28,45],[26,40]],
  // Japan Archipelago
  [[130,31],[133,34],[137,35],[140,36],[141,41],[145,44],[141,45],[139,40],[135,35],[130,31]],
  // Sri Lanka, Taiwan, Philippines, Indonesia
  [[80,6],[82,8],[80,9],[80,6]],
  [[120,22],[122,25],[120,25],[120,22]],
  [[120,14],[123,18],[126,7],[122,7],[120,14]],
  [[96,5],[105,-6],[103,-6],[95,3],[96,5]],
  [[106,-6],[115,-8],[115,-7],[106,-6]],
  [[109,-3],[118,5],[118,-3],[113,-4],[109,-3]],
  [[132,-2],[142,-5],[150,-10],[141,-9],[132,-2]],
  // Australia, Tasmania & New Zealand
  [[114,-22],[122,-16],[130,-12],[136,-12],[142,-11],[146,-18],[153,-26],[151,-34],[146,-39],[138,-35],[130,-32],[122,-34],[115,-34],[114,-26],[114,-22]],
  [[145,-41],[148,-41],[147,-43.5],[145,-41]],
  [[167,-46],[173,-41],[178,-37],[175,-41],[170,-46],[167,-46]],
  // Antarctica Rim
  [[-180,-72],[-120,-74],[-60,-66],[0,-70],[60,-68],[120,-67],[180,-72],[180,-86],[-180,-86],[-180,-72]]
];

function isPointInPolygon(lng: number, lat: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-10) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isLandCoordinate(lat: number, lng: number): { isLand: boolean; isBorder: boolean } {
  let isLand = false;
  for (let p = 0; p < WORLD_COUNTRY_POLYGONS.length; p++) {
    if (isPointInPolygon(lng, lat, WORLD_COUNTRY_POLYGONS[p])) {
      isLand = true;
      break;
    }
  }
  if (!isLand) return { isLand: false, isBorder: false };

  let neighborWater = false;
  const step = 1.6;
  const dirs = [[step, 0], [-step, 0], [0, step], [0, -step]];
  for (const [dlng, dlat] of dirs) {
    let nLand = false;
    for (let p = 0; p < WORLD_COUNTRY_POLYGONS.length; p++) {
      if (isPointInPolygon(lng + dlng, lat + dlat, WORLD_COUNTRY_POLYGONS[p])) {
        nLand = true;
        break;
      }
    }
    if (!nLand) {
      neighborWater = true;
      break;
    }
  }
  return { isLand: true, isBorder: neighborWater };
}

function renderDottedGlobeTexture(
  canvas: HTMLCanvasElement,
  externalMaskImg?: HTMLImageElement
): void {
  const W = canvas.width;  // 2048
  const H = canvas.height; // 1024
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let maskData: Uint8ClampedArray | null = null;
  let maskW = 0;
  let maskH = 0;
  if (externalMaskImg) {
    const off = document.createElement('canvas');
    maskW = 1024;
    maskH = 512;
    off.width = maskW;
    off.height = maskH;
    const octx = off.getContext('2d');
    if (octx) {
      octx.drawImage(externalMaskImg, 0, 0, maskW, maskH);
      maskData = octx.getImageData(0, 0, maskW, maskH).data;
    }
  }

  // 1. Clean Alabaster/Porcelain Ocean Sphere Surface
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, H);
  oceanGrad.addColorStop(0, '#f8fafc');
  oceanGrad.addColorStop(0.5, '#f1f5f9');
  oceanGrad.addColorStop(1, '#f8fafc');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Subtle Latitude & Longitude Graticule Grid Lines
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 6]);
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = ((90 - lat) / 180) * H;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  for (let lng = -180; lng <= 180; lng += 15) {
    const x = ((lng + 180) / 360) * W;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Equator accent line
  ctx.strokeStyle = 'rgba(230, 57, 70, 0.16)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2);
  ctx.stroke();

  // 3. Dotted Matrix Countries & Continents
  const latStep = 1.35;
  for (let lat = -84; lat <= 84; lat += latStep) {
    const cosLat = Math.max(0.18, Math.cos((lat * Math.PI) / 180));
    const lngStep = latStep / cosLat;

    for (let lng = -180; lng < 180; lng += lngStep) {
      let land = false;
      let border = false;

      if (maskData) {
        const mx = Math.min(maskW - 1, Math.max(0, Math.floor(((lng + 180) / 360) * maskW)));
        const my = Math.min(maskH - 1, Math.max(0, Math.floor(((90 - lat) / 180) * maskH)));
        const idx = (my * maskW + mx) * 4;
        land = maskData[idx] < 95;
        if (land) {
          const mxR = Math.min(maskW - 1, mx + 2);
          const myD = Math.min(maskH - 1, my + 2);
          const rWater = maskData[(my * maskW + mxR) * 4] >= 95;
          const dWater = maskData[(myD * maskW + mx) * 4] >= 95;
          border = rWater || dWater;
        }
      } else {
        const res = isLandCoordinate(lat, lng);
        land = res.isLand;
        border = res.isBorder;
      }

      if (land) {
        const x = ((lng + 180) / 360) * W;
        const y = ((90 - lat) / 180) * H;

        const countryBorderDot =
          Math.abs((lat * 0.7 + lng * 0.4) % 9) < 0.48 ||
          Math.abs((lat * 0.5 - lng * 0.8) % 11) < 0.48;

        const baseR = border ? 2.45 : countryBorderDot ? 2.3 : 1.95;
        const rx = baseR / cosLat;
        const ry = baseR;

        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);

        if (border) {
          ctx.fillStyle = '#334155';
        } else if (countryBorderDot) {
          ctx.fillStyle = '#e63946';
        } else {
          ctx.fillStyle = '#64748b';
        }
        ctx.fill();
      }
    }
  }

  // 4. Tech Hub Rings painted onto texture
  RECRUITER_EMAILS.forEach((d) => {
    const cosLat = Math.max(0.2, Math.cos((d.lat * Math.PI) / 180));
    const x = ((d.lng + 180) / 360) * W;
    const y = ((90 - d.lat) / 180) * H;

    ctx.beginPath();
    ctx.ellipse(x, y, 7 / cosLat, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(230, 57, 70, 0.25)';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(x, y, 3.5 / cosLat, 3.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#e63946';
    ctx.fill();
  });
}

// -----------------------------------------------------------------------------
// MULTI-STAGE KINEMATIC 3D ORIGAMI EMAIL SHEET -> PAPER PLANE RIG
// FIXED COORDINATE SYSTEM:
// When fully folded (t = 1), the sharp NOSE (`N`) is strictly at +Z (0, 0, +0.31)
// and the rear TAIL (`T`) is strictly at -Z (0, 0, -0.31), so that orienting
// the plane's local +Z along the velocity vector (+tangent) places the nose
// at the front and streams the trail strictly from the rear tail!
// -----------------------------------------------------------------------------
interface OrigamiPlaneRig {
  group: THREE.Group;
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
  updateFold: (t: number) => { status: string; tailLocalPos: THREE.Vector3 };
}

function createOrigamiEmailPlaneRig(sheetTexture: THREE.CanvasTexture): OrigamiPlaneRig {
  const group = new THREE.Group();

  const W = 1.68;
  const H = 1.48;

  const uvsMap: Record<string, [number, number]> = {
    N: [0.5, 1.0],       // Nose Tip (Top Center)
    T: [0.5, 0.0],       // Tail Keel (Bottom Center)
    CL: [0.34, 0.0],     // Left Wing-Keel Hinge Tail
    CR: [0.66, 0.0],     // Right Wing-Keel Hinge Tail
    EL: [0.0, 0.46],     // Left Edge Nose-Flap Hinge End
    ER: [1.0, 0.46],     // Right Edge Nose-Flap Hinge End
    TL: [0.0, 1.0],      // Top-Left Corner (folds in during Stage 2)
    TR: [1.0, 1.0],      // Top-Right Corner (folds in during Stage 2)
    BL: [0.0, 0.0],      // Bottom-Left Wingtip
    BR: [1.0, 0.0]       // Bottom-Right Wingtip
  };

  const toFlatVec = (uv: [number, number]) =>
    new THREE.Vector3((uv[0] - 0.5) * W, (uv[1] - 0.5) * H, 0);

  const panelTriangles: Array<{
    verts: [string, string, string];
    side: 'L' | 'R';
    role: 'keel' | 'wingLower' | 'wingUpper' | 'noseFlap';
  }> = [
    { verts: ['N', 'CL', 'T'], side: 'L', role: 'keel' },
    { verts: ['N', 'T', 'CR'], side: 'R', role: 'keel' },
    { verts: ['N', 'BL', 'CL'], side: 'L', role: 'wingLower' },
    { verts: ['N', 'CR', 'BR'], side: 'R', role: 'wingLower' },
    { verts: ['N', 'EL', 'BL'], side: 'L', role: 'wingUpper' },
    { verts: ['N', 'BR', 'ER'], side: 'R', role: 'wingUpper' },
    { verts: ['N', 'TL', 'EL'], side: 'L', role: 'noseFlap' },
    { verts: ['N', 'ER', 'TR'], side: 'R', role: 'noseFlap' }
  ];

  const vertexCount = panelTriangles.length * 3;
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);

  panelTriangles.forEach((tri, tIdx) => {
    tri.verts.forEach((vKey, vIdx) => {
      const idx = tIdx * 3 + vIdx;
      const uv = uvsMap[vKey];
      const flat = toFlatVec(uv);
      positions[idx * 3 + 0] = flat.x;
      positions[idx * 3 + 1] = flat.y;
      positions[idx * 3 + 2] = flat.z;
      uvs[idx * 2 + 0] = uv[0];
      uvs[idx * 2 + 1] = uv[1];
    });
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    map: sheetTexture,
    roughness: 0.48,
    metalness: 0.03,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const updateFold = (t: number): { status: string; tailLocalPos: THREE.Vector3 } => {
    const pCorner = easeInOutCubic((t - 0.12) / 0.34);
    const pKeel = easeInOutCubic((t - 0.42) / 0.30);
    const pWings = easeInOutQuint((t - 0.66) / 0.34);

    const pts: Record<string, THREE.Vector3> = {};
    Object.keys(uvsMap).forEach((k) => {
      pts[k] = toFlatVec(uvsMap[k]);
    });

    // STEP A: Fold Top-Left (TL) and Top-Right (TR) nose corners inward
    const maxCornerAngle = Math.PI * 0.96;
    const axisDiagL = pts.EL.clone().sub(pts.N).normalize();
    const axisDiagR = pts.ER.clone().sub(pts.N).normalize();

    const foldedTL = rotatePointAroundAxis(pts.TL, pts.N, axisDiagL, -pCorner * maxCornerAngle);
    const foldedTR = rotatePointAroundAxis(pts.TR, pts.N, axisDiagR, pCorner * maxCornerAngle);
    foldedTL.z += Math.sin(pCorner * Math.PI) * 0.03 + pCorner * 0.012;
    foldedTR.z += Math.sin(pCorner * Math.PI) * 0.03 + pCorner * 0.012;

    // STEP B: Fold Left & Right wings outward relative to Keel Panels
    const maxWingOutAngle = Math.PI * 0.44;
    const axisWingL = pts.CL.clone().sub(pts.N).normalize();
    const axisWingR = pts.CR.clone().sub(pts.N).normalize();

    (['BL', 'EL'] as const).forEach((k) => {
      pts[k] = rotatePointAroundAxis(pts[k], pts.N, axisWingL, pWings * maxWingOutAngle);
    });
    foldedTL.copy(rotatePointAroundAxis(foldedTL, pts.N, axisWingL, pWings * maxWingOutAngle));

    (['BR', 'ER'] as const).forEach((k) => {
      pts[k] = rotatePointAroundAxis(pts[k], pts.N, axisWingR, -pWings * maxWingOutAngle);
    });
    foldedTR.copy(rotatePointAroundAxis(foldedTR, pts.N, axisWingR, -pWings * maxWingOutAngle));

    // STEP C: Fold Left & Right halves together along the Center Keel Spine (N -> T)
    const maxKeelAngle = Math.PI * 0.43;
    const axisSpine = pts.T.clone().sub(pts.N).normalize();

    (['CL', 'BL', 'EL'] as const).forEach((k) => {
      pts[k] = rotatePointAroundAxis(pts[k], pts.N, axisSpine, -pKeel * maxKeelAngle);
    });
    foldedTL.copy(rotatePointAroundAxis(foldedTL, pts.N, axisSpine, -pKeel * maxKeelAngle));

    (['CR', 'BR', 'ER'] as const).forEach((k) => {
      pts[k] = rotatePointAroundAxis(pts[k], pts.N, axisSpine, pKeel * maxKeelAngle);
    });
    foldedTR.copy(rotatePointAroundAxis(foldedTR, pts.N, axisSpine, pKeel * maxKeelAngle));

    pts.TL = foldedTL;
    pts.TR = foldedTR;

    // STEP D: Pitch by +PI/2 around X so that Nose (+Y in flat sheet) rotates to +Z (forward)
    // and Tail (-Y in flat sheet) rotates to -Z (rear), while Keel (-Z) rotates to -Y (downward).
    const pitchToFlight = easeInOutCubic(t) * (Math.PI / 2);
    const flightScale = 1.0 - easeInOutCubic(t) * 0.62;
    const rotEuler = new THREE.Euler(pitchToFlight, 0, 0);

    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    panelTriangles.forEach((tri, tIdx) => {
      tri.verts.forEach((vKey, vIdx) => {
        const idx = tIdx * 3 + vIdx;
        const v = pts[vKey].clone().multiplyScalar(flightScale).applyEuler(rotEuler);
        posAttr.setXYZ(idx, v.x, v.y, v.z);
      });
    });

    posAttr.needsUpdate = true;
    geometry.computeVertexNormals();

    // Compute exact rear tail coordinates in local space (midpoint of CL and CR at rear -Z)
    const tailLocalPos = pts.CL.clone()
      .add(pts.CR)
      .multiplyScalar(0.5 * flightScale)
      .applyEuler(rotEuler);

    let status = 'Lifting email sheet...';
    if (t >= 0.16 && t < 0.46) status = 'Folding nose corners...';
    else if (t >= 0.46 && t < 0.72) status = 'Creasing center keel...';
    else if (t >= 0.72) status = 'Spreading aerodynamic wings...';

    return { status, tailLocalPos };
  };

  return { group, mesh, geometry, updateFold };
}

// -----------------------------------------------------------------------------
// TAPERED GLOWING #e63946 ORBITAL RIBBON TRAIL
// -----------------------------------------------------------------------------
interface GlowingTrail {
  mesh: THREE.Mesh;
  updateWithPoints: (pts: THREE.Vector3[]) => void;
  clear: () => void;
}

function createGlowingOrbitalTrail(maxPoints = 96): GlowingTrail {
  const vertexCount = maxPoints * 2;
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices: number[] = [];

  for (let i = 0; i < maxPoints; i++) {
    const u = i / (maxPoints - 1);
    uvs[i * 4 + 0] = u;
    uvs[i * 4 + 1] = 0;
    uvs[i * 4 + 2] = u;
    uvs[i * 4 + 3] = 1;

    if (i < maxPoints - 1) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        float distFromCenter = abs(vUv.y - 0.5) * 2.0;
        float core = exp(-distFromCenter * distFromCenter * 5.5);
        float fade = pow(vUv.x, 1.6);
        float alpha = core * fade * 0.92;
        vec3 crimson = vec3(0.902, 0.224, 0.275);
        vec3 hotCore = vec3(1.0, 0.65, 0.68);
        vec3 col = mix(crimson, hotCore, pow(core, 2.5) * vUv.x);
        gl_FragColor = vec4(col, alpha);
      }
    `
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.visible = false;

  const updateWithPoints = (pts: THREE.Vector3[]) => {
    if (pts.length < 2) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < maxPoints; i++) {
      const fIdx = (i / (maxPoints - 1)) * (pts.length - 1);
      const i0 = Math.floor(fIdx);
      const i1 = Math.min(pts.length - 1, i0 + 1);
      const frac = fIdx - i0;

      const p = pts[i0].clone().lerp(pts[i1], frac);
      const prev = pts[Math.max(0, i0 - 1)];
      const next = pts[i1];
      const tangent = next.clone().sub(prev).normalize();
      const radial = p.clone().normalize();
      const binormal = new THREE.Vector3().crossVectors(tangent, radial).normalize();
      if (binormal.lengthSq() < 0.01) binormal.set(0, 1, 0);

      const progress = i / (maxPoints - 1);
      const halfWidth = 0.004 + Math.pow(progress, 0.9) * 0.042;

      const left = p.clone().addScaledVector(binormal, halfWidth);
      const right = p.clone().addScaledVector(binormal, -halfWidth);

      posAttr.setXYZ(i * 2 + 0, left.x, left.y, left.z);
      posAttr.setXYZ(i * 2 + 1, right.x, right.y, right.z);
    }
    posAttr.needsUpdate = true;
  };

  const clear = () => {
    mesh.visible = false;
  };

  return { mesh, updateWithPoints, clear };
}

// -----------------------------------------------------------------------------
// MAIN APPLICATION COMPONENT
// -----------------------------------------------------------------------------
export default function App() {
  const [emailIndex, setEmailIndex] = useState<number>(0);
  const currentTemplate = RECRUITER_EMAILS[emailIndex];

  // Live editable fields inside the Email Draft Box
  const [toEmail, setToEmail] = useState<string>(currentTemplate.toEmail);
  const [subject, setSubject] = useState<string>(currentTemplate.subject);
  const [typedBody, setTypedBody] = useState<string>('');
  const [isAutoLoop, setIsAutoLoop] = useState<boolean>(true);
  const [isTyping, setIsTyping] = useState<boolean>(true);

  const [stage, setStage] = useState<AppStage>('composing');
  const [slowMoFold] = useState<boolean>(false);

  const foley = useMemo(() => new FoleyAudioEngine(), []);

  const mountRef = useRef<HTMLDivElement>(null);
  const draftBodyRef = useRef<HTMLDivElement>(null);
  const editBodyRef = useRef<HTMLTextAreaElement>(null);
  const sheetCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sheetTexRef = useRef<THREE.CanvasTexture | null>(null);

  const globeGroupRef = useRef<THREE.Group | null>(null);
  const origamiRigRef = useRef<OrigamiPlaneRig | null>(null);
  const trailRef = useRef<GlowingTrail | null>(null);
  const surfaceDotRef = useRef<THREE.Mesh | null>(null);
  const surfaceRingRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const draftBody = draftBodyRef.current;
    const editBody = editBodyRef.current;
    if (draftBody) draftBody.scrollTop = draftBody.scrollHeight;
    if (editBody) editBody.scrollTop = editBody.scrollHeight;
  }, [typedBody]);

  const animStateRef = useRef<{
    stage: AppStage;
    sendStartTime: number;
    slowMo: boolean;
    dest: RecruiterEmail;
    sentSnapshot: { to: string; sub: string; body: string };
    isDragging: boolean;
    lastPointer: { x: number; y: number };
    vel: { x: number; y: number };
    targetGlobeRot: { x: number; y: number } | null;
    trailPoints: THREE.Vector3[];
    creaseAudioStage: number;
  }>({
    stage: 'composing',
    sendStartTime: 0,
    slowMo: false,
    dest: RECRUITER_EMAILS[0],
    sentSnapshot: {
      to: RECRUITER_EMAILS[0].toEmail,
      sub: RECRUITER_EMAILS[0].subject,
      body: RECRUITER_EMAILS[0].body
    },
    isDragging: false,
    lastPointer: { x: 0, y: 0 },
    vel: { x: 0, y: 0.0008 },
    targetGlobeRot: null,
    trailPoints: [],
    creaseAudioStage: 0
  });

  useEffect(() => {
    animStateRef.current.stage = stage;
  }, [stage]);

  useEffect(() => {
    animStateRef.current.slowMo = slowMoFold;
  }, [slowMoFold]);

  // ---------------------------------------------------------------------------
  // TRIGGER SEND: snapshots the current email onto the 3D folding sheet,
  // rotates globe toward the recruiter's city, and launches the paper plane.
  // ---------------------------------------------------------------------------
  const triggerSendEmail = useCallback(
    (emailObj: RecruiterEmail, finalTo: string, finalSub: string, finalBody: string) => {
      if (animStateRef.current.stage === 'sending') return;

      const snapshot = {
        to: finalTo,
        sub: finalSub,
        body: finalBody || emailObj.body
      };

      animStateRef.current.sentSnapshot = snapshot;
      animStateRef.current.dest = emailObj;

      if (sheetCanvasRef.current && sheetTexRef.current) {
        renderEmailSheetToCanvas(
          sheetCanvasRef.current,
          snapshot.to,
          snapshot.sub,
          snapshot.body,
          0
        );
        sheetTexRef.current.needsUpdate = true;
      }

      const targetY = -((emailObj.lng + 180) * (Math.PI / 180)) + Math.PI - 0.35;
      const targetX = (emailObj.lat * (Math.PI / 180)) * 0.62 - 0.08;

      animStateRef.current.targetGlobeRot = { x: targetX, y: targetY };
      animStateRef.current.trailPoints = [];
      animStateRef.current.sendStartTime = performance.now();
      animStateRef.current.creaseAudioStage = 0;
      animStateRef.current.stage = 'sending';

      setStage('sending');
    },
    []
  );

  // ---------------------------------------------------------------------------
  // AUTO-TYPEWRITER & AUTO-SEND LOOP ACROSS THE 4 RECRUITER EMAILS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const template = RECRUITER_EMAILS[emailIndex];
    setToEmail(template.toEmail);
    setSubject(template.subject);

    // Smoothly orient globe toward the current template's city while composing
    const targetY = -((template.lng + 180) * (Math.PI / 180)) + Math.PI - 0.35;
    const targetX = (template.lat * (Math.PI / 180)) * 0.62 - 0.08;
    animStateRef.current.targetGlobeRot = { x: targetX, y: targetY };
    animStateRef.current.dest = template;

    if (!isAutoLoop) {
      setTypedBody(template.body);
      setIsTyping(false);
      return;
    }

    // Start auto-typing character by character when in 'composing' stage
    if (stage !== 'composing') return;

    setTypedBody('');
    setIsTyping(true);
    let charIdx = 0;
    const fullText = template.body;

    const typeInterval = window.setInterval(() => {
      charIdx += 2; // Crisp, natural fast recruiter typing cadence
      if (charIdx <= fullText.length) {
        setTypedBody(fullText.slice(0, charIdx));
        if (charIdx % 8 === 0) {
          foley.playKeyClick();
        }
      } else {
        setTypedBody(fullText);
        setIsTyping(false);
        window.clearInterval(typeInterval);
      }
    }, 24);

    return () => window.clearInterval(typeInterval);
  }, [emailIndex, isAutoLoop, stage, foley]);

  // Once auto-typing finishes in Auto-Loop mode, pause briefly so user can read the full email, then auto-send!
  useEffect(() => {
    if (!isAutoLoop || stage !== 'composing' || isTyping) return;
    const template = RECRUITER_EMAILS[emailIndex];
    if (typedBody.length < template.body.length) return;

    const sendTimer = window.setTimeout(() => {
      triggerSendEmail(template, toEmail, subject, typedBody);
    }, 950);

    return () => window.clearTimeout(sendTimer);
  }, [isAutoLoop, stage, isTyping, typedBody, emailIndex, toEmail, subject, triggerSendEmail]);

  // Once the plane lands in Auto-Loop mode, advance to the next recruiter.
  useEffect(() => {
    if (!isAutoLoop || stage !== 'landed') return;

    const nextTimer = window.setTimeout(() => {
      const nextIdx = (emailIndex + 1) % RECRUITER_EMAILS.length;
      setEmailIndex(nextIdx);
      setStage('composing');
      animStateRef.current.stage = 'composing';
      animStateRef.current.trailPoints = [];
      if (trailRef.current) trailRef.current.clear();
    }, 2200);

    return () => window.clearTimeout(nextTimer);
  }, [isAutoLoop, stage, emailIndex]);

  // Keep 3D sheet texture synced when user edits manually
  useEffect(() => {
    if (stage !== 'composing') return;
    if (!sheetCanvasRef.current) {
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 1024;
      sheetCanvasRef.current = c;
    }
    renderEmailSheetToCanvas(sheetCanvasRef.current, toEmail, subject, typedBody, 0);
    if (sheetTexRef.current) {
      sheetTexRef.current.needsUpdate = true;
    }
  }, [toEmail, subject, typedBody, stage]);

  // ---------------------------------------------------------------------------
  // INITIALIZE THREE.JS SCENE, DOTTED WORLD GLOBE & KINEMATIC ORIGAMI RIG
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(43, width / height, 0.1, 100);
    camera.position.set(0, 0.02, 5.35);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    container.appendChild(renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.55);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffdfa, 1.45);
    keyLight.position.set(3.8, 4.2, 4.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf1f5f9, 0.85);
    fillLight.position.set(-4.0, -1.5, 2.8);
    scene.add(fillLight);

    const crimsonRimLight = new THREE.DirectionalLight(0xe63946, 0.55);
    crimsonRimLight.position.set(3.5, 1.5, -3.5);
    scene.add(crimsonRimLight);

    // Keep the globe raised above the compact composer dock.
    const globeRadius = 1.32;
    const globeGroup = new THREE.Group();
    globeGroup.position.set(0, 0.72, 0);
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // 1. Dotted World Countries Canvas Texture
    const globeCanvas = document.createElement('canvas');
    globeCanvas.width = 2048;
    globeCanvas.height = 1024;
    renderDottedGlobeTexture(globeCanvas);

    const globeTex = new THREE.CanvasTexture(globeCanvas);
    globeTex.colorSpace = THREE.SRGBColorSpace;
    globeTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const earthGeo = new THREE.SphereGeometry(globeRadius, 96, 96);
    const earthMat = new THREE.MeshStandardMaterial({
      map: globeTex,
      roughness: 0.78,
      metalness: 0.02
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    const maskImg = new Image();
    maskImg.crossOrigin = 'anonymous';
    maskImg.onload = () => {
      renderDottedGlobeTexture(globeCanvas, maskImg);
      globeTex.needsUpdate = true;
    };
    maskImg.src = 'https://unpkg.com/three-globe/example/img/earth-water.png';

    // 2. Fresnel Rim Glow Shader
    const rimGeo = new THREE.SphereGeometry(globeRadius * 1.014, 64, 64);
    const rimMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 3.2);
          vec3 col = mix(vec3(0.95, 0.96, 0.98), vec3(0.902, 0.224, 0.275), 0.35);
          gl_FragColor = vec4(col, fresnel * 0.42);
        }
      `
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    globeGroup.add(rimMesh);

    // 3. 3D City Markers for Recruiter HQs + Touchdown Pulsing Ring
    RECRUITER_EMAILS.forEach((d) => {
      const markerGeo = new THREE.SphereGeometry(0.015, 12, 12);
      const markerMat = new THREE.MeshBasicMaterial({ color: 0xe63946 });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.copy(latLngToVector3(d.lat, d.lng, globeRadius * 1.003));
      globeGroup.add(marker);
    });

    const dotGeo = new THREE.SphereGeometry(0.026, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xe63946 });
    const surfaceDot = new THREE.Mesh(dotGeo, dotMat);
    surfaceDot.visible = false;
    globeGroup.add(surfaceDot);
    surfaceDotRef.current = surfaceDot;

    const ringGeo = new THREE.RingGeometry(0.032, 0.054, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xe63946,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const surfaceRing = new THREE.Mesh(ringGeo, ringMat);
    surfaceRing.visible = false;
    globeGroup.add(surfaceRing);
    surfaceRingRef.current = surfaceRing;

    // 4. Clean White Email Sheet Texture + Kinematic 3D Origami Plane Rig
    if (!sheetCanvasRef.current) {
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 1024;
      sheetCanvasRef.current = c;
    }
    renderEmailSheetToCanvas(
      sheetCanvasRef.current,
      RECRUITER_EMAILS[0].toEmail,
      RECRUITER_EMAILS[0].subject,
      RECRUITER_EMAILS[0].body,
      0
    );
    const sheetTex = new THREE.CanvasTexture(sheetCanvasRef.current);
    sheetTex.colorSpace = THREE.SRGBColorSpace;
    sheetTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    sheetTexRef.current = sheetTex;

    const origamiRig = createOrigamiEmailPlaneRig(sheetTex);
    origamiRig.group.visible = false;
    scene.add(origamiRig.group);
    origamiRigRef.current = origamiRig;

    // 5. Glowing #e63946 Orbital Ribbon Trail
    const trail = createGlowingOrbitalTrail(96);
    scene.add(trail.mesh);
    trailRef.current = trail;

    globeGroup.rotation.set(0.32, -1.1, 0);

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // -------------------------------------------------------------------------
    // MASTER 60FPS ANIMATION LOOP
    // -------------------------------------------------------------------------
    let frameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const now = performance.now();
      const elapsed = clock.getElapsedTime();
      const st = animStateRef.current;

      // Globe Rotation & Smooth Inertia
      if (!st.isDragging) {
        if (st.targetGlobeRot) {
          globeGroup.rotation.x += (st.targetGlobeRot.x - globeGroup.rotation.x) * 0.045;
          globeGroup.rotation.y += (st.targetGlobeRot.y - globeGroup.rotation.y) * 0.045;
        } else {
          globeGroup.rotation.y += st.vel.y;
          globeGroup.rotation.x += st.vel.x;
          globeGroup.rotation.x = clamp(globeGroup.rotation.x, -1.1, 1.1);
          st.vel.x *= 0.94;
          st.vel.y = st.vel.y * 0.96 + 0.00032 * 0.04;
        }
      }

      // 4-Stage Origami Folding & Orbital Flight Sequence
      if (st.stage === 'sending') {
        const dt = (now - st.sendStartTime) / 1000;
        const foldDuration = st.slowMo ? 3.1 : 1.45;
        const flightDuration = 2.65;

        origamiRig.group.visible = true;

        if (dt <= foldDuration) {
          const foldT = clamp(dt / foldDuration, 0, 1);

          if (foldT > 0.14 && st.creaseAudioStage < 1) {
            st.creaseAudioStage = 1;
            foley.playOrigamiCrease(1.0);
          } else if (foldT > 0.44 && st.creaseAudioStage < 2) {
            st.creaseAudioStage = 2;
            foley.playOrigamiCrease(1.25);
          } else if (foldT > 0.68 && st.creaseAudioStage < 3) {
            st.creaseAudioStage = 3;
            foley.playOrigamiCrease(1.5);
            foley.playOrbitalGlide();
          }

          if (sheetCanvasRef.current && sheetTexRef.current) {
            renderEmailSheetToCanvas(
              sheetCanvasRef.current,
              st.sentSnapshot.to,
              st.sentSnapshot.sub,
              st.sentSnapshot.body,
              easeInOutCubic(foldT)
            );
            sheetTexRef.current.needsUpdate = true;
          }

          origamiRig.updateFold(foldT);

          // Lift the email sheet smoothly out of the bottom Email Composer Dock up toward the globe
          const easeT = easeInOutCubic(foldT);
          origamiRig.group.position.set(
            Math.sin(easeT * Math.PI) * 0.14,
            -0.55 + easeT * 0.88,
            1.78 + Math.sin(easeT * Math.PI * 0.5) * 0.16
          );
          origamiRig.group.rotation.set(
            -Math.sin(easeT * Math.PI) * 0.22,
            easeT * 0.52,
            -Math.sin(easeT * Math.PI) * 0.10
          );
          origamiRig.group.scale.setScalar(1.0);
        } else {
          // ORBITAL FLIGHT STAGE
          const { tailLocalPos } = origamiRig.updateFold(1.0);

          const flightT = clamp((dt - foldDuration) / flightDuration, 0, 1);
          const easedFlight = easeInOutCubic(flightT);

          const destLocal = latLngToVector3(st.dest.lat, st.dest.lng, globeRadius * 1.015);
          const destWorld = destLocal.clone().applyEuler(globeGroup.rotation).add(globeGroup.position);

          // Sweeping orbital trajectory around the dotted globe
          const startPos = new THREE.Vector3(0.0, 0.33, 1.94);
          const wp1 = new THREE.Vector3(1.18, 0.38, 1.58);
          const wp2 = new THREE.Vector3(1.88, 0.22, 0.36);
          const wp3 = new THREE.Vector3(1.32, 0.82, -1.08);
          const wp4 = new THREE.Vector3(-0.18, 1.42, 1.18);
          const approach = destWorld.clone().sub(globeGroup.position).multiplyScalar(1.16).add(globeGroup.position);

          const curve = new THREE.CatmullRomCurve3([
            startPos,
            wp1,
            wp2,
            wp3,
            wp4,
            approach,
            destWorld
          ]);

          const pos = curve.getPointAt(easedFlight);
          const tangent = curve.getTangentAt(easedFlight).normalize();

          origamiRig.group.position.copy(pos);

          // Construct orthonormal right-handed flight basis where:
          //   +Z (forwardAxis) = +tangent (where the sharp Nose N points!)
          //   +Y (upAxis)      = radial outward normal from globe center
          //   +X (rightAxis)   = upAxis x forwardAxis
          const radialUp = pos.clone().sub(globeGroup.position).normalize();
          const forwardAxis = tangent.clone().normalize();
          const rightAxis = new THREE.Vector3().crossVectors(radialUp, forwardAxis).normalize();
          if (rightAxis.lengthSq() < 0.001) rightAxis.set(1, 0, 0);
          const trueUpAxis = new THREE.Vector3().crossVectors(forwardAxis, rightAxis).normalize();

          const basisMatrix = new THREE.Matrix4().makeBasis(rightAxis, trueUpAxis, forwardAxis);
          const targetQuat = new THREE.Quaternion().setFromRotationMatrix(basisMatrix);

          // Subtle aerodynamic bank roll around the forward +Z axis
          const bankAngle = -Math.sin(flightT * Math.PI * 2.2) * 0.38;
          const bankQuat = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 0, 1),
            bankAngle
          );
          targetQuat.multiply(bankQuat);

          if (flightT < 0.04) {
            origamiRig.group.quaternion.copy(targetQuat);
          } else {
            origamiRig.group.quaternion.slerp(targetQuat, 0.38);
          }

          const touchdownTaper = 1.0 - easeInOutCubic(clamp((flightT - 0.85) / 0.15, 0, 1)) * 0.55;
          origamiRig.group.scale.setScalar(touchdownTaper);

          // Emit glowing #e63946 ribbon trail strictly from the rear tail (-Z) of the plane!
          const tailOffsetWorld = tailLocalPos
            .clone()
            .multiplyScalar(touchdownTaper)
            .applyQuaternion(origamiRig.group.quaternion);
          const tailWorld = pos.clone().add(tailOffsetWorld);

          st.trailPoints.push(tailWorld);
          if (st.trailPoints.length > 82) {
            st.trailPoints.shift();
          }
          trail.updateWithPoints(st.trailPoints);

          if (flightT >= 1.0) {
            origamiRig.group.visible = false;
            st.stage = 'landed';
            setStage('landed');
            foley.playTouchdownChime();
          }
        }
      } else if (st.stage === 'landed') {
        if (st.trailPoints.length > 2) {
          st.trailPoints.shift();
          trail.updateWithPoints(st.trailPoints);
        } else {
          trail.clear();
        }
      } else {
        origamiRig.group.visible = false;
        trail.clear();
      }

      // Update 3D Surface Pin, Pulsing Ring & 2D Screen Projection
      const localPin = latLngToVector3(st.dest.lat, st.dest.lng, globeRadius * 1.004);
      if (surfaceDotRef.current && surfaceRingRef.current) {
        surfaceDotRef.current.position.copy(localPin);
        surfaceDotRef.current.visible = st.stage === 'landed';

        surfaceRingRef.current.position.copy(localPin);
        surfaceRingRef.current.lookAt(localPin.clone().multiplyScalar(2));
        surfaceRingRef.current.visible = st.stage === 'landed';

        const pulse = 1.0 + ((elapsed * 1.6) % 1) * 1.4;
        surfaceRingRef.current.scale.setScalar(pulse);
        (surfaceRingRef.current.material as THREE.MeshBasicMaterial).opacity =
          0.85 * (1.0 - ((elapsed * 1.6) % 1));
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [foley]);

  // ---------------------------------------------------------------------------
  // GLOBE DRAG INTERACTION HANDLERS
  // ---------------------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    animStateRef.current.isDragging = true;
    animStateRef.current.targetGlobeRot = null;
    animStateRef.current.lastPointer = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = animStateRef.current;
    if (!st.isDragging || !globeGroupRef.current) return;

    const dx = e.clientX - st.lastPointer.x;
    const dy = e.clientY - st.lastPointer.y;

    globeGroupRef.current.rotation.y += dx * 0.0055;
    globeGroupRef.current.rotation.x = clamp(
      globeGroupRef.current.rotation.x + dy * 0.0055,
      -1.1,
      1.1
    );

    st.vel = {
      x: dy * 0.0012,
      y: dx * 0.0012
    };
    st.lastPointer = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    animStateRef.current.isDragging = false;
  };

  const handleManualSelectRecruiter = (idx: number) => {
    setEmailIndex(idx);
    setStage('composing');
    animStateRef.current.stage = 'composing';
    animStateRef.current.trailPoints = [];
    if (trailRef.current) trailRef.current.clear();
  };

  return (
    <div
      id="demo"
      className="relative mx-auto mt-8 h-[540px] w-full max-w-[860px] scroll-mt-20 overflow-hidden select-none flex flex-col items-center justify-between font-sans text-slate-800 max-sm:mt-6 max-sm:h-[500px]"
    >
      {/* 3D WebGL Dotted Globe & Origami Flight Canvas */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
      />

      {/* =====================================================================
          CLEAN EMAIL COMPOSER CARD (MATCHING UPLOADED SCREENSHOT 100%)
          Always visible at the bottom of the screen; when Send triggers, the
          3D sheet lifts & folds into the paper plane while this draft card
          smoothly shows sending/delivered feedback and resets for the next loop.
         ===================================================================== */}
      <div className="absolute bottom-0 left-1/2 z-30 w-[92%] max-w-[620px] -translate-x-1/2 pointer-events-auto">
        <div
          className={`rounded-[14px] bg-white border border-slate-200/95 text-left shadow-[0_12px_32px_rgba(15,23,42,0.12),0_2px_8px_rgba(15,23,42,0.05)] overflow-hidden transition-all duration-300 ${
            stage === 'sending' ? 'ring-2 ring-[#e63946]/30' : ''
          }`}
        >
          {/* ROW 1: TO + Recipient Email + CC / BCC */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-[#f8fafc] border-b border-slate-200/80">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <span className="text-[10px] font-semibold tracking-[0.06em] text-slate-500 uppercase w-7 shrink-0">
                TO
              </span>
              <input
                type="text"
                value={toEmail}
                onChange={(e) => {
                  setIsAutoLoop(false);
                  setToEmail(e.target.value);
                }}
                className="w-full bg-transparent text-[12.5px] font-normal text-slate-900 focus:outline-none truncate"
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.04em] text-slate-500 shrink-0 ml-2">
              <button
                type="button"
                className="hover:text-slate-800 transition-colors cursor-pointer"
              >
                CC
              </button>
              <button
                type="button"
                className="hover:text-slate-800 transition-colors cursor-pointer"
              >
                BCC
              </button>
            </div>
          </div>

          {/* ROW 2: SUB + Bold ATS-Tailored Subject Line */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-[#f8fafc] border-b border-slate-200/80">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <span className="text-[10px] font-semibold tracking-[0.06em] text-slate-500 uppercase w-7 shrink-0">
                SUB
              </span>
              <input
                type="text"
                value={subject}
                onChange={(e) => {
                  setIsAutoLoop(false);
                  setSubject(e.target.value);
                }}
                className="w-full bg-transparent text-[12.5px] font-bold text-slate-900 focus:outline-none truncate"
              />
            </div>

          </div>

          {/* ROW 3: FULL EMAIL MESSAGE BODY (Clean white canvas, never clipped) */}
          <div className="relative flex h-[118px] shrink-0 flex-col bg-white px-4 py-2">
            <div ref={draftBodyRef} className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
              {isAutoLoop ? (
                <div
                  onClick={() => setIsAutoLoop(false)}
                  title="Click anywhere to pause auto-loop and edit manually"
                  className="text-[12.5px] leading-[1.45] text-slate-800 whitespace-pre-wrap break-words font-normal cursor-text"
                >
                  {typedBody}
                  <span className="inline-block w-[2px] h-[17px] bg-[#1d63dc] ml-[1px] align-middle animate-pulse" />
                </div>
              ) : (
                <textarea
                  ref={editBodyRef}
                  value={typedBody}
                  onChange={(e) => {
                    setTypedBody(e.target.value);
                    foley.playKeyClick();
                  }}
                  rows={5}
                  placeholder="Write your tailored recruiter email..."
                  className="h-full w-full overflow-y-auto bg-transparent text-[12.5px] leading-[1.45] text-slate-800 placeholder-slate-400 focus:outline-none resize-none [scrollbar-width:thin]"
                />
              )}
            </div>

            {/* Attached Resume Pill Badge */}
            <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/75 text-slate-700 font-medium">
                <svg
                  className="w-3 h-3 text-[#e63946]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                <span>Alex_Resume_{currentTemplate.company}_ATS.pdf</span>
                <span className="text-slate-400 text-[9px]">(142 KB)</span>
              </div>

            </div>
          </div>

          {/* ROW 4: BOTTOM ACTION BAR (Send Pill on Left + Formatting Icons on Right) */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-white border-t border-slate-100">
            {/* Left: Pill Send Button matching screenshot layout */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() =>
                  triggerSendEmail(
                    currentTemplate,
                    toEmail,
                    subject,
                    typedBody || currentTemplate.body
                  )
                }
                disabled={stage === 'sending'}
                className={`min-h-7 rounded-[9px] border px-3 py-1 text-[10px] font-semibold text-white shadow-[0_2px_4px_rgba(23,43,50,0.12)] ring-1 transition duration-200 active:translate-y-px cursor-pointer ${
                  stage === 'sending'
                    ? 'border-[#cf3340] bg-[#e63946] ring-[#a92230] opacity-80'
                    : stage === 'landed'
                    ? 'border-[#cf3340] bg-[#e63946] ring-[#a92230] hover:bg-[#bd2634]'
                    : 'border-[#cf3340] bg-[#e63946] ring-[#a92230] hover:bg-[#bd2634]'
                }`}
              >
                {stage === 'sending'
                  ? 'Sending...'
                  : stage === 'landed'
                  ? 'Sent ✓'
                  : 'Send'}
              </button>

            </div>

            {/* Right: Rich Formatting & Attachment Toolbar Icons matching Screenshot */}
            <div className="flex items-center gap-2.5 text-slate-500">
              <div className="flex items-center gap-3 pr-3 border-r border-slate-200">
                <button
                  type="button"
                  title="Bold"
                  className="hover:text-slate-800 font-serif font-bold text-[14px] transition-colors"
                >
                  B
                </button>
                <button
                  type="button"
                  title="Italic"
                  className="hover:text-slate-800 font-serif italic text-[14px] transition-colors"
                >
                  I
                </button>
                <button
                  type="button"
                  title="Underline"
                  className="hover:text-slate-800 font-serif underline text-[14px] transition-colors"
                >
                  U
                </button>
              </div>

              <div className="flex items-center gap-3 pr-3 border-r border-slate-200">
                {/* Link Icon */}
                <button
                  type="button"
                  title="Insert link"
                  className="hover:text-slate-800 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </button>

                {/* Paperclip Attachment Icon */}
                <button
                  type="button"
                  title="Attach file"
                  className="hover:text-slate-800 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>

                {/* Emoji Smile Icon */}
                <button
                  type="button"
                  title="Insert emoji"
                  className="hover:text-slate-800 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* More Options (...) */}
                <button
                  type="button"
                  title="More options"
                  className="hover:text-slate-800 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                  </svg>
                </button>

                {/* Trash / Reset Draft */}
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = (emailIndex + 1) % RECRUITER_EMAILS.length;
                    handleManualSelectRecruiter(nextIdx);
                  }}
                  title="Cycle next recruiter draft"
                  className="hover:text-[#e63946] transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
