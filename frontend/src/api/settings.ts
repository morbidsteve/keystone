import apiClient from './client';
import { isDemoMode } from './mockClient';

export interface ClassificationSetting {
  level: string;
  banner_text: string;
  color: string;
}

export async function getClassification(): Promise<ClassificationSetting> {
  if (isDemoMode) return { level: 'UNCLASSIFIED', banner_text: 'UNCLASSIFIED', color: 'green' };
  const { data } = await apiClient.get('/settings/classification');
  return data;
}

export async function updateClassification(setting: ClassificationSetting): Promise<ClassificationSetting> {
  if (isDemoMode) return setting;
  const { data } = await apiClient.put('/settings/classification', setting);
  return data;
}
