export interface UserDto {
  id: string;
  email: string;
  name: string;
  isRegistered: boolean;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface ChangePasswordResult {
  id: string;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}
