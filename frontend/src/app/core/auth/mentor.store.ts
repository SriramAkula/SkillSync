import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { MentorService } from '../services/mentor.service';
import { AuthStore } from './auth.store';
import { MentorProfileDto, ApplyMentorRequest, UpdateAvailabilityRequest } from '../../shared/models';
import { HttpErrorResponse } from '@angular/common/http';

interface MentorState {
  approved: MentorProfileDto[];
  pending: MentorProfileDto[];
  selected: MentorProfileDto | null;
  myProfile: MentorProfileDto | null;
  searchResults: MentorProfileDto[];
  loading: boolean;
  error: string | null;
  
  // Pagination State
  currentPage: number;
  totalElements: number;
  totalPages: number;
  pageSize: number;
}

export const MentorStore = signalStore(
  { providedIn: 'root' },
  withState<MentorState>({
    approved: [],
    pending: [],
    selected: null,
    myProfile: null,
    searchResults: [],
    loading: false,
    error: null,
    currentPage: 0,
    totalElements: 0,
    totalPages: 0,
    pageSize: 12
  }),

  withComputed((store) => ({
    approvedCount: computed(() => store.totalElements()),
    pendingCount: computed(() => store.pending().length),
    hasMyProfile: computed(() => !!store.myProfile()),
    isAvailable: computed(() => store.myProfile()?.availabilityStatus === 'AVAILABLE')
  })),

  withMethods((store, svc = inject(MentorService), authStore = inject(AuthStore)) => ({

    loadApproved: rxMethod<{ page?: number; size?: number } | void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((params) => {
          const p = params && typeof params === 'object' ? params.page ?? 0 : 0;
          const s = params && typeof params === 'object' ? params.size ?? 12 : 12;
          return svc.getApprovedMentors(p, s).pipe(
            tapResponse({
              next: (res) => patchState(store, { 
                approved: res.data.content, 
                currentPage: res.data.currentPage,
                totalElements: res.data.totalElements,
                totalPages: res.data.totalPages,
                pageSize: res.data.pageSize,
                loading: false 
              }),
              error: (err: HttpErrorResponse) => patchState(store, { loading: false, error: err.error?.message ?? 'Failed to load mentors' })
            })
          );
        })
      )
    ),

    search: rxMethod<{ skill?: string; minExperience?: number; maxExperience?: number; maxRate?: number; minRating?: number; page?: number; size?: number }>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(params =>
          svc.searchMentors(params).pipe(
            tapResponse({
              next: (res) => patchState(store, { 
                searchResults: res.data.content,
                currentPage: res.data.currentPage,
                totalElements: res.data.totalElements,
                totalPages: res.data.totalPages,
                pageSize: res.data.pageSize,
                loading: false 
              }),
              error: () => patchState(store, { loading: false })
            })
          )
        )
      )
    ),

    loadById: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, selected: null })),
        switchMap(id =>
          svc.getMentor(id).pipe(
            tapResponse({
              next: (res) => patchState(store, { selected: res.data, loading: false }),
              error: (err: HttpErrorResponse) => patchState(store, { loading: false, error: err.error?.message })
            })
          )
        )
      )
    ),

    loadMyProfile: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          svc.getMyMentorProfile().pipe(
            tapResponse({
              next: (res) => patchState(store, { myProfile: res.data, loading: false }),
              error: () => patchState(store, { loading: false })
            })
          )
        )
      )
    ),

    loadPending: rxMethod<{ page?: number; size?: number } | void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((params) => {
          const p = params && typeof params === 'object' ? params.page ?? 0 : 0;
          const s = params && typeof params === 'object' ? params.size ?? 12 : 12;
          return svc.getPendingApplications(p, s).pipe(
            tapResponse({
              next: (res) => patchState(store, { 
                pending: res.data.content,
                currentPage: res.data.currentPage,
                totalElements: res.data.totalElements,
                totalPages: res.data.totalPages,
                pageSize: res.data.pageSize,
                loading: false 
              }),
              error: (err: HttpErrorResponse) => patchState(store, { loading: false, error: err.error?.message })
            })
          );
        })
      )
    ),

    applyAsMentor: rxMethod<ApplyMentorRequest>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(req =>
          svc.applyAsMentor(req).pipe(
            tapResponse({
              next: (res) => patchState(store, { myProfile: res.data, loading: false }),
              error: (err: HttpErrorResponse) => patchState(store, { loading: false, error: err.error?.message ?? 'Application failed' })
            })
          )
        )
      )
    ),

    approve: rxMethod<number>(
      pipe(
        switchMap(id =>
          svc.approveMentor(id).pipe(
            tapResponse({
              next: (res) => patchState(store, {
                pending: store.pending().filter(m => m.id !== id),
                approved: [...store.approved(), res.data]
              }),
              error: (err: HttpErrorResponse) => console.error('Approval failed', err)
            })
          )
        )
      )
    ),

    reject: rxMethod<number>(
      pipe(
        switchMap(id =>
          svc.rejectMentor(id).pipe(
            tapResponse({
              next: () => patchState(store, { pending: store.pending().filter(m => m.id !== id) }),
              error: (err: HttpErrorResponse) => console.error('Rejection failed', err)
            })
          )
        )
      )
    ),

    updateAvailability: rxMethod<UpdateAvailabilityRequest>(
      pipe(
        switchMap(req =>
          svc.updateAvailability(req).pipe(
            tapResponse({
              next: (res) => patchState(store, { 
                myProfile: res.data,
                approved: store.approved().map(m => m.id === res.data.id ? res.data : m)
              }),
              error: (err: HttpErrorResponse) => {
                // On 403, silently refresh the JWT token so the next toggle attempt succeeds
                if (err?.status === 403) {
                  authStore.refreshToken();
                }
              }
            })
          )
        )
      )
    )
  }))
);
