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

Vue.component('model-controls', {
  props: ["enabled", "model"],
  data: () => {
    return {
      openModelId: "",
      createModelId: "",
      deleteModelId: "",
      subscription: null
    };
  },
  watch: {
    model() {
      if (this.model) {
        this.openModelId = this.model.modelId();
        this.subscription = this.model.events().subscribe(e => console.log(e));
      }
    }
  },
  methods: {
    createModel() {
      this.$emit("createModel", this.createModelId);
    },
    deleteModel() {
      this.$emit("deleteModel", this.deleteModelId);
    },
    openModel() {
      this.$emit("openModel", this.openModelId);
    },
    closeModel() {
      if (this.subscription !== null) {
        this.subscription.unsubscribe();
      }
      this.$emit("closeModel");
    }
  },
  template: `
<div class="card">
  <div class="card-body">
    <h5 class="card-title">Model Controls</h5>
    <div class="input-group mb-3">
      <button class="btn btn-primary" :disabled="!enabled || model !== null || openModelId === ''" v-on:click="openModel">Open Model</button>
      <button class="btn btn-primary ml-3" :disabled="!enabled || model === null" v-on:click="closeModel">Close Model</button>
      <div class="input-group-prepend ml-3"><span class="input-group-text">Model Id</span></div>
      <input type="text" class="form-control" v-model="openModelId" v-bind:disabled="!enabled || model">
    </div>
    
    <div class="input-group mb-3">
      <button class="btn btn-primary" :disabled="!enabled || createModelId === ''" v-on:click="createModel">Create Model</button>
      <div class="input-group-prepend ml-3"><span class="input-group-text">Model Id</span></div>
      <input type="text" class="form-control" v-model="createModelId" v-bind:disabled="!enabled">
    </div>
   
    <div class="input-group mb-3">
      <button class="btn btn-primary" :disabled="!enabled || deleteModelId === ''" v-on:click="deleteModel">Delete Model</button>
      <div class="input-group-prepend ml-3"><span class="input-group-text">Model Id</span></div>
      <input type="text" class="form-control" v-model="deleteModelId" v-bind:disabled="!enabled">
    </div>
  </div>
</div>
  `
});
