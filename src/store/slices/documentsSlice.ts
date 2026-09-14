// src/store/slices/documentsSlice.ts
//
// Redux slice for the Documents feature.
//
// Responsibilities:
//   - Public reads: list published documents, read one published
//     document.
//   - Admin reads: list all documents, list pending, read any by id.
//   - Admin writes: create / update / submit / delete.
//   - Super admin writes: approve / reject.
//   - Upload: document PDFs (Cloudinary via the backend).
//
// All HTTP lives in THIS file via `axiosClient` from `src/api/api.ts`.
// This slice only coordinates loading flags, stores results, and
// surfaces errors. It does not own authorization — the backend
// enforces that.
//
// Route prefix: app.use('/api/v1/documents', documentsRoutes)
//   GET    /api/v1/documents
//   GET    /api/v1/documents/:documentId
//   POST   /api/v1/documents/admin/upload/file
//   GET    /api/v1/documents/admin/all
//   GET    /api/v1/documents/admin/pending
//   GET    /api/v1/documents/admin/:documentId
//   POST   /api/v1/documents/admin
//   PATCH  /api/v1/documents/admin/:documentId
//   POST   /api/v1/documents/admin/:documentId/submit
//   DELETE /api/v1/documents/admin/:documentId
//   POST   /api/v1/documents/admin/:documentId/approve
//   POST   /api/v1/documents/admin/:documentId/reject

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
// Mirror `documents.types.ts` on the backend. If a field is added there,
// add it here too.

export type DocumentStatus =
  | 'draft'
  | 'pending'
  | 'published'
  | 'rejected';

export const DOCUMENT_CATEGORIES = [
  'Practice Directions',
  'Acts & Rules',
  'Cause Lists',
  'Guidelines',
  'Reports',
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_STATIONS = [
  'National / All Stations',
  'Nairobi ELC Station',
  'Mombasa ELC Station',
  'Kisumu ELC Station',
  'Nakuru ELC Station',
  'Eldoret ELC Station',
  'Kericho ELC Station',
  'Machakos ELC Station',
  'Meru ELC Station',
  'Malindi ELC Station',
] as const;

export type DocumentStation = (typeof DOCUMENT_STATIONS)[number];

export interface Document {
  id: string;
  title: string;
  description: string;
  category: DocumentCategory;
  station: DocumentStation;

  /** Date-only string, "YYYY-MM-DD". See documents.types.ts for why. */
  issuedAt: string;

  fileUrl: string;
  filePublicId: string;
  fileBytes: number;
  fileSize: string;

  status: DocumentStatus;
  publishedAt: string | null;

  createdBy: string;
  createdByRole: UserRole;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;

  createdAt: string;
  updatedAt: string;
}

export type PublicDocument = Omit<
  Document,
  | 'reviewNote'
  | 'reviewedBy'
  | 'reviewedAt'
  | 'createdBy'
  | 'createdByRole'
  | 'filePublicId'
>;

export interface DocumentInput {
  title: string;
  description: string;
  category: DocumentCategory;
  station: DocumentStation;
  issuedAt: string;
  fileUrl: string;
  filePublicId: string;
  fileBytes: number;
  fileSize: string;
}

export interface DocumentSummary {
  id: string;
  title: string;
  description: string;
  category: DocumentCategory;
  station: DocumentStation;
  issuedAt: string;
  fileSize: string;
  fileUrl: string;
  status: DocumentStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicDocumentSummary = Omit<DocumentSummary, 'status'>;

// ─── API response types ──────────────────────────────────────────────────────

export interface PaginatedDocuments {
  items: PublicDocumentSummary[];
  total: number;
}

export interface ListPublishedDocumentsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: DocumentCategory;
  station?: DocumentStation;
}

/**
 * Raw shape returned by POST /documents/admin/upload/file.
 *
 * These are Cloudinary's names, not the document's. The server sends
 * `{ url, publicId, bytes, fileSize }`. The thunk below remaps the
 * first two into `UploadedFile`.
 */
export interface UploadDocumentFileResult {
  url: string;
  publicId: string;
  bytes: number;
  fileSize: string;
}

/**
 * What the `uploadDocumentFile` thunk resolves to: the fields the
 * editor needs, already named for `DocumentInput`.
 */
export interface UploadedFile {
  fileUrl: string;
  filePublicId: string;
  fileBytes: number;
  fileSize: string;
}

// Backend envelope: { status, message, data }
interface ApiEnvelope<T> {
  status: string;
  message?: string;
  data: T;
}

// ─── State ───────────────────────────────────────────────────────────────────

interface DocumentsState {
  // Public list
  publicItems: PublicDocumentSummary[];
  publicTotal: number;
  isLoadingPublic: boolean;
  publicError: string | null;

  // Public single document
  publicDocument: PublicDocument | null;
  isLoadingPublicDocument: boolean;
  publicDocumentError: string | null;

  // Admin list (all statuses)
  adminItems: DocumentSummary[];
  isLoadingAdmin: boolean;
  adminError: string | null;

  // Super admin review queue
  pendingItems: DocumentSummary[];
  isLoadingPending: boolean;
  pendingError: string | null;

  // Admin: currently-open document (editor)
  current: Document | null;
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

const initialState: DocumentsState = {
  publicItems: [],
  publicTotal: 0,
  isLoadingPublic: false,
  publicError: null,

  publicDocument: null,
  isLoadingPublicDocument: false,
  publicDocumentError: null,

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

// Base path — must match `app.use('/api/v1/documents', documentsRoutes)`.
// `axiosClient` already carries the `/api/v1` prefix on its baseURL.
const DOCUMENTS_BASE = '/documents';

// ─── Public thunks ───────────────────────────────────────────────────────────

export const fetchPublishedDocuments = createAsyncThunk(
  'documents/fetchPublishedDocuments',
  async (
    params: ListPublishedDocumentsParams = {},
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<PaginatedDocuments>>(
        `${DOCUMENTS_BASE}`,
        { params },
      );
      return unwrap<PaginatedDocuments>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchPublishedDocumentById = createAsyncThunk(
  'documents/fetchPublishedDocumentById',
  async (documentId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<PublicDocument>>(
        `${DOCUMENTS_BASE}/${documentId}`,
      );
      return unwrap<PublicDocument>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Admin read thunks ───────────────────────────────────────────────────────

export const fetchAllDocuments = createAsyncThunk(
  'documents/fetchAllDocuments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<DocumentSummary[]>>(
        `${DOCUMENTS_BASE}/admin/all`,
      );
      return unwrap<DocumentSummary[]>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchPendingDocuments = createAsyncThunk(
  'documents/fetchPendingDocuments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<DocumentSummary[]>>(
        `${DOCUMENTS_BASE}/admin/pending`,
      );
      return unwrap<DocumentSummary[]>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchDocumentById = createAsyncThunk(
  'documents/fetchDocumentById',
  async (documentId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<Document>>(
        `${DOCUMENTS_BASE}/admin/${documentId}`,
      );
      return unwrap<Document>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Admin write thunks ──────────────────────────────────────────────────────

export const createDocument = createAsyncThunk(
  'documents/createDocument',
  async (payload: DocumentInput, { rejectWithValue }) => {
    try {
      // Route expects Body: { payload: DocumentInput }
      const response = await axiosClient.post<ApiEnvelope<Document>>(
        `${DOCUMENTS_BASE}/admin`,
        { payload },
      );
      return unwrap<Document>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateDocument = createAsyncThunk(
  'documents/updateDocument',
  async (
    args: { documentId: string; payload: Partial<DocumentInput> },
    { rejectWithValue },
  ) => {
    try {
      // Route expects Body: { payload: Partial<DocumentInput> }
      const response = await axiosClient.patch<ApiEnvelope<Document>>(
        `${DOCUMENTS_BASE}/admin/${args.documentId}`,
        { payload: args.payload },
      );
      return unwrap<Document>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const submitDocument = createAsyncThunk(
  'documents/submitDocument',
  async (documentId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<Document>>(
        `${DOCUMENTS_BASE}/admin/${documentId}/submit`,
        {},
      );
      return unwrap<Document>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const deleteDocument = createAsyncThunk(
  'documents/deleteDocument',
  async (documentId: string, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`${DOCUMENTS_BASE}/admin/${documentId}`);
      return documentId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Super admin review thunks ───────────────────────────────────────────────

export const approveDocument = createAsyncThunk(
  'documents/approveDocument',
  async (
    args: { documentId: string; reviewNote?: string },
    { rejectWithValue },
  ) => {
    try {
      // Route expects Body: { reviewNote?: string }
      const response = await axiosClient.post<ApiEnvelope<Document>>(
        `${DOCUMENTS_BASE}/admin/${args.documentId}/approve`,
        { reviewNote: args.reviewNote },
      );
      return unwrap<Document>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const rejectDocument = createAsyncThunk(
  'documents/rejectDocument',
  async (
    args: { documentId: string; reviewNote: string },
    { rejectWithValue },
  ) => {
    try {
      // Route expects Body: { reviewNote: string }
      const response = await axiosClient.post<ApiEnvelope<Document>>(
        `${DOCUMENTS_BASE}/admin/${args.documentId}/reject`,
        { reviewNote: args.reviewNote },
      );
      return unwrap<Document>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Upload thunk ────────────────────────────────────────────────────────────
//
// Two shapes are in play:
//   - `UploadDocumentFileResult` — the raw HTTP response from the
//     backend, which uses Cloudinary's names for the file plus the
//     derived `fileSize`.
//   - `UploadedFile` — what this thunk resolves to, which uses the
//     document's field names.

export const uploadDocumentFile = createAsyncThunk<
  UploadedFile,
  File,
  { rejectValue: string }
>(
  'documents/uploadDocumentFile',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      // Route: upload.single('file')
      formData.append('file', file);

      const response = await axiosClient.post<
        ApiEnvelope<UploadDocumentFileResult>
      >(
        `${DOCUMENTS_BASE}/admin/upload/file`,
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

      const raw = unwrap<UploadDocumentFileResult>(response);

      return {
        fileUrl: raw.url,
        filePublicId: raw.publicId,
        fileBytes: raw.bytes,
        fileSize: raw.fileSize,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    clearPublicError: (state) => {
      state.publicError = null;
    },
    clearPublicDocument: (state) => {
      state.publicDocument = null;
      state.publicDocumentError = null;
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
      .addCase(fetchPublishedDocuments.pending, (state) => {
        state.isLoadingPublic = true;
        state.publicError = null;
      })
      .addCase(
        fetchPublishedDocuments.fulfilled,
        (state, action: PayloadAction<PaginatedDocuments>) => {
          state.isLoadingPublic = false;
          state.publicItems = action.payload.items;
          state.publicTotal = action.payload.total;
        },
      )
      .addCase(fetchPublishedDocuments.rejected, (state, action) => {
        state.isLoadingPublic = false;
        state.publicError = action.payload as string;
      })

      // ── Public single document ────────────────────────────────────────────
      .addCase(fetchPublishedDocumentById.pending, (state) => {
        state.isLoadingPublicDocument = true;
        state.publicDocumentError = null;
      })
      .addCase(
        fetchPublishedDocumentById.fulfilled,
        (state, action: PayloadAction<PublicDocument>) => {
          state.isLoadingPublicDocument = false;
          state.publicDocument = action.payload;
        },
      )
      .addCase(fetchPublishedDocumentById.rejected, (state, action) => {
        state.isLoadingPublicDocument = false;
        state.publicDocumentError = action.payload as string;
      })

      // ── Admin list ────────────────────────────────────────────────────────
      .addCase(fetchAllDocuments.pending, (state) => {
        state.isLoadingAdmin = true;
        state.adminError = null;
      })
      .addCase(
        fetchAllDocuments.fulfilled,
        (state, action: PayloadAction<DocumentSummary[]>) => {
          state.isLoadingAdmin = false;
          state.adminItems = action.payload;
        },
      )
      .addCase(fetchAllDocuments.rejected, (state, action) => {
        state.isLoadingAdmin = false;
        state.adminError = action.payload as string;
      })

      // ── Pending queue ─────────────────────────────────────────────────────
      .addCase(fetchPendingDocuments.pending, (state) => {
        state.isLoadingPending = true;
        state.pendingError = null;
      })
      .addCase(
        fetchPendingDocuments.fulfilled,
        (state, action: PayloadAction<DocumentSummary[]>) => {
          state.isLoadingPending = false;
          state.pendingItems = action.payload;
        },
      )
      .addCase(fetchPendingDocuments.rejected, (state, action) => {
        state.isLoadingPending = false;
        state.pendingError = action.payload as string;
      })

      // ── Admin: current document ───────────────────────────────────────────
      .addCase(fetchDocumentById.pending, (state) => {
        state.isLoadingCurrent = true;
        state.currentError = null;
      })
      .addCase(
        fetchDocumentById.fulfilled,
        (state, action: PayloadAction<Document>) => {
          state.isLoadingCurrent = false;
          state.current = action.payload;
        },
      )
      .addCase(fetchDocumentById.rejected, (state, action) => {
        state.isLoadingCurrent = false;
        state.currentError = action.payload as string;
      })

      // ── Create ────────────────────────────────────────────────────────────
      .addCase(createDocument.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        createDocument.fulfilled,
        (state, action: PayloadAction<Document>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.current = action.payload;
        },
      )
      .addCase(createDocument.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Update ────────────────────────────────────────────────────────────
      .addCase(updateDocument.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        updateDocument.fulfilled,
        (state, action: PayloadAction<Document>) => {
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
                  station: action.payload.station,
                  issuedAt: action.payload.issuedAt,
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
      .addCase(updateDocument.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Submit ────────────────────────────────────────────────────────────
      .addCase(submitDocument.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        submitDocument.fulfilled,
        (state, action: PayloadAction<Document>) => {
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
      .addCase(submitDocument.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Delete ────────────────────────────────────────────────────────────
      .addCase(deleteDocument.pending, (state) => {
        state.isDeleting = true;
        state.deleteError = null;
      })
      .addCase(
        deleteDocument.fulfilled,
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
      .addCase(deleteDocument.rejected, (state, action) => {
        state.isDeleting = false;
        state.deleteError = action.payload as string;
      })

      // ── Approve ───────────────────────────────────────────────────────────
      .addCase(approveDocument.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(
        approveDocument.fulfilled,
        (state, action: PayloadAction<Document>) => {
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
      .addCase(approveDocument.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      })

      // ── Reject ────────────────────────────────────────────────────────────
      .addCase(rejectDocument.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(
        rejectDocument.fulfilled,
        (state, action: PayloadAction<Document>) => {
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
      .addCase(rejectDocument.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      })

      // ── Upload ────────────────────────────────────────────────────────────
      .addCase(uploadDocumentFile.pending, (state) => {
        state.isUploading = true;
        state.uploadError = null;
      })
      .addCase(uploadDocumentFile.fulfilled, (state) => {
        state.isUploading = false;
        // Result is returned to the caller, not stored — the document
        // it belongs to is local component state until saved.
      })
      .addCase(uploadDocumentFile.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadError = action.payload as string;
      });
  },
});

export const {
  clearPublicError,
  clearPublicDocument,
  clearAdminError,
  clearPendingError,
  clearCurrent,
  clearCurrentError,
  clearSaveState,
  clearReviewState,
  clearUploadError,
  clearDeleteError,
} = documentsSlice.actions;

export default documentsSlice.reducer;