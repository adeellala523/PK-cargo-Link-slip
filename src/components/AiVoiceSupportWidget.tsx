import React from 'react';
import { GeminiLiveVoiceWidget } from './GeminiLiveVoiceWidget';
import { LoadSlip } from '../types';

interface AiVoiceSupportWidgetProps {
  slips: LoadSlip[];
  onNavigateToSearchWithQuery?: (from: string, to: string) => void;
  onOpenCreateSlip?: () => void;
  onNavigateToTrucks?: () => void;
  onNavigateToDriverPortal?: () => void;
  onOpenPaymentSettings?: () => void;
  onViewSlip?: (slip: LoadSlip) => void;
}

export const AiVoiceSupportWidget: React.FC<AiVoiceSupportWidgetProps> = (props) => {
  return <GeminiLiveVoiceWidget {...props} />;
};
