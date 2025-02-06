import React from 'react';
import MapView from 'react-native-maps';
import { StyleSheet, View, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import { useState, useRef} from 'react';
import Button from './components/Button';
import ImageViewer from './components/ImageViewer';
import * as ImagePicker from 'expo-image-picker';

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
  
  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    // Проверяем, был ли нажат маркер
    const markerClicked = markers.some(marker => 
      Math.abs(marker.coordinate.latitude - coordinate.latitude) < 0.0001 &&
      Math.abs(marker.coordinate.longitude - coordinate.longitude) < 0.0001
    );
    // Если маркер не был нажат, добавляем новый маркер
    if (!markerClicked) {
      const newMarker = {
        coordinate,
        title: "Маркер",
        description:"описание...",
        photos: [],
        selectedImage: [],
      }
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
      const updatedMarkers = markers.map((marker) => {
        if(marker == curMarker) {
          const updatedMarker = {
            ...marker,
            selectedImage: [...marker.selectedImage,result.assets[0].uri],
          };
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
        <MapView style={styles.map} initialRegion={initialRegion} id="mapView" onPress={handleMapPress}>   
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