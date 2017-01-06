import {ObservableElement, ObservableElementEvents, ObservableElementEventConstants} from "./ObservableElement";

export interface ObservableStringEvents extends ObservableElementEvents {
  INSERT: string;
  REMOVE: string;
}

export const ObservableStringEventConstants: ObservableStringEvents = Object.assign({
    INSERT: "insert",
    REMOVE: "remove"
  },
  ObservableElementEventConstants
);
Object.freeze(ObservableStringEventConstants);

export interface ObservableString extends ObservableElement<string> {
  length(): number;
}