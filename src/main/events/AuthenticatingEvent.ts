/*
 * Copyright (c) 2019 - Convergence Labs, Inc.
 *
 * This file is subject to the terms and conditions defined in the files
 * 'LICENSE' and 'COPYING.LESSER', which are part of this source code package.
 */

import {IConvergenceDomainEvent} from "./IConvergenceDomainEvent";
import {ConvergenceDomain} from "../ConvergenceDomain";
import { AuthenticationMethod } from "../connection/AuthenticationMethod";

/**
 * Emitted when a [[ConvergenceDomain]] is actively attempting to authenticate.
 *
 * @module Connection and Authentication
 */
export class AuthenticatingEvent implements IConvergenceDomainEvent {
  public static readonly NAME = "authenticating";

  /**
   * @inheritdoc
   */
  public readonly name: string = AuthenticatingEvent.NAME;

  /**
   * @hidden
   * @internal
   */
  constructor(
    /**
     * @inheritdoc
     */
    public readonly domain: ConvergenceDomain,

    /**
     * The method of authentication that is being attempted.
     */
    public readonly method: AuthenticationMethod
  ) {
    Object.freeze(this);
  }
}