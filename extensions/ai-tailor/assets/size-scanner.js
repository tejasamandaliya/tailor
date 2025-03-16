// Default user height in centimeters
let userHeight = 170;
let step = 1;
let isUserAligned = false;
const outlineImages = {
  1: "https://pluspng.com/img-png/png-human-body-outline-file-outline-body-png-500.png",
  2: "https://example.com/side-outline.png",
  3: "https://example.com/back-outline.png",
};

// Function to load external scripts dynamically
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Function to create and show the modal
function createScannerModal() {
  // Check if modal already exists to avoid duplicates
  if (document.querySelector(".size-scanner-modal")) return;

  // Create modal container
  const modal = document.createElement("div");
  modal.className = "size-scanner-modal";
  modal.innerHTML = `
        <div class="size-scanner-modal-content">
            <h2>Body Measurement Scanner</h2>
            <button id="start-button">Start Scan</button>
            <div id="video-container">
                <video id="video" autoplay playsinline></video>
                <canvas id="poseCanvas"></canvas>
                <div id="overlay-image"></div>
                <div id="instruction-overlay">
                    <h2>Get Ready!</h2>
                    <p>Stand a few feet away so your whole body is in the frame, as shown below.<br>Keep your arms straight by your sides and feet slightly apart.</p>
                    <img src="https://pluspng.com/img-png/png-human-body-outline-file-outline-body-png-500.png" alt="Instruction Pose">
                    <p id="countdown-timer">Starting in 5...</p>
                </div>
            </div>
            <p id="pose-feedback">Waiting for pose detection...</p>
            <div id="measurement-result"></div>
            <div class="spinner" id="loading-spinner"></div>
        </div>
    `;

  // Add close functionality (click outside to close)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // Append modal to body
  document.body.appendChild(modal);
  modal.style.display = "flex";

  // Load TensorFlow.js and Pose Detection libraries, then initialize
  Promise.all([
    loadScript(
      "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0/dist/tf.min.js",
    ),
    loadScript(
      "https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@0.0.6",
    ),
  ])
    .then(() => {
      initializeScanner();
    })
    .catch((error) => console.error("Error loading scripts:", error));
}

// Function to initialize the scanner
function initializeScanner() {
  const startButton = document.getElementById("start-button");
  if (startButton) {
    startButton.addEventListener("click", startDetection);
  }
}

// Your original script.js functions
async function setupCamera() {
  const video = document.getElementById("video");
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 500, height: 667 },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
      document.getElementById("overlay-image").style.display = "block";
    };
  });
}

async function loadModel() {
  try {
    return await poseDetection.createDetector(
      poseDetection.SupportedModels.BlazePose,
      {
        runtime: "tfjs",
        modelType: "full",
      },
    );
  } catch (error) {
    console.error("Error loading pose detection model:", error);
  }
}

function calculateDistance(p1, p2) {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

let lastStandingStatus = null;
let lastLogTime = 0;

function isUserStanding(keypoints) {
  const leftShoulder = keypoints.find((kp) => kp.name === "left_shoulder");
  const rightShoulder = keypoints.find((kp) => kp.name === "right_shoulder");
  const leftHip = keypoints.find((kp) => kp.name === "left_hip");
  const rightHip = keypoints.find((kp) => kp.name === "right_hip");
  const leftAnkle = keypoints.find((kp) => kp.name === "left_ankle");
  const rightAnkle = keypoints.find((kp) => kp.name === "right_ankle");

  if (
    !leftShoulder ||
    !rightShoulder ||
    !leftHip ||
    !rightHip ||
    !leftAnkle ||
    !rightAnkle
  ) {
    return false;
  }

  const isShouldersAboveHips =
    leftShoulder.y < leftHip.y && rightShoulder.y < rightHip.y;
  const isHipsAboveAnkles =
    leftHip.y < leftAnkle.y && rightHip.y < rightAnkle.y;
  const hipToAnkleDistance =
    Math.abs(leftHip.y - leftAnkle.y) + Math.abs(rightHip.y - rightAnkle.y);
  const minStandingHeight = 100;

  const isStanding =
    isShouldersAboveHips &&
    isHipsAboveAnkles &&
    hipToAnkleDistance > minStandingHeight;

  const now = Date.now();
  if (now - lastLogTime > 1000 || lastStandingStatus !== isStanding) {
    console.log(`Standing check: ${isStanding}`);
    lastLogTime = now;
    lastStandingStatus = isStanding;
  }

  return isStanding;
}

function isHandsStraight(keypoints) {
  const leftShoulder = keypoints.find((kp) => kp.name === "left_shoulder");
  const rightShoulder = keypoints.find((kp) => kp.name === "right_shoulder");
  const leftElbow = keypoints.find((kp) => kp.name === "left_elbow");
  const rightElbow = keypoints.find((kp) => kp.name === "right_elbow");
  const leftWrist = keypoints.find((kp) => kp.name === "left_wrist");
  const rightWrist = keypoints.find((kp) => kp.name === "right_wrist");

  if (
    !leftShoulder ||
    !rightShoulder ||
    !leftElbow ||
    !rightElbow ||
    !leftWrist ||
    !rightWrist
  ) {
    return false;
  }

  const isLeftHandStraight =
    leftWrist.y > leftElbow.y && leftElbow.y > leftShoulder.y;
  const isRightHandStraight =
    rightWrist.y > rightElbow.y && rightElbow.y > rightShoulder.y;

  return isLeftHandStraight && isRightHandStraight;
}

function getBodyMeasurements(keypoints) {
  const leftShoulder = keypoints.find((kp) => kp.name === "left_shoulder");
  const rightShoulder = keypoints.find((kp) => kp.name === "right_shoulder");
  const leftHip = keypoints.find((kp) => kp.name === "left_hip");
  const rightHip = keypoints.find((kp) => kp.name === "right_hip");
  const leftAnkle = keypoints.find((kp) => kp.name === "left_ankle");
  const rightAnkle = keypoints.find((kp) => kp.name === "right_ankle");

  if (
    leftShoulder &&
    rightShoulder &&
    leftHip &&
    rightHip &&
    leftAnkle &&
    rightAnkle
  ) {
    let shoulderWidth = calculateDistance(leftShoulder, rightShoulder);
    let waistWidth = calculateDistance(leftHip, rightHip);
    let bodyHeight = calculateDistance(leftShoulder, leftAnkle);

    let scaleFactor = userHeight / bodyHeight;

    return {
      shoulderWidth: shoulderWidth * scaleFactor,
      waistWidth: waistWidth * scaleFactor,
      height: bodyHeight * scaleFactor,
    };
  }
  return null;
}

function getPoseCorrectionMessage(keypoints) {
  const nose = keypoints.find((kp) => kp.name === "nose");
  const leftShoulder = keypoints.find((kp) => kp.name === "left_shoulder");
  const rightShoulder = keypoints.find((kp) => kp.name === "right_shoulder");
  const leftHip = keypoints.find((kp) => kp.name === "left_hip");
  const rightHip = keypoints.find((kp) => kp.name === "right_hip");
  const leftAnkle = keypoints.find((kp) => kp.name === "left_ankle");
  const rightAnkle = keypoints.find((kp) => kp.name === "right_ankle");
  const leftWrist = keypoints.find((kp) => kp.name === "left_wrist");
  const rightWrist = keypoints.find((kp) => kp.name === "right_wrist");

  if (
    !nose ||
    !leftShoulder ||
    !rightShoulder ||
    !leftHip ||
    !rightHip ||
    !leftAnkle ||
    !rightAnkle
  ) {
    return "⚠️ Please ensure your entire body is visible in the camera frame.";
  }

  let feedback = "";

  if (nose.x < 150) {
    feedback += "⬅️ Move slightly to the right. ";
  } else if (nose.x > 350) {
    feedback += "➡️ Move slightly to the left. ";
  }

  let heightRatio = Math.abs(leftAnkle.y - nose.y);
  if (heightRatio < 300) {
    feedback += "🔄 Step back a little. ";
  } else if (heightRatio > 600) {
    feedback += "🔄 Step forward slightly. ";
  }

  if (leftWrist.y > leftShoulder.y || rightWrist.y > rightShoulder.y) {
    feedback += "🖐 Keep your arms straight down at your sides. ";
  }

  let shoulderAlignment = Math.abs(leftShoulder.y - rightShoulder.y);
  let hipAlignment = Math.abs(leftHip.y - rightHip.y);
  if (shoulderAlignment > 20 || hipAlignment > 20) {
    feedback += "🔄 Stand upright with shoulders level.";
  }

  return feedback || "✅ Almost there! Just hold still.";
}

function isPoseCorrect(keypoints) {
  const leftShoulder = keypoints.find((kp) => kp.name === "left_shoulder");
  const rightShoulder = keypoints.find((kp) => kp.name === "right_shoulder");
  const leftHip = keypoints.find((kp) => kp.name === "left_hip");
  const rightHip = keypoints.find((kp) => kp.name === "right_hip");
  const leftAnkle = keypoints.find((kp) => kp.name === "left_ankle");
  const rightAnkle = keypoints.find((kp) => kp.name === "right_ankle");

  if (
    !leftShoulder ||
    !rightShoulder ||
    !leftHip ||
    !rightHip ||
    !leftAnkle ||
    !rightAnkle
  ) {
    return false;
  }

  const shoulderWidth = calculateDistance(leftShoulder, rightShoulder);
  const hipWidth = calculateDistance(leftHip, rightHip);
  const bodyHeight = calculateDistance(leftShoulder, leftAnkle);

  if (shoulderWidth < 40 || hipWidth < 30 || bodyHeight < 140) {
    document.getElementById("pose-feedback").innerText =
      "Move back or adjust your posture.";
    return false;
  }

  const leftElbow = keypoints.find((kp) => kp.name === "left_elbow");
  const rightElbow = keypoints.find((kp) => kp.name === "right_elbow");
  if (leftElbow && rightElbow) {
    const elbowDifference = Math.abs(leftElbow.y - rightElbow.y);
    if (elbowDifference > 30) {
      document.getElementById("pose-feedback").innerText =
        "Keep your arms straight.";
      return false;
    }
  }

  const feetDistance = calculateDistance(leftAnkle, rightAnkle);
  if (feetDistance < 20) {
    document.getElementById("pose-feedback").innerText =
      "Keep feet slightly apart.";
    return false;
  }

  document.getElementById("pose-feedback").innerText = "";
  return true;
}

function startDetection() {
  const instructionOverlay = document.getElementById("instruction-overlay");
  instructionOverlay.style.display = "flex";

  const countdownText = document.getElementById("countdown-timer");
  let countdown = 5;
  countdownText.innerText = `Starting in ${countdown}...`;

  let countdownInterval = setInterval(() => {
    countdown--;
    countdownText.innerText = `Starting in ${countdown}...`;

    if (countdown === 0) {
      clearInterval(countdownInterval);
      instructionOverlay.style.display = "none";
      initializePoseDetection();
    }
  }, 1000);
}

async function initializePoseDetection() {
  const video = await setupCamera();
  const detector = await loadModel();
  detectPose(detector, video);
}

function checkUserFit(keypoints) {
  const nose = keypoints.find((kp) => kp.name === "nose");
  const leftAnkle = keypoints.find((kp) => kp.name === "left_ankle");
  const rightAnkle = keypoints.find((kp) => kp.name === "right_ankle");

  if (!nose || !leftAnkle || !rightAnkle) {
    return false;
  }

  let bodyHeight = Math.abs(leftAnkle.y - nose.y);
  let minHeight = 400;
  let maxHeight = 600;

  return bodyHeight >= minHeight && bodyHeight <= maxHeight;
}

function getFitCorrectionMessage(keypoints) {
  const nose = keypoints.find((kp) => kp.name === "nose");
  const leftAnkle = keypoints.find((kp) => kp.name === "left_ankle");
  const rightAnkle = keypoints.find((kp) => kp.name === "right_ankle");

  if (!nose || !leftAnkle || !rightAnkle) {
    return "⚠️ Ensure your full body is visible in the camera.";
  }

  let feedback = "";
  let bodyHeight = Math.abs(leftAnkle.y - nose.y);
  if (bodyHeight < 400) {
    feedback += "🔄 Move slightly closer to the camera.";
  } else if (bodyHeight > 600) {
    feedback += "🔄 Move slightly further away.";
  }

  return feedback || "✅ Almost there! Just hold still.";
}

function estimateClothingSize(measurements) {
  if (!measurements) return "Unknown";

  let { shoulderWidth, waistWidth, height } = measurements;

  if (height < 160) {
    return shoulderWidth < 38 && waistWidth < 70 ? "S" : "M";
  } else if (height < 175) {
    return shoulderWidth < 42 && waistWidth < 85 ? "M" : "L";
  } else {
    return shoulderWidth < 46 && waistWidth < 100 ? "L" : "XL";
  }
}

function drawLine(kp1, kp2, ctx) {
  if (kp1 && kp2 && kp1.score > 0.5 && kp2.score > 0.5) {
    ctx.beginPath();
    ctx.moveTo(kp1.x, kp1.y);
    ctx.lineTo(kp2.x, kp2.y);
    ctx.stroke();
  }
}

function drawPose(keypoints) {
  const canvas = document.getElementById("poseCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "cyan";
  ctx.lineWidth = 4;

  const pairs = [
    ["left_shoulder", "right_shoulder"],
    ["left_shoulder", "left_elbow"],
    ["left_elbow", "left_wrist"],
    ["right_shoulder", "right_elbow"],
    ["right_elbow", "right_wrist"],
    ["left_shoulder", "left_hip"],
    ["right_shoulder", "right_hip"],
    ["left_hip", "right_hip"],
    ["left_hip", "left_knee"],
    ["left_knee", "left_ankle"],
    ["right_hip", "right_knee"],
    ["right_knee", "right_ankle"],
  ];

  pairs.forEach(([point1, point2]) => {
    const kp1 = keypoints.find((kp) => kp.name === point1);
    const kp2 = keypoints.find((kp) => kp.name === point2);
    drawLine(kp1, kp2, ctx);
  });

  keypoints.forEach((kp) => {
    if (kp.score > 0.5) {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    }
  });
}

async function detectPose(detector, video) {
  const canvas = document.getElementById("poseCanvas");
  canvas.width = video.width;
  canvas.height = video.height;

  async function detectFrame() {
    const poses = await detector.estimatePoses(video);
    if (poses.length > 0) {
      const keypoints = poses[0].keypoints;
      drawPose(keypoints);

      let isFitted = checkUserFit(keypoints);
      let handsStraight = isHandsStraight(keypoints);

      if (isFitted && handsStraight) {
        console.log("✅ User is correctly positioned!");
        document.getElementById("pose-feedback").innerText =
          "✅ Perfect! Hold still for a moment.";
        document.getElementById("pose-feedback").style.color = "green";

        const measurements = getBodyMeasurements(keypoints);
        if (measurements) {
          const size = estimateClothingSize(measurements);
          console.log(`Estimated clothing size: ${size}`);
          document.getElementById("measurement-result").innerText =
            `Estimated Size: ${size}`;
          document.getElementById("measurement-result").style.display = "block";
        }
      } else {
        let feedbackMessage = getFitCorrectionMessage(keypoints);
        document.getElementById("pose-feedback").innerText = feedbackMessage;
        document.getElementById("pose-feedback").style.color = "orange";
      }
    }
    requestAnimationFrame(detectFrame);
  }

  detectFrame();
}

// Expose createScannerModal globally so it can be called from Liquid
window.createScannerModal = createScannerModal;
