/**
 * PK Cargo Link Centralized Feature Flags Configuration
 * 
 * Set GEMINI_LIVE_ENABLED to true to re-enable user-facing Gemini Live Voice Assistant.
 * When false, the Voice Assistant logic, subscription gates, backend endpoints, and tools
 * remain 100% preserved and intact, while the UI displays a friendly disabled notification.
 */
export const GEMINI_LIVE_ENABLED = false;

export const VOICE_ASSISTANT_DISABLED_MESSAGE = {
  title: '🎙️ وائس اسسٹنٹ فی الحال دستیاب نہیں',
  subtitle: 'براہ کرم بعد میں دوبارہ کوشش کریں۔',
};
