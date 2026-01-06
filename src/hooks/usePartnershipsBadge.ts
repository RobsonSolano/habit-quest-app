import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { partnershipService } from '@/lib/storage';

export const usePartnershipsBadge = () => {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  const loadPendingCount = useCallback(async () => {
    if (!user) {
      setPendingCount(0);
      return;
    }

    try {
      const partnerships = await partnershipService.getUserPartnerships(user.id);
      const pending = partnerships.filter(p => p.status === 'pending' && !p.is_user1);
      setPendingCount(pending.length);
    } catch (error) {
      console.error('Error loading partnerships badge:', error);
      setPendingCount(0);
    }
  }, [user]);

  useEffect(() => {
    loadPendingCount();

    // Recarregar a cada 30 segundos
    const interval = setInterval(loadPendingCount, 30000);

    return () => clearInterval(interval);
  }, [loadPendingCount]);

  // Recarregar quando a tela de parcerias for focada
  useFocusEffect(
    useCallback(() => {
      loadPendingCount();
    }, [loadPendingCount])
  );

  return pendingCount;
};

