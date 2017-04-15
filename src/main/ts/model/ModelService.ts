import {Session} from "../Session";
import {ModelFqn} from "./ModelFqn";
import {ConvergenceConnection} from "../connection/ConvergenceConnection";
import {OpenRealTimeModelRequest} from "../connection/protocol/model/openRealtimeModel";
import {OpenRealTimeModelResponse} from "../connection/protocol/model/openRealtimeModel";
import {MessageType} from "../connection/protocol/MessageType";
import {OperationTransformer} from "./ot/xform/OperationTransformer";
import {TransformationFunctionRegistry} from "./ot/xform/TransformationFunctionRegistry";
import {ClientConcurrencyControl} from "./ot/ClientConcurrencyControl";
import {
  CreateRealTimeModelRequest,
  CreateRealTimeModelResponse
} from "../connection/protocol/model/createRealtimeModel";
import {DeleteRealTimeModelRequest} from "../connection/protocol/model/deleteRealtimeModel";
import {Deferred} from "../util/Deferred";
import {MessageEvent} from "../connection/ConvergenceConnection";
import {CloseRealTimeModelRequest} from "../connection/protocol/model/closeRealtimeModel";
import {
  AutoCreateModelConfigRequest,
  AutoCreateModelConfigResponse
} from "../connection/protocol/model/autoCreateConfigRequest";
import {ReplyCallback} from "../connection/ProtocolConnection";
import {ReferenceTransformer} from "./ot/xform/ReferenceTransformer";
import {ObjectValue} from "./dataValue";
import {DataValueFactory} from "./DataValueFactory";
import {Validation} from "../util/Validation";
import {RealTimeModel} from "./rt/RealTimeModel";
import {HistoricalModel} from "./historical/HistoricalModel";
import {HistoricalDataRequest} from "../connection/protocol/model/historical/historicalDataRequest";
import {HistoricalDataResponse} from "../connection/protocol/model/historical/historicalDataRequest";
import {ConvergenceEventEmitter} from "../util/ConvergenceEventEmitter";
import {ConvergenceEvent} from "../util/ConvergenceEvent";
import {ModelResult} from "./query/ModelResult";
import {ModelsQueryRequest, ModelsQueryResponse} from "../connection/protocol/model/query/modelQuery";
import {ModelPermissionManager} from "./ModelPermissionManager";
import {ModelPermissions} from "./ModelPermissions";

export class ModelService extends ConvergenceEventEmitter<ConvergenceEvent> {

  private _openRequestsByModelId: {[key: string]: Deferred<RealTimeModel>} = {};
  private _openModelsByModelId: {[key: string]: RealTimeModel} = {};
  private _openModelsByRid: {[key: string]: RealTimeModel} = {};
  private _autoRequestId: number;

  private _autoCreateRequests: {[key: number]: AutoCreateModelOptions} = {};

  constructor(private _connection: ConvergenceConnection) {
    super();
    this._connection.addMultipleMessageListener(
      [MessageType.FORCE_CLOSE_REAL_TIME_MODEL,
        MessageType.REMOTE_OPERATION,
        MessageType.OPERATION_ACKNOWLEDGEMENT,
        MessageType.MODEL_AUTO_CREATE_CONFIG_REQUEST,
        MessageType.REMOTE_CLIENT_OPENED,
        MessageType.REMOTE_CLIENT_CLOSED,
        MessageType.REFERENCE_PUBLISHED,
        MessageType.REFERENCE_UNPUBLISHED,
        MessageType.REFERENCE_SET,
        MessageType.REFERENCE_CLEARED],
      (message: MessageEvent) => this._handleMessage(message));
    this._autoRequestId = 0;
  }

  public session(): Session {
    return this._connection.session();
  }

  public query(query: string): Promise<ModelResult[]> {
    const message: ModelsQueryRequest = {type: MessageType.MODELS_QUERY_REQUEST, query};

    return this._connection.request(message).then((response: ModelsQueryResponse) => {
      return response.result;
    });
  }

  public open(id: string): Promise<RealTimeModel> {
    if (!Validation.nonEmptyString(id)) {
      return Promise.reject<RealTimeModel>(new Error("modelId must be a non-null, non empty string."));
    }

    return this._open(id);
  }

  public openAutoCreate(options: AutoCreateModelOptions): Promise<RealTimeModel> {
    if (!Validation.nonEmptyString(options.collection)) {
      return Promise.reject<RealTimeModel>(new Error("options.collection must be a non-null, non empty string."));
    }

    return this._open(undefined, options);
  }

  public create(options: CreateModelOptions): Promise<string> {
    const collection = options.collection;
    if (!Validation.nonEmptyString(options.collection)) {
      return Promise.reject<string>(new Error("options.collection must be a non-null, non empty string."));
    }

    const data = options.data || {};

    const idGen: InitialIdGenerator = new InitialIdGenerator();
    const dataValueFactory: DataValueFactory = new DataValueFactory(() => {
      return idGen.id();
    });
    const dataValue: ObjectValue = <ObjectValue> dataValueFactory.createDataValue(data);
    const request: CreateRealTimeModelRequest = {
      type: MessageType.CREATE_REAL_TIME_MODEL_REQUEST,
      collectionId: collection,
      modelId: options.id,
      data: dataValue
    };

    return this._connection.request(request).then((response: CreateRealTimeModelResponse) => {
      return response.modelId;
    });
  }

  public remove(collectionId: string, modelId: string): Promise<void> {
    const fqn: ModelFqn = new ModelFqn(collectionId, modelId);

    const request: DeleteRealTimeModelRequest = {
      type: MessageType.DELETE_REAL_TIME_MODEL_REQUEST,
      modelFqn: fqn
    };

    return this._connection.request(request).then(() => {
      return; // convert to Promise<void>
    });
  }

  public history(collectionId: string, modelId: string): Promise<HistoricalModel> {
    const fqn: ModelFqn = new ModelFqn(collectionId, modelId);

    const request: HistoricalDataRequest = {
      type: MessageType.HISTORICAL_DATA_REQUEST,
      modelFqn: fqn
    };

    return this._connection.request(request).then((response: HistoricalDataResponse) => {
      return new HistoricalModel(response.data, response.version, response.modifiedTime, response.createdTime,
        request.modelFqn, this._connection, this.session());
    });
  }

  public permissions(collectionId: string, modelId: string): ModelPermissionManager {
    return new ModelPermissionManager(collectionId, modelId, this._connection);
  }

  public _close(resourceId: string): Promise<void> {
    const request: CloseRealTimeModelRequest = {
      type: MessageType.CLOSES_REAL_TIME_MODEL_REQUEST,
      resourceId
    };

    const model: RealTimeModel = this._openModelsByRid[resourceId];
    delete this._openModelsByRid[resourceId];

    const fqn: ModelFqn = new ModelFqn(model.collectionId(), model.modelId());
    const k: string = fqn.hash();

    delete this._openModelsByModelId[k];

    return this._connection.request(request).then(() => {
      return; // convert to Promise<void>
    });
  }

  public _dispose(): void {
    Object.getOwnPropertyNames(this._openModelsByModelId).forEach((fqn: string) => {
      this._openModelsByModelId[fqn].close();
    });
  }

  private _open(id?: string, options?: AutoCreateModelOptions): Promise<RealTimeModel> {
    if (id === undefined && options === undefined) {
      throw new Error("Internal error, id or options must be defined.");
    }

    if (id === undefined) {
      id = options.id;
    }

    // Opening by a known model id, and this model is already open.
    // return it.
    if (id && this._openModelsByModelId[id] !== undefined) {
      return Promise.resolve(this._openModelsByModelId[id]);
    }

    // Opening by a known model id and we are already opening it.
    // return the promise for the open request.
    if (id && this._openRequestsByModelId[id] !== undefined) {
      return this._openRequestsByModelId[id].promise();
    }

    // At this point we know we don't have the model open, or are not
    // already opening it, possible because we are creating a new model with
    // an new id.

    const autoRequestId: number = options ? this._autoRequestId++ : undefined;

    const request: OpenRealTimeModelRequest = {
      type: MessageType.OPEN_REAL_TIME_MODEL_REQUEST,
      id,
      autoCreateId: autoRequestId
    };

    if (options !== undefined) {
      this._autoCreateRequests[autoRequestId] = options;
    }

    const deferred: Deferred<RealTimeModel> = new Deferred<RealTimeModel>();

    // If we don't have an id 1) we can't have an initializer, and 2) we couldn't possibly
    // ask for this model again since we don't know what the id is until the promise returns.
    if (id !== undefined) {
      this._openRequestsByModelId[id] = deferred;
    }

    this._connection.request(request).then((response: OpenRealTimeModelResponse) => {
      const transformer: OperationTransformer = new OperationTransformer(new TransformationFunctionRegistry());
      const referenceTransformer: ReferenceTransformer = new ReferenceTransformer(new TransformationFunctionRegistry());
      const clientConcurrencyControl: ClientConcurrencyControl = new ClientConcurrencyControl(
        this._connection.session().sessionId(),
        response.version,
        transformer,
        referenceTransformer);

      const model: RealTimeModel = new RealTimeModel(
        response.resourceId,
        response.valueIdPrefix,
        response.data,
        response.connectedClients,
        response.references,
        response.permissions,
        response.version,
        new Date(response.createdTime),
        new Date(response.modifiedTime),
        new ModelFqn(response.collection, response.id),
        clientConcurrencyControl,
        this._connection,
        this
      );

      this._openModelsByModelId[id] = model;
      this._openModelsByRid[response.resourceId] = model;

      if (this._openRequestsByModelId[id] !== undefined) {
        delete this._openRequestsByModelId[id];
      }

      if (options !== undefined) {
        delete this._autoCreateRequests[autoRequestId];
      }

      deferred.resolve(model);
    }).catch((error: Error) => {
      deferred.reject(error);
    });

    return deferred.promise();
  }

  private _handleMessage(messageEvent: MessageEvent): void {
    switch (messageEvent.message.type) {
      case MessageType.MODEL_AUTO_CREATE_CONFIG_REQUEST:
        this._handleModelDataRequest(
          <AutoCreateModelConfigRequest> messageEvent.message,
          messageEvent.callback);
        break;
      default:
        const model: RealTimeModel = this._openModelsByRid[messageEvent.message.resourceId];
        if (model !== undefined) {
          model._handleMessage(messageEvent);
        } else {
          // todo error.
        }
    }
  }

  private _handleModelDataRequest(request: AutoCreateModelConfigRequest, replyCallback: ReplyCallback): void {
    const options: AutoCreateModelOptions = this._autoCreateRequests[request.autoCreateId];
    if (options === undefined) {
      const message = `Received a request for an auto create id that was not expected: ${request.autoCreateId}`;
      console.error(message);
      replyCallback.expectedError("unknown_model", message);
    } else {
      let data: ModelDataInitializer = options.data;
      if (typeof data === "function") {
        data = data();
      }

      let dataValue: ObjectValue;
      if (data !== undefined) {
        const idGen: InitialIdGenerator = new InitialIdGenerator();
        const dataValueFactory: DataValueFactory = new DataValueFactory(() => {
          return idGen.id();
        });
        dataValue = <ObjectValue> dataValueFactory.createDataValue(data);
      }

      const response: AutoCreateModelConfigResponse = {
        type: MessageType.MODEL_AUTO_CREATE_CONFIG_RESPONSE,
        data: dataValue,
        collection: options.collection,
        overrideWorld: options.overrideWorld,
        worldPermissions: options.worldPermissions,
        userPermissions: options.userPermissions,
      };
      replyCallback.reply(response);
    }
  }
}

export type ModelDataInitializer = {[key: string]: any} | (() => {[key: string]: any});

export interface AutoCreateModelOptions extends CreateModelOptions {
  ephemeral: boolean;
}

export interface CreateModelOptions {
  collection: string;
  id?: string;
  data?: ModelDataInitializer;
  overrideWorld?: boolean;
  worldPermissions?: ModelPermissions;
  userPermissions?: {[key: string]: ModelPermissions};
}

class InitialIdGenerator {
  private _prefix: string = "0";
  private _id: number = 0;

  public id(): string {
    return this._prefix + ":" + this._id++;
  }
}
