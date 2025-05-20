import axios from "./client";
import { UserRegisterDTO, UserLoginDTO } from '@/interface/auth-interface';

export const registerRequest = async (user: UserRegisterDTO) => {
  return axios.post(`/auth/signup`, user);
};

export const loginRequest = async (user: UserLoginDTO) => {
  return axios.post(`auth/signin`, user, {
    withCredentials: true,
  });
};
