/**
 * AudioWorklet processor — captures PCM16 audio chunks and sends them to the main thread.
 * Served from /public/pcm-processor.js (same-origin, no bundling needed).
 */
class PcmProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]
    if (input && input[0] && input[0].length > 0) {
      // Transfer ownership for zero-copy (Float32Array)
      const samples = input[0].slice()
      this.port.postMessage({ samples }, [samples.buffer])
    }
    return true
  }
}

registerProcessor('pcm-processor', PcmProcessor)
