webpackJsonp([1],{

/***/ "/N1f":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ "BbDo":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ "NZPQ":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ "OkBc":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });

// EXTERNAL MODULE: ./node_modules/vue/dist/vue.esm.js
var vue_esm = __webpack_require__("7+uW");

// EXTERNAL MODULE: ./node_modules/vee-validate/dist/vee-validate.esm.js
var vee_validate_esm = __webpack_require__("sUu7");

// EXTERNAL MODULE: ./node_modules/bulma/bulma.sass
var bulma = __webpack_require__("ZA4m");
var bulma_default = /*#__PURE__*/__webpack_require__.n(bulma);

// EXTERNAL MODULE: ./node_modules/babel-runtime/helpers/extends.js
var helpers_extends = __webpack_require__("Dd8w");
var extends_default = /*#__PURE__*/__webpack_require__.n(helpers_extends);

// EXTERNAL MODULE: ./node_modules/vue-smooth-dnd/dist/vue-smooth-dnd.js
var vue_smooth_dnd = __webpack_require__("aGPD");
var vue_smooth_dnd_default = /*#__PURE__*/__webpack_require__.n(vue_smooth_dnd);

// CONCATENATED MODULE: ./node_modules/babel-loader/lib!./node_modules/vue-loader/lib/selector.js?type=script&index=0!./src/app/views/elements/Card.vue
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//


/* harmony default export */ var Card = ({
  props: {
    item: Object
  },

  computed: {
    classes: function classes() {
      return {
        'is-due': this.isDue,
        'is-overdue': this.isOverdue
      };
    },
    timestamp: function timestamp() {
      return Number(new Date(this.item.date));
    },
    isOverdue: function isOverdue() {
      return this.timestamp && this.timestamp < Date.now();
    },
    isDue: function isDue() {
      var date = this.timestamp;
      var due = date - 1000 * 60 * 60 * 24 * 3;
      var now = Date.now();
      return date > now && now > due;
    }
  },

  methods: {
    edit: function edit() {
      this.$emit('edit', this.item);
    },
    remove: function remove($event) {
      if ($event.ctrlKey || $event.metaKey || confirm('Are you sure you want to remove this item?')) {
        this.$emit('remove', this.item);
      }
    }
  }
});
// CONCATENATED MODULE: ./node_modules/vue-loader/lib/template-compiler?{"id":"data-v-d1a2bd3e","hasScoped":true,"transformToRequire":{"video":["src","poster"],"source":"src","img":"src","image":"xlink:href"},"buble":{"transforms":{}}}!./node_modules/vue-loader/lib/selector.js?type=template&index=0!./src/app/views/elements/Card.vue
var render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"card",class:_vm.classes,attrs:{"data-id":_vm.item.id}},[_c('div',{staticClass:"icons"},[(_vm.isDue)?_c('span',{staticClass:"icon icon-due has-text-warning",attrs:{"title":("Item is due on " + (_vm.item.date))}},[_c('i',{staticClass:"fas fa-star"})]):(_vm.timestamp)?_c('span',{staticClass:"icon icon-date",attrs:{"title":("Item is due on " + (_vm.item.date))}},[_c('i',{staticClass:"far fa-bell"})]):_vm._e(),_vm._v(" "),_c('span',{staticClass:"icon icon-remove",on:{"click":_vm.remove}},[_c('i',{staticClass:"fas fa-times"})])]),_vm._v(" "),_c('div',{staticClass:"text",on:{"click":_vm.edit}},[_c('p',{staticClass:"item-title"},[_vm._v(_vm._s(_vm.item.title))]),_vm._v(" "),(_vm.item.description)?_c('p',{staticClass:"item-description"},[_vm._v(_vm._s(_vm.item.description))]):_vm._e()])])}
var staticRenderFns = []
var esExports = { render: render, staticRenderFns: staticRenderFns }
/* harmony default export */ var elements_Card = (esExports);
// CONCATENATED MODULE: ./src/app/views/elements/Card.vue
function injectStyle (ssrContext) {
  __webpack_require__("zouE")
}
var normalizeComponent = __webpack_require__("VU/8")
/* script */


/* template */

/* template functional */
var __vue_template_functional__ = false
/* styles */
var __vue_styles__ = injectStyle
/* scopeId */
var __vue_scopeId__ = "data-v-d1a2bd3e"
/* moduleIdentifier (server only) */
var __vue_module_identifier__ = null
var Component = normalizeComponent(
  Card,
  elements_Card,
  __vue_template_functional__,
  __vue_styles__,
  __vue_scopeId__,
  __vue_module_identifier__
)

/* harmony default export */ var views_elements_Card = (Component.exports);

// CONCATENATED MODULE: ./node_modules/babel-loader/lib!./node_modules/vue-loader/lib/selector.js?type=script&index=0!./src/app/views/ui/UiInlineEdit.vue
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//


/**
 * @emits {id, text, more}   enter
 */
/* harmony default export */ var UiInlineEdit = ({
  props: {
    text: String,
    placeholder: {
      type: String,
      default: 'Edit text'
    }
  },

  data: function data() {
    return {
      edit: false,
      input: this.text
    };
  },


  methods: {
    onEdit: function onEdit() {
      var _this = this;

      this.edit = true;
      this.$emit('edit', true);
      this.$nextTick(function () {
        _this.$refs.input.focus();
        _this.$refs.input.select();
      });
    },
    onSave: function onSave() {
      if (this.input) {
        this.$emit('submit', this.input);
        this.edit = false;
        this.$emit('edit', false);
      }
    },
    onCancel: function onCancel() {
      var _this2 = this;

      this.edit = false;
      this.input = this.text;
      this.$nextTick(function () {
        _this2.$emit('cancel');
        _this2.$emit('edit', false);
      });
    },
    onBlur: function onBlur() {
      this.input && this.input !== this.text ? this.onSave() : this.onCancel();
    }
  }
});
// CONCATENATED MODULE: ./node_modules/vue-loader/lib/template-compiler?{"id":"data-v-0496f8d3","hasScoped":false,"transformToRequire":{"video":["src","poster"],"source":"src","img":"src","image":"xlink:href"},"buble":{"transforms":{}}}!./node_modules/vue-loader/lib/selector.js?type=template&index=0!./src/app/views/ui/UiInlineEdit.vue
var UiInlineEdit_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"ui-inline-edit"},[(!_vm.edit)?_c('label',{staticClass:"text",on:{"click":_vm.onEdit}},[_vm._v(_vm._s(_vm.text))]):_c('input',{directives:[{name:"model",rawName:"v-model.trim",value:(_vm.input),expression:"input",modifiers:{"trim":true}}],ref:"input",staticClass:"input",attrs:{"placeholder":_vm.placeholder},domProps:{"value":(_vm.input)},on:{"keydown":[function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"enter",13,$event.key,"Enter")){ return null; }return _vm.onSave($event)},function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"escape",undefined,$event.key,undefined)){ return null; }return _vm.onCancel($event)}],"blur":[_vm.onBlur,function($event){_vm.$forceUpdate()}],"input":function($event){if($event.target.composing){ return; }_vm.input=$event.target.value.trim()}}})])}
var UiInlineEdit_staticRenderFns = []
var UiInlineEdit_esExports = { render: UiInlineEdit_render, staticRenderFns: UiInlineEdit_staticRenderFns }
/* harmony default export */ var ui_UiInlineEdit = (UiInlineEdit_esExports);
// CONCATENATED MODULE: ./src/app/views/ui/UiInlineEdit.vue
function UiInlineEdit_injectStyle (ssrContext) {
  __webpack_require__("sbjo")
}
var UiInlineEdit_normalizeComponent = __webpack_require__("VU/8")
/* script */


/* template */

/* template functional */
var UiInlineEdit___vue_template_functional__ = false
/* styles */
var UiInlineEdit___vue_styles__ = UiInlineEdit_injectStyle
/* scopeId */
var UiInlineEdit___vue_scopeId__ = null
/* moduleIdentifier (server only) */
var UiInlineEdit___vue_module_identifier__ = null
var UiInlineEdit_Component = UiInlineEdit_normalizeComponent(
  UiInlineEdit,
  ui_UiInlineEdit,
  UiInlineEdit___vue_template_functional__,
  UiInlineEdit___vue_styles__,
  UiInlineEdit___vue_scopeId__,
  UiInlineEdit___vue_module_identifier__
)

/* harmony default export */ var views_ui_UiInlineEdit = (UiInlineEdit_Component.exports);

// CONCATENATED MODULE: ./node_modules/babel-loader/lib!./node_modules/vue-loader/lib/selector.js?type=script&index=0!./src/app/views/elements/ListHeader.vue
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//



/* harmony default export */ var ListHeader = ({
  components: {
    UiInlineEdit: views_ui_UiInlineEdit
  },

  props: {
    title: String
  },

  data: function data() {
    return {
      editing: false
    };
  },


  methods: {
    remove: function remove($event) {
      if ($event.ctrlKey || $event.metaKey || confirm('Are you sure you want to remove this list?')) {
        this.$emit('remove');
      }
    }
  }
});
// CONCATENATED MODULE: ./node_modules/vue-loader/lib/template-compiler?{"id":"data-v-719c6b52","hasScoped":true,"transformToRequire":{"video":["src","poster"],"source":"src","img":"src","image":"xlink:href"},"buble":{"transforms":{}}}!./node_modules/vue-loader/lib/selector.js?type=template&index=0!./src/app/views/elements/ListHeader.vue
var ListHeader_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"list-header"},[_c('span',{staticClass:"list-drag-handle"},[_vm._v("☰")]),_vm._v(" "),_c('ui-inline-edit',{ref:"input",staticClass:"list-title",attrs:{"text":_vm.title},on:{"submit":function (value) { return _vm.$emit('submit', value); },"cancel":function($event){_vm.$emit('cancel')},"edit":function (state) { return _vm.editing = state; }}}),_vm._v(" "),(!_vm.editing)?_c('div',{staticClass:"icons"},[_c('span',{staticClass:"icon icon-remove",on:{"click":_vm.remove}},[_c('i',{staticClass:"fas fa-times"})])]):_vm._e()],1)}
var ListHeader_staticRenderFns = []
var ListHeader_esExports = { render: ListHeader_render, staticRenderFns: ListHeader_staticRenderFns }
/* harmony default export */ var elements_ListHeader = (ListHeader_esExports);
// CONCATENATED MODULE: ./src/app/views/elements/ListHeader.vue
function ListHeader_injectStyle (ssrContext) {
  __webpack_require__("j+tB")
}
var ListHeader_normalizeComponent = __webpack_require__("VU/8")
/* script */


/* template */

/* template functional */
var ListHeader___vue_template_functional__ = false
/* styles */
var ListHeader___vue_styles__ = ListHeader_injectStyle
/* scopeId */
var ListHeader___vue_scopeId__ = "data-v-719c6b52"
/* moduleIdentifier (server only) */
var ListHeader___vue_module_identifier__ = null
var ListHeader_Component = ListHeader_normalizeComponent(
  ListHeader,
  elements_ListHeader,
  ListHeader___vue_template_functional__,
  ListHeader___vue_styles__,
  ListHeader___vue_scopeId__,
  ListHeader___vue_module_identifier__
)

/* harmony default export */ var views_elements_ListHeader = (ListHeader_Component.exports);

// EXTERNAL MODULE: ./node_modules/babel-runtime/core-js/object/assign.js
var object_assign = __webpack_require__("woOf");
var assign_default = /*#__PURE__*/__webpack_require__.n(object_assign);

// CONCATENATED MODULE: ./node_modules/babel-loader/lib!./node_modules/vue-loader/lib/selector.js?type=script&index=0!./src/app/views/ui/UiItemForm.vue

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//


function _data() {
  return {
    id: null,
    title: '',
    description: '',
    date: null,
    message: ''
  };
}

/* harmony default export */ var UiItemForm = ({
  data: function data() {
    return _data();
  },


  computed: {
    values: function values() {
      return this.$data;
    }
  },

  methods: {
    fill: function fill(values) {
      assign_default()(this, _data(), values);
      this.$el.querySelector('[name="description"]').focus();
    },
    validate: function validate() {
      var _this = this;

      this.$validator.validate().then(function (state) {
        if (state) {
          return _this.submit();
        }
        _this.message = 'Please complete the required fields!';
      });
    },
    submit: function submit() {
      this.$emit('submit', this.values);
      this.reset();
    },
    cancel: function cancel() {
      this.$emit('cancel', this.values);
      this.reset();
    },
    reset: function reset() {
      assign_default()(this, _data());
    },
    getError: function getError(name) {
      return (this.errors.first(name) || '').replace(/The .+ field/, 'This field');
    }
  }
});
// CONCATENATED MODULE: ./node_modules/vue-loader/lib/template-compiler?{"id":"data-v-41ec7dc4","hasScoped":false,"transformToRequire":{"video":["src","poster"],"source":"src","img":"src","image":"xlink:href"},"buble":{"transforms":{}}}!./node_modules/vue-loader/lib/selector.js?type=template&index=0!./src/app/views/ui/UiItemForm.vue
var UiItemForm_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"query-form card"},[_c('div',{staticClass:"card-content"},[_c('h2',{staticClass:"title"},[_vm._v(_vm._s(_vm.id ? 'Edit' : 'New')+" task")]),_vm._v(" "),_c('ui-input',{directives:[{name:"validate",rawName:"v-validate",value:('required'),expression:"'required'"}],attrs:{"name":"title","label":"Title","error":_vm.getError('title')},on:{"enter":_vm.validate},model:{value:(_vm.title),callback:function ($$v) {_vm.title=$$v},expression:"title"}}),_vm._v(" "),_c('ui-input',{attrs:{"name":"description","type":"textarea","label":"Description"},model:{value:(_vm.description),callback:function ($$v) {_vm.description=$$v},expression:"description"}}),_vm._v(" "),_c('ui-input',{attrs:{"name":"date","type":"date","label":"Date"},on:{"enter":_vm.validate},model:{value:(_vm.date),callback:function ($$v) {_vm.date=$$v},expression:"date"}}),_vm._v(" "),_c('div',{staticClass:"field is-grouped"},[_c('ui-button',{attrs:{"type":"primary"},on:{"click":_vm.validate}},[_vm._v(_vm._s(_vm.id ? 'Update' : 'Add'))]),_vm._v(" "),_c('ui-button',{attrs:{"type":"text"},on:{"click":_vm.cancel}},[_vm._v("Cancel")])],1)],1)])}
var UiItemForm_staticRenderFns = []
var UiItemForm_esExports = { render: UiItemForm_render, staticRenderFns: UiItemForm_staticRenderFns }
/* harmony default export */ var ui_UiItemForm = (UiItemForm_esExports);
// CONCATENATED MODULE: ./src/app/views/ui/UiItemForm.vue
function UiItemForm_injectStyle (ssrContext) {
  __webpack_require__("BbDo")
}
var UiItemForm_normalizeComponent = __webpack_require__("VU/8")
/* script */


/* template */

/* template functional */
var UiItemForm___vue_template_functional__ = false
/* styles */
var UiItemForm___vue_styles__ = UiItemForm_injectStyle
/* scopeId */
var UiItemForm___vue_scopeId__ = null
/* moduleIdentifier (server only) */
var UiItemForm___vue_module_identifier__ = null
var UiItemForm_Component = UiItemForm_normalizeComponent(
  UiItemForm,
  ui_UiItemForm,
  UiItemForm___vue_template_functional__,
  UiItemForm___vue_styles__,
  UiItemForm___vue_scopeId__,
  UiItemForm___vue_module_identifier__
)

/* harmony default export */ var views_ui_UiItemForm = (UiItemForm_Component.exports);

// CONCATENATED MODULE: ./node_modules/babel-loader/lib!./node_modules/vue-loader/lib/selector.js?type=script&index=0!./src/app/views/ui/UiItemEdit.vue
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//


/**
 * @emits {id, text, more}   enter
 */
/* harmony default export */ var UiItemEdit = ({
  props: {
    listId: [String, Number],
    placeholder: String,
    icon: {
      type: String,
      default: 'angle-right'
    }
  },

  data: function data() {
    return {
      input: ''
    };
  },


  methods: {
    onEnter: function onEnter($event) {
      this.onSave($event.metaKey || $event.ctrlKey);
    },
    onClick: function onClick() {
      this.onSave(true);
    },
    onSave: function onSave(more) {
      if (this.input) {
        this.$emit('submit', {
          id: this.listId,
          text: this.input,
          more: more
        });
        this.input = '';
      }
    }
  }
});
// CONCATENATED MODULE: ./node_modules/vue-loader/lib/template-compiler?{"id":"data-v-448d1620","hasScoped":false,"transformToRequire":{"video":["src","poster"],"source":"src","img":"src","image":"xlink:href"},"buble":{"transforms":{}}}!./node_modules/vue-loader/lib/selector.js?type=template&index=0!./src/app/views/ui/UiItemEdit.vue
var UiItemEdit_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"ui-item-entry field has-addons"},[_c('div',{staticClass:"control is-expanded"},[_c('input',{directives:[{name:"model",rawName:"v-model.trim",value:(_vm.input),expression:"input",modifiers:{"trim":true}}],staticClass:"input",attrs:{"placeholder":_vm.placeholder},domProps:{"value":(_vm.input)},on:{"keydown":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"enter",13,$event.key,"Enter")){ return null; }return _vm.onEnter($event)},"input":function($event){if($event.target.composing){ return; }_vm.input=$event.target.value.trim()},"blur":function($event){_vm.$forceUpdate()}}})]),_vm._v(" "),(_vm.icon)?_c('div',{staticClass:"control"},[_c('button',{staticClass:"button is-primary",attrs:{"type":"submit","disabled":_vm.input.length === 0,"tabindex":"-1"},on:{"click":_vm.onClick}},[_c('span',{staticClass:"icon is-small"},[_c('i',{class:("fas fa-" + _vm.icon)})])])]):_vm._e()])}
var UiItemEdit_staticRenderFns = []
var UiItemEdit_esExports = { render: UiItemEdit_render, staticRenderFns: UiItemEdit_staticRenderFns }
/* harmony default export */ var ui_UiItemEdit = (UiItemEdit_esExports);
// CONCATENATED MODULE: ./src/app/views/ui/UiItemEdit.vue
function UiItemEdit_injectStyle (ssrContext) {
  __webpack_require__("NZPQ")
}
var UiItemEdit_normalizeComponent = __webpack_require__("VU/8")
/* script */


/* template */

/* template functional */
var UiItemEdit___vue_template_functional__ = false
/* styles */
var UiItemEdit___vue_styles__ = UiItemEdit_injectStyle
/* scopeId */
var UiItemEdit___vue_scopeId__ = null
/* moduleIdentifier (server only) */
var UiItemEdit___vue_module_identifier__ = null
var UiItemEdit_Component = UiItemEdit_normalizeComponent(
  UiItemEdit,
  ui_UiItemEdit,
  UiItemEdit___vue_template_functional__,
  UiItemEdit___vue_styles__,
  UiItemEdit___vue_scopeId__,
  UiItemEdit___vue_module_identifier__
)

/* harmony default export */ var views_ui_UiItemEdit = (UiItemEdit_Component.exports);

// CONCATENATED MODULE: ./src/core/utils/plugins.js
/**
 * Helper function to manage @drop events for VueSmoothDnD
 *
 * Returns a handler function that manages drop events and calls a final drop handler
 * once removed and completed events have been received
 *
 * @usage onDrop: makeDropHandler('onDropComplete', 'onDrop
 *
 * @param   {string}      onComplete    The onComplete handler name
 * @param   {string}     [onDrop]       Optional onDrop handler name
 * @returns {Function}                  Handler function that manages all @drop evens
 */
function makeDropHandler (onComplete, onDrop) {
  let src = null
  let trg = null
  let payload = null
  let element = null

  function reset () {
    src = null
    trg = null
    payload = null
    element = null
  }

  /**
   * DropHandler function
   *
   * Handles the DnD @drop event:
   *
   * When both remove and added event have been received, the passed
   * onComplete handler is called, passing the following properties:
   *
   *  - @param  {DragData}      src         Information about the drag source
   *  - @param  {DragData}      trg         Information about the drop target
   *  - @param  {HTMLElement}   element     A reference to the dragged HTML element
   *  - @param  {*}            [payload]    Any payload that was passed using "get-child-payload"
   *
   * The function itself takes the following parameters
   *
   * @param     {object}        event       The drag event created by the plugin
   * @param     {*[]}           params      Any additional parameters that were passed to the handler
   */
  return function onDrop (event, ...params) {
    // delegate to drop handler if supplied
    if (this.onDrop) {
      this[onDrop](event, ...params)
    }

    // source and target events
    if (event.removedIndex !== null) {
      src = new DragData(event.removedIndex, params)
    }
    if (event.addedIndex !== null) {
      trg = new DragData(event.addedIndex, params)
      payload = event.payload
      element = event.droppedElement
    }

    // source and target events have fired
    if (src && trg) {
      this[onComplete](src, trg, element, payload)
      reset()
    }
  }
}

/**
 * A class which represents data about a drag
 *
 * @param {array}   index     The array index of the dragged item
 * @param {array}   params    Additional params that were passed
 * @constructor
 */
function DragData (index, params) {
  this.index = index
  this.params = params
}

// CONCATENATED MODULE: ./src/app/state/demo.js
function makeData () {
  return [
    {
      title: 'To do',
      items: [
        { title: 'Make a donation to ' + chrome.i18n.getMessage('browserAction_title'), date: days(-5) },
        { title: 'Join a groupchat', description: 'Need to find a public chat room!', date: days(2) },
        { title: 'Add a contact', description: '', date: days(10) },
        { title: 'Invite others to my first Meeting' },
        { title: 'Post on Twitter about ' + chrome.i18n.getMessage('browserAction_title')}
      ]
    },
    {
      title: 'Doing',
      items: [
        { title: 'Testing '  + chrome.i18n.getMessage('browserAction_title') }
      ]
    },
    {
      title: 'Done',
      items: [
        { title: 'Installing '  + chrome.i18n.getMessage('browserAction_title') + ' from web store' }
      ]
    }
  ]
}

function days (num) {
  return new Date(Date.now() + (1000 * 60 * 60 * 24 * num))
}

// CONCATENATED MODULE: ./node_modules/babel-loader/lib!./node_modules/vue-loader/lib/selector.js?type=script&index=0!./src/app/views/elements/Board.vue

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//










/* harmony default export */ var Board = ({
  components: {
    Container: vue_smooth_dnd["Container"],
    Draggable: vue_smooth_dnd["Draggable"],
    ListHeader: views_elements_ListHeader,
    Card: views_elements_Card,
    UiItemEdit: views_ui_UiItemEdit,
    UiItemForm: views_ui_UiItemForm
  },

  data: function data() {
    return {
      modal: false,
      activeListId: null
    };
  },

  computed: {
    lists: function lists() {
      return this.$store.state.board.lists;
    }
  },

  methods: {
    onAddList: function onAddList(_ref) {
      var _this = this;

      var text = _ref.text;

      this.$store.commit('addList', { title: text });
      this.$nextTick(function () {
        var lists = _this.$store.state.board.lists;
        _this.focusInput(lists[lists.length - 1].id);
      });
    },
    onEditList: function onEditList(listId, title) {
      this.$store.commit('updateList', { listId: listId, title: title });
      this.focusInput(listId);
    },
    removeList: function removeList(listId) {
      this.$store.commit('removeList', listId);
    },
    onAddItem: function onAddItem(_ref2) {
      var id = _ref2.id,
          text = _ref2.text,
          more = _ref2.more;

      if (more) {
        this.activeListId = id;
        this.modal = true;
        this.showModal({ title: text });
        return;
      }
      this.addItem(id, text);
    },
    onAddFullItem: function onAddFullItem(item) {
      item.id ? this.$store.commit('updateItem', extends_default()({ itemId: item.id }, item)) : this.addItem(this.activeListId, item.title, item.description, item.date);
      this.hideModal();
    },
    addItem: function addItem(listId, title, description, date) {
      this.$store.commit('addItem', { listId: listId, title: title, description: description, date: date });
    },
    editItem: function editItem(item) {
      this.showModal(item);
    },
    removeItem: function removeItem(item) {
      this.$store.commit('removeItem', item.id);
    },


    onListDrop: makeDropHandler('onListDropComplete'),

    onListDropComplete: function onListDropComplete(src, trg) {
      this.$store.commit('moveList', { fromIndex: src.index, toIndex: trg.index });
    },

    onCardDrop: makeDropHandler('onCardDropComplete'),

    onCardDropComplete: function onCardDropComplete(src, trg, element, payload) {
      this.$store.commit('moveItem', {
        fromList: src.params[1],
        fromIndex: src.index,
        toList: trg.params[1],
        toIndex: trg.index
      });
    },
    showModal: function showModal(item) {
      var _this2 = this;

      this.modal = true;
      this.$nextTick(function () {
        _this2.$refs.form.fill(item);
      });
    },
    hideModal: function hideModal() {
      this.focusInput(this.activeListId);
      this.modal = false;
    },
    focusInput: function focusInput(listId) {
      var index = this.lists.findIndex(function (list) {
        return list.id === listId;
      });
      if (index > -1) {
        this.$refs.list[index].querySelector('input').focus();
      }
    },
    reset: function reset() {
      if (confirm('Are you sure you want to reset the board?')) {
        this.$store.commit('reset');
      }
    },
    demo: function demo() {
      this.$store.dispatch('setLists', makeData());
    }
  }
});
// CONCATENATED MODULE: ./node_modules/vue-loader/lib/template-compiler?{"id":"data-v-78e068b2","hasScoped":false,"transformToRequire":{"video":["src","poster"],"source":"src","img":"src","image":"xlink:href"},"buble":{"transforms":{}}}!./node_modules/vue-loader/lib/selector.js?type=template&index=0!./src/app/views/elements/Board.vue
var Board_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"board-container"},[_c('div',{staticClass:"board"},[_c('div',{staticClass:"clear-button"},[_c('ui-button',{directives:[{name:"show",rawName:"v-show",value:(_vm.lists.length === 0),expression:"lists.length === 0"}],attrs:{"type":"primary"},on:{"click":_vm.demo}},[_vm._v("Demo")]),_vm._v(" "),_c('ui-button',{directives:[{name:"show",rawName:"v-show",value:(_vm.lists.length !== 0),expression:"lists.length !== 0"}],on:{"click":_vm.reset}},[_vm._v("Reset")])],1),_vm._v(" "),_c('div',{staticClass:"lists-container"},[_c('Container',{attrs:{"lock-axis":"x","orientation":"horizontal","drag-handle-selector":".list-drag-handle"},on:{"drop":_vm.onListDrop}},_vm._l((_vm.lists),function(list,listIndex){return _c('Draggable',{key:list.id},[_c('section',{ref:"list",refInFor:true,staticClass:"list-container",attrs:{"data-id":list.id}},[_c('list-header',{attrs:{"title":list.title},on:{"submit":function (value) { return _vm.onEditList(list.id, value); },"remove":function($event){_vm.removeList(list.id)}}}),_vm._v(" "),_c('Container',{attrs:{"group-name":"list","drag-class":"card-ghost","drop-class":"card-ghost-drop","non-drag-area-selector":".icon","animation-duration":100},on:{"drop":function (e) { return _vm.onCardDrop(e, list, listIndex); }}},_vm._l((list.items),function(item){return _c('Draggable',{key:item.id},[_c('Card',{attrs:{"item":item},on:{"edit":_vm.editItem,"remove":_vm.removeItem}})],1)})),_vm._v(" "),_c('div',{staticClass:"item-entry"},[_c('ui-item-edit',{attrs:{"list-id":list.id,"placeholder":"Add an item","icon":"ellipsis-h"},on:{"submit":_vm.onAddItem}})],1)],1)])})),_vm._v(" "),_c('div',{staticClass:"new-list"},[_c('ui-item-edit',{attrs:{"placeholder":"Add a list"},on:{"submit":_vm.onAddList}})],1)],1)]),_vm._v(" "),_c('ui-modal',{ref:"modal",attrs:{"active":_vm.modal,"cancellable":1},on:{"close":_vm.hideModal}},[_c('UiItemForm',{ref:"form",on:{"submit":_vm.onAddFullItem,"cancel":_vm.hideModal}})],1)],1)}
var Board_staticRenderFns = []
var Board_esExports = { render: Board_render, staticRenderFns: Board_staticRenderFns }
/* harmony default export */ var elements_Board = (Board_esExports);
// CONCATENATED MODULE: ./src/app/views/elements/Board.vue
function Board_injectStyle (ssrContext) {
  __webpack_require__("mKVl")
}
var Board_normalizeComponent = __webpack_require__("VU/8")
/* script */


/* template */

/* template functional */
var Board___vue_template_functional__ = false
/* styles */
var Board___vue_styles__ = Board_injectStyle
/* scopeId */
var Board___vue_scopeId__ = null
/* moduleIdentifier (server only) */
var Board___vue_module_identifier__ = null
var Board_Component = Board_normalizeComponent(
  Board,
  elements_Board,
  Board___vue_template_functional__,
  Board___vue_styles__,
  Board___vue_scopeId__,
  Board___vue_module_identifier__
)

/* harmony default export */ var views_elements_Board = (Board_Component.exports);

// CONCATENATED MODULE: ./node_modules/babel-loader/lib!./node_modules/vue-loader/lib/selector.js?type=script&index=0!./src/app/App.vue
//
//
//
//
//
//
//
//
//
//
//
//


/* harmony default export */ var App = ({
  components: {
    Board: views_elements_Board
  }
});
// CONCATENATED MODULE: ./node_modules/vue-loader/lib/template-compiler?{"id":"data-v-16315e00","hasScoped":false,"transformToRequire":{"video":["src","poster"],"source":"src","img":"src","image":"xlink:href"},"buble":{"transforms":{}}}!./node_modules/vue-loader/lib/selector.js?type=template&index=0!./src/app/App.vue
var App_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{attrs:{"id":"app"}},[_vm._m(0),_vm._v(" "),_c('div',[_c('board')],1)])}
var App_staticRenderFns = [
    function() {
        var _vm = this;
        var _h = _vm.$createElement;
        var _c = _vm._self._c || _h;
        return _c('div', [_c('h1', {
            staticClass: "is-size-3"
        }, [_vm._v("Tasks")]), _vm._v(" "), _c('p', {
            staticClass: "subtitle is-6"
        }, [_vm._v("Add lists and items by typing in the edit boxes.")])])
}]
var App_esExports = { render: App_render, staticRenderFns: App_staticRenderFns }
/* harmony default export */ var app_App = (App_esExports);
// CONCATENATED MODULE: ./src/app/App.vue
function App_injectStyle (ssrContext) {
  __webpack_require__("uQR9")
}
var App_normalizeComponent = __webpack_require__("VU/8")
/* script */


/* template */

/* template functional */
var App___vue_template_functional__ = false
/* styles */
var App___vue_styles__ = App_injectStyle
/* scopeId */
var App___vue_scopeId__ = null
/* moduleIdentifier (server only) */
var App___vue_module_identifier__ = null
var App_Component = App_normalizeComponent(
  App,
  app_App,
  App___vue_template_functional__,
  App___vue_styles__,
  App___vue_scopeId__,
  App___vue_module_identifier__
)

/* harmony default export */ var src_app_App = (App_Component.exports);

// EXTERNAL MODULE: ./node_modules/vuex/dist/vuex.esm.js
var vuex_esm = __webpack_require__("NYxO");

// EXTERNAL MODULE: ./node_modules/vuex-persistedstate/dist/vuex-persistedstate.es.js + 2 modules
var vuex_persistedstate_es = __webpack_require__("424j");

// CONCATENATED MODULE: ./src/app/utils/data.js
const uuidv1 = __webpack_require__("gApy")
const format = __webpack_require__("Eoz/")

function makeItem (title, description, date, id = null) {
  id = id || uuidv1()
  if (date instanceof Date) {
    date = format(date, 'YYYY-MM-DD')
  }
  return { id, title, description, date }
}

function makeList (title, items = []) {
  const id = uuidv1()
  return { id, title, items }
}

// CONCATENATED MODULE: ./src/app/utils/board.js
/**
 * Get list by index, id or reference
 *
 * @param   {Array}             lists       The array of lists
 * @param   {string|number|*}   listRef     The index, id or reference of the list to find
 * @returns {Object}                        The found list
 */
function getList (lists, listRef) {
  return typeof listRef === 'number'
    ? lists[listRef]
    : typeof listRef === 'string'
      ? lists.find(list => list.id === listRef)
      : listRef
}

/**
 * Get item and optionally list by item id or reference
 *
 * @param   {Array}         lists           The array of lists
 * @param   {string|object} itemRef         The id of or reference to the item to find
 * @param   {boolean}      [returnList]     An optional flg to return both list and item
 * @returns {object|{list, item}}           The found item or an object containing the parent list and found item
 */
function getItem (lists, itemRef, returnList) {
  let list, item
  const id = typeof itemRef === 'object'
    ? itemRef.id
    : itemRef
  for (list of lists) {
    item = list.items.find(item => item.id === id)
    if (item) {
      break
    }
  }
  return returnList
    ? { list, item }
    : item
}

// CONCATENATED MODULE: ./src/app/state/board.js



function board_state () {
  return {
    lists: [],
  }
}

const getters = {
  getList: state => listRef => {
    return getList(state.lists, listRef)
  },

  getItem: state => (itemRef, returnList) => {
    return getItem(state.lists, itemRef, returnList)
  },
}

const actions = {
  setLists ({ state, commit }, lists) {
    commit('reset')
    lists.forEach((list, index) => {
      commit('addList', { title: list.title })
      if (list.items) {
        list.items.forEach(item => {
          commit('addItem', Object.assign({ listId: index }, item))
        })
      }
    })
  }
}

const mutations = {
  reset (state) {
    state.lists = []
  },

  addList (state, { title }) {
    state.lists.push(makeList(title))
  },

  updateList (state, { listId, title }) {
    const list = getList(state.lists, listId)
    if (list) {
      list.title = title
      state.lists.splice(state.lists.indexOf(list), 1, list)
    }
  },

  moveList (state, { fromIndex, toIndex }) {
    state.lists.splice(toIndex, 0, ...state.lists.splice(fromIndex, 1))
  },

  removeList (state, listId) {
    const list = getList(state.lists, listId)
    if (list) {
      const index = state.lists.indexOf(list)
      state.lists.splice(index, 1)
    }
  },

  addItem (state, { listId, title, description, date }) {
    const list = getList(state.lists, listId)
    list.items.push(makeItem(title, description, date))
  },

  updateItem (state, { itemId, title, description, date }) {
    const item = getItem(state.lists, itemId)
    if (item) {
      Object.assign(item, makeItem(title, description, date, itemId))
    }
  },

  moveItem (state, { fromList, toList, fromIndex, toIndex }) {
    fromList = getList(state.lists, fromList)
    toList = getList(state.lists, toList)
    toList.items.splice(toIndex, 0, ...fromList.items.splice(fromIndex, 1))
  },

  removeItem (state, itemId) {
    const { list, item } = getItem(state.lists, itemId, true)
    if (list) {
      list.items.splice(list.items.indexOf(item), 1)
    }
  }
}

/* harmony default export */ var board = ({
  state: board_state,
  getters,
  actions,
  mutations,
});

// CONCATENATED MODULE: ./src/app/state/index.js






vue_esm["a" /* default */].use(vuex_esm["a" /* default */])

/* harmony default export */ var app_state = (new vuex_esm["a" /* default */].Store({
  plugins: [
    Object(vuex_persistedstate_es["a" /* default */])()
  ],
  modules: {
    board: board
  }
}));

// EXTERNAL MODULE: ./src/res/assets/styles/index.scss
var styles = __webpack_require__("q+rq");
var styles_default = /*#__PURE__*/__webpack_require__.n(styles);

// CONCATENATED MODULE: ./node_modules/babel-loader/lib!./node_modules/vue-loader/lib/selector.js?type=script&index=0!./src/core/ui/UiButton.vue
//
//
//
//
//
//
//
//
//
//
//
//
//
//


/* harmony default export */ var UiButton = ({
  props: {
    type: {
      type: String,
      default: 'button'
    }
  }
});
// CONCATENATED MODULE: ./node_modules/vue-loader/lib/template-compiler?{"id":"data-v-adadd87c","hasScoped":false,"transformToRequire":{"video":["src","poster"],"source":"src","img":"src","image":"xlink:href"},"buble":{"transforms":{}}}!./node_modules/vue-loader/lib/selector.js?type=template&index=0!./src/core/ui/UiButton.vue
var UiButton_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"control"},[_c('button',_vm._b({class:("button is-" + _vm.type),attrs:{"type":"button"},on:{"click":function($event){_vm.$emit('click')}}},'button',_vm.$attrs,false),[_vm._t("default")],2)])}
var UiButton_staticRenderFns = []
var UiButton_esExports = { render: UiButton_render, staticRenderFns: UiButton_staticRenderFns }
/* harmony default export */ var ui_UiButton = (UiButton_esExports);
// CONCATENATED MODULE: ./src/core/ui/UiButton.vue
function UiButton_injectStyle (ssrContext) {
  __webpack_require__("/N1f")
}
var UiButton_normalizeComponent = __webpack_require__("VU/8")
/* script */


/* template */

/* template functional */
var UiButton___vue_template_functional__ = false
/* styles */
var UiButton___vue_styles__ = UiButton_injectStyle
/* scopeId */
var UiButton___vue_scopeId__ = null
/* moduleIdentifier (server only) */
var UiButton___vue_module_identifier__ = null
var UiButton_Component = UiButton_normalizeComponent(
  UiButton,
  ui_UiButton,
  UiButton___vue_template_functional__,
  UiButton___vue_styles__,
  UiButton___vue_scopeId__,
  UiButton___vue_module_identifier__
)

/* harmony default export */ var core_ui_UiButton = (UiButton_Component.exports);

// CONCATENATED MODULE: ./node_modules/babel-loader/lib!./node_modules/vue-loader/lib/selector.js?type=script&index=0!./src/core/ui/UiModal.vue
//
//
//
//
//
//
//
//
//
//
//


/* harmony default export */ var UiModal = ({
  props: {
    active: Boolean,
    cancellable: [Number, Boolean]
  },

  mounted: function mounted() {
    window.addEventListener('keydown', this.onKeyDown);
  },
  destroyed: function destroyed() {
    window.removeEventListener('keydown', this.onKeyDown);
  },


  methods: {
    cancel: function cancel() {
      if (this.cancellable) {
        this.close();
      }
    },
    close: function close() {
      this.$emit('close');
    },
    onKeyDown: function onKeyDown(event) {
      if (event.key === 'Escape') {
        this.cancel();
      }
    }
  }
});
// CONCATENATED MODULE: ./node_modules/vue-loader/lib/template-compiler?{"id":"data-v-64b96864","hasScoped":false,"transformToRequire":{"video":["src","poster"],"source":"src","img":"src","image":"xlink:href"},"buble":{"transforms":{}}}!./node_modules/vue-loader/lib/selector.js?type=template&index=0!./src/core/ui/UiModal.vue
var UiModal_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"modal",class:{'is-active': _vm.active}},[_c('div',{staticClass:"modal-background",on:{"mousedown":_vm.cancel}}),_vm._v(" "),_c('div',{staticClass:"modal-content"},[_vm._t("default")],2)])}
var UiModal_staticRenderFns = []
var UiModal_esExports = { render: UiModal_render, staticRenderFns: UiModal_staticRenderFns }
/* harmony default export */ var ui_UiModal = (UiModal_esExports);
// CONCATENATED MODULE: ./src/core/ui/UiModal.vue
function UiModal_injectStyle (ssrContext) {
  __webpack_require__("eQLa")
}
var UiModal_normalizeComponent = __webpack_require__("VU/8")
/* script */


/* template */

/* template functional */
var UiModal___vue_template_functional__ = false
/* styles */
var UiModal___vue_styles__ = UiModal_injectStyle
/* scopeId */
var UiModal___vue_scopeId__ = null
/* moduleIdentifier (server only) */
var UiModal___vue_module_identifier__ = null
var UiModal_Component = UiModal_normalizeComponent(
  UiModal,
  ui_UiModal,
  UiModal___vue_template_functional__,
  UiModal___vue_styles__,
  UiModal___vue_scopeId__,
  UiModal___vue_module_identifier__
)

/* harmony default export */ var core_ui_UiModal = (UiModal_Component.exports);

// CONCATENATED MODULE: ./src/core/mixins/field.js
/* harmony default export */ var field = ({
  props: {
    name: String,
    value: String,
    label: String,
    error: String
  },

  computed: {
    input: {
      get () {
        return this.value
      },

      set (value) {
        this.$emit('input', value)
      }
    }
  }
});

// CONCATENATED MODULE: ./node_modules/babel-loader/lib!./node_modules/vue-loader/lib/selector.js?type=script&index=0!./src/core/ui/UiInput.vue
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//



/**
 * @emits {KeyboardEvent} enter
 */
/* harmony default export */ var UiInput = ({
  extends: field,
  props: {
    type: {
      type: [String, Number],
      default: 'text'
    }
  },

  methods: {
    onEnter: function onEnter($event) {
      this.$emit('enter', $event);
    }
  }
});
// CONCATENATED MODULE: ./node_modules/vue-loader/lib/template-compiler?{"id":"data-v-1758a244","hasScoped":false,"transformToRequire":{"video":["src","poster"],"source":"src","img":"src","image":"xlink:href"},"buble":{"transforms":{}}}!./node_modules/vue-loader/lib/selector.js?type=template&index=0!./src/core/ui/UiInput.vue
var UiInput_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"field"},[(_vm.label)?_c('label',{staticClass:"label"},[_vm._v(_vm._s(_vm.label))]):_vm._e(),_vm._v(" "),_c('div',{staticClass:"control"},[(_vm.type === 'textarea')?_c('textarea',_vm._b({directives:[{name:"model",rawName:"v-model.trim",value:(_vm.input),expression:"input",modifiers:{"trim":true}}],staticClass:"textarea",class:{'is-danger': _vm.error},attrs:{"name":_vm.name},domProps:{"value":(_vm.input)},on:{"input":function($event){if($event.target.composing){ return; }_vm.input=$event.target.value.trim()},"blur":function($event){_vm.$forceUpdate()}}},'textarea',_vm.$attrs,false)):_c('input',_vm._b({directives:[{name:"model",rawName:"v-model.trim",value:(_vm.input),expression:"input",modifiers:{"trim":true}}],staticClass:"input",class:{'is-danger': _vm.error},attrs:{"type":_vm.type,"name":_vm.name},domProps:{"value":(_vm.input)},on:{"keydown":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"enter",13,$event.key,"Enter")){ return null; }return _vm.onEnter($event)},"input":function($event){if($event.target.composing){ return; }_vm.input=$event.target.value.trim()},"blur":function($event){_vm.$forceUpdate()}}},'input',_vm.$attrs,false))]),_vm._v(" "),(_vm.error)?_c('p',{staticClass:"help is-danger"},[_vm._v(_vm._s(_vm.error))]):_vm._e()])}
var UiInput_staticRenderFns = []
var UiInput_esExports = { render: UiInput_render, staticRenderFns: UiInput_staticRenderFns }
/* harmony default export */ var ui_UiInput = (UiInput_esExports);
// CONCATENATED MODULE: ./src/core/ui/UiInput.vue
function UiInput_injectStyle (ssrContext) {
  __webpack_require__("lqWM")
}
var UiInput_normalizeComponent = __webpack_require__("VU/8")
/* script */


/* template */

/* template functional */
var UiInput___vue_template_functional__ = false
/* styles */
var UiInput___vue_styles__ = UiInput_injectStyle
/* scopeId */
var UiInput___vue_scopeId__ = null
/* moduleIdentifier (server only) */
var UiInput___vue_module_identifier__ = null
var UiInput_Component = UiInput_normalizeComponent(
  UiInput,
  ui_UiInput,
  UiInput___vue_template_functional__,
  UiInput___vue_styles__,
  UiInput___vue_scopeId__,
  UiInput___vue_module_identifier__
)

/* harmony default export */ var core_ui_UiInput = (UiInput_Component.exports);

// CONCATENATED MODULE: ./src/core/ui/index.js






const components = {
  UiButton: core_ui_UiButton,
  UiModal: core_ui_UiModal,
  UiInput: core_ui_UiInput
}

Object
  .keys(components)
  .forEach(name => vue_esm["a" /* default */].component(name, components[name]))

// CONCATENATED MODULE: ./src/app/main.js










// config
vue_esm["a" /* default */].config.productionTip = false

// plugins
vue_esm["a" /* default */].use(vee_validate_esm["a" /* default */])

// application
const app = new vue_esm["a" /* default */]({
  store: app_state,
  render: h => h(src_app_App)
}).$mount('#app')

// debugging
if (false) {
  window.app = app
  window.store = store
}


/***/ }),

/***/ "ZA4m":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ "eQLa":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ "j+tB":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ "lqWM":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ "mKVl":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ "q+rq":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ "sbjo":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ "uQR9":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ "zouE":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ })

},["OkBc"]);
//# sourceMappingURL=app.edc485bb7bd32b0f2cb1.js.map