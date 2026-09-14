// src/store/slices/heroSlice.ts
//
// Redux slice for the Hero feature.
//
// Responsibilities:
//   - Load the live Hero for the public site.
//   - Manage the admin's draft (get / save / submit / delete).
//   - Manage the version history and review queue.
//   - Approve / reject / rollback (super admin).
//   - Upload slide images to Cloudinary.
//
// The slice does not own the "who can do what" rules — the backend
// enforces them. This slice just calls endpoints and stores results.

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import axiosClient from '../../api/api';
import type { UserRole } from './authSlice';

// ─── Types ───────────────────────────────────────────────────────────────────
//
// These mirror `hero.types.ts` on the backend. If a field is added there,
// add it here too. `UserRole` is imported from authSlice so the two stay
// in sync on the role union.

export type HeroVersionStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'superseded';

export interface HeroSlide {
  id: string;
  imageUrl: string;
  /** Cloudinary public id. Null for legacy slides created before uploads. */
  imagePublicId: string | null;
  altText: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HeroBadge {
  id: string;
  label: string;
  value: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HeroSearchTab {
  key: string;
  label: string;
  placeholder: string;
  ctaLabel: string;
}

export interface HeroSearchCard {
  id: string;
  title: string;
  subtitle: string;
  selfServiceBadge: string;
  tabs: HeroSearchTab[];
  documentsLabel: string;
  documentsLinkLabel: string;
  documentsHref: string;
  updatedAt: string;
}

export interface Hero {
  id: string;
  badge: string;
  headline: string;
  subheadline: string;
  slides: HeroSlide[];
  badges: HeroBadge[];
  searchCard: HeroSearchCard;
  liveVersionId: string | null;
  updatedAt: string;
}

/**
 * The editable shape of a Hero. Deliberately has no ids, no timestamps.
 * This is what gets POSTed to /hero/draft and what lives inside a
 * version's payload.
 */
export interface HeroVersionPayload {
  badge: string;
  headline: string;
  subheadline: string;
  slides: Array<{
    imageUrl: string;
    imagePublicId: string | null;
    altText: string | null;
    ctaLabel: string | null;
    ctaHref: string | null;
    displayOrder: number;
    isActive: boolean;
  }>;
  badges: Array<{
    label: string;
    value: string;
    icon: string;
    displayOrder: number;
    isActive: boolean;
  }>;
  searchCard: {
    title: string;
    subtitle: string;
    selfServiceBadge: string;
    tabs: HeroSearchTab[];
    documentsLabel: string;
    documentsLinkLabel: string;
    documentsHref: string;
  };
}

export interface HeroVersion {
  id: string;
  status: HeroVersionStatus;
  payload: HeroVersionPayload;
  createdBy: string;
  createdByRole: UserRole;
  createdAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
}

export interface HeroVersionSummary {
  id: string;
  status: HeroVersionStatus;
  createdBy: string;
  createdByRole: UserRole;
  createdAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
}

/** Result of `POST /hero/upload/slide-image`. */
export interface UploadedAsset {
  url: string;
  publicId: string;
}

// ─── State ───────────────────────────────────────────────────────────────────

interface HeroState {
  // Live hero — for the public site.
  hero: Hero | null;
  isLoadingHero: boolean;
  heroError: string | null;

  // Admin draft.
  draft: HeroVersion | null;
  isLoadingDraft: boolean;
  isSavingDraft: boolean;
  draftError: string | null;
  draftSaveSuccess: boolean;

  // Slide image upload.
  isUploading: boolean;
  uploadError: string | null;

  // Version history / review queue.
  versions: HeroVersionSummary[];
  isLoadingVersions: boolean;
  versionsError: string | null;

  pendingVersions: HeroVersionSummary[];
  isLoadingPending: boolean;
  pendingError: string | null;

  // Review actions (approve / reject / rollback).
  isReviewing: boolean;
  reviewError: string | null;
  reviewSuccess: boolean;
}

const initialState: HeroState = {
  hero: null,
  isLoadingHero: false,
  isLoadingDraft: false,
  heroError: null,

  draft: null,
  isSavingDraft: false,
  draftError: null,
  draftSaveSuccess: false,

  isUploading: false,
  uploadError: null,

  versions: [],
  isLoadingVersions: false,
  versionsError: null,

  pendingVersions: [],
  isLoadingPending: false,
  pendingError: null,

  isReviewing: false,
  reviewError: null,
  reviewSuccess: false,
};

// ─── Utility ─────────────────────────────────────────────────────────────────

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

// ─── Thunks ──────────────────────────────────────────────────────────────────

// GET /hero  (public)
export const fetchLiveHero = createAsyncThunk(
  'hero/fetchLiveHero',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/hero');
      return response.data.data as Hero;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// GET /hero/draft  (admin)
export const fetchMyDraft = createAsyncThunk(
  'hero/fetchMyDraft',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/hero/draft');
      // Backend sends `null` for "no draft" — that's a valid success.
      return (response.data.data as HeroVersion | null) ?? null;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// POST /hero/upload/slide-image  (admin, multipart)
export const uploadSlideImage = createAsyncThunk(
  'hero/uploadSlideImage',
  async (file: File, { rejectWithValue }) => {
    try {
      const form = new FormData();
      form.append('image', file);

      const response = await axiosClient.post('/hero/upload/slide-image', form, {
        // Let the browser set the multipart boundary. Setting
        // 'Content-Type': 'multipart/form-data' manually omits the
        // boundary and the server can't parse the body.
        headers: { 'Content-Type': undefined },
      });

      return response.data.data as UploadedAsset;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// POST /hero/draft  (admin)
export const saveDraft = createAsyncThunk(
  'hero/saveDraft',
  async (
    payload: { payload: HeroVersionPayload; versionId?: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosClient.post('/hero/draft', payload);
      return response.data.data as HeroVersion;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// POST /hero/draft/:versionId/submit  (admin)
export const submitDraft = createAsyncThunk(
  'hero/submitDraft',
  async (versionId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(
        `/hero/draft/${versionId}/submit`,
      );
      return response.data.data as HeroVersion;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// DELETE /hero/draft/:versionId  (admin)
export const deleteDraft = createAsyncThunk(
  'hero/deleteDraft',
  async (versionId: string, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/hero/draft/${versionId}`);
      return versionId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// GET /hero/versions  (admin)
export const fetchVersions = createAsyncThunk(
  'hero/fetchVersions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/hero/versions');
      return response.data.data as HeroVersionSummary[];
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// GET /hero/versions/pending  (admin)
export const fetchPendingVersions = createAsyncThunk(
  'hero/fetchPendingVersions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/hero/versions/pending');
      return response.data.data as HeroVersionSummary[];
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// GET /hero/versions/:versionId  (admin)
export const fetchVersionById = createAsyncThunk(
  'hero/fetchVersionById',
  async (versionId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/hero/versions/${versionId}`);
      return response.data.data as HeroVersion;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// POST /hero/versions/:versionId/approve  (super_admin)
export const approveVersion = createAsyncThunk(
  'hero/approveVersion',
  async (
    payload: { versionId: string; reviewNote?: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosClient.post(
        `/hero/versions/${payload.versionId}/approve`,
        { reviewNote: payload.reviewNote },
      );
      return response.data.data as HeroVersion;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// POST /hero/versions/:versionId/reject  (super_admin)
export const rejectVersion = createAsyncThunk(
  'hero/rejectVersion',
  async (
    payload: { versionId: string; reviewNote: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosClient.post(
        `/hero/versions/${payload.versionId}/reject`,
        { reviewNote: payload.reviewNote },
      );
      return response.data.data as HeroVersion;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// POST /hero/versions/:versionId/rollback  (super_admin)
export const rollbackVersion = createAsyncThunk(
  'hero/rollbackVersion',
  async (versionId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(
        `/hero/versions/${versionId}/rollback`,
      );
      return response.data.data as HeroVersion;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const heroSlice = createSlice({
  name: 'hero',
  initialState,
  reducers: {
    clearHeroError: (state) => {
      state.heroError = null;
    },
    clearDraftError: (state) => {
      state.draftError = null;
    },
    clearDraftSaveSuccess: (state) => {
      state.draftSaveSuccess = false;
    },
    clearUploadError: (state) => {
      state.uploadError = null;
    },
    clearVersionsError: (state) => {
      state.versionsError = null;
    },
    clearPendingError: (state) => {
      state.pendingError = null;
    },
    clearReviewState: (state) => {
      state.reviewError = null;
      state.reviewSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Live hero ─────────────────────────────────────────────────────────
      .addCase(fetchLiveHero.pending, (state) => {
        state.isLoadingHero = true;
        state.heroError = null;
      })
      .addCase(fetchLiveHero.fulfilled, (state, action: PayloadAction<Hero>) => {
        state.isLoadingHero = false;
        state.hero = action.payload;
      })
      .addCase(fetchLiveHero.rejected, (state, action) => {
        state.isLoadingHero = false;
        state.heroError = action.payload as string;
      })

      // ── Draft — fetch ─────────────────────────────────────────────────────
      .addCase(fetchMyDraft.pending, (state) => {
        state.isLoadingDraft = true;
        state.draftError = null;
      })
      .addCase(fetchMyDraft.fulfilled, (state, action) => {
        state.isLoadingDraft = false;
        state.draft = action.payload;
      })
      .addCase(fetchMyDraft.rejected, (state, action) => {
        state.isLoadingDraft = false;
        state.draftError = action.payload as string;
      })

      // ── Upload slide image ────────────────────────────────────────────────
      .addCase(uploadSlideImage.pending, (state) => {
        state.isUploading = true;
        state.uploadError = null;
      })
      .addCase(uploadSlideImage.fulfilled, (state) => {
        state.isUploading = false;
        // The thunk result is consumed by the caller; we don't store
        // the asset in the slice because the slide it belongs to is
        // local component state until the draft is saved.
      })
      .addCase(uploadSlideImage.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadError = action.payload as string;
      })

      // ── Draft — save ──────────────────────────────────────────────────────
      .addCase(saveDraft.pending, (state) => {
        state.isSavingDraft = true;
        state.draftError = null;
        state.draftSaveSuccess = false;
      })
      .addCase(saveDraft.fulfilled, (state, action: PayloadAction<HeroVersion>) => {
        state.isSavingDraft = false;
        state.draft = action.payload;
        state.draftSaveSuccess = true;
      })
      .addCase(saveDraft.rejected, (state, action) => {
        state.isSavingDraft = false;
        state.draftError = action.payload as string;
        state.draftSaveSuccess = false;
      })

      // ── Draft — submit ────────────────────────────────────────────────────
      .addCase(submitDraft.fulfilled, (state, action: PayloadAction<HeroVersion>) => {
        state.draft = action.payload;
        if (state.draft?.id === action.payload.id) {
          state.draft = null;
        }
      })

      // ── Draft — delete ────────────────────────────────────────────────────
      .addCase(deleteDraft.fulfilled, (state, action: PayloadAction<string>) => {
        if (state.draft?.id === action.payload) {
          state.draft = null;
        }
      })

      // ── Versions ──────────────────────────────────────────────────────────
      .addCase(fetchVersions.pending, (state) => {
        state.isLoadingVersions = true;
        state.versionsError = null;
      })
      .addCase(fetchVersions.fulfilled, (state, action: PayloadAction<HeroVersionSummary[]>) => {
        state.isLoadingVersions = false;
        state.versions = action.payload;
      })
      .addCase(fetchVersions.rejected, (state, action) => {
        state.isLoadingVersions = false;
        state.versionsError = action.payload as string;
      })

      // ── Pending versions ──────────────────────────────────────────────────
      .addCase(fetchPendingVersions.pending, (state) => {
        state.isLoadingPending = true;
        state.pendingError = null;
      })
      .addCase(fetchPendingVersions.fulfilled, (state, action: PayloadAction<HeroVersionSummary[]>) => {
        state.isLoadingPending = false;
        state.pendingVersions = action.payload;
      })
      .addCase(fetchPendingVersions.rejected, (state, action) => {
        state.isLoadingPending = false;
        state.pendingError = action.payload as string;
      })

      // ── Review — approve ──────────────────────────────────────────────────
      .addCase(approveVersion.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(approveVersion.fulfilled, (state) => {
        state.isReviewing = false;
        state.reviewSuccess = true;
        state.pendingVersions = state.pendingVersions.filter(
          (v) => v.id !== state.draft?.id,
        );
      })
      .addCase(approveVersion.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      })

      // ── Review — reject ───────────────────────────────────────────────────
      .addCase(rejectVersion.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(rejectVersion.fulfilled, (state) => {
        state.isReviewing = false;
        state.reviewSuccess = true;
      })
      .addCase(rejectVersion.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      })

      // ── Review — rollback ─────────────────────────────────────────────────
      .addCase(rollbackVersion.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(rollbackVersion.fulfilled, (state) => {
        state.isReviewing = false;
        state.reviewSuccess = true;
      })
      .addCase(rollbackVersion.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      });
  },
});

export const {
  clearHeroError,
  clearDraftError,
  clearDraftSaveSuccess,
  clearUploadError,
  clearVersionsError,
  clearPendingError,
  clearReviewState,
} = heroSlice.actions;

export default heroSlice.reducer;