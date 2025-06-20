const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Define 2 virtual keys
const keys = [
  { note: 'C', x: 0.3, y: 0.4 }, // relative to screen
  { note: 'D', x: 0.6, y: 0.4 }
];

let lastPlayed = {};

function playNote(note) {
  if (!lastPlayed[note]) {
    const audio = new Audio(`sounds/${note}.mp3`);
    audio.play();
    lastPlayed[note] = true;
    setTimeout(() => lastPlayed[note] = false, 300); // prevent repeat
  }
}

function isFingerOnKey(fx, fy, keyX, keyY, radius = 50) {
  const dx = fx - keyX;
  const dy = fy - keyY;
  return Math.sqrt(dx * dx + dy * dy) < radius;
}

// Setup MediaPipe
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
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
    // Check all 5 fingertips
    [4, 8, 12, 16, 20].forEach((i) => {
      const point = landmarks[i];
      const fx = point.x * canvas.width;
      const fy = point.y * canvas.height;

      // Draw fingertip
      ctx.beginPath();
      ctx.arc(fx, fy, 10, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();

      // Check if finger touches a virtual key
      keys.forEach((key) => {
        const keyX = key.x * canvas.width;
        const keyY = key.y * canvas.height;
        if (isFingerOnKey(fx, fy, keyX, keyY)) {
          playNote(key.note);
        }
      });
    });
  }

  // Draw virtual key markers
  keys.forEach((key) => {
    const x = key.x * canvas.width;
    const y = key.y * canvas.height;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, 2 * Math.PI);
    ctx.strokeStyle = 'white';
    ctx.stroke();
  });
});

// Start camera
const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480,
});
camera.start();
