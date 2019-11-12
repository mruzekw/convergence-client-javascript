/*
 * Copyright (c) 2019 - Convergence Labs, Inc.
 *
 * This file is subject to the terms and conditions defined in the files
 * 'LICENSE' and 'COPYING.LESSER', which are part of this source code package.
 */

import {HistoricalElement} from "./HistoricalElement";
import {DateNode} from "../internal/DateNode";
import {HistoricalWrapperFactory} from "./HistoricalWrapperFactory";
import {
  ObservableDate,
  ObservableDateEvents,
  ObservableDateEventConstants
} from "../observable/ObservableDate";
import {HistoricalModel} from "./HistoricalModel";

/**
 * @module Real Time Data
 */
export interface HistoricalDateEvents extends ObservableDateEvents {
}

/**
 * A read-only history-aware version of a [[RealTimeDate]].  See [[HistoricalElement]]
 * and [[HistoricalModel]] for some common usages.
 *
 * @module Real Time Data
 */
export class HistoricalDate extends HistoricalElement<Date> implements ObservableDate {

  public static readonly Events: HistoricalDateEvents = ObservableDateEventConstants;

  /**
   * @hidden
   * @internal
   */
  constructor(delegate: DateNode, wrapperFactory: HistoricalWrapperFactory, model: HistoricalModel) {
    super(delegate, wrapperFactory, model);
  }
}