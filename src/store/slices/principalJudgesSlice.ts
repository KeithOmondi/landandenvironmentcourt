// src/store/slices/principalJudgesSlice.ts
//
// Redux slice for the Principal Judge feature.
//
// Responsibilities:
//   - Public reads:   the combined OfficePJ view (current + previous),
//                     a paginated list, and a single published record.
//   - Admin reads:    list all records (any status), list the pending
//                     review queue, read any by id.
//   - Admin writes:   create, update, submit, delete.
//   - Super admin:    approve, reject.
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
//   - There is no client-side "clear portrait" action. The server
//     supports it via `updatePrincipalJudge(..., null)`; no HTTP route
//     exposes it. When the route lands, add a `clearPrincipalJudgeImage`
//     thunk alongside `updatePrincipalJudge`.
//
// All HTTP lives in THIS file via `axiosClient` from `src/api/api.ts`.
// This slice only coordinates loading flags, stores results, and
// surfaces errors.
//
// Route prefix: app.use('/api/v1/principal-judges', principalJudgesRoutes)
//   GET    /api/v1/principal-judges/public
//   GET    /api/v1/principal-judges
//   GET    /api/v1/principal-judges/:id
//   GET    /api/v1/principal-judges/admin/all
//   GET    /api/v1/principal-judges/admin/pending
//   GET    /api/v1/principal-judges/admin/:id
//   POST   /api/v1/principal-judges/admin                    (multipart)
//   PATCH  /api/v1/principal-judges/admin/:id                (multipart)
//   POST   /api/v1/principal-judges/admin/:id/submit
//   DELETE /api/v1/principal-judges/admin/:id
//   POST   /api/v1/principal-judges/admin/:id/approve
//   POST   /api/v1/principal-judges/admin/:id/reject

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
// Mirror `principalJudges.types.ts` on the backend. If a field is added
// there, add it here too.

export type PrincipalJudgeStatus =
  | 'draft'
  | 'pending'
  | 'published'
  | 'rejected';

/**
 * A Cloudinary image reference. Mirrors `ImageAsset` on the backend.
 *
 * Both fields are always present together — the server enforces this
 * with a database CHECK constraint and throws on any read that would
 * produce a partial row. The frontend can rely on `{ publicId, url }`
 * being either complete or `null`.
 */
export interface ImageAsset {
  publicId: string;
  url: string;
}

export interface PrincipalJudge {
  id: string;
  name: string;
  tenure: string;
  station: string | null;
  shortBio: string;
  fullBio: string;
  keyContributions: string[];
  image: ImageAsset | null;
  isCurrent: boolean;
  status: PrincipalJudgeStatus;
  publishedAt: string | null;

  createdBy: string;
  createdByRole: UserRole;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;

  createdAt: string;
  updatedAt: string;
}

export type PublicPrincipalJudge = Omit<
  PrincipalJudge,
  | 'reviewNote'
  | 'reviewedBy'
  | 'reviewedAt'
  | 'createdBy'
  | 'createdByRole'
>;

/**
 * Editable shape sent to the server. The image is NOT here — it's a
 * separate `File` argument on create/update, because it can't travel
 * as JSON inside a multipart request.
 */
export interface PrincipalJudgeInput {
  name: string;
  tenure: string;
  station: string | null;
  shortBio: string;
  fullBio: string;
  keyContributions: string[];
  isCurrent: boolean;
}

// ─── API response types ──────────────────────────────────────────────────────

/** The combined view the OfficePJ page consumes. */
export interface PublicPrincipalJudgeView {
  current: PublicPrincipalJudge | null;
  previous: PublicPrincipalJudge[];
}

export interface PaginatedPrincipalJudges {
  items: PublicPrincipalJudge[];
  total: number;
}

export interface ListPublishedPrincipalJudgesParams {
  isCurrent?: boolean;
  page?: number;
  limit?: number;
}

// Backend envelope: { status, message, data }
interface ApiEnvelope<T> {
  status: string;
  message?: string;
  data: T;
}

// ─── State ───────────────────────────────────────────────────────────────────

interface PrincipalJudgesState {
  // Public combined view (OfficePJ page)
  publicView: PublicPrincipalJudgeView | null;
  isLoadingPublicView: boolean;
  publicViewError: string | null;

  // Public paginated list (optional, if a page ever needs it)
  publicItems: PublicPrincipalJudge[];
  publicTotal: number;
  isLoadingPublic: boolean;
  publicError: string | null;

  // Public single record
  publicJudge: PublicPrincipalJudge | null;
  isLoadingPublicJudge: boolean;
  publicJudgeError: string | null;

  // Admin list (all statuses)
  adminItems: PrincipalJudge[];
  isLoadingAdmin: boolean;
  adminError: string | null;

  // Super admin review queue
  pendingItems: PrincipalJudge[];
  isLoadingPending: boolean;
  pendingError: string | null;

  // Admin: currently-open record (editor)
  current: PrincipalJudge | null;
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

const initialState: PrincipalJudgesState = {
  publicView: null,
  isLoadingPublicView: false,
  publicViewError: null,

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
const buildPrincipalJudgeFormData = (
  payload: Partial<PrincipalJudgeInput>,
  image?: File | null,
): FormData => {
  const form = new FormData();
  form.append('payload', JSON.stringify(payload));
  if (image) {
    form.append('image', image);
  }
  return form;
};

// Base path — must match `app.use('/api/v1/principal-judges', ...)`.
// `axiosClient` already carries the `/api/v1` prefix on its baseURL.
const BASE = '/principal-judges';

// ─── Public thunks ───────────────────────────────────────────────────────────

/**
 * Fetch the combined OfficePJ view: the current Principal Judge and
 * the list of predecessors, in one payload.
 *
 * This is the primary public read for the page. There's no pagination
 * because the set is tiny — at most a dozen records over the lifetime
 * of the court.
 */
export const fetchPublicPrincipalJudgeView = createAsyncThunk(
  'principalJudges/fetchPublicPrincipalJudgeView',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<
        ApiEnvelope<PublicPrincipalJudgeView>
      >(`${BASE}/public`);
      return unwrap<PublicPrincipalJudgeView>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Fetch a paginated list of published Principal Judges. Not used by
 * the OfficePJ page today (it uses the combined view), but available
 * for future pages that need pagination or an isCurrent filter.
 */
export const fetchPublishedPrincipalJudges = createAsyncThunk(
  'principalJudges/fetchPublishedPrincipalJudges',
  async (
    params: ListPublishedPrincipalJudgesParams = {},
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosClient.get<
        ApiEnvelope<PaginatedPrincipalJudges>
      >(`${BASE}`, { params });
      return unwrap<PaginatedPrincipalJudges>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchPublishedPrincipalJudgeById = createAsyncThunk(
  'principalJudges/fetchPublishedPrincipalJudgeById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<PublicPrincipalJudge>>(
        `${BASE}/${id}`,
      );
      return unwrap<PublicPrincipalJudge>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Admin read thunks ───────────────────────────────────────────────────────

export const fetchAllPrincipalJudges = createAsyncThunk(
  'principalJudges/fetchAllPrincipalJudges',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<PrincipalJudge[]>>(
        `${BASE}/admin/all`,
      );
      return unwrap<PrincipalJudge[]>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchPendingPrincipalJudges = createAsyncThunk(
  'principalJudges/fetchPendingPrincipalJudges',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<PrincipalJudge[]>>(
        `${BASE}/admin/pending`,
      );
      return unwrap<PrincipalJudge[]>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchPrincipalJudgeById = createAsyncThunk(
  'principalJudges/fetchPrincipalJudgeById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<PrincipalJudge>>(
        `${BASE}/admin/${id}`,
      );
      return unwrap<PrincipalJudge>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Admin write thunks ──────────────────────────────────────────────────────

export const createPrincipalJudge = createAsyncThunk(
  'principalJudges/createPrincipalJudge',
  async (
    args: { payload: PrincipalJudgeInput; image?: File | null },
    { rejectWithValue },
  ) => {
    try {
      // Route expects multipart/form-data:
      //   { payload: JSON string, image?: File }
      const form = buildPrincipalJudgeFormData(args.payload, args.image);
      const response = await axiosClient.post<ApiEnvelope<PrincipalJudge>>(
        `${BASE}/admin`,
        form,
      );
      return unwrap<PrincipalJudge>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updatePrincipalJudge = createAsyncThunk(
  'principalJudges/updatePrincipalJudge',
  async (
    args: {
      id: string;
      payload: Partial<PrincipalJudgeInput>;
      image?: File | null;
    },
    { rejectWithValue },
  ) => {
    try {
      // Route expects multipart/form-data:
      //   { payload: JSON string, image?: File }
      // Omitting `image` means "leave the existing portrait alone".
      const form = buildPrincipalJudgeFormData(args.payload, args.image);
      const response = await axiosClient.patch<ApiEnvelope<PrincipalJudge>>(
        `${BASE}/admin/${args.id}`,
        form,
      );
      return unwrap<PrincipalJudge>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// clearPrincipalJudgeImage — not implemented yet.
//
// The server supports clearing a portrait: `updatePrincipalJudge(...,
// null)` sets both image columns to NULL and deletes the Cloudinary
// asset. What's missing is the HTTP route. When
// `DELETE /principal-judges/admin/:id/image` lands, uncomment:
//
// export const clearPrincipalJudgeImage = createAsyncThunk(
//   'principalJudges/clearPrincipalJudgeImage',
//   async (id: string, { rejectWithValue }) => {
//     try {
//       const response = await axiosClient.delete<ApiEnvelope<PrincipalJudge>>(
//         `${BASE}/admin/${id}/image`,
//       );
//       return unwrap<PrincipalJudge>(response);
//     } catch (error) {
//       return rejectWithValue(getErrorMessage(error));
//     }
//   },
// );
//
// and add a reducer case alongside `updatePrincipalJudge.fulfilled`.

export const submitPrincipalJudge = createAsyncThunk(
  'principalJudges/submitPrincipalJudge',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<PrincipalJudge>>(
        `${BASE}/admin/${id}/submit`,
        {},
      );
      return unwrap<PrincipalJudge>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const deletePrincipalJudge = createAsyncThunk(
  'principalJudges/deletePrincipalJudge',
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`${BASE}/admin/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Super admin review thunks ───────────────────────────────────────────────

export const approvePrincipalJudge = createAsyncThunk(
  'principalJudges/approvePrincipalJudge',
  async (
    args: { id: string; reviewNote?: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<PrincipalJudge>>(
        `${BASE}/admin/${args.id}/approve`,
        { reviewNote: args.reviewNote },
      );
      return unwrap<PrincipalJudge>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const rejectPrincipalJudge = createAsyncThunk(
  'principalJudges/rejectPrincipalJudge',
  async (
    args: { id: string; reviewNote: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<PrincipalJudge>>(
        `${BASE}/admin/${args.id}/reject`,
        { reviewNote: args.reviewNote },
      );
      return unwrap<PrincipalJudge>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const principalJudgesSlice = createSlice({
  name: 'principalJudges',
  initialState,
  reducers: {
    clearPublicViewError: (state) => {
      state.publicViewError = null;
    },
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
      // ── Public combined view ──────────────────────────────────────────────
      .addCase(fetchPublicPrincipalJudgeView.pending, (state) => {
        state.isLoadingPublicView = true;
        state.publicViewError = null;
      })
      .addCase(
        fetchPublicPrincipalJudgeView.fulfilled,
        (state, action: PayloadAction<PublicPrincipalJudgeView>) => {
          state.isLoadingPublicView = false;
          state.publicView = action.payload;
        },
      )
      .addCase(fetchPublicPrincipalJudgeView.rejected, (state, action) => {
        state.isLoadingPublicView = false;
        state.publicViewError = action.payload as string;
      })

      // ── Public paginated list ─────────────────────────────────────────────
      .addCase(fetchPublishedPrincipalJudges.pending, (state) => {
        state.isLoadingPublic = true;
        state.publicError = null;
      })
      .addCase(
        fetchPublishedPrincipalJudges.fulfilled,
        (state, action: PayloadAction<PaginatedPrincipalJudges>) => {
          state.isLoadingPublic = false;
          state.publicItems = action.payload.items;
          state.publicTotal = action.payload.total;
        },
      )
      .addCase(fetchPublishedPrincipalJudges.rejected, (state, action) => {
        state.isLoadingPublic = false;
        state.publicError = action.payload as string;
      })

      // ── Public single record ──────────────────────────────────────────────
      .addCase(fetchPublishedPrincipalJudgeById.pending, (state) => {
        state.isLoadingPublicJudge = true;
        state.publicJudgeError = null;
      })
      .addCase(
        fetchPublishedPrincipalJudgeById.fulfilled,
        (state, action: PayloadAction<PublicPrincipalJudge>) => {
          state.isLoadingPublicJudge = false;
          state.publicJudge = action.payload;
        },
      )
      .addCase(fetchPublishedPrincipalJudgeById.rejected, (state, action) => {
        state.isLoadingPublicJudge = false;
        state.publicJudgeError = action.payload as string;
      })

      // ── Admin list ────────────────────────────────────────────────────────
      .addCase(fetchAllPrincipalJudges.pending, (state) => {
        state.isLoadingAdmin = true;
        state.adminError = null;
      })
      .addCase(
        fetchAllPrincipalJudges.fulfilled,
        (state, action: PayloadAction<PrincipalJudge[]>) => {
          state.isLoadingAdmin = false;
          state.adminItems = action.payload;
        },
      )
      .addCase(fetchAllPrincipalJudges.rejected, (state, action) => {
        state.isLoadingAdmin = false;
        state.adminError = action.payload as string;
      })

      // ── Pending queue ─────────────────────────────────────────────────────
      .addCase(fetchPendingPrincipalJudges.pending, (state) => {
        state.isLoadingPending = true;
        state.pendingError = null;
      })
      .addCase(
        fetchPendingPrincipalJudges.fulfilled,
        (state, action: PayloadAction<PrincipalJudge[]>) => {
          state.isLoadingPending = false;
          state.pendingItems = action.payload;
        },
      )
      .addCase(fetchPendingPrincipalJudges.rejected, (state, action) => {
        state.isLoadingPending = false;
        state.pendingError = action.payload as string;
      })

      // ── Admin: current record (editor) ────────────────────────────────────
      .addCase(fetchPrincipalJudgeById.pending, (state) => {
        state.isLoadingCurrent = true;
        state.currentError = null;
      })
      .addCase(
        fetchPrincipalJudgeById.fulfilled,
        (state, action: PayloadAction<PrincipalJudge>) => {
          state.isLoadingCurrent = false;
          state.current = action.payload;
        },
      )
      .addCase(fetchPrincipalJudgeById.rejected, (state, action) => {
        state.isLoadingCurrent = false;
        state.currentError = action.payload as string;
      })

      // ── Create ────────────────────────────────────────────────────────────
      //
      // `current` is set because create is triggered from the editor.
      // The editor consumes that value, so replacing it with the server
      // response is correct. `adminItems` is left to the caller's
      // refetch — new records don't automatically belong to the currently
      // displayed page.
      .addCase(createPrincipalJudge.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        createPrincipalJudge.fulfilled,
        (state, action: PayloadAction<PrincipalJudge>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.current = action.payload;
        },
      )
      .addCase(createPrincipalJudge.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Update ────────────────────────────────────────────────────────────
      //
      // The editor initiated this, so `current` reflects the response.
      // `adminItems` is patched in place so the list shows the new
      // values without a refetch. If the record isn't in the list yet
      // (uncommon — the list is not paginated), it's left alone.
      .addCase(updatePrincipalJudge.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        updatePrincipalJudge.fulfilled,
        (state, action: PayloadAction<PrincipalJudge>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.current = action.payload;
          state.adminItems = state.adminItems.map((item) =>
            item.id === action.payload.id ? action.payload : item,
          );
        },
      )
      .addCase(updatePrincipalJudge.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Submit ────────────────────────────────────────────────────────────
      //
      // Submit is a row-level action, not an editor action. The user
      // clicks Submit on a table row; the editor may be open on a
      // different record. Setting `current` here would silently replace
      // whatever the editor is showing with a different record.
      .addCase(submitPrincipalJudge.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        submitPrincipalJudge.fulfilled,
        (state, action: PayloadAction<PrincipalJudge>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.adminItems = state.adminItems.map((item) =>
            item.id === action.payload.id ? action.payload : item,
          );
        },
      )
      .addCase(submitPrincipalJudge.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Delete ────────────────────────────────────────────────────────────
      .addCase(deletePrincipalJudge.pending, (state) => {
        state.isDeleting = true;
        state.deleteError = null;
      })
      .addCase(
        deletePrincipalJudge.fulfilled,
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
      .addCase(deletePrincipalJudge.rejected, (state, action) => {
        state.isDeleting = false;
        state.deleteError = action.payload as string;
      })

      // ── Approve ───────────────────────────────────────────────────────────
      //
      // Review actions are row-level. Removing from `pendingItems` is
      // correct: an approved record is no longer pending. `adminItems`
      // gets the updated record. `isCurrent` may have flipped on
      // another row — the slice can't know which, so the caller should
      // refetch the list after an approve that changes the current.
      .addCase(approvePrincipalJudge.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(
        approvePrincipalJudge.fulfilled,
        (state, action: PayloadAction<PrincipalJudge>) => {
          state.isReviewing = false;
          state.reviewSuccess = true;
          state.pendingItems = state.pendingItems.filter(
            (item) => item.id !== action.payload.id,
          );
          state.adminItems = state.adminItems.map((item) =>
            item.id === action.payload.id ? action.payload : item,
          );
        },
      )
      .addCase(approvePrincipalJudge.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      })

      // ── Reject ────────────────────────────────────────────────────────────
      .addCase(rejectPrincipalJudge.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(
        rejectPrincipalJudge.fulfilled,
        (state, action: PayloadAction<PrincipalJudge>) => {
          state.isReviewing = false;
          state.reviewSuccess = true;
          state.pendingItems = state.pendingItems.filter(
            (item) => item.id !== action.payload.id,
          );
          state.adminItems = state.adminItems.map((item) =>
            item.id === action.payload.id ? action.payload : item,
          );
        },
      )
      .addCase(rejectPrincipalJudge.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      });
  },
});

export const {
  clearPublicViewError,
  clearPublicError,
  clearPublicJudge,
  clearAdminError,
  clearPendingError,
  clearCurrent,
  clearCurrentError,
  clearSaveState,
  clearReviewState,
  clearDeleteError,
} = principalJudgesSlice.actions;

export default principalJudgesSlice.reducer;