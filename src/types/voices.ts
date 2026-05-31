export interface UserVoice {
  id: string;
  user_id: string;
  name: string;
  voice_ref_path: string;
  transcript: string | null;
  relation: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VoiceInvitation {
  id: string;
  user_id: string;
  relation_name: string;
  token: string;
  is_used: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
}
