#!/usr/bin/env npx ts-node --compiler-options {"module":"commonjs"}

import {connect} from "./connect";
import {CancellationToken} from "../main/ts/";

let domain;
const ct = CancellationToken.create();

connect(ct)
  .then(d => {
    domain = d;
    console.log("connected");

    domain.events().subscribe(e => {
        console.log(e.name);
    });

    return domain.dispose();
  })
  .catch(e => console.error(e));

ct.cancel();

// process.stdin.resume();