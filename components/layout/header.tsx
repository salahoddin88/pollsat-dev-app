
import { useCallback, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    TextInput,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
    Menu,
    Search,
    MapPin,
    Heart,
    MessageCircle,
    Share2,
    Clock,
    X,
} from 'lucide-react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';

export function Header() {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const handleLocationPress = useCallback(() => {
        bottomSheetRef.current?.expand();
    }, []);

    const handleCloseBottomSheet = useCallback(() => {
        bottomSheetRef.current?.close();
    }, []);

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

    return (
        <>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity>
                        <Menu size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Image
                        source={require('@/assets/splash/logo.png')}
                        style={styles.logo}
                    />
                    <Text style={styles.HeaderButtonText}>Pollsat</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.searchButton} onPress={() => router.push('/(tabs)/search')}>
                        <Search size={15} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.locationButton} onPress={handleLocationPress}>
                        <MapPin size={16} color="#578FFF" />
                        <Text style={styles.locationButtonText}>San Francisco, CA</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={['50%']}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={styles.bottomSheetBackground}
                handleIndicatorStyle={styles.bottomSheetIndicator}
            >
                <View style={styles.locationSheet}>
                    <View style={styles.locationSheetHeader}>
                        <Text style={styles.locationSheetTitle}>Location</Text>
                        <TouchableOpacity onPress={handleCloseBottomSheet}>
                            <X size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.searchContainer}>
                        <Search size={20} color="#666666" />
                        <TextInput
                            style={styles.locationSearchInput}
                            placeholder="Search locality/landmark"
                            placeholderTextColor="#666666"
                        />
                    </View>
                    <TouchableOpacity style={styles.locationOption}>
                        <MapPin size={24} color="#4169E1" />
                        <View style={styles.locationOptionContent}>
                            <Text style={styles.locationOptionTitle}>San Francisco, CA</Text>
                            <Text style={styles.locationOptionSubtitle}>
                                A major commercial intersection and tourist...
                            </Text>
                        </View>
                        <View style={styles.checkmark} />
                    </TouchableOpacity>
                </View>
            </BottomSheet>
        </>

        
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#181818',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#1F2024',

    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 14,
        height: 20,
        marginLeft: 12,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#282B32',
        borderRadius: 50,
        paddingHorizontal: 6,
        paddingVertical: 6,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    HeaderButtonText: {
        color: '#FFFFFF',
        marginLeft: 4,
        fontSize: 18,
        fontFamily: 'Montserrat_700Bold',
    },
    locationButtonText: {
        color: '#FFFFFF',
        marginLeft: 4,
        fontSize: 12,
        fontFamily: 'Montserrat_400Regular',
    },
    bottomSheetBackground: {
        backgroundColor: '#181818',
    },
    bottomSheetIndicator: {
        backgroundColor: '#666666',
    },
    locationSheet: {
        flex: 1,
        padding: 16,
    },
    locationSheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    locationSheetTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'Montserrat_700Bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 16,
    },
    locationSearchInput: {
        flex: 1,
        height: 40,
        color: '#FFFFFF',
        marginLeft: 8,
        fontFamily: 'Montserrat_400Regular',
    },
    locationOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
    },
    locationOptionContent: {
        flex: 1,
        marginLeft: 12,
    },
    locationOptionTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        marginBottom: 4,
        fontFamily: 'Montserrat_700Bold',
    },
    locationOptionSubtitle: {
        color: '#666666',
        fontSize: 12,
        fontFamily: 'Montserrat_400Regular',
    },
    checkmark: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#4169E1',
        marginLeft: 12,
    },
});