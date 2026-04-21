export interface ClaimRecord {
  uid: string;
  name: string;
  claimedAt: Date;
}

export interface SwagItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  location: string;
  claimed: boolean;
  claims: ClaimRecord[];
  lastClaimedAt: Date | null;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  expired: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  claimedCount: number;
  createdCount: number;
}
