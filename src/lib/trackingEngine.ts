import { Detection, TrackedObject, TrackerConfig, TrackerType, LineCrossingBoundary, ROIZone, EventLogEntry } from '../types';
import { KalmanBoxFilter } from './kalmanFilter';
import { solveHungarian, calculateIoU, calculateCosineDistance } from './hungarian';

// Color palette for track IDs (accessible vivid hues)
const TRACK_COLORS = [
  '#00F0FF', // Cyan
  '#FFB800', // Amber
  '#FF0055', // Neon Pink
  '#00FF66', // Lime
  '#7000FF', // Vivid Violet
  '#FF6B00', // Orange
  '#0099FF', // Sky Blue
  '#FF00AA', // Magenta
  '#A3FF00', // Electric Green
  '#FFD700', // Gold
];

export class TrackInstance {
  public trackId: number;
  public kalman: KalmanBoxFilter;
  public classLabel: string;
  public confidence: number;
  public color: string;
  public hits: number = 1;
  public age: number = 1;
  public timeSinceUpdate: number = 0;
  public history: { x: number; y: number; timestamp: number }[] = [];
  public firstSeenFrame: number;
  public lastSeenFrame: number;
  public firstSeenTime: number;
  public lastSeenTime: number;
  public status: 'tentative' | 'active' | 'occluded' | 'lost' = 'tentative';
  public embedding?: number[];
  public attributes?: string;

  constructor(trackId: number, detection: Detection, frameNumber: number) {
    this.trackId = trackId;
    this.classLabel = detection.classLabel;
    this.confidence = detection.confidence;
    this.color = TRACK_COLORS[(trackId - 1) % TRACK_COLORS.length];
    this.kalman = new KalmanBoxFilter(detection.box);
    this.embedding = detection.embedding;
    this.firstSeenFrame = frameNumber;
    this.lastSeenFrame = frameNumber;
    this.firstSeenTime = Date.now();
    this.lastSeenTime = Date.now();

    const center = {
      x: detection.box.x + detection.box.width / 2,
      y: detection.box.y + detection.box.height / 2,
      timestamp: Date.now(),
    };
    this.history.push(center);
  }

  public predict() {
    this.age++;
    this.timeSinceUpdate++;
    const predictedBox = this.kalman.predict();

    if (this.timeSinceUpdate > 1) {
      this.status = 'occluded';
    }
    return predictedBox;
  }

  public update(detection: Detection, frameNumber: number, maxTrailLength: number = 25) {
    this.kalman.update(detection.box);
    this.confidence = 0.7 * this.confidence + 0.3 * detection.confidence;
    this.classLabel = detection.classLabel;
    this.timeSinceUpdate = 0;
    this.hits++;
    this.lastSeenFrame = frameNumber;
    this.lastSeenTime = Date.now();
    if (detection.embedding) {
      this.embedding = detection.embedding;
    }

    if (this.hits >= 2) {
      this.status = 'active';
    }

    const currentBox = this.kalman.toBoundingBox();
    const center = {
      x: currentBox.x + currentBox.width / 2,
      y: currentBox.y + currentBox.height / 2,
      timestamp: Date.now(),
    };

    this.history.push(center);
    if (this.history.length > maxTrailLength) {
      this.history.shift();
    }
  }

  public toTrackedObject(): TrackedObject {
    const currentBox = this.kalman.toBoundingBox();
    const velocity = this.kalman.getVelocityInfo();

    return {
      trackId: this.trackId,
      classLabel: this.classLabel,
      confidence: Math.round(this.confidence * 100) / 100,
      currentBox,
      velocity,
      status: this.timeSinceUpdate > 0 ? 'occluded' : this.status,
      color: this.color,
      age: this.age,
      hits: this.hits,
      timeSinceUpdate: this.timeSinceUpdate,
      history: [...this.history],
      firstSeenFrame: this.firstSeenFrame,
      lastSeenFrame: this.lastSeenFrame,
      firstSeenTime: this.firstSeenTime,
      lastSeenTime: this.lastSeenTime,
      embedding: this.embedding,
      attributes: this.attributes,
    };
  }
}

export class OBTrackerEngine {
  private tracks: TrackInstance[] = [];
  private nextTrackId: number = 101;
  private frameCount: number = 0;
  private totalObjectsEverTracked: number = 0;

  constructor() {}

  public reset() {
    this.tracks = [];
    this.nextTrackId = 101;
    this.frameCount = 0;
    this.totalObjectsEverTracked = 0;
  }

  public processFrame(
    detections: Detection[],
    trackerType: TrackerType,
    config: TrackerConfig,
    lines: LineCrossingBoundary[] = [],
    zones: ROIZone[] = [],
    canvasWidth: number = 800,
    canvasHeight: number = 600
  ): {
    activeTracks: TrackedObject[];
    eventLogs: EventLogEntry[];
    totalUniqueObjects: number;
  } {
    this.frameCount++;
    const eventLogs: EventLogEntry[] = [];

    // Filter detections by confidence threshold
    const validDetections = detections.filter((d) => d.confidence >= config.confidenceThreshold);

    // 1. Predict new locations for all existing tracks
    const predictedBoxes = this.tracks.map((t) => t.predict());

    // 2. Compute cost matrix between existing tracks and new detections
    const numTracks = this.tracks.length;
    const numDets = validDetections.length;
    const costMatrix: number[][] = [];

    for (let i = 0; i < numTracks; i++) {
      costMatrix[i] = [];
      const track = this.tracks[i];
      const predBox = predictedBoxes[i];

      for (let j = 0; j < numDets; j++) {
        const det = validDetections[j];
        const iou = calculateIoU(predBox, det.box);

        let cost = 1.0 - iou;

        // In DeepSORT mode, factor in cosine distance if embeddings exist
        if (trackerType === 'deepsort' && track.embedding && det.embedding) {
          const cosDist = calculateCosineDistance(track.embedding, det.embedding);
          const weight = config.appearanceWeight;
          cost = (1 - weight) * cost + weight * cosDist;
        }

        costMatrix[i][j] = cost;
      }
    }

    // 3. Solve matching using Hungarian algorithm
    const maxAllowedCost = 1.0 - config.iouThreshold;
    const { matches, unmatchedRowIndices, unmatchedColIndices } = solveHungarian(costMatrix);

    const matchedTrackIndices = new Set<number>();
    const matchedDetIndices = new Set<number>();

    // Process matched track-detection pairs
    for (const [trackIdx, detIdx] of matches) {
      const cost = costMatrix[trackIdx][detIdx];
      if (cost <= maxAllowedCost) {
        matchedTrackIndices.add(trackIdx);
        matchedDetIndices.add(detIdx);

        const track = this.tracks[trackIdx];
        const wasTentative = track.status === 'tentative';
        track.update(validDetections[detIdx], this.frameCount, config.trailLength);

        if (wasTentative && track.status === 'active') {
          eventLogs.push({
            id: `evt-${Date.now()}-${track.trackId}`,
            timestamp: new Date().toLocaleTimeString(),
            frameNumber: this.frameCount,
            type: 'id_assigned',
            trackId: track.trackId,
            classLabel: track.classLabel,
            message: `New Track #${track.trackId} confirmed (${track.classLabel})`,
            badgeColor: track.color,
          });
        }
      }
    }

    // 4. Create new tracks for unmatched detections
    for (let j = 0; j < numDets; j++) {
      if (!matchedDetIndices.has(j)) {
        const newTrack = new TrackInstance(this.nextTrackId++, validDetections[j], this.frameCount);
        this.tracks.push(newTrack);
        this.totalObjectsEverTracked++;
      }
    }

    // 5. Remove lost tracks exceeding maxAge
    const remainingTracks: TrackInstance[] = [];
    for (let i = 0; i < this.tracks.length; i++) {
      const track = this.tracks[i];
      if (track.timeSinceUpdate > config.maxAge) {
        if (track.status === 'active') {
          eventLogs.push({
            id: `evt-lost-${Date.now()}-${track.trackId}`,
            timestamp: new Date().toLocaleTimeString(),
            frameNumber: this.frameCount,
            type: 'id_lost',
            trackId: track.trackId,
            classLabel: track.classLabel,
            message: `Track #${track.trackId} (${track.classLabel}) left scene / lost`,
            badgeColor: '#9CA3AF',
          });
        }
      } else {
        remainingTracks.push(track);
      }
    }
    this.tracks = remainingTracks;

    // 6. Check Line-Crossing and ROI Zone entries
    this.checkLineCrossings(lines, canvasWidth, canvasHeight, eventLogs);
    this.updateROIZones(zones, canvasWidth, canvasHeight);

    // Filter tracks to return active or near-active ones for UI rendering
    const activeTracks = this.tracks
      .filter((t) => t.hits >= config.minHits || t.timeSinceUpdate === 0)
      .map((t) => t.toTrackedObject());

    return {
      activeTracks,
      eventLogs,
      totalUniqueObjects: this.totalObjectsEverTracked,
    };
  }

  private checkLineCrossings(lines: LineCrossingBoundary[], width: number, height: number, eventLogs: EventLogEntry[]) {
    if (lines.length === 0) return;

    for (const track of this.tracks) {
      if (track.history.length < 2) continue;

      const pCurrent = track.history[track.history.length - 1];
      const pPrev = track.history[track.history.length - 2];

      for (const line of lines) {
        const l1 = { x: line.p1.x * width, y: line.p1.y * height };
        const l2 = { x: line.p2.x * width, y: line.p2.y * height };

        if (this.intersectsLineSegment(pPrev, pCurrent, l1, l2)) {
          // Determine direction across line using cross product
          const dir = (l2.x - l1.x) * (pCurrent.y - l1.y) - (l2.y - l1.y) * (pCurrent.x - l1.x);
          if (dir > 0) {
            line.countIn++;
          } else {
            line.countOut++;
          }

          eventLogs.push({
            id: `crossing-${Date.now()}-${track.trackId}`,
            timestamp: new Date().toLocaleTimeString(),
            frameNumber: this.frameCount,
            type: 'line_crossed',
            trackId: track.trackId,
            classLabel: track.classLabel,
            message: `Track #${track.trackId} (${track.classLabel}) crossed line '${line.name}'`,
            badgeColor: line.color,
          });
        }
      }
    }
  }

  private intersectsLineSegment(
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number },
    d: { x: number; y: number }
  ): boolean {
    const ccw = (p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) =>
      (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);

    return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
  }

  private updateROIZones(zones: ROIZone[], width: number, height: number) {
    for (const zone of zones) {
      let count = 0;
      const zX = zone.x * width;
      const zY = zone.y * height;
      const zW = zone.width * width;
      const zH = zone.height * height;

      for (const track of this.tracks) {
        const box = track.kalman.toBoundingBox();
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;

        if (cx >= zX && cx <= zX + zW && cy >= zY && cy <= zY + zH) {
          count++;
        }
      }
      zone.objectCount = count;
    }
  }
}
