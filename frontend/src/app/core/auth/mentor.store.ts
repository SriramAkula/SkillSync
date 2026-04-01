import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { MentorService } from '../services/mentor.service';
import { MentorProfileDto, ApplyMentorRequest, UpdateAvailabilityRequest } from '../../shared/models';

interface MentorState {
  approved: MentorProfileDto[];
  pending: MentorProfileDto[];
  selected: MentorProfileDto | null;
  myProfile: MentorProfileDto | null;
  searchResults: MentorProfileDto[];
  loading: boolean;
  error: string | null;
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
    error: null
  }),

  withComputed((store) => ({
    approvedCount: computed(() => store.approved().length),
    pendingCount: computed(() => store.pending().length),
    hasMyProfile: computed(() => !!store.myProfile())
  })),

  withMethods((store, svc = inject(MentorService)) => ({

    loadApproved: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          svc.getApprovedMentors().pipe(
            tapResponse({
              next: (res) => patchState(store, { approved: res.data, loading: false }),
              error: (err: any) => patchState(store, { loading: false, error: err.error?.message ?? 'Failed to load mentors' })
            })
          )
        )
      )
    ),

    search: rxMethod<{ skill?: string; minExperience?: number; maxExperience?: number; maxRate?: number; minRating?: number }>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(params =>
          svc.searchMentors(params).pipe(
            tapResponse({
              next: (res) => patchState(store, { searchResults: res.data, loading: false }),
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
              error: (err: any) => patchState(store, { loading: false, error: err.error?.message })
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

    loadPending: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          svc.getPendingApplications().pipe(
            tapResponse({
              next: (res) => patchState(store, { pending: res.data, loading: false }),
              error: (err: any) => patchState(store, { loading: false, error: err.error?.message })
            })
          )
        )
      )
    ),

    applyAsMentor: rxMethod<ApplyMentorRequest>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(req =>
          svc.applyAsMentor(req).pipe(
            tapResponse({
              next: (res) => patchState(store, { myProfile: res.data, loading: false }),
              error: (err: any) => patchState(store, { loading: false, error: err.error?.message ?? 'Application failed' })
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
              error: () => {}
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
              error: () => {}
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
              next: (res) => patchState(store, { myProfile: res.data }),
              error: () => {}
            })
          )
        )
      )
    )
  }))
);
