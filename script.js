const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 2 virtual keys, positioned higher on the screen
const keys = [
  { note: 'C', x: 0.3, y: 0.4 }, // 30% from left, 40% from top
  { note: 'D', x: 0.6, y: 0.4 }
];

let lastPlayed = {};

function playNote(note) {
  if (!lastPlayed[note]) {
    const audio = new Audio(`sounds/${note}.mp3`);
    audio.play();
    lastPlayed[note] = true;
    setTimeout(() => lastPlayed[note] = false, 300);
  }
}

function isFingerOnKey(fx, fy, keyX, keyY, radius = 50) {
  const dx = fx - keyX;
  const dy = fy - keyY;
  return Math.sqrt(dx * dx + dy * dy) < radius;
}

// MediaPipe setup
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.8,
  minTrackingConfidence: 0.8,
});

hands.onResults((results) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const landmarks of results.multiHandLandmarks) {
    // Only use finger tips: thumb (4), index (8), middle (12), ring (16), pinky (20)
    [4, 8, 12, 16, 20].forEach((i) => {
      const point = landmarks[i];
      const fx = point.x * canvas.width;
      const fy = point.y * canvas.height;

      // Draw finger dot
      ctx.beginPath();
      ctx.arc(fx, fy, 10, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();

      // Check overlap with keys
      keys.forEach((key) => {
        const keyX = key.x * canvas.width;
        const keyY = key.y * canvas.height;
        if (isFingerOnKey(fx, fy, keyX, keyY)) {
          playNote(key.note);
        }
      });
    });
  }

  // Draw key markers (for testing)
  keys.forEach((key) => {
    const x = key.x * canvas.width;
    const y = key.y * canvas.height;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, 2 * Math.PI);
    ctx.strokeStyle = 'white';
    ctx.stroke();
  });
});

// Use back camera
navigator.mediaDevices.getUserMedia({
  video: { facingMode: { exact: "environment" } }
}).then((stream) => {
  video.srcObject = stream;

  const camera = new Camera(video, {
    onFrame: async () => {
      await hands.send({ image: video });
    },
    width: 640,
    height: 480,
  });
  camera.start();
}).catch((err) => {
  console.error("Camera access error:", err);
});
