import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { SessionService } from '../services/session.service';
import { SessionDto, RequestSessionRequest } from '../../shared/models';

interface SessionState {
  learnerSessions: SessionDto[];
  mentorSessions: SessionDto[];
  selected: SessionDto | null;
  loading: boolean;
  error: string | null;
  // Learner pagination
  learnerCurrentPage: number;
  learnerTotalElements: number;
  learnerTotalPages: number;
  // Mentor pagination
  mentorCurrentPage: number;
  mentorTotalElements: number;
  mentorTotalPages: number;
}

export const SessionStore = signalStore(
  { providedIn: 'root' },
  withState<SessionState>({
    learnerSessions: [],
    mentorSessions: [],
    selected: null,
    loading: false,
    error: null,
    learnerCurrentPage: 0,
    learnerTotalElements: 0,
    learnerTotalPages: 0,
    mentorCurrentPage: 0,
    mentorTotalElements: 0,
    mentorTotalPages: 0
  }),

  withComputed((store) => ({
    pendingMentorSessions: computed(() =>
      store.mentorSessions().filter(s => s.status === 'REQUESTED')
    ),
    activeLearnerSessions: computed(() =>
      store.learnerSessions().filter(s => ['REQUESTED', 'ACCEPTED', 'CONFIRMED'].includes(s.status))
    )
  })),

  withMethods((store, svc = inject(SessionService)) => ({

    requestSession: rxMethod<RequestSessionRequest>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(req =>
          svc.requestSession(req).pipe(
            tapResponse({
              next: (res) => patchState(store, {
                learnerSessions: [res.data, ...store.learnerSessions()],
                loading: false
              }),
              error: (err: any) => patchState(store, { loading: false, error: err.error?.message ?? 'Failed to request session' })
            })
          )
        )
      )
    ),

    loadLearnerSessions: rxMethod<{ page: number; size: number } | void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((params) => {
          const page = typeof params === 'object' ? params?.page ?? store.learnerCurrentPage() : store.learnerCurrentPage();
          const size = typeof params === 'object' ? params?.size ?? 10 : 10;
          return svc.getLearnerSessions(page, size).pipe(
            tapResponse({
              next: (res) => patchState(store, { 
                learnerSessions: res.data.content,
                learnerTotalElements: res.data.totalElements,
                learnerTotalPages: res.data.totalPages,
                learnerCurrentPage: res.data.currentPage,
                loading: false 
              }),
              error: (err: any) => patchState(store, { loading: false, error: err.error?.message })
            })
          );
        })
      )
    ),

    loadMentorSessions: rxMethod<{ page: number; size: number } | void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((params) => {
          const page = typeof params === 'object' ? params?.page ?? store.mentorCurrentPage() : store.mentorCurrentPage();
          const size = typeof params === 'object' ? params?.size ?? 10 : 10;
          return svc.getMentorSessions(page, size).pipe(
            tapResponse({
              next: (res) => patchState(store, { 
                mentorSessions: res.data.content,
                mentorTotalElements: res.data.totalElements,
                mentorTotalPages: res.data.totalPages,
                mentorCurrentPage: res.data.currentPage,
                loading: false 
              }),
              error: (err: any) => patchState(store, { loading: false, error: err.error?.message })
            })
          );
        })
      )
    ),

    loadById: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(id =>
          svc.getSession(id).pipe(
            tapResponse({
              next: (res) => patchState(store, { selected: res.data, loading: false }),
              error: () => patchState(store, { loading: false })
            })
          )
        )
      )
    ),

    accept: rxMethod<number>(
      pipe(
        switchMap(id =>
          svc.acceptSession(id).pipe(
            tapResponse({
              next: (res) => patchState(store, {
                mentorSessions: store.mentorSessions().map(s => s.id === id ? res.data : s)
              }),
              error: () => {}
            })
          )
        )
      )
    ),

    reject: rxMethod<{ id: number; reason: string }>(
      pipe(
        switchMap(({ id, reason }) =>
          svc.rejectSession(id, reason).pipe(
            tapResponse({
              next: (res) => patchState(store, {
                mentorSessions: store.mentorSessions().map(s => s.id === id ? res.data : s)
              }),
              error: () => {}
            })
          )
        )
      )
    ),

    cancel: rxMethod<number>(
      pipe(
        switchMap(id =>
          svc.cancelSession(id).pipe(
            tapResponse({
              next: (res) => patchState(store, {
                learnerSessions: store.learnerSessions().map(s => s.id === id ? res.data : s),
                mentorSessions: store.mentorSessions().map(s => s.id === id ? res.data : s)
              }),
              error: () => {}
            })
          )
        )
      )
    )
  }))
);
