import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { SessionService } from '../services/session.service';
import { SessionDto, RequestSessionRequest } from '../../shared/models';
import { HttpErrorResponse } from '@angular/common/http';

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
  learnerPageSize: number;
  // Mentor pagination
  mentorCurrentPage: number;
  mentorTotalElements: number;
  mentorTotalPages: number;
  mentorPageSize: number;
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
    learnerPageSize: 10,
    mentorCurrentPage: 0,
    mentorTotalElements: 0,
    mentorTotalPages: 0,
    mentorPageSize: 10
  }),

  withComputed((store) => ({
    pendingMentorSessions: computed(() =>
      store.mentorSessions().filter(s => s.status === 'REQUESTED')
    ),
    activeLearnerSessions: computed(() =>
      store.learnerSessions().filter(s => ['REQUESTED', 'ACCEPTED', 'CONFIRMED'].includes(s.status))
    )
  })),

  withMethods((store, svc = inject(SessionService)) => {
    
    // ── Local Method Definitions (to allow calling each other via closure) ──
    
    const loadLearnerSessions = rxMethod<{ page: number; size: number } | void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((params) => {
          const page = typeof params === 'object' ? params?.page ?? store.learnerCurrentPage() : store.learnerCurrentPage();
          const size = typeof params === 'object' ? params?.size ?? 100 : 100;
          
          console.log('[SessionStore] Loading learner sessions...', { page, size });
          
          return svc.getLearnerSessions(page, size).pipe(
            tapResponse({
              next: (res) => {
                console.log('[SessionStore] Learner sessions loaded successfully:', res.data.content.length);
                patchState(store, { 
                  learnerSessions: res.data.content,
                  learnerTotalElements: res.data.totalElements,
                  learnerTotalPages: res.data.totalPages,
                  learnerCurrentPage: res.data.currentPage,
                  learnerPageSize: res.data.pageSize,
                  loading: false,
                  error: null 
                });
              },
              error: (err: HttpErrorResponse) => {
                console.error('[SessionStore] Failed to load learner sessions:', err);
                patchState(store, { 
                  loading: false, 
                  error: err.error?.message || err.message || 'Failed to load sessions' 
                });
              }
            })
          );
        })
      )
    );

    const loadMentorSessions = rxMethod<{ page: number; size: number } | void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((params) => {
          const page = typeof params === 'object' ? params?.page ?? store.mentorCurrentPage() : store.mentorCurrentPage();
          const size = typeof params === 'object' ? params?.size ?? 100 : 100;
          
          console.log('[SessionStore] Loading mentor sessions...', { page, size });
          
          return svc.getMentorSessions(page, size).pipe(
            tapResponse({
              next: (res) => {
                console.log('[SessionStore] Mentor sessions loaded successfully:', res.data.content.length);
                patchState(store, { 
                  mentorSessions: res.data.content,
                  mentorTotalElements: res.data.totalElements,
                  mentorTotalPages: res.data.totalPages,
                  mentorCurrentPage: res.data.currentPage,
                  mentorPageSize: res.data.pageSize,
                  loading: false,
                  error: null 
                });
              },
              error: (err: HttpErrorResponse) => {
                console.error('[SessionStore] Failed to load mentor sessions:', err);
                patchState(store, { 
                  loading: false, 
                  error: err.error?.message || err.message || 'Failed to load sessions' 
                });
              }
            })
          );
        })
      )
    );

    const loadById = rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(id =>
          svc.getSession(id).pipe(
            tapResponse({
              next: (res) => patchState(store, { selected: res.data, loading: false, error: null }),
              error: (err: HttpErrorResponse) => patchState(store, { loading: false, error: err.error?.message || 'Failed to load session details' })
            })
          )
        )
      )
    );

    return {
      loadLearnerSessions,
      loadMentorSessions,
      loadById,

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
                error: (err: HttpErrorResponse) => patchState(store, { loading: false, error: err.error?.message ?? 'Failed to request session' })
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
                next: (res) => {
                  patchState(store, { selected: res.data });
                  loadMentorSessions();
                },
                error: (err: HttpErrorResponse) => console.error('Failed to accept session', err)
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
                next: (res) => {
                  patchState(store, { selected: res.data });
                  loadMentorSessions();
                },
                error: (err: HttpErrorResponse) => console.error('Failed to reject session', err)
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
                next: (res) => {
                  patchState(store, { selected: res.data });
                  loadLearnerSessions();
                  loadMentorSessions();
                },
                error: (err: HttpErrorResponse) => console.error('Failed to cancel session', err)
              })
            )
          )
        )
      ),

      clearError: () => patchState(store, { error: null })
    };
  })
);
