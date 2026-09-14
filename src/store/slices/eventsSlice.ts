// src/store/slices/eventsSlice.ts
//
// Redux slice for the Events feature.
//
// Responsibilities:
//   - Public reads: list published events, read one published event.
//   - Admin reads: list all events, list pending, read any by id.
//   - Admin writes: create / update / submit / delete.
//   - Super admin writes: approve / reject / feature.
//   - Upload: event header images (Cloudinary via the backend).
//
// All HTTP lives in THIS file via `axiosClient` from `src/api/api.ts`.
// This slice only coordinates loading flags, stores results, and
// surfaces errors. It does not own authorization — the backend
// enforces that.
//
// Route prefix: app.use('/api/v1/events', eventsRoutes)
//   GET    /api/v1/events
//   GET    /api/v1/events/:eventId
//   POST   /api/v1/events/admin/upload/image
//   GET    /api/v1/events/admin/all
//   GET    /api/v1/events/admin/pending
//   GET    /api/v1/events/admin/:eventId
//   POST   /api/v1/events/admin
//   PATCH  /api/v1/events/admin/:eventId
//   POST   /api/v1/events/admin/:eventId/submit
//   DELETE /api/v1/events/admin/:eventId
//   POST   /api/v1/events/admin/:eventId/approve
//   POST   /api/v1/events/admin/:eventId/reject
//   POST   /api/v1/events/admin/:eventId/feature

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
// Mirror `events.types.ts` on the backend. If a field is added there,
// add it here too.

export type EventStatus = 'draft' | 'pending' | 'published' | 'rejected';

export const EVENT_CATEGORIES = [
  'Conference',
  'Public Outreach',
  'Judicial Training',
  'Publication',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export interface Event {
  id: string;
  title: string;
  summary: string;
  content: string;
  organizer: string;
  category: EventCategory;

  /** ISO 8601 from the API. Parse with `new Date(s)` at the call site. */
  startsAt: string;
  endsAt: string;

  location: string;

  /** Cloudinary secure_url. Empty string when no image. */
  imageUrl: string;
  /** Cloudinary public_id. Null when no image. */
  imagePublicId: string | null;

  isFeatured: boolean;
  status: EventStatus;
  publishedAt: string | null;

  createdBy: string;
  createdByRole: UserRole;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;

  createdAt: string;
  updatedAt: string;
}

export type PublicEvent = Omit<
  Event,
  'reviewNote' | 'reviewedBy' | 'reviewedAt' | 'createdBy' | 'createdByRole'
>;

export interface EventInput {
  title: string;
  summary: string;
  content: string;
  organizer: string;
  category: EventCategory;
  /** ISO 8601 string. */
  startsAt: string;
  endsAt: string;
  location: string;
  imageUrl: string;
  imagePublicId: string | null;
  isFeatured: boolean;
}

export interface EventSummary {
  id: string;
  title: string;
  summary: string;
  organizer: string;
  category: EventCategory;
  startsAt: string;
  endsAt: string;
  location: string;
  imageUrl: string;
  isFeatured: boolean;
  status: EventStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicEventSummary = Omit<EventSummary, 'status'>;

// ─── API response types ──────────────────────────────────────────────────────

export interface PaginatedEvents {
  items: PublicEventSummary[];
  total: number;
}

export interface ListPublishedEventsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: EventCategory;
  featuredOnly?: boolean;
}

/**
 * Raw shape returned by POST /events/admin/upload/image.
 *
 * These are Cloudinary's names, not the event's. The server sends
 * `{ url, publicId }`. The `uploadEventImage` thunk below remaps them
 * into the event-shaped `UploadedImage` before resolving.
 */
export interface UploadEventImageResult {
  url: string;
  publicId: string;
}

/**
 * What the `uploadEventImage` thunk resolves to: article-shaped names,
 * ready to drop straight into `EventInput` / `Event`.
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

interface EventsState {
  // Public list
  publicItems: PublicEventSummary[];
  publicTotal: number;
  isLoadingPublic: boolean;
  publicError: string | null;

  // Public single event
  publicEvent: PublicEvent | null;
  isLoadingPublicEvent: boolean;
  publicEventError: string | null;

  // Admin list (all statuses)
  adminItems: EventSummary[];
  isLoadingAdmin: boolean;
  adminError: string | null;

  // Super admin review queue
  pendingItems: EventSummary[];
  isLoadingPending: boolean;
  pendingError: string | null;

  // Admin: currently-open event (editor)
  current: Event | null;
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

const initialState: EventsState = {
  publicItems: [],
  publicTotal: 0,
  isLoadingPublic: false,
  publicError: null,

  publicEvent: null,
  isLoadingPublicEvent: false,
  publicEventError: null,

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

// Base path — must match `app.use('/api/v1/events', eventsRoutes)`.
// `axiosClient` already carries the `/api/v1` prefix on its baseURL.
const EVENTS_BASE = '/events';

// ─── Public thunks ───────────────────────────────────────────────────────────

export const fetchPublishedEvents = createAsyncThunk(
  'events/fetchPublishedEvents',
  async (params: ListPublishedEventsParams = {}, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<PaginatedEvents>>(
        `${EVENTS_BASE}`,
        { params },
      );
      return unwrap<PaginatedEvents>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchPublishedEventById = createAsyncThunk(
  'events/fetchPublishedEventById',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<PublicEvent>>(
        `${EVENTS_BASE}/${eventId}`,
      );
      return unwrap<PublicEvent>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Admin read thunks ───────────────────────────────────────────────────────

export const fetchAllEvents = createAsyncThunk(
  'events/fetchAllEvents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<EventSummary[]>>(
        `${EVENTS_BASE}/admin/all`,
      );
      return unwrap<EventSummary[]>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchPendingEvents = createAsyncThunk(
  'events/fetchPendingEvents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<EventSummary[]>>(
        `${EVENTS_BASE}/admin/pending`,
      );
      return unwrap<EventSummary[]>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchEventById = createAsyncThunk(
  'events/fetchEventById',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<Event>>(
        `${EVENTS_BASE}/admin/${eventId}`,
      );
      return unwrap<Event>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Admin write thunks ──────────────────────────────────────────────────────

export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (payload: EventInput, { rejectWithValue }) => {
    try {
      // Route expects Body: { payload: EventInput }
      const response = await axiosClient.post<ApiEnvelope<Event>>(
        `${EVENTS_BASE}/admin`,
        { payload },
      );
      return unwrap<Event>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async (
    args: { eventId: string; payload: Partial<EventInput> },
    { rejectWithValue },
  ) => {
    try {
      // Route expects Body: { payload: Partial<EventInput> }
      const response = await axiosClient.patch<ApiEnvelope<Event>>(
        `${EVENTS_BASE}/admin/${args.eventId}`,
        { payload: args.payload },
      );
      return unwrap<Event>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const submitEvent = createAsyncThunk(
  'events/submitEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<Event>>(
        `${EVENTS_BASE}/admin/${eventId}/submit`,
        {},
      );
      return unwrap<Event>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const deleteEvent = createAsyncThunk(
  'events/deleteEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`${EVENTS_BASE}/admin/${eventId}`);
      return eventId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Super admin review thunks ───────────────────────────────────────────────

export const approveEvent = createAsyncThunk(
  'events/approveEvent',
  async (
    args: { eventId: string; reviewNote?: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<Event>>(
        `${EVENTS_BASE}/admin/${args.eventId}/approve`,
        { reviewNote: args.reviewNote },
      );
      return unwrap<Event>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const rejectEvent = createAsyncThunk(
  'events/rejectEvent',
  async (
    args: { eventId: string; reviewNote: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<Event>>(
        `${EVENTS_BASE}/admin/${args.eventId}/reject`,
        { reviewNote: args.reviewNote },
      );
      return unwrap<Event>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const setFeaturedEvent = createAsyncThunk(
  'events/setFeaturedEvent',
  async (
    args: { eventId: string; isFeatured: boolean },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<Event>>(
        `${EVENTS_BASE}/admin/${args.eventId}/feature`,
        { isFeatured: args.isFeatured },
      );
      return unwrap<Event>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Upload thunk ────────────────────────────────────────────────────────────
//
// Two shapes are in play:
//   - `UploadEventImageResult` — the raw HTTP response from the backend,
//     which uses Cloudinary's names: { url, publicId }.
//   - `UploadedImage` — what this thunk resolves to, which uses the
//     event's names: { imageUrl, imagePublicId }.
//
// The remap happens here, once. No component ever sees `{ url, publicId }`.

export const uploadEventImage = createAsyncThunk<
  UploadedImage,
  File,
  { rejectValue: string }
>(
  'events/uploadEventImage',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      // Route: upload.single('image')
      formData.append('image', file);

      const response = await axiosClient.post<
        ApiEnvelope<UploadEventImageResult>
      >(
        `${EVENTS_BASE}/admin/upload/image`,
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

      const raw = unwrap<UploadEventImageResult>(response);

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

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearPublicError: (state) => {
      state.publicError = null;
    },
    clearPublicEvent: (state) => {
      state.publicEvent = null;
      state.publicEventError = null;
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
      .addCase(fetchPublishedEvents.pending, (state) => {
        state.isLoadingPublic = true;
        state.publicError = null;
      })
      .addCase(
        fetchPublishedEvents.fulfilled,
        (state, action: PayloadAction<PaginatedEvents>) => {
          state.isLoadingPublic = false;
          state.publicItems = action.payload.items;
          state.publicTotal = action.payload.total;
        },
      )
      .addCase(fetchPublishedEvents.rejected, (state, action) => {
        state.isLoadingPublic = false;
        state.publicError = action.payload as string;
      })

      // ── Public single event ───────────────────────────────────────────────
      .addCase(fetchPublishedEventById.pending, (state) => {
        state.isLoadingPublicEvent = true;
        state.publicEventError = null;
      })
      .addCase(
        fetchPublishedEventById.fulfilled,
        (state, action: PayloadAction<PublicEvent>) => {
          state.isLoadingPublicEvent = false;
          state.publicEvent = action.payload;
        },
      )
      .addCase(fetchPublishedEventById.rejected, (state, action) => {
        state.isLoadingPublicEvent = false;
        state.publicEventError = action.payload as string;
      })

      // ── Admin list ────────────────────────────────────────────────────────
      .addCase(fetchAllEvents.pending, (state) => {
        state.isLoadingAdmin = true;
        state.adminError = null;
      })
      .addCase(
        fetchAllEvents.fulfilled,
        (state, action: PayloadAction<EventSummary[]>) => {
          state.isLoadingAdmin = false;
          state.adminItems = action.payload;
        },
      )
      .addCase(fetchAllEvents.rejected, (state, action) => {
        state.isLoadingAdmin = false;
        state.adminError = action.payload as string;
      })

      // ── Pending queue ─────────────────────────────────────────────────────
      .addCase(fetchPendingEvents.pending, (state) => {
        state.isLoadingPending = true;
        state.pendingError = null;
      })
      .addCase(
        fetchPendingEvents.fulfilled,
        (state, action: PayloadAction<EventSummary[]>) => {
          state.isLoadingPending = false;
          state.pendingItems = action.payload;
        },
      )
      .addCase(fetchPendingEvents.rejected, (state, action) => {
        state.isLoadingPending = false;
        state.pendingError = action.payload as string;
      })

      // ── Admin: current event ──────────────────────────────────────────────
      .addCase(fetchEventById.pending, (state) => {
        state.isLoadingCurrent = true;
        state.currentError = null;
      })
      .addCase(
        fetchEventById.fulfilled,
        (state, action: PayloadAction<Event>) => {
          state.isLoadingCurrent = false;
          state.current = action.payload;
        },
      )
      .addCase(fetchEventById.rejected, (state, action) => {
        state.isLoadingCurrent = false;
        state.currentError = action.payload as string;
      })

      // ── Create ────────────────────────────────────────────────────────────
      .addCase(createEvent.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        createEvent.fulfilled,
        (state, action: PayloadAction<Event>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.current = action.payload;
        },
      )
      .addCase(createEvent.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Update ────────────────────────────────────────────────────────────
      .addCase(updateEvent.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        updateEvent.fulfilled,
        (state, action: PayloadAction<Event>) => {
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
                  organizer: action.payload.organizer,
                  category: action.payload.category,
                  startsAt: action.payload.startsAt,
                  endsAt: action.payload.endsAt,
                  location: action.payload.location,
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
      .addCase(updateEvent.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Submit ────────────────────────────────────────────────────────────
      .addCase(submitEvent.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        submitEvent.fulfilled,
        (state, action: PayloadAction<Event>) => {
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
      .addCase(submitEvent.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      // ── Delete ────────────────────────────────────────────────────────────
      .addCase(deleteEvent.pending, (state) => {
        state.isDeleting = true;
        state.deleteError = null;
      })
      .addCase(
        deleteEvent.fulfilled,
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
      .addCase(deleteEvent.rejected, (state, action) => {
        state.isDeleting = false;
        state.deleteError = action.payload as string;
      })

      // ── Approve ───────────────────────────────────────────────────────────
      .addCase(approveEvent.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(
        approveEvent.fulfilled,
        (state, action: PayloadAction<Event>) => {
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
      .addCase(approveEvent.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      })

      // ── Reject ────────────────────────────────────────────────────────────
      .addCase(rejectEvent.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(
        rejectEvent.fulfilled,
        (state, action: PayloadAction<Event>) => {
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
      .addCase(rejectEvent.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      })

      // ── Feature toggle ────────────────────────────────────────────────────
      .addCase(setFeaturedEvent.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(
        setFeaturedEvent.fulfilled,
        (state, action: PayloadAction<Event>) => {
          state.isReviewing = false;
          state.reviewSuccess = true;
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
      .addCase(setFeaturedEvent.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      })

      // ── Upload ────────────────────────────────────────────────────────────
      .addCase(uploadEventImage.pending, (state) => {
        state.isUploading = true;
        state.uploadError = null;
      })
      .addCase(uploadEventImage.fulfilled, (state) => {
        state.isUploading = false;
        // Result is returned to the caller, not stored — the event
        // it belongs to is local component state until saved.
      })
      .addCase(uploadEventImage.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadError = action.payload as string;
      });
  },
});

export const {
  clearPublicError,
  clearPublicEvent,
  clearAdminError,
  clearPendingError,
  clearCurrent,
  clearCurrentError,
  clearSaveState,
  clearReviewState,
  clearUploadError,
  clearDeleteError,
} = eventsSlice.actions;

export default eventsSlice.reducer;