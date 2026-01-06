import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Flame, 
  UserPlus, 
  Check, 
  X, 
  Calendar,
  Bell,
  BellOff,
  Trophy,
  Target,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { partnershipService, PartnershipWithPartner, friendService, FriendWithProfile } from '@/lib/storage';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { showToast } from '@/lib/toast';
import { logger } from '@/lib/logger';

const PartnershipsScreen = () => {
  const { user } = useAuth();
  const [partnerships, setPartnerships] = useState<PartnershipWithPartner[]>([]);
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendWithProfile | null>(null);
  const [targetDays, setTargetDays] = useState('7');

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const [partnershipsData, friendsData] = await Promise.all([
        partnershipService.getUserPartnerships(user.id),
        friendService.getFriends(user.id),
      ]);

      setPartnerships(partnershipsData);
      
      // Filtrar amigos que já têm parceria ativa ou pendente (não pode ter duas com a mesma pessoa)
      const activeOrPendingPartnerships = partnershipsData.filter(
        p => p.status === 'active' || p.status === 'pending'
      );
      const partnerIds = new Set(activeOrPendingPartnerships.map(p => p.partner_id));
      
      setFriends(friendsData.filter(f => !partnerIds.has(f.friend_id)));
    } catch (error) {
      logger.error('PartnershipsScreen', 'Error loading data', error);
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

  const handleCreateInvite = async (friend: FriendWithProfile) => {
    if (!user) return;

    const days = parseInt(targetDays, 10);
    if (isNaN(days) || days < 1 || days > 365) {
      showToast('error', 'Erro', 'Digite um número válido entre 1 e 365');
      return;
    }

    try {
      const result = await partnershipService.createInvite(user.id, friend.friend_id, days);
      if (result.success) {
        showToast('success', 'Convite enviado!', `${friend.name} receberá o convite`);
        setInviteModalVisible(false);
        setSelectedFriend(null);
        setTargetDays('7');
        await loadData();
      } else {
        showToast('error', 'Erro', result.error || 'Não foi possível enviar o convite');
      }
    } catch (error) {
      logger.error('PartnershipsScreen', 'Error creating invite', error);
      showToast('error', 'Erro', 'Não foi possível enviar o convite');
    }
  };

  const handleAcceptInvite = async (partnershipId: string) => {
    if (!user) return;

    try {
      const success = await partnershipService.acceptInvite(partnershipId, user.id);
      if (success) {
        showToast('success', 'Parceria ativada!', 'Agora vocês estão fazendo ofensiva juntos!');
        await loadData();
      } else {
        showToast('error', 'Erro', 'Não foi possível aceitar o convite');
      }
    } catch (error) {
      logger.error('PartnershipsScreen', 'Error accepting invite', error);
      showToast('error', 'Erro', 'Não foi possível aceitar o convite');
    }
  };

  const handleCancelPartnership = async (partnershipId: string) => {
    if (!user) return;

    try {
      const success = await partnershipService.cancelPartnership(partnershipId, user.id);
      if (success) {
        showToast('info', 'Parceria cancelada', '');
        await loadData();
      } else {
        showToast('error', 'Erro', 'Não foi possível cancelar a parceria');
      }
    } catch (error) {
      logger.error('PartnershipsScreen', 'Error cancelling partnership', error);
      showToast('error', 'Erro', 'Não foi possível cancelar a parceria');
    }
  };

  const handleToggleReminder = async (partnershipId: string, currentValue: boolean) => {
    if (!user) return;

    try {
      const success = await partnershipService.updateReminderSettings(partnershipId, user.id, !currentValue);
      if (success) {
        showToast('success', 'Configuração atualizada', currentValue ? 'Lembretes desativados' : 'Lembretes ativados');
        await loadData();
      }
    } catch (error) {
      logger.error('PartnershipsScreen', 'Error updating reminder', error);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </SafeAreaView>
    );
  }

  const activePartnerships = partnerships.filter(p => p.status === 'active');
  const pendingPartnerships = partnerships.filter(p => p.status === 'pending');
  const completedPartnerships = partnerships.filter(p => p.status === 'completed');

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 py-6">
        <Text className="text-2xl font-bold text-foreground">Parcerias de Ofensiva</Text>
        <Text className="text-muted-foreground">
          Faça ofensivas junto com seus amigos! 🔥
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Active Partnerships */}
        {activePartnerships.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">Ativas</Text>
            {activePartnerships.map((partnership) => {
              const progress = (partnership.current_streak / partnership.target_days) * 100;
              return (
                <Card key={partnership.id} className="mb-3">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center">
                        <Text className="text-xl">
                          {partnership.partner_name?.charAt(0)?.toUpperCase() || '👤'}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-foreground">{partnership.partner_name}</Text>
                        {partnership.partner_username && (
                          <Text className="text-sm text-muted-foreground">@{partnership.partner_username}</Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleToggleReminder(partnership.id, partnership.reminder_enabled)}
                      className="w-10 h-10 items-center justify-center"
                    >
                      {partnership.reminder_enabled ? (
                        <Bell size={20} color="#8B5CF6" />
                      ) : (
                        <BellOff size={20} color="#64748B" />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View className="mb-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2">
                        <Flame size={16} color="#F59E0B" />
                        <Text className="text-sm font-medium text-foreground">
                          {partnership.current_streak} / {partnership.target_days} dias
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Target size={14} color="#8B5CF6" />
                        <Text className="text-xs text-muted-foreground">
                          {Math.round(progress)}%
                        </Text>
                      </View>
                    </View>
                    <Progress value={progress} className="h-2" />
                  </View>

                  {partnership.last_activity_date && (
                    <Text className="text-xs text-muted-foreground mb-2">
                      Última atividade: {new Date(partnership.last_activity_date).toLocaleDateString('pt-BR')}
                    </Text>
                  )}

                  <TouchableOpacity
                    onPress={() => handleCancelPartnership(partnership.id)}
                    className="self-end"
                  >
                    <Text className="text-xs text-red-500">Cancelar parceria</Text>
                  </TouchableOpacity>
                </Card>
              );
            })}
          </View>
        )}

        {/* Pending Partnerships */}
        {pendingPartnerships.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">Pendentes</Text>
            {pendingPartnerships.map((partnership) => (
              <Card key={partnership.id} className="mb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center">
                      <Text className="text-xl">
                        {partnership.partner_name?.charAt(0)?.toUpperCase() || '👤'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">{partnership.partner_name}</Text>
                      {partnership.partner_username && (
                        <Text className="text-sm text-muted-foreground">@{partnership.partner_username}</Text>
                      )}
                      <Text className="text-xs text-muted-foreground mt-1">
                        Meta: {partnership.target_days} dias
                      </Text>
                    </View>
                  </View>
                  {!partnership.is_user1 && (
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handleCancelPartnership(partnership.id)}
                        className="w-10 h-10 bg-red-500/20 rounded-lg items-center justify-center"
                      >
                        <X size={20} color="#EF4444" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleAcceptInvite(partnership.id)}
                        className="w-10 h-10 bg-green-500/20 rounded-lg items-center justify-center"
                      >
                        <Check size={20} color="#22C55E" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {partnership.is_user1 && (
                    <View className="px-3 py-2 bg-yellow-500/20 rounded-lg">
                      <Text className="text-xs text-yellow-600">Aguardando</Text>
                    </View>
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Completed Partnerships */}
        {completedPartnerships.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">Concluídas</Text>
            {completedPartnerships.map((partnership) => (
              <Card key={partnership.id} className="mb-3 bg-accent/10 border-accent/30">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-full bg-accent/20 items-center justify-center">
                    <Trophy size={24} color="#8B5CF6" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">{partnership.partner_name}</Text>
                    <Text className="text-sm text-muted-foreground">
                      {partnership.current_streak} dias completados! 🎉
                    </Text>
                    {partnership.end_date && (
                      <Text className="text-xs text-muted-foreground mt-1">
                        Concluída em {new Date(partnership.end_date).toLocaleDateString('pt-BR')}
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Empty State */}
        {partnerships.length === 0 && (
          <Card className="items-center py-12">
            <Flame size={48} color="#64748B" />
            <Text className="text-muted-foreground text-center mt-4 mb-2">
              Nenhuma parceria ainda
            </Text>
            <Text className="text-sm text-muted-foreground text-center mb-4">
              Convide um amigo para fazer ofensiva juntos!
            </Text>
            <TouchableOpacity
              onPress={() => setInviteModalVisible(true)}
              className="bg-primary px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">Criar Parceria</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Invite Button */}
        {partnerships.length > 0 && friends.length > 0 && (
          <TouchableOpacity
            onPress={() => setInviteModalVisible(true)}
            className="bg-primary px-6 py-4 rounded-lg mb-6 flex-row items-center justify-center gap-2"
          >
            <UserPlus size={20} color="white" />
            <Text className="text-white font-semibold">Convidar Amigo</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Invite Modal */}
      <Modal
        visible={inviteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-foreground">Convidar Amigo</Text>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text className="text-muted-foreground mb-4">
              Selecione um amigo e defina a meta de dias:
            </Text>

            <ScrollView className="max-h-64 mb-4">
              {friends.length === 0 ? (
                <Text className="text-muted-foreground text-center py-8">
                  Você precisa ter amigos para criar uma parceria
                </Text>
              ) : (
                friends.map((friend) => (
                  <TouchableOpacity
                    key={friend.friend_id}
                    onPress={() => setSelectedFriend(friend)}
                    className={`p-4 rounded-lg mb-2 border-2 ${
                      selectedFriend?.friend_id === friend.friend_id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card'
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                        <Text className="text-lg">
                          {friend.name?.charAt(0)?.toUpperCase() || '👤'}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-foreground">{friend.name}</Text>
                        {friend.username && (
                          <Text className="text-sm text-muted-foreground">@{friend.username}</Text>
                        )}
                      </View>
                      {selectedFriend?.friend_id === friend.friend_id && (
                        <Check size={20} color="#8B5CF6" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {selectedFriend && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Meta de dias (1-365):
                </Text>
                <TextInput
                  value={targetDays}
                  onChangeText={setTargetDays}
                  placeholder="7"
                  placeholderTextColor="#64748B"
                  keyboardType="number-pad"
                  className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
                />
              </View>
            )}

            <TouchableOpacity
              onPress={() => selectedFriend && handleCreateInvite(selectedFriend)}
              disabled={!selectedFriend}
              className={`bg-primary px-6 py-4 rounded-lg items-center ${
                !selectedFriend ? 'opacity-50' : ''
              }`}
            >
              <Text className="text-white font-semibold">Enviar Convite</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PartnershipsScreen;

