import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'linkify',
})
export class LinkifyPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: unknown): SafeHtml {
    if (typeof value !== 'string') return '';
    const mentionRegex = /@([\w ._-]+)\/\/?/g;

    const replaced = value.replace(mentionRegex, (match, username) => {
      return `<button class="tag-btn" onclick="openTag()">@${username.trim()}</button>`;
    });

    return this.sanitizer.bypassSecurityTrustHtml(replaced);
  }
}
