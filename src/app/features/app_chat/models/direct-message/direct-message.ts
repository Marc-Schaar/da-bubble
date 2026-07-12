import { BaseMessage } from '../base-message/base-message';

export class DirectMessage extends BaseMessage {
  from: string;
  to: string;

  constructor(obj?: any) {
    super(obj);
    this.from = obj?.from || '';
    this.to = obj?.to || '';
  }

  toJSON() {
    return {
      ...this.getBaseJSON(),
      from: this.from,
      to: this.to,
    };
  }
}
