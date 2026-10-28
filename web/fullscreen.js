export function mountFullscreen(doc,button){
 const sync=()=>{const active=!!doc.fullscreenElement;button.textContent=active?'Exit full screen':'Full screen';button.setAttribute('aria-pressed',String(active));};
 button.addEventListener('click',async()=>{
  try{
   if(doc.fullscreenElement)await doc.exitFullscreen();
   else if(doc.documentElement.requestFullscreen)await doc.documentElement.requestFullscreen();
   else throw new Error('Fullscreen is unavailable');
  }catch{
   // Embedded browsers may disallow fullscreen; keep the standalone game one click away.
   const link=doc.getElementById('fullscreen-fallback');
   link.hidden=false;link.href=doc.defaultView.location.href;
   link.textContent='Open game in its own tab for more space';
  }
  sync();
 });
 doc.addEventListener('fullscreenchange',sync);sync();
}
