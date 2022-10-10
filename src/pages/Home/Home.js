import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import * as canvas from "canvas";
import Webcam from "../../components/Webcam";
import "./Home.css";
function Home() {
  const videoHeight = 400;
  const videoWidth = 640;
  const [initializing, setInitializing] = useState(false);
  const [isWebCam, setIsWebCam] = useState(false);
  const videoRef = useRef();
  const canvasRef = useRef();
  const intervalRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      setInitializing(true);
      Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]).catch(console.error);
    };
    loadModels();
  }, []);

  const startVideo = () => {
    setIsWebCam(true);
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          height: videoHeight,
          width: videoWidth,
        },
      })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch(console.error);
  };

  const stopVideo = () => {
    setIsWebCam(false);
    clearInterval(intervalRef.current);
    videoRef.current = null;
    canvasRef.current = null;
  };
  const handleVideoOnPlay = async () => {
    const labeledFaceDescriptors = await loadLabeledImages().catch((e) =>
      console.error(e)
    );
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.58);
    intervalRef.current = setInterval(async () => {
      if (initializing) {
        setInitializing(false);
      }
      canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(
        videoRef.current
      );
      const displaySize = {
        width: videoWidth,
        height: videoHeight,
      };
      faceapi.matchDimensions(canvasRef.current, displaySize);
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withFaceDescriptors();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvasRef.current
        .getContext("2d")
        .clearRect(0, 0, videoWidth, videoHeight);

      const results = resizedDetections.map((d) => {
        return faceMatcher.findBestMatch(d.descriptor);
      });

      results.forEach((result, i) => {
        const box = resizedDetections[i].detection.box;
        let drawBox;
        drawBox = new faceapi.draw.DrawBox(box, {
          label: result.toString(),
        });
        drawBox.draw(canvasRef.current);
      });
    }, 1000);
  };

  function loadLabeledImages() {
    const labels = ["TranHaiNam-ITITIU19163", "DangDucLuan-ITITIU19157"]; // for WebCam

    return Promise.all(
      labels.map(async (label) => {
        const descriptions = [];
        for (let i = 1; i <= 2; i++) {
          const img = await canvas.loadImage(`/images/${label}/${i}.jpg`);
          const detection = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();
          descriptions.push(detection.descriptor);
        }
        return new faceapi.LabeledFaceDescriptors(label, descriptions);
      })
    );
  }
  return (
    <main className="container">
      <div className="content-container">
        <section className="webcam-container">
          {isWebCam && (
            <Webcam
              videoRef={videoRef}
              canvasRef={canvasRef}
              onPlayHandler={handleVideoOnPlay}
            />
          )}
        </section>

        <span>
          <button onClick={!isWebCam ? () => startVideo() : () => stopVideo()}>
            Start Webcam
          </button>
        </span>
        <span>{initializing ? "Initializing" : "Finished"}</span>
      </div>
    </main>
  );
}

export default Home;
