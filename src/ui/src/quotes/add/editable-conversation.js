import {bindable, inject} from "aurelia-framework";
import {Line} from "../conversation";
import {Hotkeys} from "../../hotkeys";
import {Logger} from "../../util/cqrs-logging";
import {ValidationRules, ValidationControllerFactory, validateTrigger} from "aurelia-validation";

@inject(Hotkeys, ValidationControllerFactory)
class EditableConversation {
  @bindable conversation;
  @bindable save;
  hotkeys;
  validation;
  lines;
  editingLine;

  constructor(Hotkeys, ValidationControllerFactory) {
    this.hotkeys = Hotkeys;
    this.validation = ValidationControllerFactory.createForCurrentScope();
    this.init();
    ValidationRules
      .ensure(l => l.author).required()
      .ensure(l => l.text).required()
      .on(EditableLine);
  }

  init() {
    this.lines = [];
    this.addLine();
  }

  doAfterValidation(success) {
    this.validation.validate()
      .then(errors => {
        this.validationErrors = errors;
        if (this.validationErrors.length == 0) {
          success();
        }
      })
      .catch(err => Logger.error('something terrible has happened', err));
  }

  addLinesToConversation() {
    for (let line of this.lines) {
      this.conversation.addLine(new Line(line.type, line.text, line.author, false));
    }
  }

  removeLine() {
    if (this.lines.length == 1) {
      return;
    }
    this.lines.pop();
    this.editingLine = this.lines[this.lines.length - 1];
    this.editingLine.hasFocus = true;
  }

  addLine() {
    this.editingLine = new EditableLine();
    this.lines.push(this.editingLine);
  }

  /** key event handlers **/
  handle(event) {
    if (this.hotkeys.submitQuoteKeyPressed(event)) {
      this.doAfterValidation(() => {
        this.addLinesToConversation();
        this.save();
        this.init();
      });
      return false;
    }
    if (this.hotkeys.nextLineKeyPressed(event)) {
      this.doAfterValidation(() => {
        this.addLine();
      });
      return false;
    }
    if (this.hotkeys.deleteLineKeyPressed(event)) {
      this.removeLine();
      return false;
    }
    if (this.hotkeys.toggleContextKeyPressed(event)) {
      this.toggleContext();
      return false;
    }
    if (this.validationErrors && this.validationErrors.length) {
      this.validation.reset();
      this.validationErrors = [];
    }
    return true;
  }

  toggleContext() {
    if (this.editingLine.type == 'SPEECH') {
      this.editingLine.type = 'CONTEXT';
      this.editingLine.author = 'Context';
      this.editingLine.textHasFocus = true;
      this.editingLine.hasFocus = false;
    } else if (this.editingLine.type == 'CONTEXT') {
      this.editingLine.type = 'SPEECH';
      this.editingLine.author = '';
      this.editingLine.textHasFocus = false;
      this.editingLine.hasFocus = true;
    }
  }
}

class EditableLine {
  type = 'SPEECH';
  author = '';
  text = '';
  hasFocus = true;
  textHasFocus = false;
}

export { EditableConversation }
