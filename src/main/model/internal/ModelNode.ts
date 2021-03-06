/*
 * Copyright (c) 2019 - Convergence Labs, Inc.
 *
 * This file is part of the Convergence JavaScript Client, which is released
 * under the terms of the GNU Lesser General Public License version 3
 * (LGPLv3), which is a refinement of the GNU Lesser General Public License
 * version 3 (GPLv3).  A copy of the both the GPLv3 and the LGPLv3 should have
 * been provided along with this file, typically located in the "COPYING" and
 * "COPYING.LESSER" files (respectively), which are part of this source code
 * package. Alternatively, see <https://www.gnu.org/licenses/gpl-3.0.html> and
 * <https://www.gnu.org/licenses/lgpl-3.0.html> for the full text of the GPLv3
 * and LGPLv3 licenses, if they were not provided.
 */

import {Model} from "./Model";
import {Path} from "../Path";
import {ModelOperationEvent} from "../ModelOperationEvent";
import {
  NodeChangedEvent,
  NodeValueChangedEvent,
  NodeDetachedEvent,
  ModelNodeEvent
} from "./events";
import {IDataValue} from "../dataValue";
import {ConvergenceEventEmitter} from "../../util";
import {ConvergenceSession} from "../../ConvergenceSession";

/**
 * @hidden
 * @internal
 */
export abstract class ModelNode<T> extends ConvergenceEventEmitter<ModelNodeEvent> {

  public static Events: any = {
    DETACHED: "detached",
    NODE_CHANGED: "node_changed",
    OPERATION: "operation"
  };

  protected _model: Model;
  protected _path: () => Path;
  protected readonly _session: ConvergenceSession;

  private readonly _id: string;
  private readonly _modelType: string;

  /**
   * Constructs a new RealTimeElement.
   */
  protected constructor(modelType: string,
                        id: string,
                        path: () => Path,
                        model: Model,
                        session: ConvergenceSession) {
    super();
    this._id = id;
    this._session = session;
    this._modelType = modelType;
    this._model = model;
    this._path = path;

    if (this._model) {
      this._model._registerValue(this);
    }
  }

  public session(): ConvergenceSession {
    return this._session;
  }

  public id(): string {
    return this._id;
  }

  public type(): string {
    return this._modelType;
  }

  public path(): Path {
    return this._path();
  }

  public model(): Model {
    return this._model;
  }

  public isDetached(): boolean {
    return this._model === null;
  }

  public _detach(local: boolean): void {
    this._model._unregisterValue(this);
    this._model = null;

    const event: NodeDetachedEvent = new NodeDetachedEvent(this, local);
    this._emitEvent(event);
  }

  public data(): T;
  public data(value: T): void;
  public data(value?: T): any {
    if (arguments.length === 0) {
      return this._getData();
    } else {
      this._setData(value);
      return;
    }
  }

  public abstract dataValue(): IDataValue;

  public abstract toJson(): any;

  public abstract _handleModelOperationEvent(operationEvent: ModelOperationEvent): void;

  protected _emitValueEvent(event: NodeValueChangedEvent): void {
    this._emitEvent(event);
    this._emitEvent(
      new NodeChangedEvent(this, event.local, [], event, this._session.sessionId(), this._session.user()));
  }

  protected _exceptionIfDetached(): void {
    if (this.isDetached()) {
      throw Error("Can not perform actions on a detached ModelNode.");
    }
  }

  protected abstract _getData(): T;

  protected abstract _setData(value: T): void;
}
