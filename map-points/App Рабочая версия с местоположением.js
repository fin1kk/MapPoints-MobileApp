import React, { useEffect } from 'react';
import MapView from 'react-native-maps';
import { StyleSheet, View, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import { useState, useRef} from 'react';
import Button from './components/Button';
import ImageViewer from './components/ImageViewer';
import * as ImagePicker from 'expo-image-picker';
import * as SQLite from 'expo-sqlite';
import * as Location from 'expo-location';

import * as FileSystem from 'expo-file-system';

const db = SQLite.openDatabase('markerssome.db');

const PlaceholderImage = require('./assets/images/traktor.jpg');

const myInitialRegion = {
  latitude: 58.01,
  longitude: 56.22,
  latitudeDelta: 0.2922,
  longitudeDelta: 0.2421,
}

export default function App() {
  const [initialRegion, setInitialRegion] = useState(myInitialRegion)
  const [markers, setMarkers] = useState([])
  const [curMarker, setcurMarker] = useState(null);
  const [showAppOptions, setShowAppOptions] = useState(false);

  const imageRef = useRef();

  const [location, setLocation] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  /*useEffect(() => {
    db.transaction(tx => {
      tx.executeSql("DROP TABLE IF EXISTS markers;");
    });
  }, []);

  const deleteFile = async (uri) => {
    try {
      await FileSystem.deleteAsync(uri);
    } catch(e) {
      console.log(e);
    }
  }*/
  
  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(
        "create table if not exists markers (id integer primary key not null, latitude real, longitude real, title text, description text, selectedImage text);"
      );
    });
  }, []);

useEffect(() => {
  db.transaction(tx => {
    tx.executeSql("select * from markers;", [], (_, { rows }) => {
      const markersFromDB = rows._array.map(marker => ({
        ...marker,
        coordinate: {
          latitude: marker.latitude,
          longitude: marker.longitude
        },
        selectedImage: JSON.parse(marker.selectedImage)
      }));
      setMarkers(markersFromDB);
      console.log(markersFromDB); // Вывод содержимого массива markers в консоль
    });
  });
}, []);

  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    const markerClicked = markers.some(marker => 
      Math.abs(marker.coordinate.latitude - coordinate.latitude) < 0.0001 &&
      Math.abs(marker.coordinate.longitude - coordinate.longitude) < 0.0001
    );
    if (!markerClicked) {
      const newMarker = {
        coordinate,
        title: "Маркер",
        description:"описание...",
        photos: [],
        selectedImage: [],
      }
      db.transaction(
        tx => {
          tx.executeSql("insert into markers (latitude, longitude, title, description, selectedImage) values (?, ?, ?, ?, ?);", [coordinate.latitude, coordinate.longitude, "Маркер", "описание...", JSON.stringify([])]);
        },
        null,
        null
      );
      const newMarkers = [...markers, newMarker];
      setMarkers(newMarkers);
    }
  }

  const handleMarkerPress = (marker) => {
    setcurMarker(marker);
    setShowAppOptions(true);
  }

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      // Создайте новый путь в постоянном хранилище
      const newUri = FileSystem.documentDirectory + result.assets[0].uri.split('/').pop();
    
      // Скопируйте файл в новое место
      await FileSystem.copyAsync({
        from: result.assets[0].uri,
        to: newUri,
      });
    
      
      result.assets[0].uri = newUri;

      const updatedMarkers = markers.map((marker) => {
        if(marker == curMarker) {
          const updatedMarker = {
            ...marker,
            selectedImage: [...marker.selectedImage,newUri],
          };
          db.transaction(
            tx => {
              tx.executeSql("update markers set selectedImage = ? where latitude = ? and longitude = ?;", [JSON.stringify(updatedMarker.selectedImage), marker.coordinate.latitude, marker.coordinate.longitude]);
            },
            null,
            null
          );
          setcurMarker(updatedMarker);
          return updatedMarker;
        } else {
          return marker;
        }
      });
      setMarkers(updatedMarkers);
    } else {
      alert('You did not select any image.');
    }
  };

  return (
    <View style={styles.container}>
      
      {showAppOptions ? (
        <View style={styles.container}>
          <View><Text style={styles.title}>{curMarker.title}</Text><Text style={styles.description}>{curMarker.description}</Text></View>
          <View style={styles.imageContainer}> 
            <View ref={imageRef} collapsable={false}>   
              <ImageViewer
                  placeholderImageSource={PlaceholderImage}
                  selectedImage={curMarker.selectedImage}
              />
            </View>
          </View>

          <View style={styles.footerContainer}>
            <Button theme="primary" label="Изменить изображение" onPress={pickImageAsync} />
            <Button label="Вернуться к карте" onPress={() => setShowAppOptions(false)} />
          </View>
        </View>
      ) : (
        <MapView style={styles.map} initialRegion={initialRegion} id="mapView" onPress={handleMapPress} showsUserLocation={true}>   
        {markers.map((marker, index) => (
            <Marker
              key={index}
              coordinate={marker.coordinate}
              title={marker.title + index}
              description={marker.description}
              //onPress={pickImageAsync}
              onPress={() => handleMarkerPress(marker,index)}
            />
          ))}
          {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title={"Текущее местоположение"}
            description={"Это ваше текущее местоположение"}
          />
        )}
        </MapView>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#25292e',
        alignItems: 'center',
      },
      map: {
        width: '100%',
        height: '100%',
      },
      imageContainer: {
        flex: 1/1.5,
        paddingTop: 20,
      },
      image: {
        width: 320,
        height: 340,
        borderRadius: 18,
      },
      footerContainer: {
        flex: 1 / 3,
        alignItems: 'center',
      },
      optionsContainer: {
        position: 'absolute',
        bottom: 80,
      },
      optionsRow: {
        alignItems: 'center',
        flexDirection: 'row',
      },
      title: {
        fontSize: 34,
        color: 'white',
        alignItems: 'center',
        borderRadius: 4,
        paddingTop: 50,
      },
      description: {
        width: 320,
        height: 60,
        fontSize: 18,
        color: 'white',
        alignItems: 'center',
        borderRadius: 4,
      },
});