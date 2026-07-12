export interface Channel {
  id?: string;
  name: string;
  member: { id: string }[];
  description: string;
  createdAt: Date;
  createdBy: string;
}
