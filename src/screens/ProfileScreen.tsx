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
import { useRoute, RouteProp } from '@react-navigation/native';
import { 
  Edit2, 
  Check, 
  X, 
  Flame, 
  Trophy, 
  Calendar,
  UserPlus,
  UserCheck,
  Clock,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { profileService, statsService, friendService, streakService } from '@/lib/storage';
import { Profile, PublicProfile } from '@/types/database';
import { UserStatsUI, mapStatsToUI } from '@/types/habit';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Toast from 'react-native-toast-message';

type ProfileScreenRouteProp = RouteProp<{
  Profile: { username?: string };
}, 'Profile'>;

const ProfileScreen = () => {
  const route = useRoute<ProfileScreenRouteProp>();
  const { user, profile: authProfile } = useAuth();
  
  const viewingUsername = route.params?.username;
  const isOwnProfile = !viewingUsername || viewingUsername === authProfile?.username;

  const [profile, setProfile] = useState<Profile | PublicProfile | null>(null);
  const [stats, setStats] = useState<UserStatsUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  
  // Edit form
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      if (isOwnProfile) {
        // Load own profile
        const profileData = await profileService.get(user.id);
        const statsData = await statsService.get(user.id);
        const streakData = await streakService.getProfile(user.id);
        
        if (profileData && streakData) {
          setProfile({
            ...profileData,
            current_streak: streakData.currentStreak,
            longest_streak: streakData.longestStreak,
          });
        }
        setStats(mapStatsToUI(statsData));
      } else {
        // Load other user's profile
        const publicProfile = await profileService.getByUsername(viewingUsername!);
        if (publicProfile) {
          setProfile(publicProfile);
          setStats({
            level: publicProfile.level,
            xp: 0,
            xpToNextLevel: 100,
            totalPoints: publicProfile.total_points,
            longestStreak: publicProfile.longest_streak,
          });

          // Check friendship status
          const searchResults = await friendService.search(viewingUsername!, user.id);
          const found = searchResults.find(r => r.username === viewingUsername);
          setFriendshipStatus(found?.friendship_status || null);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isOwnProfile, viewingUsername]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (profile && isOwnProfile) {
      setEditName((profile as Profile).name || '');
      setEditUsername((profile as Profile).username || '');
      setEditBio((profile as Profile).bio || '');
    }
  }, [profile, isOwnProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const result = await profileService.update(user.id, {
        name: editName.trim(),
        username: editUsername.trim().toLowerCase(),
        bio: editBio.trim(),
      });

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Perfil atualizado!',
        });
        setEditing(false);
        await loadData();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: result.error || 'Não foi possível atualizar',
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!user || !profile) return;

    try {
      const success = await friendService.sendRequest(user.id, profile.id);
      if (success) {
        setFriendshipStatus('pending');
        Toast.show({
          type: 'success',
          text1: 'Solicitação enviada!',
          text2: `Aguardando ${(profile as PublicProfile).name} aceitar`,
        });
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-4 py-6">
          <Text className="text-xl font-bold text-foreground">Perfil não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = 'name' in profile ? profile.name : '';
  const displayUsername = 'username' in profile ? profile.username : '';
  const displayBio = 'bio' in profile ? profile.bio : '';
  const currentStreak = profile.current_streak || 0;
  const longestStreak = profile.longest_streak || 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-6">
          <Text className="text-2xl font-bold text-foreground">Perfil</Text>
          
          {isOwnProfile && !editing && (
            <TouchableOpacity
              onPress={() => setEditing(true)}
              className="w-12 h-12 bg-card border border-border rounded-lg items-center justify-center"
            >
              <Edit2 size={20} color="#F8FAFC" />
            </TouchableOpacity>
          )}

          {isOwnProfile && editing && (
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setEditing(false)}
                className="w-12 h-12 bg-card border border-red-500 rounded-lg items-center justify-center"
              >
                <X size={20} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={saving}
                className="w-12 h-12 bg-primary rounded-lg items-center justify-center"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Check size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="px-4">
          {/* Profile Card */}
          <Card className="mb-6">
            {/* Avatar & Name */}
            <View className="items-center mb-6">
              <View className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center mb-4">
                <Text className="text-4xl">
                  {displayName?.charAt(0)?.toUpperCase() || '👤'}
                </Text>
              </View>

              {editing ? (
                <View className="w-full space-y-3">
                  <View>
                    <Text className="text-sm text-muted-foreground mb-1">Nome</Text>
                    <TextInput
                      value={editName}
                      onChangeText={setEditName}
                      className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View>
                    <Text className="text-sm text-muted-foreground mb-1">Username</Text>
                    <TextInput
                      value={editUsername}
                      onChangeText={(text) => setEditUsername(text.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                      className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                      placeholderTextColor="#64748B"
                      autoCapitalize="none"
                    />
                  </View>
                  <View>
                    <Text className="text-sm text-muted-foreground mb-1">Bio</Text>
                    <TextInput
                      value={editBio}
                      onChangeText={setEditBio}
                      className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                      placeholderTextColor="#64748B"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>
              ) : (
                <>
                  <Text className="text-2xl font-bold text-foreground mb-1">
                    {displayName}
                  </Text>
                  {displayUsername && (
                    <Text className="text-muted-foreground mb-2">
                      @{displayUsername}
                    </Text>
                  )}
                  {displayBio && (
                    <Text className="text-foreground text-center mt-2">
                      {displayBio}
                    </Text>
                  )}
                </>
              )}
            </View>

            {/* Add Friend Button (for other profiles) */}
            {!isOwnProfile && (
              <View className="mb-6">
                {friendshipStatus === 'accepted' ? (
                  <View className="flex-row items-center justify-center gap-2 py-3 bg-green-500/20 rounded-lg">
                    <UserCheck size={20} color="#22C55E" />
                    <Text className="text-green-500 font-semibold">Amigos</Text>
                  </View>
                ) : friendshipStatus === 'pending' ? (
                  <View className="flex-row items-center justify-center gap-2 py-3 bg-yellow-500/20 rounded-lg">
                    <Clock size={20} color="#EAB308" />
                    <Text className="text-yellow-500 font-semibold">Solicitação pendente</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleSendFriendRequest}
                    className="flex-row items-center justify-center gap-2 py-3 bg-primary rounded-lg"
                  >
                    <UserPlus size={20} color="white" />
                    <Text className="text-white font-semibold">Adicionar amigo</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Streak Stats */}
            <View className="flex-row justify-around">
              <View className="items-center">
                <View className="flex-row items-center gap-1 mb-1">
                  <Flame size={24} color="#F59E0B" />
                  <Text className="text-3xl font-bold text-accent">{currentStreak}</Text>
                </View>
                <Text className="text-sm text-muted-foreground">Ofensiva Atual</Text>
              </View>

              <View className="w-px bg-border" />

              <View className="items-center">
                <View className="flex-row items-center gap-1 mb-1">
                  <Trophy size={24} color="#8B5CF6" />
                  <Text className="text-3xl font-bold text-primary">{longestStreak}</Text>
                </View>
                <Text className="text-sm text-muted-foreground">Maior Ofensiva</Text>
              </View>
            </View>
          </Card>

          {/* Stats Card */}
          {stats && (
            <Card className="mb-6">
              <Text className="text-xl font-semibold text-foreground mb-4">Estatísticas</Text>
              
              <View className="flex-row flex-wrap gap-3">
                <View className="flex-1 min-w-[45%] bg-background rounded-lg p-4">
                  <Text className="text-sm text-muted-foreground mb-1">Nível</Text>
                  <Text className="text-2xl font-bold text-foreground">{stats.level}</Text>
                </View>

                <View className="flex-1 min-w-[45%] bg-background rounded-lg p-4">
                  <Text className="text-sm text-muted-foreground mb-1">Pontos Totais</Text>
                  <Text className="text-2xl font-bold text-foreground">{stats.totalPoints}</Text>
                </View>
              </View>
            </Card>
          )}

          {/* Member Since */}
          {'created_at' in profile && (
            <Card className="mb-6">
              <View className="flex-row items-center gap-2">
                <Calendar size={20} color="#64748B" />
                <Text className="text-muted-foreground">
                  Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

