export interface UnreadCounter {
  id?: string;
  type: 'direct' | 'channel';
  unreadCount: number;
  updatedAt?: any;
}
