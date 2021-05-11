import React, {useState, useEffect} from 'react';
import {Text, StyleSheet, Button, View,ToastAndroid} from 'react-native';

import {
  RTCPeerConnection,
  RTCView,
  mediaDevices,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc';
import {database} from '../utilities/firebaseConfig';
import {startLocalStream} from '../utilities/webRtcConfig';


const configuration = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export default function CalleeScreen({setScreen, screens, roomId}) {
  function onBackPress() {
    if (cachedLocalPC) {
      cachedLocalPC.removeStream(localStream);
      cachedLocalPC.close();
    }
    setLocalStream();
    setRemoteStream();
    setCachedLocalPC();
    // cleanup
    setScreen(screens.ROOM);
  }

  const [localStream, setLocalStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [cachedLocalPC, setCachedLocalPC] = useState();

  useEffect(() => {
    startLocalStream().then(r => setLocalStream(r));
  }, [setScreen, roomId, screens]);

  const joinCall = async id => {
    const roomRef = await database.collection('rooms').doc(id);
    const roomSnapshot = await roomRef.get();
    if (!roomSnapshot.exists) {
      ToastAndroid.show('There is no room with this id', ToastAndroid.SHORT);
      return;
    }
    //rome has already created
    if (roomSnapshot.exists && roomSnapshot.data().hasOwnProperty('answer')) {
      ToastAndroid.show('Room ended already', ToastAndroid.SHORT);
      return;
    }
    const localPC = new RTCPeerConnection(configuration);
    localPC.addStream(localStream);

    const calleeCandidatesCollection = roomRef.collection('calleeCandidates');
    localPC.onicecandidate = e => {
      if (!e.candidate) {
        console.log('Got final candidate!');
        return;
      }
      calleeCandidatesCollection.add(e.candidate.toJSON());
    };

    localPC.onaddstream = e => {
      if (e.stream && remoteStream !== e.stream) {
        console.log('RemotePC received the stream join', e.stream);
        setRemoteStream(e.stream);
      }
    };

    const offer = roomSnapshot.data().offer;
    await localPC.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await localPC.createAnswer();
    await localPC.setLocalDescription(answer);

    const roomWithAnswer = {answer};
    await roomRef.update(roomWithAnswer);

    roomRef.collection('callerCandidates').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
          let data = change.doc.data();
          await localPC.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });

    setCachedLocalPC(localPC);
  };

  return (
    <>
      <Text style={styles.heading}>Join Screen</Text>
      <Text style={styles.heading}>Room : {roomId}</Text>

      <View style={styles.callButtons}>
        <View styles={styles.buttonContainer}>
          <Button title="Stop" onPress={onBackPress} />
        </View>
        <View styles={styles.buttonContainer}>
          {!localStream && <Button title="Join" onPress={startLocalStream} />}
          {localStream && (
            <Button
              title="Join"
              onPress={() => joinCall(roomId)}
              disabled={!!remoteStream}
            />
          )}
        </View>
      </View>

      <View style={{display: 'flex', flex: 1, padding: 10}}>
        <View style={styles.rtcview}>
          {localStream && (
            <RTCView
              style={styles.rtc}
              streamURL={localStream && localStream.toURL()}
            />
          )}
        </View>
        <View style={styles.rtcview}>
          {remoteStream && (
            <RTCView
              style={styles.rtc}
              streamURL={remoteStream && remoteStream.toURL()}
            />
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  heading: {
    alignSelf: 'center',
    fontSize: 30,
  },
  rtcview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    margin: 5,
  },
  rtc: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  toggleButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  callButtons: {
    padding: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  buttonContainer: {
    margin: 5,
  },
});
