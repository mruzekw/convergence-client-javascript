/*
 * Copyright (c) 2019 - Convergence Labs, Inc.
 *
 * This file is subject to the terms and conditions defined in the files
 * 'LICENSE' and 'COPYING.LESSER', which are part of this source code package.
 */

import {Activity} from "../Activity";
import {IConvergenceEvent} from "../../util";
import {DomainUser} from "../../identity";

/**
 * IActivityEvent is the base interface for all events fired by the Activity
 * subsystem. All Activity events will implement this interface.
 *
 * @module Collaboration Awareness
 */
export interface IActivityEvent extends IConvergenceEvent {
  /**
   * The Activity that this event relates to.
   */
  readonly activity: Activity;

  /**
   * The username of the user originated this event.
   */
  readonly user: DomainUser;

  /**
   * The session id of the session that originated this event.
   */
  readonly sessionId: string;

  /**
   * Will be true if this event is from the local user / session;
   * false otherwise.
   */
  readonly local: boolean;
}
