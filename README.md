# copy pose

One-player practice or two-player same-camera pose matching game. Choose 1, 3, or 5 rounds. Static ES module application, Korean UI. All camera frames and pose inference remain on the player's device. No microphone, frame upload, or backend database.

## Gameplay

- Left and right screen halves identify Player 1 and Player 2. Players must remain in their assigned halves.
- All required full bodies automatically trigger a three-second countdown, followed immediately by a five-second scoring window. Losing recognition cancels the countdown; returning restarts it from three. Results pause before the next automatic round. Final results remain until replay is armed; the replay button works even up close.
- Ten exact reference pose diagrams are generated from the same landmarks used by the scoring function.
- Coordinates are mirrored into display space and corrected for video aspect ratio. Segment directions and elbow/knee angles are compared, removing translation and body-scale differences.
- Scores are the maximum mean of a 350–650 ms valid sample window with at least three observations. No random scores or face-based scoring.
- Missing full-body data causes a retry instead of awarding a false score or a default win.
- The selected 1, 3, or 5 rounds always play. Round wins determine the match; average percentage breaks a tied win count; equal averages produce shared victory.
- Final winner receives a tracked, glowing body envelope and canvas fireworks. Reduced-motion preference reduces animation.

## Practice mode

Select 1인 연습 before starting. A single full body can be tracked anywhere in the frame; no opponent is required. Poses are random by default. Optionally choose one of ten starting poses, then practice for the selected 1, 3, or 5 rounds. Results show each round score, overall average, and best round, without an opponent or match winner. Settings are locked during a session; stop or complete it to change modes.

Both modes default to random poses from the full ten-pose pool without repeats within a session. The start-pose picker is available in both modes: a manual choice pins the first round, with remaining poses shuffled. Selecting Random restores the default behavior. Replays reshuffle while preserving the chosen setting. Round counts remain 1, 3, and 5.

## Screen layout

The main interface is sized for 16:9 desktop monitors: a compact header/settings bar, camera and pose panels, and score cards. The camera uses contain sizing and the overlay shares the same bounds, preserving the full frame. Wide short viewports retain separate camera/pose columns; narrow portrait viewports stack them. Repeated instructions are removed from the main view, with details available through the header help button.

## Inference

MediaPipe Tasks Vision 0.10.21, Pose Landmarker Full, two poses, GPU with CPU fallback. Hosted mode uses a classic worker with main-thread fallback. The downloadable HTML embeds the JavaScript, baseline WASM and model, uses lazy local Blob URLs and the main-thread GPU path, and makes no model/font network requests. Camera permission is requested before any audio or model waits. Camera video remains available on model failure, with a separate retry. Permission, video and model errors are distinguished. Late permission grants after cancellation are explicitly released.

## Validation

Run `node --test tests/*.test.mjs`. Static delivery requires no build. Run `python run_game.py` for a local camera-compatible loopback origin. `npm run dev` serves a development preview. `node scripts/build-download.mjs /absolute/path/CopyPose.html` generates the standalone offline-model HTML.

Real camera accuracy and frame rate need checking on the intended webcam/PC with two people. The automatic tests validate scoring, mirroring, player assignment, invalid tracking, and five-round match outcomes. The displayed percentage is a game similarity estimate, not a scientific measurement.

## Third-party assets

MediaPipe: https://github.com/google-ai-edge/mediapipe (Apache License 2.0). Tasks Vision npm distribution: https://www.npmjs.com/package/@mediapipe/tasks-vision. Pose model: https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task.
