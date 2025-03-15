import { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ImageBackground,
    Platform,
    ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Plus, X, ArrowRight } from 'lucide-react-native';

const TOPICS = [
    { id: '1', name: 'Fitness', selected: true },
    { id: '2', name: 'FashionTrends', selected: true },
    { id: '3', name: 'TravelHacks', selected: false },
    { id: '4', name: 'SelfCare', selected: false },
    { id: '5', name: 'AI', selected: false },
    { id: '6', name: 'TechTrends', selected: false },
    { id: '7', name: 'SpaceExploration', selected: false },
    { id: '8', name: 'Crypto', selected: false },
    { id: '9', name: 'MentalHealth', selected: false },
    { id: '10', name: 'Kpop', selected: false },
    { id: '11', name: 'BollywoodTrends', selected: false },
    { id: '12', name: 'ChatGPT', selected: false },
    { id: '13', name: 'Metaverse', selected: false },
    { id: '14', name: 'Esports', selected: false },
    { id: '15', name: 'Movies', selected: false },
    { id: '16', name: 'ClimateChange', selected: false },
];

export default function TopicSetupScreen() {
    const [selectedTopics, setSelectedTopics] = useState(
        TOPICS.filter(topic => topic.selected).map(topic => topic.id)
    );

    const handleTopicToggle = useCallback((topicId: string) => {
        setSelectedTopics(prev => {
            if (prev.includes(topicId)) {
                return prev.filter(id => id !== topicId);
            }
            return [...prev, topicId];
        });
    }, []);

    const handleConfirm = useCallback(() => {
        router.replace('/(tabs)');
    }, []);

    const renderTopic = useCallback(({ id, name }: { id: string; name: string }) => {
        const isSelected = selectedTopics.includes(id);
        return (
            <TouchableOpacity
                key={id}
                style={[styles.topicChip, isSelected && styles.topicChipSelected]}
                onPress={() => handleTopicToggle(id)}
            >
                <Text style={[styles.topicText, isSelected && styles.topicTextSelected]}>
                    {name}
                </Text>
                {isSelected ? (
                    <X size={16} color="#FFFFFF" style={styles.topicIcon} />
                ) : (
                    <Plus size={16} color="#FFFFFF" style={styles.topicIcon} />
                )}
            </TouchableOpacity>
        );
    }, [selectedTopics, handleTopicToggle]);

    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('@/assets/images/bg.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <View style={styles.content}>
                    <Text style={styles.title}>Let's get you setup</Text>
                    <Text style={styles.subtitle}>Customize your polls with the right topics!</Text>

                    <ScrollView
                        style={styles.topicsContainer}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.topicsContent}
                    >
                        {TOPICS.map(topic => renderTopic(topic))}
                    </ScrollView>

                    <TouchableOpacity
                        style={[
                            styles.confirmButton,
                            selectedTopics.length === 0 && styles.confirmButtonDisabled
                        ]}
                        onPress={handleConfirm}
                        disabled={selectedTopics.length === 0}
                    >
                        <Text style={styles.confirmButtonText}>Confirm & Proceed</Text>
                        <ArrowRight size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </ImageBackground>
        </View>
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
    topicsContainer: {
        flex: 1,
        marginBottom: 20,
    },
    topicsContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingBottom: 20,
    },
    topicChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#FFFFFF',
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 8,
        marginBottom: 12,
    },
    topicChipSelected: {
        backgroundColor: '#273045',
        borderColor: '#578FFF',
    },
    topicText: {
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
        color: '#FFFFFF',
        marginRight: 8,
    },
    topicTextSelected: {
        color: '#FFFFFF',
    },
    topicIcon: {
        marginLeft: 'auto',
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
        backgroundColor: 'rgba(65, 105, 225, 0.5)',
    },
    confirmButtonText: {
        fontSize: 16,
        fontFamily: 'Montserrat_700Bold',
        color: '#FFFFFF',
        marginRight: 8,
    },
});