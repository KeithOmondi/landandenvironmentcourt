// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import axiosClient from '../../api/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'super_admin';

// Mirrors the backend's PublicUser (auth.types.ts) exactly.
export interface UserMetadata {
  id:          string;
  pjNumber:    string;
  fullName:    string;
  email:       string;
  phone:       string | null;
  station:     string;
  designation: string;
  role:        UserRole;
  isActive:    boolean;
  createdAt:   string;
  updatedAt:   string;
}

interface AuthState {
  user:              UserMetadata | null;
  accessToken:       string | null;
  isLoading:         boolean;
  error:             string | null;
  otpRequested:      boolean;
  isInitializing:    boolean;
  createUserSuccess: boolean;
}

const initialState: AuthState = {
  user:              null,
  accessToken:       null,
  isLoading:         false,
  error:             null,
  otpRequested:      false,
  isInitializing:    true,
  createUserSuccess: false,
};

// ─── Utility ──────────────────────────────────────────────────────────────────

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    return (
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      'Request failed'
    );
  }
  if (error instanceof Error) return error.message;
  return 'An unknown error occurred';
};

// ─── Permission helpers ───────────────────────────────────────────────────────

const ROLE_RANK: Record<UserRole, number> = {
  admin:       1,
  super_admin: 2,
};

/** True if the user is super_admin */
export const isSuperAdmin = (user: UserMetadata | null): boolean =>
  user?.role === 'super_admin';

/** True if the user is admin (admin OR super_admin) */
export const isAdmin = (user: UserMetadata | null): boolean =>
  user?.role === 'admin' || user?.role === 'super_admin';

/** True if user's role is at or above minRole */
export const hasRole = (
  user: UserMetadata | null,
  minRole: UserRole
): boolean => {
  if (!user) return false;
  return ROLE_RANK[user.role] >= ROLE_RANK[minRole];
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

// POST /auth/login/request-otp  body: { pjNumber }
export const requestOtp = createAsyncThunk(
  'auth/requestOtp',
  async (pjNumber: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/auth/login/request-otp', { pjNumber });
      return response.data.message as string;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// POST /auth/login/verify-otp  body: { pjNumber, otp }
// Response: { status, message, data: { user, accessToken, refreshToken } }
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (payload: { pjNumber: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/auth/login/verify-otp', payload);
      const { user, accessToken } = response.data.data as {
        user: UserMetadata;
        accessToken: string;
        refreshToken: string;
      };
      return { user, accessToken };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// POST /auth/refresh (cookie-based)  →  { accessToken }
// Then GET /auth/me with the new token to hydrate `user`.
export const refreshAccessToken = createAsyncThunk(
  'auth/refreshAccessToken',
  async (_, { rejectWithValue }) => {
    try {
      const publicRoutes = ['/login', '/orhc-form', '/unauthorized'];
      const isPublic = publicRoutes.some((route) =>
        window.location.pathname.startsWith(route)
      );

      if (isPublic) {
        return { accessToken: null, user: null, isPublic: true };
      }

      const response = await axiosClient.post('/auth/refresh');
      const { accessToken } = response.data.data as { accessToken: string };

      const meResponse = await axiosClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      // meHandler sends `sendResponse(res, 200, user)` → { status, message, data: <user> }
      const user = meResponse.data.data as UserMetadata;

      return { accessToken, user, isPublic: false };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// No /auth/logout on the backend yet — this clears client state only.
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      return null;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// POST /auth/register (admin-only)  body: { pjNumber, fullName, email, phone?, station, designation, role }
// Response: { status, message, data: { user } }
export interface CreateUserPayload {
  pjNumber:    string;
  fullName:    string;
  email:       string;
  phone?:      string;
  station:     string;
  designation: string;
  role:        UserRole;
}

export const createUser = createAsyncThunk(
  'auth/createUser',
  async (payload: CreateUserPayload, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/auth/register', payload);
      return response.data.data.user as UserMetadata;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    clearAuth: (state) => {
      state.user         = null;
      state.accessToken  = null;
      state.otpRequested = false;
      state.error        = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCreateUserSuccess: (state) => {
      state.createUserSuccess = false;
    },
    setInitializationComplete: (state) => {
      state.isInitializing = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Request OTP ────────────────────────────────────────────────────────
      .addCase(requestOtp.pending,   (state) => { state.isLoading = true;  state.error = null; })
      .addCase(requestOtp.fulfilled, (state) => { state.isLoading = false; state.otpRequested = true; })
      .addCase(requestOtp.rejected,  (state, action) => { state.isLoading = false; state.error = action.payload as string; })

      // ── Verify OTP ─────────────────────────────────────────────────────────
      .addCase(verifyOtp.pending,    (state) => { state.isLoading = true; state.error = null; })
      .addCase(verifyOtp.fulfilled,  (state, action: PayloadAction<{ accessToken: string; user: UserMetadata }>) => {
        state.isLoading    = false;
        state.accessToken  = action.payload.accessToken;
        state.user         = action.payload.user;
        state.otpRequested = false;
      })
      .addCase(verifyOtp.rejected,   (state, action) => { state.isLoading = false; state.error = action.payload as string; })

      // ── Refresh Token ──────────────────────────────────────────────────────
      .addCase(refreshAccessToken.pending,   (state) => { state.isInitializing = true; })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        if (action.payload?.isPublic) {
          state.isInitializing = false;
          return;
        }
        state.accessToken    = action.payload.accessToken;
        state.user           = action.payload.user;
        state.isInitializing = false;
      })
      .addCase(refreshAccessToken.rejected,  (state) => {
        state.user           = null;
        state.accessToken    = null;
        state.isInitializing = false;
      })

      // ── Logout ─────────────────────────────────────────────────────────────
      .addCase(logoutUser.pending,   (state) => { state.isLoading = true; })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user         = null;
        state.accessToken  = null;
        state.otpRequested = false;
        state.isLoading    = false;
      })
      .addCase(logoutUser.rejected,  (state) => {
        state.user         = null;
        state.accessToken  = null;
        state.otpRequested = false;
        state.isLoading    = false;
      })

      // ── Create User ────────────────────────────────────────────────────────
      .addCase(createUser.pending,   (state) => { state.isLoading = true;  state.error = null; state.createUserSuccess = false; })
      .addCase(createUser.fulfilled, (state) => { state.isLoading = false; state.createUserSuccess = true; })
      .addCase(createUser.rejected,  (state, action) => { state.isLoading = false; state.error = action.payload as string; state.createUserSuccess = false; });
  },
});

export const {
  setAccessToken,
  clearAuth,
  clearError,
  clearCreateUserSuccess,
  setInitializationComplete,
} = authSlice.actions;

export default authSlice.reducer;