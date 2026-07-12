import { BaseMessage } from '../base-message/base-message';

export class ChannelMessage extends BaseMessage {
  reaction: string[];
  thread: string[];

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
