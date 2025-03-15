import { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Image,
    FlatList,
    NativeSyntheticEvent,
    NativeScrollEvent,
    ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
    useAnimatedStyle,
    withSpring,
    interpolate,
    useSharedValue,
} from 'react-native-reanimated';

import { initializeBlockchainAuth } from '@/lib/blockchain/auth';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SPLASH_DATA = [
    {
        id: '1',
        title: 'Pollsat',
        subtitle: 'Share opinions, not Identity',
        image: require('@/assets/splash/logo.png'), 
    },
    {
        id: '2',
        title: 'See Polls Based on Your Location',
        subtitle: 'Stay informed about local discussions and vote on issues that matter in your area',
        image: require('@/assets/splash/maps.png'),    
    },
    {
        id: '3',
        title: 'Vote Anonymously & Securely',
        subtitle: 'No accounts, no tracking—your identity stays private while your voice is heard.',
        image: require('@/assets/splash/shield.png'),    
    },
    {
        id: '4',
        title: 'Discover Real-Time Community Trends.',
        subtitle: 'See live poll results and understand what people in your community think.',
        image: require('@/assets/splash/pie.png'),   
    },
];

export default function SplashScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useSharedValue(0);

    const onScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            scrollX.value = offsetX;
            setCurrentIndex(Math.round(offsetX / SCREEN_WIDTH));
        },
        []
    );

    const onSkip = useCallback(() => {
        router.replace('/(setup)/location-setup');
    }, []);


    useEffect(() => {
        (async () => {
            const authentication = await initializeBlockchainAuth();
            
        })();
    }, []);


    const renderItem = useCallback(({ item }: { item: typeof SPLASH_DATA[0] }) => {
        return (
            <View style={styles.slide}>
                <Image source={item.image} style={styles.image} resizeMode="contain" />
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
        );
    }, []);

    const renderPagination = () => {
        return (
            <View style={styles.paginationContainer}>
                {SPLASH_DATA.map((_, index) => {
                    const animatedDotStyle = useAnimatedStyle(() => {
                        const width = interpolate(
                            scrollX.value,
                            [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
                            [8, 16, 8],
                            'clamp'
                        );

                        const opacity = interpolate(
                            scrollX.value,
                            [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
                            [0.5, 1, 0.5],
                            'clamp'
                        );

                        return {
                            width: withSpring(width),
                            opacity: withSpring(opacity),
                        };
                    });

                    return (
                        <Animated.View
                            key={index}
                            style={[styles.dot, animatedDotStyle]}
                        />
                    );
                })}
            </View>
        );
    };

    return (
        <ImageBackground
            source={require('@/assets/images/bg.png')}
            style={styles.container}
        >
            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <FlatList
                ref={flatListRef}
                data={SPLASH_DATA}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                keyExtractor={(item) => item.id}
            />

            {renderPagination()}
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#181818',
    },
    skipButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 1,
    },
    skipText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Montserrat_400Regular',
        textAlign: 'center',
    },
    slide: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    image: {
        width: SCREEN_WIDTH * 0.8,
        height: SCREEN_WIDTH * 0.4,
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Montserrat_700Bold',
        color: '#FFFFFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        fontFamily: 'Montserrat_400Regular',
        color: '#FFFFFF',
        textAlign: 'center',
        opacity: 0.8,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4169E1',
        marginHorizontal: 4,
    },
});