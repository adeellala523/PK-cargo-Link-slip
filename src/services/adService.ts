export interface AdConfig {
  enabled: boolean;
  type: 'image' | 'script';
  imageUrl: string;
  targetUrl: string;
  altText: string;
  scriptCode: string;
  placement: 'top' | 'feed' | 'bottom';
}

const DEFAULT_AD_CONFIG: AdConfig = {
  enabled: false, // Initially disabled as requested
  type: 'image',
  imageUrl: '',
  targetUrl: '',
  altText: 'اسپانسرڈ اشتہار (Sponsored Ad)',
  scriptCode: '',
  placement: 'bottom',
};

const STORAGE_KEY = 'pk_cargo_ad_config_v1';

export const AdService = {
  getAdConfig(): AdConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_AD_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error reading ad config', e);
    }
    return DEFAULT_AD_CONFIG;
  },

  saveAdConfig(config: AdConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Error saving ad config', e);
    }
  },

  isAdsEnabled(): boolean {
    return this.getAdConfig().enabled;
  },
};
