/*
 * Copyright (c) 2019 - Convergence Labs, Inc.
 *
 * This file is subject to the terms and conditions defined in the files
 * 'LICENSE' and 'COPYING.LESSER', which are part of this source code package.
 */

import {ModelCollaborator} from "../rt/ModelCollaborator";
import {RealTimeModel} from "../rt/RealTimeModel";
import {IModelEvent} from "./IModelEvent";

/**
 * Emitted when a remote user closes a model.  This is only emitted if the
 * current user has that particular model already open.
 *
 * @module Real Time Data
 */
export class CollaboratorClosedEvent implements IModelEvent {
  public static readonly NAME = "collaborator_closed";

  /**
   * @inheritdoc
   */
  public readonly name: string = CollaboratorClosedEvent.NAME;

  constructor(
    /**
     * The model that was closed.
     */
    public readonly src: RealTimeModel,

    /**
     * The [[DomainUser]] / sessionID of the remote collaborator.
     */
    public readonly collaborator: ModelCollaborator
  ) {
    Object.freeze(this);
  }
}
