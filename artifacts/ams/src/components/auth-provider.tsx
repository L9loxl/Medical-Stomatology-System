import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@workspace/api-client-react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  profilePhoto: string | null;
  setProfilePhoto: (photo: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profilePhoto, setProfilePhotoState] = useState<string | null>(() => {
    return localStorage.getItem("ams-profile-photo");
  });
  const queryClient = useQueryClient();

  const { data: userData, isSuccess, isError, isFetching } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });

  useEffect(() => {
    if (isSuccess && userData) {
      setUser(userData);
      setIsAuthenticated(true);
    } else if (isError) {
      setUser(null);
      setIsAuthenticated(false);
    }
    if (!isFetching) {
      setIsLoading(false);
    }
  }, [userData, isSuccess, isError, isFetching]);

  const setProfilePhoto = (photo: string | null) => {
    if (photo) {
      localStorage.setItem("ams-profile-photo", photo);
    } else {
      localStorage.removeItem("ams-profile-photo");
    }
    setProfilePhotoState(photo);
  };

  const handleLogin = (newUser: User, token: string) => {
    localStorage.setItem("token", token);
    setUser(newUser);
    setIsAuthenticated(true);
    queryClient.setQueryData(getGetMeQueryKey(), newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    queryClient.setQueryData(getGetMeQueryKey(), null);
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isLoading, profilePhoto, setProfilePhoto,
      login: handleLogin, logout: handleLogout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
