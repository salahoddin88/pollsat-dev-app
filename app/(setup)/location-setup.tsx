import { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ImageBackground,
    Platform,
    Dimensions,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MapPin, ArrowRight, Navigation, Search, Map, X } from 'lucide-react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_API_KEY } from '@/constants/Config';
import { useLocalSearchParams } from 'expo-router';

import { LocationData, saveLocationToVoter } from '@/lib/hooks';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');


export default function LocationSetupScreen() {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = ['70%'];
    const params = useLocalSearchParams<{ selectedLocation?: string }>();

    useEffect(() => {
        getCurrentLocation();
    }, []);

    useEffect(() => {
        if (params.selectedLocation) {
            const location = JSON.parse(params.selectedLocation);
            setSelectedLocation(location);
        }
    }, [params.selectedLocation]);

    

    const getCurrentLocation = async () => {
        try {
            setIsLoading(true);
            setErrorMsg(null);

            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let locationResult = await Location.getCurrentPositionAsync({});

            // Reverse geocode to get the location details
            const addresses = await Location.reverseGeocodeAsync({
                latitude: locationResult.coords.latitude,
                longitude: locationResult.coords.longitude
            });

            if (addresses && addresses.length > 0) {
                const address = addresses[0];
                const locationName = `${address.city || ''}, ${address.region || ''}, ${address.country || ''}`.trim();

                // Create a simple bounding box around the point
                const delta = 0.01; // Roughly 1km
                const boundingBox = {
                    northeast: {
                        lat: locationResult.coords.latitude + delta,
                        lng: locationResult.coords.longitude + delta
                    },
                    southwest: {
                        lat: locationResult.coords.latitude - delta,
                        lng: locationResult.coords.longitude - delta
                    }
                };

                // Create a simple polygon for the geojson
                const geojson = {
                    type: "Polygon",
                    coordinates: [[
                        [locationResult.coords.longitude - delta, locationResult.coords.latitude - delta],
                        [locationResult.coords.longitude + delta, locationResult.coords.latitude - delta],
                        [locationResult.coords.longitude + delta, locationResult.coords.latitude + delta],
                        [locationResult.coords.longitude - delta, locationResult.coords.latitude + delta],
                        [locationResult.coords.longitude - delta, locationResult.coords.latitude - delta]
                    ]]
                };

                const locationData: LocationData = {
                    name: locationName,
                    place_id: `current_${Date.now()}`, // Generate a unique ID for current location
                    latitude: locationResult.coords.latitude,
                    longitude: locationResult.coords.longitude,
                    bounding_box: boundingBox,
                    geojson: geojson
                };

                setLocation(locationData);
            }
        } catch (error) {
            setErrorMsg('Error getting location');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmLocation = useCallback(async () => {
        try {
            const locationToUse = selectedLocation || location;
            if (locationToUse) {
                await saveLocationToVoter(locationToUse);
                router.replace('/(setup)/topics');
            }
        } catch (error) {
            console.error('Error confirming location:', error);
            setErrorMsg('Failed to save location');
        }
    }, [selectedLocation, location]);

    const handleSelectLocation = useCallback(() => {
        bottomSheetRef.current?.expand();
    }, []);

    const handleCloseBottomSheet = useCallback(() => {
        bottomSheetRef.current?.close();
    }, []);

    const handleLocationSelect = async (data: any, details: any) => {
        if (details) {
            const locationData: LocationData = {
                name: data.description,
                place_id: details.place_id,
                latitude: details.geometry.location.lat,
                longitude: details.geometry.location.lng,
                bounding_box: details.geometry.viewport,
                geojson: {
                    type: "Polygon",
                    coordinates: [[
                        [details.geometry.viewport.southwest.lng, details.geometry.viewport.southwest.lat],
                        [details.geometry.viewport.northeast.lng, details.geometry.viewport.southwest.lat],
                        [details.geometry.viewport.northeast.lng, details.geometry.viewport.northeast.lat],
                        [details.geometry.viewport.southwest.lng, details.geometry.viewport.northeast.lat],
                        [details.geometry.viewport.southwest.lng, details.geometry.viewport.southwest.lat]
                    ]]
                }
            };
            setSelectedLocation(locationData);
            bottomSheetRef.current?.close();
        }
    };

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                pressBehavior="close"
            />
        ),
        []
    );

    const renderLocationText = () => {
        if (isLoading) {
            return <ActivityIndicator size="small" color="#FFFFFF" />;
        }
        if (errorMsg) {
            return <Text style={styles.locationText}>Location unavailable</Text>;
        }
        if (selectedLocation) {
            return <Text style={styles.locationText}>{selectedLocation.name}</Text>;
        }
        if (location) {
            return <Text style={styles.locationText}>{location.name}</Text>;
        }
        return <Text style={styles.locationText}>No location selected</Text>;
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <View style={styles.container}>
                <ImageBackground
                    source={require('@/assets/images/bg.png')}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                >
                    <View style={styles.content}>
                        <Text style={styles.title}>Let's get you setup</Text>
                        <Text style={styles.subtitle}>Choose your location</Text>
                        <View style={styles.locationContainer}>
                            <TouchableOpacity
                                style={styles.currentLocation}
                                onPress={handleConfirmLocation}
                                disabled={isLoading}
                            >
                                <View style={styles.mapIconContainer}>
                                    <MapPin size={24} color="#FFFFFF" />
                                </View>
                                <View style={styles.locationTextContainer}>
                                    <Text style={styles.locationLabel}>Your current location</Text>
                                    {renderLocationText()}
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.selectLocation}
                                onPress={handleSelectLocation}
                                disabled={isLoading}
                            >
                                <View style={styles.locationIconContainer}>
                                    <Navigation size={20} color="#26262C" />
                                </View>
                                <View style={styles.locationTextContainer}>
                                    <Text style={styles.selectLocationText}>Select another location</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                (!location && !selectedLocation) && styles.confirmButtonDisabled
                            ]}
                            onPress={handleConfirmLocation}
                            disabled={!location && !selectedLocation}
                        >
                            <Text style={styles.confirmButtonText}>Confirm Location</Text>
                            <ArrowRight size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <BottomSheet
                        ref={bottomSheetRef}
                        index={-1}
                        snapPoints={snapPoints}
                        enablePanDownToClose
                        backdropComponent={renderBackdrop}
                        backgroundStyle={styles.bottomSheetBackground}
                        handleIndicatorStyle={styles.bottomSheetIndicator}
                    >
                        <BottomSheetView style={styles.bottomSheetContent}>
                            <View style={styles.bottomSheetHeader}>
                                <Text style={styles.bottomSheetTitle}>Location</Text>
                                <TouchableOpacity onPress={handleCloseBottomSheet}>
                                    <X size={24} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>

                            <GooglePlacesAutocomplete
                                placeholder='Search location'
                                fetchDetails={true}
                                onPress={handleLocationSelect}
                                query={{
                                    key: GOOGLE_MAPS_API_KEY,
                                    language: 'en',
                                }}
                                styles={{
                                    container: styles.placesContainer,
                                    textInput: styles.placesInput,
                                    listView: styles.placesList,
                                    row: styles.placesRow,
                                    description: styles.placesDescription,
                                }}
                            />

                            {selectedLocation && (
                                <TouchableOpacity
                                    style={styles.locationOption}
                                    onPress={() => handleLocationSelect(selectedLocation)}
                                >
                                    <View style={styles.locationOptionIconActive}>
                                        <MapPin size={24} color="#FFFFFF" />
                                    </View>
                                    <View>
                                        <Text style={styles.locationOptionTitleActive}>
                                            {selectedLocation.name}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.locationOption}
                                onPress={async () => {
                                    await getCurrentLocation();
                                    if (location) {
                                        handleLocationSelect(location);
                                    }
                                }}
                            >
                                <View style={styles.locationOptionIcon}>
                                    <Navigation size={24} color="#FFFFFF" />
                                </View>
                                <View>
                                    <Text style={styles.locationOptionTitle}>Use my current location</Text>
                                    <Text style={styles.locationOptionSubtitle}>
                                        {location ? location.name : 'Detect your current location'}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.locationOption}
                                onPress={() => {
                                    const locationToPass = selectedLocation || location;
                                    router.push({
                                        pathname: '/(setup)/map-select',
                                        params: {
                                            initialLocation: locationToPass ? JSON.stringify(locationToPass) : undefined
                                        }
                                    });
                                }}
                            >
                                <View style={styles.locationOptionIcon}>
                                    <Map size={24} color="#FFFFFF" />
                                </View>
                                <View>
                                    <Text style={styles.locationOptionTitle}>Select location on map</Text>
                                    <Text style={styles.locationOptionSubtitle}>Choose a location manually</Text>
                                </View>
                            </TouchableOpacity>
                        </BottomSheetView>
                    </BottomSheet>
                </ImageBackground>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
        backgroundColor: '#181818',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 120 : 80,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Montserrat_700Bold',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 15,
        fontFamily: 'Montserrat_400Regular',
        color: '#FFFFFF',
        opacity: 0.7,
        marginBottom: 40,
        textAlign: 'center'
    },
    locationContainer: {
        marginBottom: 40,
    },
    currentLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1F2024',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#557DCE',
    },
    selectLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1F2024',
        borderRadius: 12,
        padding: 16,
    },
    locationIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#B9D0FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    mapIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#294A8C',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    locationTextContainer: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 14,
        fontFamily: 'Montserrat_700Bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    locationText: {
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
        color: '#FFFFFF',
        opacity: 0.7,
    },
    selectLocationText: {
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
        color: '#FFFFFF',
        opacity: 0.7,
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#578FFF',
        borderRadius: 12,
        padding: 16,
        marginLeft: 40,
        marginRight: 40,
        marginTop: 'auto',
        marginBottom: 40,
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    confirmButtonText: {
        fontSize: 16,
        fontFamily: 'Montserrat_700Bold',
        color: '#FFFFFF',
        marginRight: 8,
    },
    bottomSheetBackground: {
        backgroundColor: '#181818',
    },
    bottomSheetIndicator: {
        backgroundColor: '#FFFFFF',
    },
    bottomSheetContent: {
        flex: 1,
        padding: 20,
    },
    bottomSheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    bottomSheetTitle: {
        fontSize: 15,
        fontFamily: 'Montserrat_700Bold',
        color: '#FFFFFF',
    },
    placesContainer: {
        flex: 0,
        marginBottom: 20,
    },
    placesInput: {
        backgroundColor: '#242424',
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Montserrat_400Regular',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
    },
    placesList: {
        backgroundColor: '#242424',
        borderRadius: 12,
        marginTop: 8,
    },
    placesRow: {
        backgroundColor: 'transparent',
        padding: 16,
    },
    placesDescription: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
    },
    locationOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#242424',
    },
    locationOptionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#242424',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    locationOptionIconActive: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#578FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    locationOptionTitle: {
        fontSize: 14,
        color: '#FFFFFF',
        marginBottom: 4,
        fontFamily: 'Montserrat_400Regular',
    },
    locationOptionTitleActive: {
        fontSize: 14,
        fontFamily: 'Montserrat_700Bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    locationOptionSubtitle: {
        fontSize: 12,
        fontFamily: 'Montserrat_400Regular',
        color: '#FFFFFF',
        opacity: 0.7,
    },
    locationOptionSubtitleActive: {
        fontSize: 12,
        fontFamily: 'Montserrat_400Regular',
        color: '#578FFF',
        opacity: 0.7,
    },
});