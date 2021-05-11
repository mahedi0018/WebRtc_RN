import React, {useState, useEffect} from 'react';
import {
  Text,
  StyleSheet,
  Button,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {database} from '../utilities/firebaseConfig';

export default function RoomScreen({setScreen, screens, setRoomId, roomId}) {
  const [roomData, setRoomData] = useState();
  const onCallOrJoin = screen => {
    if (roomId.length > 0) {
      setScreen(screen);
    }
  };

  useEffect(() => {
    //if any changes in firebase then this will be call
    const unsubscribe = database.collection('rooms').onSnapshot(snap => {
      const data = snap.docs.map(doc => doc.id);
      setRoomData(data);
    });

    return () => unsubscribe();
  }, [setScreen, screens, setRoomId, roomId, setRoomData, roomData]);
  const joinRoom = roomId => {
    setRoomId(roomId);
    setScreen(screens.JOIN);
  };
  return (
    <>
      <Text style={styles.heading}>Create A Room</Text>
      <TextInput style={styles.input} value={roomId} onChangeText={setRoomId} />
      <View style={styles.buttonContainer}>
        <Button
          title="Create And Call"
          onPress={() => onCallOrJoin(screens.VIDEO)}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Text style={styles.heading}>Room List</Text>
      </View>
      {roomData && roomData.length > 0 && (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          {roomData.map((item: any, index: number) => (
            <TouchableOpacity
              style={styles.room}
              key={index}
              onPress={() => joinRoom(item)}>
              <Text style={styles.roomText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginVertical: 10,
    alignSelf: 'center',
    fontSize: 30,
  },
  input: {
    margin: 20,
    height: 40,
    backgroundColor: '#aaa',
  },
  buttonContainer: {
    margin: 5,
  },
  scroll: {
    paddingHorizontal: 5,
  },
  roomText: {
    fontSize: 22,
  },
  room: {
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
  },
});
