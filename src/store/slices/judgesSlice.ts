// src/store/slices/judgesSlice.ts
//
// Redux slice for the Judges feature.
//
// Responsibilities:
//   - Public reads: list published judges, read one published judge.
//   - Admin reads: list all judges, list pending, read any by id.
//   - Admin writes: create / update / submit / delete.
//   - Super admin writes: approve / reject.
//
// No upload — judge portraits are external URLs, not Cloudinary
// uploads. If that changes, mirror the News upload pattern.
//
// All HTTP lives in THIS file via `axiosClient` from `src/api/api.ts`.
// This slice only coordinates loading flags, stores results, and
// surfaces errors. It does not own authorization — the backend
// enforces that.
//
// Route prefix: app.use('/api/v1/judges', judgesRoutes)
//   GET    /api/v1/judges
//   GET    /api/v1/judges/:judgeId
//   GET    /api/v1/judges/admin/all
//   GET    /api/v1/judges/admin/pending
//   GET    /api/v1/judges/admin/:judgeId
//   POST   /api/v1/judges/admin
//   PATCH  /api/v1/judges/admin/:judgeId
//   POST   /api/v1/judges/admin/:judgeId/submit
//   DELETE /api/v1/judges/admin/:judgeId
//   POST   /api/v1/judges/admin/:judgeId/approve
//   POST   /api/v1/judges/admin/:judgeId/reject

import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { AxiosError, type AxiosResponse } from 'axios';
import type { UserRole } from './authSlice';
import axiosClient from '../../api/api';

// ─── Types ───────────────────────────────────────────────────────────────────
//
// Mirror `judges.types.ts` on the backend. If a field is added there,
// add it here too.

export type JudgeStatus = 'draft' | 'pending' | 'published' | 'rejected';

export const JUDGE_REGIONS = [
  'Nairobi',
  'Coast',
  'Rift Valley',
  'Nyanza/Western',
  'Central',
  'Eastern',
  'North Eastern',
] as const;

export type JudgeRegion = (typeof JUDGE_REGIONS)[number];

export interface EducationEntry {
  degree: string;
  institution: string;
  year?: string;
}

export interface Judge {
  id: string;
  name: string;
  title: string;
  station: string;
  region: JudgeRegion;
  appointedYear: string;
  bio: string;
  education: EducationEntry[];
  specializations: string[];
  imageUrl: string;
  status: JudgeStatus;
  publishedAt: string | null;

  createdBy: string;
  createdByRole: UserRole;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;

  createdAt: string;
  updatedAt: string;
}

export type PublicJudge = Omit<
  Judge,
  'reviewNote' | 'reviewedBy' | 'reviewedAt' | 'createdBy' | 'createdByRole'
>;

export interface JudgeInput {
  name: string;
  title: string;
  station: string;
  region: JudgeRegion;
  appointedYear: string;
  bio: string;
  education: EducationEntry[];
  specializations: string[];
  imageUrl: string;
}

export interface JudgeSummary {
  id: string;
  name: string;
  title: string;
  station: string;
  region: JudgeRegion;
  appointedYear: string;
  bio: string;
  education: EducationEntry[];
  specializations: string[];
  imageUrl: string;
  status: JudgeStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicJudgeSummary = Omit<JudgeSummary, 'status'>;

// ─── API response types ──────────────────────────────────────────────────────

export interface PaginatedJudges {
  items: PublicJudgeSummary[];
  total: number;
}

export interface ListPublishedJudgesParams {
  page?: number;
  limit?: number;
  search?: string;
  region?: JudgeRegion;
}

// Backend envelope: { status, message, data }
interface ApiEnvelope<T> {
  status: string;
  message?: string;
  data: T;
}

// ─── State ───────────────────────────────────────────────────────────────────

interface JudgesState {
  // Public list
  publicItems: PublicJudgeSummary[];
  publicTotal: number;
  isLoadingPublic: boolean;
  publicError: string | null;

  // Public single judge
  publicJudge: PublicJudge | null;
  isLoadingPublicJudge: boolean;
  publicJudgeError: string | null;

  // Admin list (all statuses)
  adminItems: JudgeSummary[];
  isLoadingAdmin: boolean;
  adminError: string | null;

  // Super admin review queue
  pendingItems: JudgeSummary[];
  isLoadingPending: boolean;
  pendingError: string | null;

  // Admin: currently-open judge record (editor)
  current: Judge | null;
  isLoadingCurrent: boolean;
  currentError: string | null;

  // Write-in-flight flags
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;

  isReviewing: boolean;
  reviewError: string | null;
  reviewSuccess: boolean;

  isDeleting: boolean;
  deleteError: string | null;
}

const initialState: JudgesState = {
  publicItems: [],
  publicTotal: 0,
  isLoadingPublic: false,
  publicError: null,

  publicJudge: null,
  isLoadingPublicJudge: false,
  publicJudgeError: null,

  adminItems: [],
  isLoadingAdmin: false,
  adminError: null,

  pendingItems: [],
  isLoadingPending: false,
  pendingError: null,

  current: null,
  isLoadingCurrent: false,
  currentError: null,

  isSaving: false,
  saveError: null,
  saveSuccess: false,

  isReviewing: false,
  reviewError: null,
  reviewSuccess: false,

  isDeleting: false,
  deleteError: null,
};

// ─── Utility ─────────────────────────────────────────────────────────────────

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<{
      message?: string;
      error?: string;
    }>;
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

const unwrap = <T>(response: AxiosResponse<ApiEnvelope<T> | T>): T => {
  const body = response.data;
  if (
    body &&
    typeof body === 'object' &&
    'data' in body &&
    'status' in body
  ) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
};

// Base path — must match `app.use('/api/v1/judges', judgesRoutes)`.
// `axiosClient` already carries the `/api/v1` prefix on its baseURL.
const JUDGES_BASE = '/judges';

// ─── Public thunks ───────────────────────────────────────────────────────────

export const fetchPublishedJudges = createAsyncThunk(
  'judges/fetchPublishedJudges',
  async (params: ListPublishedJudgesParams = {}, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<PaginatedJudges>>(
        `${JUDGES_BASE}`,
        { params },
      );
      return unwrap<PaginatedJudges>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchPublishedJudgeById = createAsyncThunk(
  'judges/fetchPublishedJudgeById',
  async (judgeId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<PublicJudge>>(
        `${JUDGES_BASE}/${judgeId}`,
      );
      return unwrap<PublicJudge>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Admin read thunks ───────────────────────────────────────────────────────

export const fetchAllJudges = createAsyncThunk(
  'judges/fetchAllJudges',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<JudgeSummary[]>>(
        `${JUDGES_BASE}/admin/all`,
      );
      return unwrap<JudgeSummary[]>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchPendingJudges = createAsyncThunk(
  'judges/fetchPendingJudges',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<JudgeSummary[]>>(
        `${JUDGES_BASE}/admin/pending`,
      );
      return unwrap<JudgeSummary[]>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchJudgeById = createAsyncThunk(
  'judges/fetchJudgeById',
  async (judgeId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<Judge>>(
        `${JUDGES_BASE}/admin/${judgeId}`,
      );
      return unwrap<Judge>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Admin write thunks ──────────────────────────────────────────────────────

export const createJudge = createAsyncThunk(
  'judges/createJudge',
  async (payload: JudgeInput, { rejectWithValue }) => {
    try {
      // Route expects Body: { payload: JudgeInput }
      const response = await axiosClient.post<ApiEnvelope<Judge>>(
        `${JUDGES_BASE}/admin`,
        { payload },
      );
      return unwrap<Judge>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateJudge = createAsyncThunk(
  'judges/updateJudge',
  async (
    args: { judgeId: string; payload: Partial<JudgeInput> },
    { rejectWithValue },
  ) => {
    try {
      // Route expects Body: { payload: Partial<JudgeInput> }
      const response = await axiosClient.patch<ApiEnvelope<Judge>>(
        `${JUDGES_BASE}/admin/${args.judgeId}`,
        { payload: args.payload },
      );
      return unwrap<Judge>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const submitJudge = createAsyncThunk(
  'judges/submitJudge',
  async (judgeId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<Judge>>(
        `${JUDGES_BASE}/admin/${judgeId}/submit`,
        {},
      );
      return unwrap<Judge>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const deleteJudge = createAsyncThunk(
  'judges/deleteJudge',
  async (judgeId: string, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`${JUDGES_BASE}/admin/${judgeId}`);
      return judgeId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Super admin review thunks ───────────────────────────────────────────────

export const approveJudge = createAsyncThunk(
  'judges/approveJudge',
  async (
    args: { judgeId: string; reviewNote?: string },
    { rejectWithValue },
  ) => {
    try {
      // Route expects Body: { reviewNote?: string }
      const response = await axiosClient.post<ApiEnvelope<Judge>>(
        `${JUDGES_BASE}/admin/${args.judgeId}/approve`,
        { reviewNote: args.reviewNote },
      );
      return unwrap<Judge>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const rejectJudge = createAsyncThunk(
  'judges/rejectJudge',
  async (
    args: { judgeId: string; reviewNote: string },
    { rejectWithValue },
  ) => {
    try {
      // Route expects Body: { reviewNote: string }
      const response = await axiosClient.post<ApiEnvelope<Judge>>(
        `${JUDGES_BASE}/admin/${args.judgeId}/reject`,
        { reviewNote: args.reviewNote },
      );
      return unwrap<Judge>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const judgesSlice = createSlice({
  name: 'judges',
  initialState,
  reducers: {
    clearPublicError: (state) => {
      state.publicError = null;
    },
    clearPublicJudge: (state) => {
      state.publicJudge = null;
      state.publicJudgeError = null;
    },
    clearAdminError: (state) => {
      state.adminError = null;
    },
    clearPendingError: (state) => {
      state.pendingError = null;
    },
    clearCurrent: (state) => {
      state.current = null;
      state.currentError = null;
      state.saveError = null;
      state.saveSuccess = false;
    },
    clearCurrentError: (state) => {
      state.currentError = null;
    },
    clearSaveState: (state) => {
      state.saveError = null;
      state.saveSuccess = false;
    },
    clearReviewState: (state) => {
      state.reviewError = null;
      state.reviewSuccess = false;
    },
    clearDeleteError: (state) => {
      state.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Public list ────────────────────────────────────────────────────────
      .addCase(fetchPublishedJudges.pending, (state) => {
        state.isLoadingPublic = true;
        state.publicError = null;
      })
      .addCase(
        fetchPublishedJudges.fulfilled,
        (state, action: PayloadAction<PaginatedJudges>) => {
          state.isLoadingPublic = false;
          state.publicItems = action.payload.items;
          state.publicTotal = action.payload.total;
        },
      )
      .addCase(fetchPublishedJudges.rejected, (state, action) => {
        state.isLoadingPublic = false;
        state.publicError = action.payload as string;
      })

      // ── Public single judge ───────────────────────────────────────────────
      .addCase(fetchPublishedJudgeById.pending, (state) => {
        state.isLoadingPublicJudge = true;
        state.publicJudgeError = null;
      })
      .addCase(
        fetchPublishedJudgeById.fulfilled,
        (state, action: PayloadAction<PublicJudge>) => {
          state.isLoadingPublicJudge = false;
          state.publicJudge = action.payload;
        },
      )
      .addCase(fetchPublishedJudgeById.rejected, (state, action) => {
        state.isLoadingPublicJudge = false;
        state.publicJudgeError = action.payload as string;
      })

      // ── Admin list ────────────────────────────────────────────────────────
      .addCase(fetchAllJudges.pending, (state) => {
        state.isLoadingAdmin = true;
        state.adminError = null;
      })
      .addCase(
        fetchAllJudges.fulfilled,
        (state, action: PayloadAction<JudgeSummary[]>) => {
          state.isLoadingAdmin = false;
          state.adminItems = action.payload;
        },
      )
      .addCase(fetchAllJudges.rejected, (state, action) => {
        state.isLoadingAdmin = false;
        state.adminError = action.payload as string;
      })

      // ── Pending queue ─────────────────────────────────────────────────────
      .addCase(fetchPendingJudges.pending, (state) => {
        state.isLoadingPending = true;
        state.pendingError = null;
      })
      .addCase(
        fetchPendingJudges.fulfilled,
        (state, action: PayloadAction<JudgeSummary[]>) => {
          state.isLoadingPending = false;
          state.pendingItems = action.payload;
        },
      )
      .addCase(fetchPendingJudges.rejected, (state, action) => {
        state.isLoadingPending = false;
        state.pendingError = action.payload as string;
      })

      // ── Admin: current judge record ───────────────────────────────────────
      .addCase(fetchJudgeById.pending, (state) => {
        state.isLoadingCurrent = true;
        state.currentError = null;
      })
      .addCase(
        fetchJudgeById.fulfilled,
        (state, action: PayloadAction<Judge>) => {
          state.isLoadingCurrent = false;
          state.current = action.payload;
        },
      )
      .addCase(fetchJudgeById.rejected, (state, action) => {
        state.isLoadingCurrent = false;
        state.currentError = action.payload as string;
      })

      // ── Create ────────────────────────────────────────────────────────────
      .addCase(createJudge.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        createJudge.fulfilled,
        (state, action: PayloadAction<Judge>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.current = action.payload;
        },
      )
      .addCase(createJudge.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Update ────────────────────────────────────────────────────────────
      .addCase(updateJudge.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        updateJudge.fulfilled,
        (state, action: PayloadAction<Judge>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.current = action.payload;
          state.adminItems = state.adminItems.map((item) =>
            item.id === action.payload.id
              ? {
                  ...item,
                  name: action.payload.name,
                  title: action.payload.title,
                  station: action.payload.station,
                  region: action.payload.region,
                  appointedYear: action.payload.appointedYear,
                  bio: action.payload.bio,
                  education: action.payload.education,
                  specializations: action.payload.specializations,
                  imageUrl: action.payload.imageUrl,
                  status: action.payload.status,
                  publishedAt: action.payload.publishedAt,
                  updatedAt: action.payload.updatedAt,
                }
              : item,
          );
        },
      )
      .addCase(updateJudge.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Submit ────────────────────────────────────────────────────────────
      .addCase(submitJudge.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        submitJudge.fulfilled,
        (state, action: PayloadAction<Judge>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.current = action.payload;
          state.adminItems = state.adminItems.map((item) =>
            item.id === action.payload.id
              ? {
                  ...item,
                  status: action.payload.status,
                  updatedAt: action.payload.updatedAt,
                }
              : item,
          );
        },
      )
      .addCase(submitJudge.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Delete ────────────────────────────────────────────────────────────
      .addCase(deleteJudge.pending, (state) => {
        state.isDeleting = true;
        state.deleteError = null;
      })
      .addCase(
        deleteJudge.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.isDeleting = false;
          state.adminItems = state.adminItems.filter(
            (item) => item.id !== action.payload,
          );
          if (state.current?.id === action.payload) {
            state.current = null;
          }
        },
      )
      .addCase(deleteJudge.rejected, (state, action) => {
        state.isDeleting = false;
        state.deleteError = action.payload as string;
      })

      // ── Approve ───────────────────────────────────────────────────────────
      .addCase(approveJudge.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(
        approveJudge.fulfilled,
        (state, action: PayloadAction<Judge>) => {
          state.isReviewing = false;
          state.reviewSuccess = true;
          state.pendingItems = state.pendingItems.filter(
            (item) => item.id !== action.payload.id,
          );
          state.adminItems = state.adminItems.map((item) =>
            item.id === action.payload.id
              ? {
                  ...item,
                  status: action.payload.status,
                  publishedAt: action.payload.publishedAt,
                  updatedAt: action.payload.updatedAt,
                }
              : item,
          );
        },
      )
      .addCase(approveJudge.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      })

      // ── Reject ────────────────────────────────────────────────────────────
      .addCase(rejectJudge.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(
        rejectJudge.fulfilled,
        (state, action: PayloadAction<Judge>) => {
          state.isReviewing = false;
          state.reviewSuccess = true;
          state.pendingItems = state.pendingItems.filter(
            (item) => item.id !== action.payload.id,
          );
          state.adminItems = state.adminItems.map((item) =>
            item.id === action.payload.id
              ? {
                  ...item,
                  status: action.payload.status,
                  updatedAt: action.payload.updatedAt,
                }
              : item,
          );
        },
      )
      .addCase(rejectJudge.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      });
  },
});

export const {
  clearPublicError,
  clearPublicJudge,
  clearAdminError,
  clearPendingError,
  clearCurrent,
  clearCurrentError,
  clearSaveState,
  clearReviewState,
  clearDeleteError,
} = judgesSlice.actions;

export default judgesSlice.reducer;