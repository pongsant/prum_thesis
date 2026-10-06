/* A single media element means songs can never overlap.
   AudioContext is created only in response to a user gesture. */
class MusicPlayer {
  constructor(element) { this.element = element; this.context = null; this.analyser = null; this.bins = null; this.wave = null; }
  async play() {
    try {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.context = new AudioContext();
          const source = this.context.createMediaElementSource(this.element);
          this.analyser = this.context.createAnalyser();
          this.analyser.fftSize = 512;
          this.analyser.smoothingTimeConstant = 0.86;
          source.connect(this.analyser); this.analyser.connect(this.context.destination);
          this.bins = new Uint8Array(this.analyser.frequencyBinCount);
          this.wave = new Uint8Array(this.analyser.fftSize);
        }
      }
      if (this.context?.state === 'suspended') await this.context.resume();
    } catch (error) { console.warn('Audio analysis unavailable; normal playback remains available.', error); }
    await this.element.play();
  }
  load(song) { this.element.pause(); this.element.src = song.audio; this.element.load(); }
  levels() {
    if (!this.analyser || this.element.paused) return { amplitude: 0, bass: 0 };
    this.analyser.getByteFrequencyData(this.bins);
    this.analyser.getByteTimeDomainData(this.wave);
    let square = 0, bass = 0;
    for (const n of this.wave) square += ((n - 128) / 128) ** 2;
    for (let i = 1; i < 18; i++) bass += this.bins[i] / 255;
    return { amplitude: Math.sqrt(square / this.wave.length), bass: bass / 17 };
  }
}
window.MusicPlayer = MusicPlayer;
