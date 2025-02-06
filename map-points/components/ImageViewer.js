import React from 'react';
import { StyleSheet, Image, View, FlatList } from 'react-native';

export default function ImageViewer({ placeholderImageSource, selectedImage }) {
  const renderItem = ({ item }) => (
    <Image
      source={{ uri: item }}
      style={styles.image}
    />
  );

  return (
    <View style={styles.container}>
      {selectedImage.length == 0 ? (
        <Image source={placeholderImageSource} style={styles.baseimage} />
      ) : (
        <FlatList
          data={selectedImage}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          numColumns={3}
          columnWrapperStyle={styles.row}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flex: 1,
    justifyContent: "space-around"
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    margin: 5,
  },
  baseimage: {
    width: 320,
    height: 240,
    borderRadius: 18,
  },
});