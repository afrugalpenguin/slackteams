// Microsoft Graph API types for Teams

export interface User {
  id: string;
  displayName: string;
  mail?: string;
  userPrincipalName: string;
  givenName?: string;
  surname?: string;
  jobTitle?: string;
  photo?: string;
}

export interface Team {
  id: string;
  displayName: string;
  description?: string;
  isArchived?: boolean;
}

export interface Channel {
  id: string;
  displayName: string;
  description?: string;
  membershipType?: 'standard' | 'private' | 'shared';
  webUrl?: string;
}

export interface ChatMessage {
  id: string;
  createdDateTime: string;
  lastModifiedDateTime?: string;
  body: {
    content: string;
    contentType: 'text' | 'html';
  };
  from?: {
    user?: {
      id: string;
      displayName: string;
    };
  };
  attachments?: Attachment[];
  reactions?: Reaction[];
  replyToId?: string;
  replies?: ChatMessage[];
}

export interface Attachment {
  id: string;
  contentType: string;
  contentUrl?: string;
  name?: string;
  thumbnailUrl?: string;
}

export interface Reaction {
  reactionType: string;
  user: {
    id: string;
    displayName: string;
  };
}

export interface Chat {
  id: string;
  chatType: 'oneOnOne' | 'group' | 'meeting';
  topic?: string;
  lastUpdatedDateTime: string;
  members?: ChatMember[];
}

export interface ChatMember {
  id: string;
  displayName: string;
  userId: string;
  email?: string;
}

export type PresenceStatus = 'Available' | 'Away' | 'BeRightBack' | 'Busy' | 'DoNotDisturb' | 'Offline' | 'PresenceUnknown';

export interface Presence {
  id: string;
  availability: PresenceStatus;
  activity: string;
}

// App-specific types
export interface TeamWithChannels extends Team {
  channels: Channel[];
  isExpanded: boolean;
}

export interface UnreadCount {
  channelId: string;
  count: number;
}
