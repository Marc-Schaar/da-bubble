import { BaseMessage } from '../base-message/base-message';

export interface Reaction {
  emoji: string;
  from: string;
}

export interface ThreadReplyMeta {
  time: string;
}

export class ChannelMessage extends BaseMessage {
  reaction: Reaction[];
  thread: ThreadReplyMeta[];

  constructor(obj?: any) {
    super(obj);
    this.reaction = obj?.reaction || [];
    this.thread = obj?.thread || [];
  }

  toJSON() {
    return {
      ...this.getBaseJSON(),
      reaction: this.reaction,
    };
  }
}
