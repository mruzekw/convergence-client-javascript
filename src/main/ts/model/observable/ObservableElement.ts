import {Path} from "../Path";
import {ConvergenceEvent} from "../../util/ConvergenceEvent";
import {ConvergenceEventEmitter} from "../../util/ConvergenceEventEmitter";

export interface ObservableElementEvents {
  VALUE: string;
  DETACHED: string;
  MODEL_CHANGED: string;
  REFERENCE: string;
}

export const ObservableElementEventConstants: ObservableElementEvents = {
  VALUE: "value",
  DETACHED: "detached",
  REFERENCE: "reference",
  MODEL_CHANGED: "model_changed"
};
Object.freeze(ObservableElementEventConstants);

export interface ObservableElement<T> extends ConvergenceEventEmitter<ConvergenceEvent> {
  id(): string;

  type(): string;

  path(): Path;

  isDetached(): boolean;

  value(): T;
}