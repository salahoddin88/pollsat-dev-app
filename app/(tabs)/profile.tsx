import { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Heart, MessageCircle, Share2, Clock, Pencil, CreditCard as Edit2, Trash2, DollarSign } from 'lucide-react-native';
import { Header } from '@/components/layout/header';

type TabType = 'polls' | 'votes';

const POLL_DATA = {
    id: '1',
    username: '#XJ82K5X',
    time: '5m',
    location: 'Downtown SanFrancisco',
    question: 'Best coffee spot in San Francisco?',
    description: 'Whether you love pour-over, espresso, or cold brew, SF has incredible coffee. What\'s your favorite?',
    options: [
            { text: 'Blue Bottle', votes: 65 },
            { text: 'Ritual Coffee', votes: 23 },
            { text: 'Sightglass', votes: 2 },
            { text: 'Philz Coffee', votes: 10 },
    ],
    totalVotes: 100,
    comments: 2,
    likes: 100,
    timeLeft: '3h',
};

export default function ProfileScreen() {

    const [activeTab, setActiveTab] = useState<TabType>('polls');

    const renderPollItem = useCallback((isVoted: boolean) => {
        return (
            <View style={styles.pollCard}>
                <View style={styles.pollHeader}>
                    <View style={styles.pollHeaderLeft}>
                        <Text style={styles.pollUsername}>{POLL_DATA.username}</Text>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.time}>{POLL_DATA.time}</Text>
                    </View>
                    <Text style={styles.location}>{POLL_DATA.location}</Text>
                </View>

                <Text style={styles.question}>{POLL_DATA.question}</Text>
                <Text style={styles.description}>{POLL_DATA.description}</Text>

                <View style={styles.optionsContainer}>
                    {POLL_DATA.options.map((option, index) => (
                        <View key={index} style={styles.optionItem}>
                            <View style={[
                                styles.optionBar,
                                isVoted && { backgroundColor: index === 0 ? '#578FFF' : '#333333' }
                            ]}>
                                <Text style={styles.optionText}>{option.text}</Text>
                                {isVoted && (
                                    <Text style={styles.votePercentage}>{option.votes}%</Text>
                                )}
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.pollFooter}>
                    <View style={styles.pollStats}>
                        <TouchableOpacity style={styles.statButton}>
                            <Heart size={20} color="#D9D9DE" />
                            <Text style={styles.statText}>{POLL_DATA.likes}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.statButton}>
                            <MessageCircle size={20} color="#D9D9DE" />
                            <Text style={styles.statText}>{POLL_DATA.comments}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.statButton}>
                            <Share2 size={20} color="#D9D9DE" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.timeContainer}>
                        <Clock size={16} color="#D9D9DE" />
                        <Text style={styles.timeText}>
                            {POLL_DATA.timeLeft} • {POLL_DATA.totalVotes} votes
                        </Text>
                    </View>
                </View>

                {!isVoted && (
                    <View style={styles.pollActions}>
                        <TouchableOpacity style={styles.editButton}>
                            <Pencil size={14} color="#D9D9DE" />
                            <Text style={styles.editButtonText}>Edit poll</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton}>
                            <Trash2 size={14} color="#FF8A8A" />
                            <Text style={styles.deleteButtonText}>Delete poll</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <Header />

            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.usernameLabel}>My Username:</Text>
                    <Text style={styles.username}>#XJ82K5X</Text>
                    <TouchableOpacity style={styles.changeButton}>
                        
                        <Text style={styles.changeButtonText}><DollarSign size={11} color="#FFE064" /> Change</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity>
                    <Settings size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.tabs}>
                <Pressable
                    style={[styles.tab, activeTab === 'polls' && styles.activeTab]}
                    onPress={() => setActiveTab('polls')}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === 'polls' && styles.activeTabText
                    ]}>My Polls</Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'votes' && styles.activeTab]}
                    onPress={() => setActiveTab('votes')}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === 'votes' && styles.activeTabText
                    ]}>My Votes</Text>
                </Pressable>
            </View>

            <ScrollView style={styles.content}>
                {renderPollItem(activeTab === 'votes')}
            </ScrollView>
        </SafeAreaView>
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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    usernameLabel: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
        marginRight: 8,
    },
    username: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Montserrat_700Bold',
        marginRight: 8,
    },
    pollUsername: {
        color: '#B9D0FF',
        fontSize: 12,
        fontFamily: 'Montserrat_400Regular',
        marginRight: 8,
    },
    changeButton: {
        backgroundColor: '#2C2C2F',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFE064',
    },
    changeButtonText: {
        color: '#FFE064',
        fontSize: 12,
        fontFamily: 'Montserrat_700Bold',
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#578FFF',
    },
    tabText: {
        color: '#D9D9DE',
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
    },
    activeTabText: {
        color: '#FFFFFF',
        fontFamily: 'Montserrat_700Bold',
    },
    content: {
        flex: 1,
    },
    pollCard: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    pollHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    pollHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    location: {
        color: '#B9D0FF',
        fontSize: 12,
        fontFamily: 'Montserrat_400Regular',
    },

    bulletPoint: {
        color: '#D9D9DE',
        marginHorizontal: 8,
    },
    time: {
        color: '#D9D9DE',
        fontSize: 10,
        fontFamily: 'Montserrat_400Regular',
    },
    question: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Montserrat_600SemiBold',
        marginBottom: 8,
    },
    description: {
        color: '#D9D9DE',
        fontSize: 12,
        fontFamily: 'Montserrat_400Regular',
        marginBottom: 16,
    },
    optionsContainer: {
        marginBottom: 16,
    },
    optionItem: {
        marginBottom: 8,
    },
    optionBar: {
        backgroundColor: '#242424',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
    },
    votePercentage: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Montserrat_700Bold',
    },
    pollFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pollStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    statText: {
        color: '#D9D9DE',
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
        marginLeft: 4,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        color: '#D9D9DE',
        fontSize: 12,
        fontFamily: 'Montserrat_400Regular',
        marginLeft: 4,
    },
    pollActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#333333',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editButtonText: {
        color: '#D9D9DE',
        fontSize: 12,
        fontFamily: 'Montserrat_700Bold',
        marginLeft: 8,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#FF8A8A',
        fontSize: 12,
        fontFamily: 'Montserrat_700Bold',
        marginLeft: 8,
    },
});