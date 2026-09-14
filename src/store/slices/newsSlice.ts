// src/store/slices/newsSlice.ts
//
// Redux slice for the News feature.
//
// Responsibilities:
//   - Public reads: list published articles, read one published article.
//   - Admin reads: list all articles, list pending, read any by id.
//   - Admin writes: create / update / submit / delete.
//   - Super admin writes: approve / reject / feature.
//   - Upload: article header images (Cloudinary via the backend).
//
// All HTTP lives in THIS file via `axiosClient` from `src/api/api.ts`.
// This slice only coordinates loading flags, stores results, and surfaces
// errors. It does not own authorization — the backend enforces that.
//
// Route prefix: app.use('/api/v1/news', newsRoutes)
//   GET    /api/v1/news
//   GET    /api/v1/news/:newsId
//   POST   /api/v1/news/admin/upload/image
//   GET    /api/v1/news/admin/all
//   GET    /api/v1/news/admin/pending
//   GET    /api/v1/news/admin/:newsId
//   POST   /api/v1/news/admin
//   PATCH  /api/v1/news/admin/:newsId
//   POST   /api/v1/news/admin/:newsId/submit
//   DELETE /api/v1/news/admin/:newsId
//   POST   /api/v1/news/admin/:newsId/approve
//   POST   /api/v1/news/admin/:newsId/reject
//   POST   /api/v1/news/admin/:newsId/feature

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
// Mirror `news.types.ts` on the backend. If a field is added there, add
// it here too.

export type NewsStatus = 'draft' | 'pending' | 'published' | 'rejected';

export interface News {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;

  /** Cloudinary secure_url. Empty string when the article has no image. */
  imageUrl: string;
  /** Cloudinary public_id. Null when the article has no image. */
  imagePublicId: string | null;

  isFeatured: boolean;
  status: NewsStatus;
  publishedAt: string | null;

  createdBy: string;
  createdByRole: UserRole;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;

  createdAt: string;
  updatedAt: string;
}

export type PublicNews = Omit<
  News,
  'reviewNote' | 'reviewedBy' | 'reviewedAt' | 'createdBy' | 'createdByRole'
>;

export interface NewsInput {
  title: string;
  summary: string;
  content: string;
  author: string;
  imageUrl: string;
  imagePublicId: string | null;
  isFeatured: boolean;
}

export interface NewsSummary {
  id: string;
  title: string;
  summary: string;
  author: string;
  imageUrl: string;
  isFeatured: boolean;
  status: NewsStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicNewsSummary = Omit<NewsSummary, 'status'>;

// ─── API response types ──────────────────────────────────────────────────────

export interface PaginatedNews {
  items: PublicNewsSummary[];
  total: number;
}

export interface ListPublishedNewsParams {
  page?: number;
  limit?: number;
  search?: string;
  featuredOnly?: boolean;
}

/**
 * Raw shape returned by POST /news/admin/upload/image.
 *
 * These are Cloudinary's names, not the article's. The server
 * (news.controller.ts → uploadNewsImageHandler) sends
 * `{ url, publicId }`. The `uploadNewsImage` thunk below remaps them
 * into the article-shaped `UploadedImage` before resolving.
 */
export interface UploadNewsImageResult {
  url: string;
  publicId: string;
}

/**
 * What the `uploadNewsImage` thunk resolves to: article field names,
 * ready to drop straight into `NewsInput` / `News`.
 *
 * `imagePublicId` is non-null on success — the upload endpoint always
 * returns a public id, since Cloudinary always assigns one.
 */
export interface UploadedImage {
  imageUrl: string;
  imagePublicId: string;
}

// Backend envelope: { status, message, data }
interface ApiEnvelope<T> {
  status: string;
  message?: string;
  data: T;
}

// ─── State ───────────────────────────────────────────────────────────────────

interface NewsState {
  // Public list
  publicItems: PublicNewsSummary[];
  publicTotal: number;
  isLoadingPublic: boolean;
  publicError: string | null;

  // Public single article
  publicArticle: PublicNews | null;
  isLoadingPublicArticle: boolean;
  publicArticleError: string | null;

  // Admin list (all statuses)
  adminItems: NewsSummary[];
  isLoadingAdmin: boolean;
  adminError: string | null;

  // Super admin review queue
  pendingItems: NewsSummary[];
  isLoadingPending: boolean;
  pendingError: string | null;

  // Admin: currently-open article (editor)
  current: News | null;
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

const initialState: NewsState = {
  publicItems: [],
  publicTotal: 0,
  isLoadingPublic: false,
  publicError: null,

  publicArticle: null,
  isLoadingPublicArticle: false,
  publicArticleError: null,

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

// Unwrap the `{ status, message, data }` envelope the backend returns.
// Falls back to the raw body if the envelope isn't present (defensive).
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

// Base path — must match `app.use('/api/v1/news', newsRoutes)`.
// `axiosClient` already carries the `/api/v1` prefix on its baseURL.
const NEWS_BASE = '/news';

// ─── Public thunks ───────────────────────────────────────────────────────────

export const fetchPublishedNews = createAsyncThunk(
  'news/fetchPublishedNews',
  async (params: ListPublishedNewsParams = {}, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<PaginatedNews>>(
        `${NEWS_BASE}`,
        { params },
      );
      return unwrap<PaginatedNews>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchPublishedNewsById = createAsyncThunk(
  'news/fetchPublishedNewsById',
  async (newsId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<PublicNews>>(
        `${NEWS_BASE}/${newsId}`,
      );
      return unwrap<PublicNews>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Admin read thunks ───────────────────────────────────────────────────────

export const fetchAllNews = createAsyncThunk(
  'news/fetchAllNews',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<NewsSummary[]>>(
        `${NEWS_BASE}/admin/all`,
      );
      return unwrap<NewsSummary[]>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchPendingNews = createAsyncThunk(
  'news/fetchPendingNews',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<NewsSummary[]>>(
        `${NEWS_BASE}/admin/pending`,
      );
      return unwrap<NewsSummary[]>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchNewsById = createAsyncThunk(
  'news/fetchNewsById',
  async (newsId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<News>>(
        `${NEWS_BASE}/admin/${newsId}`,
      );
      return unwrap<News>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Admin write thunks ──────────────────────────────────────────────────────

export const createNews = createAsyncThunk(
  'news/createNews',
  async (payload: NewsInput, { rejectWithValue }) => {
    try {
      // Route expects Body: { payload: NewsInput }
      const response = await axiosClient.post<ApiEnvelope<News>>(
        `${NEWS_BASE}/admin`,
        { payload },
      );
      return unwrap<News>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateNews = createAsyncThunk(
  'news/updateNews',
  async (
    args: { newsId: string; payload: Partial<NewsInput> },
    { rejectWithValue },
  ) => {
    try {
      // Route expects Body: { payload: Partial<NewsInput> }
      const response = await axiosClient.patch<ApiEnvelope<News>>(
        `${NEWS_BASE}/admin/${args.newsId}`,
        { payload: args.payload },
      );
      return unwrap<News>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const submitNews = createAsyncThunk(
  'news/submitNews',
  async (newsId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<News>>(
        `${NEWS_BASE}/admin/${newsId}/submit`,
        {},
      );
      return unwrap<News>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const deleteNews = createAsyncThunk(
  'news/deleteNews',
  async (newsId: string, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`${NEWS_BASE}/admin/${newsId}`);
      return newsId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Super admin review thunks ───────────────────────────────────────────────

export const approveNews = createAsyncThunk(
  'news/approveNews',
  async (
    args: { newsId: string; reviewNote?: string },
    { rejectWithValue },
  ) => {
    try {
      // Route expects Body: { reviewNote?: string }
      const response = await axiosClient.post<ApiEnvelope<News>>(
        `${NEWS_BASE}/admin/${args.newsId}/approve`,
        { reviewNote: args.reviewNote },
      );
      return unwrap<News>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const rejectNews = createAsyncThunk(
  'news/rejectNews',
  async (
    args: { newsId: string; reviewNote: string },
    { rejectWithValue },
  ) => {
    try {
      // Route expects Body: { reviewNote: string }
      const response = await axiosClient.post<ApiEnvelope<News>>(
        `${NEWS_BASE}/admin/${args.newsId}/reject`,
        { reviewNote: args.reviewNote },
      );
      return unwrap<News>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const setFeaturedNews = createAsyncThunk(
  'news/setFeaturedNews',
  async (
    args: { newsId: string; isFeatured: boolean },
    { rejectWithValue },
  ) => {
    try {
      // Route expects Body: { isFeatured: boolean }
      const response = await axiosClient.post<ApiEnvelope<News>>(
        `${NEWS_BASE}/admin/${args.newsId}/feature`,
        { isFeatured: args.isFeatured },
      );
      return unwrap<News>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Upload thunk ────────────────────────────────────────────────────────────
//
// Two shapes are in play:
//   - `UploadNewsImageResult` — the raw HTTP response from the backend,
//     which uses Cloudinary's names: { url, publicId }.
//   - `UploadedImage` — what this thunk resolves to, which uses the
//     article's names: { imageUrl, imagePublicId }.
//
// The remap happens here, once. No component ever sees `{ url, publicId }`.

export const uploadNewsImage = createAsyncThunk<
  UploadedImage,
  File,
  { rejectValue: string }
>(
  'news/uploadNewsImage',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      // Route: upload.single('image')
      formData.append('image', file);

      const response = await axiosClient.post<
        ApiEnvelope<UploadNewsImageResult>
      >(
        `${NEWS_BASE}/admin/upload/image`,
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

      const raw = unwrap<UploadNewsImageResult>(response);

      // Map Cloudinary names → article field names here, once, so no
      // component ever sees `{ url, publicId }`.
      return {
        imageUrl: raw.url,
        imagePublicId: raw.publicId,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    clearPublicError: (state) => {
      state.publicError = null;
    },
    clearPublicArticle: (state) => {
      state.publicArticle = null;
      state.publicArticleError = null;
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
      .addCase(fetchPublishedNews.pending, (state) => {
        state.isLoadingPublic = true;
        state.publicError = null;
      })
      .addCase(
        fetchPublishedNews.fulfilled,
        (state, action: PayloadAction<PaginatedNews>) => {
          state.isLoadingPublic = false;
          state.publicItems = action.payload.items;
          state.publicTotal = action.payload.total;
        },
      )
      .addCase(fetchPublishedNews.rejected, (state, action) => {
        state.isLoadingPublic = false;
        state.publicError = action.payload as string;
      })

      // ── Public single article ─────────────────────────────────────────────
      .addCase(fetchPublishedNewsById.pending, (state) => {
        state.isLoadingPublicArticle = true;
        state.publicArticleError = null;
      })
      .addCase(
        fetchPublishedNewsById.fulfilled,
        (state, action: PayloadAction<PublicNews>) => {
          state.isLoadingPublicArticle = false;
          state.publicArticle = action.payload;
        },
      )
      .addCase(fetchPublishedNewsById.rejected, (state, action) => {
        state.isLoadingPublicArticle = false;
        state.publicArticleError = action.payload as string;
      })

      // ── Admin list ────────────────────────────────────────────────────────
      .addCase(fetchAllNews.pending, (state) => {
        state.isLoadingAdmin = true;
        state.adminError = null;
      })
      .addCase(
        fetchAllNews.fulfilled,
        (state, action: PayloadAction<NewsSummary[]>) => {
          state.isLoadingAdmin = false;
          state.adminItems = action.payload;
        },
      )
      .addCase(fetchAllNews.rejected, (state, action) => {
        state.isLoadingAdmin = false;
        state.adminError = action.payload as string;
      })

      // ── Pending queue ─────────────────────────────────────────────────────
      .addCase(fetchPendingNews.pending, (state) => {
        state.isLoadingPending = true;
        state.pendingError = null;
      })
      .addCase(
        fetchPendingNews.fulfilled,
        (state, action: PayloadAction<NewsSummary[]>) => {
          state.isLoadingPending = false;
          state.pendingItems = action.payload;
        },
      )
      .addCase(fetchPendingNews.rejected, (state, action) => {
        state.isLoadingPending = false;
        state.pendingError = action.payload as string;
      })

      // ── Admin: current article ────────────────────────────────────────────
      .addCase(fetchNewsById.pending, (state) => {
        state.isLoadingCurrent = true;
        state.currentError = null;
      })
      .addCase(
        fetchNewsById.fulfilled,
        (state, action: PayloadAction<News>) => {
          state.isLoadingCurrent = false;
          state.current = action.payload;
        },
      )
      .addCase(fetchNewsById.rejected, (state, action) => {
        state.isLoadingCurrent = false;
        state.currentError = action.payload as string;
      })

      // ── Create ────────────────────────────────────────────────────────────
      .addCase(createNews.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        createNews.fulfilled,
        (state, action: PayloadAction<News>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.current = action.payload;
        },
      )
      .addCase(createNews.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Update ────────────────────────────────────────────────────────────
      .addCase(updateNews.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        updateNews.fulfilled,
        (state, action: PayloadAction<News>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.current = action.payload;
          // Refresh the list row in place so the table reflects the
          // edit without a full refetch.
          state.adminItems = state.adminItems.map((item) =>
            item.id === action.payload.id
              ? {
                  ...item,
                  title: action.payload.title,
                  summary: action.payload.summary,
                  author: action.payload.author,
                  imageUrl: action.payload.imageUrl,
                  isFeatured: action.payload.isFeatured,
                  status: action.payload.status,
                  publishedAt: action.payload.publishedAt,
                  updatedAt: action.payload.updatedAt,
                }
              : item,
          );
        },
      )
      .addCase(updateNews.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Submit ────────────────────────────────────────────────────────────
      .addCase(submitNews.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        submitNews.fulfilled,
        (state, action: PayloadAction<News>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.current = action.payload;
          // The row leaves the admin's "editable" set — it's now pending.
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
      .addCase(submitNews.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Delete ────────────────────────────────────────────────────────────
      .addCase(deleteNews.pending, (state) => {
        state.isDeleting = true;
        state.deleteError = null;
      })
      .addCase(
        deleteNews.fulfilled,
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
      .addCase(deleteNews.rejected, (state, action) => {
        state.isDeleting = false;
        state.deleteError = action.payload as string;
      })

      // ── Approve ───────────────────────────────────────────────────────────
      .addCase(approveNews.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(
        approveNews.fulfilled,
        (state, action: PayloadAction<News>) => {
          state.isReviewing = false;
          state.reviewSuccess = true;
          // Remove from the pending queue — it's published now.
          state.pendingItems = state.pendingItems.filter(
            (item) => item.id !== action.payload.id,
          );
          // Update the admin list row's status.
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
      .addCase(approveNews.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      })

      // ── Reject ────────────────────────────────────────────────────────────
      .addCase(rejectNews.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(
        rejectNews.fulfilled,
        (state, action: PayloadAction<News>) => {
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
      .addCase(rejectNews.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      })

      // ── Feature toggle ────────────────────────────────────────────────────
      .addCase(setFeaturedNews.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(
        setFeaturedNews.fulfilled,
        (state, action: PayloadAction<News>) => {
          state.isReviewing = false;
          state.reviewSuccess = true;
          // The partial unique index means featuring this one unfeatures
          // another. Reflecting that locally would require knowing which
          // other row changed — easier to let the caller refetch.
          state.adminItems = state.adminItems.map((item) =>
            item.id === action.payload.id
              ? {
                  ...item,
                  isFeatured: action.payload.isFeatured,
                  updatedAt: action.payload.updatedAt,
                }
              : item,
          );
        },
      )
      .addCase(setFeaturedNews.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      })

      // ── Upload ────────────────────────────────────────────────────────────
      .addCase(uploadNewsImage.pending, (state) => {
        state.isUploading = true;
        state.uploadError = null;
      })
      .addCase(uploadNewsImage.fulfilled, (state) => {
        state.isUploading = false;
        // Result is returned to the caller, not stored — the article
        // it belongs to is local component state until saved.
      })
      .addCase(uploadNewsImage.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadError = action.payload as string;
      });
  },
});

export const {
  clearPublicError,
  clearPublicArticle,
  clearAdminError,
  clearPendingError,
  clearCurrent,
  clearCurrentError,
  clearSaveState,
  clearReviewState,
  clearUploadError,
  clearDeleteError,
} = newsSlice.actions;

export default newsSlice.reducer;