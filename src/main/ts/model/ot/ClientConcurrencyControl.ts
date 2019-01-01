import {ProcessedOperationEvent} from "./ProcessedOperationEvent";
import {Operation} from "./ops/Operation";
import {DiscreteOperation} from "./ops/DiscreteOperation";
import {UnprocessedOperationEvent} from "./UnprocessedOperationEvent";
import {CompoundOperation} from "./ops/CompoundOperation";
import {OperationTransformer} from "./xform/OperationTransformer";
import {OperationPair} from "./xform/OperationPair";
import {ReferenceTransformer, ModelReferenceData} from "./xform/ReferenceTransformer";
import {ConvergenceEventEmitter, IConvergenceEvent} from "../../util";

/**
 * @hidden
 * @internal
 */
export interface IClientConcurrencyControlEvent extends IConvergenceEvent {
  // empty
}

/**
 * @hidden
 * @internal
 */
export interface ICommitStatusChanged extends IClientConcurrencyControlEvent {
  name: "commitStateChanged";
  committed: boolean;
}

/**
 * @hidden
 * @internal
 */
export class ClientConcurrencyControl extends ConvergenceEventEmitter<IClientConcurrencyControlEvent> {

  public static Events: any = {
    COMMIT_STATE_CHANGED: "commitStateChanged"
  };

  private readonly _clientId: string;
  private _seqNo: number;

  private _compoundOpInProgress: boolean;
  private _pendingCompoundOperation: DiscreteOperation[];

  private readonly _inflightOperations: Operation[];
  private readonly _unappliedOperations: ProcessedOperationEvent[];

  private _contextVersion: number;
  private _transformer: OperationTransformer;
  private _referenceTransformer: ReferenceTransformer;

  constructor(clientId: string,
              contextVersion: number,
              transformer: OperationTransformer,
              referenceTransformer: ReferenceTransformer) {
    super();

    this._clientId = clientId;
    this._seqNo = 0;
    this._contextVersion = contextVersion;
    this._unappliedOperations = [];
    this._inflightOperations = [];

    this._transformer = transformer;
    this._referenceTransformer = referenceTransformer;
    this._compoundOpInProgress = false;
    this._pendingCompoundOperation = [];
  }

  public clientId(): string {
    return this._clientId;
  }

  public contextVersion(): number {
    return this._contextVersion;
  }

  public hasNextIncomingOperation(): boolean {
    return this._unappliedOperations.length !== 0;
  }

  public getNextIncomingOperation(): ProcessedOperationEvent {
    if (this._unappliedOperations.length === 0) {
      return null;
    } else {
      // todo: should we fire incoming reference if references are now
      // available???
      return this._unappliedOperations.shift();
    }
  }

  public hasNextRemoteReference(): boolean {
    return this._unappliedOperations.length !== 0;
  }

  public getNextRemoteReferenceSetEvent(): ProcessedOperationEvent {
    if (this._unappliedOperations.length === 0) {
      return null;
    } else {
      // todo: should we fire incoming reference if references are now
      // available???
      return this._unappliedOperations.shift();
    }
  }

  public startBatchOperation(): void {
    if (this._compoundOpInProgress) {
      throw new Error("Batch operation already in progress.");
    }

    this._pendingCompoundOperation = [];
    this._compoundOpInProgress = true;
  }

  public cancelBatchOperation(): void {
    if (!this._compoundOpInProgress) {
      throw new Error("Batch operation not in progress.");
    }

    if (this._pendingCompoundOperation.length !== 0) {
      throw new Error("Can not cancel a batch operation if operation shave been issued.");
    }

    this._compoundOpInProgress = false;
  }

  public completeBatchOperation(): UnprocessedOperationEvent {
    if (!this._compoundOpInProgress) {
      throw new Error("Batch operation not in progress.");
    }

    this._compoundOpInProgress = false;

    if (this._pendingCompoundOperation.length === 0) {
      throw new Error("A Batch operation must have at least one operation.");

    }

    const compoundOp: CompoundOperation = new CompoundOperation(this._pendingCompoundOperation);
    this._pendingCompoundOperation = [];
    this._inflightOperations.push(compoundOp);

    const event: UnprocessedOperationEvent = new UnprocessedOperationEvent(
      this._clientId,
      this._seqNo++,
      this._contextVersion,
      new Date(),
      compoundOp);

    return event;
  }

  public batchSize(): number {
    return this._pendingCompoundOperation.length;
  }

  public isBatchOperationInProgress(): boolean {
    return this._compoundOpInProgress;
  }

  public processOutgoingOperation(operation: DiscreteOperation): UnprocessedOperationEvent {
    if (this._compoundOpInProgress && !(operation instanceof DiscreteOperation)) {
      throw new Error("Can't process a compound operation that is in progress");
    }

    // transform against unapplied operations.
    const outgoingOperation: DiscreteOperation = this.transformOutgoing(this._unappliedOperations, operation);

    if (this._inflightOperations.length === 0 && this._pendingCompoundOperation.length === 0) {
      // we had no inflight ops or compound ops before. Now we have one.
      // so now we have uncommitted operations.
      const evt: ICommitStatusChanged = {
        name: ClientConcurrencyControl.Events.COMMIT_STATE_CHANGED,
        committed: false
      };
      this._emitEvent(evt);
    }

    if (this._compoundOpInProgress) {
      // this cast is ok due to the check at the beginning of the method.
      this._pendingCompoundOperation.push(outgoingOperation);
      return null;
    } else {
      // todo We really don't need the time here. The client sends this out, and we are going
      // to use the server time. We may want to refactor this whole holder concept.
      this._inflightOperations.push(outgoingOperation);
      return new UnprocessedOperationEvent(
        this._clientId,
        this._seqNo++,
        this._contextVersion,
        new Date(),
        outgoingOperation);
    }
  }

  public processOutgoingSetReference(r: ModelReferenceData): ModelReferenceData {
    for (let i: number = 0; i < this._unappliedOperations.length && r; i++) {
      r = this._referenceTransformer.transform(this._unappliedOperations[i].operation, r);
    }
    return r;
  }

  public dispose(): void {
    // todo
  }

  public processAcknowledgementOperation(seqNo: number, version: number): void {
    if (this._inflightOperations.length === 0) {
      throw new Error("Received an operation from this site, but with no operations in flight.");
    }

    if (this._contextVersion !== version) {
      throw new Error("Acknowledgement did not meet expected context version of " +
        this._contextVersion + ": " + version);
    }

    this._contextVersion++;
    this._inflightOperations.shift();

    // fixme we need to store an unprocessed event so we can verify te seqNo
    if (this._inflightOperations.length === 0 && this._pendingCompoundOperation.length === 0) {
      // we had inflight ops before. Now we have none. So now we have
      // changed commit state.
      const evt: ICommitStatusChanged = {
        name: ClientConcurrencyControl.Events.COMMIT_STATE_CHANGED,
        committed: true
      };
      this._emitEvent(evt);
    }
  }

  public processRemoteOperation(incomingOperation: UnprocessedOperationEvent): void {
    if (incomingOperation.contextVersion > this._contextVersion) {
      throw new Error(
        `Invalid context version of ${incomingOperation.contextVersion}, expected ${this._contextVersion}.`);
    }

    let remoteOperation: Operation = incomingOperation.operation;

    // forward transform the operation against the in flight operations to
    // prepare it to be applied to the data model.
    remoteOperation = this.transformIncoming(remoteOperation, this._inflightOperations);

    // forward transform the operation against the compound op (if there is
    // one) if it is not already in flight then it must come after the in
    // flight ops so we do this after handling the in flight.
    remoteOperation = this.transformIncoming(remoteOperation, this._pendingCompoundOperation);

    this._contextVersion++;

    // add the processed operation to the incoming operations.
    this._unappliedOperations.push(new ProcessedOperationEvent(
      incomingOperation.clientId,
      incomingOperation.seqNo,
      incomingOperation.contextVersion,
      incomingOperation.timestamp,
      remoteOperation));
  }

  public processRemoteReferenceSet(r: ModelReferenceData): ModelReferenceData {
    for (let i: number = 0; i < this._inflightOperations.length && r; i++) {
      r = this._referenceTransformer.transform(this._inflightOperations[i], r);
    }
    return r;
  }

  private transformIncoming(serverOp: Operation, clientOps: Operation[]): Operation {
    let sPrime: Operation = serverOp;
    for (let i: number = 0; i < clientOps.length; i++) {
      const opPair: OperationPair = this._transformer.transform(sPrime, clientOps[i]);
      sPrime = opPair.serverOp;
      clientOps[i] = opPair.clientOp;
    }
    return sPrime;
  }

  private transformOutgoing(serverOps: ProcessedOperationEvent[], clientOp: Operation): DiscreteOperation {
    let cPrime: Operation = clientOp;
    for (let i: number = 0; i < serverOps.length; i++) {
      const opPair: OperationPair = this._transformer.transform(serverOps[i].operation, cPrime);
      serverOps[i] = new ProcessedOperationEvent(
        serverOps[i].clientId,
        serverOps[i].seqNo,
        serverOps[i].version,
        serverOps[i].timestamp,
        opPair.serverOp
      );
      cPrime = opPair.clientOp;
    }
    return cPrime as DiscreteOperation;
  }
}
