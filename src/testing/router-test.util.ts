import { ActivatedRoute, convertToParamMap, ParamMap, Params } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

/**
 * A minimal ActivatedRoute stand-in for components that read route/query
 * params directly (e.g. via `route.paramMap.subscribe(...)`), with
 * `push*` helpers so a single test can simulate a param change without
 * re-creating the whole TestBed environment.
 */
export class StubActivatedRoute {
  private readonly paramMapSubject: BehaviorSubject<ParamMap>;
  private readonly queryParamMapSubject: BehaviorSubject<ParamMap>;

  readonly paramMap;
  readonly queryParamMap;
  readonly snapshot: Partial<ActivatedRoute['snapshot']>;

  constructor(params: Params = {}, queryParams: Params = {}) {
    this.paramMapSubject = new BehaviorSubject(convertToParamMap(params));
    this.queryParamMapSubject = new BehaviorSubject(convertToParamMap(queryParams));
    this.paramMap = this.paramMapSubject.asObservable();
    this.queryParamMap = this.queryParamMapSubject.asObservable();
    this.snapshot = {
      paramMap: convertToParamMap(params),
      queryParamMap: convertToParamMap(queryParams),
    };
  }

  pushParams(params: Params): void {
    this.paramMapSubject.next(convertToParamMap(params));
  }

  pushQueryParams(queryParams: Params): void {
    this.queryParamMapSubject.next(convertToParamMap(queryParams));
  }
}

/** Provider entry for `{ provide: ActivatedRoute, useValue: stubActivatedRoute(...) }`. */
export function stubActivatedRoute(params: Params = {}, queryParams: Params = {}): StubActivatedRoute {
  return new StubActivatedRoute(params, queryParams);
}
