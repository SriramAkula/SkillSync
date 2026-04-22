export interface UserProfile {
  id: number;
  userId: number;
  email: string;
  name: string;
  username?: string;
  bio?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  location?: string;
  skills?: string;
}

export interface AuthResponse {
  token: string;
  roles: string[];
}
