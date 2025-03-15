import { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, ChevronDown, MapPin, Image as ImageIcon, Type } from 'lucide-react-native';
import DatePicker from 'react-native-date-picker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';

const TOPICS = [
    'Fitness',
    'FashionTrends',
    'TravelHacks',
    'SelfCare',
    'AI',
    'TechTrends',
    'SpaceExploration',
    'Crypto',
    'MentalHealth',
    'Kpop',
    'Movies',
    'ClimateChange',
];

export default function CreateScreen() {
    const [location, setLocation] = useState('San Francisco, CA');
    const [topic, setTopic] = useState('');
    const [question, setQuestion] = useState('');
    const [description, setDescription] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showTopics, setShowTopics] = useState(false);

    const bottomSheetRef = useRef<BottomSheet>(null);

    const handleClose = () => {
        router.back();
    };

    const handleAddOption = () => {
        setOptions([...options, '']);
    };

    const handleRemoveOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleOptionChange = (text: string, index: number) => {
        const newOptions = [...options];
        newOptions[index] = text;
        setOptions(newOptions);
    };

    const handleLocationPress = () => {
        bottomSheetRef.current?.expand();
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

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose}>
                        <X size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Create Poll</Text>
                    <TouchableOpacity style={styles.postButton}>
                        <Text style={styles.postButtonText}>Post</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    <TouchableOpacity style={styles.locationButton} onPress={handleLocationPress}>
                        <MapPin size={20} color="#FFFFFF" />
                        <Text style={styles.locationText}>{location}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.topicSelector}
                        onPress={() => setShowTopics(true)}
                    >
                        <Text style={styles.topicLabel}>Select Topic</Text>
                        <View style={styles.topicButton}>
                            <Text style={topic ? styles.topicButtonSelectedText : styles.topicButtonText}>
                                {topic || 'Choose / enter topic'}
                            </Text>
                            <ChevronDown size={20} color="#666666" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Poll Question</Text>
                        <TextInput
                            style={styles.questionInput}
                            value={question}
                            onChangeText={setQuestion}
                            placeholder="I Ask something interesting...(eg., What's the best weekend gateway?)"
                            placeholderTextColor="#666666"
                            multiline
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description (Optional)</Text>
                        <TextInput
                            style={styles.descriptionInput}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Add some details if you want!"
                            placeholderTextColor="#666666"
                            multiline
                        />
                    </View>

                    <View style={styles.optionsSection}>
                        <View style={styles.optionsHeader}>
                            <Text style={styles.label}>Options</Text>
                            <View style={styles.optionControls}>
                                <TouchableOpacity style={styles.optionControl}>
                                    <Type size={20} color="#4169E1" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.optionControl}>
                                    <ImageIcon size={20} color="#4169E1" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {options.map((option, index) => (
                            <View key={index} style={styles.optionInput}>
                                <TextInput
                                    style={styles.optionTextInput}
                                    value={option}
                                    onChangeText={(text) => handleOptionChange(text, index)}
                                    placeholder={`Option ${index + 1}`}
                                    placeholderTextColor="#666666"
                                />
                                {index >= 2 && (
                                    <TouchableOpacity
                                        onPress={() => handleRemoveOption(index)}
                                        style={styles.removeOption}
                                    >
                                        <X size={20} color="#666666" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}

                        <TouchableOpacity
                            style={styles.addOptionButton}
                            onPress={handleAddOption}
                        >
                            <Text style={styles.addOptionText}>Add Option</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.dateTimeSection}>
                        <View style={styles.dateInput}>
                            <Text style={styles.label}>Poll valid till</Text>
                            <TouchableOpacity
                                style={styles.dateTimeButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.dateTimeText}>
                                    {date.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.timeInput}>
                            <Text style={styles.label}>Time</Text>
                            <TouchableOpacity
                                style={styles.dateTimeButton}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Text style={styles.dateTimeText}>
                                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>

                <DatePicker
                    modal
                    open={showDatePicker}
                    date={date}
                    mode="date"
                    minimumDate={new Date()}
                    onConfirm={(date) => {
                        setShowDatePicker(false);
                        setDate(date);
                    }}
                    onCancel={() => {
                        setShowDatePicker(false);
                    }}
                    theme="dark"
                />

                <DatePicker
                    modal
                    open={showTimePicker}
                    date={time}
                    mode="time"
                    onConfirm={(time) => {
                        setShowTimePicker(false);
                        setTime(time);
                    }}
                    onCancel={() => {
                        setShowTimePicker(false);
                    }}
                    theme="dark"
                />

                {showTopics && (
                    <View style={styles.topicsModal}>
                        <View style={styles.topicsHeader}>
                            <Text style={styles.topicsTitle}>Select Topic</Text>
                            <TouchableOpacity onPress={() => setShowTopics(false)}>
                                <X size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.topicsList}>
                            {TOPICS.map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={styles.topicItem}
                                    onPress={() => {
                                        setTopic(t);
                                        setShowTopics(false);
                                    }}
                                >
                                    <Text style={styles.topicItemText}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <BottomSheet
                    ref={bottomSheetRef}
                    index={-1}
                    snapPoints={['50%']}
                    enablePanDownToClose
                    backdropComponent={renderBackdrop}
                    backgroundStyle={styles.bottomSheetBackground}
                    handleIndicatorStyle={styles.bottomSheetIndicator}
                >
                    <View style={styles.locationSheet}>
                        <View style={styles.locationSheetHeader}>
                            <Text style={styles.locationSheetTitle}>Location</Text>
                            <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
                                <X size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.locationSearchInput}
                            placeholder="Search locality/landmark"
                            placeholderTextColor="#666666"
                        />
                    </View>
                </BottomSheet>
            </SafeAreaView>
        </GestureHandlerRootView>
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
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    headerTitle: {
        fontSize: 14,
        color: '#FFFFFF',
        fontFamily: 'Montserrat_600SemiBold',
    },
    postButton: {
        backgroundColor: '#91929F',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 8,
    },
    postButtonText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontFamily: 'Montserrat_700Bold',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#242424',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    locationText: {
        color: '#FFFFFF',
        marginLeft: 8,
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
    },
    topicSelector: {
        marginBottom: 16,
    },
    topicLabel: {
        color: '#FFFFFF',
        fontSize: 14,
        marginBottom: 8,
        fontFamily: 'Montserrat_400Regular',
    },
    topicButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#242424',
        padding: 12,
        borderRadius: 12,
    },
    topicButtonText: {
        color: '#91929F',
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
    },
    topicButtonSelectedText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        color: '#FFFFFF',
        fontSize: 14,
        marginBottom: 8,
        fontFamily: 'Montserrat_400Regular',
    },
    questionInput: {
        backgroundColor: '#242424',
        borderRadius: 12,
        padding: 12,
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: 'Montserrat_400Regular',
        minHeight: 80,
    },
    descriptionInput: {
        backgroundColor: '#242424',
        borderRadius: 12,
        padding: 12,
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: 'Montserrat_400Regular',
        minHeight: 80,
    },
    optionsSection: {
        marginBottom: 16,
    },
    optionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    optionControls: {
        flexDirection: 'row',
    },
    optionControl: {
        marginLeft: 16,
    },
    optionInput: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    optionTextInput: {
        flex: 1,
        backgroundColor: '#242424',
        borderRadius: 12,
        padding: 12,
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
    },
    removeOption: {
        marginLeft: 8,
        padding: 4,
    },
    addOptionButton: {
        backgroundColor: '#242424',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    addOptionText: {
        color: '#4169E1',
        fontSize: 14,
        fontFamily: 'Montserrat_700Bold',
    },
    dateTimeSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dateInput: {
        flex: 1,
        marginRight: 8,
    },
    timeInput: {
        flex: 1,
        marginLeft: 8,
    },
    dateTimeButton: {
        backgroundColor: '#242424',
        borderRadius: 12,
        padding: 12,
    },
    dateTimeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
    },
    topicsModal: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#181818',
        padding: 16,
    },
    topicsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    topicsTitle: {
        fontSize: 18,
        color: '#FFFFFF',
        fontFamily: 'Montserrat_700Bold',
    },
    topicsList: {
        flex: 1,
    },
    topicItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    topicItemText: {
        color: '#FFFFFF',
        fontSize: 14,
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
        fontSize: 18,
        color: '#FFFFFF',
        fontFamily: 'Montserrat_700Bold',
    },
    locationSearchInput: {
        backgroundColor: '#242424',
        borderRadius: 12,
        padding: 12,
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
    },
    postButtonDisabled: {
        opacity: 0.5,
    },
    errorContainer: {
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        padding: 16,
        margin: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.3)',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
    },
});