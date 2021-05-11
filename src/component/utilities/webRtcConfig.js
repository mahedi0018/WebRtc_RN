import {mediaDevices} from 'react-native-webrtc';

export const startLocalStream = async () => {
  // isFront will determine if the initial camera should face user or environment
  const isFront = true;
  const devices = await mediaDevices.enumerateDevices();

  const facing = isFront ? 'front' : 'environment';
  const videoSourceId = devices.find(
    device => device.kind === 'videoinput' && device.facing === facing,
  );
  const facingMode = isFront ? 'user' : 'environment';
  const constraints = {
    audio: true,
    video: {
      mandatory: {
        minWidth: 300, // Provide your own width, height and frame rate here
        minHeight: 300,
        minFrameRate: 30,
      },
      facingMode,
      optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
    },
  };
  const newStream = await mediaDevices.getUserMedia(constraints);
  return newStream;
};
