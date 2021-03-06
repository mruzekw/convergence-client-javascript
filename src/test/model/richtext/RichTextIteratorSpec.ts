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

import {TestDocumentCreator} from "./documents/TestDocumentCreator";
import {TWO_PARAGRAPHS} from "./documents/two_paragraphs";
import {RichTextIterator, RichTextIteratorOptions} from "../../../main/model/rt/richtext/model/RichTextIterator";
import {RichTextLocation} from "../../../main/model/rt/richtext/model/RichTextLocation";
import {RichTextIterationValidator} from "./documents/RichTextIterationValidator";
import {RichTextString} from "../../../main/model/rt/richtext/model/RichTextString";
import {RichTextRange} from "../../../main/model/rt/richtext/model/RichTextRange";

describe("RichTextIterator", () => {
  describe("Forward traversal", () => {
    it("Full traversal from root", () => {
      const doc = TestDocumentCreator.createDocument(TWO_PARAGRAPHS);
      const root = doc.getRoot("main");
      const options: RichTextIteratorOptions = {
        startLocation: RichTextLocation.ofRoot(root)
      };
      const iterator = new RichTextIterator(options);
      const validator = new RichTextIterationValidator(iterator);

      validator.addNodeExpectation(root);
      validator.addNodeExpectation(root.getChildByPath([0]));
      validator.addNodeExpectation(root.getChildByPath([0, 0]));
      validator.addNodeExpectation(root.getChildByPath([0, 1]));
      validator.addNodeExpectation(root.getChildByPath([0, 2]));
      validator.addNodeExpectation(root.getChildByPath([1]));
      validator.addNodeExpectation(root.getChildByPath([1, 0]));
      validator.validate();
    });

    it("Traversal from child to the end of tree", () => {
      const doc = TestDocumentCreator.createDocument(TWO_PARAGRAPHS);
      const root = doc.getRoot("main");
      const startString = root.getChildByPath([0, 1]);
      const options: RichTextIteratorOptions = {
        startLocation: RichTextLocation.ofContent(startString)
      };

      const iterator = new RichTextIterator(options);
      const validator = new RichTextIterationValidator(iterator);

      validator.addNodeExpectation(root.getChildByPath([0, 1]));
      validator.addNodeExpectation(root.getChildByPath([0, 2]));
      validator.addNodeExpectation(root.getChildByPath([1]));
      validator.addNodeExpectation(root.getChildByPath([1, 0]));
      validator.validate();
    });

    it("Traversal from within a string to the end of tree", () => {
      const doc = TestDocumentCreator.createDocument(TWO_PARAGRAPHS);
      const root = doc.getRoot("main");
      const startString = root.getChildByPath([0, 1]) as RichTextString;
      const options: RichTextIteratorOptions = {
        startLocation: RichTextLocation.ofStringIndex(startString, 4)
      };

      const iterator = new RichTextIterator(options);
      const validator = new RichTextIterationValidator(iterator);

      validator.addStringFragmentExpectation(startString, 4);
      validator.addNodeExpectation(root.getChildByPath([0, 2]));
      validator.addNodeExpectation(root.getChildByPath([1]));
      validator.addNodeExpectation(root.getChildByPath([1, 0]));
      validator.validate();
    });

    it("Traversal from root to within a string", () => {
      const doc = TestDocumentCreator.createDocument(TWO_PARAGRAPHS);
      const root = doc.getRoot("main");
      const startLocation = RichTextLocation.ofRoot(root);
      const endString = root.getChildByPath([0, 2]) as RichTextString;
      const endLocation = RichTextLocation.ofStringIndex(endString, 4);
      const options: RichTextIteratorOptions = {
        range: new RichTextRange(startLocation, endLocation)
      };
      const iterator = new RichTextIterator(options);
      const validator = new RichTextIterationValidator(iterator);

      validator.addNodeExpectation(root);
      validator.addNodeExpectation(root.getChildByPath([0]));
      validator.addNodeExpectation(root.getChildByPath([0, 0]));
      validator.addNodeExpectation(root.getChildByPath([0, 1]));
      validator.addStringFragmentExpectation(endString, 0, 4);
      validator.validate();
    });

    it("Traversal from within a string", () => {
      const doc = TestDocumentCreator.createDocument(TWO_PARAGRAPHS);
      const root = doc.getRoot("main");
      const theString = root.getChildByPath([0, 2]) as RichTextString;
      const startLocation = RichTextLocation.ofStringIndex(theString, 4);
      const endLocation = RichTextLocation.ofStringIndex(theString, 8);
      const options: RichTextIteratorOptions = {
        range: new RichTextRange(startLocation, endLocation)
      };
      const iterator = new RichTextIterator(options);
      const validator = new RichTextIterationValidator(iterator);
      validator.addStringFragmentExpectation(theString, 4, 8);
      validator.validate();
    });

    it("Traversal across two strings", () => {
      const doc = TestDocumentCreator.createDocument(TWO_PARAGRAPHS);
      const root = doc.getRoot("main");
      const startString = root.getChildByPath([0, 1]) as RichTextString;
      const startLocation = RichTextLocation.ofStringIndex(startString, 4);
      const endString = root.getChildByPath([0, 2]) as RichTextString;
      const endLocation = RichTextLocation.ofStringIndex(endString, 8);
      const options: RichTextIteratorOptions = {
        range: new RichTextRange(startLocation, endLocation)
      };
      const iterator = new RichTextIterator(options);
      const validator = new RichTextIterationValidator(iterator);
      validator.addStringFragmentExpectation(startString, 4);
      validator.addStringFragmentExpectation(endString, 0, 8);
      validator.validate();
    });
  });

  describe("Backward traversal", () => {
    it("Full traversal from root", () => {
      const doc = TestDocumentCreator.createDocument(TWO_PARAGRAPHS);
      const root = doc.getRoot("main");
      const options: RichTextIteratorOptions = {
        direction: "backward",
        startLocation: RichTextLocation.ofRoot(root)
      };
      const iterator = new RichTextIterator(options);
      const validator = new RichTextIterationValidator(iterator);

      validator.addNodeExpectation(root.getChildByPath([1, 0]));
      validator.addNodeExpectation(root.getChildByPath([1]));
      validator.addNodeExpectation(root.getChildByPath([0, 2]));
      validator.addNodeExpectation(root.getChildByPath([0, 1]));
      validator.addNodeExpectation(root.getChildByPath([0, 0]));
      validator.addNodeExpectation(root.getChildByPath([0]));
      validator.addNodeExpectation(root);
      validator.validate();
    });

    it("Traversal from child to the end of tree", () => {
      const doc = TestDocumentCreator.createDocument(TWO_PARAGRAPHS);
      const root = doc.getRoot("main");
      const startString = root.getChildByPath([0, 1]);
      const options: RichTextIteratorOptions = {
        direction: "backward",
        startLocation: RichTextLocation.ofContent(startString)
      };

      const iterator = new RichTextIterator(options);
      const validator = new RichTextIterationValidator(iterator);

      validator.addNodeExpectation(root.getChildByPath([1, 0]));
      validator.addNodeExpectation(root.getChildByPath([1]));
      validator.addNodeExpectation(root.getChildByPath([0, 2]));
      validator.addNodeExpectation(root.getChildByPath([0, 1]));
      validator.validate();
    });

    it("Traversal from within a string to the end of tree", () => {
      const doc = TestDocumentCreator.createDocument(TWO_PARAGRAPHS);
      const root = doc.getRoot("main");
      const startString = root.getChildByPath([0, 1]) as RichTextString;
      const options: RichTextIteratorOptions = {
        direction: "backward",
        startLocation: RichTextLocation.ofStringIndex(startString, 4)
      };

      const iterator = new RichTextIterator(options);
      const validator = new RichTextIterationValidator(iterator);

      validator.addNodeExpectation(root.getChildByPath([1, 0]));
      validator.addNodeExpectation(root.getChildByPath([1]));
      validator.addNodeExpectation(root.getChildByPath([0, 2]));
      validator.addStringFragmentExpectation(startString, 4);
      validator.validate();
    });

    it("Traversal from root to within a string", () => {
      const doc = TestDocumentCreator.createDocument(TWO_PARAGRAPHS);
      const root = doc.getRoot("main");
      const startLocation = RichTextLocation.ofRoot(root);
      const endString = root.getChildByPath([0, 2]) as RichTextString;
      const endLocation = RichTextLocation.ofStringIndex(endString, 4);
      const options: RichTextIteratorOptions = {
        direction: "backward",
        range: new RichTextRange(startLocation, endLocation)
      };
      const iterator = new RichTextIterator(options);
      const validator = new RichTextIterationValidator(iterator);

      validator.addStringFragmentExpectation(endString, 0, 4);
      validator.addNodeExpectation(root.getChildByPath([0, 1]));
      validator.addNodeExpectation(root.getChildByPath([0, 0]));
      validator.addNodeExpectation(root.getChildByPath([0]));
      validator.addNodeExpectation(root);
      validator.validate();
    });

    it("Traversal from within a string", () => {
      const doc = TestDocumentCreator.createDocument(TWO_PARAGRAPHS);
      const root = doc.getRoot("main");
      const theString = root.getChildByPath([0, 2]) as RichTextString;
      const startLocation = RichTextLocation.ofStringIndex(theString, 4);
      const endLocation = RichTextLocation.ofStringIndex(theString, 8);
      const options: RichTextIteratorOptions = {
        direction: "backward",
        range: new RichTextRange(startLocation, endLocation)
      };
      const iterator = new RichTextIterator(options);
      const validator = new RichTextIterationValidator(iterator);
      validator.addStringFragmentExpectation(theString, 4, 8);
      validator.validate();
    });

    it("Traversal across two strings", () => {
      const doc = TestDocumentCreator.createDocument(TWO_PARAGRAPHS);
      const root = doc.getRoot("main");
      const startString = root.getChildByPath([0, 1]) as RichTextString;
      const startLocation = RichTextLocation.ofStringIndex(startString, 4);
      const endString = root.getChildByPath([0, 2]) as RichTextString;
      const endLocation = RichTextLocation.ofStringIndex(endString, 8);
      const options: RichTextIteratorOptions = {
        direction: "backward",
        range: new RichTextRange(startLocation, endLocation)
      };
      const iterator = new RichTextIterator(options);
      const validator = new RichTextIterationValidator(iterator);
      validator.addStringFragmentExpectation(endString, 0, 8);
      validator.addStringFragmentExpectation(startString, 4);
      validator.validate();
    });
  });
});
