// src/store/slices/publicationsSlice.ts
//
// Redux slice for the Publications feature.
//
// Responsibilities:
//   - Public reads: list published publications, read one published
//     publication (including preview pages).
//   - Admin reads: list all publications, list pending, read any by id.
//   - Admin writes: create / update / submit / delete.
//   - Super admin writes: approve / reject.
//   - Upload: publication PDFs (Cloudinary via the backend).
//
// All HTTP lives in THIS file via `axiosClient` from `src/api/api.ts`.
// This slice only coordinates loading flags, stores results, and
// surfaces errors. It does not own authorization — the backend
// enforces that.
//
// Route prefix: app.use('/api/v1/publications', publicationsRoutes)
//   GET    /api/v1/publications
//   GET    /api/v1/publications/:publicationId
//   POST   /api/v1/publications/admin/upload/file
//   GET    /api/v1/publications/admin/all
//   GET    /api/v1/publications/admin/pending
//   GET    /api/v1/publications/admin/:publicationId
//   POST   /api/v1/publications/admin
//   PATCH  /api/v1/publications/admin/:publicationId
//   POST   /api/v1/publications/admin/:publicationId/submit
//   DELETE /api/v1/publications/admin/:publicationId
//   POST   /api/v1/publications/admin/:publicationId/approve
//   POST   /api/v1/publications/admin/:publicationId/reject

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
// Mirror `publications.types.ts` on the backend. If a field is added
// there, add it here too.

export type PublicationStatus =
  | 'draft'
  | 'pending'
  | 'published'
  | 'rejected';

export const PUBLICATION_CATEGORIES = [
  'Practice Directions',
  'Guidelines & Manuals',
  'Reports',
  'Court Rules',
] as const;

export type PublicationCategory = (typeof PUBLICATION_CATEGORIES)[number];

export interface PublicationPage {
  pageNumber: number;
  title: string;
  content: string;
}

export interface Publication {
  id: string;
  title: string;
  description: string;
  category: PublicationCategory;
  year: string;

  fileSize: string;
  fileUrl: string;
  filePublicId: string;
  fileBytes: number;

  pages: PublicationPage[];

  status: PublicationStatus;
  publishedAt: string | null;

  createdBy: string;
  createdByRole: UserRole;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;

  createdAt: string;
  updatedAt: string;
}

export type PublicPublication = Omit<
  Publication,
  | 'reviewNote'
  | 'reviewedBy'
  | 'reviewedAt'
  | 'createdBy'
  | 'createdByRole'
  | 'filePublicId'
>;

export interface PublicationInput {
  title: string;
  description: string;
  category: PublicationCategory;
  year: string;
  fileUrl: string;
  filePublicId: string;
  fileBytes: number;
  fileSize: string;
  pages: PublicationPage[];
}

export interface PublicationSummary {
  id: string;
  title: string;
  description: string;
  category: PublicationCategory;
  year: string;
  fileSize: string;
  fileUrl: string;
  status: PublicationStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicPublicationSummary = Omit<PublicationSummary, 'status'>;

// ─── API response types ──────────────────────────────────────────────────────

export interface PaginatedPublications {
  items: PublicPublicationSummary[];
  total: number;
}

export interface ListPublishedPublicationsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: PublicationCategory;
}

/**
 * Raw shape returned by POST /publications/admin/upload/file.
 *
 * These are Cloudinary's names, not the publication's. The server sends
 * `{ url, publicId, bytes, fileSize, pages }`. The thunk below remaps
 * the first two into `UploadedFile`.
 */
export interface UploadPublicationFileResult {
  url: string;
  publicId: string;
  bytes: number;
  fileSize: string;
  pages: PublicationPage[];
}

/**
 * What the `uploadPublicationFile` thunk resolves to: the fields the
 * editor needs, already named for `PublicationInput`.
 */
export interface UploadedFile {
  fileUrl: string;
  filePublicId: string;
  fileBytes: number;
  fileSize: string;
  pages: PublicationPage[];
}

// Backend envelope: { status, message, data }
interface ApiEnvelope<T> {
  status: string;
  message?: string;
  data: T;
}

// ─── State ───────────────────────────────────────────────────────────────────

interface PublicationsState {
  // Public list
  publicItems: PublicPublicationSummary[];
  publicTotal: number;
  isLoadingPublic: boolean;
  publicError: string | null;

  // Public single publication
  publicPublication: PublicPublication | null;
  isLoadingPublicPublication: boolean;
  publicPublicationError: string | null;

  // Admin list (all statuses)
  adminItems: PublicationSummary[];
  isLoadingAdmin: boolean;
  adminError: string | null;

  // Super admin review queue
  pendingItems: PublicationSummary[];
  isLoadingPending: boolean;
  pendingError: string | null;

  // Admin: currently-open publication (editor)
  current: Publication | null;
  isLoadingCurrent: boolean;
  currentError: string | null;

  // Write-in-flight flags
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;

  isReviewing: boolean;
  reviewError: string | null;
  reviewSuccess: boolean;

  isUploading: boolean;
  uploadError: string | null;

  isDeleting: boolean;
  deleteError: string | null;
}

const initialState: PublicationsState = {
  publicItems: [],
  publicTotal: 0,
  isLoadingPublic: false,
  publicError: null,

  publicPublication: null,
  isLoadingPublicPublication: false,
  publicPublicationError: null,

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

  isUploading: false,
  uploadError: null,

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

// Base path — must match `app.use('/api/v1/publications', publicationsRoutes)`.
// `axiosClient` already carries the `/api/v1` prefix on its baseURL.
const PUBLICATIONS_BASE = '/publications';

// ─── Public thunks ───────────────────────────────────────────────────────────

export const fetchPublishedPublications = createAsyncThunk(
  'publications/fetchPublishedPublications',
  async (
    params: ListPublishedPublicationsParams = {},
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosClient.get<
        ApiEnvelope<PaginatedPublications>
      >(`${PUBLICATIONS_BASE}`, { params });
      return unwrap<PaginatedPublications>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchPublishedPublicationById = createAsyncThunk(
  'publications/fetchPublishedPublicationById',
  async (publicationId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<PublicPublication>>(
        `${PUBLICATIONS_BASE}/${publicationId}`,
      );
      return unwrap<PublicPublication>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Admin read thunks ───────────────────────────────────────────────────────

export const fetchAllPublications = createAsyncThunk(
  'publications/fetchAllPublications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<
        ApiEnvelope<PublicationSummary[]>
      >(`${PUBLICATIONS_BASE}/admin/all`);
      return unwrap<PublicationSummary[]>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchPendingPublications = createAsyncThunk(
  'publications/fetchPendingPublications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<
        ApiEnvelope<PublicationSummary[]>
      >(`${PUBLICATIONS_BASE}/admin/pending`);
      return unwrap<PublicationSummary[]>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchPublicationById = createAsyncThunk(
  'publications/fetchPublicationById',
  async (publicationId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<Publication>>(
        `${PUBLICATIONS_BASE}/admin/${publicationId}`,
      );
      return unwrap<Publication>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Admin write thunks ──────────────────────────────────────────────────────

export const createPublication = createAsyncThunk(
  'publications/createPublication',
  async (payload: PublicationInput, { rejectWithValue }) => {
    try {
      // Route expects Body: { payload: PublicationInput }
      const response = await axiosClient.post<ApiEnvelope<Publication>>(
        `${PUBLICATIONS_BASE}/admin`,
        { payload },
      );
      return unwrap<Publication>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updatePublication = createAsyncThunk(
  'publications/updatePublication',
  async (
    args: { publicationId: string; payload: Partial<PublicationInput> },
    { rejectWithValue },
  ) => {
    try {
      // Route expects Body: { payload: Partial<PublicationInput> }
      const response = await axiosClient.patch<ApiEnvelope<Publication>>(
        `${PUBLICATIONS_BASE}/admin/${args.publicationId}`,
        { payload: args.payload },
      );
      return unwrap<Publication>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const submitPublication = createAsyncThunk(
  'publications/submitPublication',
  async (publicationId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<Publication>>(
        `${PUBLICATIONS_BASE}/admin/${publicationId}/submit`,
        {},
      );
      return unwrap<Publication>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const deletePublication = createAsyncThunk(
  'publications/deletePublication',
  async (publicationId: string, { rejectWithValue }) => {
    try {
      await axiosClient.delete(
        `${PUBLICATIONS_BASE}/admin/${publicationId}`,
      );
      return publicationId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Super admin review thunks ───────────────────────────────────────────────

export const approvePublication = createAsyncThunk(
  'publications/approvePublication',
  async (
    args: { publicationId: string; reviewNote?: string },
    { rejectWithValue },
  ) => {
    try {
      // Route expects Body: { reviewNote?: string }
      const response = await axiosClient.post<ApiEnvelope<Publication>>(
        `${PUBLICATIONS_BASE}/admin/${args.publicationId}/approve`,
        { reviewNote: args.reviewNote },
      );
      return unwrap<Publication>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const rejectPublication = createAsyncThunk(
  'publications/rejectPublication',
  async (
    args: { publicationId: string; reviewNote: string },
    { rejectWithValue },
  ) => {
    try {
      // Route expects Body: { reviewNote: string }
      const response = await axiosClient.post<ApiEnvelope<Publication>>(
        `${PUBLICATIONS_BASE}/admin/${args.publicationId}/reject`,
        { reviewNote: args.reviewNote },
      );
      return unwrap<Publication>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Upload thunk ────────────────────────────────────────────────────────────
//
// Two shapes are in play:
//   - `UploadPublicationFileResult` — the raw HTTP response from the
//     backend, which uses Cloudinary's names for the file plus the
//     derived `fileSize` and `pages`.
//   - `UploadedFile` — what this thunk resolves to, which uses the
//     publication's field names. Same shape, different naming to match
//     `PublicationInput`.

export const uploadPublicationFile = createAsyncThunk<
  UploadedFile,
  File,
  { rejectValue: string }
>(
  'publications/uploadPublicationFile',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      // Route: upload.single('file')
      formData.append('file', file);

      const response = await axiosClient.post<
        ApiEnvelope<UploadPublicationFileResult>
      >(
        `${PUBLICATIONS_BASE}/admin/upload/file`,
        formData,
        {
          headers: {
            // Let the browser set the multipart boundary; do NOT
            // hard-code 'multipart/form-data' or the boundary will be
            // missing and multer will reject the request.
            'Content-Type': undefined,
          },
        },
      );

      const raw = unwrap<UploadPublicationFileResult>(response);

      return {
        fileUrl: raw.url,
        filePublicId: raw.publicId,
        fileBytes: raw.bytes,
        fileSize: raw.fileSize,
        pages: raw.pages ?? [],
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const publicationsSlice = createSlice({
  name: 'publications',
  initialState,
  reducers: {
    clearPublicError: (state) => {
      state.publicError = null;
    },
    clearPublicPublication: (state) => {
      state.publicPublication = null;
      state.publicPublicationError = null;
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
    clearUploadError: (state) => {
      state.uploadError = null;
    },
    clearDeleteError: (state) => {
      state.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Public list ────────────────────────────────────────────────────────
      .addCase(fetchPublishedPublications.pending, (state) => {
        state.isLoadingPublic = true;
        state.publicError = null;
      })
      .addCase(
        fetchPublishedPublications.fulfilled,
        (state, action: PayloadAction<PaginatedPublications>) => {
          state.isLoadingPublic = false;
          state.publicItems = action.payload.items;
          state.publicTotal = action.payload.total;
        },
      )
      .addCase(fetchPublishedPublications.rejected, (state, action) => {
        state.isLoadingPublic = false;
        state.publicError = action.payload as string;
      })

      // ── Public single publication ─────────────────────────────────────────
      .addCase(fetchPublishedPublicationById.pending, (state) => {
        state.isLoadingPublicPublication = true;
        state.publicPublicationError = null;
      })
      .addCase(
        fetchPublishedPublicationById.fulfilled,
        (state, action: PayloadAction<PublicPublication>) => {
          state.isLoadingPublicPublication = false;
          state.publicPublication = action.payload;
        },
      )
      .addCase(fetchPublishedPublicationById.rejected, (state, action) => {
        state.isLoadingPublicPublication = false;
        state.publicPublicationError = action.payload as string;
      })

      // ── Admin list ────────────────────────────────────────────────────────
      .addCase(fetchAllPublications.pending, (state) => {
        state.isLoadingAdmin = true;
        state.adminError = null;
      })
      .addCase(
        fetchAllPublications.fulfilled,
        (state, action: PayloadAction<PublicationSummary[]>) => {
          state.isLoadingAdmin = false;
          state.adminItems = action.payload;
        },
      )
      .addCase(fetchAllPublications.rejected, (state, action) => {
        state.isLoadingAdmin = false;
        state.adminError = action.payload as string;
      })

      // ── Pending queue ─────────────────────────────────────────────────────
      .addCase(fetchPendingPublications.pending, (state) => {
        state.isLoadingPending = true;
        state.pendingError = null;
      })
      .addCase(
        fetchPendingPublications.fulfilled,
        (state, action: PayloadAction<PublicationSummary[]>) => {
          state.isLoadingPending = false;
          state.pendingItems = action.payload;
        },
      )
      .addCase(fetchPendingPublications.rejected, (state, action) => {
        state.isLoadingPending = false;
        state.pendingError = action.payload as string;
      })

      // ── Admin: current publication ────────────────────────────────────────
      .addCase(fetchPublicationById.pending, (state) => {
        state.isLoadingCurrent = true;
        state.currentError = null;
      })
      .addCase(
        fetchPublicationById.fulfilled,
        (state, action: PayloadAction<Publication>) => {
          state.isLoadingCurrent = false;
          state.current = action.payload;
        },
      )
      .addCase(fetchPublicationById.rejected, (state, action) => {
        state.isLoadingCurrent = false;
        state.currentError = action.payload as string;
      })

      // ── Create ────────────────────────────────────────────────────────────
      .addCase(createPublication.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        createPublication.fulfilled,
        (state, action: PayloadAction<Publication>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.current = action.payload;
        },
      )
      .addCase(createPublication.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Update ────────────────────────────────────────────────────────────
      .addCase(updatePublication.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        updatePublication.fulfilled,
        (state, action: PayloadAction<Publication>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.current = action.payload;
          state.adminItems = state.adminItems.map((item) =>
            item.id === action.payload.id
              ? {
                  ...item,
                  title: action.payload.title,
                  description: action.payload.description,
                  category: action.payload.category,
                  year: action.payload.year,
                  fileSize: action.payload.fileSize,
                  fileUrl: action.payload.fileUrl,
                  status: action.payload.status,
                  publishedAt: action.payload.publishedAt,
                  updatedAt: action.payload.updatedAt,
                }
              : item,
          );
        },
      )
      .addCase(updatePublication.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Submit ────────────────────────────────────────────────────────────
      .addCase(submitPublication.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        submitPublication.fulfilled,
        (state, action: PayloadAction<Publication>) => {
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
      .addCase(submitPublication.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Delete ────────────────────────────────────────────────────────────
      .addCase(deletePublication.pending, (state) => {
        state.isDeleting = true;
        state.deleteError = null;
      })
      .addCase(
        deletePublication.fulfilled,
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
      .addCase(deletePublication.rejected, (state, action) => {
        state.isDeleting = false;
        state.deleteError = action.payload as string;
      })

      // ── Approve ───────────────────────────────────────────────────────────
      .addCase(approvePublication.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(
        approvePublication.fulfilled,
        (state, action: PayloadAction<Publication>) => {
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
      .addCase(approvePublication.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      })

      // ── Reject ────────────────────────────────────────────────────────────
      .addCase(rejectPublication.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(
        rejectPublication.fulfilled,
        (state, action: PayloadAction<Publication>) => {
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
      .addCase(rejectPublication.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      })

      // ── Upload ────────────────────────────────────────────────────────────
      .addCase(uploadPublicationFile.pending, (state) => {
        state.isUploading = true;
        state.uploadError = null;
      })
      .addCase(uploadPublicationFile.fulfilled, (state) => {
        state.isUploading = false;
        // Result is returned to the caller, not stored — the
        // publication it belongs to is local component state until
        // saved.
      })
      .addCase(uploadPublicationFile.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadError = action.payload as string;
      });
  },
});

export const {
  clearPublicError,
  clearPublicPublication,
  clearAdminError,
  clearPendingError,
  clearCurrent,
  clearCurrentError,
  clearSaveState,
  clearReviewState,
  clearUploadError,
  clearDeleteError,
} = publicationsSlice.actions;

export default publicationsSlice.reducer;