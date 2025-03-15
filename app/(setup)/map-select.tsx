import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { ArrowLeft, Check } from 'lucide-react-native';

interface LocationData {
    name: string;
    latitude: number;
    longitude: number;
}

export default function MapSelectScreen() {
    const params = useLocalSearchParams<{ initialLocation?: string }>();
    const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
    const [region, setRegion] = useState<Region>({
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0,
        longitudeDelta: 0,
    });

    useEffect(() => {
        if (params.initialLocation) {
            const location = JSON.parse(params.initialLocation);
            setRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            });
            setSelectedLocation(location);
        } else {
            getCurrentLocation();
        }
    }, [params.initialLocation]);

    const getCurrentLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            };
            setRegion(newRegion);
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    const handleMapPress = async (e: any) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;

        try {
            const addresses = await Location.reverseGeocodeAsync({
                latitude,
                longitude
            });

            if (addresses && addresses.length > 0) {
                const address = addresses[0];
                const locationName = `${address.city || ''}, ${address.region || ''}, ${address.country || ''}`.trim();

                setSelectedLocation({
                    name: locationName,
                    latitude,
                    longitude
                });
            }
        } catch (error) {
            console.error('Error reverse geocoding:', error);
        }
    };

    const handleConfirm = useCallback(() => {
        if (selectedLocation) {
            router.back();
            // Pass the selected location back to the previous screen
            router.setParams({ selectedLocation: JSON.stringify(selectedLocation) });
        }
    }, [selectedLocation]);

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                region={region}
                onRegionChangeComplete={setRegion}
                onPress={handleMapPress}
            >
                {selectedLocation && (
                    <Marker
                        coordinate={{
                            latitude: selectedLocation.latitude,
                            longitude: selectedLocation.longitude
                        }}
                        title={selectedLocation.name}
                    />
                )}
            </MapView>

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Select Location</Text>
                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        !selectedLocation && styles.confirmButtonDisabled
                    ]}
                    onPress={handleConfirm}
                    disabled={!selectedLocation}
                >
                    <Check size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {selectedLocation && (
                <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>{selectedLocation.name}</Text>
                    <Text style={styles.locationCoords}>
                        {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Montserrat_700Bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 5,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#578FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: 'rgba(87, 143, 255, 0.5)',
    },
    locationInfo: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        borderRadius: 12,
        padding: 16,
    },
    locationName: {
        fontSize: 16,
        fontFamily: 'Montserrat_700Bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    locationCoords: {
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
        color: '#FFFFFF',
        opacity: 0.7,
    },
});