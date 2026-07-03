export type RespondentType =
  | 'Aquarian Conspirator'
  | 'Media'
  | 'Funder / Investor'
  | 'Academic'
  | 'Political figure'
  | 'Institutional leader'
  | 'Clergy / Spiritual leader'
  | 'Community organizer'
  | 'Artist / Cultural figure'
  | 'Referral'
  | 'Unknown';

export type Sentiment =
  | 'Enthusiastic'
  | 'Interested'
  | 'Cautious'
  | 'Skeptical'
  | 'Declined'
  | 'No response';

export type Channel =
  | 'Email'
  | 'Web form'
  | 'Social media DM'
  | 'Phone call'
  | 'Text / SMS'
  | 'In-person / event'
  | 'Third-party referral';

export type DiaryDay = 'Day 4 – June 26' | 'Day 5 – June 27' | 'Day 9 – July 1';

export type Status = 'New' | 'In progress' | 'Complete' | 'Declined' | 'Holding';

export type AssignedTo = 'Dr. Chinyelu' | 'Yakini' | 'Jabari' | 'Other';

export type NextAction =
  | 'Schedule call – Dr. Chinyelu'
  | 'Schedule call – Yakini'
  | 'Send follow-up packet'
  | 'Log objection – holding'
  | 'Flag for book review'
  | 'No action needed';

export interface ResponseEntry {
  id: string;
  createdAt: string;

  // 3A – Identity
  fullName: string;
  titleRole: string;
  organization: string;
  respondentType: RespondentType;
  contactEmail: string;
  contactPhone: string;
  locationCity: string;
  howReceivedProposal: string;
  dateReceived: string;
  dateResponded: string;
  channelOfResponse: Channel;

  // 3B – Content
  responseSummary: string;
  verbatimQuote: string;
  bookWorthy: boolean;
  diaryDayTarget: DiaryDay | '';
  sentiment: Sentiment;
  keyQuestion: string;
  specificInterestArea: string;

  // 3C – Action
  assignedTo: AssignedTo;
  nextAction: NextAction;
  nextActionDueDate: string;
  followUpPacketSent: boolean;
  meetingScheduled: boolean;
  meetingDate: string;
  status: Status;
  notes: string;
}
