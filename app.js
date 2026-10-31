const book=document.querySelector('#book'),progress=document.querySelector('#progress'),counter=document.querySelector('#counter');
const path=n=>`page-${String(n).padStart(2,'0')}.jpg`;
let current=0, busy=false;
const leaves=[];
for(let i=0;i<8;i++){
 const leaf=document.createElement('div');leaf.className='leaf';leaf.innerHTML=`<div class="face front"><img src="${path(i*2+1)}" alt="레시피 북 ${i*2+1}페이지" ${i>1?'loading="lazy"':''}></div><div class="face back"><img src="${path(i*2+2)}" alt="레시피 북 ${i*2+2}페이지" ${i>1?'loading="lazy"':''}></div>`;
 leaf.style.setProperty('--depth',`${(7-i)*1.8}px`);leaf.insertAdjacentHTML('beforeend','<div class=page-edge></div><div class=page-top></div>');leaf.addEventListener('click',e=>{if(performance.now()<suppressClickUntil)return;if(current===8){const bounds=leaf.getBoundingClientRect();if(e.clientX>=bounds.left+bounds.width/2){go(0);return;}}go(current+(i<current?-1:1))}); book.append(leaf);leaves.push(leaf);
}
function render(){book.classList.toggle('open',current>0&&current<8);book.style.translate=current===8?'calc(var(--pw)*.5)':current===0?'calc(var(--pw)*-.5)':'0';leaves.forEach((leaf,i)=>{leaf.classList.toggle('turned',i<current);leaf.style.zIndex=i<current?i+1:8-i;});document.querySelector('#prev').disabled=current===0;document.querySelector('#next').disabled=current===8;counter.textContent=current===0?'COVER / 16':current===8?'16 / 16':`${String(current*2).padStart(2,'0')} — ${String(current*2+1).padStart(2,'0')} / 16`;progress.value=current;document.querySelector('#hint').textContent=current===0?'표지를 클릭해 사건 파일을 열어보세요':current===8?'마지막 페이지 · 왼쪽 페이지를 누르면 돌아갑니다':'오른쪽은 다음 장, 왼쪽은 이전 장';}
function go(n){n=Math.max(0,Math.min(8,n));if(n===current||busy)return;busy=true;const old=current;current=n;render();const turning=leaves[n>old?n-1:old-1];if(turning)turning.style.zIndex=20;setTimeout(()=>{busy=false;render()},1050);}
document.querySelector('#prev').onclick=()=>go(current-1);document.querySelector('#next').onclick=()=>go(current+1);document.querySelector('#cover').onclick=()=>go(0);progress.oninput=e=>go(+e.target.value);
const gallery=document.querySelector('#gallery'),lightbox=document.querySelector('#lightbox');document.querySelector('#indexButton').onclick=()=>gallery.showModal();document.querySelector('#closeGallery').onclick=()=>gallery.close();
for(let n=1;n<=16;n++){const btn=document.createElement('button');btn.innerHTML=`<img src="${path(n)}" alt="${n}페이지 미리보기" loading="lazy"><span>${String(n).padStart(2,'0')} ${n===1?'— 표지':n===16?'— 마지막 페이지':''}</span>`;btn.onclick=()=>{gallery.close();go(n===1?0:Math.floor(n/2));};document.querySelector('#thumbnails').append(btn);}
document.querySelector('#zoom').onclick=()=>{const pages=current===0?[1]:current===8?[16]:[current*2,current*2+1];document.querySelector('#zoomTitle').textContent=`페이지 ${pages.join(' · ')} / 16`;const area=document.querySelector('#zoomImages');area.className='';area.innerHTML=pages.map(n=>`<img src="${path(n)}" alt="${n}페이지 원본 확대">`).join('');area.onclick=()=>area.classList.toggle('enlarged');lightbox.showModal();};document.querySelector('#closeZoom').onclick=()=>lightbox.close();
for(const d of [gallery,lightbox])d.addEventListener('click',e=>{if(e.target===d)d.close()});
document.addEventListener('keydown',e=>{if(gallery.open||lightbox.open||!document.querySelector('#networkView').hidden||!document.querySelector('#posterView').hidden||document.body.classList.contains('in-folder'))return;if(e.key==='ArrowRight'){e.preventDefault();go(current+1)}if(e.key==='ArrowLeft'){e.preventDefault();go(current-1)}if(e.key==='Home')go(0);if(e.key==='End')go(8)});
document.querySelector('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{document.querySelector('#zoom').click()}};render();

// Drag or scroll to orbit; settle back to the front after inactivity.
let suppressClickUntil=0,orbitX=0,orbitY=0,drag=null,idleTimer;
const stage=document.querySelector('.workspace');
function orient(){book.style.setProperty('--orbit-x',orbitX+'deg');book.style.setProperty('--orbit-y',orbitY+'deg')}
function stopReturn(){clearTimeout(idleTimer);book.classList.remove('returning')}
function returnToFront(){if(drag)return;book.classList.add('returning');orbitX=0;orbitY=0;orient()}
function scheduleReturn(){clearTimeout(idleTimer);idleTimer=setTimeout(returnToFront,1800)}
stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;stopReturn();drag={id:e.pointerId,x:e.clientX,y:e.clientY,rx:orbitX,ry:orbitY,moved:false};});
stage.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>7){drag.moved=true;stage.setPointerCapture(e.pointerId);stage.classList.add('rotating')}if(!drag.moved)return;orbitY=Math.max(-78,Math.min(78,drag.ry+dx*.28));orbitX=Math.max(-35,Math.min(40,drag.rx-dy*.2));orient();});
function finishOrbit(e){if(!drag||e.pointerId!==drag.id)return;if(drag.moved)suppressClickUntil=performance.now()+400;drag=null;stage.classList.remove('rotating');if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);scheduleReturn()}
stage.addEventListener('pointerup',finishOrbit);stage.addEventListener('pointercancel',finishOrbit);
stage.addEventListener('wheel',e=>{if(e.ctrlKey||drag)return;e.preventDefault();stopReturn();const unit=e.deltaMode===1?16:e.deltaMode===2?window.innerHeight:1;const dx=Math.max(-100,Math.min(100,e.deltaX*unit)),dy=Math.max(-100,Math.min(100,e.deltaY*unit));orbitY=Math.max(-78,Math.min(78,orbitY+(Math.abs(dx)>.5?dx:dy)*.18));if(Math.abs(dx)>.5)orbitX=Math.max(-35,Math.min(40,orbitX-dy*.12));orient();scheduleReturn()},{passive:false});
window.addEventListener('blur',()=>{if(drag){suppressClickUntil=performance.now()+400;drag=null;stage.classList.remove('rotating')}scheduleReturn()});orient();

const folderView=document.querySelector('#folderView');
document.querySelector('#openRecipe').addEventListener('click',()=>{
 if(folderView.classList.contains('opening'))return;
 folderView.classList.add('opening');
 setTimeout(()=>{document.body.classList.remove('in-folder');folderView.classList.remove('opening');current=0;busy=false;render();orbitX=0;orbitY=0;orient();book.setAttribute('tabindex','0');book.focus({preventScroll:true})},650);
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!gallery.open&&!lightbox.open){document.body.classList.add('in-folder');document.querySelector('#openRecipe').focus()}});
// A background tap returns the book to its kraft wallet; drags stay in the reader.
function showFolder(){
 clearTimeout(idleTimer);
 document.body.classList.add('in-folder');
 document.querySelector('#openRecipe').focus({preventScroll:true});
}
stage.addEventListener('click',e=>{
 if(document.body.classList.contains('in-folder')||performance.now()<suppressClickUntil)return;
 if(e.target.closest('.leaf'))return;
 showFolder();
});

const posterView=document.querySelector('#posterView'),posterOrbit=document.querySelector('#posterOrbit'),posterSheet=document.querySelector('#flipPoster');
let posterSide=1,posterX=0,posterY=0,posterDrag=null,posterIgnoreUntil=0,posterTimer,posterBusy=false;
function orientPoster(){posterOrbit.style.setProperty('--px',posterX+'deg');posterOrbit.style.setProperty('--py',posterY+'deg')}
function stopPosterReturn(){clearTimeout(posterTimer);posterOrbit.classList.remove('returning')}
function settlePoster(){clearTimeout(posterTimer);posterTimer=setTimeout(()=>{if(posterDrag)return;posterOrbit.classList.add('returning');posterX=0;posterY=0;orientPoster()},1800)}
let activePaper='poster';
function openPaper(kind){activePaper=kind;const isPamphlet=kind==='pamphlet';const isVerdict=kind==='verdict';posterView.classList.toggle('is-verdict',isVerdict);posterView.classList.toggle('is-pamphlet',isPamphlet);posterSheet.setAttribute('aria-label',isVerdict?'판결문 뒤집기':isPamphlet?'팸플릿 뒤집기':'포스터 뒤집기');posterView.setAttribute('aria-label',isPamphlet?'양면 팸플릿':'A4 WANTED 포스터');const imgs=posterSheet.querySelectorAll('img');imgs[0].src=isPamphlet?'pamphlet-1.jpg':'wanted-1.jpg';imgs[1].src=isPamphlet?'pamphlet-2.jpg':'wanted-2.jpg';imgs[0].alt=isPamphlet?'팸플릿 한국어 면':'WANTED 포스터 앞면';imgs[1].alt=isPamphlet?'팸플릿 영어 면':'WANTED 포스터 뒷면';if(isVerdict){imgs[0].src='verdict-1.png';imgs[1].src='verdict-2.png';imgs[0].alt='판결문 영어 면';imgs[1].alt='판결문 한국어 면';posterView.setAttribute('aria-label','A6 판결문')}posterSide=1;posterBusy=false;posterSheet.classList.remove('flipped');posterSheet.setAttribute('aria-pressed','false');posterX=0;posterY=0;orientPoster();posterView.hidden=false;posterSheet.focus()}
document.querySelector('#openPoster').onclick=()=>openPaper('poster');
document.querySelector('#openPamphlet').onclick=()=>openPaper('pamphlet');
document.querySelector('#openVerdict').onclick=()=>openPaper('verdict');
posterSheet.onclick=()=>{if(performance.now()<posterIgnoreUntil||posterBusy)return;posterBusy=true;posterSide=posterSide===1?2:1;posterSheet.classList.toggle('flipped',posterSide===2);posterSheet.setAttribute('aria-pressed',String(posterSide===2));setTimeout(()=>posterBusy=false,1000)};
function closePoster(){clearTimeout(posterTimer);posterDrag=null;posterView.classList.remove('rotating');posterView.hidden=true;document.querySelector(activePaper==='verdict'?'#openVerdict':activePaper==='pamphlet'?'#openPamphlet':'#openPoster').focus({preventScroll:true})}
posterView.addEventListener('pointerdown',e=>{if(e.button!==0)return;stopPosterReturn();posterDrag={id:e.pointerId,x:e.clientX,y:e.clientY,rx:posterX,ry:posterY,moved:false}});
posterView.addEventListener('pointermove',e=>{if(!posterDrag||posterDrag.id!==e.pointerId)return;const dx=e.clientX-posterDrag.x,dy=e.clientY-posterDrag.y;if(Math.hypot(dx,dy)>7){posterDrag.moved=true;posterView.setPointerCapture(e.pointerId);posterView.classList.add('rotating')}if(!posterDrag.moved)return;posterX=Math.max(-40,Math.min(40,posterDrag.rx-dy*.2));posterY=Math.max(-78,Math.min(78,posterDrag.ry+dx*.28));orientPoster()});
function finishPosterDrag(e){if(!posterDrag||e.pointerId!==posterDrag.id)return;if(posterDrag.moved)posterIgnoreUntil=performance.now()+400;posterDrag=null;posterView.classList.remove('rotating');if(posterView.hasPointerCapture(e.pointerId))posterView.releasePointerCapture(e.pointerId);settlePoster()}
posterView.addEventListener('pointerup',finishPosterDrag);posterView.addEventListener('pointercancel',finishPosterDrag);
posterView.addEventListener('wheel',e=>{if(e.ctrlKey||posterDrag)return;e.preventDefault();stopPosterReturn();const unit=e.deltaMode===1?16:e.deltaMode===2?window.innerHeight:1;const dx=Math.max(-100,Math.min(100,e.deltaX*unit)),dy=Math.max(-100,Math.min(100,e.deltaY*unit));posterY=Math.max(-78,Math.min(78,posterY+(Math.abs(dx)>.5?dx:dy)*.18));if(Math.abs(dx)>.5)posterX=Math.max(-40,Math.min(40,posterX-dy*.12));orientPoster();settlePoster()},{passive:false});
posterView.onclick=e=>{if(performance.now()<posterIgnoreUntil||e.target.closest('#flipPoster'))return;closePoster()};
document.addEventListener('keydown',e=>{if(posterView.hidden)return;if(e.key==='Escape')closePoster();if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();posterSheet.click()}});

const folderLeft=document.querySelector('.folder-left'),kraftFolder=document.querySelector('.kraft-folder');
for(const item of kraftFolder.querySelectorAll('.folder-right button'))item.tabIndex=kraftFolder.classList.contains('closed')?-1:0;
function toggleFolder(){const closed=kraftFolder.classList.toggle('closed');folderLeft.setAttribute('aria-expanded',String(!closed));folderLeft.setAttribute('aria-label',closed?'크라프트 파일 열기':'크라프트 파일 닫기');for(const item of kraftFolder.querySelectorAll('.folder-right button'))item.tabIndex=closed?-1:0}
folderLeft.addEventListener('click',e=>{if(kraftFolder.classList.contains('closed')){toggleFolder();return}if(e.target.closest('#openNetwork'))return;toggleFolder()});
folderLeft.addEventListener('keydown',e=>{if(e.target===folderLeft&&(e.key==='Enter'||e.key===' ')){e.preventDefault();toggleFolder()}});
// Evidence images extracted from the supplied artwork, linked by threads in 3D.
const networkView=document.querySelector('#networkView'),networkWorld=document.querySelector('#networkWorld'),networkCamera=document.querySelector('#networkCamera');
const evidencePositions=[[160,90,-100,-7],[540,70,70,5],[1080,70,-30,-4],[1420,160,100,7],[100,530,20,4],[440,810,120,-5],[940,820,-40,4],[1390,710,20,-8],[680,300,-180,6],[1070,440,160,-4]];
for(let i=0;i<evidencePositions.length;i++){const [x,y,z,r]=evidencePositions[i];const tile=document.createElement('div');tile.className='evidence-card';tile.dataset.number=`EVIDENCE / ${String(i+1).padStart(2,'0')}`;tile.style.transform=`translate3d(${x}px,${y}px,${z}px) rotateZ(${r}deg)`;tile.innerHTML=`<img src="photo-${i}.jpg" alt="공범 관계도 원본 증거 사진 ${i+1}" draggable="false">`;networkWorld.append(tile)}
const connections=[[0,1],[1,2],[2,3],[0,4],[4,5],[5,6],[6,7],[7,3],[1,5],[4,9],[9,2],[9,6],[8,0],[8,7],[4,2],[5,9]];
// All red threads live behind the rearmost photograph.
// Project their anchors onto that rear plane so the ends still meet the cards as the view moves.
const threadDepth=Math.min(...evidencePositions.map(position=>position[2]))-120;
const networkThreads=connections.map(()=>{const thread=document.createElement('div');thread.className='red-thread';networkWorld.prepend(thread);return thread});
function positionNetworkThreads(scale){
 const yaw=netYaw*Math.PI/180,tilt=netTilt*Math.PI/180;
 const vx=-netPanX/scale,vy=-netPanY/scale,vz=1500;
 const ry=Math.cos(tilt)*vy+Math.sin(tilt)*vz,rz=-Math.sin(tilt)*vy+Math.cos(tilt)*vz;
 const camera=[900+Math.cos(yaw)*vx-Math.sin(yaw)*rz,600+ry,Math.sin(yaw)*vx+Math.cos(yaw)*rz];
 function behindCard(index){
  const [x,y,z]=evidencePositions[index],t=(threadDepth-camera[2])/(z-camera[2]);
  return [camera[0]+t*(x+120-camera[0]),camera[1]+t*(y+132.5-camera[1])];
 }
 connections.forEach(([a,b],index)=>{const A=behindCard(a),B=behindCard(b),dx=B[0]-A[0],dy=B[1]-A[1],thread=networkThreads[index];thread.style.width=Math.hypot(dx,dy)+'px';thread.style.transform=`translate3d(${A[0]}px,${A[1]-1.2}px,${threadDepth}px) rotateZ(${Math.atan2(dy,dx)}rad)`});
}
networkWorld.insertAdjacentHTML('beforeend','<div class="network-title">ACCOMPLICE NETWORK<small>GUILTY UNTIL DELICIOUS</small></div>');
let netPanX=0,netPanY=0,netYaw=-8,netTilt=5,netZoom=1,netDrag=null,netIgnoreUntil=0;
function renderNetwork(){const fit=Math.min(window.innerWidth/1800,window.innerHeight/1200)*.9;networkCamera.style.transform=`translate(${netPanX}px,${netPanY}px) scale(${fit*netZoom})`;networkWorld.style.transform=`rotateX(${netTilt}deg) rotateY(${netYaw}deg)`;positionNetworkThreads(fit*netZoom)}
document.querySelector('#openNetwork').addEventListener('click',e=>{e.stopPropagation();if(kraftFolder.classList.contains('closed')){toggleFolder();return}networkView.hidden=false;netPanX=netPanY=0;netYaw=-8;netTilt=5;netZoom=1;renderNetwork();networkView.tabIndex=-1;networkView.focus()});
function closeNetwork(){networkView.hidden=true;netDrag=null;networkView.classList.remove('dragging');document.querySelector('#openNetwork').focus({preventScroll:true})}
networkView.addEventListener('pointerdown',e=>{if(e.button!==0)return;netDrag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:netYaw,tilt:netTilt,px:netPanX,py:netPanY,pan:e.shiftKey,moved:false}});
networkView.addEventListener('pointermove',e=>{if(!netDrag||e.pointerId!==netDrag.id)return;const dx=e.clientX-netDrag.x,dy=e.clientY-netDrag.y;if(Math.hypot(dx,dy)>6){netDrag.moved=true;networkView.setPointerCapture(e.pointerId);networkView.classList.add('dragging')}if(!netDrag.moved)return;if(netDrag.pan){netPanX=netDrag.px+dx;netPanY=netDrag.py+dy}else{netYaw=Math.max(-55,Math.min(55,netDrag.yaw+dx*.15));netTilt=Math.max(-40,Math.min(40,netDrag.tilt-dy*.12))}renderNetwork()});
function finishNetwork(e){if(!netDrag||netDrag.id!==e.pointerId)return;if(netDrag.moved)netIgnoreUntil=performance.now()+400;netDrag=null;networkView.classList.remove('dragging');if(networkView.hasPointerCapture(e.pointerId))networkView.releasePointerCapture(e.pointerId)}
networkView.addEventListener('pointerup',finishNetwork);networkView.addEventListener('pointercancel',finishNetwork);
networkView.addEventListener('wheel',e=>{e.preventDefault();const unit=e.deltaMode===1?16:e.deltaMode===2?window.innerHeight:1;if(e.ctrlKey||e.metaKey){netZoom=Math.max(.4,Math.min(3,netZoom*Math.exp(-e.deltaY*.008)))}else{netPanX=Math.max(-2000,Math.min(2000,netPanX-e.deltaX*unit));netPanY=Math.max(-1500,Math.min(1500,netPanY-e.deltaY*unit))}renderNetwork()},{passive:false});
networkView.addEventListener('click',e=>{if(performance.now()<netIgnoreUntil||e.target.closest('.evidence-card'))return;if(e.target===networkView)closeNetwork()});
window.addEventListener('resize',()=>{if(!networkView.hidden)renderNetwork()});
document.addEventListener('keydown',e=>{if(networkView.hidden)return;if(e.key==='Escape')closeNetwork();if(e.key==='0'){netPanX=netPanY=0;netYaw=-8;netTilt=5;netZoom=1;renderNetwork()}});
