#!/usr/bin/env npx ts-node --compiler-options {"module":"commonjs"}

(global as any).CONVERGENCE_DEBUG = {PROTOCOL_MESSAGES: true};

import {connect} from "./connect";
import {ConvergenceDomain, RealTimeObject} from "../main";
let domain: ConvergenceDomain;

connect()
  .then(d => {
    domain = d;
    console.log("connected: ", d.session().sessionId());
    return d.models().openAutoCreate({
      ephemeral: true,
      collection: "test",
      id: "my-test-id",
      data: {
        nested: {
          property: "foo"
        }
      }
    });
  })
  .then(model => {
    console.log("Model Open");
    console.log(JSON.stringify(model.root().value()));
    console.log(model.elementAt("nested", "property").path());
    const obj = model.elementAt("nested") as RealTimeObject;
    obj.remove("property");
    console.log("Closing Model");
    return model.close();
  })
  .then(() => {
    console.log("Model closed");
    console.log("Disposing the domain.");
    return domain.dispose();
  })
  .then(() => {
    console.log("Domain Disposed");
  })
  .catch(e => console.error(e));
