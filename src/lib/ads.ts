import { Platform } from 'react-native';
import { analytics } from './analytics';
import { logger } from './logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IDs de teste do AdMob (usar em desenvolvimento)
const TEST_AD_UNIT_IDS = {
  android: {
    app: 'ca-app-pub-3940256099942544~3347511713',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
  ios: {
    app: 'ca-app-pub-3940256099942544~1458002511',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  },
};

// Chaves para AsyncStorage
const STORAGE_KEYS = {
  LAST_AD_SHOWN: 'ads_last_shown',
  AD_COUNT_TODAY: 'ads_count_today',
  AD_DATE: 'ads_date',
};

// Configurações
const CONFIG = {
  // Máximo de anúncios por dia
  MAX_ADS_PER_DAY: 3,
  // Tempo mínimo entre anúncios (em minutos)
  MIN_TIME_BETWEEN_ADS: 30,
  // Delay antes de mostrar o anúncio após dia perfeito (em ms)
  AD_DELAY_AFTER_PERFECT_DAY: 2000,
};

class AdsService {
  private mobileAds: any = null;
  private interstitialAd: any = null;
  private isInitialized = false;
  private isInitializing = false;

  /**
   * Inicializa o serviço de anúncios
   */
  async init(): Promise<void> {
    if (this.isInitialized || this.isInitializing) {
      return;
    }

    this.isInitializing = true;

    try {
      // Importação dinâmica para evitar erros se a lib não estiver instalada
      // @ts-ignore - Biblioteca pode não estar instalada ainda
      const { mobileAds } = await import('react-native-google-mobile-ads');
      this.mobileAds = mobileAds;

      const appId = this.getAppId();
      
      await mobileAds().initialize();
      this.isInitialized = true;
      this.isInitializing = false;

      logger.log('AdsService', 'Initialized successfully', { appId });
      
      // Pré-carregar um anúncio intersticial
      this.preloadInterstitial();
    } catch (error) {
      this.isInitializing = false;
      logger.error('AdsService', 'Failed to initialize', error);
      // Não quebra o app se anúncios falharem
      console.warn('Ads initialization failed:', error);
    }
  }

  /**
   * Obtém o App ID do AdMob (produção ou teste)
   */
  private getAppId(): string {
    const prodAppId = process.env.EXPO_PUBLIC_ADMOB_APP_ID;
    
    if (__DEV__ || !prodAppId) {
      return Platform.OS === 'ios' 
        ? TEST_AD_UNIT_IDS.ios.app 
        : TEST_AD_UNIT_IDS.android.app;
    }
    
    return prodAppId;
  }

  /**
   * Obtém o Ad Unit ID para intersticial (produção ou teste)
   */
  private getInterstitialAdUnitId(): string {
    const prodAdUnitId = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID;
    
    if (__DEV__ || !prodAdUnitId) {
      return Platform.OS === 'ios' 
        ? TEST_AD_UNIT_IDS.ios.interstitial 
        : TEST_AD_UNIT_IDS.android.interstitial;
    }
    
    return prodAdUnitId;
  }

  /**
   * Pré-carrega um anúncio intersticial
   */
  private async preloadInterstitial(): Promise<void> {
    if (!this.isInitialized || !this.mobileAds) return;

    try {
      // @ts-ignore - Biblioteca pode não estar instalada ainda
      const { InterstitialAd, AdEventType } = await import('react-native-google-mobile-ads');
      
      const adUnitId = this.getInterstitialAdUnitId();
      this.interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      // Listener para quando o anúncio é carregado
      this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        logger.log('AdsService', 'Interstitial ad loaded');
      });

      // Listener para quando o anúncio é fechado
      this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        logger.log('AdsService', 'Interstitial ad closed');
        analytics.track('Ad Closed', { type: 'interstitial', context: 'perfect_day' });
        
        // Pré-carregar próximo anúncio
        this.preloadInterstitial();
      });

      // Listener para erros
      this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
        logger.error('AdsService', 'Interstitial ad error', error);
      });

      // Carregar o anúncio
      await this.interstitialAd.load();
    } catch (error) {
      logger.error('AdsService', 'Failed to preload interstitial', error);
    }
  }

  /**
   * Verifica se pode mostrar anúncio (controle de frequência)
   */
  private async canShowAd(): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastAdDate = await AsyncStorage.getItem(STORAGE_KEYS.AD_DATE);
      const adCountToday = await AsyncStorage.getItem(STORAGE_KEYS.AD_COUNT_TODAY);
      const lastAdTime = await AsyncStorage.getItem(STORAGE_KEYS.LAST_AD_SHOWN);

      // Se é um novo dia, resetar contador
      if (lastAdDate !== today) {
        await AsyncStorage.setItem(STORAGE_KEYS.AD_DATE, today);
        await AsyncStorage.setItem(STORAGE_KEYS.AD_COUNT_TODAY, '0');
        return true;
      }

      // Verificar limite diário
      const count = parseInt(adCountToday || '0', 10);
      if (count >= CONFIG.MAX_ADS_PER_DAY) {
        logger.log('AdsService', 'Daily ad limit reached', { count });
        return false;
      }

      // Verificar tempo mínimo entre anúncios
      if (lastAdTime) {
        const lastTime = parseInt(lastAdTime, 10);
        const now = Date.now();
        const minutesSinceLastAd = (now - lastTime) / (1000 * 60);
        
        if (minutesSinceLastAd < CONFIG.MIN_TIME_BETWEEN_ADS) {
          logger.log('AdsService', 'Too soon to show ad', { 
            minutesSinceLastAd,
            minRequired: CONFIG.MIN_TIME_BETWEEN_ADS 
          });
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('AdsService', 'Error checking if can show ad', error);
      // Em caso de erro, permitir mostrar (fail-safe)
      return true;
    }
  }

  /**
   * Registra que um anúncio foi mostrado
   */
  private async recordAdShown(): Promise<void> {
    try {
      const now = Date.now();
      const today = new Date().toISOString().split('T')[0];
      
      const adCountToday = await AsyncStorage.getItem(STORAGE_KEYS.AD_COUNT_TODAY);
      const count = parseInt(adCountToday || '0', 10) + 1;

      await AsyncStorage.setItem(STORAGE_KEYS.LAST_AD_SHOWN, now.toString());
      await AsyncStorage.setItem(STORAGE_KEYS.AD_COUNT_TODAY, count.toString());
      await AsyncStorage.setItem(STORAGE_KEYS.AD_DATE, today);

      logger.log('AdsService', 'Ad shown recorded', { count, date: today });
    } catch (error) {
      logger.error('AdsService', 'Error recording ad shown', error);
    }
  }

  /**
   * Mostra anúncio intersticial (com controle de frequência)
   */
  async showInterstitial(context: string = 'unknown'): Promise<boolean> {
    if (!this.isInitialized) {
      logger.warn('AdsService', 'Not initialized, attempting to init');
      await this.init();
      // Aguardar um pouco para o anúncio carregar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Verificar se pode mostrar
    const canShow = await this.canShowAd();
    if (!canShow) {
      logger.log('AdsService', 'Cannot show ad (frequency limit)', { context });
      return false;
    }

    // Verificar se o anúncio está carregado
    if (!this.interstitialAd || !this.interstitialAd.loaded) {
      logger.warn('AdsService', 'Interstitial ad not loaded, preloading...', { context });
      await this.preloadInterstitial();
      // Aguardar carregamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!this.interstitialAd || !this.interstitialAd.loaded) {
        logger.warn('AdsService', 'Interstitial ad still not loaded', { context });
        return false;
      }
    }

    try {
      // Mostrar anúncio
      await this.interstitialAd.show();
      
      // Registrar que foi mostrado
      await this.recordAdShown();
      
      // Track analytics
      analytics.track('Ad Shown', { 
        type: 'interstitial', 
        context,
        timestamp: new Date().toISOString(),
      });

      logger.log('AdsService', 'Interstitial ad shown', { context });
      return true;
    } catch (error) {
      logger.error('AdsService', 'Error showing interstitial ad', error);
      return false;
    }
  }

  /**
   * Mostra anúncio quando usuário completa dia perfeito
   */
  async showPerfectDayAd(): Promise<void> {
    // Delay para melhor UX (não mostrar imediatamente)
    setTimeout(async () => {
      const shown = await this.showInterstitial('perfect_day');
      
      if (!shown) {
        logger.log('AdsService', 'Perfect day ad not shown (frequency limit or not loaded)');
      }
    }, CONFIG.AD_DELAY_AFTER_PERFECT_DAY);
  }

  /**
   * Verifica se o serviço está disponível
   */
  isAvailable(): boolean {
    return this.isInitialized && this.mobileAds !== null;
  }
}

export const adsService = new AdsService();

