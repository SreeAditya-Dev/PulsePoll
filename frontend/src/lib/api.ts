import type { CreatePollRequest, CreatePollResponse, PollData, VoteResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api/v1`;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  
  if (!response.ok) {
    throw new ApiError(response.status, data.message || data.error || 'Something went wrong');
  }
  
  return data as T;
}

export const api = {
  async createPoll(data: CreatePollRequest): Promise<CreatePollResponse> {
    const response = await fetch(`${API_BASE_URL}/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<CreatePollResponse>(response);
  },

  async getPoll(shareCode: string, fingerprint?: string): Promise<PollData> {
    const url = new URL(`${API_BASE_URL}/polls/${shareCode}`);
    if (fingerprint) {
      url.searchParams.append('fingerprint', fingerprint);
    }
    
    const response = await fetch(url.toString(), {
      credentials: 'include',
    });
    return handleResponse<PollData>(response);
  },

  async vote(shareCode: string, optionId: string, fingerprint: string): Promise<VoteResponse> {
    const response = await fetch(`${API_BASE_URL}/polls/${shareCode}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ optionId, fingerprint }),
    });
    return handleResponse<VoteResponse>(response);
  }
};
