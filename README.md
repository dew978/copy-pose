# copy pose

Two-player, same-camera, five-round pose matching game. Static ES module application, Korean UI. All camera frames and pose inference remain on the player's device. No microphone, frame upload, or backend database.

## Gameplay

- Left and right screen halves identify Player 1 and Player 2. Players must remain in their assigned halves.
- Three-second preparation, then a five-second scoring window per round.
- Five exact reference pose diagrams are generated from the same landmarks used by the scoring function.
- Coordinates are mirrored into display space and corrected for video aspect ratio. Segment directions and elbow/knee angles are compared, removing translation and body-scale differences.
- Scores are the maximum mean of a 350–650 ms valid sample window with at least three observations. No random scores or face-based scoring.
- Missing full-body data causes a retry instead of awarding a false score or a default win.
- Five rounds always play. Round wins determine the match; average percentage breaks a tied win count; equal averages produce shared victory.
- Final winner receives a tracked, glowing body envelope and canvas fireworks. Reduced-motion preference reduces animation.

## Inference

MediaPipe Tasks Vision 0.10.21, Pose Landmarker Full, two poses, GPU with CPU fallback. Hosted mode uses a classic worker with main-thread fallback. The downloadable HTML embeds the JavaScript, baseline WASM and model, uses lazy local Blob URLs and the main-thread GPU path, and makes no model/font network requests. Camera permission is requested before any audio or model waits. Camera video remains available on model failure, with a separate retry. Permission, video and model errors are distinguished. Late permission grants after cancellation are explicitly released.

## Validation

Run `node --test tests/*.test.mjs`. Static delivery requires no build. Run `python run_game.py` for a local camera-compatible loopback origin. `npm run dev` serves a development preview. `node scripts/build-download.mjs /absolute/path/CopyPose.html` generates the standalone offline-model HTML.

Real camera accuracy and frame rate need checking on the intended webcam/PC with two people. The automatic tests validate scoring, mirroring, player assignment, invalid tracking, and five-round match outcomes. The displayed percentage is a game similarity estimate, not a scientific measurement.

## Third-party assets

MediaPipe: https://github.com/google-ai-edge/mediapipe (Apache License 2.0). Tasks Vision npm distribution: https://www.npmjs.com/package/@mediapipe/tasks-vision. Pose model: https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task.
