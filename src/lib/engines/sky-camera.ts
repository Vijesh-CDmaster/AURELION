/**
 * Sky-Camera Computer-Vision Pipeline (Simulated)
 *
 * Simulates a ground-based total-sky imager (TSI) that:
 *  1. Captures 64×64 synthetic "sky images" (R/B ratio channels)
 *  2. Runs blob detection to identify cloud objects
 *  3. Estimates cloud optical depth & velocity via frame-to-frame tracking
 *  4. Produces CloudDetection objects consumed by the Forecast Engine
 *
 * In production this would wrap an ONNX / TFLite CNN model; here we
 * implement the equivalent signal-processing pipeline on synthetic data
 * so every metric is algorithm-derived, not random.
 *
 * Camera specs (simulated):
 *   Resolution : 64 × 64 px (hemispherical projection)
 *   Frame rate : 1 fps (one frame per tick ≈ 2 s)
 *   Sensor     : R/B dual-channel (Red/Blue ratio for cloud/sky separation)
 */

// ── Types ────────────────────────────────────────────────────────────

export interface SkyPixel {
  r: number;   // red channel 0–255
  b: number;   // blue channel 0–255
  rbr: number; // red-blue ratio = (r - b) / (r + b), cloud > 0.05
}

export interface CloudBlob {
  id: string;
  centroidX: number;  // 0–63 px
  centroidY: number;
  area: number;       // pixels
  meanRBR: number;
  opticalDepth: number; // 0 (thin cirrus) … 1 (cumulonimbus)
  velocityX: number;  // px/frame
  velocityY: number;
}

export interface SkyCameraFrame {
  timestamp: number;
  width: number;
  height: number;
  cloudFraction: number; // 0–1
  blobs: CloudBlob[];
  meanRBR: number;
  sunElevation: number;
  processingTimeMs: number;
}

export interface SkyCameraMetrics {
  framesProcessed: number;
  avgProcessingMs: number;
  cloudFraction: number;
  blobCount: number;
  avgOpticalDepth: number;
  avgCloudVelocity: number;
  lastFrame: SkyCameraFrame | null;
  rampAlert: boolean;        // true when imminent ramp-down detected
  rampMagnitude: number;     // predicted irradiance drop percentage
  rampLeadTimeSec: number;   // seconds until ramp hits
}

// ── Synthetic Image Generator ────────────────────────────────────────

const W = 64, H = 64;

/**
 * Generate a synthetic 64×64 sky image based on current cloud state.
 * Clouds appear as high-R low-B regions (RBR > 0.05);
 * clear sky is low-R high-B (RBR < -0.1).
 */
function synthesiseFrame(
  clouds: { x: number; y: number; size: number; opacity: number }[],
  gridSize: number,
  sunElev: number,
): SkyPixel[][] {
  const img: SkyPixel[][] = [];
  const scale = W / gridSize;

  // Base sky colour depends on sun elevation
  const skyB = Math.min(220, Math.max(40, sunElev * 4 + 60));
  const skyR = Math.min(120, Math.max(30, sunElev * 1.5 + 30));

  for (let y = 0; y < H; y++) {
    const row: SkyPixel[] = [];
    for (let x = 0; x < W; x++) {
      let r = skyR + (Math.random() - 0.5) * 8;
      let b = skyB + (Math.random() - 0.5) * 8;

      // Overlay clouds
      for (const c of clouds) {
        const cx = c.x * scale, cy = c.y * scale;
        const rad = c.size * scale * 0.75;
        const dx = x - cx, dy = y - cy;
        const d2 = dx * dx + dy * dy;
        const r2 = rad * rad;
        if (d2 < r2 * 4) {
          const weight = c.opacity * Math.exp(-d2 / (2 * r2));
          // Clouds: boost red, reduce blue
          r += weight * 140;
          b -= weight * 80;
        }
      }

      r = Math.max(0, Math.min(255, r));
      b = Math.max(0, Math.min(255, b));
      const rbr = (r + b) > 0 ? (r - b) / (r + b) : 0;
      row.push({ r, b, rbr });
    }
    img.push(row);
  }
  return img;
}

// ── Blob Detection (connected-component on thresholded RBR) ──────────

interface RawBlob {
  pixels: { x: number; y: number }[];
  sumRBR: number;
}

function detectBlobs(img: SkyPixel[][], rbrThreshold = 0.05): RawBlob[] {
  const visited = new Uint8Array(W * H);
  const blobs: RawBlob[] = [];

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (visited[y * W + x]) continue;
      if (img[y][x].rbr <= rbrThreshold) continue;

      // BFS flood-fill
      const blob: RawBlob = { pixels: [], sumRBR: 0 };
      const queue = [{ x, y }];
      visited[y * W + x] = 1;

      while (queue.length > 0) {
        const p = queue.shift()!;
        blob.pixels.push(p);
        blob.sumRBR += img[p.y][p.x].rbr;

        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nx = p.x + dx, ny = p.y + dy;
          if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
          if (visited[ny * W + nx]) continue;
          if (img[ny][nx].rbr <= rbrThreshold) continue;
          visited[ny * W + nx] = 1;
          queue.push({ x: nx, y: ny });
        }
      }

      if (blob.pixels.length >= 4) blobs.push(blob); // ignore tiny noise
    }
  }
  return blobs;
}

// ── Optical Depth Estimation ─────────────────────────────────────────

function estimateOpticalDepth(meanRBR: number): number {
  // Empirical mapping: higher RBR → denser cloud → higher optical depth
  // τ ≈ 2.5 · RBR^0.8  (capped at 1.0)
  return Math.min(1.0, 2.5 * Math.pow(Math.max(0, meanRBR), 0.8));
}

// ── Engine ───────────────────────────────────────────────────────────

export class SkyCameraEngine {
  private prevBlobs: CloudBlob[] = [];
  private frameCount = 0;
  private totalProcessingMs = 0;
  metrics: SkyCameraMetrics;

  constructor() {
    this.metrics = {
      framesProcessed: 0, avgProcessingMs: 0,
      cloudFraction: 0, blobCount: 0,
      avgOpticalDepth: 0, avgCloudVelocity: 0,
      lastFrame: null,
      rampAlert: false, rampMagnitude: 0, rampLeadTimeSec: 0,
    };
  }

  /**
   * Process one sky-camera frame.
   * @param clouds  Current cloud objects from ForecastEngine
   * @param gridSize  Spatial grid dimension (matches ForecastEngine)
   * @param sunElev  Solar elevation angle (degrees)
   * @returns  SkyCameraFrame with blob detections
   */
  processFrame(
    clouds: { x: number; y: number; size: number; opacity: number }[],
    gridSize: number,
    sunElev: number,
  ): SkyCameraFrame {
    const t0 = performance.now();

    // 1. Synthesise image
    const img = synthesiseFrame(clouds, gridSize, sunElev);

    // 2. Global stats
    let totalRBR = 0, cloudPixels = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        totalRBR += img[y][x].rbr;
        if (img[y][x].rbr > 0.05) cloudPixels++;
      }
    }
    const cloudFraction = cloudPixels / (W * H);
    const meanRBR = totalRBR / (W * H);

    // 3. Blob detection
    const rawBlobs = detectBlobs(img);

    // 4. Build CloudBlob list with tracking
    const blobs: CloudBlob[] = rawBlobs.map((rb, i) => {
      const cx = rb.pixels.reduce((s, p) => s + p.x, 0) / rb.pixels.length;
      const cy = rb.pixels.reduce((s, p) => s + p.y, 0) / rb.pixels.length;
      const mRBR = rb.sumRBR / rb.pixels.length;
      const od = estimateOpticalDepth(mRBR);

      // Frame-to-frame velocity via nearest-neighbour matching
      let vx = 0, vy = 0;
      if (this.prevBlobs.length > 0) {
        let bestDist = Infinity, bestIdx = -1;
        for (let j = 0; j < this.prevBlobs.length; j++) {
          const dx = cx - this.prevBlobs[j].centroidX;
          const dy = cy - this.prevBlobs[j].centroidY;
          const d = dx * dx + dy * dy;
          if (d < bestDist) { bestDist = d; bestIdx = j; }
        }
        if (bestIdx >= 0 && bestDist < 400) { // max 20px movement
          vx = cx - this.prevBlobs[bestIdx].centroidX;
          vy = cy - this.prevBlobs[bestIdx].centroidY;
        }
      }

      return {
        id: `blob-${i}`,
        centroidX: cx, centroidY: cy,
        area: rb.pixels.length,
        meanRBR: mRBR,
        opticalDepth: od,
        velocityX: vx, velocityY: vy,
      };
    });

    this.prevBlobs = blobs;

    // 5. Ramp detection: check if any dense blob is heading toward grid centre
    let rampAlert = false, rampMag = 0, rampLead = Infinity;
    const center = W / 2;
    for (const b of blobs) {
      if (b.opticalDepth < 0.3) continue;
      const distToCenter = Math.sqrt((b.centroidX - center) ** 2 + (b.centroidY - center) ** 2);
      const speed = Math.sqrt(b.velocityX ** 2 + b.velocityY ** 2);
      if (speed < 0.5) continue;

      // Direction toward center?
      const dx = center - b.centroidX, dy = center - b.centroidY;
      const dot = dx * b.velocityX + dy * b.velocityY;
      if (dot > 0) {
        // ETA = distance / speed, each frame ≈ 2s
        const etaFrames = distToCenter / speed;
        const etaSec = etaFrames * 2;
        if (etaSec < 60 && etaSec < rampLead) {
          rampAlert = true;
          rampLead = etaSec;
          rampMag = Math.max(rampMag, b.opticalDepth * 80); // % irradiance drop
        }
      }
    }

    const procMs = performance.now() - t0;
    this.frameCount++;
    this.totalProcessingMs += procMs;

    const frame: SkyCameraFrame = {
      timestamp: Date.now(),
      width: W, height: H,
      cloudFraction, blobs,
      meanRBR, sunElevation: sunElev,
      processingTimeMs: procMs,
    };

    // Aggregate metrics
    const avgOD = blobs.length > 0
      ? blobs.reduce((s, b) => s + b.opticalDepth, 0) / blobs.length : 0;
    const avgVel = blobs.length > 0
      ? blobs.reduce((s, b) => s + Math.sqrt(b.velocityX ** 2 + b.velocityY ** 2), 0) / blobs.length : 0;

    this.metrics = {
      framesProcessed: this.frameCount,
      avgProcessingMs: this.totalProcessingMs / this.frameCount,
      cloudFraction, blobCount: blobs.length,
      avgOpticalDepth: avgOD,
      avgCloudVelocity: avgVel,
      lastFrame: frame,
      rampAlert, rampMagnitude: rampMag,
      rampLeadTimeSec: rampAlert ? rampLead : 0,
    };

    return frame;
  }

  /** Feed sky-camera detections into forecast engine's cloud model */
  refineForecastClouds(
    forecastClouds: { id: string; x: number; y: number; vx: number; vy: number; opacity: number; size: number }[],
    gridSize: number,
  ): { id: string; x: number; y: number; vx: number; vy: number; opacity: number; size: number }[] {
    if (this.prevBlobs.length === 0) return forecastClouds;

    const pxToGrid = gridSize / W;

    // Update existing forecast clouds with camera-observed velocities & opacities
    const refined = forecastClouds.map(fc => {
      // Find nearest camera blob
      const fcPx = fc.x / pxToGrid;
      const fcPy = fc.y / pxToGrid;
      let bestDist = Infinity, bestBlob: CloudBlob | null = null;
      for (const b of this.prevBlobs) {
        const d = (b.centroidX - fcPx) ** 2 + (b.centroidY - fcPy) ** 2;
        if (d < bestDist) { bestDist = d; bestBlob = b; }
      }

      if (bestBlob && bestDist < (15 * 15)) {
        // Nudge forecast toward camera observation (α = 0.3 blend)
        const α = 0.3;
        return {
          ...fc,
          vx: fc.vx * (1 - α) + bestBlob.velocityX * pxToGrid * α,
          vy: fc.vy * (1 - α) + bestBlob.velocityY * pxToGrid * α,
          opacity: fc.opacity * (1 - α) + bestBlob.opticalDepth * α,
        };
      }
      return fc;
    });

    return refined;
  }
}
