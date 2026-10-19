/**
 * Holds a form submitted before the page's script has loaded, then submits
 * it once the page is ready (backlog Mobile, dry run 2026-10-18).
 *
 * Every form built on `useKeptForm` submits from `onSubmit`, which does not
 * exist until React hydrates. A tap in that window used the browser's own
 * default: a plain GET to the same page with the typed fields in the address
 * bar, nothing saved and no message. This runs inline, ahead of everything
 * else, and fails safe: the early submit is held, not lost, and replayed
 * through `requestSubmit` (so the real handler runs) as soon as
 * `HydrationMark` says the page is ready.
 *
 * Only forms that would take the plain-GET path are held: no `action`
 * attribute and a GET method. Server-action forms (POST) and forms with a
 * real action URL pass straight through.
 */
export const EARLY_SUBMIT_GUARD = `(function(){
var held=null;
window.__formsReady=false;
document.addEventListener('submit',function(e){
if(window.__formsReady)return;
var f=e.target;
if(!f||f.getAttribute('action')||String(f.method).toLowerCase()!=='get')return;
e.preventDefault();
e.stopImmediatePropagation();
held={form:f,submitter:e.submitter||undefined};
f.setAttribute('aria-busy','true');
},true);
window.__releaseHeldForm=function(){
window.__formsReady=true;
var h=held;held=null;
if(!h)return;
h.form.removeAttribute('aria-busy');
if(h.form.isConnected)h.form.requestSubmit(h.submitter);
};
})();`;
