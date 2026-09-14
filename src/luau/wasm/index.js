import { createRequire } from "node:module";
var __defProp = Object.defineProperty;
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __esm = (fn, res, err) => () => {
  if (fn)
    try {
      res = fn(fn = 0);
    } catch (e) {
      err = [e];
    }
  if (err)
    throw err[0];
  return res;
};
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// node_modules/@luau-rs/luau/dist/rolldown-runtime-D7D4PA-g.js
var __defProp2, __exportAll = (all, no_symbols) => {
  let target = {};
  for (var name in all)
    __defProp2(target, name, {
      get: all[name],
      enumerable: true
    });
  if (!no_symbols)
    __defProp2(target, Symbol.toStringTag, { value: "Module" });
  return target;
};
var init_rolldown_runtime_D7D4PA_g = __esm(() => {
  __defProp2 = Object.defineProperty;
});

// node_modules/@luau-rs/luau/dist/luau_wasm-BanGD-Ae.js
var exports_luau_wasm_BanGD_Ae = {};
__export(exports_luau_wasm_BanGD_Ae, {
  WasmLua: () => WasmLua,
  compileWorker: () => compileWorker,
  dumpWorker: () => dumpWorker,
  start: () => start,
  version: () => version,
  workerMemoryBytes: () => workerMemoryBytes
});
function instantiate(source, imports, stream) {
  const instantiate = WebAssembly[stream ? "instantiateStreaming" : "instantiate"];
  return instantiate(source, imports).then(({ instance }) => instance);
}
function loadWasmModule(sync, fileUrl, src, imports) {
  let buf = null;
  if (fileUrl) {
    const { readFile } = process.getBuiltinModule("fs/promises");
    return readFile(fileUrl).then((buffer) => instantiate(buffer, imports));
  }
  buf = Buffer.from(src, "base64");
  if (sync) {
    const mod = new WebAssembly.Module(buf);
    return new WebAssembly.Instance(mod, imports);
  } else
    return instantiate(buf, imports);
}
function compileWorker(source, compiler_options, bytecode_limit, error_limit) {
  const ret = wasm.compileWorker(source, compiler_options, bytecode_limit, error_limit);
  if (ret[2])
    throw takeFromExternrefTable0(ret[1]);
  return takeFromExternrefTable0(ret[0]);
}
function dumpWorker(source, compiler_options, dump_options, output_limit, error_limit) {
  const ret = wasm.dumpWorker(source, compiler_options, dump_options, output_limit, error_limit);
  if (ret[2])
    throw takeFromExternrefTable0(ret[1]);
  return takeFromExternrefTable0(ret[0]);
}
function start() {
  wasm.start();
}
function version() {
  let deferred1_0;
  let deferred1_1;
  try {
    const ret = wasm.version();
    deferred1_0 = ret[0];
    deferred1_1 = ret[1];
    return getStringFromWasm0(ret[0], ret[1]);
  } finally {
    wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
  }
}
function workerMemoryBytes() {
  return wasm.workerMemoryBytes() >>> 0;
}
function __wbg_Error_92b29b0548f8b746(arg0, arg1) {
  return Error(getStringFromWasm0(arg0, arg1));
}
function __wbg___wbindgen_bigint_get_as_i64_d968e41184ae354f(arg0, arg1) {
  const v = arg1;
  const ret = typeof v === "bigint" ? v : undefined;
  getDataViewMemory0().setBigInt64(arg0 + 8, isLikeNone(ret) ? BigInt(0) : ret, true);
  getDataViewMemory0().setInt32(arg0 + 0, !isLikeNone(ret), true);
}
function __wbg___wbindgen_boolean_get_fa956cfa2d1bd751(arg0) {
  const v = arg0;
  const ret = typeof v === "boolean" ? v : undefined;
  return isLikeNone(ret) ? 16777215 : ret ? 1 : 0;
}
function __wbg___wbindgen_debug_string_c25d447a39f5578f(arg0, arg1) {
  const ptr1 = passStringToWasm0(debugString(arg1), wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len1 = WASM_VECTOR_LEN;
  getDataViewMemory0().setInt32(arg0 + 4, len1, true);
  getDataViewMemory0().setInt32(arg0 + 0, ptr1, true);
}
function __wbg___wbindgen_is_bigint_2f76dc55065b4273(arg0) {
  return typeof arg0 === "bigint";
}
function __wbg___wbindgen_is_function_1ff95bcc5517c252(arg0) {
  return typeof arg0 === "function";
}
function __wbg___wbindgen_is_null_ea9085d691f535d3(arg0) {
  return arg0 === null;
}
function __wbg___wbindgen_is_object_a27215656b807791(arg0) {
  const val = arg0;
  return typeof val === "object" && val !== null;
}
function __wbg___wbindgen_is_undefined_c05833b95a3cf397(arg0) {
  return arg0 === undefined;
}
function __wbg___wbindgen_jsval_eq_e659fcf7b0e32763(arg0, arg1) {
  return arg0 === arg1;
}
function __wbg___wbindgen_number_get_394265ed1e1b84ee(arg0, arg1) {
  const obj = arg1;
  const ret = typeof obj === "number" ? obj : undefined;
  getDataViewMemory0().setFloat64(arg0 + 8, isLikeNone(ret) ? 0 : ret, true);
  getDataViewMemory0().setInt32(arg0 + 0, !isLikeNone(ret), true);
}
function __wbg___wbindgen_rethrow_4915403b40f010b4(arg0) {
  throw arg0;
}
function __wbg___wbindgen_string_get_b0ca35b86a603356(arg0, arg1) {
  const obj = arg1;
  const ret = typeof obj === "string" ? obj : undefined;
  var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  var len1 = WASM_VECTOR_LEN;
  getDataViewMemory0().setInt32(arg0 + 4, len1, true);
  getDataViewMemory0().setInt32(arg0 + 0, ptr1, true);
}
function __wbg___wbindgen_throw_344f42d3211c4765(arg0, arg1) {
  throw new Error(getStringFromWasm0(arg0, arg1));
}
function __wbg__wbg_cb_unref_fffb441def202758(arg0) {
  arg0._wbg_cb_unref();
}
function __wbg_apply_3ac86a26fdb56c05() {
  return handleError(function(arg0, arg1, arg2) {
    return arg0.apply(arg1, arg2);
  }, arguments);
}
function __wbg_call_44b7209e1e252e6a() {
  return handleError(function(arg0, arg1, arg2, arg3, arg4) {
    return arg0.call(arg1, arg2, arg3, arg4);
  }, arguments);
}
function __wbg_call_8a2dd23819f8a60a() {
  return handleError(function(arg0, arg1) {
    return arg0.call(arg1);
  }, arguments);
}
function __wbg_call_a6e5c5dce5018821() {
  return handleError(function(arg0, arg1, arg2) {
    return arg0.call(arg1, arg2);
  }, arguments);
}
function __wbg_call_e3b662382210db98() {
  return handleError(function(arg0, arg1, arg2, arg3) {
    return arg0.call(arg1, arg2, arg3);
  }, arguments);
}
function __wbg_error_a6fa202b58aa1cd3(arg0, arg1) {
  let deferred0_0;
  let deferred0_1;
  try {
    deferred0_0 = arg0;
    deferred0_1 = arg1;
    console.error(getStringFromWasm0(arg0, arg1));
  } finally {
    wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
  }
}
function __wbg_from_13e323c65fc8f464(arg0) {
  return Array.from(arg0);
}
function __wbg_get_507a50627bffa49b(arg0, arg1) {
  return arg0[arg1 >>> 0];
}
function __wbg_get_78f252d074a84d0b() {
  return handleError(function(arg0, arg1) {
    return Reflect.get(arg0, arg1);
  }, arguments);
}
function __wbg_get_unchecked_6e0ad6d2a41b06f6(arg0, arg1) {
  return arg0[arg1 >>> 0];
}
function __wbg_instanceof_Promise_4cb210c0b8f8c959(arg0) {
  let result;
  try {
    result = arg0 instanceof Promise;
  } catch (_) {
    result = false;
  }
  return result;
}
function __wbg_instanceof_Uint8Array_309b927aaf7a3fc7(arg0) {
  let result;
  try {
    result = arg0 instanceof Uint8Array;
  } catch (_) {
    result = false;
  }
  return result;
}
function __wbg_isArray_0677c962b281d01a(arg0) {
  return Array.isArray(arg0);
}
function __wbg_is_7b9d0b289033c7de(arg0, arg1) {
  return Object.is(arg0, arg1);
}
function __wbg_keys_58421f8f96795607(arg0) {
  return Object.keys(arg0);
}
function __wbg_length_1f0964f4a5e2c6d8(arg0) {
  return arg0.length;
}
function __wbg_length_370319915dc99107(arg0) {
  return arg0.length;
}
function __wbg_new_227d7c05414eb861() {
  return /* @__PURE__ */ new Error;
}
function __wbg_new_32b398fb48b6d94a() {
  return new Array;
}
function __wbg_new_7796ffc7ed656783() {
  return /* @__PURE__ */ new Map;
}
function __wbg_new_b667d279fd5aa943(arg0, arg1) {
  return new Error(getStringFromWasm0(arg0, arg1));
}
function __wbg_new_da52cf8fe3429cb2() {
  return /* @__PURE__ */ new Object;
}
function __wbg_new_from_slice_77cdfb7977362f3c(arg0, arg1) {
  return new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
}
function __wbg_new_typed_1824d93f294193e5(arg0, arg1) {
  try {
    var state0 = {
      a: arg0,
      b: arg1
    };
    var cb0 = (arg0, arg1) => {
      const a = state0.a;
      state0.a = 0;
      try {
        return wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke___js_sys_c18c377cc6435b80___Function_fn_wasm_bindgen_d50cc9a54e05ed87___JsValue_____wasm_bindgen_d50cc9a54e05ed87___sys__Undefined___js_sys_c18c377cc6435b80___Function_fn_wasm_bindgen_d50cc9a54e05ed87___JsValue_____wasm_bindgen_d50cc9a54e05ed87___sys__Undefined_______true_$1(a, state0.b, arg0, arg1);
      } finally {
        state0.a = a;
      }
    };
    return new Promise(cb0);
  } finally {
    state0.a = 0;
  }
}
function __wbg_new_with_length_e6785c33c8e4cce8(arg0) {
  return new Uint8Array(arg0 >>> 0);
}
function __wbg_new_with_length_f8cbc3a5b9ff9368(arg0) {
  return new Array(arg0 >>> 0);
}
function __wbg_now_86c0d4ba3fa605b8() {
  return Date.now();
}
function __wbg_prototypesetcall_4770620bbe4688a0(arg0, arg1, arg2) {
  Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
}
function __wbg_push_d2ae3af0c1217ae6(arg0, arg1) {
  return arg0.push(arg1);
}
function __wbg_queueMicrotask_0ab5b2d2393e99b9(arg0) {
  return arg0.queueMicrotask;
}
function __wbg_queueMicrotask_6a09b7bc46549209(arg0) {
  queueMicrotask(arg0);
}
function __wbg_resolve_2191a4dfe481c25b(arg0) {
  return Promise.resolve(arg0);
}
function __wbg_set_575dd786d51585f8(arg0, arg1, arg2) {
  return arg0.set(arg1, arg2);
}
function __wbg_set_8535240470bf2500() {
  return handleError(function(arg0, arg1, arg2) {
    return Reflect.set(arg0, arg1, arg2);
  }, arguments);
}
function __wbg_set_8a16b38e4805b298(arg0, arg1, arg2) {
  arg0[arg1 >>> 0] = arg2;
}
function __wbg_stack_3b0d974bbf31e44f(arg0, arg1) {
  const ret = arg1.stack;
  const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len1 = WASM_VECTOR_LEN;
  getDataViewMemory0().setInt32(arg0 + 4, len1, true);
  getDataViewMemory0().setInt32(arg0 + 0, ptr1, true);
}
function __wbg_static_accessor_GLOBAL_4ef717fb391d88b7() {
  const ret = typeof global === "undefined" ? null : global;
  return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
function __wbg_static_accessor_GLOBAL_THIS_8d1badc68b5a74f4() {
  const ret = typeof globalThis === "undefined" ? null : globalThis;
  return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
function __wbg_static_accessor_SELF_146583524fe1469b() {
  const ret = typeof self === "undefined" ? null : self;
  return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
function __wbg_static_accessor_WINDOW_f2829a2234d7819e() {
  const ret = typeof window === "undefined" ? null : window;
  return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
function __wbg_then_16d107c451e9905d(arg0, arg1, arg2) {
  return arg0.then(arg1, arg2);
}
function __wbg_then_6ec10ae38b3e92f7(arg0, arg1) {
  return arg0.then(arg1);
}
function __wbindgen_cast_0000000000000001(arg0, arg1) {
  return makeMutClosure(arg0, arg1, wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke___wasm_bindgen_d50cc9a54e05ed87___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_d50cc9a54e05ed87___JsError___true_$1);
}
function __wbindgen_cast_0000000000000002(arg0, arg1) {
  return makeMutClosure(arg0, arg1, wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke_______true_$1);
}
function __wbindgen_cast_0000000000000003(arg0) {
  return arg0;
}
function __wbindgen_cast_0000000000000004(arg0) {
  return arg0;
}
function __wbindgen_cast_0000000000000005(arg0, arg1) {
  return getStringFromWasm0(arg0, arg1);
}
function __wbindgen_init_externref_table() {
  const table = wasm.__wbindgen_externrefs;
  const offset = table.grow(4);
  table.set(0, undefined);
  table.set(offset + 0, undefined);
  table.set(offset + 1, null);
  table.set(offset + 2, true);
  table.set(offset + 3, false);
}
function wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke_______true_$1(arg0, arg1) {
  wasm.wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke_______true_(arg0, arg1);
}
function wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke___wasm_bindgen_d50cc9a54e05ed87___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_d50cc9a54e05ed87___JsError___true_$1(arg0, arg1, arg2) {
  const ret = wasm.wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke___wasm_bindgen_d50cc9a54e05ed87___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_d50cc9a54e05ed87___JsError___true_(arg0, arg1, arg2);
  if (ret[1])
    throw takeFromExternrefTable0(ret[0]);
}
function wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke___js_sys_c18c377cc6435b80___Function_fn_wasm_bindgen_d50cc9a54e05ed87___JsValue_____wasm_bindgen_d50cc9a54e05ed87___sys__Undefined___js_sys_c18c377cc6435b80___Function_fn_wasm_bindgen_d50cc9a54e05ed87___JsValue_____wasm_bindgen_d50cc9a54e05ed87___sys__Undefined_______true_$1(arg0, arg1, arg2, arg3) {
  wasm.wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke___js_sys_c18c377cc6435b80___Function_fn_wasm_bindgen_d50cc9a54e05ed87___JsValue_____wasm_bindgen_d50cc9a54e05ed87___sys__Undefined___js_sys_c18c377cc6435b80___Function_fn_wasm_bindgen_d50cc9a54e05ed87___JsValue_____wasm_bindgen_d50cc9a54e05ed87___sys__Undefined_______true_(arg0, arg1, arg2, arg3);
}
function addToExternrefTable0(obj) {
  const idx = wasm.__externref_table_alloc();
  wasm.__wbindgen_externrefs.set(idx, obj);
  return idx;
}
function debugString(val) {
  const type = typeof val;
  if (type == "number" || type == "boolean" || val == null)
    return `${val}`;
  if (type == "string")
    return `"${val}"`;
  if (type == "symbol") {
    const description = val.description;
    if (description == null)
      return "Symbol";
    else
      return `Symbol(${description})`;
  }
  if (type == "function") {
    const name = val.name;
    if (typeof name == "string" && name.length > 0)
      return `Function(${name})`;
    else
      return "Function";
  }
  if (Array.isArray(val)) {
    const length = val.length;
    let debug = "[";
    if (length > 0)
      debug += debugString(val[0]);
    for (let i = 1;i < length; i++)
      debug += ", " + debugString(val[i]);
    debug += "]";
    return debug;
  }
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
  let className;
  if (builtInMatches && builtInMatches.length > 1)
    className = builtInMatches[1];
  else
    return toString.call(val);
  if (className == "Object")
    try {
      return "Object(" + JSON.stringify(val) + ")";
    } catch (_) {
      return "Object";
    }
  if (val instanceof Error)
    return `${val.name}: ${val.message}
${val.stack}`;
  return className;
}
function getArrayU8FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}
function getDataViewMemory0() {
  if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)
    cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
  return cachedDataViewMemory0;
}
function getStringFromWasm0(ptr, len) {
  return decodeText(ptr >>> 0, len);
}
function getUint8ArrayMemory0() {
  if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0)
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  return cachedUint8ArrayMemory0;
}
function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    const idx = addToExternrefTable0(e);
    wasm.__wbindgen_exn_store(idx);
  }
}
function isLikeNone(x) {
  return x === undefined || x === null;
}
function makeMutClosure(arg0, arg1, f) {
  const state = {
    a: arg0,
    b: arg1,
    cnt: 1
  };
  const real = (...args) => {
    state.cnt++;
    const a = state.a;
    state.a = 0;
    try {
      return f(a, state.b, ...args);
    } finally {
      state.a = a;
      real._wbg_cb_unref();
    }
  };
  real._wbg_cb_unref = () => {
    if (--state.cnt === 0) {
      wasm.__wbindgen_destroy_closure(state.a, state.b);
      state.a = 0;
      CLOSURE_DTORS.unregister(state);
    }
  };
  CLOSURE_DTORS.register(real, state, state);
  return real;
}
function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr = malloc(buf.length, 1) >>> 0;
    getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr;
  }
  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;
  const mem = getUint8ArrayMemory0();
  let offset = 0;
  for (;offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 127)
      break;
    mem[ptr + offset] = code;
  }
  if (offset !== len) {
    if (offset !== 0)
      arg = arg.slice(offset);
    ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
    const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
    const ret = cachedTextEncoder.encodeInto(arg, view);
    offset += ret.written;
    ptr = realloc(ptr, len, offset, 1) >>> 0;
  }
  WASM_VECTOR_LEN = offset;
  return ptr;
}
function takeFromExternrefTable0(idx) {
  const value = wasm.__wbindgen_externrefs.get(idx);
  wasm.__externref_table_dealloc(idx);
  return value;
}
function decodeText(ptr, len) {
  numBytesDecoded += len;
  if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
    cachedTextDecoder = new TextDecoder("utf-8", {
      ignoreBOM: true,
      fatal: true
    });
    cachedTextDecoder.decode();
    numBytesDecoded = len;
  }
  return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}
function __wbg_set_wasm(val) {
  wasm = val;
}
function __wasm_init(imports) {
  return loadWasmModule(false, new URL("luau_wasm_bg.wasm", import.meta.url), null, imports);
}
var WasmLua = class {
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    WasmLuaFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_wasmlua_free(ptr, 0);
  }
  bufferBytes(handle) {
    const ret = wasm.wasmlua_bufferBytes(this.__wbg_ptr, handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  bufferWrite(handle, offset, bytes) {
    const ret = wasm.wasmlua_bufferWrite(this.__wbg_ptr, handle, offset, bytes);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  call(handle, _arguments) {
    const ret = wasm.wasmlua_call(this.__wbg_ptr, handle, _arguments);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  callAsync(handle, _arguments, abort) {
    return wasm.wasmlua_callAsync(this.__wbg_ptr, handle, _arguments, abort);
  }
  callFunction(handle, name, _arguments) {
    const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.wasmlua_callFunction(this.__wbg_ptr, handle, ptr0, len0, _arguments);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  callFunctionAsync(handle, name, _arguments, abort) {
    const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    return wasm.wasmlua_callFunctionAsync(this.__wbg_ptr, handle, ptr0, len0, _arguments, abort);
  }
  callMethod(handle, name, _arguments) {
    const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.wasmlua_callMethod(this.__wbg_ptr, handle, ptr0, len0, _arguments);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  callMethodAsync(handle, name, _arguments, abort) {
    const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    return wasm.wasmlua_callMethodAsync(this.__wbg_ptr, handle, ptr0, len0, _arguments, abort);
  }
  coerceInteger(value) {
    const ret = wasm.wasmlua_coerceInteger(this.__wbg_ptr, value);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  coerceNumber(value) {
    const ret = wasm.wasmlua_coerceNumber(this.__wbg_ptr, value);
    if (ret[3])
      throw takeFromExternrefTable0(ret[2]);
    return ret[0] === 0 ? undefined : ret[1];
  }
  coerceString(value) {
    const ret = wasm.wasmlua_coerceString(this.__wbg_ptr, value);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  compile(source, options) {
    const ptr0 = passStringToWasm0(source, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.wasmlua_compile(this.__wbg_ptr, ptr0, len0, options);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  configureModules(modules, resolver, sandboxed, max_modules, max_module_name_bytes, max_module_source_bytes, max_total_module_source_bytes) {
    const ret = wasm.wasmlua_configureModules(this.__wbg_ptr, modules, isLikeNone(resolver) ? 0 : addToExternrefTable0(resolver), sandboxed, max_modules, max_module_name_bytes, max_module_source_bytes, max_total_module_source_bytes);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  configureOutput(callback) {
    const ret = wasm.wasmlua_configureOutput(this.__wbg_ptr, callback);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  configureWorker(modules, resolver, output, output_byte_limit, output_event_limit, max_modules, max_module_name_bytes, max_module_source_bytes, max_total_module_source_bytes) {
    const ret = wasm.wasmlua_configureWorker(this.__wbg_ptr, modules, isLikeNone(resolver) ? 0 : addToExternrefTable0(resolver), output, output_byte_limit, output_event_limit, max_modules, max_module_name_bytes, max_module_source_bytes, max_total_module_source_bytes);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  createAsyncFunction(callback) {
    const ret = wasm.wasmlua_createAsyncFunction(this.__wbg_ptr, callback);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  createBuffer(bytes) {
    const ret = wasm.wasmlua_createBuffer(this.__wbg_ptr, bytes);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  createBufferWithCapacity(size) {
    const ret = wasm.wasmlua_createBufferWithCapacity(this.__wbg_ptr, size);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  createTable(initial) {
    const ret = wasm.wasmlua_createTable(this.__wbg_ptr, initial);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  createTableWithCapacity(array_capacity, record_capacity) {
    const ret = wasm.wasmlua_createTableWithCapacity(this.__wbg_ptr, array_capacity, record_capacity);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  createThread(function_handle) {
    const ret = wasm.wasmlua_createThread(this.__wbg_ptr, function_handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  createUserdata(token, definition, identity) {
    const ret = wasm.wasmlua_createUserdata(this.__wbg_ptr, token, definition, identity);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  currentThread() {
    const ret = wasm.wasmlua_currentThread(this.__wbg_ptr);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  dispose() {
    const ret = wasm.wasmlua_dispose(this.__wbg_ptr);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  dump(source, compiler_options, dump_options) {
    const ptr0 = passStringToWasm0(source, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.wasmlua_dump(this.__wbg_ptr, ptr0, len0, compiler_options, dump_options);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  execute(source, options, _arguments) {
    const ptr0 = passStringToWasm0(source, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.wasmlua_execute(this.__wbg_ptr, ptr0, len0, options, _arguments);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  executeAsync(source, options, _arguments, abort) {
    const ptr0 = passStringToWasm0(source, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    return wasm.wasmlua_executeAsync(this.__wbg_ptr, ptr0, len0, options, _arguments, abort);
  }
  executeBytecode(bytecode, options, _arguments) {
    const ret = wasm.wasmlua_executeBytecode(this.__wbg_ptr, bytecode, options, _arguments);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  executeBytecodeAsync(bytecode, options, _arguments, abort) {
    return wasm.wasmlua_executeBytecodeAsync(this.__wbg_ptr, bytecode, options, _arguments, abort);
  }
  executeBytecodeWorker(bytecode, options, error_limit, result_byte_limit, result_entry_limit) {
    return wasm.wasmlua_executeBytecodeWorker(this.__wbg_ptr, bytecode, options, error_limit, result_byte_limit, result_entry_limit);
  }
  executeWorker(source, options, error_limit, result_byte_limit, result_entry_limit) {
    return wasm.wasmlua_executeWorker(this.__wbg_ptr, source, options, error_limit, result_byte_limit, result_entry_limit);
  }
  functionBind(handle, _arguments) {
    const ret = wasm.wasmlua_functionBind(this.__wbg_ptr, handle, _arguments);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  functionCoverage(handle) {
    const ret = wasm.wasmlua_functionCoverage(this.__wbg_ptr, handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  functionDeepClone(handle) {
    const ret = wasm.wasmlua_functionDeepClone(this.__wbg_ptr, handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  functionEnvironment(handle) {
    const ret = wasm.wasmlua_functionEnvironment(this.__wbg_ptr, handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  functionIdentity(handle) {
    const ret = wasm.wasmlua_functionIdentity(this.__wbg_ptr, handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return ret[0] >>> 0;
  }
  functionInfo(handle) {
    const ret = wasm.wasmlua_functionInfo(this.__wbg_ptr, handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  functionSetEnvironment(handle, environment) {
    const ret = wasm.wasmlua_functionSetEnvironment(this.__wbg_ptr, handle, environment);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return ret[0] !== 0;
  }
  gcCollect() {
    const ret = wasm.wasmlua_gcCollect(this.__wbg_ptr);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  gcIsRunning() {
    const ret = wasm.wasmlua_gcIsRunning(this.__wbg_ptr);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return ret[0] !== 0;
  }
  gcRestart() {
    const ret = wasm.wasmlua_gcRestart(this.__wbg_ptr);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  gcStep() {
    const ret = wasm.wasmlua_gcStep(this.__wbg_ptr);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return ret[0] !== 0;
  }
  gcStop() {
    const ret = wasm.wasmlua_gcStop(this.__wbg_ptr);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  get(handle, key) {
    const ret = wasm.wasmlua_get(this.__wbg_ptr, handle, key);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  globals() {
    const ret = wasm.wasmlua_globals(this.__wbg_ptr);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  inspectStack(level) {
    const ret = wasm.wasmlua_inspectStack(this.__wbg_ptr, level);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  invokeFunction(handle, _arguments, abort) {
    return wasm.wasmlua_invokeFunction(this.__wbg_ptr, handle, _arguments, abort);
  }
  isYieldable() {
    const ret = wasm.wasmlua_isYieldable(this.__wbg_ptr);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return ret[0] !== 0;
  }
  load(source, options) {
    const ptr0 = passStringToWasm0(source, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.wasmlua_load(this.__wbg_ptr, ptr0, len0, options);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  loadBytecode(bytecode, options) {
    const ret = wasm.wasmlua_loadBytecode(this.__wbg_ptr, bytecode, options);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  loadLibraries(libraries) {
    const ret = wasm.wasmlua_loadLibraries(this.__wbg_ptr, libraries);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  mainThread() {
    const ret = wasm.wasmlua_mainThread(this.__wbg_ptr);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  namecallMethod() {
    const ret = wasm.wasmlua_namecallMethod(this.__wbg_ptr);
    if (ret[3])
      throw takeFromExternrefTable0(ret[2]);
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  namedRegistryValue(key) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.wasmlua_namedRegistryValue(this.__wbg_ptr, ptr0, len0);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  constructor(options) {
    const ret = wasm.wasmlua_new(options);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    this.__wbg_ptr = ret[0];
    WasmLuaFinalization.register(this, this.__wbg_ptr, this);
    return this;
  }
  objectClass(handle) {
    const ret = wasm.wasmlua_objectClass(this.__wbg_ptr, handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  peakMemory() {
    const ret = wasm.wasmlua_peakMemory(this.__wbg_ptr);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return ret[0] >>> 0;
  }
  rawGet(handle, key) {
    const ret = wasm.wasmlua_rawGet(this.__wbg_ptr, handle, key);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  rawSet(handle, key, value) {
    const ret = wasm.wasmlua_rawSet(this.__wbg_ptr, handle, key, value);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  release(handle) {
    const ret = wasm.wasmlua_release(this.__wbg_ptr, handle);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  removeDebugHooks() {
    const ret = wasm.wasmlua_removeDebugHooks(this.__wbg_ptr);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  removeInterruptHooks() {
    const ret = wasm.wasmlua_removeInterruptHooks(this.__wbg_ptr);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  requestInterrupt() {
    const ret = wasm.wasmlua_requestInterrupt(this.__wbg_ptr);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  sandbox(enabled) {
    const ret = wasm.wasmlua_sandbox(this.__wbg_ptr, enabled);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  set(handle, key, value) {
    const ret = wasm.wasmlua_set(this.__wbg_ptr, handle, key, value);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  setCompiler(options) {
    const ret = wasm.wasmlua_setCompiler(this.__wbg_ptr, options);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  setDebugHooks(hooks) {
    const ret = wasm.wasmlua_setDebugHooks(this.__wbg_ptr, hooks);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  setInterruptHooks(hooks) {
    const ret = wasm.wasmlua_setInterruptHooks(this.__wbg_ptr, hooks);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  setMemoryLimit(limit) {
    const ret = wasm.wasmlua_setMemoryLimit(this.__wbg_ptr, limit);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return ret[0] >>> 0;
  }
  setNamedRegistryValue(key, value) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.wasmlua_setNamedRegistryValue(this.__wbg_ptr, ptr0, len0, value);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  setTypeMetatable(type_name, metatable) {
    const ptr0 = passStringToWasm0(type_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.wasmlua_setTypeMetatable(this.__wbg_ptr, ptr0, len0, metatable);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  get stateId() {
    return wasm.wasmlua_stateId(this.__wbg_ptr) >>> 0;
  }
  tableClear(handle) {
    const ret = wasm.wasmlua_tableClear(this.__wbg_ptr, handle);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  tableContainsKey(handle, key) {
    const ret = wasm.wasmlua_tableContainsKey(this.__wbg_ptr, handle, key);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return ret[0] !== 0;
  }
  tableEntries(handle) {
    const ret = wasm.wasmlua_tableEntries(this.__wbg_ptr, handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  tableIsReadonly(handle) {
    const ret = wasm.wasmlua_tableIsReadonly(this.__wbg_ptr, handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return ret[0] !== 0;
  }
  tableLength(handle, raw) {
    const ret = wasm.wasmlua_tableLength(this.__wbg_ptr, handle, raw);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return ret[0];
  }
  tableMetatable(handle) {
    const ret = wasm.wasmlua_tableMetatable(this.__wbg_ptr, handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  tablePop(handle) {
    const ret = wasm.wasmlua_tablePop(this.__wbg_ptr, handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  tablePush(handle, value) {
    const ret = wasm.wasmlua_tablePush(this.__wbg_ptr, handle, value);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  tableRawInsert(handle, index, value) {
    const ret = wasm.wasmlua_tableRawInsert(this.__wbg_ptr, handle, index, value);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  tableRawPop(handle) {
    const ret = wasm.wasmlua_tableRawPop(this.__wbg_ptr, handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  tableRawPush(handle, value) {
    const ret = wasm.wasmlua_tableRawPush(this.__wbg_ptr, handle, value);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  tableRawRemove(handle, key) {
    const ret = wasm.wasmlua_tableRawRemove(this.__wbg_ptr, handle, key);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  tableRawSetIndex(handle, index, value) {
    const ret = wasm.wasmlua_tableRawSetIndex(this.__wbg_ptr, handle, index, value);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  tableRemove(handle, key) {
    const ret = wasm.wasmlua_tableRemove(this.__wbg_ptr, handle, key);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  tableSetMetatable(handle, metatable) {
    const ret = wasm.wasmlua_tableSetMetatable(this.__wbg_ptr, handle, metatable);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  tableSetReadonly(handle, enabled) {
    const ret = wasm.wasmlua_tableSetReadonly(this.__wbg_ptr, handle, enabled);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  tableSetSafeEnvironment(handle, enabled) {
    const ret = wasm.wasmlua_tableSetSafeEnvironment(this.__wbg_ptr, handle, enabled);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  threadInspectStack(handle, level) {
    const ret = wasm.wasmlua_threadInspectStack(this.__wbg_ptr, handle, level);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  threadIsYieldable(handle) {
    const ret = wasm.wasmlua_threadIsYieldable(this.__wbg_ptr, handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return ret[0] !== 0;
  }
  threadNamecallMethod(handle) {
    const ret = wasm.wasmlua_threadNamecallMethod(this.__wbg_ptr, handle);
    if (ret[3])
      throw takeFromExternrefTable0(ret[2]);
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  threadReset(handle, function_handle) {
    const ret = wasm.wasmlua_threadReset(this.__wbg_ptr, handle, function_handle);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  threadResume(handle, _arguments) {
    const ret = wasm.wasmlua_threadResume(this.__wbg_ptr, handle, _arguments);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  threadResumeAsync(handle, _arguments, abort) {
    return wasm.wasmlua_threadResumeAsync(this.__wbg_ptr, handle, _arguments, abort);
  }
  threadResumeError(handle, error) {
    const ret = wasm.wasmlua_threadResumeError(this.__wbg_ptr, handle, error);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  threadResumeErrorAsync(handle, error, abort) {
    return wasm.wasmlua_threadResumeErrorAsync(this.__wbg_ptr, handle, error, abort);
  }
  threadSetSingleStep(handle, enabled) {
    const ret = wasm.wasmlua_threadSetSingleStep(this.__wbg_ptr, handle, enabled);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  threadStatus(handle) {
    let deferred2_0;
    let deferred2_1;
    try {
      const ret = wasm.wasmlua_threadStatus(this.__wbg_ptr, handle);
      var ptr1 = ret[0];
      var len1 = ret[1];
      if (ret[3]) {
        ptr1 = 0;
        len1 = 0;
        throw takeFromExternrefTable0(ret[2]);
      }
      deferred2_0 = ptr1;
      deferred2_1 = len1;
      return getStringFromWasm0(ptr1, len1);
    } finally {
      wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
  }
  threadTraceback(handle, message, level) {
    var ptr0 = isLikeNone(message) ? 0 : passStringToWasm0(message, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.wasmlua_threadTraceback(this.__wbg_ptr, handle, ptr0, len0, level);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  traceback(message, level) {
    var ptr0 = isLikeNone(message) ? 0 : passStringToWasm0(message, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.wasmlua_traceback(this.__wbg_ptr, ptr0, len0, level);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  typeMetatable(type_name) {
    const ptr0 = passStringToWasm0(type_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.wasmlua_typeMetatable(this.__wbg_ptr, ptr0, len0);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  unsetNamedRegistryValue(key) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.wasmlua_unsetNamedRegistryValue(this.__wbg_ptr, ptr0, len0);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  usedMemory() {
    const ret = wasm.wasmlua_usedMemory(this.__wbg_ptr);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return ret[0] >>> 0;
  }
  userdataDestroy(handle) {
    const ret = wasm.wasmlua_userdataDestroy(this.__wbg_ptr, handle);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  userdataMetatable(handle) {
    const ret = wasm.wasmlua_userdataMetatable(this.__wbg_ptr, handle);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  userdataMetatableEntries(handle) {
    const ret = wasm.wasmlua_userdataMetatableEntries(this.__wbg_ptr, handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  userdataMetatableGet(handle, key) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.wasmlua_userdataMetatableGet(this.__wbg_ptr, handle, ptr0, len0);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  userdataMetatableHas(handle, key) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.wasmlua_userdataMetatableHas(this.__wbg_ptr, handle, ptr0, len0);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return ret[0] !== 0;
  }
  userdataMetatableSet(handle, key, value) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.wasmlua_userdataMetatableSet(this.__wbg_ptr, handle, ptr0, len0, value);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  userdataSetUserValue(handle, value) {
    const ret = wasm.wasmlua_userdataSetUserValue(this.__wbg_ptr, handle, value);
    if (ret[1])
      throw takeFromExternrefTable0(ret[0]);
  }
  userdataTake(handle) {
    const ret = wasm.wasmlua_userdataTake(this.__wbg_ptr, handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  userdataTypeName(handle) {
    let deferred2_0;
    let deferred2_1;
    try {
      const ret = wasm.wasmlua_userdataTypeName(this.__wbg_ptr, handle);
      var ptr1 = ret[0];
      var len1 = ret[1];
      if (ret[3]) {
        ptr1 = 0;
        len1 = 0;
        throw takeFromExternrefTable0(ret[2]);
      }
      deferred2_0 = ptr1;
      deferred2_1 = len1;
      return getStringFromWasm0(ptr1, len1);
    } finally {
      wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
  }
  userdataUserValue(handle) {
    const ret = wasm.wasmlua_userdataUserValue(this.__wbg_ptr, handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  userdataValue(handle) {
    const ret = wasm.wasmlua_userdataValue(this.__wbg_ptr, handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return takeFromExternrefTable0(ret[0]);
  }
  valueEquals(left, right) {
    const ret = wasm.wasmlua_valueEquals(this.__wbg_ptr, left, right);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return ret[0] !== 0;
  }
  valueIdentity(handle) {
    const ret = wasm.wasmlua_valueIdentity(this.__wbg_ptr, handle);
    if (ret[2])
      throw takeFromExternrefTable0(ret[1]);
    return ret[0] >>> 0;
  }
  valueToString(handle) {
    let deferred2_0;
    let deferred2_1;
    try {
      const ret = wasm.wasmlua_valueToString(this.__wbg_ptr, handle);
      var ptr1 = ret[0];
      var len1 = ret[1];
      if (ret[3]) {
        ptr1 = 0;
        len1 = 0;
        throw takeFromExternrefTable0(ret[2]);
      }
      deferred2_0 = ptr1;
      deferred2_1 = len1;
      return getStringFromWasm0(ptr1, len1);
    } finally {
      wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
  }
}, WasmLuaFinalization, CLOSURE_DTORS, cachedDataViewMemory0 = null, cachedUint8ArrayMemory0 = null, cachedTextDecoder, MAX_SAFARI_DECODE_BYTES = 2146435072, numBytesDecoded = 0, cachedTextEncoder, WASM_VECTOR_LEN = 0, wasm, luau_wasm_bg_exports, instance, memory, __wbg_wasmlua_free, compileWorker$1, dumpWorker$1, wasmlua_bufferBytes, wasmlua_bufferWrite, wasmlua_call, wasmlua_callAsync, wasmlua_callFunction, wasmlua_callFunctionAsync, wasmlua_callMethod, wasmlua_callMethodAsync, wasmlua_coerceInteger, wasmlua_coerceNumber, wasmlua_coerceString, wasmlua_compile, wasmlua_configureModules, wasmlua_configureOutput, wasmlua_configureWorker, wasmlua_createAsyncFunction, wasmlua_createBuffer, wasmlua_createBufferWithCapacity, wasmlua_createTable, wasmlua_createTableWithCapacity, wasmlua_createThread, wasmlua_createUserdata, wasmlua_currentThread, wasmlua_dispose, wasmlua_dump, wasmlua_execute, wasmlua_executeAsync, wasmlua_executeBytecode, wasmlua_executeBytecodeAsync, wasmlua_executeBytecodeWorker, wasmlua_executeWorker, wasmlua_functionBind, wasmlua_functionCoverage, wasmlua_functionDeepClone, wasmlua_functionEnvironment, wasmlua_functionIdentity, wasmlua_functionInfo, wasmlua_functionSetEnvironment, wasmlua_gcCollect, wasmlua_gcIsRunning, wasmlua_gcRestart, wasmlua_gcStep, wasmlua_gcStop, wasmlua_get, wasmlua_globals, wasmlua_inspectStack, wasmlua_invokeFunction, wasmlua_isYieldable, wasmlua_load, wasmlua_loadBytecode, wasmlua_loadLibraries, wasmlua_mainThread, wasmlua_namecallMethod, wasmlua_namedRegistryValue, wasmlua_new, wasmlua_objectClass, wasmlua_peakMemory, wasmlua_rawGet, wasmlua_rawSet, wasmlua_release, wasmlua_removeDebugHooks, wasmlua_removeInterruptHooks, wasmlua_requestInterrupt, wasmlua_sandbox, wasmlua_set, wasmlua_setCompiler, wasmlua_setDebugHooks, wasmlua_setInterruptHooks, wasmlua_setMemoryLimit, wasmlua_setNamedRegistryValue, wasmlua_setTypeMetatable, wasmlua_stateId, wasmlua_tableClear, wasmlua_tableContainsKey, wasmlua_tableEntries, wasmlua_tableIsReadonly, wasmlua_tableLength, wasmlua_tableMetatable, wasmlua_tablePop, wasmlua_tablePush, wasmlua_tableRawInsert, wasmlua_tableRawPop, wasmlua_tableRawPush, wasmlua_tableRawRemove, wasmlua_tableRawSetIndex, wasmlua_tableRemove, wasmlua_tableSetMetatable, wasmlua_tableSetReadonly, wasmlua_tableSetSafeEnvironment, wasmlua_threadInspectStack, wasmlua_threadIsYieldable, wasmlua_threadNamecallMethod, wasmlua_threadReset, wasmlua_threadResume, wasmlua_threadResumeAsync, wasmlua_threadResumeError, wasmlua_threadResumeErrorAsync, wasmlua_threadSetSingleStep, wasmlua_threadStatus, wasmlua_threadTraceback, wasmlua_traceback, wasmlua_typeMetatable, wasmlua_unsetNamedRegistryValue, wasmlua_usedMemory, wasmlua_userdataDestroy, wasmlua_userdataMetatable, wasmlua_userdataMetatableEntries, wasmlua_userdataMetatableGet, wasmlua_userdataMetatableHas, wasmlua_userdataMetatableSet, wasmlua_userdataSetUserValue, wasmlua_userdataTake, wasmlua_userdataTypeName, wasmlua_userdataUserValue, wasmlua_userdataValue, wasmlua_valueEquals, wasmlua_valueIdentity, wasmlua_valueToString, workerMemoryBytes$1, version$1, start$1, __abort_handler, __instance_terminated, wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke___wasm_bindgen_d50cc9a54e05ed87___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_d50cc9a54e05ed87___JsError___true_, wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke___js_sys_c18c377cc6435b80___Function_fn_wasm_bindgen_d50cc9a54e05ed87___JsValue_____wasm_bindgen_d50cc9a54e05ed87___sys__Undefined___js_sys_c18c377cc6435b80___Function_fn_wasm_bindgen_d50cc9a54e05ed87___JsValue_____wasm_bindgen_d50cc9a54e05ed87___sys__Undefined_______true_, wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke_______true_, __wbindgen_malloc, __wbindgen_realloc, __wbindgen_exn_store, __externref_table_alloc, __wbindgen_externrefs, __wbindgen_free, __wbindgen_destroy_closure, __externref_table_dealloc, __wbindgen_start;
var init_luau_wasm_BanGD_Ae = __esm(async () => {
  init_rolldown_runtime_D7D4PA_g();
  if (Symbol.dispose)
    WasmLua.prototype[Symbol.dispose] = WasmLua.prototype.free;
  WasmLuaFinalization = typeof FinalizationRegistry === "undefined" ? {
    register: () => {},
    unregister: () => {}
  } : new FinalizationRegistry((ptr) => wasm.__wbg_wasmlua_free(ptr, 1));
  CLOSURE_DTORS = typeof FinalizationRegistry === "undefined" ? {
    register: () => {},
    unregister: () => {}
  } : new FinalizationRegistry((state) => wasm.__wbindgen_destroy_closure(state.a, state.b));
  cachedTextDecoder = new TextDecoder("utf-8", {
    ignoreBOM: true,
    fatal: true
  });
  cachedTextDecoder.decode();
  cachedTextEncoder = new TextEncoder;
  if (!("encodeInto" in cachedTextEncoder))
    cachedTextEncoder.encodeInto = function(arg, view) {
      const buf = cachedTextEncoder.encode(arg);
      view.set(buf);
      return {
        read: arg.length,
        written: buf.length
      };
    };
  luau_wasm_bg_exports = /* @__PURE__ */ __exportAll({
    __abort_handler: () => __abort_handler,
    __externref_table_alloc: () => __externref_table_alloc,
    __externref_table_dealloc: () => __externref_table_dealloc,
    __instance_terminated: () => __instance_terminated,
    __wbg_wasmlua_free: () => __wbg_wasmlua_free,
    __wbindgen_destroy_closure: () => __wbindgen_destroy_closure,
    __wbindgen_exn_store: () => __wbindgen_exn_store,
    __wbindgen_externrefs: () => __wbindgen_externrefs,
    __wbindgen_free: () => __wbindgen_free,
    __wbindgen_malloc: () => __wbindgen_malloc,
    __wbindgen_realloc: () => __wbindgen_realloc,
    __wbindgen_start: () => __wbindgen_start,
    compileWorker: () => compileWorker$1,
    dumpWorker: () => dumpWorker$1,
    memory: () => memory,
    start: () => start$1,
    version: () => version$1,
    wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke_______true_: () => wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke_______true_,
    wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke___js_sys_c18c377cc6435b80___Function_fn_wasm_bindgen_d50cc9a54e05ed87___JsValue_____wasm_bindgen_d50cc9a54e05ed87___sys__Undefined___js_sys_c18c377cc6435b80___Function_fn_wasm_bindgen_d50cc9a54e05ed87___JsValue_____wasm_bindgen_d50cc9a54e05ed87___sys__Undefined_______true_: () => wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke___js_sys_c18c377cc6435b80___Function_fn_wasm_bindgen_d50cc9a54e05ed87___JsValue_____wasm_bindgen_d50cc9a54e05ed87___sys__Undefined___js_sys_c18c377cc6435b80___Function_fn_wasm_bindgen_d50cc9a54e05ed87___JsValue_____wasm_bindgen_d50cc9a54e05ed87___sys__Undefined_______true_,
    wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke___wasm_bindgen_d50cc9a54e05ed87___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_d50cc9a54e05ed87___JsError___true_: () => wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke___wasm_bindgen_d50cc9a54e05ed87___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_d50cc9a54e05ed87___JsError___true_,
    wasmlua_bufferBytes: () => wasmlua_bufferBytes,
    wasmlua_bufferWrite: () => wasmlua_bufferWrite,
    wasmlua_call: () => wasmlua_call,
    wasmlua_callAsync: () => wasmlua_callAsync,
    wasmlua_callFunction: () => wasmlua_callFunction,
    wasmlua_callFunctionAsync: () => wasmlua_callFunctionAsync,
    wasmlua_callMethod: () => wasmlua_callMethod,
    wasmlua_callMethodAsync: () => wasmlua_callMethodAsync,
    wasmlua_coerceInteger: () => wasmlua_coerceInteger,
    wasmlua_coerceNumber: () => wasmlua_coerceNumber,
    wasmlua_coerceString: () => wasmlua_coerceString,
    wasmlua_compile: () => wasmlua_compile,
    wasmlua_configureModules: () => wasmlua_configureModules,
    wasmlua_configureOutput: () => wasmlua_configureOutput,
    wasmlua_configureWorker: () => wasmlua_configureWorker,
    wasmlua_createAsyncFunction: () => wasmlua_createAsyncFunction,
    wasmlua_createBuffer: () => wasmlua_createBuffer,
    wasmlua_createBufferWithCapacity: () => wasmlua_createBufferWithCapacity,
    wasmlua_createTable: () => wasmlua_createTable,
    wasmlua_createTableWithCapacity: () => wasmlua_createTableWithCapacity,
    wasmlua_createThread: () => wasmlua_createThread,
    wasmlua_createUserdata: () => wasmlua_createUserdata,
    wasmlua_currentThread: () => wasmlua_currentThread,
    wasmlua_dispose: () => wasmlua_dispose,
    wasmlua_dump: () => wasmlua_dump,
    wasmlua_execute: () => wasmlua_execute,
    wasmlua_executeAsync: () => wasmlua_executeAsync,
    wasmlua_executeBytecode: () => wasmlua_executeBytecode,
    wasmlua_executeBytecodeAsync: () => wasmlua_executeBytecodeAsync,
    wasmlua_executeBytecodeWorker: () => wasmlua_executeBytecodeWorker,
    wasmlua_executeWorker: () => wasmlua_executeWorker,
    wasmlua_functionBind: () => wasmlua_functionBind,
    wasmlua_functionCoverage: () => wasmlua_functionCoverage,
    wasmlua_functionDeepClone: () => wasmlua_functionDeepClone,
    wasmlua_functionEnvironment: () => wasmlua_functionEnvironment,
    wasmlua_functionIdentity: () => wasmlua_functionIdentity,
    wasmlua_functionInfo: () => wasmlua_functionInfo,
    wasmlua_functionSetEnvironment: () => wasmlua_functionSetEnvironment,
    wasmlua_gcCollect: () => wasmlua_gcCollect,
    wasmlua_gcIsRunning: () => wasmlua_gcIsRunning,
    wasmlua_gcRestart: () => wasmlua_gcRestart,
    wasmlua_gcStep: () => wasmlua_gcStep,
    wasmlua_gcStop: () => wasmlua_gcStop,
    wasmlua_get: () => wasmlua_get,
    wasmlua_globals: () => wasmlua_globals,
    wasmlua_inspectStack: () => wasmlua_inspectStack,
    wasmlua_invokeFunction: () => wasmlua_invokeFunction,
    wasmlua_isYieldable: () => wasmlua_isYieldable,
    wasmlua_load: () => wasmlua_load,
    wasmlua_loadBytecode: () => wasmlua_loadBytecode,
    wasmlua_loadLibraries: () => wasmlua_loadLibraries,
    wasmlua_mainThread: () => wasmlua_mainThread,
    wasmlua_namecallMethod: () => wasmlua_namecallMethod,
    wasmlua_namedRegistryValue: () => wasmlua_namedRegistryValue,
    wasmlua_new: () => wasmlua_new,
    wasmlua_objectClass: () => wasmlua_objectClass,
    wasmlua_peakMemory: () => wasmlua_peakMemory,
    wasmlua_rawGet: () => wasmlua_rawGet,
    wasmlua_rawSet: () => wasmlua_rawSet,
    wasmlua_release: () => wasmlua_release,
    wasmlua_removeDebugHooks: () => wasmlua_removeDebugHooks,
    wasmlua_removeInterruptHooks: () => wasmlua_removeInterruptHooks,
    wasmlua_requestInterrupt: () => wasmlua_requestInterrupt,
    wasmlua_sandbox: () => wasmlua_sandbox,
    wasmlua_set: () => wasmlua_set,
    wasmlua_setCompiler: () => wasmlua_setCompiler,
    wasmlua_setDebugHooks: () => wasmlua_setDebugHooks,
    wasmlua_setInterruptHooks: () => wasmlua_setInterruptHooks,
    wasmlua_setMemoryLimit: () => wasmlua_setMemoryLimit,
    wasmlua_setNamedRegistryValue: () => wasmlua_setNamedRegistryValue,
    wasmlua_setTypeMetatable: () => wasmlua_setTypeMetatable,
    wasmlua_stateId: () => wasmlua_stateId,
    wasmlua_tableClear: () => wasmlua_tableClear,
    wasmlua_tableContainsKey: () => wasmlua_tableContainsKey,
    wasmlua_tableEntries: () => wasmlua_tableEntries,
    wasmlua_tableIsReadonly: () => wasmlua_tableIsReadonly,
    wasmlua_tableLength: () => wasmlua_tableLength,
    wasmlua_tableMetatable: () => wasmlua_tableMetatable,
    wasmlua_tablePop: () => wasmlua_tablePop,
    wasmlua_tablePush: () => wasmlua_tablePush,
    wasmlua_tableRawInsert: () => wasmlua_tableRawInsert,
    wasmlua_tableRawPop: () => wasmlua_tableRawPop,
    wasmlua_tableRawPush: () => wasmlua_tableRawPush,
    wasmlua_tableRawRemove: () => wasmlua_tableRawRemove,
    wasmlua_tableRawSetIndex: () => wasmlua_tableRawSetIndex,
    wasmlua_tableRemove: () => wasmlua_tableRemove,
    wasmlua_tableSetMetatable: () => wasmlua_tableSetMetatable,
    wasmlua_tableSetReadonly: () => wasmlua_tableSetReadonly,
    wasmlua_tableSetSafeEnvironment: () => wasmlua_tableSetSafeEnvironment,
    wasmlua_threadInspectStack: () => wasmlua_threadInspectStack,
    wasmlua_threadIsYieldable: () => wasmlua_threadIsYieldable,
    wasmlua_threadNamecallMethod: () => wasmlua_threadNamecallMethod,
    wasmlua_threadReset: () => wasmlua_threadReset,
    wasmlua_threadResume: () => wasmlua_threadResume,
    wasmlua_threadResumeAsync: () => wasmlua_threadResumeAsync,
    wasmlua_threadResumeError: () => wasmlua_threadResumeError,
    wasmlua_threadResumeErrorAsync: () => wasmlua_threadResumeErrorAsync,
    wasmlua_threadSetSingleStep: () => wasmlua_threadSetSingleStep,
    wasmlua_threadStatus: () => wasmlua_threadStatus,
    wasmlua_threadTraceback: () => wasmlua_threadTraceback,
    wasmlua_traceback: () => wasmlua_traceback,
    wasmlua_typeMetatable: () => wasmlua_typeMetatable,
    wasmlua_unsetNamedRegistryValue: () => wasmlua_unsetNamedRegistryValue,
    wasmlua_usedMemory: () => wasmlua_usedMemory,
    wasmlua_userdataDestroy: () => wasmlua_userdataDestroy,
    wasmlua_userdataMetatable: () => wasmlua_userdataMetatable,
    wasmlua_userdataMetatableEntries: () => wasmlua_userdataMetatableEntries,
    wasmlua_userdataMetatableGet: () => wasmlua_userdataMetatableGet,
    wasmlua_userdataMetatableHas: () => wasmlua_userdataMetatableHas,
    wasmlua_userdataMetatableSet: () => wasmlua_userdataMetatableSet,
    wasmlua_userdataSetUserValue: () => wasmlua_userdataSetUserValue,
    wasmlua_userdataTake: () => wasmlua_userdataTake,
    wasmlua_userdataTypeName: () => wasmlua_userdataTypeName,
    wasmlua_userdataUserValue: () => wasmlua_userdataUserValue,
    wasmlua_userdataValue: () => wasmlua_userdataValue,
    wasmlua_valueEquals: () => wasmlua_valueEquals,
    wasmlua_valueIdentity: () => wasmlua_valueIdentity,
    wasmlua_valueToString: () => wasmlua_valueToString,
    workerMemoryBytes: () => workerMemoryBytes$1
  });
  instance = await __wasm_init({ "./luau_wasm_bg.js": {
    __wbg_call_e3b662382210db98,
    __wbg_keys_58421f8f96795607,
    __wbg_length_370319915dc99107,
    __wbg_get_507a50627bffa49b,
    __wbg_new_typed_1824d93f294193e5,
    __wbg_instanceof_Promise_4cb210c0b8f8c959,
    __wbg_get_unchecked_6e0ad6d2a41b06f6,
    __wbg_push_d2ae3af0c1217ae6,
    __wbg_call_a6e5c5dce5018821,
    __wbg_set_575dd786d51585f8,
    __wbg_set_8a16b38e4805b298,
    __wbg_apply_3ac86a26fdb56c05,
    __wbg_then_16d107c451e9905d,
    __wbg_call_8a2dd23819f8a60a,
    __wbg_call_44b7209e1e252e6a,
    __wbg_new_227d7c05414eb861,
    __wbg_stack_3b0d974bbf31e44f,
    __wbg_error_a6fa202b58aa1cd3,
    __wbg_resolve_2191a4dfe481c25b,
    __wbg_then_6ec10ae38b3e92f7,
    __wbg_new_da52cf8fe3429cb2,
    __wbg_new_32b398fb48b6d94a,
    __wbg_new_with_length_f8cbc3a5b9ff9368,
    __wbg_from_13e323c65fc8f464,
    __wbg_isArray_0677c962b281d01a,
    __wbg_new_b667d279fd5aa943,
    __wbg_new_7796ffc7ed656783,
    __wbg_now_86c0d4ba3fa605b8,
    __wbg_is_7b9d0b289033c7de,
    __wbg_length_1f0964f4a5e2c6d8,
    __wbg_prototypesetcall_4770620bbe4688a0,
    __wbg_new_with_length_e6785c33c8e4cce8,
    __wbg_new_from_slice_77cdfb7977362f3c,
    __wbg_static_accessor_GLOBAL_THIS_8d1badc68b5a74f4,
    __wbg_static_accessor_SELF_146583524fe1469b,
    __wbg_static_accessor_GLOBAL_4ef717fb391d88b7,
    __wbg_static_accessor_WINDOW_f2829a2234d7819e,
    __wbg_instanceof_Uint8Array_309b927aaf7a3fc7,
    __wbg_queueMicrotask_0ab5b2d2393e99b9,
    __wbg_queueMicrotask_6a09b7bc46549209,
    __wbg_get_78f252d074a84d0b,
    __wbg_set_8535240470bf2500,
    __wbg___wbindgen_number_get_394265ed1e1b84ee,
    __wbg___wbindgen_throw_344f42d3211c4765,
    __wbg___wbindgen_is_null_ea9085d691f535d3,
    __wbg___wbindgen_rethrow_4915403b40f010b4,
    __wbg___wbindgen_jsval_eq_e659fcf7b0e32763,
    __wbg_Error_92b29b0548f8b746,
    __wbg___wbindgen_is_bigint_2f76dc55065b4273,
    __wbg___wbindgen_is_object_a27215656b807791,
    __wbg___wbindgen_string_get_b0ca35b86a603356,
    __wbg___wbindgen_boolean_get_fa956cfa2d1bd751,
    __wbg___wbindgen_is_function_1ff95bcc5517c252,
    __wbg___wbindgen_is_undefined_c05833b95a3cf397,
    __wbg___wbindgen_bigint_get_as_i64_d968e41184ae354f,
    __wbg__wbg_cb_unref_fffb441def202758,
    __wbg___wbindgen_debug_string_c25d447a39f5578f,
    __wbindgen_init_externref_table,
    __wbindgen_cast_0000000000000001,
    __wbindgen_cast_0000000000000002,
    __wbindgen_cast_0000000000000003,
    __wbindgen_cast_0000000000000004,
    __wbindgen_cast_0000000000000005
  } });
  memory = instance.exports.memory;
  __wbg_wasmlua_free = instance.exports.__wbg_wasmlua_free;
  compileWorker$1 = instance.exports.compileWorker;
  dumpWorker$1 = instance.exports.dumpWorker;
  wasmlua_bufferBytes = instance.exports.wasmlua_bufferBytes;
  wasmlua_bufferWrite = instance.exports.wasmlua_bufferWrite;
  wasmlua_call = instance.exports.wasmlua_call;
  wasmlua_callAsync = instance.exports.wasmlua_callAsync;
  wasmlua_callFunction = instance.exports.wasmlua_callFunction;
  wasmlua_callFunctionAsync = instance.exports.wasmlua_callFunctionAsync;
  wasmlua_callMethod = instance.exports.wasmlua_callMethod;
  wasmlua_callMethodAsync = instance.exports.wasmlua_callMethodAsync;
  wasmlua_coerceInteger = instance.exports.wasmlua_coerceInteger;
  wasmlua_coerceNumber = instance.exports.wasmlua_coerceNumber;
  wasmlua_coerceString = instance.exports.wasmlua_coerceString;
  wasmlua_compile = instance.exports.wasmlua_compile;
  wasmlua_configureModules = instance.exports.wasmlua_configureModules;
  wasmlua_configureOutput = instance.exports.wasmlua_configureOutput;
  wasmlua_configureWorker = instance.exports.wasmlua_configureWorker;
  wasmlua_createAsyncFunction = instance.exports.wasmlua_createAsyncFunction;
  wasmlua_createBuffer = instance.exports.wasmlua_createBuffer;
  wasmlua_createBufferWithCapacity = instance.exports.wasmlua_createBufferWithCapacity;
  wasmlua_createTable = instance.exports.wasmlua_createTable;
  wasmlua_createTableWithCapacity = instance.exports.wasmlua_createTableWithCapacity;
  wasmlua_createThread = instance.exports.wasmlua_createThread;
  wasmlua_createUserdata = instance.exports.wasmlua_createUserdata;
  wasmlua_currentThread = instance.exports.wasmlua_currentThread;
  wasmlua_dispose = instance.exports.wasmlua_dispose;
  wasmlua_dump = instance.exports.wasmlua_dump;
  wasmlua_execute = instance.exports.wasmlua_execute;
  wasmlua_executeAsync = instance.exports.wasmlua_executeAsync;
  wasmlua_executeBytecode = instance.exports.wasmlua_executeBytecode;
  wasmlua_executeBytecodeAsync = instance.exports.wasmlua_executeBytecodeAsync;
  wasmlua_executeBytecodeWorker = instance.exports.wasmlua_executeBytecodeWorker;
  wasmlua_executeWorker = instance.exports.wasmlua_executeWorker;
  wasmlua_functionBind = instance.exports.wasmlua_functionBind;
  wasmlua_functionCoverage = instance.exports.wasmlua_functionCoverage;
  wasmlua_functionDeepClone = instance.exports.wasmlua_functionDeepClone;
  wasmlua_functionEnvironment = instance.exports.wasmlua_functionEnvironment;
  wasmlua_functionIdentity = instance.exports.wasmlua_functionIdentity;
  wasmlua_functionInfo = instance.exports.wasmlua_functionInfo;
  wasmlua_functionSetEnvironment = instance.exports.wasmlua_functionSetEnvironment;
  wasmlua_gcCollect = instance.exports.wasmlua_gcCollect;
  wasmlua_gcIsRunning = instance.exports.wasmlua_gcIsRunning;
  wasmlua_gcRestart = instance.exports.wasmlua_gcRestart;
  wasmlua_gcStep = instance.exports.wasmlua_gcStep;
  wasmlua_gcStop = instance.exports.wasmlua_gcStop;
  wasmlua_get = instance.exports.wasmlua_get;
  wasmlua_globals = instance.exports.wasmlua_globals;
  wasmlua_inspectStack = instance.exports.wasmlua_inspectStack;
  wasmlua_invokeFunction = instance.exports.wasmlua_invokeFunction;
  wasmlua_isYieldable = instance.exports.wasmlua_isYieldable;
  wasmlua_load = instance.exports.wasmlua_load;
  wasmlua_loadBytecode = instance.exports.wasmlua_loadBytecode;
  wasmlua_loadLibraries = instance.exports.wasmlua_loadLibraries;
  wasmlua_mainThread = instance.exports.wasmlua_mainThread;
  wasmlua_namecallMethod = instance.exports.wasmlua_namecallMethod;
  wasmlua_namedRegistryValue = instance.exports.wasmlua_namedRegistryValue;
  wasmlua_new = instance.exports.wasmlua_new;
  wasmlua_objectClass = instance.exports.wasmlua_objectClass;
  wasmlua_peakMemory = instance.exports.wasmlua_peakMemory;
  wasmlua_rawGet = instance.exports.wasmlua_rawGet;
  wasmlua_rawSet = instance.exports.wasmlua_rawSet;
  wasmlua_release = instance.exports.wasmlua_release;
  wasmlua_removeDebugHooks = instance.exports.wasmlua_removeDebugHooks;
  wasmlua_removeInterruptHooks = instance.exports.wasmlua_removeInterruptHooks;
  wasmlua_requestInterrupt = instance.exports.wasmlua_requestInterrupt;
  wasmlua_sandbox = instance.exports.wasmlua_sandbox;
  wasmlua_set = instance.exports.wasmlua_set;
  wasmlua_setCompiler = instance.exports.wasmlua_setCompiler;
  wasmlua_setDebugHooks = instance.exports.wasmlua_setDebugHooks;
  wasmlua_setInterruptHooks = instance.exports.wasmlua_setInterruptHooks;
  wasmlua_setMemoryLimit = instance.exports.wasmlua_setMemoryLimit;
  wasmlua_setNamedRegistryValue = instance.exports.wasmlua_setNamedRegistryValue;
  wasmlua_setTypeMetatable = instance.exports.wasmlua_setTypeMetatable;
  wasmlua_stateId = instance.exports.wasmlua_stateId;
  wasmlua_tableClear = instance.exports.wasmlua_tableClear;
  wasmlua_tableContainsKey = instance.exports.wasmlua_tableContainsKey;
  wasmlua_tableEntries = instance.exports.wasmlua_tableEntries;
  wasmlua_tableIsReadonly = instance.exports.wasmlua_tableIsReadonly;
  wasmlua_tableLength = instance.exports.wasmlua_tableLength;
  wasmlua_tableMetatable = instance.exports.wasmlua_tableMetatable;
  wasmlua_tablePop = instance.exports.wasmlua_tablePop;
  wasmlua_tablePush = instance.exports.wasmlua_tablePush;
  wasmlua_tableRawInsert = instance.exports.wasmlua_tableRawInsert;
  wasmlua_tableRawPop = instance.exports.wasmlua_tableRawPop;
  wasmlua_tableRawPush = instance.exports.wasmlua_tableRawPush;
  wasmlua_tableRawRemove = instance.exports.wasmlua_tableRawRemove;
  wasmlua_tableRawSetIndex = instance.exports.wasmlua_tableRawSetIndex;
  wasmlua_tableRemove = instance.exports.wasmlua_tableRemove;
  wasmlua_tableSetMetatable = instance.exports.wasmlua_tableSetMetatable;
  wasmlua_tableSetReadonly = instance.exports.wasmlua_tableSetReadonly;
  wasmlua_tableSetSafeEnvironment = instance.exports.wasmlua_tableSetSafeEnvironment;
  wasmlua_threadInspectStack = instance.exports.wasmlua_threadInspectStack;
  wasmlua_threadIsYieldable = instance.exports.wasmlua_threadIsYieldable;
  wasmlua_threadNamecallMethod = instance.exports.wasmlua_threadNamecallMethod;
  wasmlua_threadReset = instance.exports.wasmlua_threadReset;
  wasmlua_threadResume = instance.exports.wasmlua_threadResume;
  wasmlua_threadResumeAsync = instance.exports.wasmlua_threadResumeAsync;
  wasmlua_threadResumeError = instance.exports.wasmlua_threadResumeError;
  wasmlua_threadResumeErrorAsync = instance.exports.wasmlua_threadResumeErrorAsync;
  wasmlua_threadSetSingleStep = instance.exports.wasmlua_threadSetSingleStep;
  wasmlua_threadStatus = instance.exports.wasmlua_threadStatus;
  wasmlua_threadTraceback = instance.exports.wasmlua_threadTraceback;
  wasmlua_traceback = instance.exports.wasmlua_traceback;
  wasmlua_typeMetatable = instance.exports.wasmlua_typeMetatable;
  wasmlua_unsetNamedRegistryValue = instance.exports.wasmlua_unsetNamedRegistryValue;
  wasmlua_usedMemory = instance.exports.wasmlua_usedMemory;
  wasmlua_userdataDestroy = instance.exports.wasmlua_userdataDestroy;
  wasmlua_userdataMetatable = instance.exports.wasmlua_userdataMetatable;
  wasmlua_userdataMetatableEntries = instance.exports.wasmlua_userdataMetatableEntries;
  wasmlua_userdataMetatableGet = instance.exports.wasmlua_userdataMetatableGet;
  wasmlua_userdataMetatableHas = instance.exports.wasmlua_userdataMetatableHas;
  wasmlua_userdataMetatableSet = instance.exports.wasmlua_userdataMetatableSet;
  wasmlua_userdataSetUserValue = instance.exports.wasmlua_userdataSetUserValue;
  wasmlua_userdataTake = instance.exports.wasmlua_userdataTake;
  wasmlua_userdataTypeName = instance.exports.wasmlua_userdataTypeName;
  wasmlua_userdataUserValue = instance.exports.wasmlua_userdataUserValue;
  wasmlua_userdataValue = instance.exports.wasmlua_userdataValue;
  wasmlua_valueEquals = instance.exports.wasmlua_valueEquals;
  wasmlua_valueIdentity = instance.exports.wasmlua_valueIdentity;
  wasmlua_valueToString = instance.exports.wasmlua_valueToString;
  workerMemoryBytes$1 = instance.exports.workerMemoryBytes;
  version$1 = instance.exports.version;
  start$1 = instance.exports.start;
  __abort_handler = instance.exports.__abort_handler;
  __instance_terminated = instance.exports.__instance_terminated;
  wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke___wasm_bindgen_d50cc9a54e05ed87___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_d50cc9a54e05ed87___JsError___true_ = instance.exports.wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke___wasm_bindgen_d50cc9a54e05ed87___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_d50cc9a54e05ed87___JsError___true_;
  wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke___js_sys_c18c377cc6435b80___Function_fn_wasm_bindgen_d50cc9a54e05ed87___JsValue_____wasm_bindgen_d50cc9a54e05ed87___sys__Undefined___js_sys_c18c377cc6435b80___Function_fn_wasm_bindgen_d50cc9a54e05ed87___JsValue_____wasm_bindgen_d50cc9a54e05ed87___sys__Undefined_______true_ = instance.exports.wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke___js_sys_c18c377cc6435b80___Function_fn_wasm_bindgen_d50cc9a54e05ed87___JsValue_____wasm_bindgen_d50cc9a54e05ed87___sys__Undefined___js_sys_c18c377cc6435b80___Function_fn_wasm_bindgen_d50cc9a54e05ed87___JsValue_____wasm_bindgen_d50cc9a54e05ed87___sys__Undefined_______true_;
  wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke_______true_ = instance.exports.wasm_bindgen_d50cc9a54e05ed87___convert__closures_____invoke_______true_;
  __wbindgen_malloc = instance.exports.__wbindgen_malloc;
  __wbindgen_realloc = instance.exports.__wbindgen_realloc;
  __wbindgen_exn_store = instance.exports.__wbindgen_exn_store;
  __externref_table_alloc = instance.exports.__externref_table_alloc;
  __wbindgen_externrefs = instance.exports.__wbindgen_externrefs;
  __wbindgen_free = instance.exports.__wbindgen_free;
  __wbindgen_destroy_closure = instance.exports.__wbindgen_destroy_closure;
  __externref_table_dealloc = instance.exports.__externref_table_dealloc;
  __wbindgen_start = instance.exports.__wbindgen_start;
  __wbg_set_wasm(luau_wasm_bg_exports);
  __wbindgen_start();
});

// node_modules/@luau-rs/luau/dist/node.js
var exports_node = {};
__export(exports_node, {
  DEFAULT_EXECUTION_OPTIONS: () => DEFAULT_EXECUTION_OPTIONS,
  Lua: () => Lua,
  LuaBuffer: () => LuaBuffer,
  LuaClass: () => LuaClass,
  LuaFunction: () => LuaFunction,
  LuaObject: () => LuaObject,
  LuaObjectLike: () => LuaObjectLike,
  LuaOutputEvent: () => LuaOutputEvent,
  LuaTable: () => LuaTable,
  LuaThread: () => LuaThread,
  LuaUserdata: () => LuaUserdata,
  LuaUserdataMetatable: () => LuaUserdataMetatable,
  LuaValue: () => LuaValue,
  LuaVector: () => LuaVector,
  LuaWorker: () => LuaWorker,
  exposeJsGlobals: () => exposeJsGlobals,
  field: () => field,
  fromLua: () => from_lua_exports,
  get: () => get,
  intoLua: () => into_lua_exports,
  metamethod: () => metamethod,
  method: () => method,
  set: () => set,
  userdata: () => userdata
});
import { Worker as Worker$1 } from "node:worker_threads";
function isJsInterop(value) {
  if (!Array.isArray(value))
    return false;
  for (const name of value)
    if (typeof name !== "string")
      return false;
  return true;
}
function assertWellFormedString(value) {
  for (let index = 0;index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 55296 && code <= 56319) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 56320 && next <= 57343))
        throw new TypeError("JavaScript string contains an unpaired surrogate");
      index += 1;
    } else if (code >= 56320 && code <= 57343)
      throw new TypeError("JavaScript string contains an unpaired surrogate");
  }
}
function utf8Length(value) {
  assertWellFormedString(value);
  let bytes = 0;
  for (let index = 0;index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 128)
      bytes += 1;
    else if (code < 2048)
      bytes += 2;
    else if (code >= 55296 && code <= 56319) {
      bytes += 4;
      index += 1;
    } else
      bytes += 3;
  }
  return bytes;
}
function fromLuaNode(value) {
  if (typeof value !== "object" || value === null)
    return;
  return value[FROM_LUA];
}
function fromLuaRestNode(value) {
  if (typeof value !== "object" || value === null)
    return;
  return value[FROM_LUA_REST];
}
function intoLuaNode(value) {
  if (typeof value !== "object" || value === null)
    return;
  return value[INTO_LUA];
}
function intoLuaMultipleValues(value) {
  if (typeof value !== "object" || value === null)
    return;
  return value[INTO_LUA_MULTIPLE];
}
function fromLuaSignatures(value, label) {
  if (!Array.isArray(value))
    throw new TypeError(`${label} must be an array`);
  if (value.length > 0 && Array.isArray(value[0]))
    return value.map((signature, index) => {
      if (!Array.isArray(signature))
        throw new TypeError(`${label} cannot mix arguments and overloads`);
      return fromLuaSignature(signature, `${label}[${index}]`);
    });
  if (value.some(Array.isArray))
    throw new TypeError(`${label} cannot mix arguments and overloads`);
  return fromLuaSignature(value, label);
}
function signatureList(signatures) {
  return isOverloaded(signatures) ? signatures : [signatures];
}
function signatureAcceptsCount(signature, count) {
  const hasRest = fromLuaRestNode(signature.at(-1)) !== undefined;
  const fixed = hasRest ? signature.length - 1 : signature.length;
  let required = fixed;
  while (required > 0 && acceptsNil$1(signature[required - 1]))
    required--;
  return count >= required && (hasRest || count <= fixed);
}
function isFromLuaType(value) {
  return fromLuaNode(value) !== undefined || isConstructor$2(value);
}
function acceptsNil$1(value) {
  return fromLuaNode(value)?.kind === "option";
}
function fromLuaSignature(value, label) {
  let optional = false;
  let rest = false;
  return value.map((item, index) => {
    const restNode = fromLuaRestNode(item);
    if (restNode) {
      if (index !== value.length - 1)
        throw new TypeError(`${label}[${index}] rest argument must be last`);
      if (optional)
        throw new TypeError(`${label}[${index}] cannot follow an optional argument`);
      if (!isFromLuaType(restNode.value))
        throw new TypeError(`${label}[${index}] has an invalid rest decoder`);
      rest = true;
      return item;
    }
    if (rest || !isFromLuaType(item))
      throw new TypeError(`${label}[${index}] must be a FromLua decoder`);
    if (acceptsNil$1(item))
      optional = true;
    else if (optional)
      throw new TypeError(`${label}[${index}] cannot follow an optional argument`);
    return item;
  });
}
function isOverloaded(signatures) {
  return signatures.length > 0 && Array.isArray(signatures[0]);
}
function isConstructor$2(value) {
  if (value === BigInt)
    return true;
  if (typeof value !== "function")
    return false;
  try {
    Reflect.construct(Object, [], value);
    return true;
  } catch {
    return false;
  }
}
function userdata(args) {
  const constructorArguments = fromLuaSignatures(args ?? [], "userdata constructor arguments");
  return (_value, context) => {
    context.addInitializer(function() {
      definitionFor(this).constructorArguments = constructorArguments;
    });
  };
}
function field(valueOrType, context) {
  if (context === undefined) {
    const type = fromLuaType(valueOrType, "field type");
    return (value, memberContext) => {
      exposeGetter(value, memberContext);
      exposeSetter(value, memberContext, type);
    };
  }
  exposeGetter(valueOrType, context);
  exposeSetter(valueOrType, context);
}
function get(value, context) {
  exposeGetter(value, context);
}
function set(valueOrType, context) {
  if (context === undefined) {
    const type = fromLuaType(valueOrType, "setter type");
    return (value, memberContext) => {
      exposeSetter(value, memberContext, type);
    };
  }
  exposeSetter(valueOrType, context);
}
function method(valueOrOptions, context) {
  if (context === undefined) {
    const args = fromLuaSignatures(valueOrOptions, "method arguments");
    return (value, memberContext) => {
      exposeMethod(value, memberContext, memberName(memberContext), false, args);
    };
  }
  exposeMethod(valueOrOptions, context, memberName(context), false);
}
function metamethod(name) {
  if (!USERDATA_METAMETHODS.has(name))
    throw new TypeError(`unknown Lua userdata metamethod ${name}`);
  return function(value, context) {
    memberName(context);
    exposeMethod(value, context, name, true);
  };
}
function decoratedUserdataDefinition(constructor) {
  const chain = [];
  let current = constructor;
  while (typeof current === "function" && current !== Function.prototype) {
    const definition = decoratedDefinitions.get(current);
    if (definition)
      chain.unshift(definition);
    current = Object.getPrototypeOf(current);
  }
  const fields = /* @__PURE__ */ new Map;
  const methods = /* @__PURE__ */ new Map;
  const metamethods = /* @__PURE__ */ new Map;
  const proxyFields = /* @__PURE__ */ new Map;
  const proxyMethods = /* @__PURE__ */ new Map;
  const proxyMetamethods = /* @__PURE__ */ new Map;
  for (const definition of chain) {
    for (const entry of definition.fields)
      fields.set(...entry);
    for (const entry of definition.methods)
      methods.set(...entry);
    for (const entry of definition.metamethods)
      metamethods.set(...entry);
    for (const entry of definition.proxyFields)
      proxyFields.set(...entry);
    for (const entry of definition.proxyMethods)
      proxyMethods.set(...entry);
    for (const entry of definition.proxyMetamethods)
      proxyMetamethods.set(...entry);
  }
  const constructorArguments = decoratedDefinitions.get(constructor)?.constructorArguments;
  if (constructorArguments !== undefined && proxyMetamethods.has("__call"))
    throw new TypeError("userdata constructor conflicts with proxy metamethod __call");
  if (constructorArguments === undefined && fields.size === 0 && methods.size === 0 && metamethods.size === 0 && proxyFields.size === 0 && proxyMethods.size === 0 && proxyMetamethods.size === 0)
    return;
  return {
    ...constructorArguments === undefined ? {} : { constructor: constructorArguments },
    fields: fields.size > 0 ? Object.fromEntries(fields) : undefined,
    methods: methods.size > 0 ? Object.fromEntries(methods) : undefined,
    metamethods: metamethods.size > 0 ? Object.fromEntries(metamethods) : undefined,
    proxy: proxyFields.size > 0 || proxyMethods.size > 0 || proxyMetamethods.size > 0 ? {
      fields: proxyFields.size > 0 ? Object.fromEntries(proxyFields) : undefined,
      methods: proxyMethods.size > 0 ? Object.fromEntries(proxyMethods) : undefined,
      metamethods: proxyMetamethods.size > 0 ? Object.fromEntries(proxyMetamethods) : undefined
    } : undefined
  };
}
function isBinaryUserdataMetamethod(name) {
  return BINARY_USERDATA_METAMETHODS.has(name);
}
function assertUserdataSurface(value, label = "userdata definition") {
  if (typeof value !== "object" || value === null)
    throw new TypeError(`${label} must be an object`);
  const surface = value;
  if (surface.fields !== undefined) {
    if (typeof surface.fields !== "object" || surface.fields === null)
      throw new TypeError(`${label}.fields must be an object`);
    for (const [name, field2] of Object.entries(surface.fields)) {
      if (typeof field2 !== "object" || field2 === null)
        throw new TypeError(`${label}.fields.${name} must be an object`);
      if (field2.get !== undefined && typeof field2.get !== "function")
        throw new TypeError(`${label}.fields.${name}.get must be a function`);
      if (field2.set !== undefined && typeof field2.set !== "function")
        throw new TypeError(`${label}.fields.${name}.set must be a function`);
      if (field2.type !== undefined)
        fromLuaType(field2.type, `${label}.fields.${name}.type`);
    }
  }
  if (surface.methods !== undefined) {
    if (typeof surface.methods !== "object" || surface.methods === null)
      throw new TypeError(`${label}.methods must be an object`);
    for (const [name, method2] of Object.entries(surface.methods))
      resolveUserdataMethod(method2, `${label}.methods.${name}`);
  }
  if (surface.metamethods !== undefined) {
    if (typeof surface.metamethods !== "object" || surface.metamethods === null)
      throw new TypeError(`${label}.metamethods must be an object`);
    for (const [name, callback] of Object.entries(surface.metamethods)) {
      if (!USERDATA_METAMETHODS.has(name))
        throw new TypeError(`unknown Lua userdata metamethod ${name}`);
      if (name === "__call")
        resolveUserdataMethod(callback, `${label}.metamethods.${name}`);
      else if (typeof callback !== "function")
        throw new TypeError(`${label}.metamethods.${name} must be a function`);
    }
  }
}
function assertUserdataDefinition(value, label = "userdata definition") {
  assertUserdataSurface(value, label);
  const definition = value;
  const hasConstructor = Object.hasOwn(definition, "constructor");
  if (hasConstructor)
    fromLuaSignatures(definition.constructor, `${label}.constructor`);
  if (definition.proxy !== undefined)
    assertUserdataSurface(definition.proxy, `${label}.proxy`);
  if (hasConstructor && definition.proxy?.metamethods?.__call !== undefined)
    throw new TypeError(`${label}.constructor conflicts with ${label}.proxy.metamethods.__call`);
}
function resolveUserdataMethod(method2, label = "userdata method") {
  if (typeof method2 === "function")
    return { callback: method2 };
  if (typeof method2 !== "object" || method2 === null)
    throw new TypeError(`${label} must be a function or method options`);
  if (typeof method2.callback !== "function")
    throw new TypeError(`${label}.callback must be a function`);
  return {
    callback: method2.callback,
    args: fromLuaSignatures(method2.args, `${label}.args`)
  };
}
function exposeGetter(value, context) {
  const name = memberName(context);
  const callback = (instance) => {
    switch (context.kind) {
      case "field":
        return context.access.get(instance);
      case "getter":
        return Reflect.apply(value, instance, []);
      case "accessor":
        return value.get.call(instance);
    }
  };
  onMember(context, (definition, proxy) => {
    const fields = proxy ? definition.proxyFields : definition.fields;
    const methods = proxy ? definition.proxyMethods : definition.methods;
    const field2 = fields.get(name) ?? {};
    field2.get = callback;
    fields.set(name, field2);
    methods.delete(name);
  });
}
function exposeSetter(value, context, type) {
  const name = memberName(context);
  const callback = (instance, fieldValue) => {
    switch (context.kind) {
      case "field":
        context.access.set(instance, fieldValue);
        break;
      case "setter":
        Reflect.apply(value, instance, [fieldValue]);
        break;
      case "accessor":
        value.set.call(instance, fieldValue);
    }
  };
  onMember(context, (definition, proxy) => {
    const fields = proxy ? definition.proxyFields : definition.fields;
    const methods = proxy ? definition.proxyMethods : definition.methods;
    const field2 = fields.get(name) ?? {};
    field2.type = type;
    field2.set = callback;
    fields.set(name, field2);
    methods.delete(name);
  });
}
function exposeMethod(value, context, name, isMetamethod, args) {
  const callback = (instance, ...args) => Reflect.apply(value, instance, args);
  onMember(context, (definition, proxy, constructor) => {
    const methods = proxy ? definition.proxyMethods : definition.methods;
    const fields = proxy ? definition.proxyFields : definition.fields;
    const metamethods = proxy ? definition.proxyMetamethods : definition.metamethods;
    if (isMetamethod) {
      if (isBinaryUserdataMetamethod(name)) {
        const binary = (left, right) => {
          const instance = proxy ? Object.is(left, constructor) ? left : right : typeof left === "object" && left !== null && left instanceof constructor ? left : right;
          if ((typeof instance !== "object" || instance === null) && typeof instance !== "function")
            throw new TypeError("binary userdata metamethod has no userdata operand");
          const result = Reflect.apply(value, instance, [left, right]);
          if (result !== null && (typeof result === "object" || typeof result === "function") && "then" in result && typeof result.then === "function")
            throw new TypeError(`Lua userdata metamethod ${name} cannot be async`);
          return result;
        };
        metamethods.set(name, binary);
      } else
        metamethods.set(name, callback);
    } else {
      methods.set(name, args ? {
        args,
        callback
      } : callback);
      fields.delete(name);
    }
  });
}
function fromLuaType(value, label) {
  if (isFromLuaType(value))
    return value;
  throw new TypeError(`${label} must be a FromLua decoder`);
}
function memberName(context) {
  if (context.private)
    throw new TypeError("Lua userdata members cannot be private");
  if (typeof context.name !== "string")
    throw new TypeError("Lua userdata members must have string names");
  return context.name;
}
function onMember(context, register) {
  context.addInitializer(function() {
    const constructor = context.static ? this : Reflect.get(Object.getPrototypeOf(this), "constructor");
    if (typeof constructor !== "function")
      throw new TypeError("Lua userdata instance has no class constructor");
    const definition = definitionFor(constructor);
    if (definition.registrations.has(register))
      return;
    definition.registrations.add(register);
    register(definition, context.static, constructor);
  });
}
function definitionFor(constructor) {
  let definition = decoratedDefinitions.get(constructor);
  if (!definition) {
    definition = {
      registrations: /* @__PURE__ */ new Set,
      fields: /* @__PURE__ */ new Map,
      methods: /* @__PURE__ */ new Map,
      metamethods: /* @__PURE__ */ new Map,
      proxyFields: /* @__PURE__ */ new Map,
      proxyMethods: /* @__PURE__ */ new Map,
      proxyMetamethods: /* @__PURE__ */ new Map
    };
    decoratedDefinitions.set(constructor, definition);
  }
  return definition;
}
function initializeLuaBindings() {
  return initialization ??= init_luau_wasm_BanGD_Ae().then(() => exports_luau_wasm_BanGD_Ae);
}
function liveLua(reference) {
  const lua = reference.deref();
  if (!lua)
    throw new Error("Lua state is unavailable");
  return lua;
}
function sourceText(source) {
  if (typeof source !== "string")
    throw new TypeError("Luau source must be a string");
  assertWellFormedString(source);
  return source;
}
function convertLuaArguments(values, types, label = "argument") {
  if (types === undefined)
    return [...values];
  const matches = signatureList(types).filter((signature) => signatureAcceptsCount(signature, values.length));
  if (matches.length === 0)
    throw new TypeError(`${label} count does not match the declared arguments`);
  let firstError;
  for (const signature of matches)
    try {
      return convertLuaArgumentSignature(values, signature, (value) => value, label);
    } catch (error) {
      firstError ??= error;
    }
  if (matches.length === 1 && firstError instanceof Error)
    throw firstError;
  throw new TypeError(`${label}s do not match any declared overload`);
}
function convertLuaStructures(values, leaf = (value) => value, label = "value") {
  return convertLuaArgumentSignature(values, undefined, leaf, label);
}
function convertLuaArgumentSignature(values, types, leaf, label) {
  const context = {
    tables: /* @__PURE__ */ new Map,
    leaf
  };
  const rest = types ? fromLuaRestNode(types.at(-1)) : undefined;
  const fixed = types ? types.length - (rest ? 1 : 0) : values.length;
  const count = rest ? Math.max(fixed, values.length) : fixed;
  return Array.from({ length: count }, (_, index) => convertLuaArgument(values[index] ?? null, index < fixed ? types?.[index] : rest?.value, context, 0, `${label} ${index + 1}`));
}
function convertLuaArgument(value, type, context, depth, label) {
  if (depth > 64)
    throw new TypeError("Lua table nesting is too deep");
  const node = fromLuaNode(type);
  if (node?.kind === "option")
    return value === null ? undefined : convertLuaArgument(value, node.value, context, depth, label);
  if (node?.kind === "bytes") {
    if (value instanceof Uint8Array)
      return value;
    if (typeof value === "string")
      return utf8Encoder.encode(value);
    throw new TypeError(`${label} must be a string`);
  }
  if (node?.kind === "array" || node?.kind === "tuple" || node?.kind === "map" || node?.kind === "record" || node?.kind === "object") {
    if (!(value instanceof LuaTable))
      throw new TypeError(`${label} must be a table`);
    return convertLuaTable(value, type, context, depth, label);
  }
  if (type === undefined) {
    if (value instanceof LuaTable)
      return convertLuaTable(value, undefined, context, depth, label);
    return context.leaf(value);
  }
  if (type === Number) {
    if (typeof value === "number")
      return value;
    if (typeof value === "bigint" && value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER))
      return Number(value);
    throw new TypeError(`${label} must be a number`);
  }
  if (type === BigInt) {
    if (typeof value === "bigint")
      return value;
    if (typeof value === "number" && Number.isSafeInteger(value))
      return BigInt(value);
    throw new TypeError(`${label} must be an integer`);
  }
  if (type === String) {
    if (typeof value === "string")
      return value;
    throw new TypeError(`${label} must be a valid UTF-8 string`);
  }
  if (type === Boolean) {
    if (typeof value === "boolean")
      return value;
    throw new TypeError(`${label} must be a boolean`);
  }
  if (type === Uint8Array) {
    if (value instanceof Uint8Array)
      return value;
    if (typeof value === "string")
      return utf8Encoder.encode(value);
    throw new TypeError(`${label} must be a string`);
  }
  if (type === Array || type === Object || type === Map) {
    if (!(value instanceof LuaTable))
      throw new TypeError(`${label} must be a table`);
    return convertLuaTable(value, type, context, depth, label);
  }
  if (type === LuaVector) {
    if (value instanceof LuaVector)
      return value;
    throw new TypeError(`${label} must be a vector`);
  }
  const constructor = type;
  if (constructor === LuaValue || constructor.prototype instanceof LuaValue) {
    if (value instanceof constructor)
      return value;
    throw new TypeError(`${label} must be ${constructor.name}`);
  }
  if (value instanceof LuaUserdata) {
    const host = value.value;
    if (host instanceof constructor)
      return host;
  }
  throw new TypeError(`${label} must be ${constructor.name || "registered userdata"}`);
}
function convertLuaTable(table, decoder, context, depth, label) {
  const identity = table[VALUE_IDENTITY]();
  const converted = context.tables.get(identity);
  if (converted) {
    if (decoder !== undefined && (converted.decoder === undefined || !sameFromLuaType(decoder, converted.decoder)))
      throw new TypeError(`${label} was already converted with a different table decoder`);
    return converted.value;
  }
  const entries = table.entries();
  const indexes = entries.map(([key]) => tableIndex(key));
  const sequence = entries.length > 0 && indexes.every((index) => index !== undefined) && new Set(indexes).size === entries.length && indexes.reduce((largest, index) => Math.max(largest, index), 0) === entries.length;
  const node = fromLuaNode(decoder);
  const shape = (decoder === Array || node?.kind === "array" || node?.kind === "tuple" ? "array" : decoder === Object || node?.kind === "record" || node?.kind === "object" ? "object" : decoder === Map || node?.kind === "map" ? "map" : undefined) ?? (sequence ? "array" : entries.every(([key]) => typeof key === "string") ? "object" : "map");
  if (shape === "array") {
    if (!sequence && entries.length !== 0)
      throw new TypeError(`${label} must be a contiguous sequence table`);
    if (node?.kind === "tuple" && !tupleAcceptsCount(node.values, entries.length))
      throw new TypeError(`${label} length does not match the declared tuple`);
    const result = new Array(node?.kind === "tuple" ? node.values.length : entries.length);
    context.tables.set(identity, {
      decoder,
      value: result
    });
    for (let index = 0;index < entries.length; index += 1)
      result[indexes[index] - 1] = convertLuaArgument(entries[index][1], node?.kind === "array" ? node.value : node?.kind === "tuple" ? node.values[index] : undefined, context, depth + 1, `${label}[${index}]`);
    if (node?.kind === "tuple")
      for (let index = entries.length;index < node.values.length; index += 1)
        result[index] = convertLuaArgument(null, node.values[index], context, depth + 1, `${label}[${index}]`);
    return result;
  }
  if (shape === "object") {
    if (!entries.every(([key]) => typeof key === "string"))
      throw new TypeError(`${label} must be a table with string keys`);
    const result = Object.create(null);
    context.tables.set(identity, {
      decoder,
      value: result
    });
    const fields = node?.kind === "object" ? node.fields : undefined;
    const present = /* @__PURE__ */ new Set;
    for (const [key, value] of entries) {
      const name = key;
      present.add(name);
      result[name] = convertLuaArgument(value, node?.kind === "record" ? node.value : fields?.[name], context, depth + 1, `${label}.${name}`);
    }
    if (fields) {
      for (const [name, field2] of Object.entries(fields))
        if (!present.has(name) && !acceptsNil$1(field2))
          throw new TypeError(`${label}.${name} is required`);
    }
    return result;
  }
  const result = /* @__PURE__ */ new Map;
  context.tables.set(identity, {
    decoder,
    value: result
  });
  for (const [key, value] of entries)
    result.set(convertLuaArgument(key, node?.kind === "map" ? node.key : undefined, context, depth + 1, `${label} key`), convertLuaArgument(value, node?.kind === "map" ? node.value : undefined, context, depth + 1, `${label} value`));
  return result;
}
function tupleAcceptsCount(values, count) {
  let required = values.length;
  while (required > 0 && acceptsNil$1(values[required - 1]))
    required--;
  return count >= required && count <= values.length;
}
function sameFromLuaType(left, right) {
  if (left === right)
    return true;
  const leftNode = fromLuaNode(left);
  const rightNode = fromLuaNode(right);
  if (!leftNode || !rightNode || leftNode.kind !== rightNode.kind)
    return false;
  switch (leftNode.kind) {
    case "bytes":
      return true;
    case "array":
    case "record":
    case "option":
      return sameFromLuaType(leftNode.value, rightNode.value);
    case "tuple": {
      const rightValues = rightNode.values;
      return leftNode.values.length === rightValues.length && leftNode.values.every((value, index) => sameFromLuaType(value, rightValues[index]));
    }
    case "map": {
      const rightMap = rightNode;
      return sameFromLuaType(leftNode.key, rightMap.key) && sameFromLuaType(leftNode.value, rightMap.value);
    }
    case "object": {
      const rightFields = rightNode.fields;
      const names = Object.keys(leftNode.fields);
      return names.length === Object.keys(rightFields).length && names.every((name) => Object.hasOwn(rightFields, name) && sameFromLuaType(leftNode.fields[name], rightFields[name]));
    }
  }
}
function isPromiseLike(value) {
  return (typeof value === "object" || typeof value === "function") && value !== null && "then" in value && typeof value.then === "function";
}
function tableIndex(value) {
  if (typeof value === "bigint") {
    if (value < 1n || value > BigInt(Number.MAX_SAFE_INTEGER))
      return;
    return Number(value);
  }
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1 ? value : undefined;
}
function isRawReference(value) {
  return typeof value === "object" && value !== null && typeof value[REF_STATE] === "number" && typeof value[REF_ID] === "number" && typeof value[REF_TYPE] === "string";
}
function isRawVector(value) {
  return typeof value === "object" && value !== null && value[VECTOR_MARKER$1] === true && typeof value.x === "number" && typeof value.y === "number" && typeof value.z === "number";
}
function nextTableId(context) {
  const id = context.nextTableId;
  if (id > 4294967295)
    throw new RangeError("too many tables in one value");
  context.nextTableId += 1;
  return id;
}
function wasmUsize(value, name) {
  if (!Number.isInteger(value) || value < 0 || value > 4294967295)
    throw new RangeError(`${name} must be an integer between 0 and 4294967295`);
  return value;
}
function prepareAbort(options) {
  if (typeof options !== "object" || options === null)
    throw new TypeError("options must be an object");
  const { signal } = options;
  if (signal === undefined)
    return [null, () => {
      return;
    }];
  if (typeof signal !== "object" || signal === null || typeof signal.addEventListener !== "function" || typeof signal.removeEventListener !== "function" || typeof signal.aborted !== "boolean")
    throw new TypeError("signal must be an AbortSignal");
  if (signal.aborted)
    throw signal.reason;
  let abort;
  const promise = new Promise((resolve) => {
    abort = () => resolve(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
  });
  if (signal.aborted)
    abort();
  return [promise, () => {
    try {
      signal.removeEventListener("abort", abort);
    } catch {}
  }];
}
function encodeResolvedModule(value) {
  if (value === null || value === undefined)
    return;
  if (typeof value !== "object" || Array.isArray(value) || !Object.hasOwn(value, "name") || !Object.hasOwn(value, "source") || Object.hasOwn(value, "value") || typeof value.name !== "string" || typeof value.source !== "string")
    throw new TypeError("module resolver must return a source module");
  const module = value;
  const nameBytes = utf8Length(module.name);
  if (!module.name || nameBytes > 2048 || module.name.includes("\x00"))
    throw new WorkerInputError("resolved module name is invalid");
  const sourceBytes = utf8$1.encode(module.source);
  if (sourceBytes.byteLength > 262144)
    throw new WorkerInputError("resolved module source exceeds the per-file limit");
  return {
    name: module.name,
    source: sourceBytes
  };
}
function boundedErrorMessage(error) {
  let message = "host operation failed";
  if (typeof error === "object" && error !== null || typeof error === "function")
    try {
      const value = Reflect.get(error, "message");
      message = typeof value === "string" ? value : String(error);
    } catch {}
  else
    try {
      message = String(error);
    } catch {}
  const bytes = new Uint8Array(MAX_ERROR_BYTES);
  const { read, written } = utf8$1.encodeInto(message, bytes);
  const bounded = new TextDecoder().decode(bytes.subarray(0, written));
  return read === message.length ? bounded : `${bounded}…`;
}
function copyJsInterop(value) {
  if (value === undefined)
    return value;
  if (!isJsInterop(value))
    throw new TypeError("jsInterop must be an array of global names");
  if (value.length > MAX_REQUEST_ENTRIES)
    throw new WorkerInputError(`jsInterop contains ${value.length} names; the limit is ${MAX_REQUEST_ENTRIES}`);
  for (const name of value)
    if (utf8Length(name) > MAX_REQUEST_BYTES)
      throw new WorkerInputError("a jsInterop name exceeds the worker request limit");
  return [...value];
}
function prepareExecutionRequest(source, options, jsInterop, resolveModules) {
  const sourceBytes = encodeSource(source);
  const entryName = options.entryName ?? "main.luau";
  validateEntryName(entryName);
  const modules = encodeModules(options.modules ?? []);
  const normalized = normalizeOptions(options);
  const interop = copyJsInterop(jsInterop);
  enforceRequestBudget(sourceBytes, entryName, modules, normalized, interop);
  return {
    request: {
      action: "execute",
      input: sourceBytes,
      options: normalized,
      entryName,
      modules,
      resolveModules,
      jsInterop: interop,
      timing: options.timing ?? false
    },
    transfer: [sourceBytes.buffer, ...modules.map(({ source }) => source.buffer)]
  };
}
function prepareBytecodeExecutionRequest(bytecode, options, jsInterop, resolveModules) {
  if (!(bytecode instanceof Uint8Array))
    throw new TypeError("Luau bytecode must be a Uint8Array");
  validateBytecodeBytes(bytecode);
  const transfer = options.transfer ?? false;
  if (typeof transfer !== "boolean")
    throw new TypeError("transfer must be a boolean");
  if (transfer && (!(bytecode.buffer instanceof ArrayBuffer) || bytecode.byteOffset !== 0 || bytecode.byteLength !== bytecode.buffer.byteLength))
    throw new TypeError("transferred bytecode must cover its entire ArrayBuffer");
  const input = transfer ? bytecode : new Uint8Array(bytecode);
  const entryName = options.entryName ?? "main.luau";
  validateEntryName(entryName);
  const modules = encodeModules(options.modules ?? []);
  const normalized = normalizeOptions(options);
  const interop = copyJsInterop(jsInterop);
  enforceRequestBudget(input, entryName, modules, normalized, interop, MAX_BYTECODE_REQUEST_BYTES);
  return {
    request: {
      action: "executeBytecode",
      input,
      options: normalized,
      entryName,
      modules,
      resolveModules,
      jsInterop: interop,
      timing: options.timing ?? false
    },
    transfer: [input.buffer, ...modules.map(({ source }) => source.buffer)]
  };
}
function prepareCompileRequest(source, options, timing) {
  const sourceBytes = encodeSource(source);
  const normalized = normalizeCompilerOptions(options);
  enforceRequestBudget(sourceBytes, undefined, [], normalized, undefined);
  return {
    request: {
      action: "compile",
      input: sourceBytes,
      options: normalized,
      timing
    },
    transfer: [sourceBytes.buffer]
  };
}
function prepareDumpRequest(source, options, timing) {
  const sourceBytes = encodeSource(source);
  const normalized = normalizeCompilerOptions(options);
  const dumpOptions = normalizeDumpOptions(options);
  enforceRequestBudget(sourceBytes, undefined, [], normalized, undefined);
  return {
    request: {
      action: "dump",
      input: sourceBytes,
      options: normalized,
      dumpOptions,
      timing
    },
    transfer: [sourceBytes.buffer]
  };
}
function normalizeOptions(options = {}) {
  if (typeof options !== "object" || options === null || Array.isArray(options))
    throw new TypeError("Lua options must be an object");
  return {
    ...normalizeCompilerOptions(options),
    memoryLimitBytes: boundedInteger(options.memoryLimitBytes, DEFAULT_EXECUTION_OPTIONS.memoryLimitBytes, MIN_MEMORY_BYTES, MAX_MEMORY_BYTES, "memoryLimitBytes"),
    interruptLimit: boundedInteger(options.interruptLimit, DEFAULT_EXECUTION_OPTIONS.interruptLimit, MIN_INTERRUPT_LIMIT, MAX_INTERRUPT_LIMIT, "interruptLimit"),
    outputLimitBytes: boundedInteger(options.outputLimitBytes, DEFAULT_EXECUTION_OPTIONS.outputLimitBytes, MIN_OUTPUT_BYTES, MAX_OUTPUT_BYTES, "outputLimitBytes"),
    outputLimitEvents: boundedInteger(options.outputLimitEvents, DEFAULT_EXECUTION_OPTIONS.outputLimitEvents, MIN_OUTPUT_EVENTS, MAX_OUTPUT_EVENTS, "outputLimitEvents"),
    resultLimitBytes: boundedInteger(options.resultLimitBytes, DEFAULT_EXECUTION_OPTIONS.resultLimitBytes, MIN_RESULT_BYTES, MAX_RESULT_BYTES, "resultLimitBytes"),
    resultLimitEntries: boundedInteger(options.resultLimitEntries, DEFAULT_EXECUTION_OPTIONS.resultLimitEntries, MIN_RESULT_ENTRIES, MAX_RESULT_ENTRIES, "resultLimitEntries")
  };
}
function normalizeCompilerOptions(options = {}) {
  if (typeof options !== "object" || options === null || Array.isArray(options))
    throw new TypeError("compiler options must be an object");
  return {
    optimizationLevel: boundedInteger(options.optimizationLevel, DEFAULT_EXECUTION_OPTIONS.optimizationLevel, 0, 2, "optimizationLevel"),
    debugLevel: boundedInteger(options.debugLevel, DEFAULT_EXECUTION_OPTIONS.debugLevel, 0, 2, "debugLevel"),
    typeInfoLevel: boundedInteger(options.typeInfoLevel, 0, 0, 1, "typeInfoLevel"),
    coverageLevel: boundedInteger(options.coverageLevel, 0, 0, 2, "coverageLevel"),
    vectorConstructor: optionalString(options.vectorConstructor, "vectorConstructor"),
    vectorType: optionalString(options.vectorType, "vectorType"),
    mutableGlobals: stringArray(options.mutableGlobals, "mutableGlobals"),
    userdataTypes: stringArray(options.userdataTypes, "userdataTypes"),
    disabledBuiltins: stringArray(options.disabledBuiltins, "disabledBuiltins"),
    libraryConstants: libraryConstants(options.libraryConstants)
  };
}
function normalizeDumpOptions(options) {
  if (options === undefined)
    options = {};
  if (typeof options !== "object" || options === null || Array.isArray(options))
    throw new TypeError("dump options must be an object");
  return {
    code: optionalBoolean(options.code, true, "code"),
    lines: optionalBoolean(options.lines, true, "lines"),
    source: optionalBoolean(options.source, false, "source"),
    locals: optionalBoolean(options.locals, false, "locals"),
    remarks: optionalBoolean(options.remarks, false, "remarks"),
    types: optionalBoolean(options.types, false, "types"),
    constants: optionalBoolean(options.constants, false, "constants")
  };
}
function encodeSource(source) {
  if (typeof source !== "string")
    throw new TypeError("Luau source must be a string");
  if (utf8Length(source) > 262144)
    throw new WorkerInputError(`source exceeds the ${MAX_SOURCE_BYTES}-byte worker limit`);
  return utf8$1.encode(source);
}
function validateBytecodeBytes(bytecode) {
  if (bytecode.byteLength > 4194304)
    throw new WorkerInputError(`bytecode is ${bytecode.byteLength} bytes; the worker limit is ${MAX_BYTECODE_BYTES} bytes`);
}
function validateEntryName(name) {
  const bytes = utf8Length(name);
  if (!name || bytes > MAX_ENTRY_NAME_BYTES || name.includes("\x00"))
    throw new WorkerInputError(`invalid entry name; expected 1 to ${MAX_ENTRY_NAME_BYTES} UTF-8 bytes without NUL`);
}
function encodeModules(modules) {
  if (!Array.isArray(modules))
    throw new TypeError("modules must contain string names and sources");
  if (modules.length > 32)
    throw new WorkerInputError(`the worker accepts at most 32 modules`);
  const encoded = [];
  for (const module of modules) {
    if (typeof module !== "object" || module === null || typeof module.name !== "string" || typeof module.source !== "string")
      throw new TypeError("modules must contain string names and sources");
    if (utf8Length(module.source) > 262144)
      throw new WorkerInputError(`module ${JSON.stringify(module.name)} exceeds the ${MAX_MODULE_SOURCE_BYTES}-byte per-file limit`);
    encoded.push({
      name: module.name,
      source: utf8$1.encode(module.source)
    });
  }
  return validateModules(encoded);
}
function validateModules(modules) {
  if (modules.length > 32)
    throw new WorkerInputError(`the worker accepts at most 32 modules`);
  const names = /* @__PURE__ */ new Set;
  let totalBytes = 0;
  for (const module of modules) {
    const nameBytes = utf8Length(module.name);
    if (!module.name || nameBytes > 2048 || module.name.includes("\x00"))
      throw new WorkerInputError(`invalid module name ${JSON.stringify(module.name)}`);
    if (names.has(module.name))
      throw new WorkerInputError(`duplicate module name ${JSON.stringify(module.name)}`);
    names.add(module.name);
    if (module.source.byteLength > 262144)
      throw new WorkerInputError(`module ${JSON.stringify(module.name)} is ${module.source.byteLength} bytes; the per-file limit is ${MAX_MODULE_SOURCE_BYTES} bytes`);
    try {
      strictUtf8.decode(module.source);
    } catch {
      throw new WorkerInputError(`module ${JSON.stringify(module.name)} must be valid UTF-8`);
    }
    totalBytes += module.source.byteLength;
  }
  if (totalBytes > 1048576)
    throw new WorkerInputError(`module sources total ${totalBytes} bytes; the worker limit is ${MAX_TOTAL_MODULE_SOURCE_BYTES} bytes`);
  return modules;
}
function enforceRequestBudget(input, entryName, modules, options, jsInterop, byteLimit = MAX_REQUEST_BYTES) {
  let bytes = input.byteLength + 256;
  let entries = 1;
  const add = (value) => {
    bytes += utf8Length(value) + 8;
    entries += 1;
  };
  if (entryName !== undefined)
    add(entryName);
  for (const module of modules) {
    add(module.name);
    bytes += module.source.byteLength;
    entries += 1;
  }
  add(options.vectorConstructor);
  add(options.vectorType);
  for (const values of [
    options.mutableGlobals,
    options.userdataTypes,
    options.disabledBuiltins
  ])
    for (const value of values)
      add(value);
  for (const [name, value] of Object.entries(options.libraryConstants)) {
    add(name);
    if (typeof value === "string")
      add(value);
    else
      entries += 1;
  }
  for (const name of jsInterop ?? [])
    add(name);
  if (entries > MAX_REQUEST_ENTRIES)
    throw new WorkerInputError(`worker request contains ${entries} entries; the limit is ${MAX_REQUEST_ENTRIES}`);
  if (bytes > byteLimit)
    throw new WorkerInputError(`worker request is at least ${bytes} bytes; the limit is ${byteLimit} bytes`);
}
function boundedInteger(value, fallback, minimum, maximum, name) {
  if (value === undefined)
    return fallback;
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new TypeError(`${name} must be a finite number`);
  return Math.min(maximum, Math.max(minimum, Math.trunc(value)));
}
function optionalString(value, name) {
  if (value === undefined)
    return "";
  if (typeof value !== "string")
    throw new TypeError(`${name} must be a string`);
  return value;
}
function optionalBoolean(value, fallback, name) {
  if (value === undefined)
    return fallback;
  if (typeof value !== "boolean")
    throw new TypeError(`${name} must be a boolean`);
  return value;
}
function stringArray(value, name) {
  if (value === undefined)
    return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
    throw new TypeError(`${name} must be an array of strings`);
  if (value.length > MAX_REQUEST_ENTRIES)
    throw new WorkerInputError(`${name} contains ${value.length} entries; the limit is ${MAX_REQUEST_ENTRIES}`);
  return [...value];
}
function libraryConstants(value) {
  if (value === undefined)
    return {};
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new TypeError("libraryConstants must be an object");
  const names = Object.keys(value);
  if (names.length > MAX_REQUEST_ENTRIES)
    throw new WorkerInputError(`libraryConstants contains ${names.length} entries; the limit is ${MAX_REQUEST_ENTRIES}`);
  const result = Object.create(null);
  for (const name of names) {
    const constant = value[name];
    if (constant !== null && typeof constant !== "boolean" && typeof constant !== "number" && typeof constant !== "bigint" && typeof constant !== "string")
      throw new TypeError(`library constant ${JSON.stringify(name)} has an invalid value`);
    if (typeof constant === "number" && !Number.isFinite(constant))
      throw new TypeError(`library constant ${JSON.stringify(name)} must be finite`);
    if (typeof constant === "bigint" && (constant < -9223372036854775808n || constant > 9223372036854775807n))
      throw new RangeError(`library constant ${JSON.stringify(name)} is outside the Lua integer range`);
    result[name] = constant;
  }
  return result;
}
function validateModuleRequest(value, modules) {
  if (typeof value !== "object" || value === null || modules === undefined)
    throw new Error("the Lua worker returned an unexpected module request");
  const request = value;
  if (request.protocol !== 8 || request.id !== modules.id || request.action !== "resolveModule" || !Number.isSafeInteger(request.resolution) || (request.resolution ?? 0) < 1 || typeof request.specifier !== "string" || typeof request.from !== "string" || request.specifier.includes("\x00") || request.from.includes("\x00") || utf8Length(request.specifier) > 2048 || utf8Length(request.from) > 2048)
    throw new Error("the Lua worker returned an invalid module request");
  return request;
}
function validateWorkerMessage(value, id, action, timing, outputLimitBytes = 0, outputLimitEvents = 0, outputBytes = 0, outputEvents = 0, resultLimitBytes = 0, resultLimitEntries = 0) {
  if (typeof value !== "object" || value === null)
    throw new Error("the Lua worker returned an invalid response");
  const message = value;
  if (message.protocol !== 8)
    throw new Error("the Lua worker returned an incompatible protocol");
  if (message.id !== id) {
    if (Number.isSafeInteger(message.id) && message.id >= 1)
      throw new Error(`the Lua worker returned request ${message.id} while waiting for ${id}`);
    throw new Error("the Lua worker returned an invalid response");
  }
  if (message.action !== action) {
    if (message.action === "execute" || message.action === "executeBytecode" || message.action === "compile" || message.action === "dump")
      throw new Error(`the Lua worker returned ${message.action} for ${action}`);
    throw new Error("the Lua worker returned an invalid response");
  }
  if ("events" in message) {
    const events = message.events;
    if (action !== "execute" && action !== "executeBytecode" || !Array.isArray(events) || events.length === 0 || events.length > 64 || events.some((event) => typeof event !== "object" || event === null || event.event !== "print" && event.event !== "warn" || typeof event.text !== "string") || message.result !== undefined || message.error !== undefined || message.durationMs !== undefined || message.replaceBeforeNext !== undefined)
      throw new Error("the Lua worker returned an invalid output event");
    const nextEvents = outputEvents + events.length;
    const nextBytes = outputBytes + events.reduce((total, event) => total + utf8.encode(event.text).byteLength + 1, 0);
    if (nextEvents > outputLimitEvents || nextBytes > outputLimitBytes)
      throw new Error("the Lua worker exceeded the requested output limit");
    return message;
  }
  const response = message;
  if (timing ? typeof response.durationMs !== "number" || !Number.isFinite(response.durationMs) || response.durationMs < 0 : response.durationMs !== undefined)
    throw new Error("the Lua worker returned an invalid response");
  if (response.replaceBeforeNext !== undefined && typeof response.replaceBeforeNext !== "boolean")
    throw new Error("the Lua worker returned an invalid response");
  if (typeof response.error === "string" && utf8.encode(response.error).byteLength <= 65536 && response.result === undefined)
    return response;
  if (response.error !== undefined || typeof response.result !== "object" || response.result === null)
    throw new Error("the Lua worker returned an invalid response");
  const result = response.result;
  const error = result.error;
  let validError = error === null;
  if (typeof error === "object" && error !== null) {
    const candidate = error;
    if (typeof candidate.message === "string") {
      switch (candidate.kind) {
        case "input":
        case "syntax":
        case "compile":
        case "runtime":
        case "memory":
        case "interrupted":
        case "conversion":
        case "host":
          validError = true;
      }
      validError &&= utf8.encode(candidate.message).byteLength <= MAX_ERROR_BYTES;
    }
  }
  if (typeof result.ok !== "boolean" || !validError || result.ok !== (error === null))
    throw new Error("the Lua worker returned an invalid response");
  if (action === "compile") {
    if (result.bytecode instanceof Uint8Array && result.bytecode.byteLength <= 4194304 && (result.ok || result.bytecode.byteLength === 0))
      return response;
    throw new Error("the Lua worker returned an invalid response");
  }
  if (action === "dump") {
    if (result.text instanceof Uint8Array && result.text.byteLength <= 4194304 && typeof result.textTruncated === "boolean" && (result.ok || result.text.byteLength === 0 && !result.textTruncated))
      return response;
    throw new Error("the Lua worker returned an invalid response");
  }
  if (typeof result.peakLuaMemoryBytes !== "number" || !Number.isFinite(result.peakLuaMemoryBytes) || result.peakLuaMemoryBytes < 0 || !Number.isSafeInteger(result.interruptCount) || result.interruptCount < 0 || typeof result.outputTruncated !== "boolean")
    throw new Error("the Lua worker returned an invalid response");
  if (!Array.isArray(result.values))
    throw new Error("the Lua worker returned an invalid response");
  if (!result.ok) {
    if (result.values.length !== 0)
      throw new Error("the Lua worker returned an invalid response");
  } else
    result.values = normalizeDetachedValues(result.values, resultLimitBytes, resultLimitEntries);
  return response;
}
function normalizeDetachedValues(values, byteLimit, entryLimit) {
  const normalizer = new DetachedValueNormalizer(byteLimit, entryLimit);
  return values.map((value) => normalizer.value(value, 0));
}
function isDetachedVector(value) {
  return Reflect.get(value, VECTOR_MARKER) === true && typeof Reflect.get(value, "x") === "number" && typeof Reflect.get(value, "y") === "number" && typeof Reflect.get(value, "z") === "number" && Reflect.ownKeys(value).length === 4;
}
function exposeJsGlobals(lua, options = {}) {
  exposeJsGlobalsScoped(lua, options);
}
function exposeJsGlobalsScoped(lua, options = {}) {
  if (typeof options !== "object" || options === null)
    throw new TypeError("options must be an object");
  const { globals: globalObject = globalThis, access: requestedAccess = true } = options;
  if (typeof globalObject !== "object" && typeof globalObject !== "function" || globalObject === null)
    throw new TypeError("globals must be an object");
  let enabled = true;
  let allow;
  let filter;
  if (typeof requestedAccess === "boolean")
    enabled = requestedAccess;
  else if (typeof requestedAccess === "object" && requestedAccess !== null) {
    if ("deny" in requestedAccess)
      throw new TypeError("access must be a boolean, allowlist, or filter");
    filter = requestedAccess.filter;
    if (filter !== undefined && typeof filter !== "function")
      throw new TypeError("access.filter must be a function");
    allow = requestedAccess.allow;
    if (allow !== undefined) {
      if (!isArray(allow))
        throw new TypeError("access.allow must be an array of global names");
      for (const name of allow)
        if (typeof name !== "string")
          throw new TypeError("access.allow must be an array of global names");
    }
    if (allow === undefined && filter === undefined)
      throw new TypeError("access must be a boolean, allowlist, or filter");
  } else
    throw new TypeError("access must be a boolean, allowlist, or filter");
  if (!enabled && !lua.appData.has(JS_INTEROP))
    return { close: async () => {
      return;
    } };
  if (lua.appData.has(JS_INTEROP))
    throw new Error("JavaScript globals are already exposed to this Lua state");
  const globals = lua.globals;
  if (globals.metatable !== null)
    throw new Error("exposing JavaScript globals requires an unmodified Lua globals metatable");
  let objectConstructor = Object;
  try {
    objectConstructor = Reflect.get(globalObject, "Object") ?? Object;
  } catch {}
  const forbiddenValues = /* @__PURE__ */ new Set([
    globalObject,
    globalThis,
    Function,
    Proxy,
    Reflect,
    eval
  ]);
  forbiddenValues.add(Object.getPrototypeOf(async function() {}).constructor);
  forbiddenValues.add(Object.getPrototypeOf(function* () {}).constructor);
  forbiddenValues.add(Object.getPrototypeOf(async function* () {}).constructor);
  for (const name of OBJECT_META_OPERATIONS) {
    forbiddenValues.add(Reflect.get(Object, name));
    if (objectConstructor !== Object)
      try {
        forbiddenValues.add(Reflect.get(Object(objectConstructor), name));
      } catch {}
  }
  for (const name of FORBIDDEN_GLOBALS) {
    try {
      forbiddenValues.add(Reflect.get(globalObject, name));
    } catch {}
    if (globalObject !== globalThis)
      try {
        forbiddenValues.add(Reflect.get(globalThis, name));
      } catch {}
  }
  const allowedGlobals = allow ? new Set(allow) : undefined;
  if (allowedGlobals)
    for (const name of allowedGlobals) {
      if (FORBIDDEN_GLOBALS.has(name))
        throw new TypeError(`JavaScript global ${name} cannot be exposed`);
      let exists;
      let value;
      try {
        exists = Reflect.has(globalObject, name);
        value = Reflect.get(globalObject, name, globalObject);
      } catch {
        throw new TypeError(`JavaScript global ${name} is not accessible`);
      }
      if (!exists)
        throw new TypeError(`JavaScript global ${name} is not available`);
      if (forbiddenValues.has(value))
        throw new TypeError(`JavaScript global ${name} cannot be exposed`);
    }
  const references = /* @__PURE__ */ new WeakMap;
  const weakSymbols = /* @__PURE__ */ new WeakMap;
  const strongSymbols = /* @__PURE__ */ new Map;
  let nextIdentity = 1;
  let closed = false;
  let closing;
  const controller = new AbortController;
  const callbacks = /* @__PURE__ */ new Map;
  const pending = /* @__PURE__ */ new Set;
  const listeners = /* @__PURE__ */ new Set;
  const callbackFinalizer = new FinalizationRegistry(({ identity, token }) => {
    if (callbacks.get(identity)?.token === token)
      callbacks.delete(identity);
  });
  const allocateIdentity = () => {
    const identity = nextIdentity++;
    if (identity > 4294967295)
      throw new Error("too many JavaScript identities");
    return identity;
  };
  const identityFor = (value, access = "readonly") => {
    if (typeof value === "symbol") {
      const registered = Symbol.keyFor(value) !== undefined;
      try {
        const stored = registered ? strongSymbols.get(value) : weakSymbols.get(value);
        if (stored !== undefined)
          return stored;
        const identity = allocateIdentity();
        if (registered)
          strongSymbols.set(value, identity);
        else
          weakSymbols.set(value, identity);
        return identity;
      } catch (error) {
        if (!(error instanceof TypeError) || registered)
          throw error;
        const stored = strongSymbols.get(value);
        if (stored !== undefined)
          return stored;
        const identity = allocateIdentity();
        strongSymbols.set(value, identity);
        return identity;
      }
    }
    let identities = references.get(value);
    const stored = identities?.[access];
    if (stored !== undefined)
      return stored;
    const identity = allocateIdentity();
    if (identities)
      identities[access] = identity;
    else {
      identities = { [access]: identity };
      references.set(value, identities);
    }
    return identity;
  };
  const listenerFlags = (options) => {
    if (typeof options === "boolean")
      return {
        capture: options,
        once: false
      };
    if (typeof options !== "object" || options === null)
      return {
        capture: false,
        once: false
      };
    try {
      return {
        capture: Boolean(Reflect.get(options, "capture")),
        once: Boolean(Reflect.get(options, "once"))
      };
    } catch {
      return {
        capture: false,
        once: false
      };
    }
  };
  const updateListeners = (target, property, args) => {
    if (property !== "addEventListener" && property !== "removeEventListener" || typeof target !== "object" && typeof target !== "function" || target === null || typeof args[1] !== "object" && typeof args[1] !== "function" || args[1] === null)
      return;
    const type = String(args[0]);
    const callback = args[1];
    const { capture, once } = listenerFlags(args[2]);
    for (const listener of listeners) {
      if (!(listener.target.deref() === target && listener.type === type && listener.callback.deref() === callback && listener.capture === capture))
        continue;
      if (property === "removeEventListener")
        listeners.delete(listener);
      return;
    }
    if (property === "addEventListener")
      listeners.add({
        target: new WeakRef(target),
        type,
        callback: new WeakRef(callback),
        capture,
        once
      });
  };
  const forgetOnceListener = (callback, event) => {
    if (typeof event !== "object" || event === null)
      return;
    let target;
    let type;
    try {
      target = Reflect.get(event, "currentTarget");
      type = Reflect.get(event, "type");
    } catch {
      return;
    }
    for (const listener of listeners)
      if (listener.once && listener.target.deref() === target && listener.type === type && listener.callback.deref() === callback)
        listeners.delete(listener);
  };
  const eventListenerAccess = (target, property) => (property === "addEventListener" || property === "removeEventListener") && typeof EventTarget !== "undefined" && (typeof target === "object" || typeof target === "function") && target !== null && apply(ordinaryHasInstance, EventTarget, [target]);
  const permits = (operation, target, property) => {
    if (typeof property === "string" && FORBIDDEN_PROPERTIES.has(property) && !eventListenerAccess(target, property) || (target === Object || target === objectConstructor) && typeof property === "string" && OBJECT_META_OPERATIONS.has(property) || typeof target === "function" && typeof property === "string" && FUNCTION_META_OPERATIONS.has(property))
      return false;
    if (target === globalObject && typeof property === "string") {
      if (FORBIDDEN_GLOBALS.has(property))
        return false;
      if (allowedGlobals && !allowedGlobals.has(property))
        return false;
    }
    return !filter || filter({
      operation,
      target,
      property
    }) === true;
  };
  const permittedValue = (value, target, property) => !forbiddenValues.has(value) || eventListenerAccess(target, property);
  const wrap = (value, receiver, access = "readonly", structural = /* @__PURE__ */ new WeakMap, depth = 0) => {
    if (!permittedValue(value))
      return null;
    if (value === undefined || value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "bigint" || typeof value === "string" || value instanceof Uint8Array || value instanceof LuaValue || value instanceof LuaVector)
      return value ?? null;
    let plainObject = false;
    if (!isArray(value) && typeof value === "object")
      try {
        const prototype = Object.getPrototypeOf(value);
        plainObject = prototype === null || prototype === Object.prototype;
      } catch {}
    if (isArray(value) || value instanceof Map || plainObject) {
      if (depth >= MAX_CONVERSION_DEPTH)
        throw new TypeError("value nesting is too deep");
      const existing = structural.get(value);
      if (existing !== undefined)
        return existing;
      if (isArray(value)) {
        const result = [];
        structural.set(value, result);
        for (const item of value)
          result.push(wrap(item, undefined, "readonly", structural, depth + 1));
        return result;
      }
      if (value instanceof Map) {
        const result = /* @__PURE__ */ new Map;
        structural.set(value, result);
        for (const [key, item] of value)
          result.set(wrap(key, undefined, "readonly", structural, depth + 1), wrap(item, undefined, "readonly", structural, depth + 1));
        return result;
      }
      const result = Object.create(null);
      structural.set(value, result);
      for (const name of Object.keys(value)) {
        if (!permits("get", value, name))
          continue;
        const item = Reflect.get(value, name, value);
        result[name] = wrap(item, value, "readonly", structural, depth + 1);
      }
      return result;
    }
    if (typeof value === "function" && receiver === globalObject && isConstructor$1(value))
      return proxyFor(value);
    if (typeof value === "function")
      return lua.createFunction((...args) => {
        if (!permits("call", value))
          throw new TypeError(`${String(value)} is not callable`);
        return wrapResult(apply(value, receiver, unwrapArguments(args)));
      });
    const identity = identityFor(value, access);
    return lua[CREATE_USERDATA_IDENTITY](new JsReference(value, access), identity);
  };
  const wrapResult = (value, receiver, access = "readonly") => {
    if (value !== null && (typeof value === "object" || typeof value === "function") && "then" in value && typeof value.then === "function")
      return Promise.resolve(value).then((resolved) => wrap(resolved, receiver, access));
    return wrap(value, receiver, access);
  };
  const callbackFor = (value) => {
    const identity = value[LUA_FUNCTION_IDENTITY]();
    const existing = callbacks.get(identity)?.callback.deref();
    if (existing)
      return existing;
    const callback = (...args) => {
      if (closed)
        throw new Error("Lua callback is unavailable");
      forgetOnceListener(callback, args[0]);
      const invocation = value[INVOKE_LUA_FUNCTION](args.map((argument) => wrap(argument)), { signal: controller.signal });
      const decode = (results) => {
        if (results.length === 0)
          return;
        const values = unwrapArguments(results);
        return values.length === 1 ? values[0] : values;
      };
      if (!(invocation instanceof Promise))
        return decode(invocation);
      const result = invocation.then(decode);
      pending.add(result);
      result.then(() => pending.delete(result), () => pending.delete(result));
      return result;
    };
    const token = {};
    callbacks.set(identity, {
      callback: new WeakRef(callback),
      token
    });
    callbackFinalizer.register(callback, {
      identity,
      token
    });
    return callback;
  };
  const unwrapLeaf = (value) => {
    if (value instanceof LuaUserdata) {
      const host = value.value;
      return host instanceof JsReference ? host.value : host;
    }
    if (value instanceof LuaFunction)
      return callbackFor(value);
    if (value instanceof LuaBuffer)
      return value.bytes;
    if (value instanceof LuaVector)
      return {
        x: value.x,
        y: value.y,
        z: value.z
      };
    return value;
  };
  const unwrapArguments = (values) => convertLuaStructures(values, unwrapLeaf);
  const unwrap = (value) => unwrapArguments([value])[0];
  const callMember = (target, property, member, args, stripReceiver, access) => {
    const values = unwrapArguments(args);
    if (stripReceiver && values[0] === target)
      values.shift();
    if (property === "removeEventListener" && typeof values[2] === "boolean")
      values[2] = { capture: values[2] };
    const result = apply(member, target, values);
    updateListeners(target, property, values);
    return wrapResult(result, undefined, result === target ? access : "readonly");
  };
  const stringifyReference = (reference) => {
    if (!permits("stringify", reference.value))
      throw new TypeError("value cannot be converted to a string");
    return String(reference.value);
  };
  lua.registerUserdata(JsReference, { metamethods: {
    __index: (reference, key) => {
      const target = Object(reference.value);
      const property = toPropertyKey(unwrap(key));
      if (!permits("get", reference.value, property))
        return null;
      const value = Reflect.get(target, property, reference.value);
      if (typeof value === "function" && permittedValue(value, reference.value, property))
        return lua.createFunction((...args) => {
          if (!permits("call", reference.value, property))
            throw new TypeError(`cannot call property ${String(property)}`);
          return callMember(reference.value, property, value, args, true, reference.access);
        });
      return wrap(value, reference.value, value === reference.value ? reference.access : "readonly");
    },
    __newindex: (reference, key, value) => {
      const target = Object(reference.value);
      const property = toPropertyKey(unwrap(key));
      if (reference.access !== "instance" || !permits("set", reference.value, property))
        throw new TypeError(`cannot assign property ${String(property)}`);
      if (!Reflect.set(target, property, unwrap(value), reference.value))
        throw new TypeError(`cannot assign property ${String(property)}`);
    },
    __namecall: (reference, name, ...args) => {
      const property = toPropertyKey(unwrap(name));
      if (!permits("get", reference.value, property))
        return null;
      const value = Reflect.get(Object(reference.value), property, reference.value);
      if (typeof value !== "function" || !permittedValue(value, reference.value, property) || !permits("call", reference.value, property))
        throw new TypeError(`property ${String(property)} is not callable`);
      return callMember(reference.value, property, value, args, false, reference.access);
    },
    __len: (reference) => {
      if (!permits("get", reference.value, "length"))
        throw new TypeError("cannot read property length");
      const length = Reflect.get(Object(reference.value), "length", reference.value);
      if (typeof length !== "number")
        throw new TypeError(`${String(reference.value)} has no numeric length`);
      return length;
    },
    __tostring: stringifyReference,
    __todebugstring: stringifyReference
  } });
  function proxyFor(value) {
    const userdataClass = value;
    const stringifyProxy = () => {
      if (!permits("stringify", value))
        throw new TypeError("value cannot be converted to a string");
      return String(value);
    };
    return lua[CREATE_USERDATA_IDENTITY](userdataClass, identityFor(value), { metamethods: {
      __index: (_proxy, key) => {
        const property = toPropertyKey(unwrap(key));
        if (!permits("get", value, property))
          return null;
        const propertyValue = Reflect.get(value, property, value);
        if (typeof propertyValue === "function" && permittedValue(propertyValue, value, property))
          return lua.createFunction((...args) => {
            if (!permits("call", value, property))
              throw new TypeError(`cannot call property ${String(property)}`);
            return callMember(value, property, propertyValue, args, true, "readonly");
          });
        return wrap(propertyValue, value);
      },
      __newindex: (_proxy, key, _propertyValue) => {
        const property = toPropertyKey(unwrap(key));
        throw new TypeError(`cannot assign property ${String(property)}`);
      },
      __namecall: (_proxy, name, ...args) => {
        const property = toPropertyKey(unwrap(name));
        if (!permits("get", value, property))
          return null;
        const propertyValue = Reflect.get(value, property, value);
        if (typeof propertyValue !== "function" || !permittedValue(propertyValue, value, property) || !permits("call", value, property))
          throw new TypeError(`property ${String(property)} is not callable`);
        return callMember(value, property, propertyValue, args, false, "readonly");
      },
      __call: (_proxy, ...args) => {
        if (!permits("construct", value))
          throw new TypeError(`${String(value)} is not constructable`);
        return wrap(Reflect.construct(value, unwrapArguments(args)), undefined, "instance");
      },
      __tostring: stringifyProxy,
      __todebugstring: stringifyProxy
    } });
  }
  const metatable = lua.createTable();
  metatable.rawSet("__index", lua.createFunction((_globals, key) => {
    const property = toPropertyKey(unwrap(key));
    if (!permits("get", globalObject, property))
      return null;
    const value = Reflect.get(globalObject, property, globalObject);
    return value === undefined ? null : wrap(value, globalObject);
  }));
  globals.metatable = metatable;
  lua.appData.set(JS_INTEROP, true);
  return { close() {
    if (closing)
      return closing;
    closed = true;
    for (const listener of listeners) {
      const target = listener.target.deref();
      const callback = listener.callback.deref();
      if (!target || !callback)
        continue;
      try {
        const remove = Reflect.get(target, "removeEventListener");
        if (typeof remove === "function")
          apply(remove, target, [
            listener.type,
            callback,
            { capture: listener.capture }
          ]);
      } catch {}
    }
    listeners.clear();
    controller.abort(/* @__PURE__ */ new Error("JavaScript interop scope closed"));
    closing = Promise.allSettled([...pending]).then(() => {
      callbacks.clear();
    });
    return closing;
  } };
}
function toPropertyKey(value) {
  if (typeof value === "symbol")
    return value;
  if (typeof value === "string")
    return value;
  return String(value);
}
function isConstructor$1(value) {
  try {
    Reflect.construct(Function, [], value);
    return true;
  } catch {
    return false;
  }
}
function array(value) {
  return descriptor$1({
    kind: "array",
    value: decoder(value, "array value")
  });
}
function tuple(values) {
  if (!Array.isArray(values))
    throw new TypeError("tuple values must be an array");
  return descriptor$1({
    kind: "tuple",
    values: Object.freeze(values.map((value, index) => decoder(value, `tuple value ${index + 1}`)))
  });
}
function map(key, value) {
  return descriptor$1({
    kind: "map",
    key: decoder(key, "map key"),
    value: decoder(value, "map value")
  });
}
function record(value) {
  return descriptor$1({
    kind: "record",
    value: decoder(value, "record value")
  });
}
function object(shape) {
  if (typeof shape !== "object" || shape === null || Array.isArray(shape) || Object.getPrototypeOf(shape) !== Object.prototype && Object.getPrototypeOf(shape) !== null)
    throw new TypeError("object shape must be a plain object");
  const fields = Object.fromEntries(Object.entries(shape).map(([name, value]) => [name, decoder(value, `object field ${name}`)]));
  return descriptor$1({
    kind: "object",
    fields: Object.freeze(fields)
  });
}
function option(value) {
  const decoded = decoder(value, "option value");
  if (acceptsNil(decoded))
    throw new TypeError("option value is already optional");
  return nilDescriptor({
    kind: "option",
    value: decoded
  });
}
function rest(value) {
  return Object.freeze({ [FROM_LUA_REST]: Object.freeze({ value: decoder(value, "rest value") }) });
}
function descriptor$1(node) {
  return Object.freeze({ [FROM_LUA]: Object.freeze(node) });
}
function nilDescriptor(node) {
  return Object.freeze({
    [FROM_LUA]: Object.freeze(node),
    [FROM_LUA_ACCEPTS_NIL]: true
  });
}
function decoder(value, label) {
  if (fromLuaNode(value) !== undefined || isConstructor(value))
    return value;
  throw new TypeError(`${label} must be a FromLua decoder`);
}
function isConstructor(value) {
  if (value === BigInt)
    return true;
  if (typeof value !== "function")
    return false;
  try {
    Reflect.construct(Object, [], value);
    return true;
  } catch {
    return false;
  }
}
function acceptsNil(value) {
  return fromLuaNode(value)?.kind === "option";
}
function buffer(bytes) {
  if (!(bytes instanceof Uint8Array))
    throw new TypeError("buffer value must be a Uint8Array");
  return descriptor({
    kind: "buffer",
    bytes: bytes.slice()
  });
}
function userdata$1(value) {
  if ((typeof value !== "object" || value === null) && typeof value !== "function")
    throw new TypeError("userdata value must be an object or function");
  return descriptor({
    kind: "userdata",
    value
  });
}
function callback(callback, args) {
  if (typeof callback !== "function")
    throw new TypeError("callback value must be a function");
  return descriptor({
    kind: "callback",
    callback,
    args: args === undefined ? undefined : fromLuaSignatures(args, "callback arguments")
  });
}
function multiple(...values) {
  return Object.freeze({ [INTO_LUA_MULTIPLE]: Object.freeze(values.slice()) });
}
function descriptor(node) {
  return Object.freeze({ [INTO_LUA]: Object.freeze(node) });
}
function dispatchOutput(owner, type, text) {
  owner.dispatchEvent(new LuaOutputEvent(type, text));
}
var DEFAULT_EXECUTION_OPTIONS, MAX_MODULE_NAME_BYTES = 2048, MAX_MODULE_SOURCE_BYTES = 262144, MAX_TOTAL_MODULE_SOURCE_BYTES = 1048576, FROM_LUA, FROM_LUA_ACCEPTS_NIL, FROM_LUA_REST, INTO_LUA, INTO_LUA_MULTIPLE, BINARY_USERDATA_METAMETHODS, decoratedDefinitions, USERDATA_METAMETHODS, REF_STATE = "__luauRsState", REF_ID = "__luauRsRef", REF_TYPE = "__luauRsType", VECTOR_MARKER$1 = "__luauRsVector", BUFFER_MARKER = "__luauRsBuffer", USERDATA_MARKER = "__luauRsUserdata", TABLE_MARKER = "__luauRsTable", CALLBACK_RESULT_MARKER = "__luauRsCallbackResult", STATE, VALUE_TOKEN, VALUE_IDENTITY, USERDATA_VALUE, CREATE_USERDATA_IDENTITY, RELEASE_LUA, INVOKE_LUA_FUNCTION, LUA_FUNCTION_IDENTITY, utf8Decoder$1, utf8Encoder, isArray$1, initialization, luaValueFinalizer, HostCallbacks = class {
  #originals = /* @__PURE__ */ new WeakMap;
  bridge(callback) {
    const reference = new WeakRef(callback);
    const bridge = (...args) => {
      const live = reference.deref();
      if (!live)
        throw new Error("Lua host callback is unavailable");
      return live(...args);
    };
    this.#originals.set(bridge, callback);
    return bridge;
  }
}, LuaOutputEvent, LuaVector = class {
  x;
  y;
  z;
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  toString() {
    return `vector(${this.x}, ${this.y}, ${this.z})`;
  }
}, LuaValue, LuaObjectLike, LuaClass, LuaObject, LuaTable, LuaFunction, LuaThread, LuaBuffer, LuaUserdata, LuaUserdataMetatable = class LuaUserdataMetatable2 {
  owner;
  lua;
  handle;
  constructor(owner, lua, state, handle, token) {
    this.owner = owner;
    this.lua = lua;
    this.handle = handle;
    if (token !== VALUE_TOKEN)
      throw new TypeError("userdata metatables are created by Lua userdata");
    this.state = state;
  }
  state;
  static create(owner, lua, state, handle, token) {
    return new LuaUserdataMetatable2(owner, lua, state, handle, token);
  }
  get(key) {
    return this.lua.decode(this.state.userdataMetatableGet(this.handle, key));
  }
  set(key, value) {
    this.state.userdataMetatableSet(this.handle, key, this.lua.encode(value));
  }
  has(key) {
    return this.state.userdataMetatableHas(this.handle, key);
  }
  entries() {
    return this.state.userdataMetatableEntries(this.handle).map((entry) => {
      if (!isArray$1(entry) || entry.length !== 2 || typeof entry[0] !== "string")
        throw new Error("Lua returned an invalid userdata metatable entry");
      return [entry[0], this.lua.decode(entry[1])];
    });
  }
}, Lua, MAX_SOURCE_BYTES = 262144, MAX_BYTECODE_BYTES = 4194304, MAX_ERROR_BYTES = 65536, MAX_ENTRY_NAME_BYTES = 256, MAX_REQUEST_BYTES = 2097152, MAX_BYTECODE_REQUEST_BYTES = 6291456, MAX_REQUEST_ENTRIES = 4096, MIN_MEMORY_BYTES = 4194304, MAX_MEMORY_BYTES = 134217728, MIN_INTERRUPT_LIMIT = 1000, MAX_INTERRUPT_LIMIT = 2000000, MIN_OUTPUT_BYTES = 1024, MAX_OUTPUT_BYTES = 262144, MIN_OUTPUT_EVENTS = 1, MAX_OUTPUT_EVENTS = 4096, MIN_RESULT_BYTES = 1024, MAX_RESULT_BYTES = 4194304, MIN_RESULT_ENTRIES = 1, MAX_RESULT_ENTRIES = 65536, utf8$1, strictUtf8, WorkerInputError, utf8, WorkerClient = class {
  workerUrl;
  kind;
  worker;
  nextId = 1;
  pending;
  activeOutput;
  staleOutput;
  activeModules;
  staleModules;
  replaceBeforeNext = false;
  terminated = false;
  workerFactory;
  resolveModule;
  constructor(workerUrl, workerFactory, kind, resolveModule) {
    this.workerUrl = workerUrl;
    this.kind = kind;
    this.workerFactory = workerFactory ? new WeakRef(workerFactory) : undefined;
    this.resolveModule = resolveModule ? new WeakRef(resolveModule) : undefined;
  }
  request(prepared, signal, owner, output) {
    const { request, transfer } = prepared;
    if (this.terminated)
      return Promise.reject(/* @__PURE__ */ new Error("Lua client is unavailable"));
    if (this.pending)
      return Promise.reject(/* @__PURE__ */ new Error(`another Lua ${request.action} operation is already active`));
    if (signal !== undefined && (typeof signal !== "object" || signal === null || typeof signal.addEventListener !== "function" || typeof signal.removeEventListener !== "function" || typeof signal.aborted !== "boolean"))
      return Promise.reject(/* @__PURE__ */ new TypeError("signal must be an AbortSignal"));
    if (signal?.aborted)
      return Promise.reject(signal.reason);
    const id = this.nextId;
    this.nextId = id >= Number.MAX_SAFE_INTEGER ? 1 : id + 1;
    if (this.replaceBeforeNext)
      this.replaceWorker();
    this.staleModules = this.activeModules;
    this.staleModules?.controller.abort(new DOMException("Lua execution was replaced", "AbortError"));
    this.activeModules = undefined;
    this.staleOutput = this.activeOutput;
    this.activeOutput = undefined;
    let worker;
    try {
      worker = this.worker ?? this.createWorker();
    } catch (error) {
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      const outputState = request.action === "execute" || request.action === "executeBytecode" ? {
        id,
        action: request.action,
        owner: owner ? new WeakRef(owner) : undefined,
        dispatch: output,
        limitBytes: request.options?.outputLimitBytes ?? 0,
        limitEvents: request.options?.outputLimitEvents ?? 0,
        bytes: 0,
        events: 0
      } : undefined;
      const abort = signal ? () => {
        if (this.pending?.id !== id)
          return;
        this.clearPending()?.modules?.controller.abort(signal.reason);
        this.replaceWorker();
        reject(signal.reason);
      } : undefined;
      this.pending = {
        id,
        action: request.action,
        timing: request.timing === true,
        resolve,
        reject,
        signal,
        abort,
        output: outputState,
        modules: request.resolveModules === true ? {
          id,
          controller: new AbortController,
          resolutions: /* @__PURE__ */ new Set
        } : undefined,
        resultLimitBytes: request.options?.resultLimitBytes ?? 0,
        resultLimitEntries: request.options?.resultLimitEntries ?? 0
      };
      try {
        signal?.addEventListener("abort", abort, { once: true });
      } catch (error) {
        this.clearPending()?.modules?.controller.abort(error);
        this.replaceWorker();
        reject(error);
        return;
      }
      if (!this.pending)
        return;
      if (signal?.aborted) {
        abort();
        return;
      }
      try {
        worker.postMessage({
          ...request,
          protocol: 8,
          id
        }, transfer);
      } catch (error) {
        this.clearPending()?.modules?.controller.abort(error);
        this.replaceWorker();
        reject(error);
      }
    }).then((response) => {
      if (response.error !== undefined) {
        this.replaceWorker();
        throw new Error(response.error);
      }
      return {
        result: response.result,
        durationMs: response.durationMs
      };
    });
  }
  terminate() {
    if (this.terminated)
      return;
    this.terminated = true;
    if (this.pending) {
      const { reject } = this.pending;
      this.clearPending()?.modules?.controller.abort(new DOMException("Lua client is unavailable", "AbortError"));
      reject(new DOMException("Lua client is unavailable", "AbortError"));
    }
    this.replaceWorker();
  }
  createWorker() {
    const workerFactory = this.workerFactory?.deref();
    let workerUrl = this.workerUrl;
    if (workerUrl === undefined) {
      workerUrl = new URL("./worker.js", import.meta.url);
      workerUrl.searchParams.set("wasm", new URL("./luau_wasm_worker_bg.wasm", import.meta.url).href);
    }
    const worker = workerFactory ? workerFactory(this.kind) : new Worker(workerUrl, {
      name: "luau-rs",
      type: "module"
    });
    if (typeof worker !== "object" && typeof worker !== "function" || worker === null || typeof worker.postMessage !== "function" || typeof worker.terminate !== "function")
      throw new TypeError("worker factory must return a Worker");
    this.worker = worker;
    try {
      worker.onmessage = (event) => {
        this.receive(worker, event.data);
      };
      worker.onerror = (event) => {
        event.preventDefault();
        const message = event.error instanceof Error ? event.error.message : event.message;
        this.failWorker(worker, new Error(message || "the Lua worker failed"));
      };
      worker.onmessageerror = () => {
        this.failWorker(worker, /* @__PURE__ */ new Error("the Lua worker returned an unreadable response"));
      };
    } catch (error) {
      this.worker = undefined;
      try {
        worker.terminate();
      } catch {}
      throw error;
    }
    return worker;
  }
  receive(worker, value) {
    if (worker !== this.worker)
      return;
    if (typeof value === "object" && value !== null && value.action === "resolveModule") {
      this.resolveModuleRequest(worker, value);
      return;
    }
    const id = typeof value === "object" && value !== null ? value.id : undefined;
    const pending = this.pending?.id === id ? this.pending : undefined;
    const outputState = pending?.output ?? (this.activeOutput?.id === id ? this.activeOutput : undefined) ?? (this.staleOutput?.id === id ? this.staleOutput : undefined);
    const action = pending?.action ?? outputState?.action;
    if (action === undefined) {
      this.failWorker(worker, /* @__PURE__ */ new Error("the Lua worker returned an unexpected response"));
      return;
    }
    let message;
    try {
      message = validateWorkerMessage(value, id, action, pending?.timing ?? false, outputState?.limitBytes, outputState?.limitEvents, outputState?.bytes, outputState?.events, pending?.resultLimitBytes, pending?.resultLimitEntries);
    } catch (error) {
      this.failWorker(worker, error);
      return;
    }
    if ("events" in message) {
      if (!outputState) {
        this.failWorker(worker, /* @__PURE__ */ new Error("the Lua worker returned unexpected output"));
        return;
      }
      for (const event of message.events) {
        outputState.bytes += utf8.encode(event.text).byteLength + 1;
        outputState.events += 1;
        if (outputState === this.staleOutput)
          continue;
        const owner = outputState.owner?.deref();
        if (!owner || !outputState.dispatch) {
          if (outputState === this.activeOutput)
            this.replaceWorker();
          continue;
        }
        outputState.dispatch(owner, event.event, event.text);
      }
      return;
    }
    if (!pending) {
      this.failWorker(worker, /* @__PURE__ */ new Error("the Lua worker returned a duplicate response"));
      return;
    }
    this.clearPending();
    this.staleOutput = undefined;
    this.staleModules = undefined;
    const result = message.result;
    const completedExecution = (pending.action === "execute" || pending.action === "executeBytecode") && result?.ok === true;
    this.activeOutput = completedExecution ? pending.output : undefined;
    if (completedExecution)
      this.activeModules = pending.modules;
    else
      pending.modules?.controller.abort(new DOMException("Lua execution failed", "AbortError"));
    this.replaceBeforeNext = message.replaceBeforeNext === true;
    if (this.replaceBeforeNext && !this.activeOutput)
      this.replaceWorker();
    pending.resolve(message);
  }
  clearPending() {
    const pending = this.pending;
    this.pending = undefined;
    if (pending?.signal && pending.abort)
      try {
        pending.signal.removeEventListener("abort", pending.abort);
      } catch {}
    return pending;
  }
  resolveModuleRequest(worker, value) {
    const id = typeof value === "object" && value !== null ? value.id : undefined;
    const pendingModules = this.pending?.modules;
    if (this.staleModules?.id === id) {
      try {
        validateModuleRequest(value, this.staleModules);
      } catch (error) {
        this.failWorker(worker, error);
      }
      return;
    }
    const modules = pendingModules?.id === id ? pendingModules : this.activeModules?.id === id ? this.activeModules : undefined;
    let request;
    const resolveModule = this.resolveModule?.deref();
    try {
      request = validateModuleRequest(value, modules);
      if (!resolveModule || !modules)
        throw new Error("the Lua worker requested an unavailable module resolver");
      if (modules.resolutions.has(request.resolution))
        throw new Error("the Lua worker reused a module resolution id");
      if (modules.resolutions.size >= 32)
        throw new Error("the Lua worker exceeded the module resolution limit");
      modules.resolutions.add(request.resolution);
    } catch (error) {
      this.failWorker(worker, error);
      return;
    }
    const signal = modules.controller.signal;
    Promise.resolve().then(() => {
      if (signal.aborted)
        throw signal.reason;
      return resolveModule(request.specifier, {
        from: request.from,
        signal
      });
    }).then((module) => {
      try {
        const encoded = encodeResolvedModule(module);
        this.sendModuleResponse(worker, request, encoded, undefined);
      } catch (error) {
        this.sendModuleResponse(worker, request, undefined, boundedErrorMessage(error));
      }
    }, (error) => {
      this.sendModuleResponse(worker, request, undefined, boundedErrorMessage(error));
    }).catch((error) => this.failWorker(worker, error));
  }
  sendModuleResponse(worker, request, module, error) {
    if (worker !== this.worker || this.pending?.modules?.id !== request.id && this.activeModules?.id !== request.id)
      return;
    const response = {
      protocol: 8,
      id: request.id,
      action: "resolveModule",
      resolution: request.resolution
    };
    if (module)
      response.module = module;
    if (error !== undefined)
      response.error = error;
    worker.postMessage(response, module ? [module.source.buffer] : []);
  }
  failWorker(worker, error) {
    if (worker !== this.worker)
      return;
    const pending = this.clearPending();
    pending?.modules?.controller.abort(error);
    this.replaceWorker();
    pending?.reject(error);
  }
  replaceWorker() {
    const worker = this.worker;
    this.worker = undefined;
    this.activeOutput = undefined;
    this.staleOutput = undefined;
    this.activeModules?.controller.abort(new DOMException("Lua worker was terminated", "AbortError"));
    this.activeModules = undefined;
    this.staleModules = undefined;
    this.replaceBeforeNext = false;
    if (worker)
      try {
        worker.onmessage = null;
        worker.onerror = null;
        worker.onmessageerror = null;
      } catch {}
    try {
      worker?.terminate();
    } catch {}
  }
}, VECTOR_MARKER = "__luauRsVector", DetachedValueNormalizer = class {
  byteLimit;
  entryLimit;
  seen = /* @__PURE__ */ new Map;
  bytes = 0;
  entries = 0;
  constructor(byteLimit, entryLimit) {
    this.byteLimit = byteLimit;
    this.entryLimit = entryLimit;
  }
  value(value, depth) {
    if (depth > 64)
      throw new Error("the Lua worker result exceeds the nesting limit");
    if (value === null) {
      this.consume(1);
      return null;
    }
    switch (typeof value) {
      case "boolean":
        this.consume(1);
        return value;
      case "number":
      case "bigint":
        this.consume(8);
        return value;
      case "string":
        this.consume(utf8.encode(value).byteLength * 2);
        return value;
      case "object":
        break;
      default:
        throw new Error("the Lua worker returned an invalid value");
    }
    if (value instanceof Uint8Array) {
      this.consume(value.byteLength);
      return value;
    }
    if (isDetachedVector(value)) {
      this.consume(12);
      return new LuaVector(value.x, value.y, value.z);
    }
    this.consume(16);
    const previous = this.seen.get(value);
    if (previous !== undefined)
      return previous;
    if (Array.isArray(value)) {
      const result = [];
      this.seen.set(value, result);
      for (const entry of value)
        result.push(this.value(entry, depth + 1));
      return result;
    }
    if (value instanceof Map) {
      let stringKeys = true;
      for (const key of value.keys())
        if (typeof key !== "string") {
          stringKeys = false;
          break;
        }
      if (stringKeys) {
        const result = Object.create(null);
        this.seen.set(value, result);
        for (const [key, entry] of value) {
          this.consume(utf8.encode(key).byteLength * 2);
          result[key] = this.value(entry, depth + 1);
        }
        return result;
      }
      const result = /* @__PURE__ */ new Map;
      this.seen.set(value, result);
      for (const [key, entry] of value)
        result.set(this.value(key, depth + 1), this.value(entry, depth + 1));
      return result;
    }
    throw new Error("the Lua worker returned an invalid value");
  }
  consume(bytes) {
    this.entries += 1;
    this.bytes += bytes + 8;
    if (this.entries > this.entryLimit)
      throw new Error("the Lua worker result exceeds the entry limit");
    if (this.bytes > this.byteLimit)
      throw new Error("the Lua worker result exceeds the byte limit");
  }
}, MAX_CONVERSION_DEPTH = 64, JS_INTEROP, isArray, ordinaryHasInstance, apply, JsReference = class {
  value;
  access;
  constructor(value, access) {
    this.value = value;
    this.access = access;
  }
}, FORBIDDEN_GLOBALS, FORBIDDEN_PROPERTIES, OBJECT_META_OPERATIONS, FUNCTION_META_OPERATIONS, from_lua_exports, bytes, into_lua_exports, utf8Decoder, luaWorkerFinalizer, LuaWorker$1, NodeWorkerAdapter = class {
  onmessage = null;
  onerror = null;
  onmessageerror = null;
  worker;
  terminated = false;
  constructor(url) {
    this.worker = new Worker$1(url, {
      name: "luau-rs",
      execArgv: []
    });
    this.worker.on("message", (data) => this.onmessage?.({ data }));
    this.worker.on("messageerror", (error) => this.onmessageerror?.({ data: error }));
    this.worker.on("error", (error) => this.report(error));
    this.worker.on("exit", (code) => {
      if (!this.terminated)
        this.report(/* @__PURE__ */ new Error(`Lua worker exited with code ${code}`));
    });
  }
  postMessage(message, transfer = []) {
    this.worker.postMessage(message, transfer);
  }
  terminate() {
    this.terminated = true;
    this.worker.terminate();
  }
  report(error) {
    this.onerror?.({
      error,
      message: error.message,
      preventDefault() {}
    });
  }
}, LuaWorker;
var init_node = __esm(() => {
  init_rolldown_runtime_D7D4PA_g();
  DEFAULT_EXECUTION_OPTIONS = Object.freeze({
    optimizationLevel: 1,
    debugLevel: 1,
    memoryLimitBytes: 33554432,
    interruptLimit: 250000,
    outputLimitBytes: 65536,
    outputLimitEvents: 1024,
    resultLimitBytes: 1048576,
    resultLimitEntries: 16384
  });
  FROM_LUA = Symbol("FromLua");
  FROM_LUA_ACCEPTS_NIL = Symbol("FromLua.acceptsNil");
  FROM_LUA_REST = Symbol("FromLua.rest");
  INTO_LUA = Symbol("IntoLua");
  INTO_LUA_MULTIPLE = Symbol("IntoLua.multiple");
  BINARY_USERDATA_METAMETHODS = /* @__PURE__ */ new Set([
    "__add",
    "__sub",
    "__mul",
    "__div",
    "__idiv",
    "__mod",
    "__pow",
    "__eq",
    "__lt",
    "__le",
    "__concat"
  ]);
  decoratedDefinitions = /* @__PURE__ */ new WeakMap;
  USERDATA_METAMETHODS = /* @__PURE__ */ new Set([
    "__add",
    "__sub",
    "__mul",
    "__div",
    "__idiv",
    "__mod",
    "__pow",
    "__unm",
    "__eq",
    "__lt",
    "__le",
    "__len",
    "__concat",
    "__index",
    "__newindex",
    "__namecall",
    "__call",
    "__tostring",
    "__todebugstring",
    "__iter"
  ]);
  STATE = Symbol("LuaValue.state");
  VALUE_TOKEN = Symbol("LuaValue");
  VALUE_IDENTITY = Symbol("LuaValue.identity");
  USERDATA_VALUE = Symbol("Lua.userdataValue");
  CREATE_USERDATA_IDENTITY = Symbol("Lua.createUserdataIdentity");
  RELEASE_LUA = Symbol("Lua.release");
  INVOKE_LUA_FUNCTION = Symbol("LuaFunction.invoke");
  LUA_FUNCTION_IDENTITY = Symbol("LuaFunction.identity");
  utf8Decoder$1 = new TextDecoder;
  utf8Encoder = new TextEncoder;
  isArray$1 = Array.isArray;
  luaValueFinalizer = new FinalizationRegistry(({ state, handle }) => {
    try {
      state.deref()?.release(handle);
    } catch {}
  });
  LuaOutputEvent = class extends Event {
    text;
    constructor(type, text) {
      super(type);
      this.text = text;
    }
  };
  LuaValue = class {
    lua;
    type;
    handle;
    [STATE];
    constructor(lua, state, type, handle, registerFinalizer, token) {
      this.lua = lua;
      this.type = type;
      this.handle = handle;
      if (token !== VALUE_TOKEN)
        throw new TypeError("Lua values are created by a Lua state");
      this[STATE] = state;
      if (registerFinalizer)
        luaValueFinalizer.register(this, {
          state: new WeakRef(this[STATE]),
          handle
        }, lua);
    }
    equals(other) {
      if (other.lua !== this.lua)
        throw new Error("Lua value belongs to another state");
      return this[STATE].valueEquals(this.handle, other.handle);
    }
    [VALUE_IDENTITY]() {
      return this[STATE].valueIdentity(this.handle);
    }
    toString() {
      return this[STATE].valueToString(this.handle);
    }
    reference(lua) {
      if (this.lua !== lua)
        throw new Error("Lua value belongs to another state");
      return {
        [REF_STATE]: this[STATE].stateId,
        [REF_ID]: this.handle,
        [REF_TYPE]: this.type
      };
    }
  };
  LuaObjectLike = class extends LuaValue {
    get(key) {
      return this.lua.decode(this[STATE].get(this.handle, this.lua.encode(key)));
    }
    set(key, value) {
      this[STATE].set(this.handle, this.lua.encode(key), this.lua.encode(value));
    }
    call(...args) {
      return this.lua.decodeArray(this[STATE].call(this.handle, this.lua.encodeArray(args)));
    }
    async callAsync(args = [], options = {}) {
      const [abort, cleanup] = prepareAbort(options);
      try {
        return this.lua.decodeArray(await this[STATE].callAsync(this.handle, this.lua.encodeArray(args), abort));
      } finally {
        cleanup();
      }
    }
    callMethod(name, ...args) {
      return this.lua.decodeArray(this[STATE].callMethod(this.handle, name, this.lua.encodeArray(args)));
    }
    async callMethodAsync(name, args = [], options = {}) {
      const [abort, cleanup] = prepareAbort(options);
      try {
        return this.lua.decodeArray(await this[STATE].callMethodAsync(this.handle, name, this.lua.encodeArray(args), abort));
      } finally {
        cleanup();
      }
    }
    callFunction(name, ...args) {
      return this.lua.decodeArray(this[STATE].callFunction(this.handle, name, this.lua.encodeArray(args)));
    }
    async callFunctionAsync(name, args = [], options = {}) {
      const [abort, cleanup] = prepareAbort(options);
      try {
        return this.lua.decodeArray(await this[STATE].callFunctionAsync(this.handle, name, this.lua.encodeArray(args), abort));
      } finally {
        cleanup();
      }
    }
  };
  LuaClass = class extends LuaObjectLike {
  };
  LuaObject = class extends LuaObjectLike {
    get class() {
      const value = this.lua.decode(this[STATE].objectClass(this.handle));
      if (!(value instanceof LuaClass))
        throw new Error("Lua returned an invalid object class");
      return value;
    }
  };
  LuaTable = class LuaTable2 extends LuaObjectLike {
    rawGet(key) {
      return this.lua.decode(this[STATE].rawGet(this.handle, this.lua.encode(key)));
    }
    rawSet(key, value) {
      this[STATE].rawSet(this.handle, this.lua.encode(key), this.lua.encode(value));
    }
    entries() {
      return this[STATE].tableEntries(this.handle).map((entry) => {
        if (!isArray$1(entry) || entry.length !== 2)
          throw new Error("Lua returned an invalid table entry");
        return [this.lua.decode(entry[0]), this.lua.decode(entry[1])];
      });
    }
    toArray() {
      const entries = this.entries();
      const result = new Array(entries.length);
      for (const [key, value] of entries) {
        const index = tableIndex(key);
        if (index === undefined || index > entries.length || index - 1 in result)
          throw new TypeError("table must be a contiguous sequence");
        result[index - 1] = value;
      }
      return result;
    }
    toObject() {
      const result = Object.create(null);
      for (const [key, value] of this.entries()) {
        if (typeof key !== "string")
          throw new TypeError("table must have only string keys");
        result[key] = value;
      }
      return result;
    }
    toMap() {
      return new Map(this.entries());
    }
    length(options = {}) {
      return this[STATE].tableLength(this.handle, options.raw ?? false);
    }
    clear() {
      this[STATE].tableClear(this.handle);
    }
    containsKey(key) {
      return this[STATE].tableContainsKey(this.handle, this.lua.encode(key));
    }
    push(value) {
      this[STATE].tablePush(this.handle, this.lua.encode(value));
    }
    pop() {
      return this.lua.decode(this[STATE].tablePop(this.handle));
    }
    remove(key) {
      this[STATE].tableRemove(this.handle, this.lua.encode(key));
    }
    rawSetIndex(index, value) {
      this[STATE].tableRawSetIndex(this.handle, wasmUsize(index, "index"), this.lua.encode(value));
    }
    rawPush(value) {
      this[STATE].tableRawPush(this.handle, this.lua.encode(value));
    }
    rawPop() {
      return this.lua.decode(this[STATE].tableRawPop(this.handle));
    }
    rawInsert(index, value) {
      this[STATE].tableRawInsert(this.handle, wasmUsize(index, "index"), this.lua.encode(value));
    }
    rawRemove(key) {
      this[STATE].tableRawRemove(this.handle, this.lua.encode(key));
    }
    setSafeEnvironment(enabled) {
      this[STATE].tableSetSafeEnvironment(this.handle, enabled);
    }
    get readonly() {
      return this[STATE].tableIsReadonly(this.handle);
    }
    set readonly(enabled) {
      this[STATE].tableSetReadonly(this.handle, enabled);
    }
    get metatable() {
      const value = this.lua.decode(this[STATE].tableMetatable(this.handle));
      if (value === null)
        return null;
      if (!(value instanceof LuaTable2))
        throw new Error("Lua returned a non-table metatable");
      return value;
    }
    set metatable(value) {
      this[STATE].tableSetMetatable(this.handle, this.lua.encode(value));
    }
  };
  LuaFunction = class LuaFunction2 extends LuaValue {
    get environment() {
      const value = this.lua.decode(this[STATE].functionEnvironment(this.handle));
      if (value === null)
        return null;
      if (!(value instanceof LuaTable))
        throw new Error("Lua returned a non-table function environment");
      return value;
    }
    setEnvironment(environment) {
      if (!(environment instanceof LuaTable))
        throw new TypeError("function environment must be a Lua table");
      return this[STATE].functionSetEnvironment(this.handle, environment.reference(this.lua)[REF_ID]);
    }
    deepClone() {
      const value = this.lua.decode(this[STATE].functionDeepClone(this.handle));
      if (!(value instanceof LuaFunction2))
        throw new Error("Lua returned a non-function clone");
      return value;
    }
    bind(...args) {
      const value = this.lua.decode(this[STATE].functionBind(this.handle, this.lua.encodeArray(args)));
      if (!(value instanceof LuaFunction2))
        throw new Error("Lua returned a non-function binding");
      return value;
    }
    info() {
      return this[STATE].functionInfo(this.handle);
    }
    coverage() {
      return this[STATE].functionCoverage(this.handle);
    }
    call(...args) {
      return this.lua.decodeArray(this[STATE].call(this.handle, this.lua.encodeArray(args)));
    }
    async callAsync(args = [], options = {}) {
      const [abort, cleanup] = prepareAbort(options);
      try {
        return this.lua.decodeArray(await this[STATE].callAsync(this.handle, this.lua.encodeArray(args), abort));
      } finally {
        cleanup();
      }
    }
    [INVOKE_LUA_FUNCTION](args, options = {}) {
      const [abort, cleanup] = prepareAbort(options);
      let result;
      try {
        result = this[STATE].invokeFunction(this.handle, this.lua.encodeArray(args), abort);
      } catch (error) {
        cleanup();
        throw error;
      }
      if (result instanceof Promise)
        return result.then((values) => this.lua.decodeArray(values)).finally(cleanup);
      cleanup();
      return this.lua.decodeArray(result);
    }
    [LUA_FUNCTION_IDENTITY]() {
      return this[STATE].functionIdentity(this.handle);
    }
    createThread() {
      const value = this.lua.decode(this[STATE].createThread(this.handle));
      if (!(value instanceof LuaThread))
        throw new Error("Lua returned a non-thread value");
      return value;
    }
  };
  LuaThread = class extends LuaValue {
    get status() {
      return this[STATE].threadStatus(this.handle);
    }
    get yieldable() {
      return this[STATE].threadIsYieldable(this.handle);
    }
    get namecallMethod() {
      return this[STATE].threadNamecallMethod(this.handle) ?? null;
    }
    setSingleStep(enabled) {
      if (typeof enabled !== "boolean")
        throw new TypeError("single-step state must be a boolean");
      this[STATE].threadSetSingleStep(this.handle, enabled);
    }
    inspectStack(level = 0) {
      const info = this[STATE].threadInspectStack(this.handle, wasmUsize(level, "stack level"));
      return info === null ? null : Object.freeze(info);
    }
    traceback(message, level = 0) {
      return utf8Decoder$1.decode(this[STATE].threadTraceback(this.handle, message, wasmUsize(level, "traceback level")));
    }
    resume(...args) {
      return this.lua.decodeArray(this[STATE].threadResume(this.handle, this.lua.encodeArray(args)));
    }
    reset(function_) {
      if (!(function_ instanceof LuaFunction))
        throw new TypeError("thread reset requires a Lua function");
      this[STATE].threadReset(this.handle, function_.reference(this.lua)[REF_ID]);
    }
    resumeError(error) {
      return this.lua.decodeArray(this[STATE].threadResumeError(this.handle, this.lua.encode(error)));
    }
    async resumeAsync(args = [], options = {}) {
      const [abort, cleanup] = prepareAbort(options);
      try {
        const result = await this[STATE].threadResumeAsync(this.handle, this.lua.encodeArray(args), abort);
        return this.decodeResult(result);
      } finally {
        cleanup();
      }
    }
    async resumeErrorAsync(error, options = {}) {
      const [abort, cleanup] = prepareAbort(options);
      try {
        return this.decodeResult(await this[STATE].threadResumeErrorAsync(this.handle, this.lua.encode(error), abort));
      } finally {
        cleanup();
      }
    }
    [Symbol.asyncIterator]() {
      let closed = false;
      let queue = Promise.resolve();
      const thread = this;
      const enqueue = (operation) => {
        const result = queue.then(operation);
        queue = result.then(() => {
          return;
        }, () => {
          return;
        });
        return result;
      };
      return {
        next(args = []) {
          return enqueue(async () => {
            if (closed)
              return {
                done: true,
                value: []
              };
            try {
              const result = await thread.resumeAsync(args);
              closed = result.done;
              return result;
            } catch (error) {
              closed = thread.status !== "resumable";
              throw error;
            }
          });
        },
        throw(error) {
          return enqueue(async () => {
            if (closed)
              throw error;
            try {
              const result = await thread.resumeErrorAsync(error);
              closed = result.done;
              return result;
            } catch (raised) {
              closed = thread.status !== "resumable";
              throw raised;
            }
          });
        },
        return(value = []) {
          return enqueue(async () => {
            closed = true;
            return {
              done: true,
              value: await value
            };
          });
        },
        [Symbol.asyncIterator]() {
          return this;
        },
        async[Symbol.asyncDispose]() {
          closed = true;
          await queue;
        }
      };
    }
    decodeResult(value) {
      if (typeof value !== "object" || value === null)
        throw new Error("Lua returned an invalid coroutine result");
      const result = value;
      if (typeof result.done !== "boolean" || !isArray$1(result.value))
        throw new Error("Lua returned an invalid coroutine result");
      const values = this.lua.decodeArray(result.value);
      return result.done ? {
        done: true,
        value: values
      } : {
        done: false,
        value: values
      };
    }
  };
  LuaBuffer = class extends LuaValue {
    get bytes() {
      return this[STATE].bufferBytes(this.handle);
    }
    write(offset, bytes) {
      this[STATE].bufferWrite(this.handle, wasmUsize(offset, "offset"), bytes);
    }
  };
  LuaUserdata = class extends LuaObjectLike {
    get value() {
      return this.lua[USERDATA_VALUE](this[STATE].userdataValue(this.handle));
    }
    destroy() {
      this[STATE].userdataDestroy(this.handle);
    }
    take() {
      return this.lua[USERDATA_VALUE](this[STATE].userdataTake(this.handle));
    }
    get userValue() {
      return this.lua.decode(this[STATE].userdataUserValue(this.handle));
    }
    set userValue(value) {
      this[STATE].userdataSetUserValue(this.handle, this.lua.encode(value));
    }
    get typeName() {
      return this[STATE].userdataTypeName(this.handle);
    }
    get metatable() {
      this[STATE].userdataMetatable(this.handle);
      return LuaUserdataMetatable.create(this, this.lua, this[STATE], this.handle, VALUE_TOKEN);
    }
    isProxy(userdataClass) {
      return Object.is(this.value, userdataClass);
    }
  };
  Lua = class Lua2 extends EventTarget {
    version;
    appData = /* @__PURE__ */ new Map;
    #state;
    #callbacks;
    #userdataDefinitions = /* @__PURE__ */ new Map;
    #userdataBridges = /* @__PURE__ */ new Map;
    #userdataValues = /* @__PURE__ */ new WeakMap;
    #binaryUserdataBridges = /* @__PURE__ */ new WeakMap;
    #registerFinalizers;
    constructor(state, version, registerFinalizers, callbacks) {
      super();
      this.version = version;
      this.#state = state;
      this.#registerFinalizers = registerFinalizers;
      this.#callbacks = callbacks;
    }
    [RELEASE_LUA]() {
      luaValueFinalizer.unregister(this);
      this.#state.dispose();
      this.#state.free();
    }
    static async create(options = {}) {
      return Lua2.createState(options, true);
    }
    static async createWorkerState(options = {}) {
      return Lua2.createState(options, false);
    }
    static async createState(options, registerFinalizers) {
      if (typeof options !== "object" || options === null)
        throw new TypeError("Lua options must be an object");
      const { resolveModule, ...stateOptions } = options;
      if (resolveModule !== undefined && typeof resolveModule !== "function")
        throw new TypeError("resolveModule must be a function");
      const bindings = await initializeLuaBindings();
      const callbacks = new HostCallbacks;
      const allocationObserver = stateOptions.memory?.onAllocation;
      const rawOptions = allocationObserver ? {
        ...stateOptions,
        memory: {
          ...stateOptions.memory,
          onAllocation: callbacks.bridge(allocationObserver)
        }
      } : stateOptions;
      const lua = new Lua2(new bindings.WasmLua(rawOptions), bindings.version(), registerFinalizers, callbacks);
      const owner = new WeakRef(lua);
      lua.#state.configureOutput(callbacks.bridge((type, text) => {
        owner.deref()?.dispatchEvent(new LuaOutputEvent(type, text));
      }));
      if (resolveModule)
        lua.#state.configureModules([], lua.moduleResolver(resolveModule), stateOptions.sandbox === true, 32, MAX_MODULE_NAME_BYTES, MAX_MODULE_SOURCE_BYTES, MAX_TOTAL_MODULE_SOURCE_BYTES);
      return lua;
    }
    addEventListener(type, listener, options) {
      super.addEventListener(type, listener, options);
    }
    removeEventListener(type, listener, options) {
      super.removeEventListener(type, listener, options);
    }
    get globals() {
      const value = this.decode(this.#state.globals());
      if (!(value instanceof LuaTable))
        throw new Error("Lua returned invalid globals");
      return value;
    }
    get mainThread() {
      const value = this.decode(this.#state.mainThread());
      if (!(value instanceof LuaThread))
        throw new Error("Lua returned an invalid main thread");
      return value;
    }
    get currentThread() {
      const value = this.decode(this.#state.currentThread());
      if (!(value instanceof LuaThread))
        throw new Error("Lua returned an invalid current thread");
      return value;
    }
    get yieldable() {
      return this.#state.isYieldable();
    }
    get namecallMethod() {
      return this.#state.namecallMethod() ?? null;
    }
    coerceString(value) {
      const result = this.decode(this.#state.coerceString(this.encode(value)));
      if (result !== null && typeof result !== "string" && !(result instanceof Uint8Array))
        throw new Error("Lua returned a non-string coercion result");
      return result;
    }
    coerceInteger(value) {
      const result = this.#state.coerceInteger(this.encode(value));
      if (result !== null && typeof result !== "bigint")
        throw new Error("Lua returned a non-integer coercion result");
      return result;
    }
    coerceNumber(value) {
      const result = this.#state.coerceNumber(this.encode(value));
      if (result === undefined)
        return null;
      if (typeof result !== "number")
        throw new Error("Lua returned a non-number coercion result");
      return result;
    }
    typeMetatable(type) {
      const result = this.decode(this.#state.typeMetatable(type));
      if (result === null)
        return null;
      if (!(result instanceof LuaTable))
        throw new Error("Lua returned a non-table type metatable");
      return result;
    }
    setTypeMetatable(type, metatable) {
      if (metatable !== null && !(metatable instanceof LuaTable))
        throw new TypeError("type metatable must be a Lua table or null");
      this.#state.setTypeMetatable(type, this.encode(metatable));
    }
    inspectStack(level = 0) {
      const info = this.#state.inspectStack(wasmUsize(level, "stack level"));
      return info === null ? null : Object.freeze(info);
    }
    get usedMemory() {
      return this.#state.usedMemory();
    }
    get peakMemory() {
      return this.#state.peakMemory();
    }
    configureWorker(modules, resolveModule, output, outputByteLimit, outputEventLimit) {
      this.#state.configureWorker([...modules], resolveModule ? this.moduleResolver(resolveModule) : undefined, this.#callbacks.bridge(output), outputByteLimit, outputEventLimit, 32, MAX_MODULE_NAME_BYTES, MAX_MODULE_SOURCE_BYTES, MAX_TOTAL_MODULE_SOURCE_BYTES);
    }
    moduleResolver(resolveModule) {
      const callback = this.#callbacks.bridge(resolveModule);
      const owner = new WeakRef(this);
      const encode = (module) => {
        const lua = liveLua(owner);
        if (module === null || module === undefined)
          return module;
        if (typeof module !== "object" || Array.isArray(module))
          throw new TypeError("module resolver must return a module object");
        if (typeof module.name !== "string")
          throw new TypeError("resolved module name must be a string");
        if (!module.name || module.name.includes("\x00") || utf8Length(module.name) > 2048)
          throw new TypeError("resolved module name is invalid");
        const hasSource = Object.hasOwn(module, "source");
        if (hasSource === Object.hasOwn(module, "value"))
          throw new TypeError("module resolver must return exactly one of source or value");
        if (hasSource) {
          if (typeof module.source !== "string")
            throw new TypeError("resolved module source must be a string");
          const source = module.source;
          if (utf8Length(source) > 262144)
            throw new RangeError("resolved module source exceeds the per-file limit");
          return {
            name: module.name,
            source
          };
        }
        const value = module.value;
        if (value === undefined)
          throw new TypeError("resolved module value is required");
        return {
          name: module.name,
          value: lua.encode(value)
        };
      };
      return (specifier, from) => {
        const lua = liveLua(owner);
        const module = callback(specifier, {
          from,
          lua
        });
        return isPromiseLike(module) ? Promise.resolve(module).then(encode) : encode(module);
      };
    }
    executeWorker(source, options, errorLimit, resultByteLimit, resultEntryLimit) {
      return this.#state.executeWorker(source, options, errorLimit, resultByteLimit, resultEntryLimit);
    }
    executeBytecodeWorker(bytecode, options, errorLimit, resultByteLimit, resultEntryLimit) {
      return this.#state.executeBytecodeWorker(bytecode, options, errorLimit, resultByteLimit, resultEntryLimit);
    }
    get gcRunning() {
      return this.#state.gcIsRunning();
    }
    createTable(initial) {
      const value = this.decode(this.#state.createTable(this.encode(initial ?? null)));
      if (!(value instanceof LuaTable))
        throw new Error("Lua returned a non-table value");
      return value;
    }
    createTableWithCapacity(arrayCapacity, recordCapacity) {
      const value = this.decode(this.#state.createTableWithCapacity(wasmUsize(arrayCapacity, "array capacity"), wasmUsize(recordCapacity, "record capacity")));
      if (!(value instanceof LuaTable))
        throw new Error("Lua returned a non-table value");
      return value;
    }
    createBuffer(bytes) {
      const value = this.decode(typeof bytes === "number" ? this.#state.createBufferWithCapacity(wasmUsize(bytes, "buffer size")) : this.#state.createBuffer(bytes));
      if (!(value instanceof LuaBuffer))
        throw new Error("Lua returned a non-buffer value");
      return value;
    }
    loadLibraries(libraries) {
      this.#state.loadLibraries(libraries);
    }
    createFunction(callback, options) {
      if (typeof callback !== "function")
        throw new TypeError("callback must be a function");
      let types;
      if (options !== undefined) {
        if (typeof options !== "object" || options === null)
          throw new TypeError("function options must be an object");
        types = fromLuaSignatures(options.args, "function options.args");
      }
      const owner = new WeakRef(this);
      const hostCallback = this.#callbacks.bridge(callback);
      const bridge = (...args) => {
        const lua = liveLua(owner);
        return lua.encodeCallbackReturn(hostCallback(...convertLuaArguments(args.map((value) => lua.decode(value)), types, "function argument")));
      };
      const value = this.decode(this.#state.createAsyncFunction(bridge));
      if (!(value instanceof LuaFunction))
        throw new Error("Lua returned a non-function value");
      return value;
    }
    createUserdata(value) {
      const bridge = this.userdataBridge(value) ?? this.bridgeUserdataDefinition({});
      const userdata2 = this.decode(this.#state.createUserdata(this.storeUserdata(value), bridge, 0));
      if (!(userdata2 instanceof LuaUserdata))
        throw new Error("Lua returned a non-userdata value");
      return userdata2;
    }
    createProxy(userdataClass, surface) {
      if (surface !== undefined)
        assertUserdataSurface(surface, "userdata proxy definition");
      const definition = surface ? surface : this.userdataProxyDefinition(userdataClass, this.userdataDefinition(userdataClass));
      const bridge = this.bridgeUserdataDefinition(definition);
      const value = this.decode(this.#state.createUserdata(this.storeUserdata(userdataClass), bridge, 0));
      if (!(value instanceof LuaUserdata))
        throw new Error("Lua returned a non-userdata proxy");
      return value;
    }
    registerUserdata(userdataClass, definition) {
      assertUserdataDefinition(definition);
      const stored = Object.hasOwn(definition, "constructor") ? {
        ...definition,
        constructor: fromLuaSignatures(definition.constructor, "userdata definition.constructor")
      } : definition;
      this.#userdataDefinitions.set(userdataClass, stored);
      this.#userdataBridges.clear();
    }
    [CREATE_USERDATA_IDENTITY](value, identity, surface) {
      const bridge = surface ? this.bridgeUserdataDefinition(surface) : this.userdataBridge(value) ?? this.bridgeUserdataDefinition({});
      const userdata2 = this.decode(this.#state.createUserdata(this.storeUserdata(value), bridge, wasmUsize(identity, "userdata identity")));
      if (!(userdata2 instanceof LuaUserdata))
        throw new Error("Lua returned a non-userdata value");
      return userdata2;
    }
    load(source, options = {}) {
      const encodedOptions = {
        ...options,
        environment: options.environment ? this.encode(options.environment) : undefined
      };
      const value = this.decode(this.#state.load(sourceText(source), encodedOptions));
      if (!(value instanceof LuaFunction))
        throw new Error("Lua returned a non-function value");
      return value;
    }
    loadBytecode(bytecode, options = {}) {
      const encodedOptions = {
        ...options,
        environment: options.environment ? this.encode(options.environment) : undefined
      };
      const value = this.decode(this.#state.loadBytecode(bytecode, encodedOptions));
      if (!(value instanceof LuaFunction))
        throw new Error("Lua returned a non-function value");
      return value;
    }
    execute(source, options = {}, ...args) {
      const encodedOptions = {
        ...options,
        environment: options.environment ? this.encode(options.environment) : undefined
      };
      return this.decodeArray(this.#state.execute(sourceText(source), encodedOptions, this.encodeArray(args)));
    }
    async executeAsync(source, options = {}, ...args) {
      const [abort, cleanup] = prepareAbort(options);
      const { signal: _signal, ...executeOptions } = options;
      const encodedOptions = {
        ...executeOptions,
        environment: options.environment ? this.encode(options.environment) : undefined
      };
      try {
        return this.decodeArray(await this.#state.executeAsync(sourceText(source), encodedOptions, this.encodeArray(args), abort));
      } finally {
        cleanup();
      }
    }
    executeBytecode(bytecode, options = {}, ...args) {
      const encodedOptions = {
        ...options,
        environment: options.environment ? this.encode(options.environment) : undefined
      };
      return this.decodeArray(this.#state.executeBytecode(bytecode, encodedOptions, this.encodeArray(args)));
    }
    async executeBytecodeAsync(bytecode, options = {}, ...args) {
      const [abort, cleanup] = prepareAbort(options);
      const { signal: _signal, ...executeOptions } = options;
      const encodedOptions = {
        ...executeOptions,
        environment: options.environment ? this.encode(options.environment) : undefined
      };
      try {
        return this.decodeArray(await this.#state.executeBytecodeAsync(bytecode, encodedOptions, this.encodeArray(args), abort));
      } finally {
        cleanup();
      }
    }
    compile(source, options = {}) {
      return this.#state.compile(sourceText(source), this.encodeCompilerOptions(options));
    }
    dump(source, options = {}) {
      return utf8Decoder$1.decode(this.#state.dump(sourceText(source), this.encodeCompilerOptions(options), options));
    }
    setCompiler(options) {
      this.#state.setCompiler(this.encodeCompilerOptions(options));
    }
    sandbox(enabled = true) {
      this.#state.sandbox(enabled);
    }
    setMemoryLimit(bytes) {
      return this.#state.setMemoryLimit(wasmUsize(bytes, "memory limit"));
    }
    gcStop() {
      this.#state.gcStop();
    }
    gcRestart() {
      this.#state.gcRestart();
    }
    gcCollect() {
      this.#state.gcCollect();
    }
    gcStep() {
      return this.#state.gcStep();
    }
    traceback(message, level = 0) {
      return utf8Decoder$1.decode(this.#state.traceback(message, wasmUsize(level, "traceback level")));
    }
    setNamedRegistryValue(key, value) {
      this.#state.setNamedRegistryValue(key, this.encode(value));
    }
    namedRegistryValue(key) {
      return this.decode(this.#state.namedRegistryValue(key));
    }
    unsetNamedRegistryValue(key) {
      this.#state.unsetNamedRegistryValue(key);
    }
    setInterruptHooks(hooks) {
      const execution = hooks.execution ? this.#callbacks.bridge(hooks.execution) : undefined;
      const pattern = hooks.pattern ? this.#callbacks.bridge(hooks.pattern) : undefined;
      const garbageCollection = hooks.garbageCollection ? this.#callbacks.bridge(hooks.garbageCollection) : undefined;
      this.#state.setInterruptHooks({
        mode: hooks.mode,
        execution,
        pattern,
        garbageCollection
      });
    }
    removeInterruptHooks() {
      this.#state.removeInterruptHooks();
    }
    requestInterrupt() {
      this.#state.requestInterrupt();
    }
    setDebugHooks(hooks) {
      const step = hooks.step ? this.#callbacks.bridge(hooks.step) : undefined;
      const breakpoint = hooks.breakpoint ? this.#callbacks.bridge(hooks.breakpoint) : undefined;
      const interrupt = hooks.interrupt ? this.#callbacks.bridge(hooks.interrupt) : undefined;
      const protectedError = hooks.protectedError ? this.#callbacks.bridge(hooks.protectedError) : undefined;
      this.#state.setDebugHooks({
        singleStep: hooks.singleStep,
        step,
        breakpoint,
        interrupt,
        protectedError
      });
    }
    removeDebugHooks() {
      this.#state.removeDebugHooks();
    }
    encode(value, depth = 0, context = {
      tables: /* @__PURE__ */ new WeakMap,
      nextTableId: 1
    }) {
      if (depth > 64)
        throw new TypeError("value nesting is too deep");
      if (value === undefined || value === null)
        return null;
      const conversion = intoLuaNode(value);
      if (conversion)
        switch (conversion.kind) {
          case "buffer":
            return {
              [BUFFER_MARKER]: true,
              bytes: conversion.bytes
            };
          case "userdata":
            return {
              [USERDATA_MARKER]: true,
              value: this.storeUserdata(conversion.value),
              definition: this.bridgeUserdataDefinition({})
            };
          case "callback":
            return (conversion.args ? this.createFunction(conversion.callback, { args: conversion.args }) : this.createFunction(conversion.callback)).reference(this);
        }
      if (value instanceof LuaValue)
        return value.reference(this);
      if (value instanceof LuaVector)
        return {
          [VECTOR_MARKER$1]: true,
          x: value.x,
          y: value.y,
          z: value.z
        };
      if (typeof value === "string") {
        assertWellFormedString(value);
        return value;
      }
      if (typeof value === "boolean" || typeof value === "number" || typeof value === "bigint" || value instanceof Uint8Array)
        return value;
      if (typeof value === "function")
        return {
          [USERDATA_MARKER]: true,
          value: this.storeUserdata(value),
          definition: this.userdataBridge(value) ?? this.bridgeUserdataDefinition({})
        };
      if (isArray$1(value)) {
        const reference = context.tables.get(value);
        if (reference !== undefined)
          return {
            [TABLE_MARKER]: true,
            reference
          };
        const id = nextTableId(context);
        context.tables.set(value, id);
        return {
          [TABLE_MARKER]: true,
          id,
          array: value.map((item) => this.encode(item, depth + 1, context))
        };
      }
      if (typeof value === "object") {
        if (value instanceof Map) {
          const reference = context.tables.get(value);
          if (reference !== undefined)
            return {
              [TABLE_MARKER]: true,
              reference
            };
          const id = nextTableId(context);
          context.tables.set(value, id);
          return {
            [TABLE_MARKER]: true,
            id,
            entries: [...value].map(([key, item]) => [this.encode(key, depth + 1, context), this.encode(item, depth + 1, context)])
          };
        }
        const definition = this.userdataBridge(value);
        if (definition)
          return {
            [USERDATA_MARKER]: true,
            value: this.storeUserdata(value),
            definition
          };
        const reference = context.tables.get(value);
        if (reference !== undefined)
          return {
            [TABLE_MARKER]: true,
            reference
          };
        const id = nextTableId(context);
        context.tables.set(value, id);
        return {
          [TABLE_MARKER]: true,
          id,
          entries: Object.entries(value).map(([key, item]) => {
            assertWellFormedString(key);
            return [key, this.encode(item, depth + 1, context)];
          })
        };
      }
      throw new TypeError(`unsupported JavaScript value of type ${typeof value}`);
    }
    encodeArray(values) {
      const context = {
        tables: /* @__PURE__ */ new WeakMap,
        nextTableId: 1
      };
      return values.map((value) => this.encode(value, 0, context));
    }
    decode(value) {
      if (isRawReference(value)) {
        if (value[REF_STATE] !== this.#state.stateId)
          throw new Error("Lua value belongs to another state");
        return this.wrapReference(value[REF_ID], value[REF_TYPE]);
      }
      if (isRawVector(value))
        return new LuaVector(value.x, value.y, value.z);
      if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "bigint" || typeof value === "string" || value instanceof Uint8Array)
        return value;
      throw new Error("Lua returned a value that cannot cross into JavaScript");
    }
    decodeArray(values) {
      return values.map((value) => this.decode(value));
    }
    wrapReference(handle, type) {
      switch (type) {
        case "table":
          return new LuaTable(this, this.#state, type, handle, this.#registerFinalizers, VALUE_TOKEN);
        case "function":
          return new LuaFunction(this, this.#state, type, handle, this.#registerFinalizers, VALUE_TOKEN);
        case "thread":
          return new LuaThread(this, this.#state, type, handle, this.#registerFinalizers, VALUE_TOKEN);
        case "buffer":
          return new LuaBuffer(this, this.#state, type, handle, this.#registerFinalizers, VALUE_TOKEN);
        case "userdata":
          return new LuaUserdata(this, this.#state, type, handle, this.#registerFinalizers, VALUE_TOKEN);
        case "class":
          return new LuaClass(this, this.#state, type, handle, this.#registerFinalizers, VALUE_TOKEN);
        case "object":
          return new LuaObject(this, this.#state, type, handle, this.#registerFinalizers, VALUE_TOKEN);
        default:
          return new LuaValue(this, this.#state, type, handle, this.#registerFinalizers, VALUE_TOKEN);
      }
    }
    encodeCallbackResult(result) {
      const multiple = intoLuaMultipleValues(result);
      const values = result === undefined ? [] : multiple ? multiple : [result];
      return {
        [CALLBACK_RESULT_MARKER]: true,
        values: this.encodeArray(values)
      };
    }
    encodeCallbackReturn(result) {
      if (isPromiseLike(result))
        return Promise.resolve(result).then((value) => this.encodeCallbackResult(value));
      return this.encodeCallbackResult(result);
    }
    encodeCompilerOptions(options) {
      return {
        ...options,
        libraryConstants: options.libraryConstants ? Object.fromEntries(Object.entries(options.libraryConstants).map(([name, value]) => [name, this.encode(value)])) : undefined
      };
    }
    userdataBridge(value) {
      const prototype = Object.getPrototypeOf(value);
      if (prototype === null || prototype === Object.prototype)
        return;
      const constructor = prototype ? Reflect.get(prototype, "constructor") : undefined;
      if (typeof constructor === "function") {
        const bridge = this.#userdataBridges.get(constructor);
        if (bridge)
          return bridge;
      }
      const definition = typeof constructor === "function" ? this.userdataDefinition(constructor) : undefined;
      const bridge = this.bridgeUserdataDefinition(definition ?? {});
      if (definition && typeof constructor === "function")
        this.#userdataBridges.set(constructor, bridge);
      return bridge;
    }
    userdataDefinition(constructor) {
      let current = constructor;
      while (typeof current === "function" && current !== Function.prototype) {
        const definition = this.#userdataDefinitions.get(current);
        if (definition) {
          if (current !== constructor && Object.hasOwn(definition, "constructor")) {
            const { constructor: _constructor, ...inherited } = definition;
            return inherited;
          }
          return definition;
        }
        current = Object.getPrototypeOf(current);
      }
      return decoratedUserdataDefinition(constructor);
    }
    userdataProxyDefinition(userdataClass, definition) {
      const proxy = definition?.proxy ?? {};
      if (!definition || !Object.hasOwn(definition, "constructor"))
        return proxy;
      return {
        ...proxy,
        metamethods: {
          ...proxy.metamethods,
          __call: {
            args: definition.constructor,
            callback: (_class, ...args) => Reflect.construct(userdataClass, args)
          }
        }
      };
    }
    storeUserdata(value) {
      const token = Object.create(null);
      this.#userdataValues.set(token, value);
      return token;
    }
    [USERDATA_VALUE](token) {
      if (typeof token !== "object" || token === null)
        throw new Error("Lua returned an invalid userdata token");
      const value = this.#userdataValues.get(token);
      if (!value)
        throw new Error("Lua userdata value is unavailable");
      return value;
    }
    bridgeUserdataDefinition(definition) {
      assertUserdataSurface(definition);
      const owner = new WeakRef(this);
      return {
        fields: definition.fields ? Object.fromEntries(Object.entries(definition.fields).map(([name, field2]) => {
          const getter = field2.get ? this.#callbacks.bridge(field2.get) : undefined;
          const setter = field2.set ? this.#callbacks.bridge(field2.set) : undefined;
          return [name, {
            get: getter ? (token) => {
              const lua = liveLua(owner);
              return lua.encode(getter(lua[USERDATA_VALUE](token)));
            } : undefined,
            set: setter ? (token, fieldValue) => {
              const lua = liveLua(owner);
              const [value] = convertLuaArguments([lua.decode(fieldValue)], field2.type ? [field2.type] : undefined, `userdata field ${name}`);
              setter(lua[USERDATA_VALUE](token), value);
            } : undefined
          }];
        })) : undefined,
        methods: definition.methods ? Object.fromEntries(Object.entries(definition.methods).map(([name, method2]) => {
          const resolved = resolveUserdataMethod(method2);
          const callback = this.#callbacks.bridge(resolved.callback);
          return [name, (token, ...args) => {
            const lua = liveLua(owner);
            return lua.encodeCallbackReturn(callback(lua[USERDATA_VALUE](token), ...convertLuaArguments(args.map((argument) => lua.decode(argument)), resolved.args, `userdata method ${name} argument`)));
          }];
        })) : undefined,
        metamethods: definition.metamethods ? Object.fromEntries(Object.entries(definition.metamethods).map(([name, metamethod2]) => {
          if (!metamethod2)
            throw new TypeError(`userdata metamethod ${name} is undefined`);
          if (isBinaryUserdataMetamethod(name)) {
            const binaryMetamethod = metamethod2;
            let bridge = this.#binaryUserdataBridges.get(binaryMetamethod);
            if (!bridge) {
              const callback = this.#callbacks.bridge(binaryMetamethod);
              bridge = (token, other, ownerIsRight) => {
                const lua = liveLua(owner);
                const value = lua[USERDATA_VALUE](token);
                const [decoded] = convertLuaArguments([lua.decode(other)]);
                const operand = decoded instanceof LuaUserdata ? decoded.value : decoded;
                return lua.encodeCallbackResult(ownerIsRight ? callback(operand, value) : callback(value, operand));
              };
              this.#binaryUserdataBridges.set(binaryMetamethod, bridge);
            }
            return [name, bridge];
          }
          const resolved = name === "__call" ? resolveUserdataMethod(metamethod2) : { callback: metamethod2 };
          const callback = this.#callbacks.bridge(resolved.callback);
          return [name, (token, ...args) => {
            const lua = liveLua(owner);
            const result = callback(lua[USERDATA_VALUE](token), ...convertLuaArguments(args.map((argument) => lua.decode(argument)), resolved.args, `userdata metamethod ${name} argument`));
            return name === "__call" || name === "__namecall" ? lua.encodeCallbackReturn(result) : lua.encodeCallbackResult(result);
          }];
        })) : undefined
      };
    }
  };
  utf8$1 = new TextEncoder;
  strictUtf8 = new TextDecoder("utf-8", { fatal: true });
  WorkerInputError = class extends RangeError {
  };
  utf8 = new TextEncoder;
  JS_INTEROP = Symbol("JavaScript interop");
  isArray = Array.isArray;
  ordinaryHasInstance = Function.prototype[Symbol.hasInstance];
  apply = Reflect.apply;
  FORBIDDEN_GLOBALS = /* @__PURE__ */ new Set([
    "Function",
    "Promise",
    "Proxy",
    "Reflect",
    "WorkerGlobalScope",
    "DedicatedWorkerGlobalScope",
    "Bun",
    "Deno",
    "addEventListener",
    "close",
    "dispatchEvent",
    "eval",
    "frames",
    "global",
    "globalThis",
    "importScripts",
    "module",
    "onmessage",
    "onmessageerror",
    "opener",
    "parent",
    "postMessage",
    "process",
    "queueMicrotask",
    "removeEventListener",
    "require",
    "setInterval",
    "setTimeout",
    "self",
    "top",
    "window"
  ]);
  FORBIDDEN_PROPERTIES = /* @__PURE__ */ new Set([
    "__proto__",
    "__defineGetter__",
    "__defineSetter__",
    "__lookupGetter__",
    "__lookupSetter__",
    "addEventListener",
    "arguments",
    "callee",
    "catch",
    "caller",
    "close",
    "constructor",
    "dispatchEvent",
    "finally",
    "frames",
    "global",
    "importScripts",
    "onmessage",
    "onmessageerror",
    "opener",
    "parent",
    "postMessage",
    "prototype",
    "queueMicrotask",
    "removeEventListener",
    "setInterval",
    "setTimeout",
    "then",
    "top",
    "window"
  ]);
  OBJECT_META_OPERATIONS = /* @__PURE__ */ new Set([
    "assign",
    "create",
    "defineProperties",
    "defineProperty",
    "freeze",
    "getOwnPropertyDescriptor",
    "getOwnPropertyDescriptors",
    "getOwnPropertyNames",
    "getOwnPropertySymbols",
    "getPrototypeOf",
    "isExtensible",
    "isFrozen",
    "isSealed",
    "preventExtensions",
    "seal",
    "setPrototypeOf"
  ]);
  FUNCTION_META_OPERATIONS = /* @__PURE__ */ new Set([
    "apply",
    "bind",
    "call"
  ]);
  from_lua_exports = /* @__PURE__ */ __exportAll({
    array: () => array,
    bytes: () => bytes,
    map: () => map,
    object: () => object,
    option: () => option,
    record: () => record,
    rest: () => rest,
    tuple: () => tuple
  });
  bytes = descriptor$1({ kind: "bytes" });
  into_lua_exports = /* @__PURE__ */ __exportAll({
    buffer: () => buffer,
    callback: () => callback,
    multiple: () => multiple,
    userdata: () => userdata$1
  });
  utf8Decoder = new TextDecoder;
  luaWorkerFinalizer = new FinalizationRegistry(({ execution, compiler }) => {
    execution.terminate();
    compiler.terminate();
  });
  LuaWorker$1 = class extends EventTarget {
    executionClient;
    compilerClient;
    jsInterop;
    workerFactory;
    resolveModule;
    constructor(options = {}) {
      super();
      if (typeof options !== "object" || options === null)
        throw new TypeError("Lua worker options must be an object");
      const { jsInterop, resolveModule } = options;
      if (resolveModule !== undefined && typeof resolveModule !== "function")
        throw new TypeError("resolveModule must be a function");
      this.jsInterop = copyJsInterop(jsInterop);
      this.workerFactory = options.worker;
      this.resolveModule = resolveModule;
      this.executionClient = new WorkerClient(options.workerUrl, options.worker, "execution", resolveModule);
      this.compilerClient = new WorkerClient(options.workerUrl, options.worker, "compiler", undefined);
      luaWorkerFinalizer.register(this, {
        execution: this.executionClient,
        compiler: this.compilerClient
      }, this);
    }
    addEventListener(type, listener, options) {
      super.addEventListener(type, listener, options);
    }
    removeEventListener(type, listener, options) {
      super.removeEventListener(type, listener, options);
    }
    execute(source, options = {}) {
      if (typeof source !== "string")
        return Promise.reject(/* @__PURE__ */ new TypeError("Luau source must be a string"));
      if (typeof options !== "object" || options === null)
        return Promise.reject(/* @__PURE__ */ new TypeError("execution options must be an object"));
      const { signal, timing = false } = options;
      if (typeof timing !== "boolean")
        return Promise.reject(/* @__PURE__ */ new TypeError("timing must be a boolean"));
      let prepared;
      try {
        prepared = prepareExecutionRequest(source, options, this.jsInterop, this.resolveModule !== undefined);
      } catch (error) {
        if (!(error instanceof WorkerInputError))
          return Promise.reject(error);
        const result = {
          ok: false,
          error: {
            kind: "input",
            message: error.message
          },
          values: [],
          peakLuaMemoryBytes: 0,
          interruptCount: 0,
          outputTruncated: false
        };
        return Promise.resolve(timing ? {
          result,
          durationMs: 0
        } : result);
      }
      return this.executionClient.request(prepared, signal, this, dispatchOutput).then(({ result, durationMs }) => timing ? {
        result,
        durationMs
      } : result);
    }
    executeBytecode(bytecode, options = {}) {
      if (!(bytecode instanceof Uint8Array))
        return Promise.reject(/* @__PURE__ */ new TypeError("Luau bytecode must be a Uint8Array"));
      if (typeof options !== "object" || options === null)
        return Promise.reject(/* @__PURE__ */ new TypeError("execution options must be an object"));
      const { signal, timing = false } = options;
      if (typeof timing !== "boolean")
        return Promise.reject(/* @__PURE__ */ new TypeError("timing must be a boolean"));
      let prepared;
      try {
        prepared = prepareBytecodeExecutionRequest(bytecode, options, this.jsInterop, this.resolveModule !== undefined);
      } catch (error) {
        if (!(error instanceof WorkerInputError))
          return Promise.reject(error);
        const result = {
          ok: false,
          error: {
            kind: "input",
            message: error.message
          },
          values: [],
          peakLuaMemoryBytes: 0,
          interruptCount: 0,
          outputTruncated: false
        };
        return Promise.resolve(timing ? {
          result,
          durationMs: 0
        } : result);
      }
      return this.executionClient.request(prepared, signal, this, dispatchOutput).then(({ result, durationMs }) => timing ? {
        result,
        durationMs
      } : result);
    }
    compile(source, options = {}) {
      if (typeof source !== "string")
        return Promise.reject(/* @__PURE__ */ new TypeError("Luau source must be a string"));
      if (typeof options !== "object" || options === null)
        return Promise.reject(/* @__PURE__ */ new TypeError("compiler options must be an object"));
      const { signal, timing = false, ...compilerOptions } = options;
      if (typeof timing !== "boolean")
        return Promise.reject(/* @__PURE__ */ new TypeError("timing must be a boolean"));
      let prepared;
      try {
        prepared = prepareCompileRequest(source, compilerOptions, timing);
      } catch (error) {
        if (!(error instanceof WorkerInputError))
          return Promise.reject(error);
        const result = {
          ok: false,
          bytecode: /* @__PURE__ */ new Uint8Array,
          error: {
            kind: "input",
            message: error.message
          }
        };
        return Promise.resolve(timing ? {
          result,
          durationMs: 0
        } : result);
      }
      return this.compilerClient.request(prepared, signal, this).then(({ result, durationMs }) => timing ? {
        result,
        durationMs
      } : result);
    }
    dump(source, options = {}) {
      if (typeof source !== "string")
        return Promise.reject(/* @__PURE__ */ new TypeError("Luau source must be a string"));
      if (typeof options !== "object" || options === null)
        return Promise.reject(/* @__PURE__ */ new TypeError("dump options must be an object"));
      const { signal, timing = false } = options;
      if (typeof timing !== "boolean")
        return Promise.reject(/* @__PURE__ */ new TypeError("timing must be a boolean"));
      let prepared;
      try {
        prepared = prepareDumpRequest(source, options, timing);
      } catch (error) {
        if (!(error instanceof WorkerInputError))
          return Promise.reject(error);
        const result = {
          ok: false,
          text: "",
          textTruncated: false,
          error: {
            kind: "input",
            message: error.message
          }
        };
        return Promise.resolve(timing ? {
          result,
          durationMs: 0
        } : result);
      }
      return this.compilerClient.request(prepared, signal, this).then(({ result, durationMs }) => {
        const decoded = {
          ...result,
          text: utf8Decoder.decode(result.text)
        };
        return timing ? {
          result: decoded,
          durationMs
        } : decoded;
      });
    }
    terminate() {
      luaWorkerFinalizer.unregister(this);
      this.executionClient.terminate();
      this.compilerClient.terminate();
    }
    [Symbol.dispose]() {
      this.terminate();
    }
  };
  LuaWorker = class extends LuaWorker$1 {
    constructor(options = {}) {
      const worker = options.worker ?? (() => new NodeWorkerAdapter(options.workerUrl ?? new URL("./node-worker.js", import.meta.url)));
      super({
        ...options,
        worker
      });
    }
  };
});

// src/luau/wasm/engine.ts
import path from "path";
import fs from "fs";
var __dirname = "D:\\obf\\bun\\simple-javascript-obf\\src\\luau\\wasm";
var cachedEmscriptenModule = null;
var cachedLuauRs = null;
async function loadEmscriptenLuau() {
  if (cachedEmscriptenModule) {
    return cachedEmscriptenModule;
  }
  const distPath = path.resolve(__dirname, "dist", "luau.web.js");
  if (!fs.existsSync(distPath)) {
    return null;
  }
  try {
    let outputBuffer = [];
    const createModule = __require(distPath);
    const mod = typeof createModule === "function" ? await createModule({
      print: (text) => {
        outputBuffer.push(String(text));
      },
      printErr: (text) => {
        outputBuffer.push(String(text));
      }
    }) : createModule;
    const checkScript = mod.cwrap ? mod.cwrap("checkScript", "string", ["string"]) : mod._checkScript;
    const executeScript = mod.cwrap ? mod.cwrap("executeScript", "string", ["string"]) : mod._executeScript;
    const compileScript = mod.cwrap ? mod.cwrap("compileScript", "string", ["string"]) : mod._compileScript;
    const astScript = mod.cwrap ? mod.cwrap("astScript", "string", ["string"]) : mod._astScript;
    cachedEmscriptenModule = {
      checkScript(source) {
        return checkScript(source);
      },
      executeScript(source) {
        outputBuffer.length = 0;
        const err = executeScript(source);
        if (err) {
          const out = outputBuffer.length > 0 ? outputBuffer.join(`
`) + `
` : "";
          return out + err;
        }
        return outputBuffer.length > 0 ? outputBuffer.join(`
`) : "";
      },
      compileScript(source) {
        return compileScript ? compileScript(source) : null;
      },
      astScript(source) {
        return astScript ? astScript(source) : null;
      }
    };
    return cachedEmscriptenModule;
  } catch (err) {
    return null;
  }
}
async function loadLuauRsFallback() {
  if (cachedLuauRs) {
    return cachedLuauRs;
  }
  try {
    const pkg = await Promise.resolve().then(() => (init_node(), exports_node));
    cachedLuauRs = pkg;
    return pkg;
  } catch {
    return null;
  }
}
async function isWasmEngineAvailable() {
  const em = await loadEmscriptenLuau();
  if (em)
    return true;
  const rs = await loadLuauRsFallback();
  return rs !== null;
}
async function parseLuauAstWasm(source) {
  const em = await loadEmscriptenLuau();
  if (em && em.astScript) {
    const raw = em.astScript(source);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }
  }
  const rs = await loadLuauRsFallback();
  if (rs && rs.Lua) {
    try {
      const lua = await rs.Lua.create({ sandbox: true });
      const dump = lua.dump(source);
      return { ok: true, ast: { dump } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
  return { ok: false, error: "No WASM Luau engine loaded. Run scripts/wasm/build-luau-wasm.bat to build it." };
}
async function checkLuauWasm(source) {
  const em = await loadEmscriptenLuau();
  if (em) {
    const err = em.checkScript(source);
    return { ok: !err, error: err || undefined };
  }
  const rs = await loadLuauRsFallback();
  if (rs && rs.Lua) {
    try {
      const lua = await rs.Lua.create({ sandbox: true });
      lua.compile(source);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
  return { ok: false, error: "WASM engine unavailable" };
}
async function executeLuauWasm(source) {
  const em = await loadEmscriptenLuau();
  if (em) {
    const outputOrError = em.executeScript(source);
    if (outputOrError && (outputOrError.includes("error") || outputOrError.startsWith("stdin:"))) {
      return { ok: false, error: outputOrError };
    }
    return { ok: true, output: outputOrError || "Execution completed successfully" };
  }
  const rs = await loadLuauRsFallback();
  if (rs && rs.Lua) {
    try {
      const lua = await rs.Lua.create({ sandbox: true });
      const res = lua.execute(source);
      return { ok: true, output: JSON.stringify(res) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
  return { ok: false, error: "WASM engine unavailable" };
}
export {
  checkLuauWasm,
  executeLuauWasm,
  isWasmEngineAvailable,
  loadEmscriptenLuau,
  loadLuauRsFallback,
  parseLuauAstWasm
};
