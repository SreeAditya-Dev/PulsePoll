export interface Poll {
  id: string;
  question: string;
  shareCode: string;
  createdAt: string;
  isActive: boolean;
}

export interface PollOption {
  id: string;
  label: string;
  position: number;
  voteCount?: number;
}

export interface PollData {
  poll: Poll;
  options: PollOption[];
  tallies: Record<string, number>;
  totalVotes: number;
  hasVoted: boolean;
}

export interface CreatePollRequest {
  question: string;
  options: string[];
  fingerprint?: string;
}

export interface CreatePollResponse {
  pollId: string;
  shareCode: string;
  createdAt: string;
}

export interface VoteResponse {
  success: boolean;
  tallies: Record<string, number>;
  totalVotes: number;
}
