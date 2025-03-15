import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  MapPin,
  Heart,
  MessageCircle,
  Share2,
  Clock,
  X,
  Send,
} from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Header } from '@/components/layout/header';
import { getPolls, votePoll, togglePollLike, getVoterIdFromToken, addComment, getComments } from '@/lib/hooks';
import * as Location from 'expo-location';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';

interface Poll {
  id: string;
  question: string;
  location_name: string;
  created_at: string;
  voter: {
    id: string;
    device_id: string;
  };
  poll_likes: Array<{
    id: string;
    voter_id: string;
  }>;
  poll_options: Array<{
    id: string;
    option_text: string;
    image_url: string | null;
  }>;
  votes: Array<{
    id: string;
    voter_id: string;
  }>;
  comments: Array<{
    id: string;
    comment: string;
    voter_id: string;
    created_at: string;
    voter: {
      device_id: string;
    };
  }>;
}

export default function HomeScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_700Bold,
  });

  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [voting, setVoting] = useState<string | null>(null);
  const [voterId, setVoterId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

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

  useEffect(() => {
    (async () => {
      const voterId = await getVoterIdFromToken();
      setVoterId(voterId);
    })();
  }, []);

  const fetchPolls = async () => {
    try {
      const { polls: fetchedPolls, error } = await getPolls();
      if (error) throw error;
      setPolls(fetchedPolls || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      setVoting(optionId);
      const location = await Location.getCurrentPositionAsync({});
      const { vote, error } = await votePoll(
        pollId,
        optionId,
        location.coords.latitude,
        location.coords.longitude
      );
      if (error) throw error;
      await fetchPolls();
    } catch (err) {
      console.error('Vote error:', err);
    } finally {
      setVoting(null);
    }
  };

  const handleLike = async (pollId: string) => {
    try {
      const { success, error } = await togglePollLike(pollId);
      if (error) throw error;
      if (success) {
        await fetchPolls();
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const fetchComments = async (pollId: string) => {
    setLoadingComments(true);
    try {
      const { comments: fetchedComments, error } = await getComments(pollId);
      if (error) throw error;
      setComments(fetchedComments || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendComment = async () => {
    if (!selectedPollId || !newComment.trim()) return;

    setSendingComment(true);
    try {
      const { success, error } = await addComment(selectedPollId, newComment.trim());
      if (error) throw error;
      if (success) {
        setNewComment('');
        await fetchComments(selectedPollId);
        await fetchPolls();
      }
    } catch (err) {
      console.error('Error sending comment:', err);
    } finally {
      setSendingComment(false);
    }
  };

  const handleOpenComments = async (pollId: string) => {
    setSelectedPollId(pollId);
    await fetchComments(pollId);
    bottomSheetRef.current?.expand();
  };

  const renderPollItem = useCallback((poll: Poll) => {
    const hasVoted = poll.votes.some(vote => vote.voter_id === voterId);
    const totalVotes = poll.votes.length;
    const hasLiked = poll.poll_likes.some(likes => likes.voter_id === voterId);
    const totalLikes = poll.poll_likes.length;
    const totalComments = poll.comments.length;

    return (
      <View style={styles.pollCard} key={poll.id}>
        <View style={styles.pollHeader}>
          <View style={styles.pollHeaderLeft}>
            <Text style={styles.username}>#{poll.voter.device_id}</Text>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.time}>{formatTimeAgo(poll.created_at)}</Text>
          </View>
          <View style={styles.pollLocation}>
            <MapPin size={12} color="#B9D0FF" />
            <Text style={styles.locationText}>{poll.location_name}</Text>
          </View>
        </View>

        <Text style={styles.question}>{poll.question}</Text>

        <View style={styles.optionsContainer}>
          {poll.poll_options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                voting === option.id && styles.optionButtonVoting,
                hasVoted && styles.optionButtonVoted,
              ]}
              onPress={() => handleVote(poll.id, option.id)}
              disabled={hasVoted || voting !== null}
            >
              {option.image_url && (
                <Image
                  source={{ uri: option.image_url }}
                  style={styles.optionImage}
                />
              )}
              <Text style={styles.optionText}>{option.option_text}</Text>
              {voting === option.id && (
                <ActivityIndicator size="small" color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.pollFooter}>
          <View style={styles.pollStats}>
            <TouchableOpacity
              style={styles.statButton}
              onPress={() => handleLike(poll.id)}
            >
              {hasLiked ? (
                <Heart size={20} color="red" fill="red" />
              ) : (
                <Heart size={20} color="#B9D0FF" />
              )}
              <Text style={styles.statText}>{totalLikes}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statButton}
              onPress={() => handleOpenComments(poll.id)}
            >
              <MessageCircle size={20} color="#B9D0FF" />
              <Text style={styles.statText}>{totalComments}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statButton}>
              <Share2 size={20} color="#B9D0FF" />
            </TouchableOpacity>
          </View>
          <View style={styles.voteStats}>
            <Clock size={16} color="#666666" />
            <Text style={styles.expiryLeftText}>3h</Text>
            <Text style={styles.voteText}>{totalVotes} votes</Text>
          </View>
        </View>
      </View>
    );
  }, [voting, voterId]);

  if (!fontsLoaded) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4169E1" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchPolls}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Header />
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchPolls();
              }}
              tintColor="#4169E1"
            />
          }
        >
          {polls.map(renderPollItem)}
        </ScrollView>

        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={['85%']}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetIndicator}
          onChange={(index) => {
            if (index === -1) {
              setSelectedPollId(null);
              setNewComment('');
            }
          }}
        >
          <View style={styles.commentsContainer}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <TouchableOpacity
                onPress={() => bottomSheetRef.current?.close()}
                style={styles.closeButton}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.commentsList}
              contentContainerStyle={styles.commentsListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {loadingComments ? (
                <ActivityIndicator color="#4169E1" style={styles.commentsLoading} />
              ) : comments.length === 0 ? (
                <Text style={styles.noCommentsText}>No comments yet</Text>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentUser}>
                        <Text style={styles.commentUsername}>#{comment.voter.device_id}</Text>
                        {comment.voter_id === voterId && (
                          <Text style={styles.authorTag}>Author</Text>
                        )}
                      </View>
                      <Text style={styles.commentTime}>
                        {formatTimeAgo(comment.created_at)}
                      </Text>
                    </View>
                    <Text style={styles.commentText}>{comment.comment}</Text>
                    <View style={styles.commentActions}>
                      <Text style={styles.likesCount}>120 likes</Text>
                      <TouchableOpacity>
                        <Text style={styles.replyButton}>Reply</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#666666"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!newComment.trim() || sendingComment) && styles.sendButtonDisabled
                ]}
                onPress={handleSendComment}
                disabled={!newComment.trim() || sendingComment}
              >
                {sendingComment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181818',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181818',
    padding: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4169E1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
  },
  username: {
    color: '#B9D0FF',
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
  },
  bulletPoint: {
    color: '#666666',
    marginHorizontal: 6,
  },
  time: {
    color: '#D9D9DE',
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
  },
  pollLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#B9D0FF',
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'Montserrat_400Regular',
  },
  question: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
    fontFamily: 'Montserrat_600SemiBold',
  },
  optionsContainer: {
    marginBottom: 12,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionButtonVoting: {
    backgroundColor: '#4169E1',
  },
  optionButtonVoted: {
    backgroundColor: '#242424',
  },
  optionImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    flex: 1,
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
    marginLeft: 4,
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
  },
  voteStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryLeftText: {
    color: '#91929F',
    marginLeft: 4,
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
  },
  voteText: {
    color: '#B9D0FF',
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    marginLeft: 20,
  },
  bottomSheetBackground: {
    backgroundColor: '#181818',
  },
  bottomSheetIndicator: {
    backgroundColor: '#666666',
    width: 40,
  },
  commentsContainer: {
    flex: 1,
    backgroundColor: '#181818',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  commentsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
  },
  closeButton: {
    padding: 8,
  },
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  commentItem: {
    marginBottom: 24,
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentUsername: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    marginRight: 8,
  },
  authorTag: {
    color: '#4169E1',
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    backgroundColor: 'rgba(65, 105, 225, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  commentTime: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
  },
  commentText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  likesCount: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    marginRight: 16,
  },
  replyButton: {
    color: '#4169E1',
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    backgroundColor: '#181818',
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#242424',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFFFFF',
    marginRight: 12,
    fontFamily: 'Montserrat_400Regular',
  },
  sendButton: {
    backgroundColor: '#4169E1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  commentsLoading: {
    marginTop: 20,
  },
  noCommentsText: {
    color: '#666666',
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    textAlign: 'center',
    marginTop: 20,
  },
});