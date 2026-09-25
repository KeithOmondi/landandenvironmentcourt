// src/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import heroReducer from "./slices/heroSlice"
import newsReducer from "./slices/newsSlice"
import eventsReducer from './slices/eventsSlice';
import publicationsReducer from './slices/publicationsSlice';
import documentsReducer from './slices/documentsSlice';
import judgesReducer from './slices/judgesSlice';
import principalJudgesReducer from "./slices/principalJudgesSlice"
import contactReducer from './slices/contactSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hero: heroReducer,
    news: newsReducer,
    events: eventsReducer,
    publications: publicationsReducer, 
    documents: documentsReducer,
    judges: judgesReducer,
    principalJudges: principalJudgesReducer,
    contact: contactReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;