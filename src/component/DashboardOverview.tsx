// src/component/DashboardOverview.tsx
//
// Shared dashboard for /admin and /super-admin. Pulls the "all records"
// list of each content feature and summarises it: counts by status, what
// needs review, recent activity, and shortcuts. `basePath` decides where
// links point; `isSuperAdmin` changes the wording around review.

import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Newspaper,
  CalendarDays,
  BookOpen,
  FileText,
  Gavel,
  Clock,
  CheckCircle2,
  FilePen,
  XCircle,
  Plus,
  ArrowRight,
  Inbox,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { fetchAllNews } from '../store/slices/newsSlice';
import { fetchAllEvents } from '../store/slices/eventsSlice';
import { fetchAllPublications } from '../store/slices/publicationsSlice';
import { fetchAllDocuments } from '../store/slices/documentsSlice';
import { fetchAllJudges } from '../store/slices/judgesSlice';
import type { AppDispatch, RootState } from '../store/store';

type Status = 'draft' | 'pending' | 'published' | 'rejected';

interface Row {
  id: string;
  label: string;
  status: Status;
  updatedAt: string;
}

interface SectionDef {
  key: string;
  name: string;
  path: string;
  icon: LucideIcon;
  rows: Row[];
  loading: boolean;
}

const statusStyle: Record<Status, string> = {
  draft: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-800',
  published: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const DashboardOverview = ({
  basePath,
  isSuperAdmin,
}: {
  basePath: string;
  isSuperAdmin: boolean;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const news = useSelector((s: RootState) => s.news);
  const events = useSelector((s: RootState) => s.events);
  const publications = useSelector((s: RootState) => s.publications);
  const documents = useSelector((s: RootState) => s.documents);
  const judges = useSelector((s: RootState) => s.judges);

  useEffect(() => {
    dispatch(fetchAllNews());
    dispatch(fetchAllEvents());
    dispatch(fetchAllPublications());
    dispatch(fetchAllDocuments());
    dispatch(fetchAllJudges());
  }, [dispatch]);

  const sections: SectionDef[] = useMemo(
    () => [
      {
        key: 'news',
        name: 'News',
        path: 'news',
        icon: Newspaper,
        loading: news.isLoadingAdmin,
        rows: news.adminItems.map((i) => ({
          id: i.id,
          label: i.title,
          status: i.status,
          updatedAt: i.updatedAt,
        })),
      },
      {
        key: 'events',
        name: 'Events',
        path: 'events',
        icon: CalendarDays,
        loading: events.isLoadingAdmin,
        rows: events.adminItems.map((i) => ({
          id: i.id,
          label: i.title,
          status: i.status,
          updatedAt: i.updatedAt,
        })),
      },
      {
        key: 'publications',
        name: 'Publications',
        path: 'publications',
        icon: BookOpen,
        loading: publications.isLoadingAdmin,
        rows: publications.adminItems.map((i) => ({
          id: i.id,
          label: i.title,
          status: i.status,
          updatedAt: i.updatedAt,
        })),
      },
      {
        key: 'documents',
        name: 'Documents',
        path: 'documents',
        icon: FileText,
        loading: documents.isLoadingAdmin,
        rows: documents.adminItems.map((i) => ({
          id: i.id,
          label: i.title,
          status: i.status,
          updatedAt: i.updatedAt,
        })),
      },
      {
        key: 'judges',
        name: 'Judges',
        path: 'judges',
        icon: Gavel,
        loading: judges.isLoadingAdmin,
        rows: judges.adminItems.map((i) => ({
          id: i.id,
          label: i.name,
          status: i.status,
          updatedAt: i.updatedAt,
        })),
      },
    ],
    [news, events, publications, documents, judges],
  );

  const totals = useMemo(() => {
    const t: Record<Status, number> = {
      draft: 0,
      pending: 0,
      published: 0,
      rejected: 0,
    };
    sections.forEach((s) => s.rows.forEach((r) => (t[r.status] += 1)));
    return t;
  }, [sections]);

  const recent = useMemo(
    () =>
      sections
        .flatMap((s) => s.rows.map((r) => ({ ...r, section: s })))
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 8),
    [sections],
  );

  const needsAttention = useMemo(
    () =>
      sections
        .flatMap((s) =>
          s.rows
            .filter((r) =>
              isSuperAdmin ? r.status === 'pending' : r.status === 'rejected',
            )
            .map((r) => ({ ...r, section: s })),
        )
        .slice(0, 6),
    [sections, isSuperAdmin],
  );

  const anyLoading = sections.some((s) => s.loading);

  const kpis: { label: string; value: number; icon: LucideIcon; tone: string }[] = [
    { label: 'Published', value: totals.published, icon: CheckCircle2, tone: 'text-emerald-700 bg-emerald-50' },
    { label: 'Pending review', value: totals.pending, icon: Clock, tone: 'text-amber-700 bg-amber-50' },
    { label: 'Drafts', value: totals.draft, icon: FilePen, tone: 'text-slate-700 bg-slate-100' },
    { label: 'Rejected', value: totals.rejected, icon: XCircle, tone: 'text-red-700 bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-7 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-amber-500/10" />
        <div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-amber-500/10" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            {isSuperAdmin ? 'Super Admin Console' : 'Admin Workspace'}
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold md:text-3xl">
            {greeting()}
            {user ? `, ${user.fullName.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-emerald-100/90">
            {isSuperAdmin
              ? totals.pending > 0
                ? `${totals.pending} record${totals.pending === 1 ? '' : 's'} awaiting your review across the site.`
                : 'Nothing is waiting on review. The site is up to date.'
              : 'Create and manage content for the Environment & Land Court website. Submit drafts for review when they are ready.'}
          </p>
        </div>
      </section>

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {k.label}
                </p>
                <span className={`rounded-lg p-2 ${k.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {anyLoading && k.value === 0 ? '–' : k.value}
              </p>
            </div>
          );
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Content breakdown */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Content overview</h2>
            <p className="text-xs text-slate-500">Records by section and status</p>
          </header>
          <ul className="divide-y divide-slate-100">
            {sections.map((s) => {
              const Icon = s.icon;
              const count = (st: Status) => s.rows.filter((r) => r.status === st).length;
              const total = s.rows.length;
              const pub = count('published');
              return (
                <li key={s.key}>
                  <Link
                    to={`${basePath}/${s.path}`}
                    className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50"
                  >
                    <span className="rounded-lg bg-emerald-900/10 p-2 text-emerald-900">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900">{s.name}</p>
                        <p className="text-xs text-slate-500">
                          {s.loading && total === 0 ? 'Loading…' : `${total} total`}
                        </p>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-600"
                          style={{ width: total ? `${(pub / total) * 100}%` : '0%' }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">
                        {pub} published · {count('pending')} pending · {count('draft')} draft
                        {count('rejected') > 0 && ` · ${count('rejected')} rejected`}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-amber-600" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="space-y-6">
          {/* Needs attention */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                {isSuperAdmin ? 'Awaiting review' : 'Needs your attention'}
              </h2>
              <p className="text-xs text-slate-500">
                {isSuperAdmin ? 'Pending approval' : 'Rejected — edit and resubmit'}
              </p>
            </header>
            {needsAttention.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-8 text-center text-slate-400">
                <Inbox className="h-8 w-8" />
                <p className="text-xs">All clear.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {needsAttention.map((r) => (
                  <li key={`${r.section.key}-${r.id}`}>
                    <Link
                      to={`${basePath}/${r.section.path}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-900">{r.label}</p>
                        <p className="text-xs text-slate-500">{r.section.name}</p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">
                        {timeAgo(r.updatedAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Quick actions */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Quick actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'News', to: 'news' },
                { label: 'Event', to: 'events' },
                { label: 'Document', to: 'documents' },
                { label: 'Judge', to: 'judges' },
              ].map((a) => (
                <Link
                  key={a.to}
                  to={`${basePath}/${a.to}`}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-amber-500 hover:bg-amber-50 hover:text-emerald-900"
                >
                  <Plus className="h-3.5 w-3.5 text-amber-600" />
                  {a.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Recent activity */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>
          <p className="text-xs text-slate-500">Latest changes across all sections</p>
        </header>
        {recent.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-slate-400">
            {anyLoading ? 'Loading…' : 'No content yet.'}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((r) => {
              const Icon = r.section.icon;
              return (
                <li key={`${r.section.key}-${r.id}`}>
                  <Link
                    to={`${basePath}/${r.section.path}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                    <p className="min-w-0 flex-1 truncate text-sm text-slate-900">
                      {r.label}
                    </p>
                    <span className="hidden text-xs text-slate-500 sm:inline">
                      {r.section.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[r.status]}`}
                    >
                      {r.status}
                    </span>
                    <span className="w-16 text-right text-xs text-slate-400">
                      {timeAgo(r.updatedAt)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default DashboardOverview;
