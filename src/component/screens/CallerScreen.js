import React, {useState, useEffect} from 'react';
import {Text, StyleSheet, Button, View, ToastAndroid} from 'react-native';
import {database} from '../utilities/firebaseConfig';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
} from 'react-native-webrtc';
import {startLocalStream} from '../utilities/webRtcConfig';
const configuration = {
  iceServers: [{url: 'stun:stun.l.google.com:19302'}],
  iceCandidatePoolSize: 10,
};

export default function CallerScreen({setScreen, screens, roomId}) {
  const [localStream, setLocalStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [cachedLocalPC, setCachedLocalPC] = useState();
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
  useEffect(() => {
    //start Local Stream
    startLocalStream().then(r => setLocalStream(r));
  }, [setScreen, roomId, screens]);

  //
  const startCall = async () => {
    const localPeerCon = new RTCPeerConnection(configuration);
    localPeerCon.addStream(localStream);

    const roomRef = await database.collection('rooms').doc(roomId);
    const callerCandidatesCollection = roomRef.collection('callerCandidates');
    const roomSnapshot = await roomRef.get();
    localPeerCon.onicecandidate = e => {
      if (!e.candidate) {
        return;
      }
      callerCandidatesCollection.add(e.candidate.toJSON());
    };
    if (roomSnapshot.exists && roomSnapshot.data().hasOwnProperty('offer')) {
      ToastAndroid.show('Room already exists', ToastAndroid.SHORT);
      return;
    }

    localPeerCon.onaddstream = e => {
      if (e.stream && remoteStream !== e.stream) {
        console.log('RemotePC received the stream call', e.stream);
        setRemoteStream(e.stream);
      }
    };

    const offer = await localPeerCon.createOffer();
    await localPeerCon.setLocalDescription(offer);

    const roomWithOffer = {offer};
    await roomRef.set(roomWithOffer);

    roomRef.onSnapshot(async snapshot => {
      const data = snapshot.data();
      if (!localPeerCon.currentRemoteDescription && data.answer) {
        const rtcSessionDescription = new RTCSessionDescription(data.answer);
        await localPeerCon.setRemoteDescription(rtcSessionDescription);
      }
    });

    roomRef.collection('calleeCandidates').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
          let data = change.doc.data();
          await localPeerCon.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });

    setCachedLocalPC(localPeerCon);
  };

  return (
    <>
      <Text style={styles.heading}>Call Screen</Text>
      <Text style={styles.heading}>Room : {roomId}</Text>

      <View style={styles.callButtons}>
        <View styles={styles.buttonContainer}>
          <Button title="Stop call" onPress={onBackPress} />
        </View>


        {!cachedLocalPC && <Button title="Call Now" onPress={startCall} />}
        {cachedLocalPC && (
          <Button
            title="Call Now"
            onPress={startCall}
            disabled={!!localStream}
          />
        )}
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
