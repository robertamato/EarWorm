/* ============================================================================
   EARWORM — Observability bus (obs.js)
   ----------------------------------------------------------------------------
   Standalone, dependency-free, IIFE-isolated. Loaded BEFORE app.js so its
   global error handlers are installed before any app code runs — this is the
   last-resort net for failures that would otherwise vanish silently.

   It must stay a separate, first-loaded script: if concatenated into app.js it
   could not install ahead of app.js's own top-level code. It touches no app
   state (S/D/queue/study), no control flow, and no existing try/catch. The
   only DOM it creates is one optional button inside the existing #debugModes
   panel.

   Always references window.console explicitly (never bare `console`) and wraps
   every handler so the observer itself can never throw.

   Surface: window.EW.obs (alias window.EW_OBS)
     .getErrors() .getEvents()  -> newest-first copies
     .logEvent(kind, data)      -> append to event ring
     .captureError(err, info)   -> manual error capture
     .dump(n) .clear() .size()
     .isDebug() .enable() .disable()
   ============================================================================ */
(function(){
  "use strict";
  var con = window.console;            // real console (explicit, never shadowed)
  var ERR_MAX = 50;                    // errors are rare + precious
  var EVT_MAX = 200;                   // events are high-frequency (answers, tts…)
  var errors = [];                     // oldest -> newest
  var events = [];                     // oldest -> newest
  var totalErrors = 0;                 // raw capture count (incl. coalesced)
  var baseTitle = (typeof document !== "undefined" && document.title) || "Earworm";

  function isDebug(){
    try{
      if(/[?&]earworm_debug=1/.test(window.location.search)) return true;
      return window.localStorage.getItem("earworm_debug") === "1";
    }catch(e){ return false; }
  }

  // Keep payloads bounded so one huge object can't blow up memory/serialization.
  function trunc(data){
    try{
      var s = JSON.stringify(data);
      if(s && s.length > 2000) return { _truncated:true, preview:s.slice(0,2000) };
      return data;
    }catch(e){ return { _unserializable:true, str:String(data) }; }
  }

  function push(ring, rec, max){
    ring.push(rec);
    if(ring.length > max) ring.shift();
  }

  function updateTitle(){
    try{ document.title = "⚠" + totalErrors + " · " + baseTitle; }catch(e){}
  }

  // ---- error capture ---------------------------------------------------------
  function record(rec){
    totalErrors++;
    // Coalesce a flood of identical consecutive errors into one record + count.
    var last = errors[errors.length-1];
    if(last && last.type===rec.type && last.message===rec.message
       && (last.info&&last.info.lineno) === (rec.info&&rec.info.lineno)){
      last.count = (last.count||1) + 1;
      last.ts = rec.ts;
    } else {
      rec.count = 1;
      push(errors, rec, ERR_MAX);
    }
    updateTitle();
    updateButton();
    if(isDebug()) con.error("[EW]", rec.type, rec.message, rec.info||"", rec.stack||"");
  }

  function captureError(err, info){
    try{
      var rec = { ts: Date.now(), type:"manual", message:"", stack:null, info: info||{} };
      if(err && err.message !== undefined){ rec.message = String(err.message); rec.stack = err.stack||null; }
      else { rec.message = String(err); }
      record(rec);
    }catch(e){ /* observer must never throw */ }
  }

  function onError(ev){
    try{
      var rec = { ts: Date.now(), type:"error", message:"", stack:null, info:{} };
      if(ev && ev.message !== undefined && (ev.error || ev.filename !== undefined)){
        // JS runtime error (ErrorEvent)
        rec.message = String(ev.message);
        rec.stack = (ev.error && ev.error.stack) || null;
        rec.info = { filename: ev.filename, lineno: ev.lineno, colno: ev.colno };
      } else if(ev && ev.target && ev.target !== window && (ev.target.src || ev.target.href || ev.target.tagName)){
        // Resource load failure (capture phase only; does not bubble)
        var t = ev.target;
        rec.type = "resource";
        rec.message = "Resource failed: " + (t.tagName||"?");
        rec.info = { tag: t.tagName, url: t.src || t.href || null };
      } else {
        rec.message = "Unknown error event";
      }
      record(rec);
    }catch(e){ /* swallow */ }
  }

  function onRejection(ev){
    try{
      var reason = ev && ev.reason;
      var rec = { ts: Date.now(), type:"unhandledrejection", message:"", stack:null, info:{} };
      if(reason && reason.message !== undefined){ rec.message = String(reason.message); rec.stack = reason.stack||null; }
      else { rec.message = "Unhandled rejection: " + (function(){ try{ return JSON.stringify(reason); }catch(_){ return String(reason); } })(); }
      record(rec);
    }catch(e){ /* swallow */ }
  }

  // ---- event log (the future telemetry spine) --------------------------------
  // Bus stamps {ts, kind}; caller payload goes under `data`. Convention for
  // answer-type events (not enforced): {item, modality, correct, latencyMs, course}.
  function logEvent(kind, data){
    try{ push(events, { ts: Date.now(), kind: String(kind), data: trunc(data) }, EVT_MAX); }catch(e){}
  }

  // ---- debug surface (button lives in the EXISTING #debugModes panel) --------
  function updateButton(){
    try{
      var btn = document.getElementById("ew-obs-btn");
      if(!btn) return;
      btn.textContent = "◉ ERR LOG (" + totalErrors + ")";
      btn.style.color = totalErrors>0 ? "hsl(0,70%,55%)" : "";
      btn.style.borderColor = totalErrors>0 ? "hsl(0,70%,55%)" : "";
    }catch(e){}
  }

  function ensureButton(){
    try{
      var panel = document.getElementById("debugModes");
      if(!panel || document.getElementById("ew-obs-btn")) return;
      var btn = document.createElement("button");
      btn.id = "ew-obs-btn";
      btn.className = "btn";
      btn.style.cssText = "font-size:8px;opacity:.6";
      btn.onclick = function(){
        var recs = getErrors();
        var lines = recs.slice(0,15).map(function(r){
          return "[" + r.type + (r.count>1?(" x"+r.count):"") + "] " + r.message
               + (r.info && r.info.lineno ? (" @"+r.info.lineno) : "");
        });
        dump(15);
        try{ window.alert(recs.length ? lines.join("\n") : "No errors captured."); }catch(e){}
      };
      panel.appendChild(btn);
      updateButton();
    }catch(e){}
  }

  function dump(n){
    try{
      var recs = getErrors().slice(0, n||totalErrors);
      con.log("[EW] %d errors (%d records). Newest first:", totalErrors, errors.length);
      recs.forEach(function(r){ con.log(r); });
    }catch(e){}
  }

  function getErrors(){ return errors.slice().reverse(); }
  function getEvents(){ return events.slice().reverse(); }

  // ---- install ---------------------------------------------------------------
  window.addEventListener("error", onError, true);           // capture phase → also resource errors
  window.addEventListener("unhandledrejection", onRejection);
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", ensureButton);
  } else { ensureButton(); }

  var EW = window.EW = window.EW || {};
  EW.obs = {
    getErrors: getErrors,
    getEvents: getEvents,
    logEvent: logEvent,
    captureError: captureError,
    dump: dump,
    size: function(){ return { errors: errors.length, events: events.length, totalErrors: totalErrors }; },
    clear: function(){ errors.length=0; events.length=0; totalErrors=0; updateTitle(); updateButton(); },
    isDebug: isDebug,
    enable: function(){ try{ window.localStorage.setItem("earworm_debug","1"); }catch(e){} },
    disable: function(){ try{ window.localStorage.removeItem("earworm_debug"); }catch(e){} }
  };
  window.EW_OBS = EW.obs;

  logEvent("obs:installed", { ts: Date.now(), debug: isDebug() });
})();
