import React, {useState} from 'react';
import {Text, StyleSheet, SafeAreaView} from 'react-native';
import RoomScreen from './component/screens/RoomScreen';
import CallerScreen from './component/screens/CallerScreen';
import CalleeScreen from './component/screens/CalleeScreen';

export default function App() {
  const screens = {
    ROOM: 'JOIN_ROOM',
    CALL: 'CALL',
    JOIN: 'JOIN',
    VIDEO: 'VIDEO',
  };

  const [screen, setScreen] = useState(screens.ROOM);
  const [roomId, setRoomId] = useState('');

  let content;

  switch (screen) {
    case screens.ROOM:
      content = (
        <RoomScreen
          roomId={roomId}
          setRoomId={setRoomId}
          screens={screens}
          setScreen={setScreen}
        />
      );
      break;
    case screens.JOIN:
      content = (
        <CalleeScreen roomId={roomId} screens={screens} setScreen={setScreen} />
      );
      break;
    case screens.VIDEO:
      content = (
        <CallerScreen roomId={roomId} screens={screens} setScreen={setScreen} />
      );
      break;

    default:
      content = <Text>Wrong Screen</Text>;
  }

  return <SafeAreaView style={styles.container}>{content}</SafeAreaView>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
});
