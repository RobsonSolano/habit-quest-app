import { Mixpanel } from 'mixpanel-react-native';

const MIXPANEL_TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || 'd18628cec10c1fa08fde6cb72ab6f211';

class AnalyticsService {
  private mixpanel: Mixpanel | null = null;
  private initialized: boolean = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      this.mixpanel = new Mixpanel(MIXPANEL_TOKEN, true);
      await this.mixpanel.init();
      this.initialized = true;
      console.log('Analytics initialized');
    } catch (error) {
      console.log('Analytics initialization failed:', error);
    }
  }

  // Identificar usuário
  identify(userId: string, properties?: Record<string, any>): void {
    if (!this.initialized || !this.mixpanel) return;
    
    try {
      this.mixpanel.identify(userId);
      if (properties) {
        this.mixpanel.getPeople().set(properties);
      }
    } catch {
      // Ignore
    }
  }

  // Resetar (logout)
  reset(): void {
    if (!this.initialized || !this.mixpanel) return;
    
    try {
      this.mixpanel.reset();
    } catch {
      // Ignore
    }
  }

  // Rastrear evento
  track(event: string, properties?: Record<string, any>): void {
    if (!this.initialized || !this.mixpanel) return;
    
    try {
      this.mixpanel.track(event, properties);
    } catch {
      // Ignore
    }
  }

  // =============================================
  // EVENTOS ESPECÍFICOS DO HABITQUEST
  // =============================================

  trackSignUp(method: 'email' | 'google' | 'apple'): void {
    this.track('Sign Up', { method });
  }

  trackLogin(method: 'email' | 'google' | 'apple'): void {
    this.track('Login', { method });
  }

  trackLogout(): void {
    this.track('Logout');
    this.reset();
  }

  trackHabitCreated(habit: { name: string; frequency: string; points: number }): void {
    this.track('Habit Created', habit);
  }

  trackHabitCompleted(habit: { name: string; points: number; streak: number }): void {
    this.track('Habit Completed', habit);
  }

  trackHabitUncompleted(habit: { name: string }): void {
    this.track('Habit Uncompleted', habit);
  }

  trackAllHabitsCompleted(): void {
    this.track('All Habits Completed Today');
  }

  trackStreakBroken(oldStreak: number): void {
    this.track('Streak Broken', { old_streak: oldStreak });
  }

  trackStreakMilestone(streak: number): void {
    this.track('Streak Milestone', { streak });
  }

  trackAchievementUnlocked(achievement: { title: string; type: string }): void {
    this.track('Achievement Unlocked', achievement);
  }

  trackFriendRequestSent(): void {
    this.track('Friend Request Sent');
  }

  trackFriendRequestAccepted(): void {
    this.track('Friend Request Accepted');
  }

  trackLevelUp(newLevel: number): void {
    this.track('Level Up', { level: newLevel });
  }

  trackScreenView(screenName: string): void {
    this.track('Screen View', { screen: screenName });
  }

  trackAppOpen(): void {
    this.track('App Open');
  }

  trackError(errorType: string, errorMessage: string): void {
    this.track('Error', { type: errorType, message: errorMessage });
  }
}

export const analytics = new AnalyticsService();

