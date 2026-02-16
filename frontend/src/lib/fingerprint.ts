import { nanoid } from 'nanoid';

const FINGERPRINT_KEY = 'pulsepoll_device_id';

/*
  Get or create a persistent device fingerprint.
  This is a simple implementation using localStorage + random ID.
  In a real app, you might use a library like FingerprintJS.
  
  This covers "Mechanism 1": Browser fingerprint + localStorage tracking.
*/
export function getDeviceFingerprint(): string {
  let fingerprint = localStorage.getItem(FINGERPRINT_KEY);

  if (!fingerprint) {
    // generate a new random ID if none exists
    fingerprint = nanoid(32);
    localStorage.setItem(FINGERPRINT_KEY, fingerprint);
  }

  return fingerprint;
}

/*
  Check if user has voted on a specific poll locally.
  This provides immediate UI feedback before hitting the server.
*/
export function hasVotedLocally(pollId: string): boolean {
  const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '[]');
  return votedPolls.includes(pollId);
}

/*
  Mark a poll as voted locally.
*/
export function markPollAsVoted(pollId: string): void {
  const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '[]');
  if (!votedPolls.includes(pollId)) {
    votedPolls.push(pollId);
    localStorage.setItem('voted_polls', JSON.stringify(votedPolls));
  }
}
