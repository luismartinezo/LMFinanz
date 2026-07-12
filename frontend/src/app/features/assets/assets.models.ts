export type AssetType = 'HOUSE' | 'VEHICLE' | 'ELECTRONICS' | 'FURNITURE' | 'OTHER';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  currencyCode: string;
  countryCode: string;
  estimatedValue: number;
  acquisitionDate: string | null;
  description: string | null;
  active: boolean;
}

export interface AssetRequest {
  name: string;
  type: AssetType;
  currencyCode: string;
  countryCode: string;
  estimatedValue: number;
  acquisitionDate: string | null;
  description: string | null;
}
