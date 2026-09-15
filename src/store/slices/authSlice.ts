// src/store/slices/authSlice.ts
//
// Redux slice for authentication.
//
//   - Two-step OTP login: request a code, verify it, receive tokens.
//   - Refresh: exchange the HttpOnly refresh cookie for a new access
//     token and hydrate `user` via GET /auth/me.
//   - Create user (admin-only).
//   - Logout: clears client state. When /auth/logout lands on the
//     server, the thunk below should also call it so the refresh
//     cookie is cleared — see the TODO on `logoutUser`.
//
// Design notes:
//   - The refresh thunk does not inspect the current route. Whether to
//     refresh is the caller's decision (typically a top-level effect
//     that only runs on protected routes). Keeping that decision in
//     one place avoids the two-source-of-truth bug where the caller
//     and the thunk disagree about whether a refresh should happen.
//   - On refresh failure the slice clears `user` and `accessToken`
//     and marks initialization complete. The route guard then sends
//     the user to /login. The error message is intentionally NOT
//     stored on `state.error` — a failed background refresh is not a
//     user-facing error condition, and a stale message from a prior
//     request would be misleading.
//   - There are two refresh call sites in the app: this thunk (for
//     the app-mount check that hydrates `user`) and the axios response
//     interceptor in api.ts (for retrying a specific request that
//     received a 401). They overlap in what they do but have different
//     responsibilities. Don't merge them without understanding both.

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

/** True if the user is super_admin. */
export const isSuperAdmin = (user: UserMetadata | null): boolean =>
  user?.role === 'super_admin';

/** True if the user is admin (admin OR super_admin). */
export const isAdmin = (user: UserMetadata | null): boolean =>
  user?.role === 'admin' || user?.role === 'super_admin';

/** True if user's role is at or above minRole. */
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
// The refresh token is delivered as an HttpOnly cookie by the server;
// we only persist `user` and `accessToken` in Redux.
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
//
// The thunk does not inspect the current route. The caller decides
// whether to dispatch it; public pages that don't need a session
// simply don't call it. This removes the previous behavior where the
// thunk read `window.location.pathname` and could disagree with its
// own caller about whether a refresh was appropriate.
//
// On failure the slice clears `user` and `accessToken`, and the route
// guard sends the user to /login.
export const refreshAccessToken = createAsyncThunk(
  'auth/refreshAccessToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/auth/refresh');
      const { accessToken } = response.data.data as { accessToken: string };

      const meResponse = await axiosClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      // meHandler sends `sendResponse(res, 200, user)` → { status, message, data: <user> }
      const user = meResponse.data.data as UserMetadata;

      return { accessToken, user };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Logout — clears client state only.
//
// TODO: once POST /auth/logout exists on the server, uncomment the
// call below. Without it the HttpOnly refresh cookie survives logout,
// and the next app-mount refresh silently re-authenticates the user.
// The server handler is:
//
//   export const logoutHandler = catchAsync(async (_req, res) => {
//     res.clearCookie('refreshToken', {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
//     });
//     sendResponse(res, 200, null, 'Logged out');
//   });
//
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // await axiosClient.post('/auth/logout');   // ← uncomment when the route lands
      return null;
    } catch (error) {
      // Even if the server call fails, the client clears local state.
      // A failed logout request should not leave the user "logged in"
      // on the client. The catch is here to satisfy the thunk's
      // contract; the rejected branch of the slice does the same clear.
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// POST /auth/register (admin-only)
// body: { pjNumber, fullName, email, phone?, station, designation, role }
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
      //
      // Pending: mark initialization in progress so the route guard can
      // show a spinner instead of flashing the login page.
      //
      // Fulfilled: store the new token and hydrate `user`. Mark
      // initialization complete regardless of outcome.
      //
      // Rejected: clear the session and mark initialization complete so
      // the guard can render /login. The error payload is discarded on
      // purpose; a failed background refresh is not a user-facing error.
      .addCase(refreshAccessToken.pending,   (state) => {
        state.isInitializing = true;
      })
      .addCase(refreshAccessToken.fulfilled, (state, action: PayloadAction<{ accessToken: string; user: UserMetadata }>) => {
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
      //
      // Both branches clear the same client state. The distinction is
      // only useful once /auth/logout exists and can fail; for now the
      // fulfilled path is the normal one and the rejected path is
      // defensive.
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