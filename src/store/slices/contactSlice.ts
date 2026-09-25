// src/store/slices/contactSlice.ts
//
// Redux slice for the Contact feature.
//
// Three resources in one slice:
//   - ContactStation — authored content, standard pipeline.
//   - ContactPage    — authored content, singleton.
//   - ContactMessage — inbound content, intake queue.
//
// The slice does not own authorization. Both admins and super admins
// dispatch the same thunks; the server decides who may act on which
// record. The UI renders buttons the caller is allowed to use.
//
// Image handling (stations only):
//   - Portraits travel as multipart, sibling to `payload`.
//   - On update, omitting the file means "leave the existing portrait
//     alone".
//
// Route prefix: app.use('/api/v1/contact', contactRoutes)

import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { AxiosError, type AxiosResponse } from 'axios';
import axiosClient from '../../api/api';

// ═══════════════════════════════════════════════════════════════════════════
// Types — mirror contact.types.ts
// ═══════════════════════════════════════════════════════════════════════════

export type ContactStatus = 'draft' | 'pending' | 'published' | 'rejected';
export type ContactMessageStatus = 'new' | 'read' | 'handled' | 'archived';

export interface ImageAsset {
  publicId: string;
  url: string;
}

export interface ContactStation {
  id: string;
  station: string;
  poBox: string | null;
  phone: string | null;
  email: string | null;
  image: ImageAsset | null;
  status: ContactStatus;
  publishedAt: string | null;
  createdBy: string;
  createdByRole: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicContactStation = Omit<
  ContactStation,
  'reviewNote' | 'reviewedBy' | 'reviewedAt' | 'createdBy' | 'createdByRole'
>;

export interface ContactStationInput {
  station: string;
  poBox: string | null;
  phone: string | null;
  email: string | null;
}

export interface ContactPage {
  id: string;
  heroBadge: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  getInTouchHeading: string;
  getInTouchSubtitle: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  formHeading: string;
  formSubtitle: string;
  directoryHeading: string;
  directorySubtitle: string;
  status: ContactStatus;
  publishedAt: string | null;
  createdBy: string;
  createdByRole: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicContactPage = Omit<
  ContactPage,
  'reviewNote' | 'reviewedBy' | 'reviewedAt' | 'createdBy' | 'createdByRole'
>;

export interface ContactPageInput {
  heroBadge: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  getInTouchHeading: string;
  getInTouchSubtitle: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  formHeading: string;
  formSubtitle: string;
  directoryHeading: string;
  directorySubtitle: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: ContactMessageStatus;
  readBy: string | null;
  readAt: string | null;
  handledBy: string | null;
  handledAt: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessageInput {
  name: string;
  email: string;
  subject: string | null;
  message: string;
}

export interface ContactMessageUpdateInput {
  status?: ContactMessageStatus;
  adminNote?: string | null;
}

export interface PublicContactView {
  page: PublicContactPage | null;
  stations: PublicContactStation[];
}

// ─── API response envelopes ─────────────────────────────────────────────────

interface ApiEnvelope<T> {
  status: string;
  message?: string;
  data: T;
}

export interface PaginatedMessages {
  items: ContactMessage[];
  total: number;
}

export interface ListMessagesParams {
  status?: ContactMessageStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export type MessageCounts = Record<ContactMessageStatus, number>;

// ═══════════════════════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════════════════════

interface ContactState {
  // Public combined view
  publicView: PublicContactView | null;
  isLoadingPublicView: boolean;
  publicViewError: string | null;

  // Public single station
  publicStation: PublicContactStation | null;
  isLoadingPublicStation: boolean;
  publicStationError: string | null;

  // Public message submission
  isSubmittingMessage: boolean;
  submitMessageError: string | null;
  submitMessageSuccess: boolean;

  // Admin: stations
  adminStations: ContactStation[];
  isLoadingAdminStations: boolean;
  adminStationsError: string | null;

  pendingStations: ContactStation[];
  isLoadingPendingStations: boolean;
  pendingStationsError: string | null;

  currentStation: ContactStation | null;
  isLoadingCurrentStation: boolean;
  currentStationError: string | null;

  // Admin: page
  currentPage: ContactPage | null;
  isLoadingCurrentPage: boolean;
  currentPageError: string | null;

  // Admin: messages
  messages: ContactMessage[];
  messagesTotal: number;
  isLoadingMessages: boolean;
  messagesError: string | null;

  messageCounts: MessageCounts | null;
  isLoadingMessageCounts: boolean;

  currentMessage: ContactMessage | null;
  isLoadingCurrentMessage: boolean;
  currentMessageError: string | null;

  // Shared write flags
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;

  isReviewing: boolean;
  reviewError: string | null;
  reviewSuccess: boolean;

  isDeleting: boolean;
  deleteError: string | null;
}

const initialState: ContactState = {
  publicView: null,
  isLoadingPublicView: false,
  publicViewError: null,

  publicStation: null,
  isLoadingPublicStation: false,
  publicStationError: null,

  isSubmittingMessage: false,
  submitMessageError: null,
  submitMessageSuccess: false,

  adminStations: [],
  isLoadingAdminStations: false,
  adminStationsError: null,

  pendingStations: [],
  isLoadingPendingStations: false,
  pendingStationsError: null,

  currentStation: null,
  isLoadingCurrentStation: false,
  currentStationError: null,

  currentPage: null,
  isLoadingCurrentPage: false,
  currentPageError: null,

  messages: [],
  messagesTotal: 0,
  isLoadingMessages: false,
  messagesError: null,

  messageCounts: null,
  isLoadingMessageCounts: false,

  currentMessage: null,
  isLoadingCurrentMessage: false,
  currentMessageError: null,

  isSaving: false,
  saveError: null,
  saveSuccess: false,

  isReviewing: false,
  reviewError: null,
  reviewSuccess: false,

  isDeleting: false,
  deleteError: null,
};

// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════

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
  if (body && typeof body === 'object' && 'data' in body && 'status' in body) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
};

/**
 * Build the multipart body for station create/update. Same helper as
 * every other feature with images.
 *
 * Do NOT set `Content-Type` manually on the axios call. The browser
 * must inject the multipart boundary; the axios instance has no
 * default header for exactly this reason.
 */
const buildStationFormData = (
  payload: Partial<ContactStationInput>,
  image?: File | null,
): FormData => {
  const form = new FormData();
  form.append('payload', JSON.stringify(payload));
  if (image) form.append('image', image);
  return form;
};

const BASE = '/contact';

// ═══════════════════════════════════════════════════════════════════════════
// Public thunks
// ═══════════════════════════════════════════════════════════════════════════

export const fetchPublicContactView = createAsyncThunk(
  'contact/fetchPublicContactView',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<PublicContactView>>(
        `${BASE}/view`,
      );
      return unwrap<PublicContactView>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchPublishedStationById = createAsyncThunk(
  'contact/fetchPublishedStationById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<PublicContactStation>>(
        `${BASE}/stations/${id}`,
      );
      return unwrap<PublicContactStation>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Submit a message from the public form.
 *
 * The honeypot is included on the client as a hidden field named
 * `_gotcha`. It's part of the FormData or JSON body, sibling to
 * `payload`. The server silently discards the submission if it's
 * non-empty, but responds 201 either way.
 */
export const submitContactMessage = createAsyncThunk(
  'contact/submitContactMessage',
  async (
    args: { payload: ContactMessageInput; honeypot?: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<ContactMessage | null>>(
        `${BASE}/messages`,
        { payload: args.payload, _gotcha: args.honeypot ?? '' },
      );
      return unwrap<ContactMessage | null>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// ContactStation thunks
// ═══════════════════════════════════════════════════════════════════════════

export const fetchAllStations = createAsyncThunk(
  'contact/fetchAllStations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<ContactStation[]>>(
        `${BASE}/admin/stations/all`,
      );
      return unwrap<ContactStation[]>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchPendingStations = createAsyncThunk(
  'contact/fetchPendingStations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<ContactStation[]>>(
        `${BASE}/admin/stations/pending`,
      );
      return unwrap<ContactStation[]>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchStationById = createAsyncThunk(
  'contact/fetchStationById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<ContactStation>>(
        `${BASE}/admin/stations/${id}`,
      );
      return unwrap<ContactStation>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const createStation = createAsyncThunk(
  'contact/createStation',
  async (
    args: { payload: ContactStationInput; image?: File | null },
    { rejectWithValue },
  ) => {
    try {
      const form = buildStationFormData(args.payload, args.image);
      const response = await axiosClient.post<ApiEnvelope<ContactStation>>(
        `${BASE}/admin/stations`,
        form,
      );
      return unwrap<ContactStation>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateStation = createAsyncThunk(
  'contact/updateStation',
  async (
    args: {
      id: string;
      payload: Partial<ContactStationInput>;
      image?: File | null;
    },
    { rejectWithValue },
  ) => {
    try {
      const form = buildStationFormData(args.payload, args.image);
      const response = await axiosClient.patch<ApiEnvelope<ContactStation>>(
        `${BASE}/admin/stations/${args.id}`,
        form,
      );
      return unwrap<ContactStation>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const submitStation = createAsyncThunk(
  'contact/submitStation',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<ContactStation>>(
        `${BASE}/admin/stations/${id}/submit`,
        {},
      );
      return unwrap<ContactStation>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const deleteStation = createAsyncThunk(
  'contact/deleteStation',
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`${BASE}/admin/stations/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const approveStation = createAsyncThunk(
  'contact/approveStation',
  async (
    args: { id: string; reviewNote?: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<ContactStation>>(
        `${BASE}/admin/stations/${args.id}/approve`,
        { reviewNote: args.reviewNote },
      );
      return unwrap<ContactStation>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const rejectStation = createAsyncThunk(
  'contact/rejectStation',
  async (
    args: { id: string; reviewNote: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<ContactStation>>(
        `${BASE}/admin/stations/${args.id}/reject`,
        { reviewNote: args.reviewNote },
      );
      return unwrap<ContactStation>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// ContactPage thunks
// ═══════════════════════════════════════════════════════════════════════════

export const fetchPage = createAsyncThunk(
  'contact/fetchPage',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<ContactPage>>(
        `${BASE}/admin/page`,
      );
      return unwrap<ContactPage>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const createPage = createAsyncThunk(
  'contact/createPage',
  async (payload: ContactPageInput, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<ContactPage>>(
        `${BASE}/admin/page`,
        { payload },
      );
      return unwrap<ContactPage>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updatePage = createAsyncThunk(
  'contact/updatePage',
  async (payload: Partial<ContactPageInput>, { rejectWithValue }) => {
    try {
      const response = await axiosClient.patch<ApiEnvelope<ContactPage>>(
        `${BASE}/admin/page`,
        { payload },
      );
      return unwrap<ContactPage>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const submitPage = createAsyncThunk(
  'contact/submitPage',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<ContactPage>>(
        `${BASE}/admin/page/submit`,
        {},
      );
      return unwrap<ContactPage>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const approvePage = createAsyncThunk(
  'contact/approvePage',
  async (args: { reviewNote?: string }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<ContactPage>>(
        `${BASE}/admin/page/approve`,
        { reviewNote: args.reviewNote },
      );
      return unwrap<ContactPage>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const rejectPage = createAsyncThunk(
  'contact/rejectPage',
  async (args: { reviewNote: string }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post<ApiEnvelope<ContactPage>>(
        `${BASE}/admin/page/reject`,
        { reviewNote: args.reviewNote },
      );
      return unwrap<ContactPage>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// ContactMessage thunks
// ═══════════════════════════════════════════════════════════════════════════

export const fetchMessages = createAsyncThunk(
  'contact/fetchMessages',
  async (params: ListMessagesParams = {}, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<PaginatedMessages>>(
        `${BASE}/admin/messages`,
        { params },
      );
      return unwrap<PaginatedMessages>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchMessageCounts = createAsyncThunk(
  'contact/fetchMessageCounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<MessageCounts>>(
        `${BASE}/admin/messages/counts`,
      );
      return unwrap<MessageCounts>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchMessageById = createAsyncThunk(
  'contact/fetchMessageById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<ApiEnvelope<ContactMessage>>(
        `${BASE}/admin/messages/${id}`,
      );
      return unwrap<ContactMessage>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateMessage = createAsyncThunk(
  'contact/updateMessage',
  async (
    args: { id: string; payload: ContactMessageUpdateInput },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosClient.patch<ApiEnvelope<ContactMessage>>(
        `${BASE}/admin/messages/${args.id}`,
        { payload: args.payload },
      );
      return unwrap<ContactMessage>(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// Slice
// ═══════════════════════════════════════════════════════════════════════════

const contactSlice = createSlice({
  name: 'contact',
  initialState,
  reducers: {
    clearPublicViewError: (state) => {
      state.publicViewError = null;
    },
    clearPublicStation: (state) => {
      state.publicStation = null;
      state.publicStationError = null;
    },
    clearSubmitMessageState: (state) => {
      state.submitMessageError = null;
      state.submitMessageSuccess = false;
    },
    clearAdminStationsError: (state) => {
      state.adminStationsError = null;
    },
    clearPendingStationsError: (state) => {
      state.pendingStationsError = null;
    },
    clearCurrentStation: (state) => {
      state.currentStation = null;
      state.currentStationError = null;
      state.saveError = null;
      state.saveSuccess = false;
    },
    clearCurrentPage: (state) => {
      state.currentPage = null;
      state.currentPageError = null;
      state.saveError = null;
      state.saveSuccess = false;
    },
    clearMessagesError: (state) => {
      state.messagesError = null;
    },
    clearCurrentMessage: (state) => {
      state.currentMessage = null;
      state.currentMessageError = null;
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
      // ── Public view ───────────────────────────────────────────────────────
      .addCase(fetchPublicContactView.pending, (state) => {
        state.isLoadingPublicView = true;
        state.publicViewError = null;
      })
      .addCase(
        fetchPublicContactView.fulfilled,
        (state, action: PayloadAction<PublicContactView>) => {
          state.isLoadingPublicView = false;
          state.publicView = action.payload;
        },
      )
      .addCase(fetchPublicContactView.rejected, (state, action) => {
        state.isLoadingPublicView = false;
        state.publicViewError = action.payload as string;
      })

      // ── Public station ────────────────────────────────────────────────────
      .addCase(fetchPublishedStationById.pending, (state) => {
        state.isLoadingPublicStation = true;
        state.publicStationError = null;
      })
      .addCase(
        fetchPublishedStationById.fulfilled,
        (state, action: PayloadAction<PublicContactStation>) => {
          state.isLoadingPublicStation = false;
          state.publicStation = action.payload;
        },
      )
      .addCase(fetchPublishedStationById.rejected, (state, action) => {
        state.isLoadingPublicStation = false;
        state.publicStationError = action.payload as string;
      })

      // ── Public message submission ─────────────────────────────────────────
      .addCase(submitContactMessage.pending, (state) => {
        state.isSubmittingMessage = true;
        state.submitMessageError = null;
        state.submitMessageSuccess = false;
      })
      .addCase(submitContactMessage.fulfilled, (state) => {
        state.isSubmittingMessage = false;
        state.submitMessageSuccess = true;
        // `action.payload` may be null (honeypot trip). Either way,
        // from the client's perspective the submission succeeded.
      })
      .addCase(submitContactMessage.rejected, (state, action) => {
        state.isSubmittingMessage = false;
        state.submitMessageError = action.payload as string;
        state.submitMessageSuccess = false;
      })

      // ── Admin stations list ───────────────────────────────────────────────
      .addCase(fetchAllStations.pending, (state) => {
        state.isLoadingAdminStations = true;
        state.adminStationsError = null;
      })
      .addCase(
        fetchAllStations.fulfilled,
        (state, action: PayloadAction<ContactStation[]>) => {
          state.isLoadingAdminStations = false;
          state.adminStations = action.payload;
        },
      )
      .addCase(fetchAllStations.rejected, (state, action) => {
        state.isLoadingAdminStations = false;
        state.adminStationsError = action.payload as string;
      })

      // ── Pending stations ──────────────────────────────────────────────────
      .addCase(fetchPendingStations.pending, (state) => {
        state.isLoadingPendingStations = true;
        state.pendingStationsError = null;
      })
      .addCase(
        fetchPendingStations.fulfilled,
        (state, action: PayloadAction<ContactStation[]>) => {
          state.isLoadingPendingStations = false;
          state.pendingStations = action.payload;
        },
      )
      .addCase(fetchPendingStations.rejected, (state, action) => {
        state.isLoadingPendingStations = false;
        state.pendingStationsError = action.payload as string;
      })

      // ── Current station ───────────────────────────────────────────────────
      .addCase(fetchStationById.pending, (state) => {
        state.isLoadingCurrentStation = true;
        state.currentStationError = null;
      })
      .addCase(
        fetchStationById.fulfilled,
        (state, action: PayloadAction<ContactStation>) => {
          state.isLoadingCurrentStation = false;
          state.currentStation = action.payload;
        },
      )
      .addCase(fetchStationById.rejected, (state, action) => {
        state.isLoadingCurrentStation = false;
        state.currentStationError = action.payload as string;
      })

      // ── Station writes ────────────────────────────────────────────────────
      .addCase(createStation.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        createStation.fulfilled,
        (state, action: PayloadAction<ContactStation>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.currentStation = action.payload;
        },
      )
      .addCase(createStation.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      .addCase(updateStation.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        updateStation.fulfilled,
        (state, action: PayloadAction<ContactStation>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.currentStation = action.payload;
          state.adminStations = state.adminStations.map((s) =>
            s.id === action.payload.id ? action.payload : s,
          );
        },
      )
      .addCase(updateStation.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      .addCase(submitStation.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        submitStation.fulfilled,
        (state, action: PayloadAction<ContactStation>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.adminStations = state.adminStations.map((s) =>
            s.id === action.payload.id ? action.payload : s,
          );
        },
      )
      .addCase(submitStation.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      .addCase(deleteStation.pending, (state) => {
        state.isDeleting = true;
        state.deleteError = null;
      })
      .addCase(
        deleteStation.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.isDeleting = false;
          state.adminStations = state.adminStations.filter(
            (s) => s.id !== action.payload,
          );
          state.pendingStations = state.pendingStations.filter(
            (s) => s.id !== action.payload,
          );
          if (state.currentStation?.id === action.payload) {
            state.currentStation = null;
          }
        },
      )
      .addCase(deleteStation.rejected, (state, action) => {
        state.isDeleting = false;
        state.deleteError = action.payload as string;
      })

      // ── Station review ────────────────────────────────────────────────────
      .addCase(approveStation.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(
        approveStation.fulfilled,
        (state, action: PayloadAction<ContactStation>) => {
          state.isReviewing = false;
          state.reviewSuccess = true;
          state.pendingStations = state.pendingStations.filter(
            (s) => s.id !== action.payload.id,
          );
          state.adminStations = state.adminStations.map((s) =>
            s.id === action.payload.id ? action.payload : s,
          );
        },
      )
      .addCase(approveStation.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      })

      .addCase(rejectStation.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(
        rejectStation.fulfilled,
        (state, action: PayloadAction<ContactStation>) => {
          state.isReviewing = false;
          state.reviewSuccess = true;
          state.pendingStations = state.pendingStations.filter(
            (s) => s.id !== action.payload.id,
          );
          state.adminStations = state.adminStations.map((s) =>
            s.id === action.payload.id ? action.payload : s,
          );
        },
      )
      .addCase(rejectStation.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      })

      // ── Page ──────────────────────────────────────────────────────────────
      .addCase(fetchPage.pending, (state) => {
        state.isLoadingCurrentPage = true;
        state.currentPageError = null;
      })
      .addCase(
        fetchPage.fulfilled,
        (state, action: PayloadAction<ContactPage>) => {
          state.isLoadingCurrentPage = false;
          state.currentPage = action.payload;
        },
      )
      .addCase(fetchPage.rejected, (state, action) => {
        state.isLoadingCurrentPage = false;
        state.currentPageError = action.payload as string;
      })

      .addCase(createPage.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        createPage.fulfilled,
        (state, action: PayloadAction<ContactPage>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.currentPage = action.payload;
        },
      )
      .addCase(createPage.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      .addCase(updatePage.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        updatePage.fulfilled,
        (state, action: PayloadAction<ContactPage>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.currentPage = action.payload;
        },
      )
      .addCase(updatePage.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      .addCase(submitPage.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        submitPage.fulfilled,
        (state, action: PayloadAction<ContactPage>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.currentPage = action.payload;
        },
      )
      .addCase(submitPage.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      })

      .addCase(approvePage.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(
        approvePage.fulfilled,
        (state, action: PayloadAction<ContactPage>) => {
          state.isReviewing = false;
          state.reviewSuccess = true;
          state.currentPage = action.payload;
        },
      )
      .addCase(approvePage.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      })

      .addCase(rejectPage.pending, (state) => {
        state.isReviewing = true;
        state.reviewError = null;
        state.reviewSuccess = false;
      })
      .addCase(
        rejectPage.fulfilled,
        (state, action: PayloadAction<ContactPage>) => {
          state.isReviewing = false;
          state.reviewSuccess = true;
          state.currentPage = action.payload;
        },
      )
      .addCase(rejectPage.rejected, (state, action) => {
        state.isReviewing = false;
        state.reviewError = action.payload as string;
        state.reviewSuccess = false;
      })

      // ── Messages ──────────────────────────────────────────────────────────
      .addCase(fetchMessages.pending, (state) => {
        state.isLoadingMessages = true;
        state.messagesError = null;
      })
      .addCase(
        fetchMessages.fulfilled,
        (state, action: PayloadAction<PaginatedMessages>) => {
          state.isLoadingMessages = false;
          state.messages = action.payload.items;
          state.messagesTotal = action.payload.total;
        },
      )
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.messagesError = action.payload as string;
      })

      .addCase(fetchMessageCounts.pending, (state) => {
        state.isLoadingMessageCounts = true;
      })
      .addCase(
        fetchMessageCounts.fulfilled,
        (state, action: PayloadAction<MessageCounts>) => {
          state.isLoadingMessageCounts = false;
          state.messageCounts = action.payload;
        },
      )
      .addCase(fetchMessageCounts.rejected, (state) => {
        state.isLoadingMessageCounts = false;
      })

      .addCase(fetchMessageById.pending, (state) => {
        state.isLoadingCurrentMessage = true;
        state.currentMessageError = null;
      })
      .addCase(
        fetchMessageById.fulfilled,
        (state, action: PayloadAction<ContactMessage>) => {
          state.isLoadingCurrentMessage = false;
          state.currentMessage = action.payload;
          // The server side effect may have moved new → read. Patch
          // the list so the row reflects the new status without a
          // refetch.
          state.messages = state.messages.map((m) =>
            m.id === action.payload.id ? action.payload : m,
          );
        },
      )
      .addCase(fetchMessageById.rejected, (state, action) => {
        state.isLoadingCurrentMessage = false;
        state.currentMessageError = action.payload as string;
      })

      .addCase(updateMessage.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
        state.saveSuccess = false;
      })
      .addCase(
        updateMessage.fulfilled,
        (state, action: PayloadAction<ContactMessage>) => {
          state.isSaving = false;
          state.saveSuccess = true;
          state.currentMessage = action.payload;
          state.messages = state.messages.map((m) =>
            m.id === action.payload.id ? action.payload : m,
          );
        },
      )
      .addCase(updateMessage.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload as string;
        state.saveSuccess = false;
      });
  },
});

export const {
  clearPublicViewError,
  clearPublicStation,
  clearSubmitMessageState,
  clearAdminStationsError,
  clearPendingStationsError,
  clearCurrentStation,
  clearCurrentPage,
  clearMessagesError,
  clearCurrentMessage,
  clearSaveState,
  clearReviewState,
  clearDeleteError,
} = contactSlice.actions;

export default contactSlice.reducer;