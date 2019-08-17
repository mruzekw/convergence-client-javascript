import {ModelPermissions} from "./ModelPermissions";
import {ModelDataInitializer} from "./ModelDataInitializer";

export interface ICreateModelOptions {
  /**
   * The collection in which this model will live.
   */
  collection: string;

  /**
   * The model's ID.  If not provided, a UUID will be generated.
   */
  id?: string;

  /**
   * The initial contents of the model, either provided directly or as the result
   * of a callback function.  This data should be easily serializable.
   */
  data?: ModelDataInitializer;

  /**
   * Set to true if the permissions set in this object should override those set
   * in the parent collection.
   */
  overrideCollectionWorldPermissions?: boolean;

  /**
   * Generic permissions for this model for all users.
   */
  worldPermissions?: ModelPermissions;

  /**
   * Per-user permissions can be set here, where the key is an existing user's username.
   */
  userPermissions?: { [username: string]: ModelPermissions };
}
