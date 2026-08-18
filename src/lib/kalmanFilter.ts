import { BoundingBox } from '../types';

/**
 * 2D Bounding Box Kalman Filter for SORT/DeepSORT object tracking.
 * State vector z: [cx, cy, s, r, vx, vy, vs]
 * where:
 *  (cx, cy): center of bounding box
 *  s: scale (area = width * height)
 *  r: aspect ratio (width / height)
 *  (vx, vy, vs): velocities of cx, cy, s
 */
export class KalmanBoxFilter {
  // Estimated State Vector
  public cx: number;
  public cy: number;
  public s: number;
  public r: number;
  public vx: number = 0;
  public vy: number = 0;
  public vs: number = 0;

  // Measurement uncertainty
  private processNoise: number = 1.0;
  private measurementNoise: number = 10.0;

  constructor(box: BoundingBox) {
    this.cx = box.x + box.width / 2;
    this.cy = box.y + box.height / 2;
    this.s = Math.max(1, box.width * box.height);
    this.r = box.height > 0 ? box.width / box.height : 1.0;
  }

  /**
   * Predicts the next bounding box location based on current state & velocity.
   */
  public predict(): BoundingBox {
    // Apply constant velocity motion model
    this.cx += this.vx;
    this.cy += this.vy;
    this.s = Math.max(1, this.s + this.vs);

    // Damping on velocities to prevent runaway predictions during long occlusion
    this.vx *= 0.95;
    this.vy *= 0.95;
    this.vs *= 0.95;

    return this.toBoundingBox();
  }

  /**
   * Updates state estimate with actual detection measurement.
   */
  public update(box: BoundingBox) {
    const measCx = box.x + box.width / 2;
    const measCy = box.y + box.height / 2;
    const measS = Math.max(1, box.width * box.height);
    const measR = box.height > 0 ? box.width / box.height : this.r;

    // Alpha-Beta gain filter update
    const alpha = 0.6; // position correction weight
    const beta = 0.4;  // velocity correction weight

    const dx = measCx - this.cx;
    const dy = measCy - this.cy;
    const ds = measS - this.s;

    // Update position
    this.cx += alpha * dx;
    this.cy += alpha * dy;
    this.s += alpha * ds;
    this.r = 0.8 * this.r + 0.2 * measR;

    // Update velocity estimate
    this.vx += beta * dx;
    this.vy += beta * dy;
    this.vs += beta * ds;
  }

  /**
   * Converts current Kalman state back to a pixel BoundingBox [x, y, w, h]
   */
  public toBoundingBox(): BoundingBox {
    const w = Math.sqrt(Math.max(1, this.s * this.r));
    const h = this.r > 0 ? w / this.r : w;
    const x = this.cx - w / 2;
    const y = this.cy - h / 2;

    return {
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: Math.max(2, w),
      height: Math.max(2, h),
    };
  }

  /**
   * Returns current velocity magnitude (pixels/frame) and direction in degrees.
   */
  public getVelocityInfo() {
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const angleRad = Math.atan2(this.vy, this.vx);
    const angleDeg = ((angleRad * 180) / Math.PI + 360) % 360;

    return {
      vx: this.vx,
      vy: this.vy,
      speed: Math.round(speed * 10) / 10,
      angleDeg: Math.round(angleDeg),
    };
  }
}
