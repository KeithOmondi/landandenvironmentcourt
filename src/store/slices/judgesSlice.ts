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
// Authorization is enforced by the backend, not here. Both admins and
// super admins dispatch the same thunks; the server decides who may
// act on which record. The UI renders buttons the caller is allowed
// to use, but the slice doesn't gate anything.
//
// Image handling:
//   - Portraits are uploaded through the admin panel as part of the
//     create/update request. The route uses multer on the server; the
//     slice sends multipart/form-data.
//   - The image is NOT part of the `payload` JSON. It travels as a
//     sibling `image` field in the FormData.
//   - On update, omitting the image means "leave the existing portrait
//     alone" (the server treats a missing file as `undefined`).
//   - There is no client-side "clear portrait" action yet. The server
//     supports it via `updateJudge(..., null)`; no HTTP route exposes
//     it. When the route lands, add a `clearJudgeImage` thunk below
//     the `updateJudge` thunk — see the comment there.
//
// All HTTP lives in THIS file via `axiosClient` from `src/api/api.ts`.
// This slice only coordinates loading flags, stores results, and
// surfaces errors.
//
// Route prefix: app.use('/api/v1/judges', judgesRoutes)
//   GET    /api/v1/judges
//   GET    /api/v1/judges/:judgeId
//   GET    /api/v1/judges/admin/all
//   GET    /api/v1/judges/admin/pending
//   GET    /api/v1/judges/admin/:judgeId
//   POST   /api/v1/judges/admin                      (multipart)
//   PATCH  /api/v1/judges/admin/:judgeId             (multipart)
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

/**
 * A Cloudinary image reference. Mirrors `ImageAsset` on the backend.
 *
 * Both fields are always present together — the server enforces this
 * with a database CHECK constraint (`chk_judges_image_pairing`) and
 * throws on any read that would produce a partial row. The frontend
 * can rely on `{ publicId, url }` being either complete or `null`.
 */
export interface ImageAsset {
  publicId: string;
  url: string;
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
  image: ImageAsset | null;
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

/**
 * Editable shape sent to the server. The image is NOT here — it's a
 * separate `File` argument on create/update, because it can't travel
 * as JSON inside a multipart request.
 */
export interface JudgeInput {
  name: string;
  title: string;
  station: string;
  region: JudgeRegion;
  appointedYear: string;
  bio: string;
  education: EducationEntry[];
  specializations: string[];
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
  image: ImageAsset | null;
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

/**
 * Project a full `Judge` down to the `JudgeSummary` shape held in
 * `adminItems` and `pendingItems`.
 *
 * Every mutation thunk (`update`, `submit`, `approve`, `reject`)
 * returns the full record. The list state holds summaries. Rather than
 * merge field-by-field at each callsite, project once here.
 *
 * TypeScript enforces completeness: `JudgeSummary` has no optional
 * fields, so if a field is added to the type and not to this function,
 * the return type doesn't match and the build fails. That's the point
 * — a silent omission is the bug we're protecting against.
 */
const toSummary = (judge: Judge): JudgeSummary => ({
  id:              judge.id,
  name:            judge.name,
  title:           judge.title,
  station:         judge.station,
  region:          judge.region,
  appointedYear:   judge.appointedYear,
  bio:             judge.bio,
  education:       judge.education,
  specializations: judge.specializations,
  image:           judge.image,
  status:          judge.status,
  publishedAt:     judge.publishedAt,
  createdAt:       judge.createdAt,
  updatedAt:       judge.updatedAt,
});

/**
 * Replace one item in a list by id, or append it if not present.
 * Used by mutation reducers to keep list state in sync without a
 * refetch.
 */
const replaceOrAppend = (
  list: JudgeSummary[],
  next: JudgeSummary,
): JudgeSummary[] => {
  const index = list.findIndex((item) => item.id === next.id);
  if (index === -1) return [...list, next];
  const copy = list.slice();
  copy[index] = next;
  return copy;
};

/**
 * Build the multipart body for create/update.
 *
 * - `payload` is serialized to a JSON string. The server parses it
 *   back into an object before validation. This is necessary because
 *   multipart fields are flat strings — a nested object can't travel
 *   as-is.
 * - `image` is appended only when a File is provided. Omitting it
 *   means "no image change" on the server.
 *
 * Do NOT set `Content-Type` manually on the axios call. The browser
 * must inject the multipart boundary; overriding the header strips it
 * and the server rejects the request with "Boundary not found". The
 * axios instance in `api.ts` deliberately has no default
 * Content-Type for exactly this reason.
 */
const buildJudgeFormData = (
  payload: Partial<JudgeInput>,
  image?: File | null,
): FormData => {
  const form = new FormData();
  form.append('payload', JSON.stringify(payload));
  if (image) {
    form.append('image', image);
  }
  return form;
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
  async (
    args: { payload: JudgeInput; image?: File | null },
    { rejectWithValue },
  ) => {
    try {
      // Route expects multipart/form-data: { payload: JSON string, image?: File }
      const form = buildJudgeFormData(args.payload, args.image);
      const response = await axiosClient.post<ApiEnvelope<Judge>>(
        `${JUDGES_BASE}/admin`,
        form,
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
    args: {
      judgeId: string;
      payload: Partial<JudgeInput>;
      image?: File | null;
    },
    { rejectWithValue },
  ) => {
    try {
      // Route expects multipart/form-data: { payload: JSON string, image?: File }
      // Omitting `image` means "leave the existing portrait alone".
      const form = buildJudgeFormData(args.payload, args.image);
      const response = await axiosClient.patch<ApiEnvelope<Judge>>(
        `${JUDGES_BASE}/admin/${args.judgeId}`,
        form,
      );
      return unwrap<Judge>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// clearJudgeImage — not implemented yet.
//
// The server supports clearing a portrait: `updateJudge(..., null)`
// sets both image columns to NULL and deletes the Cloudinary asset.
// What's missing is the HTTP route. When
// `DELETE /judges/admin/:judgeId/image` lands, uncomment:
//
// export const clearJudgeImage = createAsyncThunk(
//   'judges/clearJudgeImage',
//   async (judgeId: string, { rejectWithValue }) => {
//     try {
//       const response = await axiosClient.delete<ApiEnvelope<Judge>>(
//         `${JUDGES_BASE}/admin/${judgeId}/image`,
//       );
//       return unwrap<Judge>(response);
//     } catch (error) {
//       return rejectWithValue(getErrorMessage(error));
//     }
//   },
// );
//
// and add a reducer case alongside `updateJudge.fulfilled` that uses
// `toSummary(action.payload)` for `adminItems` and sets `current`.

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
      //
      // `current` is set because create is triggered from the editor.
      // The editor consumes that value, so replacing it with the server
      // response is correct. `adminItems` is not touched: the list is
      // refetched by the caller if it needs to show the new row.
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
      //
      // The editor initiated this, so `current` reflects the response.
      // `adminItems` is patched via `replaceOrAppend(toSummary(...))`
      // so the list shows the new values without a refetch, and the
      // projection is compiler-checked against `JudgeSummary`.
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
          state.adminItems = replaceOrAppend(
            state.adminItems,
            toSummary(action.payload),
          );
        },
      )
      .addCase(updateJudge.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Submit ────────────────────────────────────────────────────────────
      //
      // Submit is a row-level action, NOT an editor action. The user
      // clicks Submit on a table row; the editor may be open on a
      // different judge. Setting `current` here would silently replace
      // whatever the editor is showing with a different record.
      //
      // Only `adminItems` is updated. `isSaving` / `saveSuccess` are
      // reused because the slice has no separate flags for row actions;
      // the transient success banner is acceptable feedback.
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
          state.adminItems = replaceOrAppend(
            state.adminItems,
            toSummary(action.payload),
          );
        },
      )
      .addCase(submitJudge.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Delete ────────────────────────────────────────────────────────────
      //
      // Remove from both list states. If the deleted record is the one
      // open in the editor, clear `current` so the editor doesn't keep
      // showing a record that no longer exists.
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
          state.pendingItems = state.pendingItems.filter(
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
      //
      // Review actions are row-level. Removing from `pendingItems` is
      // correct: an approved record is no longer pending. `adminItems`
      // gets the updated summary.
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
          state.adminItems = replaceOrAppend(
            state.adminItems,
            toSummary(action.payload),
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
          state.adminItems = replaceOrAppend(
            state.adminItems,
            toSummary(action.payload),
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