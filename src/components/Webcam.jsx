import React from "react";
function Webcam({ videoRef, canvasRef, onPlayHandler }) {
  const videoHeight = 400;
  const videoWidth = 640;
  return (
    <>
      <video
        ref={videoRef}
        onPlay={onPlayHandler}
        autoPlay
        muted
        width={videoWidth}
        height={videoHeight}
      ></video>
      <canvas ref={canvasRef} style={{ position: "absolute" }} />
    </>
  );
}

export default Webcam;
