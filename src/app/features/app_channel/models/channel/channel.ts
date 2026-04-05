export interface Channel {
  id?: string;
  name: string;
  member: { id: String }[];
  description: string;
  creator: string;
  createdAt: Date;
}
