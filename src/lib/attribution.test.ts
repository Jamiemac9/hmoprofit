import { describe, expect, it } from 'vitest';
import { channelFrom } from './attribution';

describe('channelFrom', () => {
  it('prefers utm_source', () => expect(channelFrom('LinkedIn', 'https://google.com', '/')).toBe('linkedin'));
  it('spots LinkedIn referrers, including lnkd.in', () => {
    expect(channelFrom(null, 'https://www.linkedin.com/feed/', '/guides/x')).toBe('linkedin');
    expect(channelFrom(null, 'https://lnkd.in/abc', '/')).toBe('linkedin');
  });
  it('splits search by landing page', () => {
    expect(channelFrom(null, 'https://www.google.co.uk/', '/guides/x')).toBe('blog-search');
    expect(channelFrom(null, 'https://www.google.co.uk/', '/check')).toBe('search');
  });
  it('treats a direct guide landing as blog', () => expect(channelFrom(null, '', '/guides/x')).toBe('blog'));
  it('treats our own domain as direct', () => expect(channelFrom(null, 'https://hmoprofit.co.uk/', '/check')).toBe('direct'));
  it('labels other sites as referral', () => expect(channelFrom(null, 'https://supportaudit.co.uk/', '/check')).toBe('referral'));
});
