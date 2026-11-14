import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

const BASE = import.meta.env.BASE_URL // model and wasm are bundled in /public, never fetched from a CDN

let instance: Promise<FaceLandmarker> | null = null

async function create(): Promise<FaceLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks(`${BASE}wasm`)
  const options = { runningMode: 'VIDEO' as const, numFaces: 1, outputFaceBlendshapes: true }
  const modelAssetPath = `${BASE}models/face_landmarker.task`
  try {
    return await FaceLandmarker.createFromOptions(fileset, { ...options, baseOptions: { modelAssetPath, delegate: 'GPU' } })
  } catch {
    // Some browsers (and headless/virtual GPUs) cannot run the GPU delegate. CPU is slower but works.
    return FaceLandmarker.createFromOptions(fileset, { ...options, baseOptions: { modelAssetPath, delegate: 'CPU' } })
  }
}

/** Load once, reuse. A failed load is not cached so the user can retry. */
export function getFaceLandmarker(): Promise<FaceLandmarker> {
  instance ??= create().catch((error: unknown) => {
    instance = null
    throw error
  })
  return instance
}
