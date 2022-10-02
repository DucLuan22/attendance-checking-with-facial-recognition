import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import "./app.css";
import * as canvas from "canvas";
function App() {
  const { Canvas, Image, ImageData } = canvas;
  const videoHeight = 400;
  const videoWidth = 640;
  const [initializing, setInitializing] = useState(false);
  const videoRef = useRef();
  const canvasRef = useRef();

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
      ])
        .then(startVideo)
        .catch(console.error);
    };
    loadModels();
  }, []);

  const startVideo = () => {
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

  const handleVideoOnPlay = async () => {
    const labeledFaceDescriptors = await loadLabeledImages().catch((e) =>
      console.log(e)
    );
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.7);
    setInterval(async () => {
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
        .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options())
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
        const drawBox = new faceapi.draw.DrawBox(box, {
          label: result.toString(),
        });
        drawBox.draw(canvasRef.current);
      });
    }, 100);
  };

  function loadLabeledImages() {
    //const labels = ['Black Widow', 'Captain America', 'Hawkeye' , 'Jim Rhodes', 'Tony Stark', 'Thor', 'Captain Marvel']
    const labels = ["DangDucLuan-ITITIU19157"]; // for WebCam

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
    <div style={{ display: "flex", justifyContent: "center" }}>
      <span>{initializing ? "Initializing" : "Finished"}</span>
      <video
        ref={videoRef}
        onPlay={handleVideoOnPlay}
        autoPlay
        muted
        width={videoWidth}
        height={videoHeight}
      ></video>
      <canvas ref={canvasRef} style={{ position: "absolute" }} />
    </div>
  );
}

export default App;
