import { RespondentType, Sentiment, NextAction } from './types';

export function suggestNextAction(type: RespondentType, sentiment: Sentiment): NextAction {
  if (sentiment === 'Enthusiastic') {
    if (['Aquarian Conspirator', 'Media', 'Academic', 'Funder / Investor'].includes(type)) {
      return 'Schedule call – Dr. Chinyelu';
    }
    if (type === 'Community organizer') return 'Schedule call – Yakini';
    return 'Schedule call – Dr. Chinyelu';
  }
  if (sentiment === 'Interested') return 'Send follow-up packet';
  if (sentiment === 'Cautious' || sentiment === 'Skeptical') return 'Log objection – holding';
  return 'No action needed';
}

export function getFollowUpPacket(type: RespondentType): string {
  const packets: Record<RespondentType, string> = {
    'Aquarian Conspirator': 'Full book draft link + two-voice letter (Dr. Chinyelu + Claude) + Manifesto',
    'Media': 'Two-voice letter + Manifesto + one-pager on 1=1',
    'Funder / Investor': 'Investment pitch (FAN or ECCS) + Manifesto + meeting request',
    'Academic': 'Manifesto + scientific arc summary + Maslow passages + meeting request',
    'Political figure': 'Manifesto + Future America Plan + meeting request',
    'Clergy / Spiritual leader': 'Manifesto + Spirituality Cornerstone passage + meeting request',
    'Community organizer': 'Manifesto + Ashantawa framework + Yakini introduction',
    'Artist / Cultural figure': 'Manifesto + two-voice letter + personal note from Dr. Chinyelu',
    'Institutional leader': 'Manifesto + meeting request',
    'Referral': 'Full book draft link + two-voice letter + Manifesto',
    'Unknown': 'Manifesto',
  };
  return packets[type] || 'Manifesto';
}
