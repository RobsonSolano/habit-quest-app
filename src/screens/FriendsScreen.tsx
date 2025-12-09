import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  Search, 
  UserPlus, 
  UserCheck,
  UserX,
  Flame,
  Clock,
  X,
  Check,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { friendService } from '@/lib/storage';
import { UserSearchResult, FriendWithProfile } from '@/types/database';
import { Card } from '@/components/ui/Card';
import Toast from 'react-native-toast-message';
import { MainNavigationProp } from '@/navigation/types';

const FriendsScreen = () => {
  const navigation = useNavigation<MainNavigationProp>();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([]);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const [friendsData, requestsData] = await Promise.all([
        friendService.getFriends(user.id),
        friendService.getPendingRequests(user.id),
      ]);

      setFriends(friendsData);
      setPendingRequests(requestsData);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (!user || !searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await friendService.search(searchQuery.trim(), user.id);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (addresseeId: string) => {
    if (!user) return;

    try {
      const success = await friendService.sendRequest(user.id, addresseeId);
      if (success) {
        Toast.show({
          type: 'success',
          text1: 'Solicitação enviada!',
        });
        // Update search results
        setSearchResults(prev => prev.map(r => 
          r.id === addresseeId ? { ...r, friendship_status: 'pending' } : r
        ));
      }
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };

  const handleAcceptRequest = async (friendshipId: string, name: string) => {
    try {
      const success = await friendService.acceptRequest(friendshipId);
      if (success) {
        Toast.show({
          type: 'success',
          text1: 'Amizade aceita!',
          text2: `Você e ${name} agora são amigos`,
        });
        await loadData();
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleRejectRequest = async (friendshipId: string) => {
    try {
      const success = await friendService.rejectRequest(friendshipId);
      if (success) {
        Toast.show({
          type: 'info',
          text1: 'Solicitação rejeitada',
        });
        await loadData();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleRemoveFriend = async (friendshipId: string, name: string) => {
    try {
      const success = await friendService.removeFriend(friendshipId);
      if (success) {
        Toast.show({
          type: 'info',
          text1: 'Amigo removido',
          text2: `${name} foi removido da sua lista`,
        });
        await loadData();
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const navigateToProfile = (username: string | null) => {
    if (username) {
      (navigation as any).navigate('Profile', { username });
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 py-6">
          <Text className="text-2xl font-bold text-foreground">Amigos</Text>
          <Text className="text-muted-foreground">
            {friends.length} amigo{friends.length !== 1 ? 's' : ''}
            {pendingRequests.length > 0 && ` • ${pendingRequests.length} solicitação`}
          </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 mb-4">
        <TouchableOpacity
          onPress={() => setActiveTab('friends')}
          className={`flex-1 py-3 rounded-l-lg ${
            activeTab === 'friends' ? 'bg-primary' : 'bg-card'
          }`}
        >
          <Text className={`text-center font-semibold ${
            activeTab === 'friends' ? 'text-white' : 'text-muted-foreground'
          }`}>
            Amigos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('requests')}
          className={`flex-1 py-3 ${
            activeTab === 'requests' ? 'bg-primary' : 'bg-card'
          }`}
        >
          <View className="flex-row items-center justify-center gap-1">
            <Text className={`font-semibold ${
              activeTab === 'requests' ? 'text-white' : 'text-muted-foreground'
            }`}>
              Solicitações
            </Text>
            {pendingRequests.length > 0 && (
              <View className="bg-accent w-5 h-5 rounded-full items-center justify-center">
                <Text className="text-xs text-white font-bold">
                  {pendingRequests.length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('search')}
          className={`flex-1 py-3 rounded-r-lg ${
            activeTab === 'search' ? 'bg-primary' : 'bg-card'
          }`}
        >
          <Text className={`text-center font-semibold ${
            activeTab === 'search' ? 'text-white' : 'text-muted-foreground'
          }`}>
            Buscar
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Friends List */}
        {activeTab === 'friends' && (
          <>
            {friends.length === 0 ? (
              <Card className="items-center py-8">
                <Text className="text-muted-foreground text-center mb-2">
                  Você ainda não tem amigos
                </Text>
                <Text className="text-sm text-muted-foreground text-center">
                  Busque por username para adicionar amigos
                </Text>
              </Card>
            ) : (
              friends.map((friend) => (
                <TouchableOpacity
                  key={friend.friendship_id}
                  onPress={() => navigateToProfile(friend.username)}
                  activeOpacity={0.7}
                >
                  <Card className="mb-3 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center">
                        <Text className="text-xl">
                          {friend.name?.charAt(0)?.toUpperCase() || '👤'}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-foreground">{friend.name}</Text>
                        {friend.username && (
                          <Text className="text-sm text-muted-foreground">@{friend.username}</Text>
                        )}
                        <View className="flex-row items-center gap-2 mt-1">
                          <Flame size={14} color="#F59E0B" />
                          <Text className="text-sm text-accent">{friend.current_streak} dias</Text>
                          <Text className="text-sm text-muted-foreground">• Nível {friend.level}</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveFriend(friend.friendship_id, friend.name)}
                      className="w-10 h-10 items-center justify-center"
                    >
                      <UserX size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {/* Pending Requests */}
        {activeTab === 'requests' && (
          <>
            {pendingRequests.length === 0 ? (
              <Card className="items-center py-8">
                <Text className="text-muted-foreground text-center">
                  Nenhuma solicitação pendente
                </Text>
              </Card>
            ) : (
              pendingRequests.map((request) => (
                <Card key={request.friendship_id} className="mb-3">
                  <View className="flex-row items-center justify-between">
                    <TouchableOpacity 
                      onPress={() => navigateToProfile(request.username)}
                      className="flex-row items-center gap-3 flex-1"
                    >
                      <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center">
                        <Text className="text-xl">
                          {request.name?.charAt(0)?.toUpperCase() || '👤'}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-foreground">{request.name}</Text>
                        {request.username && (
                          <Text className="text-sm text-muted-foreground">@{request.username}</Text>
                        )}
                        <View className="flex-row items-center gap-2 mt-1">
                          <Clock size={14} color="#64748B" />
                          <Text className="text-sm text-muted-foreground">Solicitação pendente</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handleRejectRequest(request.friendship_id)}
                        className="w-10 h-10 bg-red-500/20 rounded-lg items-center justify-center"
                      >
                        <X size={20} color="#EF4444" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleAcceptRequest(request.friendship_id, request.name)}
                        className="w-10 h-10 bg-green-500/20 rounded-lg items-center justify-center"
                      >
                        <Check size={20} color="#22C55E" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {/* Search */}
        {activeTab === 'search' && (
          <>
            <View className="flex-row gap-2 mb-4">
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar por username ou nome..."
                placeholderTextColor="#64748B"
                className="flex-1 bg-card border border-border rounded-lg px-4 py-3 text-foreground"
                autoCapitalize="none"
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity
                onPress={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="w-12 bg-primary rounded-lg items-center justify-center"
              >
                {searching ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Search size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>

            {searchResults.length === 0 && searchQuery.trim() && !searching ? (
              <Card className="items-center py-8">
                <Text className="text-muted-foreground text-center">
                  Nenhum usuário encontrado
                </Text>
              </Card>
            ) : (
              searchResults.map((result) => (
                <TouchableOpacity
                  key={result.id}
                  onPress={() => navigateToProfile(result.username)}
                  activeOpacity={0.7}
                >
                  <Card className="mb-3 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center">
                        <Text className="text-xl">
                          {result.name?.charAt(0)?.toUpperCase() || '👤'}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-foreground">{result.name}</Text>
                        {result.username && (
                          <Text className="text-sm text-muted-foreground">@{result.username}</Text>
                        )}
                        <View className="flex-row items-center gap-2 mt-1">
                          <Flame size={14} color="#F59E0B" />
                          <Text className="text-sm text-accent">{result.current_streak} dias</Text>
                          <Text className="text-sm text-muted-foreground">• Nível {result.level}</Text>
                        </View>
                      </View>
                    </View>

                    {result.friendship_status === 'accepted' ? (
                      <View className="px-3 py-2 bg-green-500/20 rounded-lg">
                        <UserCheck size={20} color="#22C55E" />
                      </View>
                    ) : result.friendship_status === 'pending' ? (
                      <View className="px-3 py-2 bg-yellow-500/20 rounded-lg">
                        <Clock size={20} color="#EAB308" />
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleSendRequest(result.id)}
                        className="px-3 py-2 bg-primary rounded-lg"
                      >
                        <UserPlus size={20} color="white" />
                      </TouchableOpacity>
                    )}
                  </Card>
                </TouchableOpacity>
              ))
            )}

            {!searchQuery.trim() && (
              <Card className="items-center py-8">
                <Search size={48} color="#64748B" />
                <Text className="text-muted-foreground text-center mt-4">
                  Digite um username ou nome para buscar
                </Text>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default FriendsScreen;

