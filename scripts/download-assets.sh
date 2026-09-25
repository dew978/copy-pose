#!/usr/bin/env bash
set -euo pipefail
mkdir -p dist/assets/wasm
curl --fail --location --retry 3 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task' -o 'dist/assets/pose_landmarker_full.task'
echo '5134a3aad27a58b93da0088d431f366da362b44e3ccfbe3462b3827a839011b1  dist/assets/pose_landmarker_full.task' | sha256sum --check
curl --fail --location --retry 3 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs' -o 'dist/assets/vision_bundle.mjs'
echo '40f4123dfcd75cfa58add046919cc6f52fde66f009ff582997c09ba54c6ba27c  dist/assets/vision_bundle.mjs' | sha256sum --check
curl --fail --location --retry 3 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm/vision_wasm_internal.js' -o 'dist/assets/wasm/vision_wasm_internal.js'
echo '4a97e2520ba506c680ecd6ba6acfb146888afa0e2746d57f205352bc6ebb82eb  dist/assets/wasm/vision_wasm_internal.js' | sha256sum --check
curl --fail --location --retry 3 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm/vision_wasm_internal.wasm' -o 'dist/assets/wasm/vision_wasm_internal.wasm'
echo 'f00ec4731faa23b3e714d00e88d4d10e2df5c0a427d3a2b4ae6e3526fdd14ef7  dist/assets/wasm/vision_wasm_internal.wasm' | sha256sum --check
curl --fail --location --retry 3 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm/vision_wasm_nosimd_internal.js' -o 'dist/assets/wasm/vision_wasm_nosimd_internal.js'
echo '927def7b465c51b86e4b3060f93646aca4e27121f4b8fc0483786e407ea9cf1f  dist/assets/wasm/vision_wasm_nosimd_internal.js' | sha256sum --check
curl --fail --location --retry 3 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm/vision_wasm_nosimd_internal.wasm' -o 'dist/assets/wasm/vision_wasm_nosimd_internal.wasm'
echo '3821ea9b1f7fb8c549ef2a064ef5c85750bf375c545a49fd6eea0df44a95f1f4  dist/assets/wasm/vision_wasm_nosimd_internal.wasm' | sha256sum --check
