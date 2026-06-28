/* ===== WHITE HANDS ACADEMY ===== */

let lang = 'ar';
let curTab = '';
let ambientAudio = null;

/* ===== Firebase Configuration ===== */
/* ًں”¥ IMPORTANT: Create a Firebase project at https://console.firebase.google.com
   1. Go to Project Settings > General > Your apps > Add app > Web
   2. Copy the config values below
   3. Enable Authentication > Sign-in method > Email/Password
   4. Create Firestore Database (start in test mode, then apply rules below)
   âڑ ï¸ڈ Without this, auth works in read-only offline mode */
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
let firebaseReady = false;
function initFirebase(){
  if(typeof firebase==='undefined'||FIREBASE_CONFIG.apiKey==='YOUR_API_KEY') return;
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    firebase.auth().onAuthStateChanged(async (user) => {
      if(user){
        let u = await getUserFromFirestore(user.uid);
        if(u) saveCurUser(u);
        updateHeaderUser();
        let ct = document.getElementById('root')?.innerHTML ? curTab : '';
        if(ct) rT(ct);
      } else {
        curUser = null;
        updateHeaderUser();
      }
    });
    firebaseReady = true;
    console.log('ًں”¥ Firebase ready');
  } catch(e){ console.warn('Firebase init failed:', e); }
}

/* ===== Loading Screen ===== */
function initLoading(){
  const fill=document.getElementById('loaderFill');
  if(fill){fill.style.animation='loaderFill 1.8s ease-in-out forwards'}
  requestAnimationFrame(()=>{
    const ls=document.getElementById('loading-screen');
    if(ls){ls.classList.add('ls-hide');setTimeout(()=>{ls.style.display='none'},600)}
  });
}

/* ===== Canvas Steam Particles ===== */
function initParticles(){
  const c=document.getElementById('steam-canvas');
  if(!c) return;
  const ctx=c.getContext('2d');
  let W,H,particles=[];
  function resize(){W=c.width=window.innerWidth;H=c.height=window.innerHeight}
  window.addEventListener('resize',resize);resize();
  const colors=['rgba(212,168,90,','rgba(201,168,76,','rgba(240,208,128,'];
  class Particle{
    constructor(){this.reset();this.y=Math.random()*H}
    reset(){
      this.x=Math.random()*W;this.y=H+10;
      this.r=1+Math.random()*4;
      this.speed=.2+Math.random()*.7;
      this.drift=(Math.random()-.5)*.4;
      this.color=colors[Math.floor(Math.random()*colors.length)];
      this.alpha=.015+Math.random()*.06;
      this.wobble=Math.random()*Math.PI*2;
      this.wobbleSpeed=.008+Math.random()*.015;
    }
    update(){
      this.wobble+=this.wobbleSpeed;
      this.y-=this.speed;this.x+=Math.sin(this.wobble)*.3+this.drift;
      if(this.y<-10) this.reset();
    }
    draw(){
      ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fillStyle=this.color+this.alpha+')';ctx.fill();
      ctx.beginPath();ctx.arc(this.x,this.y,this.r*3,0,Math.PI*2);
      ctx.fillStyle=this.color+(this.alpha*.3)+')';ctx.fill();
    }
  }
  const pCount=Math.min(50,Math.floor(W*H/18000));
  for(let i=0;i<pCount;i++) particles.push(new Particle());
  function animate(){
    ctx.clearRect(0,0,W,H);
    particles.forEach(p=>{p.update();p.draw()});
    requestAnimationFrame(animate);
  }
  animate();
}

/* ===== Smooth Scroll Lenis ===== */
function initSmoothScroll(){
  document.documentElement.style.scrollBehavior='smooth';
  const s=document.createElement('script');
  s.src='https://unpkg.com/lenis@1.1.13/dist/lenis.min.js';
  s.onload=()=>{
    if(typeof Lenis!=='undefined'){
      window.lenis=new Lenis({duration:1.2,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),orientation:'vertical',smoothWheel:true});
      function raf(t){window.lenis.raf(t);requestAnimationFrame(raf)}
      requestAnimationFrame(raf);
    }
  };
  s.onerror=()=>{};
  document.head.appendChild(s);
}

/* ===== 3D Tilt Effect ===== */
function initTilt(){
  document.querySelectorAll('.tilt-card').forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect();
      const x=e.clientX-r.left,y=e.clientY-r.top;
      const cx=r.width/2,cy=r.height/2;
      const rotX=-(y-cy)/12,rotY=(x-cx)/12;
      card.style.transform='perspective(1000px) rotateX('+rotX+'deg) rotateY('+rotY+'deg)';
      const glare=card.querySelector('.tilt-glare');
      if(glare){
        const pctX=(x/r.width)*100,pctY=(y/r.height)*100;
        glare.style.background='radial-gradient(circle at '+pctX+'% '+pctY+'%, rgba(255,255,255,.1) 0%, transparent 60%)';
        glare.style.opacity='1';
      }
    });
    card.addEventListener('mouseleave',()=>{
      card.style.transform='perspective(1000px) rotateX(0deg) rotateY(0deg)';
      const glare=card.querySelector('.tilt-glare');
      if(glare) glare.style.opacity='0';
    });
  });
}

/* ===== Magnetic Hover ===== */
function initMagnetic(){
  document.querySelectorAll('.magnetic-btn').forEach(btn=>{
    btn.addEventListener('mousemove',e=>{
      const r=btn.getBoundingClientRect();
      const x=e.clientX-r.left-r.width/2;
      const y=e.clientY-r.top-r.height/2;
      btn.style.transform='translate('+(x*.3)+'px,'+(y*.3)+'px)';
    });
    btn.addEventListener('mouseleave',()=>{
      btn.style.transform='translate(0,0)';
    });
  });
}

/* ===== Init UI Effects ===== */
function initUI(){
  initTilt();
  initMagnetic();
  AI.init();
}

/* ===== Page Transition ===== */
function pageTransition(callback){
  const root=document.getElementById('root');
  if(!root) return;
  root.style.opacity='0';
  root.style.transform='translateY(12px)';
  root.style.transition='opacity .4s ease, transform .4s ease';
  setTimeout(()=>{
    if(callback) callback();
    requestAnimationFrame(()=>{
      root.style.opacity='1';
      root.style.transform='translateY(0)';
    });
  },350);
}

/* ===== Event Delegation for Navigation ===== */
document.addEventListener('click', function(e) {
  let card = e.target.closest('[data-nav]');
  if (!card) return;
  let a = card.dataset.nav;
  let lv = card.dataset.level;
  let mi = +card.dataset.mi;
  let li = +card.dataset.li;
  if (a === 'sModules') { sModules(lv); setTimeout(()=>{initTilt();initMagnetic()},100) }
  else if (a === 'sModule') { sModule(lv, mi, li); setTimeout(()=>{initTilt();initMagnetic()},100) }
  else if (a === 'continue') { completeLesson(lv, mi, li); setTimeout(()=>sModule(lv, mi, li+1), 50) }
  else if (a === 'finish') { completeLesson(lv, mi, li); setTimeout(()=>sModules(lv), 50) }
  else if (a === 'curriculum') rT('curriculum');
  else if (a === 'journey') rT('journey');
  else if (a === 'home') rT('home');
  else if (a === 'back') history.back();
});

/* ===== Ambient Audio Toggle ===== */
function toggleAmbient(){
  const btn=document.getElementById('ambientToggle');
  if(ambientAudio){
    ambientAudio.pause();
    ambientAudio=null;
    if(btn) btn.classList.remove('act');
    return;
  }
  ambientAudio=new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
  ambientAudio.loop=true;ambientAudio.volume=.15;
  ambientAudio.play().then(()=>{if(btn) btn.classList.add('act')}).catch(()=>{
    ambientAudio=null;
    if(btn) btn.classList.remove('act');
  });
}

/* ===== Central User & Gamification System ===== */
const XP_REWARDS = {lesson: 15, module: 50, examA: 100, examB: 200, examC: 300, streak: 5};
const XP_LEVELS = [
  {name:{ar:'ط¨ط°ط±ط© ظ‚ظ‡ظˆط©',en:'Coffee Seed'}, xp:0, ic:'ًں«ک'},
  {name:{ar:'ط¨ط±ط¹ظ… ظ‚ظ‡ظˆط©',en:'Coffee Sprout'}, xp:100, ic:'ًںŒ±'},
  {name:{ar:'ظƒط±ط²ط© ظ‚ظ‡ظˆط©',en:'Coffee Cherry'}, xp:250, ic:'ًںچ’'},
  {name:{ar:'ط¨ظ† ط£ط®ط¶ط±',en:'Green Bean'}, xp:500, ic:'ًںں¢'},
  {name:{ar:'ط¨ظ† ظ…ط­ظ…طµ',en:'Roasted Bean'}, xp:800, ic:'ًںں¤'},
  {name:{ar:'ط¨ط§ط±ظٹط³طھط§',en:'Barista'}, xp:1200, ic:'âک•'},
  {name:{ar:'ظ…ط§ط³طھط± ظ‚ظ‡ظˆط©',en:'Coffee Master'}, xp:1700, ic:'ًں‘‘'},
  {name:{ar:'ظ…ط¹طھظ…ط¯ SCA',en:'SCA Certified'}, xp:2300, ic:'ًںژ“'},
  {name:{ar:'ط£ط³ط·ظˆط±ط© ظ‚ظ‡ظˆط©',en:'Coffee Legend'}, xp:3000, ic:'ًںڈ†'}
];
const BADGE_DEFS = [
  {id:'first_lesson',ic:'ًںŒ±',name:{ar:'ط£ظˆظ„ ط¯ط±ط³',en:'First Lesson'},desc:{ar:'ط£ظƒظ…ظ„ ط£ظˆظ„ ط¯ط±ط³ ظ„ظƒ',en:'Complete your first lesson'}},
  {id:'streak_5',ic:'ًں”¥',name:{ar:'5 ط£ظٹط§ظ… ظ…طھطھط§ظ„ظٹط©',en:'5-Day Streak'},desc:{ar:'ط³ط¬ظ„ ط§ظ„ط¯ط®ظˆظ„ 5 ط£ظٹط§ظ… ظ…طھطھط§ظ„ظٹط©',en:'Login 5 days in a row'}},
  {id:'module_master',ic:'ًں“ڑ',name:{ar:'ط£ط³طھط§ط° ط§ظ„ظˆط­ط¯ط©',en:'Module Master'},desc:{ar:'ط£ظƒظ…ظ„ ظƒظ„ ط¯ط±ظˆط³ ظˆط­ط¯ط©',en:'Complete all lessons in a module'}},
  {id:'exam_perfect',ic:'ًں’¯',name:{ar:'ط¯ط±ط¬ط© ظƒط§ظ…ظ„ط©',en:'Perfect Score'},desc:{ar:'ط§ط­طµظ„ ط¹ظ„ظ‰ 10/10 ظپظٹ ط£ظٹ ط§ط®طھط¨ط§ط±',en:'Get 10/10 on any exam'}},
  {id:'level_a',ic:'ًںژ“',name:{ar:'ط®ط±ظٹط¬ ظ…ط³طھظˆظ‰ A',en:'Level A Graduate'},desc:{ar:'ط§ط¬طھط§ط² ط§ط®طھط¨ط§ط± ط§ظ„ظ…ط³طھظˆظ‰ A',en:'Pass Level A exam'}},
  {id:'level_b',ic:'ًںژ“',name:{ar:'ط®ط±ظٹط¬ ظ…ط³طھظˆظ‰ B',en:'Level B Graduate'},desc:{ar:'ط§ط¬طھط§ط² ط§ط®طھط¨ط§ط± ط§ظ„ظ…ط³طھظˆظ‰ B',en:'Pass Level B exam'}},
  {id:'level_c',ic:'ًںژ“',name:{ar:'ط®ط±ظٹط¬ ظ…ط³طھظˆظ‰ C',en:'Level C Graduate'},desc:{ar:'ط§ط¬طھط§ط² ط§ط®طھط¨ط§ط± ط§ظ„ظ…ط³طھظˆظ‰ C',en:'Pass Level C exam'}},
  {id:'speed_learner',ic:'âڑ،',name:{ar:'ظ…طھط³ط§ط¨ظ‚',en:'Speed Learner'},desc:{ar:'ط£ظƒظ…ظ„ 5 ط¯ط±ظˆط³ ظپظٹ ظٹظˆظ… ظˆط§ط­ط¯',en:'Complete 5 lessons in one day'}},
  {id:'all_rounder',ic:'ًںڈ†',name:{ar:'ط´ط§ظ…ظ„',en:'All-Rounder'},desc:{ar:'ط£ظƒظ…ظ„ ظƒظ„ ط¯ط±ظˆط³ ط§ظ„ط£ظƒط§ط¯ظٹظ…ظٹط©',en:'Complete all academy lessons'}},
  {id:'true_master',ic:'ًں‘‘',name:{ar:'ط§ظ„ظ…ط¹ظ„ظ… ط§ظ„ط­ظ‚ظٹظ‚ظٹ',en:'True Master'},desc:{ar:'ط§ط¬طھط§ط² ظƒظ„ ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ ط¨ظ€ 10/10',en:'Pass all exams with 10/10'}}
];

/* --- User Data Management (Firebase) --- */
let curUser = null;
let db = null;
function todayStr(){return new Date().toISOString().slice(0,10)}
function yesterday(){
  let d=new Date();d.setDate(d.getDate()-1);
  return d.toISOString().slice(0,10);
}
async function saveUserToFirestore(uid, data){
  if(!db) return;
  try { await db.collection('users').doc(uid).set(data, {merge:true}) } catch(e){console.error('Firestore write err',e)}
}
async function getUserFromFirestore(uid){
  if(!db||!uid) return null;
  try {
    let doc = await db.collection('users').doc(uid).get();
    return doc.exists ? {id:uid, ...doc.data()} : null;
  } catch(e){console.error('Firestore read err',e); return null}
}
async function getAllUsersFromFirestore(){
  if(!db) return [];
  try {
    let snap = await db.collection('users').get();
    let arr=[];
    snap.forEach(d=>{let d2=d.data(); if(d2.role!=='admin') arr.push({id:d.id,...d2})});
    return arr;
  } catch(e){console.error('Firestore get all err',e); return []}
}
async function getPendingUsersFromFirestore(){
  if(!db) return [];
  try {
    let snap = await db.collection('users').where('role','==','pending').get();
    let arr=[];
    snap.forEach(d=>arr.push({id:d.id,...d.data()}));
    return arr;
  } catch(e){console.error('Firestore get pending err',e); return []}
}
function getCurUser(){
  if(!curUser){
    try {
      let d = localStorage.getItem('wha_curUser');
      if(d) curUser = JSON.parse(d);
    } catch(e){}
  }
  return curUser
}
function saveCurUser(u){
  if(!u) return;
  curUser = u;
  try { localStorage.setItem('wha_curUser', JSON.stringify(u)) } catch(e){}
  if(db && u.id) saveUserToFirestore(u.id, u);
}
function isAdmin(){ return curUser && curUser.role==='admin' }
async function registerUser(name,email,pass){
  if(!name||!email||!pass) return {err:__({ar:'ط¬ظ…ظٹط¹ ط§ظ„ط­ظ‚ظˆظ„ ظ…ط·ظ„ظˆط¨ط©',en:'All fields required'})};
  // Offline mode (no Firebase)
  if(!firebaseReady){
    let users = JSON.parse(localStorage.getItem('wha_users')||'[]');
    if(users.find(u=>u.email===email.trim().toLowerCase())) return {err:__({ar:'ط§ظ„ط¨ط±ظٹط¯ ظ…ط³ط¬ظ„ ط¨ط§ظ„ظپط¹ظ„',en:'Email already registered'})};
    if(pass.length<3) return {err:__({ar:'ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ظ‚طµظٹط±ط© ط¬ط¯ط§ظ‹',en:'Password too short'})};
    let isFirst = users.length===0;
    let u = {
      id:'u_'+Date.now(), name:name.trim(), email:email.trim().toLowerCase(), role:isFirst?'admin':'active',
      xp:0, streak:0, lastLogin:'', levelIdx:0, completedLessons:[], completedModules:[],
      passedExams:[], badges:[], perfectScores:[], joinDate:todayStr(), lessonTimestamps:[]
    };
    saveCurUser(u);
    users.push(u);
    localStorage.setItem('wha_users', JSON.stringify(users));
    if(isFirst) return {ok:true, u, msg:__({ar:'ًںژ‰ طھظ… ط¥ظ†ط´ط§ط، ط­ط³ط§ط¨ ط§ظ„ظ…ط³ط¤ظˆظ„!',en:'ًںژ‰ Admin account created!'})};
    return {ok:true, u, msg:__({ar:'ًںژ‰ طھظ… ط§ظ„طھط³ط¬ظٹظ„ ط¨ظ†ط¬ط§ط­!',en:'ًںژ‰ Registered successfully!'})};
  }
  try {
    let cred = await firebase.auth().createUserWithEmailAndPassword(email.trim().toLowerCase(), pass);
    let uid = cred.user.uid;
    // Check if first user
    let all = await getAllUsersFromFirestore();
    let isFirst = all.length === 0;
    let userData = {
      name: name.trim(), email: email.trim().toLowerCase(),
      role: isFirst ? 'admin' : 'pending',
      xp:0, streak:0, lastLogin:'', levelIdx:0,
      completedLessons:[], completedModules:[], passedExams:[],
      badges:[], perfectScores:[], joinDate:todayStr(),
      lessonTimestamps:{}
    };
    await saveUserToFirestore(uid, userData);
    let newU = {id:uid, ...userData};
    if(isFirst){
      saveCurUser(newU);
      return {ok:true, u:newU, msg:__({ar:'ًںژ‰ طھظ… ط¥ظ†ط´ط§ط، ط­ط³ط§ط¨ ط§ظ„ظ…ط³ط¤ظˆظ„! ط£ظ†طھ ط£ظˆظ„ ظ…ط³طھط®ط¯ظ….',en:'ًںژ‰ Admin account created! You are the first user.'})};
    }
    await firebase.auth().signOut();
    curUser = null;
    return {ok:true, pending:true, msg:__({ar:'ًں“‹ طھظ… ط§ظ„طھط³ط¬ظٹظ„! ظپظٹ ط§ظ†طھط¸ط§ط± ظ…ظˆط§ظپظ‚ط© ط§ظ„ظ…ط´ط±ظپ.',en:'ًں“‹ Registered! Waiting for admin approval.'})};
  } catch(e){
    let msg = e.code === 'auth/email-already-in-use' ? __('@:ط§ظ„ط¨ط±ظٹط¯ ظ…ط³ط¬ظ„ ط¨ط§ظ„ظپط¹ظ„','Email already registered') :
              e.code === 'auth/weak-password' ? __('@:ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط¶ط¹ظٹظپط© (6 ط£ط­ط±ظپ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„)','Password too weak (6+ chars)') :
              __('@:ط®ط·ط£ ظپظٹ ط§ظ„طھط³ط¬ظٹظ„','Registration failed');
    return {err: msg};
  }
}
async function loginUser(email,pass){
  // Offline mode (no Firebase)
  if(!firebaseReady){
    if(!email||!pass) return {err:__({ar:'ط§ظ„ط¨ط±ظٹط¯ ظˆظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ظ…ط·ظ„ظˆط¨ط§ظ†',en:'Email and password required'})};
    let users = JSON.parse(localStorage.getItem('wha_users')||'[]');
    let u = users.find(x=>x.email===email.trim().toLowerCase());
    if(!u) return {err:__({ar:'ط§ظ„ط¨ط±ظٹط¯ ط؛ظٹط± ظ…ط³ط¬ظ„',en:'Email not found'})};
    if(u.role==='banned') return {err:__({ar:'ًںڑ« طھظ… ط­ط¸ط± ط­ط³ط§ط¨ظƒ.',en:'ًںڑ« Your account has been banned.'})};
    if(u.role==='pending') return {err:__({ar:'âڈ³ ط­ط³ط§ط¨ظƒ ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©.',en:'âڈ³ Account pending review.'})};
    saveCurUser(u);
    let today=todayStr(), addedXP=false;
    if(u.lastLogin!==today){
      if(u.lastLogin===yesterday()){ u.streak=(u.streak||0)+1; u.xp=(u.xp||0)+XP_REWARDS.streak; addedXP=true; }
      else u.streak=1;
      u.lastLogin=today;
      // Update in localStorage
      let all=JSON.parse(localStorage.getItem('wha_users')||'[]');
      let idx=all.findIndex(x=>x.id===u.id);
      if(idx>=0){all[idx]=u;localStorage.setItem('wha_users',JSON.stringify(all))}
      saveCurUser(u);
    }
    return {ok:true, u, streakBonus:addedXP};
  }
  try {
    let cred = await firebase.auth().signInWithEmailAndPassword(email.trim().toLowerCase(), pass);
    let u = await getUserFromFirestore(cred.user.uid);
    if(!u) return {err:__({ar:'ط®ط·ط£ ظپظٹ طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ',en:'Error loading profile'})};
    if(u.role==='banned'){ await firebase.auth().signOut(); curUser=null; return {err:__({ar:'ًںڑ« طھظ… ط­ط¸ط± ط­ط³ط§ط¨ظƒ.',en:'ًںڑ« Your account has been banned.'})}; }
    if(u.role==='pending'){ await firebase.auth().signOut(); curUser=null; return {err:__({ar:'âڈ³ ط­ط³ط§ط¨ظƒ ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©.',en:'âڈ³ Account pending review.'})}; }
    saveCurUser(u);
    let today=todayStr(), addedXP=false;
    if(u.lastLogin!==today){
      if(u.lastLogin===yesterday()){ u.streak=(u.streak||0)+1; u.xp=(u.xp||0)+XP_REWARDS.streak; addedXP=true; }
      else u.streak=1;
      u.lastLogin=today;
      await saveUserToFirestore(u.id, {streak:u.streak, xp:u.xp, lastLogin:today});
    }
    return {ok:true, u, streakBonus:addedXP};
  } catch(e){
    let msg = e.code === 'auth/user-not-found'||e.code==='auth/wrong-password'||e.code==='auth/invalid-credential' ?
              __('@:ط¨ط±ظٹط¯ ط£ظˆ ظƒظ„ظ…ط© ظ…ط±ظˆط± ط؛ظٹط± طµط­ظٹط­ط©','Invalid email or password') :
              __('@:ط®ط·ط£ ظپظٹ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„','Login failed');
    return {err: msg};
  }
}
async function logoutUser(){
  try { await firebase.auth().signOut() } catch(e){}
  if(!firebaseReady) localStorage.removeItem('wha_curUser');
  curUser = null;
}
async function approveUser(id){
  if(!db||!id) return false;
  try { await db.collection('users').doc(id).update({role:'active'}); return true } catch(e){return false}
}
async function rejectUser(id){
  if(!db||!id) return false;
  try { await db.collection('users').doc(id).delete(); return true } catch(e){return false}
}
async function banUser(id){
  if(!db||!id) return false;
  try { await db.collection('users').doc(id).update({role:'banned'}); return true } catch(e){return false}
}
async function unbanUser(id){
  if(!db||!id) return false;
  try { await db.collection('users').doc(id).update({role:'active'}); return true } catch(e){return false}
}

/* --- XP & Level --- */
function getUserLevel(u){
  let i=XP_LEVELS.length-1;
  while(i>0&&u.xp<XP_LEVELS[i].xp) i--;
  return i;
}
function addXP(u,amount){
  u.xp=(u.xp||0)+amount;
  let oldLvl=u.levelIdx||0, newLvl=getUserLevel(u);
  u.levelIdx=newLvl;
  return {leveledUp:newLvl>oldLvl,oldLvl,newLvl};
}
function xpToNext(u){
  let lvl=u.levelIdx||0;
  if(lvl>=XP_LEVELS.length-1) return 0;
  return XP_LEVELS[lvl+1].xp-u.xp;
}
function xpPct(u){
  let lvl=u.levelIdx||0;
  if(lvl>=XP_LEVELS.length-1) return 100;
  let cur=XP_LEVELS[lvl].xp, next=XP_LEVELS[lvl+1].xp;
  return Math.round((u.xp-cur)/(next-cur)*100);
}

/* --- Badges --- */
function hasBadge(u,id){return(u.badges||[]).includes(id)}
function awardBadge(u,id){
  if(hasBadge(u,id)) return false;
  u.badges=(u.badges||[]); u.badges.push(id);
  return true;
}
function checkModuleMaster(u,level,mi){
  let mods=CM.filter(x=>x.level===level);
  if(!mods[mi]) return false;
  let allDone=mods[mi].lessons.every((_,i)=>isLessonDone(u,level,mi,i));
  if(allDone) return awardBadge(u,'module_master');
  return false;
}
function isLessonDone(u,level,mi,li){
  let mods=CM.filter(x=>x.level===level);
  if(!mods[mi]||!mods[mi].lessons[li]) return false;
  let key=level+'-'+mi+'-'+li;
  return(u.completedLessons||[]).includes(key);
}

/* --- Auth UI --- */
let authErrTimer=null;
function showAuth(){
  let ov=document.createElement('div');ov.id='authOverlay';ov.className='auth-overlay';
  ov.innerHTML='<div class="auth-card glass-gold">'+
    '<div class="auth-tabs"><button class="auth-tab act" id="authTabLogin" onclick="showAuthForm(\'login\')">'+
    __({ar:'طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„',en:'Login'})+'</button><button class="auth-tab" id="authTabReg" onclick="showAuthForm(\'reg\')">'+
    __({ar:'ط¥ظ†ط´ط§ط، ط­ط³ط§ط¨',en:'Register'})+'</button></div>'+
    '<div id="authBody">'+
    '<div class="auth-ic floating">âک•</div>'+
    '<h2>'+__({ar:'ظ…ط±ط­ط¨ط§ظ‹ ط¨ظƒ ظپظٹ ط§ظ„ط£ظƒط§ط¯ظٹظ…ظٹط©',en:'Welcome to the Academy'})+'</h2>'+
    '<p class="auth-p">'+__({ar:'ط³ط¬ظ„ ط§ظ„ط¯ط®ظˆظ„ ظ„ظ…طھط§ط¨ط¹ط© طھظ‚ط¯ظ…ظƒ ط£ظˆ ط£ظ†ط´ط¦ ط­ط³ط§ط¨ط§ظ‹ ط¬ط¯ظٹط¯ط§ظ‹',en:'Login to track progress or create a new account'})+'</p>'+
    '<div id="authFields"><div class="auth-field"><input type="text" id="authName" placeholder="'+__({ar:'ط§ظ„ط§ط³ظ…',en:'Name'})+'" autocomplete="name"></div>'+
    '<div class="auth-field"><input type="email" id="authEmail" placeholder="'+__({ar:'ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ',en:'Email'})+'" autocomplete="email"></div>'+
    '<div class="auth-field"><input type="password" id="authPass" placeholder="'+__({ar:'ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±',en:'Password'})+'" autocomplete="current-password" onkeydown="if(event.key===\'Enter\')doAuth()"></div>'+
    '<div class="auth-err" id="authErr"></div>'+
    '<button class="btn btn-accent magnetic-btn" onclick="doAuth()" style="width:100%">'+__({ar:'ط¯ط®ظˆظ„',en:'Login'})+' ًں”“</button></div></div></div>';
  document.body.insertBefore(ov,document.body.firstChild);
  setTimeout(()=>{let el=$('authEmail');if(el)el.focus()},150);
}
function showAuthForm(mode){
  $('authTabLogin').classList.toggle('act',mode==='login');
  $('authTabReg').classList.toggle('act',mode==='reg');
  let btn=$('authBody').querySelector('.btn-accent');
  if(mode==='reg'){
    $('authName').style.display='block';
    btn.textContent=__({ar:'ط¥ظ†ط´ط§ط، ط­ط³ط§ط¨',en:'Register'})+ ' ًںڑ€';
    $('authBody').querySelector('h2').textContent=__({ar:'ط¥ظ†ط´ط§ط، ط­ط³ط§ط¨ ط¬ط¯ظٹط¯',en:'Create Account'});
    $('authBody').querySelector('.auth-p').textContent=__({ar:'ط§ط¨ط¯ط£ ط±ط­ظ„طھظƒ ظپظٹ ط¹ط§ظ„ظ… ط§ظ„ظ‚ظ‡ظˆط©',en:'Start your coffee journey'});
  } else {
    $('authName').style.display='none';
    btn.textContent=__({ar:'ط¯ط®ظˆظ„',en:'Login'})+ ' ًں”“';
    $('authBody').querySelector('h2').textContent=__({ar:'ظ…ط±ط­ط¨ط§ظ‹ ط¨ط¹ظˆط¯طھظƒ',en:'Welcome Back'});
    $('authBody').querySelector('.auth-p').textContent=__({ar:'ط³ط¬ظ„ ط§ظ„ط¯ط®ظˆظ„ ظ„ظ…طھط§ط¨ط¹ط© طھظ‚ط¯ظ…ظƒ',en:'Login to continue your progress'});
  }
}
async function doAuth(){
  let isReg=$('authTabReg').classList.contains('act');
  let email=$('authEmail'), pass=$('authPass'), err=$('authErr');
  let btn=$('authBody').querySelector('.btn-accent');
  if(btn){btn.disabled=true;btn.textContent='âڈ³...'}
  if(isReg){
    let name=$('authName'), r=await registerUser(name.value,email.value,pass.value);
    if(r.err){err.textContent=r.err;err.style.display='block';if(btn){btn.disabled=false;btn.textContent=__({ar:'ط¥ظ†ط´ط§ط، ط­ط³ط§ط¨',en:'Register'})+' ًںڑ€'};return}
    if(r.pending){
      err.innerHTML=r.msg;err.style.display='block';err.style.color='var(--accent-dark)';
      err.style.background='rgba(201,168,76,.1)';
      if(pass)pass.value='';if(name)name.value='';email.value='';
      if(btn){btn.disabled=false;btn.textContent=__({ar:'ط¥ظ†ط´ط§ط، ط­ط³ط§ط¨',en:'Register'})+' ًںڑ€'}
      return;
    }
    finishAuth(r.u,false,r.msg);
  } else {
    let r=await loginUser(email.value,pass.value);
    if(r.err){err.textContent=r.err;err.style.display='block';if(pass)pass.value='';if(btn){btn.disabled=false;btn.textContent=__({ar:'ط¯ط®ظˆظ„',en:'Login'})+' ًں”“'};return}
    finishAuth(r.u,r.streakBonus);
  }
}
function finishAuth(u,streakBonus,msg){
  let ov=$('authOverlay');if(ov)ov.remove();
  saveCurUser(u);
  if(msg) to(msg);
  else if(streakBonus) to('ًں”¥ '+__({ar:'ظ…ظƒط§ظپط£ط© طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„: +'+XP_REWARDS.streak+' XP',en:'Login streak bonus: +'+XP_REWARDS.streak+' XP'}));
  updateHeaderUser();
  rT(curTab||'home');
}
function updateHeaderUser(){
  let u=getCurUser(), el=$('userMenu');
  if(!el) return;
  if(u){
    let lvl=XP_LEVELS[u.levelIdx||0];
    el.innerHTML='<div class="user-badge" onclick="rT(\'profile\')">'+
      '<span class="user-avatar">'+u.name[0].toUpperCase()+'</span>'+
      '<span class="user-name">'+u.name+'</span>'+
      '<span class="user-lvl">'+lvl.ic+' '+(u.xp||0)+' XP</span>'+
      (u.role==='admin'?'<span class="user-admin-badge">ADMIN</span>':'')+
      '</div>';
  } else {
    el.innerHTML='<button class="lang-btn" onclick="showAuth()" style="opacity:.7">ًں”گ</button>';
  }
}

function __(o){return o[lang] || o.en || ''}

function setLang(l){
  lang = l;
  document.documentElement.lang = l === 'ar' ? 'ar' : 'en';
  document.dir = l === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('act', b.id === 'lang-' + l));
  document.querySelectorAll('[data-ar],[data-en]').forEach(el => {
    if(el.dataset[l]) el.innerHTML = el.dataset[l];
  });
  rT(curTab);
}

function $(id){return document.getElementById(id)}
function esc(s){return s.replace(/'/g,"\\'")}
function to(m){let t=$('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}

/* === Premium Coffee Photography from Unsplash === */
const PHOTOS={
  A0:'photo-1509042239860-f550ce710b93',A1:'photo-1579591919791-0e3737aeffe9',
  A2:'photo-1495474472287-4d71bcdd2085',A3:'photo-1510707577719-ae7c14805e3a',
  B1:'photo-1514432324607-a09d9b4aefda',B2:'photo-1581244277943-fe4a9c77754b',
  B3:'photo-1517668808822-9ebb02f2a0e6',C1:'photo-1559526324-c1b398b60e39',
  C2:'photo-1587329310686-91414b8e3cb3',C3:'photo-1501339847302-ac426a4a7cbb',
  espresso:'photo-1510707577719-ae7c14805e3a',latte:'photo-1572442388796-11668a67e53d',
  roast:'photo-1514432324607-a09d9b4aefda',beans:'photo-1559056199-641a0ac8b55e',
  cherry:'photo-1579591919791-0e3737aeffe9',journey:'photo-1509042239860-f550ce710b93',
  map:'photo-1504630083234-14187a9df0f5',v60:'photo-1495474472287-4d71bcdd2085',
  coldbrew:'photo-1578314675249-a6910f80cc4e',water:'photo-1750378626698-abf3a6d3e808',
  cupping:'photo-1559526324-c1b398b60e39',cafe:'photo-1501339847302-ac426a4a7cbb',
  team:'photo-1600093463592-8e36ae95ef56',barista:'photo-1600093463592-8e36ae95ef56',
  j0:'photo-1526817504075-1eae907a1def',j1:'photo-1565864853224-0b79e2bb0162',
  j2:'photo-1561043433-aaf68c0e9f45',j3:'photo-1564890369478-c89ca6d9cde9',
  j4:'photo-1545468800-85f8d60c3b0d',j5:'photo-1541167760496-1628856ab772',
  j6:'photo-1505238680356-6670e35e340c',j7:'photo-1517668808822-9ebb02f2a0e6',
  j8:'photo-1500336624523-d72713056243',j9:'photo-1495474472287-4d71bcdd2085',
   j10:'photo-1501339847302-ac426a4a7cbb',
   farm:'photo-1762686852371-763b689910b2',
   roastery:'photo-1741994043358-40d97f0be265',
   beans_tree:'photo-1672851612794-6687bf0bf1a3',
   processing:'photo-1754648293032-090b43f4e45b',
   blossom:'photo-1762004456291-016c26cc59c9',
   grinder:'photo-1561480337-2b9420a5e899',
   brew:'photo-1779557123904-9e05a0b0323f',
   aerial:'photo-1762686852371-763b689910b2',
   sustainability:'photo-1746623691149-daeff6c67335',
   barista_work:'photo-1769262122923-f7796ba58638',
   coffee_bags:'photo-1770055592675-eeef95eeab25',
   coffee_shop:'photo-1770062824236-2055ac54f662',
   filter:'photo-1439242088854-0c76045f4124',
   moka:'photo-1560642002-2cbc97e04a57',
   aroma:'photo-1690980649878-d039eeeebd9a',
   plantation:'photo-1626705363160-68661d96fea2',
   fresh_roast:'photo-1768498855458-f6ce1068f02f',
   lab:'photo-1762195657410-112fbc6f2d17',
   harvest:'photo-1764121454907-159d6323bb4f',
   cup:'photo-1766729401598-84f44cb03878',
   chemex:'photo-1761393877623-4412d7060ba4',
   kaldy:'photo-1509042239860-f550ce710b93',
   turkish:'photo-1772135893358-fad3af1ae6ad',
   ethiopian:'photo-1631166092523-026627fbd2d5',
   ethiopian_ceremony:'photo-1774529233247-d3f34ed11994',
   turkish_delight:'photo-1757079649052-a24c6ab32c64',
   turkish_cup:'photo-1696590406209-811e378bd107',
   ottoman_cafe:'photo-1560799262-3727e67f0c62',
   kaldy_monk:'photo-1509042239860-f550ce710b93',
   mecca_cafe:'photo-1509042239860-f550ce710b93',
   coffee_timeline:'photo-1509042239860-f550ce710b93'
 };
// Local image path builder â€” checks images/ folder first, falls back to Unsplash
const LOCAL_IMGS=new Set(['A0','A1','A2','A3','aerial','aroma','barista','barista_work','beans','beans_tree','blossom','brew','cafe','cherry','chemex','coffee_bags','coffee_shop','coffee_timeline','coldbrew','cup','cupping','espresso','ethiopian','ethiopian_ceremony','farm','filter','fresh_roast','grinder','harvest','journey','kaldy','kaldy_monk','lab','latte','map','mecca_cafe','moka','ottoman_cafe','plantation','processing','roast','roastery','sustainability','team','turkish','turkish_cup','turkish_delight','v60','water']);
function imgPath(key,w=600,q=80){
  if(LOCAL_IMGS.has(key)) return 'images/'+key+'.jpg';
  let id=PHOTOS[key]||'photo-1509042239860-f550ce710b93';
  return 'https://images.unsplash.com/'+id+'?w='+w+'&q='+q+'&auto=format'
}
function photo(key){return imgPath(key,800,80)}
function photoSmall(key){return imgPath(key,600,80)}


/* ===== DATA ===== */

const LV = {
  A:{id:'A',name:{ar:'ظ…ط¨طھط¯ط¦',en:'Foundation'},ic:'ًںŒ±',cl:'#1a8a3e',bgCl:'lv-a',desc:{ar:'ط§ظƒطھط´ظپ ط¹ط§ظ„ظ… ط§ظ„ظ‚ظ‡ظˆط© ظ…ظ† ط§ظ„ط¨ط¯ط§ظٹط©',en:'Discover coffee from the beginning'}},
  B:{id:'B',name:{ar:'ظ…ط­طھط±ظپ',en:'Professional'},ic:'ًں”¥',cl:'#d97706',bgCl:'lv-b',desc:{ar:'طھط¹ظ…ظ‚ ظپظٹ ط¹ظ„ظˆظ… ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…طھظ‚ط¯ظ…ط©',en:'Deep dive into advanced coffee science'}},
  C:{id:'C',name:{ar:'ظ…ط§ط³طھط±',en:'Master'},ic:'ًں‘‘',cl:'#7c3aed',bgCl:'lv-c',desc:{ar:'ط£طھظ‚ظ† ظپظ† ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظ‚ظ‡ظ‰ ظˆط§ظ„طھظ‚ظٹظٹظ… ط§ظ„ط­ط³ظٹ',en:'Master cafe management & sensory evaluation'}}
};

/* ===== Deep Lesson Content ===== */

const L = {};

L['A0-0'] = {
  ar: `
<div class="hl" style="background:linear-gradient(135deg,rgba(33,150,243,.08),rgba(33,150,243,.02));border:1px solid rgba(33,150,243,.15);padding:18px 22px;border-radius:12px;text-align:center">
<h3 style="color:#90caf9;margin-bottom:6px">ًںŒچ ط±ط­ظ„ط© ط§ظ„ظ‚ظ‡ظˆط© â€” ظ…ظ† ط§ظ„ط¨ط°ط±ط© ط¥ظ„ظ‰ ط§ظ„ظپظ†ط¬ط§ظ†</h3>
<p style="color:#b0bec5;font-size:.9rem">The Coffee Journey â€” From Seed to Cup</p>
</div>
<p>ظ‚ط¨ظ„ ظ…ط§ ظ†ط؛ظˆطµ ظپظٹ ط§ظ„طھظپط§طµظٹظ„طŒ ط®ظ„ظٹظ†ط§ ظ†ط§ط®ط¯ <strong>ظ†ط¸ط±ط© ط´ط§ظ…ظ„ط©</strong> ط¹ظ„ظ‰ ط±ط­ظ„ط© ط­ط¨ط© ط§ظ„ظ‚ظ‡ظˆط© ظ…ظ† ط´ط¬ط±ط© ط§ظ„ط¨ظ† ظپظٹ ط§ظ„ط¬ط¨ط§ظ„ ط§ظ„ط¥ط«ظٹظˆط¨ظٹط© ط¥ظ„ظ‰ ط§ظ„ظپظ†ط¬ط§ظ† ط§ظ„ظ„ظٹ ط¨ظٹظ† ط£ظٹط¯ظٹظƒ. ظƒظ„ ط®ط·ظˆط© ظپظٹ ط§ظ„ط±ط­ظ„ط© ظ„ظ‡ط§ <strong>ط¹ظ„ظ…ظ‡ط§ ظˆظپظ†ظ‡ط§</strong> â€” ظˆظ‡ط°ظٹ ط§ظ„ط£ظƒط§ط¯ظٹظ…ظٹط© ظƒظ„ظ‡ط§ ظ…ط¨ظ†ظٹط© ط¹ط´ط§ظ† طھظپظ‡ظ… ظƒظ„ ط®ط·ظˆط© ط¨ط¹ظ…ظ‚.</p>
<h3>âک• ط§ظ„ط±ط­ظ„ط© ط¨ط§ط®طھطµط§ط±</h3>
<table><tr><th>#</th><th>ط§ظ„ظ…ط±ط­ظ„ط©</th><th>Stage</th><th>ط§ظ„ظ…ط¯ط© ط§ظ„طھظ‚ط±ظٹط¨ظٹط©</th></tr>
<tr><td>1</td><td>ًںŒ± ط²ط±ط§ط¹ط© ط§ظ„ط¨ظ† (Coffee Farming)</td><td>Farming</td><td>3-4 ط³ظ†ظˆط§طھ ط­طھظ‰ ط£ظˆظ„ ط­طµط§ط¯</td></tr>
<tr><td>2</td><td>ًںچ’ ط§ظ„ط­طµط§ط¯ (Harvesting)</td><td>Harvesting</td><td>ظ…ظˆط³ظ… ظˆط§ط­ط¯ + 2-3 ظ‚ط·ظپط§طھ</td></tr>
<tr><td>3</td><td>ًں§ھ ط§ظ„ظ…ط¹ط§ظ„ط¬ط© (Processing)</td><td>Processing</td><td>10-30 ظٹظˆظ…</td></tr>
<tr><td>4</td><td>ًںڈ­ ط§ظ„ط·ط­ظ† ظˆط§ظ„طھطµط¯ظٹط± (Milling & Export)</td><td>Milling</td><td>1-3 ط£ط´ظ‡ط±</td></tr>
<tr><td>5</td><td>ًں”¥ ط§ظ„طھط­ظ…ظٹطµ (Roasting)</td><td>Roasting</td><td>8-15 ط¯ظ‚ظٹظ‚ط©</td></tr>
<tr><td>6</td><td>âڑ™ï¸ڈ ط§ظ„ط·ط­ظ† (Grinding)</td><td>Grinding</td><td>ط«ظˆط§ظ†ظچ â€” ظ„ط­ط¸ط§طھ</td></tr>
<tr><td>7</td><td>âک• ط§ظ„طھط­ط¶ظٹط± (Brewing)</td><td>Brewing</td><td>2-5 ط¯ظ‚ط§ط¦ظ‚</td></tr>
<tr><td>8</td><td>ًں‘… ط§ظ„طھط°ظˆظ‚ (Tasting)</td><td>Tasting</td><td>ظ„ط­ط¸ط§طھ ظ…ظ† ط§ظ„ظ…طھط¹ط©</td></tr></table>
<h3>ًںŒ± 1. ط²ط±ط§ط¹ط© ط§ظ„ط¨ظ† â€” Coffee Farming</h3>
<p>ط§ظ„ظ‚ظ‡ظˆط© طھظ†ظ…ظˆ ظپظٹ <strong>ط­ط²ط§ظ… ط§ظ„ط¨ظ†</strong> (Bean Belt) â€” ط§ظ„ظ…ظ†ط·ظ‚ط© ط¨ظٹظ† ظ…ط¯ط§ط±ظٹ ط§ظ„ط³ط±ط·ط§ظ† ظˆط§ظ„ط¬ط¯ظٹ. ط£ظپط¶ظ„ ط£ظ†ظˆط§ط¹ ط§ظ„ط¨ظ† طھظ†ظ…ظˆ ط¹ظ„ظ‰ <strong>ط§ط±طھظپط§ط¹ط§طھ 1200-2000 ظ…طھط±</strong>طŒ ظپظٹ طھط±ط¨ط© ط؛ظ†ظٹط© ظˆط­ط±ط§ط±ط© 15-24آ°ظ…. ط´ط¬ط±ط© ط§ظ„ط¨ظ† طھط­طھط§ط¬ 3-4 ط³ظ†ظˆط§طھ ظ„طھط«ظ…ط± ط£ظˆظ„ ظ…ط­طµظˆظ„. ط§ظ„ط²ظ‡ط±ط© ط§ظ„ط¨ظٹط¶ط§ط، (طھط³ظ…ظ‰ "ظ‚ظ‡ظˆط©" ظپظٹ ط§ظ„ظٹظ…ظ†) طھطھط­ظˆظ„ ط¥ظ„ظ‰ <strong>ط§ظ„ظƒط±ط²ط© ط§ظ„ط­ظ…ط±ط§ط، (Coffee Cherry)</strong> ط¨ط¹ط¯ 6-9 ط£ط´ظ‡ط±.</p>
<div class="img-c"><img src="${photo('farm')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًںŒ± ط­ط²ط§ظ… ط§ظ„ط¨ظ† ط§ظ„ط¹ط§ظ„ظ…ظٹ â€” ط¨ظٹظ† ظ…ط¯ط§ط±ظٹ ط§ظ„ط³ط±ط·ط§ظ† ظˆط§ظ„ط¬ط¯ظٹ</div></div>


<h3>ًںچ’ 2. ط§ظ„ط­طµط§ط¯ â€” Harvesting</h3>
<p>ط§ظ„ظ‚ط·ظپ ط§ظ„ظٹط¯ظˆظٹ ظ‡ظˆ <strong>ط£ظپط¶ظ„ ط·ط±ظٹظ‚ط© ظ„ظ„ط­طµط§ط¯</strong> â€” ظٹط®طھط§ط± ط§ظ„ط¹ظ…ط§ظ„ ط§ظ„ظƒط±ط²ط§طھ ط§ظ„ط­ظ…ط±ط§ط، ط§ظ„ظ†ط§ط¶ط¬ط© ظپظ‚ط·. طھط­طھط§ط¬ ط´ط¬ط±ط© ط¨ظ† ظˆط§ط­ط¯ط© 3-4 ظ‚ط·ظپط§طھ ظپظٹ ط§ظ„ظ…ظˆط³ظ… ظ„ط£ظ† ط§ظ„ظƒط±ط²ط§طھ ظ„ط§ طھظ†ط¶ط¬ ظ…ط¹ط§ظ‹. ظƒظ„ ط¹ط§ظ…ظ„ ظٹط¬ظ…ط¹ 50-100 ظƒط¬ظ… ظƒط±ط² ظٹظˆظ…ظٹط§ظ‹ â€” طھطھط­ظˆظ„ ط¥ظ„ظ‰ 10-20 ظƒط¬ظ… ط¨ظ† ط£ط®ط¶ط± ظپظ‚ط·.</p>
<h3>ًں§ھ 3. ط§ظ„ظ…ط¹ط§ظ„ط¬ط© â€” Processing</h3>
<p>ط¨ط¹ط¯ ط§ظ„ط­طµط§ط¯طŒ ظٹظڈظپطµظ„ ط§ظ„ط¨ظ† ط¹ظ† ط§ظ„ظƒط±ط²ط© ط®ظ„ط§ظ„ <strong>ط³ط§ط¹ط§طھ</strong> ظ„طھط¬ظ†ط¨ ط§ظ„طھط®ظ…ط± ط؛ظٹط± ط§ظ„ظ…ط±ط؛ظˆط¨. ط«ظ„ط§ط« ط·ط±ظ‚ ط±ط¦ظٹط³ظٹط©:</p>
<p>â€¢ <strong>ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط·ط¨ظٹط¹ظٹط© (Natural):</strong> طھط¬ظپظپ ط§ظ„ظƒط±ط²ط§طھ ظƒط§ظ…ظ„ط© ط¨ط§ظ„ط´ظ…ط³ â€” ظ†ظƒظ‡ط§طھ ظپط§ظƒظ‡ظٹط©طŒ ط­ظ„ط§ظˆط© ط¹ط§ظ„ظٹط©<br>â€¢ <strong>ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ظ…ط؛ط³ظˆظ„ط© (Washed):</strong> ظٹظڈظ†ط²ط¹ ط§ظ„ظ‚ط´ط± ظˆط§ظ„ظ„ط¨ ظ‚ط¨ظ„ ط§ظ„طھط¬ظپظٹظپ â€” ظ†ظƒظ‡ط§طھ ظ†ط¸ظٹظپط©طŒ ط­ظ…ظˆط¶ط© ظ…ط´ط±ظ‚ط©<br>â€¢ <strong>ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط¹ط³ظ„ (Honey):</strong> ظٹظڈظ†ط²ط¹ ط§ظ„ظ‚ط´ط± ظˆظٹطھط±ظƒ ط¨ط¹ط¶ ط§ظ„ظ„ط¨ â€” ظ†ظƒظ‡ط§طھ ظˆط³ط· ط¨ظٹظ† ط§ظ„ط·ط¨ظٹط¹ظٹ ظˆط§ظ„ظ…ط؛ط³ظˆظ„</p>
<div class="hl"><strong>ًں“ٹ ظ…ط¹ظ„ظˆظ…ط©:</strong> ط§ظ„ظƒط±ط²ط© ط§ظ„ظˆط§ط­ط¯ط© طھط­طھظˆظٹ ط¹ظ„ظ‰ ط¨ط°ط±طھظٹظ† (ط­ط¨طھظٹظ† ط¨ظ†) ظپظٹ ط§ظ„ط¹ط§ط¯ط© â€” ظ…ظ†ظ‡ظ…ط§ ظٹطµظ†ط¹ ظپظ†ط¬ط§ظ† ظˆط§ط­ط¯. ظƒظ„ ط´ط¬ط±ط© ط¨ظ† طھظ†طھط¬ ط­ظˆط§ظ„ظٹ <strong>500 ط¬ط±ط§ظ… ط¨ظ† ط£ط®ط¶ط±</strong> ط³ظ†ظˆظٹط§ظ‹ â€” طھظƒظپظٹ ظ„ظ€ 40-50 ظپظ†ط¬ط§ظ†.</div>
<h3>ًںڈ­ 4. ط§ظ„ط·ط­ظ† ظˆط§ظ„طھطµط¯ظٹط± â€” Milling & Export</h3>
<p>ط¨ط¹ط¯ ط§ظ„ظ…ط¹ط§ظ„ط¬ط©طŒ ظٹظ…ط± ط§ظ„ط¨ظ† ط¨ظ…ط±ط­ظ„ط© <strong>ط§ظ„ط·ط­ظ† ط§ظ„ط¬ط§ظپ (Dry Milling)</strong> ظ„ط¥ط²ط§ظ„ط© ط§ظ„ظ‚ط´ط±ط© ط§ظ„ط¯ط§ط®ظ„ظٹط© (Parchment). ط«ظ… ظٹظڈظپط±ط² ط­ط³ط¨ ط§ظ„ط­ط¬ظ… ظˆط§ظ„ظƒط«ط§ظپط© ظˆط§ظ„ظ„ظˆظ† â€” ط§ظ„ط­ط¨ط§طھ ط§ظ„ظ…ط¹ظٹط¨ط© طھظڈط±ظپط¶. ظٹظڈط¹ط¨ط£ ط§ظ„ط¨ظ† ط§ظ„ط£ط®ط¶ط± ظپظٹ ط£ظƒظٹط§ط³ 60-70 ظƒط¬ظ… ظ„ظ„طھطµط¯ظٹط±. <strong>ط§ظ„ط¨ظ† ط§ظ„ط£ط®ط¶ط± ظٹط­طھظپط¸ ط¨ظ†ط¶ط§ط±طھظ‡ ظ„ظ…ط¯ط© 12 ط´ظ‡ط±ط§ظ‹</strong> ظپظٹ ط¸ط±ظˆظپ طھط®ط²ظٹظ† ط¬ظٹط¯ط©.</p>
<h3>ًں”¥ 5. ط§ظ„طھط­ظ…ظٹطµ â€” Roasting</h3>
<p>ط§ظ„طھط­ظ…ظٹطµ ظ‡ظˆ <strong>ظ‚ظ„ط¨ طµظ†ط§ط¹ط© ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ط®طھطµط©</strong>. ط§ظ„ط¨ظ† ط§ظ„ط£ط®ط¶ط± ظ„ط§ ط·ط¹ظ… ظ„ظ‡ â€” ط§ظ„ط­ط±ط§ط±ط© طھط­ظˆظ„ ط§ظ„ظ†ط´ظˆظٹط§طھ ظˆط§ظ„ط³ظƒط±ظٹط§طھ ط¥ظ„ظ‰ <strong>ط£ظƒط«ط± ظ…ظ† 800 ظ…ط±ظƒط¨ ط¹ط·ط±ظٹ</strong>. ط¯ط±ط¬ط§طھ ط§ظ„طھط­ظ…ظٹطµ: ظپط§طھط­ (ط­ظ…ظˆط¶ط©طŒ ظ†ظƒظ‡ط§طھ ط£طµظ„ظٹط©) â†’ ظ…طھظˆط³ط· (طھظˆط§ط²ظ†) â†’ ط¯ط§ظƒظ† (ظ‚ظˆط§ظ… ط«ظ‚ظٹظ„طŒ ظ…ط±ط©). ظ…ط¯ط© ط§ظ„طھط­ظ…ظٹطµ: 8-15 ط¯ظ‚ظٹظ‚ط© ط¹ظ„ظ‰ ط¯ط±ط¬ط© 180-240آ°ظ….</p>
<h3>âڑ™ï¸ڈ 6. ط§ظ„ط·ط­ظ† â€” Grinding</h3>
<p>ط§ظ„ط·ط­ظ† ظٹط­ط¯ط¯ <strong>ط³ط±ط¹ط© ط§ظ„ط§ط³طھط®ظ„ط§طµ</strong>. ط§ظ„ط·ط­ظ† ط§ظ„ظ†ط§ط¹ظ… (ط¥ط³ط¨ط±ظٹط³ظˆ) = ط§ط³طھط®ظ„ط§طµ ط³ط±ظٹط¹. ط§ظ„ط·ط­ظ† ط§ظ„ط®ط´ظ† (French Press) = ط§ط³طھط®ظ„ط§طµ ط¨ط·ظٹط،. ط§ظ„طھظˆط­ظٹط¯ ظپظٹ ط­ط¬ظ… ط§ظ„ط·ط­ظ† ظ‡ظˆ <strong>ط³ط± ط§ظ„ط§طھط³ط§ظ‚</strong> â€” ط§ظ„ط·ظˆط§ط­ظٹظ† ط§ظ„ظ…ط®ط±ظˆط·ظٹط© (Conical Burr) ط£ظپط¶ظ„ ظ…ظ† ط§ظ„ط·ظˆط§ط­ظٹظ† ط§ظ„ط´ظپط±ظٹط©. <strong>ط§ظ„ط¨ظ† ط§ظ„ظ…ط·ط­ظˆظ† ظٹظپظ‚ط¯ ظ†ظƒظ‡طھظ‡ ظپظٹ 15 ط¯ظ‚ظٹظ‚ط©</strong> â€” ط§ط·ط­ظ† ظ‚ط¨ظ„ ط§ظ„طھط­ط¶ظٹط± ظ…ط¨ط§ط´ط±ط©!</p>
<h3>âک• 7. ط§ظ„طھط­ط¶ظٹط± â€” Brewing</h3>
<p>ط§ظ„ظ‡ط¯ظپ: ط§ط³طھط®ظ„ط§طµ <strong>18-22%</strong> ظ…ظ† ظˆط²ظ† ط§ظ„ط¨ظ† ط§ظ„ظ…ط·ط­ظˆظ† (Extraction Yield) ظپظٹ ط§ظ„ظ…ط§ط،. ظƒظ„ ط·ط±ظٹظ‚ط© ظ„ظ‡ط§ ظˆظ‚طھ ظˆظ†ط³ط¨ط© ظˆط¯ط±ط¬ط© ط­ط±ط§ط±ط© ظ…ط«ط§ظ„ظٹط©. ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ: 9 ط¨ط§ط±طŒ 92-96آ°ظ…طŒ 25-30 ط«ط§ظ†ظٹط©. V60: 92-96آ°ظ…طŒ 2:30-3:00 ط¯ظ‚ظٹظ‚ط©. French Press: 4 ط¯ظ‚ط§ط¦ظ‚. Cold Brew: 12-24 ط³ط§ط¹ط©.</p>
<h3>ًں‘… 8. ط§ظ„طھط°ظˆظ‚ â€” Tasting</h3>
<p>ط§ظ„طھط°ظˆظ‚ ط§ظ„ط§ط­طھط±ط§ظپظٹ (Cupping) ظ‡ظˆ <strong>ط£ط¯ط§ط© ظ…ط±ط§ظ‚ط¨ط© ط§ظ„ط¬ظˆط¯ط©</strong>. ظٹظ‚ظٹظ… ط§ظ„ط¨ظ† ط­ط³ط¨: ط§ظ„ط¹ط·ط± (Aroma)طŒ ط§ظ„ظ†ظƒظ‡ط© (Flavor)طŒ ط§ظ„ط­ظ…ظˆط¶ط© (Acidity)طŒ ط§ظ„ظ‚ظˆط§ظ… (Body)طŒ ط§ظ„ط·ط¹ظ… ط§ظ„ظ…طھط¨ظ‚ظٹ (Aftertaste)طŒ ط§ظ„طھظˆط§ط²ظ† (Balance). ط£ظپط¶ظ„ ط¨ظ† ظپظٹ ط§ظ„ط¹ط§ظ„ظ… ظٹط­طµظ„ ط¹ظ„ظ‰ 90+ ظ†ظ‚ط·ط© ظ…ظ† SCA â€” ط³ط¹ط±ظ‡ ظٹطµظ„ ط¥ظ„ظ‰ $100+ ظ„ظ„ظƒظٹظ„ظˆ.</p>
<div class="ok-box"><strong>ًںژ¯ ط§ظ„ط®ظ„ط§طµط©:</strong> ط±ط­ظ„ط© ط§ظ„ط¨ظ† ظ…ظ† ط§ظ„ط¨ط°ط±ط© ظ„ظ„ظپظ†ط¬ط§ظ† طھط£ط®ط° <strong>3-5 ط³ظ†ظˆط§طھ ظˆظپظٹظ‡ 8 ط®ط·ظˆط§طھ ط±ط¦ظٹط³ظٹط©</strong>. ظƒظ„ ط®ط·ظˆط© طھط¤ط«ط± ط¹ظ„ظ‰ ط§ظ„ظ†ظƒظ‡ط© ط§ظ„ظ†ظ‡ط§ط¦ظٹط©. ظپظ‡ظ… ظ‡ط°ظ‡ ط§ظ„ط±ط­ظ„ط© ظ‡ظˆ <strong>ط§ظ„ظپط±ظ‚ ط¨ظٹظ† ط§ظ„ط¨ط§ط±ظٹط³طھط§ ط§ظ„ط¹ط§ط¯ظٹ ظˆط§ظ„ظ…ط­طھط±ظپ</strong>. ط§ظ„ط£ظƒط§ط¯ظٹظ…ظٹط© ط¯ظٹ ظ‡طھط§ط®ط¯ظƒ ظپظٹ ظƒظ„ ط®ط·ظˆط© ط¨ط§ظ„طھظپطµظٹظ„ â€” ط§ط³طھط¹ط¯!</div>
`,
  en: `
<div class="hl" style="background:linear-gradient(135deg,rgba(33,150,243,.08),rgba(33,150,243,.02));border:1px solid rgba(33,150,243,.15);padding:18px 22px;border-radius:12px;text-align:center">
<h3 style="color:#90caf9;margin-bottom:6px">ًںŒچ The Coffee Journey â€” From Seed to Cup</h3>
<p style="color:#b0bec5;font-size:.9rem">ط±ط­ظ„طھظ†ط§ ظ…ط¹ ط§ظ„ظ‚ظ‡ظˆط© â€” ظ…ظ† ط§ظ„ط¨ط°ط±ط© ط¥ظ„ظ‰ ط§ظ„ظپظ†ط¬ط§ظ†</p>
</div>
<p>Before we dive into details, let's take a <strong>big-picture view</strong> of the coffee bean's journey â€” from the tree in Ethiopian highlands to the cup in your hand. Every step has its <strong>science and art</strong> â€” this entire academy is built to help you understand each step in depth.</p>
<h3>âک• The Journey in Brief</h3>
<table><tr><th>#</th><th>Stage</th><th>ط§ظ„ظ…ط±ط­ظ„ط©</th><th>Approx. Duration</th></tr>
<tr><td>1</td><td>ًںŒ± Coffee Farming</td><td>ط²ط±ط§ط¹ط©</td><td>3-4 years to first harvest</td></tr>
<tr><td>2</td><td>ًںچ’ Harvesting</td><td>ط­طµط§ط¯</td><td>1 season + 2-3 rounds</td></tr>
<tr><td>3</td><td>ًں§ھ Processing</td><td>ظ…ط¹ط§ظ„ط¬ط©</td><td>10-30 days</td></tr>
<tr><td>4</td><td>ًںڈ­ Milling & Export</td><td>ط·ط­ظ† ظˆطھطµط¯ظٹط±</td><td>1-3 months</td></tr>
<tr><td>5</td><td>ًں”¥ Roasting</td><td>طھط­ظ…ظٹطµ</td><td>8-15 minutes</td></tr>
<tr><td>6</td><td>âڑ™ï¸ڈ Grinding</td><td>ط·ط­ظ†</td><td>Seconds</td></tr>
<tr><td>7</td><td>âک• Brewing</td><td>طھط­ط¶ظٹط±</td><td>2-5 minutes</td></tr>
<tr><td>8</td><td>ًں‘… Tasting</td><td>طھط°ظˆظ‚</td><td>Moments of pleasure</td></tr></table>
<h3>ًںŒ± 1. Coffee Farming</h3>
<p>Coffee grows in the <strong>Bean Belt</strong> â€” between the Tropics of Cancer and Capricorn. The best coffee grows at <strong>1200-2000m altitude</strong>, in rich soil with 15-24آ°C temperatures. A coffee tree takes 3-4 years to produce its first crop. The white flower (called "qahwa" in Yemen) turns into the <strong>red coffee cherry</strong> after 6-9 months.</p>
<div class="img-c"><img src="${photo('farm')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًںŒ± The Coffee Bean Belt â€” Between the Tropics</div></div>
<h3>ًںچ’ 2. Harvesting</h3>
<p>Hand-picking is the <strong>best harvesting method</strong> â€” workers select only ripe red cherries. A single tree needs 3-4 pickings per season since cherries ripen unevenly. Each worker collects 50-100kg of cherries daily â€” yielding only 10-20kg of green beans.</p>
<h3>ًں§ھ 3. Processing</h3>
<p>After harvest, beans must be separated from the cherry <strong>within hours</strong> to prevent unwanted fermentation. Three main methods:</p>
<p>â€¢ <strong>Natural (Dry):</strong> Whole cherries dried in sun â€” fruity flavors, high sweetness<br>â€¢ <strong>Washed (Wet):</strong> Skin and pulp removed before drying â€” clean flavors, bright acidity<br>â€¢ <strong>Honey (Pulped Natural):</strong> Skin removed, some pulp left â€” middle-ground flavors</p>
<div class="hl"><strong>ًں“ٹ Fact:</strong> Each cherry typically contains 2 beans â€” enough for one cup. A single tree produces about <strong>500g green beans</strong> annually â€” enough for 40-50 cups.</div>
<h3>ًںڈ­ 4. Milling & Export</h3>
<p>After processing, beans go through <strong>dry milling</strong> to remove the parchment layer, then sorted by size, density, and color â€” defective beans are rejected. Green beans are packed in 60-70kg bags for export. <strong>Green beans stay fresh for 12 months</strong> in proper storage.</p>
<h3>ًں”¥ 5. Roasting</h3>
<p>Roasting is the <strong>heart of specialty coffee</strong>. Green beans have no flavor â€” heat transforms starches and sugars into <strong>over 800 aromatic compounds</strong>. Roast levels: Light (acidity, origin flavors) â†’ Medium (balance) â†’ Dark (heavy body, bitter). Duration: 8-15 minutes at 180-240آ°C.</p>
<h3>âڑ™ï¸ڈ 6. Grinding</h3>
<p>Grind size determines <strong>extraction speed</strong>. Fine grind (espresso) = fast extraction. Coarse grind (French Press) = slow extraction. Consistency in particle size is the <strong>secret to consistency</strong> â€” conical burr grinders are best. <strong>Ground coffee loses flavor in 15 minutes</strong> â€” grind just before brewing!</p>
<h3>âک• 7. Brewing</h3>
<p>The goal: extract <strong>18-22%</strong> of ground coffee weight (Extraction Yield) into water. Each method has ideal time, ratio, and temperature. Espresso: 9 bar, 92-96آ°C, 25-30 seconds. V60: 92-96آ°C, 2:30-3:00 min. French Press: 4 min. Cold Brew: 12-24 hours.</p>
<h3>ًں‘… 8. Tasting</h3>
<p>Professional tasting (Cupping) is the <strong>quality control tool</strong>. Coffee is evaluated on: Aroma, Flavor, Acidity, Body, Aftertaste, Balance. The world's best coffee scores 90+ points from SCA â€” selling for $100+/kg.</p>
<div class="ok-box"><strong>ًںژ¯ Summary:</strong> The coffee journey from seed to cup takes <strong>3-5 years with 8 key stages</strong>. Every step affects the final flavor. Understanding this journey is the <strong>difference between an average and a professional barista</strong>. This academy will take you through every step in detail â€” get ready!</div>
`
};

L['A1-0'] = {
  ar: `
<h3>ًں“– ظ‚طµط© ط§ظƒطھط´ط§ظپ ط§ظ„ظ‚ظ‡ظˆط© â€” ط£ط³ط·ظˆط±ط© ظƒظ„ط¯</h3>
<p>طھط±ظˆظٹ ط§ظ„ط£ط³ط·ظˆط±ط© ط§ظ„ط¥ط«ظٹظˆط¨ظٹط© ط£ظ† ط±ط§ط¹ظٹط§ظ‹ ط§ط³ظ…ظ‡ <strong>ظƒظ„ط¯ (Kaldi)</strong> ظƒط§ظ† ظٹط±ط¹ظ‰ ط£ط؛ظ†ط§ظ…ظ‡ ظپظٹ ظ…ط±طھظپط¹ط§طھ ط¥ظ‚ظ„ظٹظ… <strong>ظƒط§ظپط§ (Kaffa)</strong> ط¬ظ†ظˆط¨ ط؛ط±ط¨ ط¥ط«ظٹظˆط¨ظٹط§طŒ ط­ظˆط§ظ„ظٹ ط§ظ„ظ‚ط±ظ† ط§ظ„طھط§ط³ط¹ ط§ظ„ظ…ظٹظ„ط§ط¯ظٹ. ظ„ط§ط­ط¸ ظƒظ„ط¯ ط£ظ† ط£ط؛ظ†ط§ظ…ظ‡ ط£طµط¨ط­طھ <strong>ظ†ط´ظٹط·ط© ط¨ط´ظƒظ„ ط؛ظٹط± ط¹ط§ط¯ظٹ</strong> ط¨ط¹ط¯ ط£ظ† ط£ظƒظ„طھ ط«ظ…ط§ط±ط§ظ‹ ط­ظ…ط±ط§ط، ظ…ظ† ط´ط¬ط±ط© ط؛ط±ظٹط¨ط©. ظƒط§ظ†طھ طھظ‚ظپط² ظˆطھط±ظƒط¶ ط¨ط­ظٹظˆظٹط© ظ„ظ… ظٹط³ط¨ظ‚ ظ„ظ‡ط§ ظ…ط«ظٹظ„.</p>
<div class="img-c"><img src="${photo('kaldy')}" alt="" loading="lazy"><div class="cap">ًںگگ ظƒظ„ط¯ ظٹظ„ط§ط­ط¸ ط£ط؛ظ†ط§ظ…ظ‡ طھط±ظ‚طµ â€” ط£ظˆظ„ ظ„ط­ط¸ط© ط§ظƒطھط´ط§ظپ ط§ظ„ظ‚ظ‡ظˆط©</div></div>
<p>ظ‚ط±ط± ظƒظ„ط¯ طھط¬ط±ط¨ط© ط§ظ„ط«ظ…ط§ط± ط¨ظ†ظپط³ظ‡طŒ ظˆط´ط¹ط± ظپظˆط±ط§ظ‹ <strong>ط¨ط§ظ†طھط¹ط§ط´ ظˆطھظٹظ‚ط¸</strong> ظ„ظ… ظٹط¹ظ‡ط¯ظ‡ظ…ط§ ظ…ظ† ظ‚ط¨ظ„. ط£ط®ط° ط¨ط¹ط¶ ط§ظ„ط«ظ…ط§ط± ط¥ظ„ظ‰ <strong>ط§ظ„ط¯ظٹط± ط§ظ„ظ…ط¬ط§ظˆط±</strong>طŒ ط­ظٹط« ط§ط³طھظ‚ط¨ظ„ظ‡ ط§ظ„ط±ظ‡ط¨ط§ظ† ط¨ط´ظƒ. ظ„ظƒظ†ظ‡ظ… ط¨ط¹ط¯ طھط¬ط±ط¨ط© ط§ظ„ط«ظ…ط§ط±طŒ ظˆط¬ط¯ظˆط§ ط£ظ†ظ‡ط§ طھط³ط§ط¹ط¯ظ‡ظ… ط¹ظ„ظ‰ ط§ظ„ط³ظ‡ط± ظپظٹ ط§ظ„طµظ„ط§ط© ظˆط§ظ„ط¹ط¨ط§ط¯ط© ط·ظˆط§ظ„ ط§ظ„ظ„ظٹظ„. ظ‡ظƒط°ط§طŒ ط­ط³ط¨ ط§ظ„ط£ط³ط·ظˆط±ط©طŒ ط¨ط¯ط£طھ ط±ط­ظ„ط© ط§ظ„ظ‚ظ‡ظˆط© ظ…ط¹ ط§ظ„ط¨ط´ط±ظٹط©.</p>
<div class="img-c"><img src="${photo('kaldy_monk')}" alt="" loading="lazy"><div class="cap">ًںگگ ظƒظ„ط¯ ط¹ظ†ط¯ ط§ظ„ط¯ظٹط± â€” ط§ظ„ظ‚ظ‡ظˆط© طھطµظ„ ط¥ظ„ظ‰ ط§ظ„ط±ظ‡ط¨ط§ظ†</div></div>
<h3>ًںŒ؟ ط·ظ‚ظˆط³ ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط¥ط«ظٹظˆط¨ظٹط© â€” طھط±ط§ط« ط­ظٹ</h3>
<p>ظپظٹ ط¥ط«ظٹظˆط¨ظٹط§ ط§ظ„ظٹظˆظ…طŒ ظ„ط§ طھط²ط§ظ„ <strong>ط·ظ‚ظˆط³ ط§ظ„ظ‚ظ‡ظˆط© (Buna Tetu)</strong> طھظ…ط§ط±ط³ ظپظٹ ظƒظ„ ط¨ظٹطھ ظˆظ‚ط±ظٹط©. ط¹ظ…ظ„ظٹط© طھط­ط¶ظٹط± طھط³طھط؛ط±ظ‚ ط³ط§ط¹طھظٹظ†: طھظڈط­ظ…طµ ط§ظ„ط­ط¨ظˆط¨ ط§ظ„ط®ط¶ط±ط§ط، ط¹ظ„ظ‰ ط§ظ„ظ†ط§ط± ظپظٹ ظ…ظ‚ظ„ط§ط© ظ…ط³ط·ط­ط© ط­طھظ‰ طھطھطµط§ط¹ط¯ ط±ط§ط¦ط­ط© ط§ظ„ط¨ط®ظˆط±طŒ ط«ظ… طھط·ط­ظ† ط¨ظ‚ط°ط§ط¦ظپ ط§ظ„ظ‡ط§ظˆظ†طŒ ظˆطھط؛ظ„ظ‰ ظپظٹ ط§ظ„ط¥ط¨ط±ظٹظ‚ ط§ظ„ظپط®ط§ط±ظٹ ط§ظ„طھظ‚ظ„ظٹط¯ظٹ (ط§ظ„ط¬ط¨ط§ظ†ط©). طھظڈظ‚ط¯ظ… ظ„ظ„ط£ط¨ ط§ظ„ط±ظˆط­ظٹ ط£ظˆظ„ط§ظ‹ ط«ظ… ظ„ظ„ط¶ظٹظˆظپ ط­ط³ط¨ ط§ظ„ط£ظ‡ظ…ظٹط©. ط§ظ„ط·ظ‚ط³ ظٹطھظƒط±ط± ط«ظ„ط§ط« ظ…ط±ط§طھ â€” ط§ظ„ط¬ظˆظ„ط© ط§ظ„ط£ظˆظ„ظ‰ طھط³ظ…ظ‰ "ط£ظˆظ‘ظ„"طŒ ظˆط§ظ„ط«ط§ظ†ظٹط© "ظƒط§ظ„ظ‰"طŒ ظˆط§ظ„ط«ط§ظ„ط«ط© "ط¨ط±ظƒط©". ظ‡ط°ظ‡ ط§ظ„ط·ظ‚ظˆط³ ط¬ط³ط¯طھ ط«ظ‚ط§ظپط© ط§ظ„ط¶ظٹط§ظپط© ط§ظ„ط¥ط«ظٹظˆط¨ظٹط© ظ„ط£ظƒط«ط± ظ…ظ† ط£ظ„ظپ ط¹ط§ظ….</p>
<h3>ًں“œ ط§ظ„ط£ط¯ظ„ط© ط§ظ„طھط§ط±ظٹط®ظٹط© â€” ط§ظ„ط­ظ‚ظٹظ‚ط© ظˆط§ظ„ط®ط±ط§ظپط©</h3>
<p>ط¹ظ„ظ‰ ط§ظ„ط±ط؛ظ… ظ…ظ† ط´ظ‡ط±ط© ط£ط³ط·ظˆط±ط© ظƒظ„ط¯طŒ ظپط¥ظ† <strong>ط£ظ‚ط¯ظ… ط§ظ„ط£ط¯ظ„ط© ط§ظ„طھط§ط±ظٹط®ظٹط© ط§ظ„ظ…ظˆط«ظ‚ط©</strong> ط¹ظ† ط´ط±ط¨ ط§ظ„ظ‚ظ‡ظˆط© طھط¹ظˆط¯ ط¥ظ„ظ‰ <strong>ط§ظ„ظٹظ…ظ† ظپظٹ ط§ظ„ظ‚ط±ظ† ط§ظ„ط®ط§ظ…ط³ ط¹ط´ط±</strong>. ظƒط§ظ† ط§ظ„طµظˆظپظٹظˆظ† ط§ظ„ظٹظ…ظ†ظٹظˆظ† ظٹط³طھط®ط¯ظ…ظˆظ† ط§ظ„ظ‚ظ‡ظˆط© (ط§ظ„طھظٹ ط£ط³ظ…ظˆظ‡ط§ "ط§ظ„ظ‚ظژظ‡ظ’ظˆظژط©") ظ„ظ„ط¨ظ‚ط§ط، ظ…ط³طھظٹظ‚ط¸ظٹظ† ط£ط«ظ†ط§ط، ط§ظ„ط°ظƒط± ظˆط§ظ„ط¹ط¨ط§ط¯ط© ط§ظ„ظ„ظٹظ„ظٹط©. ط§ظ†طھظ‚ظ„طھ ط§ظ„ظ‚ظ‡ظˆط© ظ…ظ† ط§ظ„ظٹظ…ظ† ط¥ظ„ظ‰ ظ…ظƒط©طŒ ط«ظ… ط§ظ„ظ‚ط§ظ‡ط±ط©طŒ ظپط¯ظ…ط´ظ‚طŒ ظˆط§ط³ط·ظ†ط¨ظˆظ„.</p>
<p><strong>ط§ظ†طھط´ط§ط± ط§ظ„ظ‚ظ‡ظˆط© ظپظٹ ط§ظ„ط¹ط§ظ„ظ… ط§ظ„ط¥ط³ظ„ط§ظ…ظٹ</strong> ظƒط§ظ† ط³ط±ظٹط¹ط§ظ‹ ط¨ظپط¶ظ„ ط§ظ„ط­ط¬ط§ط¬ ظˆط§ظ„طھط¬ط§ط±. ط¨ط­ظ„ظˆظ„ ط¹ط§ظ… 1500طŒ ظƒط§ظ†طھ ط§ظ„ظ‚ظ‡ظˆط© ظ…ط¹ط±ظˆظپط© ظپظٹ ظƒظ„ ط§ظ„ظ…ط¯ظ† ط§ظ„ظƒط¨ط±ظ‰ ظپظٹ ط§ظ„ط¹ط§ظ„ظ… ط§ظ„ط¥ط³ظ„ط§ظ…ظٹ â€” ظ…ظ† ظ…ظƒط© ط¥ظ„ظ‰ ط§ظ„ظ‚ط§ظ‡ط±ط©طŒ ظ…ظ† ط¯ظ…ط´ظ‚ ط¥ظ„ظ‰ ط­ظ„ط¨. ط§ظپطھطھط­طھ ط§ظ„ظ…ظ‚ط§ظ‡ظٹ ظˆط£طµط¨ط­طھ ظ…ط±ط§ظƒط² ظ„ظ„ظ…ظˆط³ظٹظ‚ظ‰ ظˆط§ظ„ط´ط¹ط± ظˆط§ظ„ظ†ظ‚ط§ط´ ط§ظ„ط³ظٹط§ط³ظٹطŒ ظ…ظ…ط§ ط£ط«ط§ط± ظ…ط®ط§ظˆظپ ط§ظ„ط­ظƒط§ظ… ط£ط­ظٹط§ظ†ط§ظ‹. ظپظٹ ط§ظ„ظ‚ط§ظ‡ط±ط©طŒ ظƒط§ظ†طھ طھط³ظ…ظ‰ "ظ…ظ‚ط§ظ‡ظٹ ط§ظ„ط¹ظ„ظ…" ظ„ظƒظˆظ†ظ‡ط§ ظ…ظ„طھظ‚ظ‰ ط§ظ„ط¹ظ„ظ…ط§ط، ظˆط§ظ„ط·ظ„ط§ط¨.</p>
<div class="hl"><strong>ًں“ٹ ط§ظ„طھط³ظ„ط³ظ„ ط§ظ„ط²ظ…ظ†ظٹ:</strong><br>â€¢ ط§ظ„ظ‚ط±ظ† 9: ط§ظ„ط£ط³ط·ظˆط±ط© ط§ظ„ط¥ط«ظٹظˆط¨ظٹط© (ظƒظ„ط¯)<br>â€¢ 1000-1400: ط§ظ†طھط´ط§ط± ط´ط±ط¨ ط§ظ„ظ‚ظ‡ظˆط© ظپظٹ ط§ظ„ظ‚ط¨ط§ط¦ظ„ ط§ظ„ط¥ط«ظٹظˆط¨ظٹط©<br>â€¢ 1400-1450: ط§ظ„طµظˆظپظٹظˆظ† ظپظٹ ط§ظ„ظٹظ…ظ† ظٹط´ط±ط¨ظˆظ† ط§ظ„ظ‚ظ‡ظˆط©<br>â€¢ 1511: ط£ظˆظ„ ظ…ط­ط§ظˆظ„ط© ظ„ظ…ظ†ط¹ ط§ظ„ظ‚ظ‡ظˆط© ظپظٹ ظ…ظƒط©<br>â€¢ 1550: ط§ظ†طھط´ط§ط± ط§ظ„ظ…ظ‚ط§ظ‡ظٹ ظپظٹ ط§ظ„ظ‚ط§ظ‡ط±ط© ظˆط§ط³ط·ظ†ط¨ظˆظ„<br>â€¢ 1615: ظˆطµظˆظ„ ط§ظ„ظ‚ظ‡ظˆط© ط¥ظ„ظ‰ ط£ظˆط±ظˆط¨ط§ (ط§ظ„ط¨ظ†ط¯ظ‚ظٹط©)<br>â€¢ 1652: ط£ظˆظ„ ظ…ظ‚ظ‡ظ‰ ظپظٹ ظ„ظ†ط¯ظ†<br>â€¢ 1683: ط£ظˆظ„ ظ…ظ‚ظ‡ظ‰ ظپظٹ ظپظٹظٹظ†ط§ ط¨ط¹ط¯ ط­طµط§ط± ط§ظ„ط£طھط±ط§ظƒ<br>â€¢ 1727: ظ†ظ‚ظ„ ط§ظ„ط¨ظ† ط¥ظ„ظ‰ ط§ظ„ط¨ط±ط§ط²ظٹظ„<br>â€¢ 1901: ط£ظˆظ„ ظ…ط§ظƒظٹظ†ط© ط¥ط³ط¨ط±ظٹط³ظˆ (ط¨ط²ظٹط±ط§)</div>
<h3>ًںŒچ ط§ظ„ظ‚ظ‡ظˆط© ط¥ظ„ظ‰ ط§ظ„ط¹ط§ظ„ظ… ط§ظ„ط¬ط¯ظٹط¯</h3>
<p>ظپظٹ ط§ظ„ظ‚ط±ظ† ط§ظ„ط³ط§ط¨ط¹ ط¹ط´ط±طŒ ط­ط§ظˆظ„ <strong>ط§ظ„ظ‡ظˆظ„ظ†ط¯ظٹظˆظ†</strong> ظƒط³ط± ط§ط­طھظƒط§ط± ط§ظ„ظٹظ…ظ† ظ„ط²ط±ط§ط¹ط© ط§ظ„ط¨ظ†. ظ†ط¬ط­ظˆط§ ظپظٹ طھظ‡ط±ظٹط¨ ط¨ط°ظˆط± ط§ظ„ط¨ظ† ظ…ظ† ظ…ظƒط© ط¥ظ„ظ‰ ط³ط±ظٹ ظ„ط§ظ†ظƒط§ ظˆط¬ط§ظˆط© (ط¥ظ†ط¯ظˆظ†ظٹط³ظٹط§)طŒ ط­ظٹط« ط£ط³ط³ظˆط§ ط£ظˆظ„ ظ…ط²ط§ط±ط¹ ط¨ظ† ط®ط§ط±ط¬ ط£ظپط±ظٹظ‚ظٹط§ ظˆط§ظ„ظٹظ…ظ†. ظپظٹ 1727طŒ ط£ط±ط³ظ„ ط§ظ„ط¨ط±طھط؛ط§ظ„ظٹظˆظ† ط¨ط°ظˆط± ط§ظ„ط¨ظ† ظ…ظ† ظ…ط§ظƒط§ظˆ ط¥ظ„ظ‰ ط§ظ„ط¨ط±ط§ط²ظٹظ„ â€” ط§ظ„طھظٹ ط£طµط¨ط­طھ ظ„ط§ط­ظ‚ط§ظ‹ ط£ظƒط¨ط± ظ…ظ†طھط¬ ظ„ظ„ط¨ظ† ظپظٹ ط§ظ„ط¹ط§ظ„ظ…. ظ…ظ† ط´ط¬ط±ط© ظˆط§ط­ط¯ط© ظ‡ظڈط±ط¨طھ ظپظٹ ط­ظ‚ظٹط¨ط© ط¯ط¨ظ„ظˆظ…ط§ط³ظٹ ط¨ط±طھط؛ط§ظ„ظٹطŒ ط§ظ†ط·ظ„ظ‚طھ طµظ†ط§ط¹ط© ط§ظ„ط¨ظ† ط§ظ„ط¨ط±ط§ط²ظٹظ„ظٹط© ط§ظ„طھظٹ طھظ†طھط¬ ط§ظ„ظٹظˆظ… ط£ظƒط«ط± ظ…ظ† 3 ظ…ظ„ظٹط§ط±ط§طھ ظƒظٹظ„ظˆط؛ط±ط§ظ… ط³ظ†ظˆظٹط§ظ‹.</p>
<div class="quiz-box"><strong>ًں’¬ ظ‡ظ„ طھط¹ظ„ظ…طں</strong> ظƒظ„ظ…ط© "ظ‚ظ‡ظˆط©" ظپظٹ ط§ظ„ظ„ط؛ط© ط§ظ„ط¹ط±ط¨ظٹط© ط§ظ„ظ‚ط¯ظٹظ…ط© ظƒط§ظ†طھ طھط¹ظ†ظٹ "ط§ظ„ط®ظ…ط±" ط£ظˆ "ظ…ط§ ظٹظڈط°ظ‡ط¨ ط¨ط§ظ„ظ†ظˆظ…"طŒ ط«ظ… ط£طµط¨ط­طھ ط§ط³ظ…ط§ظ‹ ظ„ظ…ط´ط±ظˆط¨ ط§ظ„ط¨ظ†. ظˆظ…ظ†ظ‡ط§ ط§ط´طھظ‚ظ‘طھ ظƒظ„ظ…ط© "cafأ©" ظپظٹ ظ…ط¹ط¸ظ… ط§ظ„ظ„ط؛ط§طھ ط§ظ„ط£ظˆط±ظˆط¨ظٹط©! ط£ظٹط¶ط§ظ‹طŒ ط´ط¬ط±ط© ط§ظ„ط¨ظ† ط§ظ„ظˆط­ظٹط¯ط© ظپظٹ ط§ظ„ط¨ظٹطھ ط§ظ„ط²ط¬ط§ط¬ظٹ ظپظٹ ط£ظ…ط³طھط±ط¯ط§ظ… ط¹ط§ظ… 1700 ظƒط§ظ†طھ ط£طµظ„ ظ…ط¹ط¸ظ… ظ…ط²ط§ط±ط¹ ط§ظ„ط¨ظ† ظپظٹ ط£ظ…ط±ظٹظƒط§ ط§ظ„ظˆط³ط·ظ‰ ظˆط§ظ„ط¬ظ†ظˆط¨ظٹط©.</div>
<h3>âک• ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ط®طھطµط© vs ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„طھط¬ط§ط±ظٹط© â€” ط§ظ„ظپط±ظ‚ ط§ظ„ظ„ظٹ ظ„ط§ط²ظ… طھظپظ‡ظ…ظ‡</h3>
<div class="hl" style="background:linear-gradient(135deg,rgba(212,168,90,.12),rgba(212,168,90,.04));border:1px solid rgba(212,168,90,.2);padding:18px 22px;border-radius:12px">
<p style="margin-bottom:8px"><strong>ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„طھط¬ط§ط±ظٹط© (Commercial Coffee):</strong> ظ‡ظٹ ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ„ظٹ ط¨طھط´ظˆظپظ‡ط§ ظپظٹ ط§ظ„ط³ظˆط¨ط± ظ…ط§ط±ظƒطھ â€” ظ…ظ†طھط¬ط© ط¨ظƒظ…ظٹط§طھ ط¶ط®ظ…ط©طŒ ط؛ط§ظ„ط¨ط§ظ‹ ط±ظˆط¨ظˆط³طھط§ ط£ظˆ ط£ط±ط§ط¨ظٹظƒط§ ظ…ظ†ط®ظپط¶ط© ط§ظ„ط¬ظˆط¯ط©طŒ ظ…ط­ظ…طµط© ظ…ظ† ط´ظ‡ظˆط±طŒ ط·ط¹ظ…ظ‡ط§ ظ…ط±ط© ظˆظ…ظˆط­ط¯ط©. <strong>%90 ظ…ظ† ط§ظ„ظ‚ظ‡ظˆط© ظپظٹ ط§ظ„ط¹ط§ظ„ظ… طھط¬ط§ط±ظٹط©.</strong></p>
<p style="margin-bottom:8px"><strong>ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ط®طھطµط© (Specialty Coffee):</strong> ظ‡ظٹ <strong>ط£ط¬ظˆط¯ 3%</strong> ظ…ظ† ط¥ظ†طھط§ط¬ ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط¹ط§ظ„ظ…ظٹ. ط­ط§طµظ„ط© ط¹ظ„ظ‰ 80+ ظ†ظ‚ط·ط© ظپظٹ طھظ‚ظٹظٹظ… SCA. ط¨ظ† ظ…ظˆط³ظ…ظٹ ط·ط§ط²ط¬طŒ ظ…ط­ظ…طµ ط¨ط¹ظ†ط§ظٹط©طŒ ظ„ظ‡ ظ†ظƒظ‡ط§طھ ظ…ظ…ظٹط²ط©. <strong>Specialty Coffee ظ…ط´ ظ…ط¬ط±ط¯ ظ‚ظ‡ظˆط© â€” ظ‡ظٹ طھط¬ط±ط¨ط©.</strong></p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
  <div style="background:rgba(220,80,60,.06);border-radius:8px;padding:10px;text-align:center">
    <div style="font-size:1.4rem;color:#dc503c;font-weight:700">â‌Œ طھط¬ط§ط±ظٹط©</div>
    <div style="font-size:.8rem;color:#a09890;margin-top:4px">ط¬ظˆط¯ط© ظ…ظ†ط®ظپط¶ط© â€¢ ظ†ظƒظ‡ط© ظ…ظˆط­ط¯ط© â€¢ ط¥ظ†طھط§ط¬ ط¶ط®ظ…</div>
  </div>
  <div style="background:rgba(76,175,80,.06);border-radius:8px;padding:10px;text-align:center">
    <div style="font-size:1.4rem;color:#4caf50;font-weight:700">âœ… ظ…ط®طھطµط©</div>
    <div style="font-size:.8rem;color:#a09890;margin-top:4px">ط¬ظˆط¯ط© ط¹ط§ظ„ظٹط© â€¢ ظ†ظƒظ‡ط§طھ ظ…ظ…ظٹط²ط© â€¢ ط¥ظ†طھط§ط¬ ظ…ط­ط¯ظˆط¯</div>
  </div>
</div>
</div>
<p style="margin-top:10px">ط·ظˆط§ظ„ ط±ط­ظ„طھظƒ ظپظٹ ط£ظƒط§ط¯ظٹظ…ظٹط© ط§ظ„ط£ظٹط§ط¯ظٹ ط§ظ„ط¨ظٹط¶ط§ط،طŒ ط±ط­ طھطھط¹ظ„ظ… ظ„ظٹظ‡ ط§ظ„ظپط±ظ‚ ط¨ظٹظ† ط§ظ„ظ†ظˆط¹ظٹظ† ظ…ط´ ظ…ط¬ط±ط¯ ظپط±ظ‚ ظپظٹ ط§ظ„ط³ط¹ط± â€” ظ‡ظˆ ظپط±ظ‚ ظپظٹ ظƒظ„ ط­ط§ط¬ط©: ط§ظ„ط²ط±ط§ط¹ط©طŒ ط§ظ„ظ…ط¹ط§ظ„ط¬ط©طŒ ط§ظ„طھط­ظ…ظٹطµطŒ ط§ظ„طھط­ط¶ظٹط±طŒ ظˆط§ظ„طھط°ظˆظ‚.</p>
`,
  en: `
<h3>ًں“– The Story of Coffee Discovery â€” The Legend of Kaldi</h3>
<p>The Ethiopian legend tells of a goat herder named <strong>Kaldi</strong> who lived in the highlands of <strong>Kaffa</strong> region, southwestern Ethiopia, around the 9th century AD. Kaldi noticed his goats became <strong>unusually energetic</strong> after eating red berries from a strange tree â€” they were jumping and running with remarkable vitality.</p>
<div class="img-c"><img src="${photo('kaldy')}" alt="" loading="lazy"><div class="cap">ًںگگ Kaldi watches his goats dance â€” the first moment of coffee discovery</div></div>
<p>Kaldi tried the berries himself and immediately felt <strong>alert and refreshed</strong>. He took some to a <strong>nearby monastery</strong>, where the monks were skeptical. But after trying the berries, they found they helped them stay awake during night prayers. Thus, according to legend, coffee's journey with humanity began.</p>
<div class="img-c"><img src="${photo('kaldy_monk')}" alt="" loading="lazy"><div class="cap">ًںگگ Kaldi at the monastery â€” coffee reaches the monks</div></div>
<h3>ًںŒ؟ The Ethiopian Coffee Ceremony â€” A Living Tradition</h3>
<p>In Ethiopia today, the <strong>coffee ceremony (Buna Tetu)</strong> is still practiced in every home and village. A two-hour ritual: green beans are roasted over fire in a flat pan until incense-like scents rise, then ground with a mortar and pestle, and boiled in the traditional clay pot (jebena). It is served to the patriarch first, then to guests in order of importance. The ceremony repeats three times â€” the first round is called "awol," the second "kale," and the third "baraka." This tradition embodies Ethiopian hospitality culture spanning over a thousand years.</p>
<h3>ًں“œ Historical Evidence â€” Fact and Legend</h3>
<p>Despite Kaldi's fame, the <strong>earliest documented evidence</strong> of coffee drinking dates to <strong>15th century Yemen</strong>. Yemeni Sufis used coffee (which they called "qahwa") to stay awake during nighttime dhikr and worship. Coffee spread from Yemen to Mecca, Cairo, Damascus, and Istanbul.</p>
<p><strong>The spread through the Islamic world</strong> was rapid thanks to pilgrims and traders. By 1500, coffee was known in every major city of the Islamic world â€” from Mecca to Cairo, from Damascus to Aleppo. Coffeehouses opened and became centers for music, poetry, and political discussion, sometimes alarming rulers. In Cairo, they were called "schools of knowledge" for gathering scholars and students.</p>
<div class="hl"><strong>ًں“ٹ Timeline:</strong><br>â€¢ 9th century: Ethiopian legend (Kaldi)<br>â€¢ 1000-1400: Coffee drinking spreads among Ethiopian tribes<br>â€¢ 1400-1450: Sufis in Yemen drink coffee<br>â€¢ 1511: First attempt to ban coffee in Mecca<br>â€¢ 1550: Coffeehouses spread in Cairo &amp; Istanbul<br>â€¢ 1615: Coffee arrives in Europe (Venice)<br>â€¢ 1652: First coffeehouse in London<br>â€¢ 1683: First coffeehouse in Vienna after the siege<br>â€¢ 1727: Coffee brought to Brazil<br>â€¢ 1901: First espresso machine (Bezzera)</div>
<h3>ًںŒچ Coffee Goes to the New World</h3>
<p>In the 17th century, the <strong>Dutch</strong> tried to break Yemen's coffee monopoly. They successfully smuggled coffee seeds from Mecca to Sri Lanka and Java (Indonesia), establishing the first coffee farms outside Africa and Yemen. In 1727, the Portuguese sent coffee seeds from Macau to Brazil â€” which later became the world's largest coffee producer. From a single tree smuggled in a Portuguese diplomat's luggage, the Brazilian coffee industry was born, now producing over 3 billion kilograms annually.</p>
<div class="quiz-box"><strong>ًں’¬ Did You Know?</strong> The word "coffee" derives from the Arabic "qahwa" (ظ‚ظ‡ظˆط©), which originally meant "wine" or "that which prevents sleep." It evolved into "cafأ©" in most European languages! Also, a single coffee tree in the Amsterdam Botanical Garden in 1700 was the ancestor of most coffee farms in Central and South America.</div>
<h3>âک• Specialty vs Commercial Coffee â€” The Key Difference</h3>
<div class="hl" style="background:linear-gradient(135deg,rgba(212,168,90,.12),rgba(212,168,90,.04));border:1px solid rgba(212,168,90,.2);padding:18px 22px;border-radius:12px">
<p style="margin-bottom:8px"><strong>Commercial Coffee:</strong> The coffee you find in supermarkets â€” mass-produced, mostly low-grade Robusta or Arabica, roasted months ago, uniform and bitter taste. <strong>90% of the world's coffee is commercial.</strong></p>
<p style="margin-bottom:8px"><strong>Specialty Coffee:</strong> The <strong>top 3%</strong> of global coffee production. Scores 80+ points on SCA grading. Seasonally fresh, carefully roasted, with distinctive flavor notes. <strong>Specialty Coffee is not just coffee â€” it's an experience.</strong></p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
  <div style="background:rgba(220,80,60,.06);border-radius:8px;padding:10px;text-align:center">
    <div style="font-size:1.4rem;color:#dc503c;font-weight:700">â‌Œ Commercial</div>
    <div style="font-size:.8rem;color:#a09890;margin-top:4px">Low quality â€¢ Uniform flavor â€¢ Mass production</div>
  </div>
  <div style="background:rgba(76,175,80,.06);border-radius:8px;padding:10px;text-align:center">
    <div style="font-size:1.4rem;color:#4caf50;font-weight:700">âœ… Specialty</div>
    <div style="font-size:.8rem;color:#a09890;margin-top:4px">High quality â€¢ Distinct flavors â€¢ Limited production</div>
  </div>
</div>
</div>
<p style="margin-top:10px">Throughout your journey in White Hands Academy, you'll learn why the difference between these two is not just about price â€” it's about everything: farming, processing, roasting, brewing, and tasting.</p>
`
};

L['A1-1'] = {
  ar: `
<h3>ًں”¬ ط§ظ„طھطµظ†ظٹظپ ط§ظ„ظ†ط¨ط§طھظٹ ظ„ظ„ظ‚ظ‡ظˆط©</h3>
<p>ط§ظ„ظ‚ظ‡ظˆط© طھظ†طھظ…ظٹ ط¥ظ„ظ‰ <strong>ط§ظ„ظ…ظ…ظ„ظƒط© ط§ظ„ظ†ط¨ط§طھظٹط© (Plantae)</strong>طŒ ظˆطھط­ط¯ظٹط¯ط§ظ‹ ط¥ظ„ظ‰ <strong>ط§ظ„ظپطµظٹظ„ط© ط§ظ„ظپظڈظˆظ’ظٹظژط© (Rubiaceae)</strong>. <strong>ط¬ظ†ط³ ط§ظ„ظ‚ظ‡ظˆط© (Coffea)</strong> ظٹط¶ظ… ط­ظˆط§ظ„ظٹ 130 ظ†ظˆط¹ط§ظ‹طŒ ظ„ظƒظ† <strong>ظ†ظˆط¹ظٹظ† ظپظ‚ط·</strong> ظٹط³ظٹط·ط±ط§ظ† ط¹ظ„ظ‰ ط§ظ„ط¥ظ†طھط§ط¬ ط§ظ„طھط¬ط§ط±ظٹ ط§ظ„ط¹ط§ظ„ظ…ظٹ.</p>
<div class="img-c"><img src="${photo('farm')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًںŒ± ط£ظ†ظˆط§ط¹ ط§ظ„ط¨ظ† ط§ظ„ط±ط¦ظٹط³ظٹط© â€” ط£ط±ط§ط¨ظٹظƒط§ ظˆط±ظˆط¨ظˆط³طھط§</div></div>
<table><tr><th>ط§ظ„ظ…ط³طھظˆظ‰ ط§ظ„طھطµظ†ظٹظپظٹ</th><th>ط§ظ„ط§ط³ظ…</th></tr><tr><td>ط§ظ„ظ…ظ…ظ„ظƒط©</td><td>Plantae</td></tr><tr><td>ط§ظ„ط´ط¹ط¨ط©</td><td>Magnoliophyta</td></tr><tr><td>ط§ظ„ط·ط§ط¦ظپط©</td><td>Magnoliopsida</td></tr><tr><td>ط§ظ„ط±طھط¨ط©</td><td>Gentianales</td></tr><tr><td>ط§ظ„ظپطµظٹظ„ط©</td><td>Rubiaceae</td></tr><tr><td>ط§ظ„ط¬ظ†ط³</td><td><em>Coffea</em></td></tr></table>
<h3>ًںŒ± ط£ط±ط§ط¨ظٹظƒط§ (Coffea arabica)</h3>
<p>ظٹط´ظƒظ„ <strong>60-70%</strong> ظ…ظ† ط§ظ„ط¥ظ†طھط§ط¬ ط§ظ„ط¹ط§ظ„ظ…ظٹ. ظٹظڈط¹طھظ‚ط¯ ط£ظ†ظ‡ <strong>ظ‡ط¬ظٹظ† ط·ط¨ظٹط¹ظٹ (tetraploid)</strong> ط¨ظٹظ† <em>Coffea eugenioides</em> ظˆ <em>Coffea canephora</em>. ظ†ط³ط¨ط© ط§ظ„ظƒط§ظپظٹظٹظ†: 0.8-1.4%. ظٹظ†ظ…ظˆ ط¹ظ„ظ‰ ط§ط±طھظپط§ط¹ 600-2200 ظ…طھط±. ظ†ظƒظ‡طھظ‡: ظ…ط¹ظ‚ط¯ط©طŒ ط²ظ‡ط±ظٹط©طŒ ظپط§ظƒظ‡ظٹط©.</p>
<h3>ًںŒ؟ ط±ظˆط¨ظˆط³طھط§ (Coffea canephora)</h3>
<p>ظٹط´ظƒظ„ <strong>30-40%</strong> ظ…ظ† ط§ظ„ط¥ظ†طھط§ط¬. ظ…ظ‚ط§ظˆظ… ظ„ظ„ط£ظ…ط±ط§ط¶طŒ ظٹط­طھظˆظٹ ط¹ظ„ظ‰ ظƒط§ظپظٹظٹظ† ط£ظƒط«ط± (1.7-4%). ظٹظ†ظ…ظˆ ط¹ظ„ظ‰ ط§ط±طھظپط§ط¹ط§طھ ظ…ظ†ط®ظپط¶ط© (0-800 ظ…طھط±). ظ†ظƒظ‡طھظ‡: ظ‚ظˆظٹط©طŒ طھط±ط§ط¨ظٹط©طŒ ظ…ط±ط©. ظٹظڈط³طھط®ط¯ظ… ط£ط³ط§ط³ط§ظ‹ ظپظٹ ط§ظ„ظ‚ظ‡ظˆط© ط³ط±ظٹط¹ط© ط§ظ„طھط­ط¶ظٹط± ظˆط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ط§ظ„ط¥ظٹط·ط§ظ„ظٹ ط§ظ„طھظ‚ظ„ظٹط¯ظٹ.</p>
<div class="info-box"><strong>ًں“ٹ ظ…ظ‚ط§ط±ظ†ط©:</strong> ط§ظ„ط£ط±ط§ط¨ظٹظƒط§ طھط­طھظˆظٹ ط¹ظ„ظ‰ ط³ظƒط±ظٹط§طھ ط£ظƒط«ط± ظˆط¯ظ‡ظˆظ† ط£ظپط¶ظ„ â€” ظˆظ„ظ‡ط°ط§ ظ†ظƒظ‡طھظ‡ط§ ط£ط­ظ„ظ‰ ظˆط£ط¹ظ‚ط¯. ط§ظ„ط±ظˆط¨ظˆط³طھط§ طھط­طھظˆظٹ ط¹ظ„ظ‰ ظƒط§ظپظٹظٹظ† ط£ظƒط«ط± ظٹظ…ظ†ط­ظ‡ط§ ظ…ط±ط§ط±ط© ظˆظ‚ظˆط© ط¬ط³ظ… (Body) ط£ظƒط¨ط±.</div>
`,
  en: `
<h3>ًں”¬ Botanical Classification of Coffee</h3>
<p>Coffee belongs to the <strong>Plantae kingdom</strong>, specifically the <strong>Rubiaceae family</strong>. The <strong>Coffea genus</strong> includes about 130 species, but only <strong>two species</strong> dominate global commercial production.</p>
<div class="img-c"><img src="${photo('farm')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًںŒ± Main Coffee Species â€” Arabica & Robusta</div></div>
<table><tr><th>Taxonomic Level</th><th>Name</th></tr><tr><td>Kingdom</td><td>Plantae</td></tr><tr><td>Division</td><td>Magnoliophyta</td></tr><tr><td>Class</td><td>Magnoliopsida</td></tr><tr><td>Order</td><td>Gentianales</td></tr><tr><td>Family</td><td>Rubiaceae</td></tr><tr><td>Genus</td><td><em>Coffea</em></td></tr></table>
<h3>ًںŒ± Arabica (Coffea arabica)</h3>
<p>Accounts for <strong>60-70%</strong> of world production. A <strong>natural hybrid (tetraploid)</strong> between <em>Coffea eugenioides</em> and <em>Coffea canephora</em>. Caffeine content: 0.8-1.4%. Grows at 600-2200m elevation. Flavor: complex, floral, fruity with bright acidity.</p>
<h3>ًںŒ؟ Robusta (Coffea canephora)</h3>
<p>Accounts for <strong>30-40%</strong> of production. Disease-resistant, higher caffeine content (1.7-4%). Grows at lower altitudes (0-800m). Flavor: strong, earthy, bitter. Primarily used in instant coffee and traditional Italian espresso blends.</p>
<div class="info-box"><strong>ًں“ٹ Comparison:</strong> Arabica contains more sugars and better lipids â€” which is why its flavor is sweeter and more complex. Robusta has more caffeine giving it bitterness and heavier body.</div>
`
};

L['A1-2'] = {
  ar: `
<h3>ًںŒچ ط±ط­ظ„ط© ط§ظ„ظ‚ظ‡ظˆط© ط­ظˆظ„ ط§ظ„ط¹ط§ظ„ظ…</h3>
<p>ظ‚طµط© ط§ظ†طھط´ط§ط± ط§ظ„ظ‚ظ‡ظˆط© ظ…ظ† ط؛ط§ط¨ط§طھ ط¥ط«ظٹظˆط¨ظٹط§ ط¥ظ„ظ‰ ظƒظ„ ط±ظƒظ† ظ…ظ† ط£ط±ظƒط§ظ† ط§ظ„ط¹ط§ظ„ظ… ظ‡ظٹ <strong>ط£ط¹ط¸ظ… ظ‚طµطµ ط§ظ„طھط¬ط§ط±ط© ظˆط§ظ„ط«ظ‚ط§ظپط©</strong> ظپظٹ ط§ظ„طھط§ط±ظٹط® ط§ظ„ط¨ط´ط±ظٹ.</p>
<div class="img-c"><img src="\${photo('map')}" alt=""><div class="cap">ًںŒچ ط±ط­ظ„ط© ط§ظ„ط¨ظ† ظ…ظ† ط¥ط«ظٹظˆط¨ظٹط§ ط¥ظ„ظ‰ ط§ظ„ط¹ط§ظ„ظ…</div></div>
<div class="img-c"><img src="${photo('map')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًںŒچ ط§ظ†طھط´ط§ط± ط§ظ„ظ‚ظ‡ظˆط© ظ…ظ† ط¥ط«ظٹظˆط¨ظٹط§ ط¥ظ„ظ‰ ط§ظ„ط¹ط§ظ„ظ…</div></div>
<h3>ًں‡ھًں‡¹ ط¥ط«ظٹظˆط¨ظٹط§ â€” ظ…ظ‡ط¯ ط§ظ„ظ‚ظ‡ظˆط©</h3>
<p>ط§ظ„ظ…ظˆط·ظ† ط§ظ„ط£طµظ„ظٹ ظ„ظ„ط¨ظ† ط§ظ„ط¹ط±ط¨ظٹ ظ‡ظˆ <strong>ط؛ط§ط¨ط§طھ ظƒط§ظپط§ (Kaffa)</strong> ظپظٹ ط¬ظ†ظˆط¨ ط؛ط±ط¨ ط¥ط«ظٹظˆط¨ظٹط§. ظ„ط§ طھط²ط§ظ„ ط£ط´ط¬ط§ط± ط§ظ„ط¨ظ† ط§ظ„ط¨ط±ظٹ طھظ†ظ…ظˆ ط·ط¨ظٹط¹ظٹط§ظ‹ طھط­طھ ط¸ظ„ ط§ظ„ط£ط´ط¬ط§ط± ط§ظ„ط¹ظ…ظ„ط§ظ‚ط©.</p>
<h3>ًں‡¾ًں‡ھ ط§ظ„ظٹظ…ظ† â€” ط¨ظˆط§ط¨ط© ط§ظ„طھط¬ط§ط±ط©</h3>
<p>ظپظٹ ط§ظ„ظ‚ط±ظ† ط§ظ„ط®ط§ظ…ط³ ط¹ط´ط±طŒ ط£طµط¨ط­طھ <strong>ظ…ط¯ظٹظ†ط© ط§ظ„ظ…ظڈط®ط§ (Mocha)</strong> ط§ظ„ظ…ظٹظ†ط§ط، ط§ظ„ط±ط¦ظٹط³ظٹ ظ„طھطµط¯ظٹط± ط§ظ„ظ‚ظ‡ظˆط©طŒ ظˆظ…ظ†ظ‡ط§ ط§ط´طھظ‚ ط§ط³ظ… "ظ…ظˆظƒط§". ط·ظˆط± ط§ظ„ظ…ط²ط§ط±ط¹ظˆظ† ط§ظ„ظٹظ…ظ†ظٹظˆظ† ظ†ط¸ط§ظ… ط§ظ„ط±ظٹ ظپظٹ ط§ظ„ظ…ط¯ط±ط¬ط§طھ ط§ظ„ط¬ط¨ظ„ظٹط©.</p>
<h3>ًں‡¹ًں‡· ط§ظ„ط¯ظˆظ„ط© ط§ظ„ط¹ط«ظ…ط§ظ†ظٹط© â€” ط§ظ„ظ…ظ‚ط§ظ‡ظٹ ط§ظ„ط£ظˆظ„ظ‰</h3>
<p>ط§ظپطھطھط­ ط£ظˆظ„ ظ…ظ‚ظ‡ظ‰ ظپظٹ <strong>ط§ط³ط·ظ†ط¨ظˆظ„</strong> ط¹ط§ظ… 1555. ط£طµط¨ط­طھ ط§ظ„ظ…ظ‚ط§ظ‡ظٹ ظ…ط±ط§ظƒط² ظ„ظ„ظ‚ط§ط،ط§طھ ط§ظ„ط§ط¬طھظ…ط§ط¹ظٹط© ظˆط§ظ„ط³ظٹط§ط³ظٹط© â€” ظ„ط¯ط±ط¬ط© ط£ظ†ظ‡ط§ ط³ظڈظ…ظٹطھ "ظ…ط¯ط§ط±ط³ ط§ظ„ط­ظƒظ…ط©".</p>
<h3>ًں‡®ًں‡¹ ط£ظˆط±ظˆط¨ط§ â€” ط«ظˆط±ط© ط§ظ„ظ‚ظ‡ظˆط©</h3>
<p>ظˆطµظ„طھ ط§ظ„ظ‚ظ‡ظˆط© ط¥ظ„ظ‰ <strong>ط§ظ„ط¨ظ†ط¯ظ‚ظٹط©</strong> ط¹ط§ظ… 1615. ظپظٹ ط¹ط§ظ… 1683طŒ ط¨ط¹ط¯ ط­طµط§ط± ظپظٹظٹظ†ط§طŒ ط§ظپطھطھط­ ط£ظˆظ„ ظ…ظ‚ظ‡ظ‰ ظپظٹ ط§ظ„ظ†ظ…ط³ط§. ظپظٹ ط§ظ„ظ‚ط±ظ† ط§ظ„ط«ط§ظ…ظ† ط¹ط´ط±طŒ ط§ظ†طھط´ط±طھ ط§ظ„ظ…ظ‚ط§ظ‡ظٹ ظپظٹ ظƒظ„ ط£ظ†ط­ط§ط، ط£ظˆط±ظˆط¨ط§طŒ ظˆط£طµط¨ط­طھ ظ…ط±ط§ظƒط² ظ„ظ„ظپظƒط± ظˆط§ظ„ط«ظ‚ط§ظپط© ظˆط§ظ„طھط¬ط§ط±ط©.</p>
<div class="hl"><strong>ًںŒژ ط­ط²ط§ظ… ط§ظ„ظ‚ظ‡ظˆط©:</strong> ظٹظ‚ط¹ ط¨ظٹظ† ظ…ط¯ط§ط± ط§ظ„ط³ط±ط·ط§ظ† ظˆظ…ط¯ط§ط± ط§ظ„ط¬ط¯ظٹ. ط§ظ„ط¯ظˆظ„ ط§ظ„ظ…ظ†طھط¬ط© ظ„ظ„ط¨ظ† ط§ظ„ط¹ط±ط¨ظٹ: ط¥ط«ظٹظˆط¨ظٹط§طŒ ظƒظٹظ†ظٹط§طŒ ظƒظˆظ„ظˆظ…ط¨ظٹط§طŒ ط§ظ„ط¨ط±ط§ط²ظٹظ„طŒ ظƒظˆط³طھط§ط±ظٹظƒط§طŒ ط؛ظˆط§طھظٹظ…ط§ظ„ط§طŒ ط§ظ„ظٹظ…ظ†. ط£ط´ظ‡ط±ظ‡ط§: ظƒظˆظ„ظˆظ…ط¨ظٹط§ (ظ†ط§ط¹ظ… ظˆظ…طھظˆط§ط²ظ†)طŒ ط¥ط«ظٹظˆط¨ظٹط§ (ط²ظ‡ط±ظٹ ظˆظپط§ظƒظ‡ظٹ)طŒ ظƒظٹظ†ظٹط§ (ط­ظ…ظˆط¶ط© ط¹ط§ظ„ظٹط© ظˆظ†ظƒظ‡ط§طھ ط§ظ„طھظˆطھ).</div>
`,
  en: `
<h3>ًںŒچ Coffee's Journey Around the World</h3>
<p>The spread of coffee from Ethiopian forests to every corner of the world is one of the <strong>greatest trade and culture stories</strong> in human history.</p>
<div class="img-c"><img src="\${photo('map')}" alt=""><div class="cap">ًںŒچ Coffee's Journey from Ethiopia to the World</div></div>
<div class="img-c"><img src="${photo('map')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًںŒچ Coffee's Spread from Ethiopia Across the World</div></div>
<h3>ًں‡ھًں‡¹ Ethiopia â€” The Birthplace</h3>
<p>The original home of Arabica coffee is the <strong>Kaffa forests</strong> in southwestern Ethiopia. Wild coffee trees still grow naturally under the canopy of giant forest trees.</p>
<h3>ًں‡¾ًں‡ھ Yemen â€” The Trade Gateway</h3>
<p>In the 15th century, the port city of <strong>Mocha</strong> became the main export hub for coffee, giving us the name "Mocha". Yemeni farmers developed terraced irrigation systems on steep mountain slopes.</p>
<h3>ًں‡¹ًں‡· Ottoman Empire â€” The First Coffeehouses</h3>
<p>The first coffeehouse in <strong>Istanbul</strong> opened in 1555. Coffeehouses became centers for social and political gatherings â€” so influential they were called "schools of wisdom."</p>
<h3>ًں‡®ًں‡¹ Europe â€” The Coffee Revolution</h3>
<p>Coffee reached <strong>Venice</strong> in 1615. In 1683, after the Siege of Vienna, the first coffeehouse opened in Austria. By the 18th century, coffeehouses spread across Europe, becoming centers of thought, culture, and commerce.</p>
<div class="hl"><strong>ًںŒژ The Coffee Belt:</strong> Located between the Tropic of Cancer and the Tropic of Capricorn. Arabica-producing countries: Ethiopia, Kenya, Colombia, Brazil, Costa Rica, Guatemala, Yemen. Famous origins: Colombia (smooth, balanced), Ethiopia (floral, fruity), Kenya (high acidity, berry notes).</div>
`
};

L['A1-3'] = {
  ar: `
<h3>ًں”¬ ط§ظ„طھط´ط±ظٹط­ ط§ظ„ظƒط§ظ…ظ„ ظ„ط«ظ…ط±ط© ط§ظ„ظ‚ظ‡ظˆط©</h3>
<p>ط«ظ…ط±ط© ط§ظ„ظ‚ظ‡ظˆط© ظ‡ظٹ <strong>ط«ظ…ط±ط© ط­ط³ظ„ط© (drupe)</strong>طŒ طھط´ط¨ظ‡ ط§ظ„ظƒط±ط². طھط­طھظˆظٹ ط¹ظ„ظ‰ ط¹ط¯ط© ط·ط¨ظ‚ط§طھطŒ ظ„ظƒظ„ ظ…ظ†ظ‡ط§ ط¯ظˆط± ظپظٹ ط§ظ„ظ†ظƒظ‡ط© ط§ظ„ظ†ظ‡ط§ط¦ظٹط©.</p>
<div class="img-c"><img src="\${photo('cherry')}" alt=""><div class="cap">ًں”¬ طھط´ط±ظٹط­ ط«ظ…ط±ط© ط§ظ„ظ‚ظ‡ظˆط© â€” 5 ط·ط¨ظ‚ط§طھ ظ…ظ† ط§ظ„ط¨ط°ط±ط© ط¥ظ„ظ‰ ط§ظ„ظ‚ط´ط±ط©</div></div>
<div class="img-c"><img src="${photo('cherry')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًں”¬ طھط´ط±ظٹط­ ط­ط¨ط© ط§ظ„ظ‚ظ‡ظˆط© â€” ظ…ظ† ط§ظ„ط¨ط°ط±ط© ط¥ظ„ظ‰ ط§ظ„ظ…ط´ط±ظˆط¨</div></div>
<table><tr><th>ط§ظ„ط·ط¨ظ‚ط©</th><th>ط§ظ„ظˆط¸ظٹظپط©</th></tr><tr><td><strong>ط§ظ„ظ‚ط´ط±ط© ط§ظ„ط®ط§ط±ط¬ظٹط© (Exocarp)</strong></td><td>ط­ظ…ط§ظٹط© ط§ظ„ط«ظ…ط±ط©طŒ ظ„ظˆظ†ظ‡ط§ ط£ط­ظ…ط± ط¹ظ†ط¯ ط§ظ„ظ†ط¶ط¬</td></tr><tr><td><strong>ط§ظ„ظ„ط¨ (Mucilage)</strong></td><td>ط·ط¨ظ‚ط© ط­ظ„ظˆط© ط؛ظ†ظٹط© ط¨ط§ظ„ط³ظƒط±ظٹط§طھ â€” طھط¤ط«ط± ط¹ظ„ظ‰ ط§ظ„طھط®ظ…ظٹط±</td></tr><tr><td><strong>ط§ظ„ط؛ظ„ط§ظپ ط§ظ„ط±ظ‚ظٹظ‚ (Parchment)</strong></td><td>ط؛ظ„ط§ظپ ظˆط§ظ‚ظچ ظٹط´ط¨ظ‡ ط§ظ„ظˆط±ظ‚ ط§ظ„ظ…ظ‚ظˆظ‰</td></tr><tr><td><strong>ط·ط¨ظ‚ط© ط§ظ„ظپط¶ط© (Silver Skin)</strong></td><td>ط؛ط´ط§ط، ط±ظ‚ظٹظ‚ â€” ظٹطھط­ظˆظ„ ط¥ظ„ظ‰ chaff ط£ط«ظ†ط§ط، ط§ظ„طھط­ظ…ظٹطµ</td></tr><tr><td><strong>ط¬ظ†ظٹظ† ط§ظ„ط¨ط°ط±ط© (Endosperm)</strong></td><td>ظ‡ط°ط§ ظ‡ظˆ "ط§ظ„ط¨ظ†" â€” ط§ظ„ط¬ط²ط، ط§ظ„ط°ظٹ ظ†ط­ظ…طµظ‡ ظˆظ†ط´ط±ط¨ظ‡</td></tr></table>
<h3>ًں§ھ ط§ظ„طھط±ظƒظٹط¨ ط§ظ„ظƒظٹظ…ظٹط§ط¦ظٹ</h3>
<p>طھط­طھظˆظٹ ط­ط¨ط© ط§ظ„ط¨ظ† ط§ظ„ط®ط¶ط±ط§ط، ط¹ظ„ظ‰: <strong>ظƒط§ظپظٹظٹظ†</strong> (0.8-2.5%) â€” ط§ظ„ظ…ظ†ط¨ظ‡ ط§ظ„ط±ط¦ظٹط³ظٹ. <strong>ط£ط­ظ…ط§ط¶ ط§ظ„ظƒظ„ظˆط±ظˆط¬ظٹظ†ظٹظƒ</strong> (5-8%) â€” ظ…ط¶ط§ط¯ط§طھ ط£ظƒط³ط¯ط© ظ‚ظˆظٹط©. <strong>ط³ظƒط±ظٹط§طھ</strong> (6-9%) â€” ظ…طµط¯ط± ط§ظ„ط­ظ„ط§ظˆط©. <strong>ط¯ظ‡ظˆظ†</strong> (15-17%) â€” طھط­ظ…ظ„ ط§ظ„ظ†ظƒظ‡ط§طھ. <strong>ط£ظ„ظٹط§ظپ</strong> (23-28%).</p>
<div class="info-box"><strong>ًں’، ظ…ط¹ظ„ظˆظ…ط© ظ…ظ‡ظ…ط©:</strong> ط£ط«ظ†ط§ط، ط§ظ„طھط­ظ…ظٹطµطŒ ظٹطھط¶ط§ط¹ظپ ط­ط¬ظ… ط­ط¨ط© ط§ظ„ط¨ظ† (ظٹط²ظٹط¯ 50-80%) ظˆطھظپظ‚ط¯ 15-20% ظ…ظ† ظˆط²ظ†ظ‡ط§ ط¨ط³ط¨ط¨ طھط¨ط®ط± ط§ظ„ظ…ط§ط، ظˆطھط­ظ„ظ„ ط§ظ„ظ…ط±ظƒط¨ط§طھ.</div>
<div class="quiz-box"><strong>ًں’¬ ط§ط®طھط¨ط§ط± ط³ط±ظٹط¹:</strong> ط£ظٹ ط·ط¨ظ‚ط© ظ…ظ† ط«ظ…ط±ط© ط§ظ„ظ‚ظ‡ظˆط© طھطھط­ظˆظ„ ط¥ظ„ظ‰ "chaff" ط£ط«ظ†ط§ط، ط§ظ„طھط­ظ…ظٹطµطں (ط§ظ„ط¥ط¬ط§ط¨ط©: ط·ط¨ظ‚ط© ط§ظ„ظپط¶ط© / Silver Skin)</div>
`,
  en: `
<h3>ًں”¬ Complete Anatomy of the Coffee Cherry</h3>
<p>The coffee fruit is a <strong>drupe</strong>, similar to a cherry. It contains several layers, each playing a role in the final flavor.</p>
<div class="img-c"><img src="\${photo('cherry')}" alt=""><div class="cap">ًں”¬ Coffee Cherry Anatomy â€” 5 Layers from Seed to Skin</div></div>
<div class="img-c"><img src="${photo('cherry')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًں”¬ Coffee Bean Anatomy â€” From Seed to Cup</div></div>
<table><tr><th>Layer</th><th>Function</th></tr><tr><td><strong>Exocarp (Outer Skin)</strong></td><td>Protects the fruit, turns red when ripe</td></tr><tr><td><strong>Mucilage (Pulp)</strong></td><td>Sweet layer rich in sugars â€” affects fermentation</td></tr><tr><td><strong>Parchment</strong></td><td>Protective layer like thin cardboard</td></tr><tr><td><strong>Silver Skin</strong></td><td>Thin membrane â€” becomes chaff during roasting</td></tr><tr><td><strong>Endosperm</strong></td><td>This is the "bean" â€” what we roast and brew</td></tr></table>
<h3>ًں§ھ Chemical Composition</h3>
<p>Green coffee bean contains: <strong>Caffeine</strong> (0.8-2.5%) â€” main stimulant. <strong>Chlorogenic acids</strong> (5-8%) â€” powerful antioxidants. <strong>Sugars</strong> (6-9%) â€” source of sweetness. <strong>Lipids</strong> (15-17%) â€” carry flavor compounds. <strong>Fiber</strong> (23-28%).</p>
<div class="info-box"><strong>ًں’، Key Fact:</strong> During roasting, the coffee bean expands by 50-80% in volume and loses 15-20% of its weight due to water evaporation and compound breakdown.</div>
<div class="quiz-box"><strong>ًں’¬ Quick Quiz:</strong> Which layer of the coffee cherry becomes "chaff" during roasting? (Answer: Silver Skin)</div>
`
};

L['A2-0'] = {ar:`<h3>ًں”¬ ظپظٹط²ظٹط§ط، ظˆظƒظٹظ…ظٹط§ط، ط§ظ„ط§ط³طھط®ظ„ط§طµ</h3><p>ط§ظ„ط§ط³طھط®ظ„ط§طµ ظ‡ظˆ ط¹ظ…ظ„ظٹط© ط¥ط°ط§ط¨ط© ط§ظ„ظ…ط±ظƒط¨ط§طھ ط§ظ„ظ‚ط§ط¨ظ„ط© ظ„ظ„ط°ظˆط¨ط§ظ† ظ…ظ† ط§ظ„ط¨ظ† ط§ظ„ظ…ط·ط­ظˆظ† ظپظٹ ط§ظ„ظ…ط§ط،. ط§ظ„ط¹ظˆط§ظ…ظ„ ط§ظ„ظ…ط¤ط«ط±ط©: ط¯ط±ط¬ط© ط§ظ„ط·ط­ظ†طŒ ط¯ط±ط¬ط© ط­ط±ط§ط±ط© ط§ظ„ظ…ط§ط، (92-96آ°ظ…)طŒ ظ†ط³ط¨ط© ط§ظ„ظ‚ظ‡ظˆط© ظ„ظ„ظ…ط§ط،طŒ ظˆظ‚طھ ط§ظ„طھظ„ط§ظ…ط³.</p>
<div class="img-c"><img src="\${photo('water')}" alt=""><div class="cap">ًں“ٹ ظ‚ظٹط§ط³ TDS â€” ظ…ظپطھط§ط­ ط§ظ„ط§طھط³ط§ظ‚ ظˆط§ظ„ط¬ظˆط¯ط©</div></div>
<div class="img-c"><img src="${photo('v60')}" alt="" loading="lazy"> loading="lazy"<div class="cap">âڑ—ï¸ڈ ط¹ظ„ظ… ط§ظ„ط§ط³طھط®ظ„ط§طµ â€” ظƒظٹظپ طھظ†طھظ‚ظ„ ط§ظ„ظ†ظƒظ‡ط§طھ ظ…ظ† ط§ظ„ط¨ظ† ط¥ظ„ظ‰ ط§ظ„ظ…ط§ط،</div></div>
<div class="info-box"><strong>ًں“ٹ ط§ظ„ظ†ط³ط¨ط© ط§ظ„ظ…ط«ظ„ظ‰ ظ„ظ„ط§ط³طھط®ظ„ط§طµ ط­ط³ط¨ SCA:</strong> 18-22%. ط£ظ‚ظ„ ظ…ظ† 18% = ط§ط³طھط®ظ„ط§طµ ظ†ط§ظ‚طµ (ط·ط¹ظ… ط­ط§ظ…ط¶ ظˆظ…ط§ظ„ط­). ط£ظƒط«ط± ظ…ظ† 22% = ط§ط³طھط®ظ„ط§طµ ط²ط§ط¦ط¯ (ط·ط¹ظ… ظ…ط± ظˆط¬ط§ظپ).</div><table><tr><th>ط§ظ„ط¹ط§ظ…ظ„</th><th>ط§ظ„ظ†ط·ط§ظ‚ ط§ظ„ظ…ط«ط§ظ„ظٹ</th></tr><tr><td>ط¯ط±ط¬ط© ط§ظ„ط·ط­ظ†</td><td>ظ…طھظˆط³ط· (ظ…ط«ظ„ ط­ط¨ظٹط¨ط§طھ ط§ظ„ط³ظƒط±)</td></tr><tr><td>ط­ط±ط§ط±ط© ط§ظ„ظ…ط§ط،</td><td>92-96آ°ظ…</td></tr><tr><td>ظˆظ‚طھ ط§ظ„طھظ„ط§ظ…ط³</td><td>2.5-4 ط¯ظ‚ط§ط¦ظ‚</td></tr><tr><td>ط§ظ„ظ†ط³ط¨ط© (ظ‚ظ‡ظˆط©:ظ…ط§ط،)</td><td>1:15 ط¥ظ„ظ‰ 1:17</td></tr></table><div class="err-box"><strong>â‌Œ ط®ط·ط£ ط´ط§ط¦ط¹:</strong> ط§ظ„ظ…ط§ط، ط§ظ„ظ…ط؛ظ„ظٹ ظ…ط¨ط§ط´ط±ط© (100آ°ظ…) ظٹط­ط±ظ‚ ط§ظ„ظ‚ظ‡ظˆط© ظˆظٹط³ط¨ط¨ ظ…ط±ط§ط±ط© ط²ط§ط¦ط¯ط©. ط§طھط±ظƒ ط§ظ„ط؛ظ„ط§ظٹط© 30 ط«ط§ظ†ظٹط© ط¨ط¹ط¯ ط§ظ„ط؛ظ„ظٹط§ظ†.</div>`, en:`<h3>ًں”¬ Physics & Chemistry of Extraction</h3><p>Extraction is the process of dissolving soluble compounds from ground coffee into water. Key variables: grind size, water temperature (92-96آ°C), coffee-to-water ratio, contact time.</p>
<div class="img-c"><img src="\${photo('water')}" alt=""><div class="cap">ًں“ٹ TDS Measurement â€” Key to Consistency & Quality</div></div>
<div class="img-c"><img src="${photo('v60')}" alt="" loading="lazy"> loading="lazy"<div class="cap">âڑ—ï¸ڈ Extraction Science â€” How Flavors Move from Bean to Water</div></div>
<div class="info-box"><strong>ًں“ٹ SCA Optimal Extraction:</strong> 18-22%. Below 18% = under-extraction (sour, salty). Above 22% = over-extraction (bitter, dry).</div><table><tr><th>Variable</th><th>Optimal Range</th></tr><tr><td>Grind Size</td><td>Medium (like sugar granules)</td></tr><tr><td>Water Temp</td><td>92-96آ°C</td></tr><tr><td>Contact Time</td><td>2.5-4 minutes</td></tr><tr><td>Ratio (coffee:water)</td><td>1:15 to 1:17</td></tr></table><div class="err-box"><strong>â‌Œ Common Mistake:</strong> Boiling water (100آ°C) scorches coffee and causes excessive bitterness. Let the kettle rest 30 seconds after boiling.</div>`};

L['A2-1'] = {ar:`<h3>ًں§° ط£ط¯ظˆط§طھ طھط­ط¶ظٹط± ط§ظ„ظ‚ظ‡ظˆط©</h3>
<div class="img-c"><img src="${photo('barista')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًں§° ظ…ط¹ط¯ط§طھ ط§ظ„ظ‚ظ‡ظˆط© â€” ظ…ظ† V60 ط¥ظ„ظ‰ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ</div></div>
<table><tr><th>ط§ظ„ط·ط±ظٹظ‚ط©</th><th>ط§ظ„ظ†ظƒظ‡ط©</th><th>ط§ظ„ظˆظ‚طھ</th></tr><tr><td>V60</td><td>ظ†ط¸ظٹظپط©طŒ ط²ظ‡ط±ظٹط©</td><td>2.5 ط¯ظ‚ظٹظ‚ط©</td></tr><tr><td>Chemex</td><td>ظ†ط¸ظٹظپط© ط¬ط¯ط§ظ‹</td><td>4 ط¯ظ‚ط§ط¦ظ‚</td></tr><tr><td>AeroPress</td><td>ط؛ظ†ظٹط©طŒ ظƒط§ظ…ظ„ط©</td><td>1.5 ط¯ظ‚ظٹظ‚ط©</td></tr><tr><td>French Press</td><td>ط«ظ‚ظٹظ„ط©طŒ ط²ظٹطھظٹط©</td><td>4 ط¯ظ‚ط§ط¦ظ‚</td></tr><tr><td>ط¥ط³ط¨ط±ظٹط³ظˆ</td><td>ظ…ط±ظƒط²ط©طŒ ظƒط±ظٹظ…ظٹط©</td><td>25-30 ط«ط§ظ†ظٹط©</td></tr></table><div class="ok-box"><strong>ًں’، ظ†طµظٹط­ط©:</strong> ط§ط¨ط¯ط£ ط¨ط·ط±ظٹظ‚ط© V60 â€” ط§ظ„ط£ط¨ط³ط· ظˆط§ظ„ط£ظƒط«ط± طھط­ظƒظ…ط§ظ‹ ظپظٹ ط§ظ„ظ…طھط؛ظٹط±ط§طھ.</div>`, en:`<h3>ًں§° Coffee Brewing Equipment</h3>
<div class="img-c"><img src="${photo('barista')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًں§° Coffee Equipment â€” From V60 to Espresso</div></div>
<table><tr><th>Method</th><th>Flavor</th><th>Time</th></tr><tr><td>V60</td><td>Clean, floral</td><td>2.5 min</td></tr><tr><td>Chemex</td><td>Very clean</td><td>4 min</td></tr><tr><td>AeroPress</td><td>Rich, full</td><td>1.5 min</td></tr><tr><td>French Press</td><td>Heavy, oily</td><td>4 min</td></tr><tr><td>Espresso</td><td>Concentrated</td><td>25-30 sec</td></tr></table><div class="ok-box"><strong>ًں’، Tip:</strong> Start with V60 â€” the simplest and most controllable method.</div>`};

L['A2-2'] = {ar:`<h3>âڑ–ï¸ڈ ط§ظ„ظ†ط³ط¨ ط§ظ„ط°ظ‡ط¨ظٹط© â€” ظ…ظپطھط§ط­ ط§ظ„ط§طھط³ط§ظ‚</h3><p>ظ†ط³ط¨ط© ط§ظ„ظ‚ظ‡ظˆط© ط¥ظ„ظ‰ ط§ظ„ظ…ط§ط، ظ‡ظٹ <strong>ط§ظ„ظ…طھط؛ظٹط± ط§ظ„ط£ظƒط«ط± طھط£ط«ظٹط±ط§ظ‹</strong> ظپظٹ ط·ط¹ظ… ط§ظ„ظپظ†ط¬ط§ظ†. ط§ظ„ظ†ط³ط¨ط© ط§ظ„ط£ط³ط§ط³ظٹط© ط§ظ„طھظٹ ط£ظˆطµطھ ط¨ظ‡ط§ SCA ظ‡ظٹ <strong>60 ط¬ط±ط§ظ… ظ‚ظ‡ظˆط© ظ„ظƒظ„ 1 ظ„طھط± ظ…ط§ط،</strong> (1:16.7). ظ„ظƒظ† ظ„ظƒظ„ ط·ط±ظٹظ‚ط© طھط­ط¶ظٹط± ظ†ط³ط¨طھظ‡ط§ ط§ظ„ظ…ط«ظ„ظ‰.</p>
<table><tr><th>ط·ط±ظٹظ‚ط© ط§ظ„طھط­ط¶ظٹط±</th><th>ط§ظ„ظ†ط³ط¨ط© (ظ‚ظ‡ظˆط©:ظ…ط§ط،)</th><th>ظ…ط«ط§ظ„ (15 ط¬ط±ط§ظ…)</th></tr><tr><td>V60 / Chemex</td><td>1:15 â€“ 1:17</td><td>15g : 240-255g</td></tr><tr><td>AeroPress</td><td>1:14 â€“ 1:16</td><td>15g : 210-240g</td></tr><tr><td>French Press</td><td>1:12 â€“ 1:15</td><td>15g : 180-225g</td></tr><tr><td>ط¥ط³ط¨ط±ظٹط³ظˆ</td><td>1:2 â€“ 1:3</td><td>18g : 36-54g</td></tr><tr><td>Cold Brew</td><td>1:8 â€“ 1:10</td><td>100g : 800-1000g</td></tr><tr><td>Moka Pot</td><td>1:7 â€“ 1:10</td><td>20g : 140-200g</td></tr></table>
<h3>ًں§® ظƒظٹظپ طھط®طھط§ط± ط§ظ„ظ†ط³ط¨ط© ط§ظ„ظ…ظ†ط§ط³ط¨ط©طں</h3><p><strong>ط§ظ„ظ†ط³ط¨ط© ط§ظ„ط£ط®ظپ (1:17):</strong> طھط¨ط±ط² ط§ظ„ط­ظ…ظˆط¶ط© ظˆط§ظ„ظ†ظƒظ‡ط§طھ ط§ظ„ط²ظ‡ط±ظٹط© â€” ظ…ط«ط§ظ„ظٹط© ظ„ظ„ط¨ظ† ط§ظ„ط¥ط«ظٹظˆط¨ظٹ ط®ظپظٹظپ ط§ظ„طھط­ظ…ظٹطµ.<br><strong>ط§ظ„ظ†ط³ط¨ط© ط§ظ„ظ…طھظˆط³ط·ط© (1:15):</strong> طھظˆط§ط²ظ† ط¨ظٹظ† ط§ظ„ط­ظ…ظˆط¶ط© ظˆط§ظ„ظ‚ظˆط§ظ… â€” ظ…ظ†ط§ط³ط¨ط© ظ„ظ…ط¹ط¸ظ… ط£ظ†ظˆط§ط¹ ط§ظ„ط¨ظ†.<br><strong>ط§ظ„ظ†ط³ط¨ط© ط§ظ„ط£ط«ظ‚ظ„ (1:13):</strong> طھط¨ط±ط² ط§ظ„ظ‚ظˆط§ظ… ظˆط§ظ„ط¬ط³ظ… ظˆط§ظ„ظ…ط±ط§ط±ط© â€” ظ…ظ†ط§ط³ط¨ط© ظ„ظ„ط¨ظ† ط§ظ„ط¯ط§ظƒظ† ط£ظˆ ظ‚ظ‡ظˆط© ط§ظ„ط·ظˆط§ظپط§طھ.</p>
<div class="hl"><strong>ًں“ٹ ظ‚ط§ط¹ط¯ط© ط§ظ„ظ€ 60 ط¬ط±ط§ظ…:</strong> ط§ط¨ط¯ط£ ط¨ظ€ 60 ط¬ط±ط§ظ… ط¨ظ† ظ„ظƒظ„ 1 ظ„طھط± ظ…ط§ط، (1:16.7). ط§ط¶ط¨ط· ط­ط³ط¨ ط§ظ„ط°ظˆظ‚: ط²ظˆط¯ ط§ظ„ظ‚ظ‡ظˆط© ظ„ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط·ط¹ظ… ط£ظ‚ظˆظ‰طŒ ظ‚ظ„ظ„ظ‡ط§ ظ„ظ„ط·ط¹ظ… ط§ظ„ط£ط®ظپ. ط³ط¬ظ„ ظ†ط³ط¨ظƒ ط§ظ„ظ…ظپط¶ظ„ط© ظ„ظƒظ„ ط¨ظ†!</div>
<div class="info-box"><strong>ًں”¬ ط§ظ„ط¹ظ„ط§ظ‚ط© ط¨ظ€ TDS:</strong> ظƒظ„ظ…ط§ ط²ط§ط¯طھ ظƒظ…ظٹط© ط§ظ„ظ‚ظ‡ظˆط© (ظ†ط³ط¨ط© ط£ط«ظ‚ظ„)طŒ ط²ط§ط¯ TDS â€” ظˆط§ظ„ط¹ظƒط³ طµط­ظٹط­. ط§ظ„ظ‡ط¯ظپ: TDS 1.2-1.5% ظ„ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ظ‚ط·ط±ط©طŒ ظˆ TDS 8-12% ظ„ظ„ط¥ط³ط¨ط±ظٹط³ظˆ.</div>`, en:`<h3>âڑ–ï¸ڈ Golden Ratios â€” The Key to Consistency</h3><p>The coffee-to-water ratio is the <strong>most impactful variable</strong> in cup flavor. The SCA-recommended baseline is <strong>60g coffee per 1 liter of water</strong> (1:16.7). But each brewing method has its optimal ratio.</p>
<table><tr><th>Method</th><th>Ratio (coffee:water)</th><th>Example (15g)</th></tr><tr><td>V60 / Chemex</td><td>1:15 â€“ 1:17</td><td>15g : 240-255g</td></tr><tr><td>AeroPress</td><td>1:14 â€“ 1:16</td><td>15g : 210-240g</td></tr><tr><td>French Press</td><td>1:12 â€“ 1:15</td><td>15g : 180-225g</td></tr><tr><td>Espresso</td><td>1:2 â€“ 1:3</td><td>18g : 36-54g</td></tr><tr><td>Cold Brew</td><td>1:8 â€“ 1:10</td><td>100g : 800-1000g</td></tr><tr><td>Moka Pot</td><td>1:7 â€“ 1:10</td><td>20g : 140-200g</td></tr></table>
<h3>ًں§® How to Choose the Right Ratio?</h3><p><strong>Lighter ratio (1:17):</strong> Highlights acidity and floral notes â€” ideal for light-roast Ethiopian beans.<br><strong>Medium ratio (1:15):</strong> Balanced â€” suitable for most coffee types.<br><strong>Heavier ratio (1:13):</strong> Emphasizes body and bitterness â€” ideal for dark roasts.</p>
<div class="hl"><strong>ًں“ٹ The 60g Rule:</strong> Start with 60g coffee per 1L water (1:16.7). Adjust to taste: increase coffee for stronger flavor, decrease for lighter. Log your preferred ratios for each coffee!</div>
<div class="info-box"><strong>ًں”¬ TDS Relationship:</strong> The more coffee (heavier ratio), the higher the TDS â€” and vice versa. Target: 1.2-1.5% TDS for drip coffee, 8-12% for espresso.</div>`};

L['A2-3'] = {ar:`<h3>ًں› ï¸ڈ طھط­ط¶ظٹط± V60 ط®ط·ظˆط© ط¨ط®ط·ظˆط©</h3>
<div class="img-c"><img src="\${photo('v60')}" alt=""><div class="cap">ًں› ï¸ڈ طھط­ط¶ظٹط± V60 ط®ط·ظˆط© ط¨ط®ط·ظˆط© â€” ظ…ظ† ط§ظ„ط؛ظ„ظٹط§ظ† ط¥ظ„ظ‰ ط§ظ„طھظ‚ط¯ظٹظ…</div></div>
<div class="img-c"><img src="${photo('v60')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًں› ï¸ڈ طھط­ط¶ظٹط± V60 â€” ط®ط·ظˆط© ط¨ط®ط·ظˆط©</div></div>
<ol><li><strong>ط¬ظ‡ط² ط§ظ„ط£ط¯ظˆط§طھ:</strong> V60طŒ ظپظ„طھط± ظˆط±ظ‚ظٹطŒ ط؛ظ„ط§ظٹط©طŒ ظ…ظٹط²ط§ظ†</li><li><strong>ط³ط®ظ† ط§ظ„ظ…ط§ط،:</strong> ط§ط؛ظ„ظٹ ظˆط§طھط±ظƒظ‡ 30 ط«ط§ظ†ظٹط© (94آ°ظ…)</li><li><strong>ط§ط·ط­ظ†:</strong> ط¯ط±ط¬ط© ظ…طھظˆط³ط·ط© (ظ…ط«ظ„ ط§ظ„ط³ظƒط± ط§ظ„ط®ط´ظ†)</li><li><strong>ظˆط²ظ†:</strong> 15 ط¬ط±ط§ظ… ط¨ظ† + 250 ط¬ط±ط§ظ… ظ…ط§ط،</li><li><strong>Blooming:</strong> 30 ظ…ظ„ ظ…ط§ط، + ط§ظ†طھط¸ط± 30 ط«ط§ظ†ظٹط©</li><li><strong>طµط¨:</strong> ط¹ظ„ظ‰ 3 ظ…ط±ط§ط­ظ„ ظ…طھط³ط§ظˆظٹط©</li><li><strong>ط§ظ„ظˆظ‚طھ:</strong> 2.5-3 ط¯ظ‚ط§ط¦ظ‚ ط¥ط¬ظ…ط§ظ„ظٹ</li><li><strong>ط§ط³طھظ…طھط¹!</strong></li></ol>`, en:`<h3>ًں› ï¸ڈ V60 Step-by-Step</h3>
<div class="img-c"><img src="\${photo('v60')}" alt=""><div class="cap">ًں› ï¸ڈ V60 Step by Step â€” From Boil to Serve</div></div>
<div class="img-c"><img src="${photo('v60')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًں› ï¸ڈ V60 Brewing â€” Step by Step Guide</div></div>
<ol><li><strong>Prepare:</strong> V60, paper filter, kettle, scale</li><li><strong>Heat water:</strong> Boil, rest 30 sec (94آ°C)</li><li><strong>Grind:</strong> Medium (like coarse sugar)</li><li><strong>Weigh:</strong> 15g coffee + 250g water</li><li><strong>Bloom:</strong> 30ml water + wait 30 sec</li><li><strong>Pour:</strong> In 3 equal stages</li><li><strong>Time:</strong> 2.5-3 min total</li><li><strong>Enjoy!</strong></li></ol>`};

L['A3-0'] = {ar:`<h3>âک• ظ…ط§ ظ‡ظˆ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆطں â€” ط§ظ„ط¹ظ„ظ… ظˆط§ظ„طھظ‚ظ†ظٹط©</h3><p>ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ظ„ظٹط³ ظ…ط¬ط±ط¯ ظ‚ظ‡ظˆط© ظ…ط±ظƒط²ط© â€” ط¥ظ†ظ‡ <strong>ظ†ط¸ط§ظ… طھط­ط¶ظٹط± ظ…طھظƒط§ظ…ظ„</strong> ظٹط¹طھظ…ط¯ ط¹ظ„ظ‰ ط¯ظپط¹ ط§ظ„ظ…ط§ط، ط§ظ„ط³ط§ط®ظ† (91-96آ°ظ…) طھط­طھ <strong>ط¶ط؛ط· 9 ط¨ط§ط±</strong> ط¹ط¨ط± ط·ط¨ظ‚ط© ظ…ط¶ط؛ظˆط·ط© ظ…ظ† ط§ظ„ط¨ظ† ط§ظ„ظ…ط·ط­ظˆظ† ظ†ط§ط¹ظ…ط§ظ‹ (ط·ط­ظ† ط¥ط³ط¨ط±ظٹط³ظˆ: 200-350 ظ…ظٹظƒط±ظˆظ†). ط§ظ„ظ†طھظٹط¬ط©: ظ…ط´ط±ظˆط¨ ظ…ط±ظƒط² ط¨ط·ط¨ظ‚ط© ظƒط±ظٹظ…ط§ ط°ظ‡ط¨ظٹط© طھط؛ط·ظٹ ط§ظ„ط³ط·ط­.</p>
<div class="img-c"><img src="\${photo('espresso')}" alt=""><div class="cap">âک• ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ â€” 9 ط¨ط§ط±طŒ 92آ°ظ…طŒ 30 ط«ط§ظ†ظٹط©</div></div>
<div class="img-c"><img src="${photo('espresso')}" alt="" loading="lazy"> loading="lazy"<div class="cap">âک• ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ â€” ظ‚ظ„ط¨ ط¹ط§ظ„ظ… ط§ظ„ظ‚ظ‡ظˆط©</div></div>
<h3>âڑ™ï¸ڈ ط¨ط§ط±ط§ظ…طھط±ط§طھ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ط§ظ„ظ…ط«ط§ظ„ظٹ (SCA)</h3>
<table><tr><th>ط§ظ„ظ…ط¹ظٹط§ط±</th><th>ط§ظ„ظ†ط·ط§ظ‚ ط§ظ„ظ…ط«ط§ظ„ظٹ</th></tr><tr><td>ظˆط²ظ† ط§ظ„ط¬ط±ط¹ط© (Dose)</td><td>7-9 ط¬ط±ط§ظ… (ط³ظ†ط¬ظ„) / 16-22 ط¬ط±ط§ظ… (ط¯ط¨ظ„)</td></tr><tr><td>ظˆط²ظ† ط§ظ„ظ†ط§طھط¬ (Yield)</td><td>25-35 ظ…ظ„ (ط³ظ†ط¬ظ„) / 50-70 ظ…ظ„ (ط¯ط¨ظ„)</td></tr><tr><td>ظˆظ‚طھ ط§ظ„ط§ط³طھط®ظ„ط§طµ</td><td>25-30 ط«ط§ظ†ظٹط©</td></tr><tr><td>ط­ط±ط§ط±ط© ط§ظ„ظ…ط§ط،</td><td>91-96آ°ظ…</td></tr><tr><td>ط§ظ„ط¶ط؛ط·</td><td>9 ط¨ط§ط± (آ±0.5)</td></tr><tr><td>ط§ظ„ظƒط±ظٹظ…ط§</td><td>ط°ظ‡ط¨ظٹط©طŒ 3-5 ظ…ظ…طŒ ط¨ط¯ظˆظ† ظپظ‚ط§ط¹ط§طھ ظƒط¨ظٹط±ط©</td></tr><tr><td>ظ†ط³ط¨ط© ط§ظ„ط§ط³طھط®ظ„ط§طµ</td><td>18-22%</td></tr></table>
<h3>ًں§ھ ظ…ط§ ط§ظ„ط°ظٹ ظٹط­ط¯ط« ط£ط«ظ†ط§ط، ط§ظ„ط§ط³طھط®ظ„ط§طµطں</h3><p>ظپظٹ ط§ظ„ظ€ 25-30 ط«ط§ظ†ظٹط©طŒ ظٹظ…ط± ط§ظ„ظ…ط§ط، ط¹ط¨ط± 9-10 ط£ط¬ظˆط§ط، ظ…ظ† ط§ظ„ط¶ط؛ط·طŒ ظ…ط³طھط®ظ„طµط§ظ‹:<br>â€¢ <strong>ط£ظˆظ„ 5-7 ط«ظˆط§ظ†ظچ:</strong> ط§ط³طھط®ظ„ط§طµ ط§ظ„ط£ط­ظ…ط§ط¶ ظˆط§ظ„ظ…ط±ظƒط¨ط§طھ ط§ظ„ط®ظپظٹظپط© â€” ط¨ط¯ط§ظٹط© طھط¯ظپظ‚ ط¨ظ†ظٹ ظپط§طھط­<br>â€¢ <strong>7-20 ط«ط§ظ†ظٹط©:</strong> ط°ط±ظˆط© ط§ظ„ط§ط³طھط®ظ„ط§طµ â€” طھط¯ظپظ‚ ط¨ظ†ظٹ ظƒط«ظٹظپ ظ…ط¹ ظƒط±ظٹظ…ط§ ظ…طھط·ظˆط±ط©<br>â€¢ <strong>20-30 ط«ط§ظ†ظٹط©:</strong> ط§ط³طھط®ظ„ط§طµ ط§ظ„ظ…ط±ظƒط¨ط§طھ ط§ظ„ط«ظ‚ظٹظ„ط© â€” ظ‚ظˆط§ظ… ظƒط§ظ…ظ„ ظˆظ…ط±ط§ط±ط© ط®ظپظٹظپط©<br>â€¢ <strong>ط¨ط¹ط¯ 30 ط«ط§ظ†ظٹط©:</strong> ط§ط³طھط®ظ„ط§طµ ط²ط§ط¦ط¯ â€” ط·ط¹ظ… ط¬ط§ظپ ظˆظ…ط± ظˆظ‚ط§ط¨ط¶</p>
<div class="hl"><strong>ًں“ٹ ظ‚ط§ظ†ظˆظ† ط§ظ„ظ€ 3-3-3</strong><br>3 ط«ظˆط§ظ†ظچ ظ„ط¨ط¯ط§ظٹط© ط§ظ„طھظ‚ط·ظٹط± (Pre-infusion + dripping)<br>30 ط«ط§ظ†ظٹط© ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظˆظ‚طھ<br>3 ط£ط¶ط¹ط§ظپ ظˆط²ظ† ط§ظ„ط¬ط±ط¹ط© (ظ†ط³ط¨ط© 1:3 ط£ظˆ ط£ظ‚ظ„)</div>
<div class="quiz-box"><strong>ًں’¬ ط§ط®طھط¨ط§ط± ط³ط±ظٹط¹:</strong> ظ…ط§ ط³ط¨ط¨ ط£ظ‡ظ…ظٹط© ط§ظ„ظƒط±ظٹظ…ط§ ظپظٹ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆطں (ط§ظ„ط¥ط¬ط§ط¨ط©: ط§ظ„ظƒط±ظٹظ…ط§ طھط­ط¨ط³ ط§ظ„ظ†ظƒظ‡ط§طھ ط§ظ„ظ…طھط·ط§ظٹط±ط© ظˆط§ظ„ط²ظٹظˆطھ â€” ظ‡ظٹ ظ…ط¤ط´ط± ط¹ظ„ظ‰ ط¬ظˆط¯ط© ط§ظ„ط§ط³طھط®ظ„ط§طµ)</div>
<div class="err-box"><strong>â‌Œ ط®ط·ط£ ط´ط§ط¦ط¹:</strong> ط¸ظ† ط£ظ† ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ط§ظ„ط³ط±ظٹط¹ (ط£ظ‚ظ„ ظ…ظ† 20 ط«ط§ظ†ظٹط©) ط£ظپط¶ظ„. ط§ظ„ط­ظ‚ظٹظ‚ط©: ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ط§ظ„ظ…ط«ط§ظ„ظٹ ظٹط­طھط§ط¬ 25-30 ط«ط§ظ†ظٹط© ظ„ط§ط³طھط®ظ„ط§طµ ظ…طھظˆط§ط²ظ†. ط£ط³ط±ط¹ ظ…ظ† 20 ط«ط§ظ†ظٹط© â‰ˆ ط§ط³طھط®ظ„ط§طµ ظ†ط§ظ‚طµ (ط·ط¹ظ… ط­ط§ظ…ط¶).</div>`, en:`<h3>âک• What is Espresso? â€” The Science & Technique</h3><p>Espresso is not just concentrated coffee â€” it's an <strong>integrated brewing system</strong> that forces hot water (91-96آ°C) at <strong>9 bars of pressure</strong> through a compacted puck of finely ground coffee (espresso grind: 200-350 microns). Result: a concentrated beverage with a golden crema layer.</p>
<div class="img-c"><img src="\${photo('espresso')}" alt=""><div class="cap">âک• Espresso â€” 9 bar, 92آ°C, 30 seconds</div></div>
<div class="img-c"><img src="${photo('espresso')}" alt="" loading="lazy"> loading="lazy"<div class="cap">âک• Espresso â€” The Heart of the Coffee World</div></div>
<h3>âڑ™ï¸ڈ Ideal Espresso Parameters (SCA)</h3>
<table><tr><th>Parameter</th><th>Optimal Range</th></tr><tr><td>Dose</td><td>7-9g (single) / 16-22g (double)</td></tr><tr><td>Yield</td><td>25-35ml (single) / 50-70ml (double)</td></tr><tr><td>Extraction Time</td><td>25-30 seconds</td></tr><tr><td>Water Temperature</td><td>91-96آ°C</td></tr><tr><td>Pressure</td><td>9 bar (آ±0.5)</td></tr><tr><td>Crema</td><td>Golden, 3-5mm, no large bubbles</td></tr><tr><td>Extraction Yield</td><td>18-22%</td></tr></table>
<h3>ًں§ھ What Happens During Extraction?</h3><p>In 25-30 seconds, water passes through at 9+ atmospheres, extracting:<br>â€¢ <strong>First 5-7 sec:</strong> Acids and light compounds â€” light brown flow starts<br>â€¢ <strong>7-20 sec:</strong> Peak extraction â€” dense brown flow with developing crema<br>â€¢ <strong>20-30 sec:</strong> Heavy compounds â€” full body with light bitterness<br>â€¢ <strong>After 30 sec:</strong> Over-extraction â€” dry, bitter, astringent taste</p>
<div class="hl"><strong>ًں“ٹ The 3-3-3 Rule</strong><br>3 seconds to start dripping (pre-infusion)<br>30 seconds total time<br>3 times the dose (1:3 ratio or lower)</div>
<div class="quiz-box"><strong>ًں’¬ Quick Quiz:</strong> Why is crema important in espresso? (Answer: Crema traps volatile aromatics and oils â€” it's an indicator of extraction quality)</div>
<div class="err-box"><strong>â‌Œ Common Mistake:</strong> Thinking fast espresso (&lt;20 sec) is better. Truth: ideal espresso needs 25-30 sec for balanced extraction. Faster than 20 sec â‰ˆ under-extracted (sour taste).</div>`};

L['A3-1'] = {ar:`<h3>ًں¥› ظ„ط§طھظٹظ‡ â€” ظپظ† ط§ظ„ط­ظ„ظٹط¨</h3><p>ط§ظ„ظ„ط§طھظٹظ‡ ظ‡ظˆ <strong>ط£ط´ظ‡ط± ظ…ط´ط±ظˆط¨ط§طھ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ</strong> ظپظٹ ط§ظ„ط¹ط§ظ„ظ…. طھط±ظƒظٹط¨طھظ‡ ط¨ط³ظٹط·ط©: ط¥ط³ط¨ط±ظٹط³ظˆ + ط­ظ„ظٹط¨ ظ…ط¨ط®ط± + ط±ط؛ظˆط© ط®ظپظٹظپط©. ظ„ظƒظ† ط§ظ„ط³ط­ط± ظٹظƒظ…ظ† ظپظٹ <strong>ظƒظٹظپظٹط© ط¯ظ…ط¬ ط§ظ„ظ…ظƒظˆظ†ط§طھ</strong> ظ…ط¹ط§ظ‹.</p>
<div class="img-c"><img src="\${photo('latte')}" alt=""><div class="cap">ًںژ¨ ط£ط³ط§ط³ظٹط§طھ ط§ظ„ظ„ط§طھظٹظ‡ ط£ط±طھ â€” ظ‚ظ„ط¨طŒ ط±ظˆط²ظٹطھط§طŒ طھظˆظ„ظٹط¨</div></div>
<h3>ًں“گ ط§ظ„ظ†ط³ط¨ط© ط§ظ„ظ…ط«ط§ظ„ظٹط©</h3><p><strong>ظ„ط§طھظٹظ‡ ظƒظ„ط§ط³ظٹظƒ:</strong> 1/3 ط¥ط³ط¨ط±ظٹط³ظˆ (30 ظ…ظ„ ط¯ط¨ظ„) + 2/3 ط­ظ„ظٹط¨ ظ…ط¨ط®ط± (150-180 ظ…ظ„) + ط·ط¨ظ‚ط© ط±ط؛ظˆط© ط®ظپظٹظپط© (5-10 ظ…ظ…).<br><strong>ظ„ط§طھظٹظ‡ ظƒط¨ظٹط±:</strong> ط¯ط¨ظ„ ط¥ط³ط¨ط±ظٹط³ظˆ (60 ظ…ظ„) + ط­ظ„ظٹط¨ (250-300 ظ…ظ„) â€” ظ†ط³ط¨ط© 1:4 ط¥ظ„ظ‰ 1:5.<br><strong>Iced Latte:</strong> ط­ظ„ظٹط¨ ط¨ط§ط±ط¯ + ط«ظ„ط¬ + ط¥ط³ط¨ط±ظٹط³ظˆ ظٹطµط¨ ط¹ظ„ظ‰ ط§ظ„ط«ظ„ط¬ â€” ظٹط­ط§ظپط¸ ط¹ظ„ظ‰ ط§ظ„ظ†ظƒظ‡ط©.</p>
<h3>ًں§ھ ط¹ظ„ظ… طھط³ط®ظٹظ† ط§ظ„ط­ظ„ظٹط¨</h3><p>ط§ظ„ط­ظ„ظٹط¨ ظٹطھظƒظˆظ† ظ…ظ†: <strong>ظ…ط§ط، (87%)</strong>طŒ <strong>ط¯ظ‡ظˆظ† (3.5%)</strong>طŒ <strong>ط¨ط±ظˆطھظٹظ†ط§طھ (3.2%)</strong>طŒ <strong>ط³ظƒط± ظ„ط§ظƒطھظˆط² (4.8%)</strong>. ط¹ظ†ط¯ ط§ظ„طھط³ط®ظٹظ†:<br>â€¢ <strong>35-55آ°ظ…:</strong> طھط¨ط¯ط£ ط§ظ„ط¨ط±ظˆطھظٹظ†ط§طھ ط¨ط§ظ„طھظ…ط¯ط¯ â€” طھطھظƒظˆظ† ط§ظ„ط±ط؛ظˆط© ط§ظ„ظ†ط§ط¹ظ…ط©<br>â€¢ <strong>55-65آ°ظ…:</strong> ط§ظ„ظ†ط·ط§ظ‚ ط§ظ„ظ…ط«ط§ظ„ظٹ â€” ظ„ط§ظƒطھظˆط² ظٹطھط­ظ„ظ„ ط¥ظ„ظ‰ ط³ظƒط±ظٹط§طھ ط¨ط³ظٹط·ط© (ط­ظ„ط§ظˆط© ط·ط¨ظٹط¹ظٹط©)<br>â€¢ <strong>65-70آ°ظ…:</strong> طھط¨ط¯ط£ ط§ظ„ط¨ط±ظˆطھظٹظ†ط§طھ ط¨ط§ظ„طھظƒط³ط± â€” طھط®طھظپظٹ ط§ظ„ط±ط؛ظˆط© ط§ظ„ظ†ط§ط¹ظ…ط©<br>â€¢ <strong>ظپظˆظ‚ 70آ°ظ…:</strong> ط§ط­طھط±ط§ظ‚ ط§ظ„ط¨ط±ظˆطھظٹظ†ط§طھ â€” ط·ط¹ظ… ظ…ط­ط±ظˆظ‚طŒ ظپظ‚ط¯ط§ظ† ط§ظ„ط­ظ„ط§ظˆط©</p>
<h3>ًںژ¨ Latte Art â€” ط§ظ„ظ…ط³طھظˆظ‰ ط§ظ„ظ…طھظ‚ط¯ظ…</h3><p><strong>ط§ظ„ظ‚ظ„ط¨ (Heart):</strong> ط£ط¨ط³ط· ط´ظƒظ„ â€” طµط¨ ط³ط±ظٹط¹ ظپظٹ ط§ظ„ظ…ظ†طھطµظپطŒ ط«ظ… ط­ط±ظƒط© ط£ظ…ط§ظ…ظٹط© ط³ط±ظٹط¹ط©.<br><strong>ط§ظ„ط±ظˆط²ظٹطھط§ (Rosetta):</strong> ط£ظˆط±ط§ظ‚ ظ†ط¨ط§طھ â€” ظ‡ط² ط§ظ„ظƒظˆط¨ ظٹظ…ظٹظ†ط§ظ‹ ظˆظٹط³ط§ط±ط§ظ‹ ط£ط«ظ†ط§ط، ط§ظ„طµط¨ ظ…ط¹ ط³ط­ط¨ ط¨ط·ظٹط،.<br><strong>ط§ظ„طھظˆظ„ظٹط¨ (Tulip):</strong> 3-4 ط·ط¨ظ‚ط§طھ ظ…ظ† ط§ظ„ظ‚ظ„ظˆط¨ ط§ظ„ظ…طھط¯ط§ط®ظ„ط© â€” ظٹطھط·ظ„ط¨ طھط­ظƒظ…ط§ظ‹ ط¯ظ‚ظٹظ‚ط§ظ‹ ظپظٹ طھط¯ظپظ‚ ط§ظ„ط­ظ„ظٹط¨.<br><strong>ط§ظ„ط³ظˆط§ظ† (Swan):</strong> ط§ظ„ط´ظƒظ„ ط§ظ„ط£طµط¹ط¨ â€” ظٹط¬ظ…ط¹ ط¨ظٹظ† ط§ظ„ط±ظˆط²ظٹطھط§ ظˆط§ظ„ظ‚ظ„ط¨ ظ…ط¹ ط¹ظ†ظ‚ ط§ظ„ط¨ط¬ط¹ط©.</p>
<div class="info-box"><strong>ًں’، ط³ط± ط§ظ„ظ„ط§طھظٹظ‡ ط¢ط±طھ ط§ظ„ظ†ط§ط¬ط­:</strong> ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ظٹط¬ط¨ ط£ظ† ظٹظƒظˆظ† ط·ط§ط²ط¬ط§ظ‹ (ظƒط±ظٹظ…ط§ ط°ظ‡ط¨ظٹط© ظ…طھظ…ط§ط³ظƒط©). ط§ظ„ط­ظ„ظٹط¨ ظٹط¬ط¨ ط£ظ† ظٹظƒظˆظ† ظپظٹ ط¯ط±ط¬ط© ط­ط±ط§ط±ط© 55-60آ°ظ… ظ…ط¹ ط±ط؛ظˆط© ظ†ط§ط¹ظ…ط© ظƒط§ظ„ط­ط±ظٹط± â€” ظ„ط§ ظپظ‚ط§ط¹ط§طھ ظƒط¨ظٹط±ط©.</div>
<div class="err-box"><strong>â‌Œ ط®ط·ط£ ط´ط§ط¦ط¹:</strong> ط¸ظ† ط£ظ† ط§ظ„ط±ط؛ظˆط© ط§ظ„ظƒط«ظٹظپط© ط£ظپط¶ظ„. ط§ظ„ط­ظ‚ظٹظ‚ط©: ظ„ط§طھظٹظ‡ ظٹط­طھط§ط¬ ط±ط؛ظˆط© ط®ظپظٹظپط© ط¬ط¯ط§ظ‹ (microfoam) â€” ظ…ط«ظ„ ط§ظ„ظƒط±ظٹظ…ط© ط§ظ„ط³ط§ط¦ظ„ط©. ط§ظ„ط±ط؛ظˆط© ط§ظ„ظƒط«ظٹظپط© طھظ†ط§ط³ط¨ ط§ظ„ظƒط§ط¨طھط´ظٹظ†ظˆ ظپظ‚ط·.</div>
<div class="ok-box"><strong>ًںژ¯ طھظ…ط±ظٹظ† ط¹ظ…ظ„ظٹ:</strong> ط§ط¨ط¯ط£ ط¨طھط³ط®ظٹظ† 200 ظ…ظ„ ط­ظ„ظٹط¨ ظپظٹ ط¥ط¨ط±ظٹظ‚. ط­ط§ظˆظ„ ط¹ظ…ظ„ ط±ط؛ظˆط© ظ†ط§ط¹ظ…ط© ط¨ط¯ظˆظ† ظپظ‚ط§ط¹ط§طھ. ط¹ظ†ط¯ظ…ط§ طھظ†ط¬ط­طŒ ط§ط±ط³ظ… ظ‚ظ„ط¨ط§ظ‹ ط¨ط³ظٹط·ط§ظ‹ ط¹ظ„ظ‰ ط³ط·ط­ ط§ظ„ظ„ط§طھظٹظ‡. ظƒط±ط± 20 ظ…ط±ط© ظ‚ط¨ظ„ ط§ظ„ط§ظ†طھظ‚ط§ظ„ ظ„ظ„ط´ظƒظ„ ط§ظ„طھط§ظ„ظٹ.</div>`, en:`<h3>ًں¥› Latte â€” The Art of Milk</h3><p>The latte is the <strong>world's most popular espresso drink</strong>. Its composition is simple: espresso + steamed milk + light foam. But the magic lies in <strong>how the ingredients merge</strong> together.</p>
<div class="img-c"><img src="\${photo('latte')}" alt=""><div class="cap">ًںژ¨ Latte Art Basics â€” Heart, Rosetta, Tulip</div></div>
<h3>ًں“گ The Ideal Ratio</h3><p><strong>Classic Latte:</strong> 1/3 espresso (30ml double) + 2/3 steamed milk (150-180ml) + light foam layer (5-10mm).<br><strong>Large Latte:</strong> Double espresso (60ml) + milk (250-300ml) â€” ratio 1:4 to 1:5.<br><strong>Iced Latte:</strong> Cold milk + ice + espresso poured over ice â€” preserves the flavor profile.</p>
<h3>ًں§ھ The Science of Steaming Milk</h3><p>Milk consists of: <strong>Water (87%)</strong>, <strong>Fat (3.5%)</strong>, <strong>Proteins (3.2%)</strong>, <strong>Lactose sugar (4.8%)</strong>. During steaming:<br>â€¢ <strong>35-55آ°C:</strong> Proteins begin to expand â€” fine foam forms<br>â€¢ <strong>55-65آ°C:</strong> Ideal range â€” lactose breaks into simple sugars (natural sweetness)<br>â€¢ <strong>65-70آ°C:</strong> Proteins start breaking down â€” fine foam disappears<br>â€¢ <strong>Above 70آ°C:</strong> Protein burns â€” scorched taste, sweetness lost</p>
<h3>ًںژ¨ Latte Art â€” Advanced Level</h3><p><strong>Heart:</strong> Simplest shape â€” fast pour in the center, then quick forward motion.<br><strong>Rosetta:</strong> Leaf pattern â€” wiggle the cup left and right while pouring, slow pull through.<br><strong>Tulip:</strong> 3-4 stacked heart layers â€” requires precise control of milk flow.<br><strong>Swan:</strong> Most difficult â€” combines rosetta and heart with a swan neck.</p>
<div class="info-box"><strong>ًں’، Secret to Successful Latte Art:</strong> Espresso must be fresh (firm golden crema). Milk should be at 55-60آ°C with silky microfoam â€” no large bubbles.</div>
<div class="err-box"><strong>â‌Œ Common Mistake:</strong> Thinking thick foam is better. Truth: latte needs very light microfoam â€” like liquid cream. Thick foam is for cappuccino only.</div>
<div class="ok-box"><strong>ًںژ¯ Practice:</strong> Start by steaming 200ml milk in a pitcher. Try to make smooth microfoam without bubbles. Once successful, draw a simple heart on the latte surface. Repeat 20 times before the next shape.</div>`};

L['A3-2'] = {ar:`<h3>âک• ظƒط§ط¨طھط´ظٹظ†ظˆ ظˆظ…ظˆظƒط§ â€” ط§ظ„ظپط±ظˆظ‚ ظˆط§ظ„طھظ‚ظ†ظٹط§طھ</h3>
<p>ظ…ط¹ط±ظپط© ط§ظ„ظپط±ظˆظ‚ ط¨ظٹظ† ظ…ط´ط±ظˆط¨ط§طھ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ط§ظ„ظ…ط®طھظ„ظپط© ظ‡ظٹ <strong>ط¹ظ„ط§ظ…ط© ط§ظ„ط¨ط§ط±ظٹط³طھط§ ط§ظ„ظ…ط­طھط±ظپ</strong>. ظ„ظƒظ„ ظ…ط´ط±ظˆط¨ ط´ط®طµظٹطھظ‡ ظˆظ†ط³ط¨ط© ظˆطھظ‚ظ†ظٹط© طھط­ط¶ظٹط±.</p>
<h3>ًںں¤ ط§ظ„ظƒط§ط¨طھط´ظٹظ†ظˆ â€” 1:1:1</h3>
<p>ط³ظڈظ…ظٹ <strong>ط§ظ„ظƒط§ط¨طھط´ظٹظ†ظˆ</strong> ط¹ظ„ظ‰ ط§ط³ظ… ط±ظ‡ط¨ط§ظ† <strong>ط§ظ„ظƒط§ط¨ظˆطھط´ظٹظ† (Capuchin)</strong> ظ„ط£ظ† ظ„ظˆظ† ط§ظ„ظ…ط´ط±ظˆط¨ ظٹط´ط¨ظ‡ ظ„ظˆظ† ط£ط±ط¯ظٹطھظ‡ظ… ط§ظ„ط¨ظ†ظٹط© ط§ظ„ظپط§طھط­ط©. ط§ظ„ظ…ظƒظˆظ†ط§طھ:<br>â€¢ <strong>1/3 ط¥ط³ط¨ط±ظٹط³ظˆ</strong> â€” ط§ظ„ظ‚ط§ط¹ط¯ط© (30 ظ…ظ„ ط¯ط¨ظ„)<br>â€¢ <strong>1/3 ط­ظ„ظٹط¨ ظ…ط¨ط®ط±</strong> â€” ط§ظ„ظ‚ظˆط§ظ… ط§ظ„ظƒط±ظٹظ…ظٹ<br>â€¢ <strong>1/3 ط±ط؛ظˆط© ظƒط«ظٹظپط©</strong> â€” ط·ط¨ظ‚ط© ط³ظ…ظٹظƒط© ط¬ط§ظپط© ط¹ظ„ظ‰ ط§ظ„ط³ط·ط­<br><br>ط§ظ„ظƒط§ط¨طھط´ظٹظ†ظˆ ط§ظ„ط¥ظٹط·ط§ظ„ظٹ ط§ظ„طھظ‚ظ„ظٹط¯ظٹ ظٹظ‚ط¯ظ… ظپظٹ ظƒظˆط¨ <strong>150-180 ظ…ظ„</strong>طŒ ظ…ط¹ ط±ط´ظ‘ط© ظƒط§ظƒط§ظˆ ط£ظˆ ظ‚ط±ظپط© ط¹ظ„ظ‰ ط§ظ„ط³ط·ط­. ظٹط¬ط¨ ط£ظ† ظٹظƒظˆظ† ط«ظ‚ظٹظ„ط§ظ‹ ط¨ظ…ط§ ظٹظƒظپظٹ ظ„طھط­ظ…ظ„ ط§ظ„ط±ط؛ظˆط© ط§ظ„ظƒط«ظٹظپط© ط¯ظˆظ† ط£ظ† ظٹط؛ط±ظ‚.</p>
<h3>ًںچ« ط§ظ„ظ…ظˆظƒط§ â€” ط¥ط³ط¨ط±ظٹط³ظˆ + ط´ظˆظƒظˆظ„ط§طھط©</h3>
<p><strong>Mocha</strong> (ط£ظˆ Mochaccino) ظ‡ظˆ ظ…ط´ط±ظˆط¨ ط¥ط³ط¨ط±ظٹط³ظˆ ظ…ط¹ ط´ظˆظƒظˆظ„ط§طھط©. ط§ط´طھظ‚ ط§ط³ظ…ظ‡ ظ…ظ† ظ…ظٹظ†ط§ط، <strong>ط§ظ„ظ…ظڈط®ط§ (Mocha)</strong> ط§ظ„ظٹظ…ظ†ظٹ â€” ط£ظˆظ„ ظ…ظٹظ†ط§ط، طµط¯ظ‘ط± ط§ظ„ظ‚ظ‡ظˆط© ظ„ظ„ط¹ط§ظ„ظ…. ط§ظ„طھط±ظƒظٹط¨ط©:<br>â€¢ <strong>ط¥ط³ط¨ط±ظٹط³ظˆ ط¯ط¨ظ„</strong> (30-60 ظ…ظ„)<br>â€¢ <strong>طµظ„طµط© ط´ظˆظƒظˆظ„ط§طھط©</strong> (15-30 ظ…ظ„) ط£ظˆ ط¨ظˆط¯ط±ط© ظƒط§ظƒط§ظˆ ظ…ظ…ط²ظˆط¬ط© ط¨ط§ظ„ظ…ط§ط، ط§ظ„ط³ط§ط®ظ†<br>â€¢ <strong>ط­ظ„ظٹط¨ ظ…ط¨ط®ط±</strong> (150-200 ظ…ظ„)<br>â€¢ <strong>ظƒط±ظٹظ…ط© ظ…ط®ظپظˆظ‚ط©</strong> (ط§ط®طھظٹط§ط±ظٹ) + ط±ط´ظ‘ط© ظƒط§ظƒط§ظˆ</p>
<table><tr><th>ط§ظ„ظ…ط´ط±ظˆط¨</th><th>ط¥ط³ط¨ط±ظٹط³ظˆ</th><th>ط­ظ„ظٹط¨</th><th>ط±ط؛ظˆط©</th><th>ط¥ط¶ط§ظپط§طھ</th></tr><tr><td>ظ„ط§طھظٹظ‡</td><td>1</td><td>2</td><td>ط®ظپظٹظپط©</td><td>â€”</td></tr><tr><td>ظƒط§ط¨طھط´ظٹظ†ظˆ</td><td>1</td><td>1</td><td>ظƒط«ظٹظپط© ط¬ط§ظپط©</td><td>ظƒط§ظƒط§ظˆ/ظ‚ط±ظپط©</td></tr><tr><td>ظ…ظˆظƒط§</td><td>1</td><td>2</td><td>ط®ظپظٹظپط©</td><td>ط´ظˆظƒظˆظ„ط§طھط© + ظƒط±ظٹظ…ط©</td></tr><tr><td>Flat White</td><td>1</td><td>2</td><td>ط±ظ‚ظٹظ‚ط© ط¬ط¯ط§ظ‹</td><td>â€”</td></tr><tr><td>Macchiato</td><td>1</td><td>ط§ظ„ظ‚ظ„ظٹظ„</td><td>ظ†ظ‚ط·ط© ط±ط؛ظˆط©</td><td>â€”</td></tr><tr><td>Affogato</td><td>1</td><td>â€”</td><td>â€”</td><td>ط¢ظٹط³ ظƒط±ظٹظ… ظپط§ظ†ظٹظ„ظٹط§</td></tr></table>
<div class="hl"><strong>ًں“ٹ ط§ظ„ظپط±ظ‚ ط¨ظٹظ† Flat White ظˆظ„ط§طھظٹظ‡:</strong> ط§ظ„ظپظ„ط§طھ ظˆط§ظٹطھ ظٹط³طھط®ط¯ظ… <strong>ظ†ط³ط¨ط© ط¥ط³ط¨ط±ظٹط³ظˆ ط£ط¹ظ„ظ‰</strong> (ط¥ط³ط¨ط±ظٹط³ظˆ ط¯ط¨ظ„ 60 ظ…ظ„) ظ…ظ‚ط§ط¨ظ„ 2/3 ط­ظ„ظٹط¨ ظ…ط¹ ط·ط¨ظ‚ط© ط±ط؛ظˆط© ط±ظ‚ظٹظ‚ط© ط¬ط¯ط§ظ‹ â€” ط£طµظ„ظ‡ط§ ظ…ظ† ط£ط³طھط±ط§ظ„ظٹط§/ظ†ظٹظˆط²ظٹظ„ظ†ط¯ط§. ط·ط¹ظ… ط§ظ„ظ‚ظ‡ظˆط© ط£ظ‚ظˆظ‰ ظˆط£ظƒط«ط± ط¨ط±ظˆط²ط§ظ‹.</div>
<div class="err-box"><strong>â‌Œ ط®ط·ط£ ط´ط§ط¦ط¹:</strong> طھظ‚ط¯ظٹظ… ط§ظ„ظƒط§ط¨طھط´ظٹظ†ظˆ ظپظٹ ظƒظˆط¨ ظƒط¨ظٹط±. ظƒظˆط¨ ط§ظ„ظƒط§ط¨طھط´ظٹظ†ظˆ ط§ظ„ظƒظ„ط§ط³ظٹظƒظٹ 150-180 ظ…ظ„ ظپظ‚ط·. ط¥ط°ط§ ظƒط§ظ† ط£ظƒط¨ط±طŒ ظٹطµط¨ط­ ظ„ط§طھظٹظ‡ ط¨ط±ط؛ظˆط©.</div>
<div class="ok-box"><strong>ًںژ¯ طھظ…ط±ظٹظ†:</strong> ظپظٹ ط¬ظ„ط³ط© ظˆط§ط­ط¯ط©طŒ ط­ط¶ظ‘ط± 3 ظ…ط´ط±ظˆط¨ط§طھ: ظ„ط§طھظٹظ‡طŒ ظƒط§ط¨طھط´ظٹظ†ظˆطŒ ظˆظپظ„ط§طھ ظˆط§ظٹطھ ط¨ط§ط³طھط®ط¯ط§ظ… ظ†ظپط³ ظƒظ…ظٹط© ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ. ظ„ط§ط­ط¸ ظƒظٹظپ طھط؛ظٹط± ظƒظ…ظٹط© ط§ظ„ط±ط؛ظˆط© ط§ظ„ط·ط¹ظ… ظˆط§ظ„ظ‚ظˆط§ظ…. ط³ط¬ظ„ ط§ظ†ط·ط¨ط§ط¹ظƒ.</div>`, en:`<h3>âک• Cappuccino & Mocha â€” Differences & Techniques</h3>
<p>Knowing the differences between espresso drinks is a <strong>hallmark of a professional barista</strong>. Each drink has its personality, ratio, and preparation technique.</p>
<h3>ًںں¤ Cappuccino â€” 1:1:1</h3>
<p><strong>Cappuccino</strong> was named after <strong>Capuchin monks</strong> because the drink's color resembles their light brown robes. Composition:<br>â€¢ <strong>1/3 espresso</strong> â€” the base (30ml double)<br>â€¢ <strong>1/3 steamed milk</strong> â€” creamy texture<br>â€¢ <strong>1/3 thick foam</strong> â€” a thick dry layer on top<br><br>Traditional Italian cappuccino is served in a <strong>150-180ml cup</strong>, dusted with cocoa or cinnamon. It should be strong enough to support the thick foam without sinking.</p>
<h3>ًںچ« Mocha â€” Espresso + Chocolate</h3>
<p><strong>Mocha</strong> (or Mochaccino) is an espresso drink with chocolate. Its name derives from the Yemeni port <strong>Mocha</strong> â€” the first coffee exporting port. Composition:<br>â€¢ <strong>Double espresso</strong> (30-60ml)<br>â€¢ <strong>Chocolate sauce</strong> (15-30ml) or cocoa powder mixed with hot water<br>â€¢ <strong>Steamed milk</strong> (150-200ml)<br>â€¢ <strong>Whipped cream</strong> (optional) + cocoa dusting</p>
<table><tr><th>Drink</th><th>Espresso</th><th>Milk</th><th>Foam</th><th>Add-ons</th></tr><tr><td>Latte</td><td>1</td><td>2</td><td>Light</td><td>â€”</td></tr><tr><td>Cappuccino</td><td>1</td><td>1</td><td>Thick dry</td><td>Cocoa/cinnamon</td></tr><tr><td>Mocha</td><td>1</td><td>2</td><td>Light</td><td>Chocolate + cream</td></tr><tr><td>Flat White</td><td>1</td><td>2</td><td>Very thin</td><td>â€”</td></tr><tr><td>Macchiato</td><td>1</td><td>Splash</td><td>Foam dot</td><td>â€”</td></tr><tr><td>Affogato</td><td>1</td><td>â€”</td><td>â€”</td><td>Vanilla ice cream</td></tr></table>
<div class="hl"><strong>ًں“ٹ Flat White vs Latte:</strong> Flat white uses <strong>more espresso</strong> (60ml double) with 2/3 milk and a very thin microfoam layer â€” originally from Australia/New Zealand. Coffee flavor is stronger and more prominent.</div>
<div class="err-box"><strong>â‌Œ Common Mistake:</strong> Serving cappuccino in a large cup. Classic cappuccino cup is 150-180ml only. Larger = latte with foam.</div>
<div class="ok-box"><strong>ًںژ¯ Exercise:</strong> In one session, prepare 3 drinks: latte, cappuccino, flat white â€” using the same espresso amount. Notice how foam amount changes taste and texture. Log your impressions.</div>`};

L['B1-0'] = {ar:`<h3>ًں”¥ ظƒظٹظ…ظٹط§ط، ط§ظ„طھط­ظ…ظٹطµ â€” طھظپط§ط¹ظ„ ظ…ظٹظ„ط§ط±ط¯</h3><p>ط§ظ„طھط­ظ…ظٹطµ ظٹط­ظˆظ„ ط§ظ„ط¨ظ† ط§ظ„ط£ط®ط¶ط± ظƒظٹظ…ظٹط§ط¦ظٹط§ظ‹ ظˆظپظٹط²ظٹط§ط¦ظٹط§ظ‹ ط¥ظ„ظ‰ ط¨ظ† ظ…ط­ظ…طµ. ظٹط¨ط¯ط£ طھظپط§ط¹ظ„ ظ…ظٹظ„ط§ط±ط¯ (Maillard) ط¹ظ†ط¯ 150آ°ظ… â€” ظˆظ‡ظˆ ط§ظ„ظ…ط³ط¤ظˆظ„ ط¹ظ† ط§ظ„ظ†ظƒظ‡ط§طھ ط§ظ„ظ…ط¹ظ‚ط¯ط©.</p>
<div class="img-c"><img src="\${photo('roast')}" alt=""><div class="cap">ًں”¥ ط¯ظˆط±ط© ط§ظ„طھط­ظ…ظٹطµ â€” ظ…ظ† ط§ظ„ط£ط®ط¶ط± ط¥ظ„ظ‰ ط§ظ„ط°ظ‡ط¨ظٹ</div></div>
<div class="img-c"><img src="${photo('roast')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًں”¥ طھط­ظˆظ„ ط­ط¨ط© ط§ظ„ط¨ظ† طھط­طھ ط§ظ„ط­ط±ط§ط±ط© â€” ط§ظ„ظƒظٹظ…ظٹط§ط، ط®ظ„ظپ ط§ظ„ظ†ظƒظ‡ط©</div></div>
<table><tr><th>ط§ظ„ظ…ط±ط­ظ„ط©</th><th>ط¯ط±ط¬ط© ط§ظ„ط­ط±ط§ط±ط©</th></tr><tr><td>ط§ظ„طھط¬ظپظٹظپ</td><td>30-100آ°ظ…</td></tr><tr><td>طھظپط§ط¹ظ„ ظ…ظٹظ„ط§ط±ط¯</td><td>150-190آ°ظ…</td></tr><tr><td>First Crack</td><td>196آ°ظ…</td></tr><tr><td>ط§ظ„طھط·ظˆظٹط±</td><td>196-220آ°ظ…</td></tr><tr><td>Second Crack</td><td>220آ°ظ…+</td></tr></table><div class="quiz-box"><strong>ًں’¬ ظ…ط±ط¬ط¹ SCA:</strong> ظ…ظ‚ظٹط§ط³ Agtron: #95 = ظپط§طھط­ ط¬ط¯ط§ظ‹طŒ #55 = ظ…طھظˆط³ط· (طھظˆط§ط²ظ†)طŒ #25 = ط¯ط§ظƒظ† ط¬ط¯ط§ظ‹.</div>`, en:`<h3>ًں”¥ Roasting Chemistry â€” Maillard Reaction</h3><p>Roasting transforms green coffee chemically and physically into roasted coffee. The Maillard Reaction starts at 150آ°C â€” responsible for complex flavors.</p>
<div class="img-c"><img src="\${photo('roast')}" alt=""><div class="cap">ًں”¥ Roasting Cycle â€” From Green to Golden</div></div>
<div class="img-c"><img src="${photo('roast')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًں”¥ The Bean's Transformation Under Heat â€” The Chemistry Behind Flavor</div></div>
<table><tr><th>Stage</th><th>Temperature</th></tr><tr><td>Drying</td><td>30-100آ°C</td></tr><tr><td>Maillard</td><td>150-190آ°C</td></tr><tr><td>First Crack</td><td>196آ°C</td></tr><tr><td>Development</td><td>196-220آ°C</td></tr><tr><td>Second Crack</td><td>220آ°C+</td></tr></table><div class="quiz-box"><strong>ًں’¬ SCA Reference:</strong> Agtron scale: #95 = very light, #55 = medium (balanced), #25 = very dark.</div>`};

L['B1-1'] = {ar:`<h3>ًں“ˆ ظ…ظ†ط­ظ†ظٹط§طھ ط§ظ„طھط­ظ…ظٹطµ</h3><p>ظ…ظ†ط­ظ†ظ‰ ط§ظ„طھط­ظ…ظٹطµ (Roast Curve) ظ‡ظˆ ط±ط³ظ… ط¨ظٹط§ظ†ظٹ ظٹظˆط«ظ‚ ط¯ط±ط¬ط© ط­ط±ط§ط±ط© ط§ظ„ط¨ظ† ط¹ط¨ط± ط§ظ„ط²ظ…ظ†. <strong>Rate of Rise (RoR):</strong> ظ…ط¹ط¯ظ„ ط§ط±طھظپط§ط¹ ط§ظ„ط­ط±ط§ط±ط© ط¨ط§ظ„ط¯ط±ط¬ط© ظپظٹ ط§ظ„ط¯ظ‚ظٹظ‚ط©. ظ…ظ†ط­ظ†ظ‰ ظ…ط«ط§ظ„ظٹ ظٹط¨ط¯ط£ ط¨ط§ظ†ط­ط¯ط§ط± طھط¯ط±ظٹط¬ظٹ.</p><div class="info-box"><strong>ًں“ٹ ط§ظ„ط«ط§ظ„ظˆط« ط§ظ„ط°ظ‡ط¨ظٹ:</strong> 1) ظˆظ‚طھ ط§ظ„طھط¬ظپظٹظپ: 4-5 ط¯ظ‚ط§ط¦ظ‚ 2) ظˆظ‚طھ ظ…ظٹظ„ط§ط±ط¯: 3-5 ط¯ظ‚ط§ط¦ظ‚ 3) ظˆظ‚طھ ط§ظ„طھط·ظˆظٹط±: 20-25% ظ…ظ† ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظˆظ‚طھ.</div>`, en:`<h3>ًں“ˆ Roast Curves</h3><p>A roast curve is a graph documenting bean temperature over time. <strong>Rate of Rise (RoR):</strong> Temperature increase rate in آ°C/min.</p><div class="info-box"><strong>ًں“ٹ Golden Triad:</strong> 1) Drying time: 4-5 min 2) Maillard time: 3-5 min 3) Development time: 20-25% of total.</div>`};

L['B1-2'] = {ar:`<h3>ًں”¬ طھط£ط«ظٹط± ط§ظ„طھط­ظ…ظٹطµ ط¹ظ„ظ‰ ط§ظ„ط§ط³طھط®ظ„ط§طµ</h3><p>ط§ظ„ط¨ظ† ط§ظ„ظپط§طھط­ (Light Roast) ط£ظƒط«ط± ظƒط«ط§ظپط© ظˆظٹط­طھط§ط¬ ط·ط­ظ†ط§ظ‹ ط£ط¯ظ‚. ط§ظ„ط¨ظ† ط§ظ„ط¯ط§ظƒظ† (Dark Roast) ط£ظƒط«ط± ظ…ط³ط§ظ…ظٹط© ظˆظٹط³طھط®ظ„طµ ط¨ط³ط±ط¹ط©.</p><table><tr><th>ط§ظ„طھط­ظ…ظٹطµ</th><th>ط·ط­ظ† ظ…ظ†ط§ط³ط¨</th></tr><tr><td>ظپط§طھط­</td><td>ظ†ط§ط¹ظ…</td></tr><tr><td>ظ…طھظˆط³ط·</td><td>ظ…طھظˆط³ط·</td></tr><tr><td>ط¯ط§ظƒظ†</td><td>ط®ط´ظ†</td></tr></table><div class="err-box"><strong>â‌Œ ط®ط·ط£ ط´ط§ط¦ط¹:</strong> ط§ط³طھط®ط¯ط§ظ… ظ†ظپط³ ط§ظ„ط·ط­ظ† ظ„ظƒظ„ ط¯ط±ط¬ط§طھ ط§ظ„طھط­ظ…ظٹطµ. ط§ظ„ط¨ظ† ط§ظ„ظپط§طھط­ ظٹط­طھط§ط¬ ط·ط­ظ†ط§ظ‹ ط£ط¯ظ‚ ظˆط§ظ„ط¯ط§ظƒظ† ظٹط­طھط§ط¬ ط£ط®ط´ظ†.</div>`, en:`<h3>ًں”¬ Roast Effect on Extraction</h3><p>Light roast is denser, needs finer grind. Dark roast is more porous, extracts quickly.</p><table><tr><th>Roast</th><th>Grind</th></tr><tr><td>Light</td><td>Fine</td></tr><tr><td>Medium</td><td>Medium</td></tr><tr><td>Dark</td><td>Coarse</td></tr></table><div class="err-box"><strong>â‌Œ Common Mistake:</strong> Using the same grind for all roast levels. Light needs finer, dark needs coarser.</div>`};

L['B2-0'] = {ar:`<h3>ًں’§ ظƒظٹظ…ظٹط§ط، ط§ظ„ظ…ط§ط،</h3><p>ط§ظ„ظ‚ظ‡ظˆط© 98-99% ظ…ط§ط،. ط§ظ„ط¹ظ†ط§طµط± ط§ظ„ظ…ط¤ط«ط±ط©: ط§ظ„ظƒط§ظ„ط³ظٹظˆظ… (Caآ²âپ؛) ظ„ظ„ط¬ط³ظ… ظˆط§ظ„ظ‚ظˆط§ظ…طŒ ط§ظ„ظ…ط؛ظ†ظٹط³ظٹظˆظ… (Mgآ²âپ؛) ظ„ظ„ظ†ظƒظ‡ط§طھ ط§ظ„ط²ظ‡ط±ظٹط©طŒ ط§ظ„ط¨ظٹظƒط±ط¨ظˆظ†ط§طھ (HCOâ‚ƒâپ») ظ„طھط®ظپظٹظپ ط§ظ„ط­ظ…ظˆط¶ط©.</p>
<div class="img-c"><img src="${photo('water')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًں’§ ط§ظ„ظ…ط§ط، â€” ط§ظ„ظ…ظƒظˆظ‘ظ† ط§ظ„ط±ط¦ظٹط³ظٹ ظپظٹ ظپظ†ط¬ط§ظ†ظƒ</div></div>
<div class="info-box"><strong>ًں“ٹ ظ‚ظٹط§ط³ط§طھ SCA ظ„ظ…ط§ط، ط§ظ„ظ‚ظ‡ظˆط©:</strong> TDS: 150-175 ppm آ· ط§ظ„ط¹ط³ط±: 60-120 ppm آ· ط§ظ„ظ‚ظ„ظˆظٹط©: 40-80 ppm آ· pH: 6.5-7.5</div>`, en:`<h3>ًں’§ Water Chemistry</h3><p>Coffee is 98-99% water. Key elements: Calcium (Caآ²âپ؛) for body, Magnesium (Mgآ²âپ؛) for floral notes, Bicarbonate (HCOâ‚ƒâپ») buffers acidity.</p>
<div class="img-c"><img src="${photo('water')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًں’§ Water â€” The Main Ingredient in Your Cup</div></div>
<div class="info-box"><strong>ًں“ٹ SCA Water Standards:</strong> TDS: 150-175 ppm آ· Hardness: 60-120 ppm آ· Alkalinity: 40-80 ppm آ· pH: 6.5-7.5</div>`};

L['B2-1'] = {ar:`<h3>ًں“ٹ TDS â€” ظ…ظپطھط§ط­ ط§ظ„ط§طھط³ط§ظ‚</h3><p>TDS (Total Dissolved Solids) = ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ظˆط§ط¯ ط§ظ„طµظ„ط¨ط© ط§ظ„ط°ط§ط¦ط¨ط©. ط§ظ„ظ†ط³ط¨ط© ط§ظ„ظ…ط«ظ„ظ‰ ظ„ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ظ‚ط·ط±ط©: 1.2-1.5%. ظٹظ‚ط§ط³ ط¨ط¬ظ‡ط§ط² Refractometer.</p><div class="hl"><strong>ظ…ط«ط§ظ„:</strong> 250 ظ…ظ„ ظ‚ظ‡ظˆط© TDS=1.4% = 3.5 ط¬ط±ط§ظ… ظ…ظˆط§ط¯ طµظ„ط¨ط©. ط¥ط°ط§ ط§ط³طھط®ط¯ظ…طھ 20 ط¬ط±ط§ظ… ط¨ظ†طŒ ط§ظ„ط§ط³طھط®ظ„ط§طµ = 3.5أ·20أ—100 = 17.5%.</div>`, en:`<h3>ًں“ٹ TDS â€” Key to Consistency</h3><p>TDS (Total Dissolved Solids) = total dissolved solids. Optimal for drip coffee: 1.2-1.5%. Measured with a Refractometer.</p><div class="hl"><strong>Example:</strong> 250ml coffee at 1.4% TDS = 3.5g solids. Using 20g coffee, extraction yield = 3.5/20x100 = 17.5%.</div>`};

L['B2-2'] = {ar:`<h3>ًں› ï¸ڈ ط£ظ†ط¸ظ…ط© ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ظ…ظٹط§ظ‡</h3>
<div class="img-c"><img src="\${photo('water')}" alt=""><div class="cap">ًں’§ ظ…ط±ط§ط­ظ„ طھظ†ظ‚ظٹط© ط§ظ„ظ…ط§ط، â€” ظ…ظ† ط§ظ„طµظ†ط¨ظˆط± ط¥ظ„ظ‰ ط§ظ„ظپظ†ط¬ط§ظ†</div></div>
<table><tr><th>ط§ظ„ظ†ط¸ط§ظ…</th><th>ط§ظ„ظ…ظ…ظٹط²ط§طھ</th></tr><tr><td>ظƒط±ط¨ظˆظ† ظ†ط´ط·</td><td>ط±ط®ظٹطµطŒ ظٹط²ظٹظ„ ط§ظ„ظƒظ„ظˆط± ظˆط§ظ„ط±ظˆط§ط¦ط­</td></tr><tr><td>طھط¨ط§ط¯ظ„ ط£ظٹظˆظ†ظٹ</td><td>ظٹط¶ط¨ط· ط§ظ„ط¹ط³ط± ظˆط§ظ„ظ‚ظ„ظˆظٹط©</td></tr><tr><td>RO + ط¥ط¹ط§ط¯ط© طھظ…ط¹ط¯ظ†</td><td>طھط­ظƒظ… ظƒط§ظ…ظ„طŒ ط؛ط§ظ„ظٹ</td></tr></table><div class="ok-box"><strong>ًں’، طھظˆطµظٹط©:</strong> ظ„ظ…ط¹ط¸ظ… ط§ظ„ظ…ظ‚ط§ظ‡ظٹ: ظƒط±ط¨ظˆظ† ظ†ط´ط· + ظپظ„طھط±ظٹظˆظ… ط£ظٹظˆظ†ظٹ ظٹظƒظپظٹ ظ„ظ„ظˆطµظˆظ„ ط¥ظ„ظ‰ TDS 150-175 ppm.</div>`, en:`<h3>ًں› ï¸ڈ Water Treatment Systems</h3>
<div class="img-c"><img src="\${photo('water')}" alt=""><div class="cap">ًں’§ Water Purification â€” From Tap to Cup</div></div>
<table><tr><th>System</th><th>Pros</th></tr><tr><td>Activated Carbon</td><td>Cheap, removes chlorine</td></tr><tr><td>Ion Exchange</td><td>Adjusts hardness &amp; alkalinity</td></tr><tr><td>RO + Remineralization</td><td>Full control, expensive</td></tr></table><div class="ok-box"><strong>ًں’، Recommendation:</strong> Most cafes: carbon + ion exchange filter to reach TDS 150-175 ppm.</div>`};

L['B3-0'] = {ar:`<h3>âڑ™ï¸ڈ طھظˆط²ظٹط¹ ط­ط¬ظ… ط§ظ„ط·ط­ظ† (PSD)</h3><p>ظƒظ„ ط¯ط±ط¬ط© ط·ط­ظ† طھظ†طھط¬ طھظˆط²ظٹط¹ط§ظ‹ ظ…ظ† ط§ظ„ط£ط­ط¬ط§ظ…. ط§ظ„ظ…ط·ط­ظ†ط© ط§ظ„ط¬ظٹط¯ط© طھظ†طھط¬ طھظˆط²ظٹط¹ط§ظ‹ ط¶ظٹظ‚ط§ظ‹. ط§ظ„ظ…ط·ط­ظ†ط© ط§ظ„ط±ط¯ظٹط¦ط© طھظ†طھط¬ ط؛ط¨ط§ط± ظ†ط§ط¹ظ… (Fines) ظˆط­ط¨ظٹط¨ط§طھ ط®ط´ظ†ط© (Boulders).</p>
<div class="img-c"><img src="${photo('beans')}" alt="" loading="lazy"> loading="lazy"<div class="cap">âڑ™ï¸ڈ طھظˆط²ظٹط¹ ط­ط¬ظ… ط§ظ„ط·ط­ظ† â€” ظ…ظپطھط§ط­ ط§ظ„ط§ط³طھط®ظ„ط§طµ ط§ظ„ظ…طھط³ط§ظˆظٹ</div></div>
<div class="info-box"><strong>ًں“ٹ ظ‚ظٹط§ط³ ط§ظ„ط·ط­ظ†:</strong> ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ = 200-350 ظ…ظٹظƒط±ظˆظ† آ· V60 = 500-800 ظ…ظٹظƒط±ظˆظ† آ· French Press = 800-1200 ظ…ظٹظƒط±ظˆظ†</div>`, en:`<h3>âڑ™ï¸ڈ Particle Size Distribution (PSD)</h3><p>Every grind setting produces a distribution of particle sizes. A good grinder produces a narrow distribution. Poor grinders produce fines and boulders.</p>
<div class="img-c"><img src="${photo('beans')}" alt="" loading="lazy"> loading="lazy"<div class="cap">âڑ™ï¸ڈ Particle Size Distribution â€” Key to Even Extraction</div></div>
<div class="info-box"><strong>ًں“ٹ Grind Measurement:</strong> Espresso = 200-350 micron آ· V60 = 500-800 micron آ· French Press = 800-1200 micron</div>`};

L['B3-1'] = {ar:`<h3>âڑ™ï¸ڈ ط§ظ„ط§ط³طھط®ظ„ط§طµ ط§ظ„ظ…طھظ‚ط¯ظ… â€” ط§ظ„طھط­ظƒظ… ظپظٹ TDS</h3><p>ط§ظ„ط§ط³طھط®ظ„ط§طµ (Extraction Yield) ظ‡ظˆ <strong>ظ†ط³ط¨ط© ط§ظ„ظ…ظˆط§ط¯ ط§ظ„طµظ„ط¨ط© ط§ظ„ظ…ط°ط§ط¨ط©</strong> ظ…ظ† ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط¬ط§ظپط© ط¥ظ„ظ‰ ظˆط²ظ† ط§ظ„ظ…ط´ط±ظˆط¨ ط§ظ„ظ†ظ‡ط§ط¦ظٹ. ظ‡ط°ظ‡ ظ‡ظٹ <strong>ط§ظ„ظ…ط¹ط§ط¯ظ„ط© ط§ظ„ط°ظ‡ط¨ظٹط©</strong> ط§ظ„طھظٹ طھظپطµظ„ ط§ظ„ط¨ط§ط±ظٹط³طھط§ ط§ظ„ط¹ط§ط¯ظٹ ط¹ظ† ط§ظ„ظ…ط­طھط±ظپ.</p>
<div class="info-box"><strong>ًں“ٹ ظ…ط¹ط§ط¯ظ„ط© ط§ظ„ط§ط³طھط®ظ„ط§طµ:</strong><br>Extraction Yield (%) = (TDS أ— ظˆط²ظ† ط§ظ„ظ…ط´ط±ظˆط¨) أ· ظˆط²ظ† ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط¬ط§ظپط© أ— 100<br><br><strong>ظ…ط«ط§ظ„:</strong> 20 ط¬ط±ط§ظ… ظ‚ظ‡ظˆط© â†’ 300 ظ…ظ„ ظ…ط´ط±ظˆط¨ TDS=1.4%<br>= (0.014 أ— 300) أ· 20 أ— 100 = 4.2 أ· 20 أ— 100 = <strong>21%</strong> âœ… ط¶ظ…ظ† ط§ظ„ظ†ط·ط§ظ‚ ط§ظ„ظ…ط«ط§ظ„ظٹ</div>
<h3>ًں“ˆ ط®ط±ظٹط·ط© ط§ظ„طھط­ظƒظ… ظپظٹ ط§ظ„ط§ط³طھط®ظ„ط§طµ (Brewing Control Chart)</h3><table><tr><th>ط§ظ„ظ…ظ†ط·ظ‚ط©</th><th>ط§ظ„ظ†ط·ط§ظ‚</th><th>ط§ظ„ط·ط¹ظ…</th><th>ط§ظ„ط­ظ„</th></tr><tr><td>ط§ط³طھط®ظ„ط§طµ ظ†ط§ظ‚طµ</td><td>&lt; 18%</td><td>ط­ط§ظ…ط¶طŒ ظ…ط§ظ„ط­طŒ ط®ظپظٹظپ</td><td>ط§ط·ط­ظ† ط£ط¯ظ‚ / ط³ط®ظ‘ظ† ط§ظ„ظ…ط§ط، / ط²ظˆظ‘ط¯ ط§ظ„ظˆظ‚طھ</td></tr><tr><td>ط§ظ„ظ†ط·ط§ظ‚ ط§ظ„ظ…ط«ط§ظ„ظٹ</td><td>18-22%</td><td>ظ…طھظˆط§ط²ظ†طŒ ط­ظ„ظˆطŒ ظƒط§ظ…ظ„</td><td>â€”</td></tr><tr><td>ط§ط³طھط®ظ„ط§طµ ط²ط§ط¦ط¯</td><td>&gt; 22%</td><td>ظ…ط±طŒ ط¬ط§ظپطŒ ظ‚ط§ط¨ط¶</td><td>ط§ط·ط­ظ† ط£ط®ط´ظ† / ط¨ط±ظ‘ط¯ ط§ظ„ظ…ط§ط، / ظ‚ظ„ظ‘ظ„ ط§ظ„ظˆظ‚طھ</td></tr></table>
<h3>ًں› ï¸ڈ ظƒظٹظپ طھط¶ط¨ط· ط§ظ„ط§ط³طھط®ظ„ط§طµطں</h3><p>ط¹ظ†ط¯ ظ…ظˆط§ط¬ظ‡ط© ظ…ط´ظƒظ„ط© ظپظٹ ط§ظ„ط·ط¹ظ…طŒ ط§طھط¨ط¹ ظ‡ط°ط§ ط§ظ„طھط³ظ„ط³ظ„:<br>â€¢ <strong>ط·ط¹ظ… ط­ط§ظ…ط¶ (ط§ط³طھط®ظ„ط§طµ ظ†ط§ظ‚طµ):</strong> ط§ط·ط­ظ† ط£ط¯ظ‚ ط£ظˆظ„ط§ظ‹ â€” ظ‡ط°ط§ ط£ط³ظ‡ظ„ طھط؛ظٹظٹط±. ط¥ط°ط§ ظ…ط§ ط²ط§ظ„ ط­ط§ظ…ط¶ط§ظ‹طŒ ط²ظˆظ‘ط¯ ط­ط±ط§ط±ط© ط§ظ„ظ…ط§ط، 1-2آ°ظ….<br>â€¢ <strong>ط·ط¹ظ… ظ…ط± (ط§ط³طھط®ظ„ط§طµ ط²ط§ط¦ط¯):</strong> ط§ط·ط­ظ† ط£ط®ط´ظ† ط£ظˆظ„ط§ظ‹ â€” ط³ظٹظ‚ظ„ظ‘ظ„ ظˆظ‚طھ ط§ظ„طھظ„ط§ظ…ط³. ط¥ط°ط§ ظ…ط§ ط²ط§ظ„ ظ…ط±ط§ظ‹طŒ ظ‚ظ„ظ‘ظ„ ط­ط±ط§ط±ط© ط§ظ„ظ…ط§ط،.<br>â€¢ <strong>ط·ط¹ظ… ظ…ط§ظ„ط­ ط£ظˆ ط¹ظƒط±:</strong> طھط£ظƒط¯ ظ…ظ† طھظˆط²ظٹط¹ ط§ظ„ط·ط­ظ† ط¨ط§ظ„طھط³ط§ظˆظٹ (WDT) ظˆط¶ط؛ط· ط§ظ„ظ‚ظ‡ظˆط© ط¨ط´ظƒظ„ ظ…طھط³ط§ظˆظچ.</p>
<div class="hl"><strong>ًں“ٹ ظ†ط·ط§ظ‚ TDS ط§ظ„ظ…ط«ط§ظ„ظٹ:</strong><br>â€¢ ظ‚ظ‡ظˆط© ظ…ظ‚ط·ط±ط©: 1.2-1.5% TDS<br>â€¢ ط¥ط³ط¨ط±ظٹط³ظˆ: 8-12% TDS<br>â€¢ Cold Brew: 1.3-1.8% TDS<br>â€¢ AeroPress: 1.3-1.7% TDS</div>
<div class="ok-box"><strong>ًں’، طھظ‚ظ†ظٹط© ظ…طھظ‚ط¯ظ…ط©:</strong> ط§ط³طھط®ط¯ظ… TDS ظ…طھط± (Refractometer) ظ„ظ‚ظٹط§ط³ TDS ط¨ط¯ظ‚ط©. ط³ط¬ظ„ ظƒظ„ ظ…طھط؛ظٹط± (ط·ط­ظ†طŒ ط­ط±ط§ط±ط©طŒ ظ†ط³ط¨ط©طŒ ظˆظ‚طھ) ظ„ظƒظ„ ظ‚ظ‡ظˆط© طھظ‚ط¯ظ…ظ‡ط§. ط¨ط¹ط¯ 50 طھط³ط¬ظٹظ„طŒ ط³طھط¨ط¯ط£ ط¨ط±ط¤ظٹط© ط£ظ†ظ…ط§ط· ظˆط§ط¶ط­ط©.</div>`, en:`<h3>âڑ™ï¸ڈ Advanced Extraction â€” TDS Control</h3><p>Extraction Yield is the <strong>percentage of dissolved solids</strong> from dry coffee in the final beverage. This is the <strong>golden formula</strong> that separates average baristas from professionals.</p>
<div class="info-box"><strong>ًں“ٹ Extraction Formula:</strong><br>Extraction Yield (%) = (TDS أ— Beverage Weight) أ· Dry Coffee Weight أ— 100<br><br><strong>Example:</strong> 20g coffee â†’ 300ml brew at 1.4% TDS<br>= (0.014 أ— 300) أ· 20 أ— 100 = 4.2 أ· 20 أ— 100 = <strong>21%</strong> âœ… Within optimal range</div>
<h3>ًں“ˆ Brewing Control Chart</h3><table><tr><th>Zone</th><th>Range</th><th>Taste</th><th>Fix</th></tr><tr><td>Under-extracted</td><td>&lt; 18%</td><td>Sour, salty, thin</td><td>Grind finer / hotter water / longer time</td></tr><tr><td>Optimal</td><td>18-22%</td><td>Balanced, sweet, full</td><td>â€”</td></tr><tr><td>Over-extracted</td><td>&gt; 22%</td><td>Bitter, dry, astringent</td><td>Grind coarser / cooler water / shorter time</td></tr></table>
<h3>ًں› ï¸ڈ How to Dial In?</h3><p>When troubleshooting flavor, follow this sequence:<br>â€¢ <strong>Sour (under-extracted):</strong> Grind finer first â€” this is the easiest change. If still sour, increase water temp 1-2آ°C.<br>â€¢ <strong>Bitter (over-extracted):</strong> Grind coarser first â€” reduces contact time. If still bitter, lower water temp.<br>â€¢ <strong>Salty or uneven:</strong> Ensure even grind distribution (WDT) and level tamping.</p>
<div class="hl"><strong>ًں“ٹ Ideal TDS Range:</strong><br>â€¢ Drip coffee: 1.2-1.5% TDS<br>â€¢ Espresso: 8-12% TDS<br>â€¢ Cold Brew: 1.3-1.8% TDS<br>â€¢ AeroPress: 1.3-1.7% TDS</div>
<div class="ok-box"><strong>ًں’، Advanced Tip:</strong> Use a Refractometer to measure TDS precisely. Log every variable (grind, temp, ratio, time) for each coffee you serve. After 50 logs, patterns will emerge clearly.</div>`};

L['B3-2'] = {ar:`<h3>ًں“ٹ طھط­ط³ظٹظ† ط¬ظˆط¯ط© ط§ظ„ظپظ†ط¬ط§ظ† â€” ط¹ظ„ظ… ط§ظ„ط¶ط¨ط·</h3><p>طھط­ط³ظٹظ† ط§ظ„ط¬ظˆط¯ط© ظ„ظٹط³ ظ…ظˆظ‡ط¨ط© â€” ط¥ظ†ظ‡ <strong>ظ†ط¸ط§ظ…</strong>. ط§ظ„ط¨ط§ط±ظٹط³طھط§ ط§ظ„ظ…ط­طھط±ظپ ظٹط³ط¬ظ„ ظƒظ„ ظ…طھط؛ظٹط± ظˆظٹط±ط¨ط·ظ‡ ط¨ظ†طھظٹط¬ط© ط§ظ„طھط°ظˆظ‚. ظ‡ط°ط§ ظ‡ظˆ ط§ظ„ظپط±ظ‚ ط¨ظٹظ† ط§ظ„طھط®ظ…ظٹظ† ظˆط§ظ„ط¹ظ„ظ….</p>
<h3>ًں“‹ ط³ط¬ظ„ ط§ظ„طھط­ط¶ظٹط± ط§ظ„ظ…ط«ط§ظ„ظٹ</h3>
<table><tr><th>ط§ظ„ظ…طھط؛ظٹط±</th><th>ط§ظ„ظ‚ظٹظ…ط©</th><th>طھط£ط«ظٹط±ظ‡ ط¹ظ„ظ‰ ط§ظ„ط·ط¹ظ…</th></tr><tr><td>ط¯ط±ط¬ط© ط§ظ„ط·ط­ظ†</td><td>ط±ظ‚ظ… ط§ظ„ظ…ط·ط­ظ†ط© / ط§ظ„ظ…ظٹظƒط±ظˆظ†</td><td>ظٹط­ط¯ط¯ ط³ط±ط¹ط© ط§ظ„ط§ط³طھط®ظ„ط§طµ â€” ط£ط¯ظ‚ = ط£ط¨ط·ط£</td></tr><tr><td>ط­ط±ط§ط±ط© ط§ظ„ظ…ط§ط،</td><td>آ°ظ…</td><td>ظٹط­ط¯ط¯ ظ…ط¹ط¯ظ„ ط§ظ„ط°ظˆط¨ط§ظ† â€” ط£ط³ط®ظ† = ط£ط³ط±ط¹</td></tr><tr><td>ط§ظ„ظ†ط³ط¨ط©</td><td>ظ‚ظ‡ظˆط©:ظ…ط§ط،</td><td>ظٹط­ط¯ط¯ ط§ظ„ظ‚ظˆط© ظˆط§ظ„طھط±ظƒظٹط²</td></tr><tr><td>ظˆظ‚طھ ط§ظ„طھظ„ط§ظ…ط³</td><td>ط¯ظ‚ظٹظ‚ط©:ط«ط§ظ†ظٹط©</td><td>ظٹط­ط¯ط¯ ظƒظ…ظٹط© ط§ظ„ظ…ظˆط§ط¯ ط§ظ„ظ…ط°ط§ط¨ط©</td></tr><tr><td>TDS</td><td>%</td><td>ظٹظ‚ظٹط³ طھط±ظƒظٹط² ط§ظ„ظ‚ظ‡ظˆط© ظپظٹ ط§ظ„ظ…ط´ط±ظˆط¨</td></tr><tr><td>ظˆط²ظ† ط§ظ„ظ†ط§طھط¬</td><td>ط¬ط±ط§ظ…</td><td>ظ„ط­ط³ط§ط¨ ط§ظ„ط§ط³طھط®ظ„ط§طµ ط§ظ„ظ†ظ‡ط§ط¦ظٹ</td></tr><tr><td>طھظ‚ظٹظ… ط§ظ„ط·ط¹ظ…</td><td>1-10</td><td>طھظ‚ظٹظٹظ… ط´ط®طµظٹ ظ„ظ„ط­ظ…ظˆط¶ط©طŒ ط§ظ„ط­ظ„ط§ظˆط©طŒ ط§ظ„ظ‚ظˆط§ظ…</td></tr></table>
<h3>ًں”¬ ط§ظ„طھط´ط®ظٹطµ ط§ظ„ظ…ظ†ظ‡ط¬ظٹ</h3><p>ط¹ظ†ط¯ظ…ط§ طھظ‚ط¯ظ… ظ‚ظ‡ظˆط© ط¬ط¯ظٹط¯ط© ظ„ط²ط¨ظˆظ†:</p><ol><li><strong>ط§ط³ط£ظ„:</strong> ظ‡ظ„ طھط´ط¹ط± ط¨ط­ظ…ظˆط¶ط© ط¹ط§ظ„ظٹط©طں ظ…ط±ط§ط±ط©طں ظ‚ظˆط§ظ… ط®ظپظٹظپطں</li><li><strong>ط­ظ„ظ‘ظ„:</strong> ط§ظ„ط­ظ…ظˆط¶ط© ط§ظ„ط¹ط§ظ„ظٹط© â†گ ط§ط³طھط®ظ„ط§طµ ظ†ط§ظ‚طµ â†گ ط§ط·ط­ظ† ط£ط¯ظ‚. ط§ظ„ظ…ط±ط§ط±ط© â†گ ط§ط³طھط®ظ„ط§طµ ط²ط§ط¦ط¯ â†گ ط§ط·ط­ظ† ط£ط®ط´ظ†.</li><li><strong>ط¹ط¯ظ‘ظ„ ظ…طھط؛ظٹط±ط§ظ‹ ظˆط§ط­ط¯ط§ظ‹ ظپظ‚ط·</strong> ظپظٹ ظƒظ„ ظ…ط±ط©.</li><li><strong>ط³ط¬ظ„:</strong> ط§ظƒطھط¨ ط§ظ„طھط¹ط¯ظٹظ„ ظˆط§ظ„ظ†طھظٹط¬ط©. ظƒط±ط± ط­طھظ‰ طھطµظ„ ظ„ظ„ط·ط¹ظ… ط§ظ„ظ…ط«ط§ظ„ظٹ.</li></ol>
<div class="hl"><strong>ًں“ٹ ظ…ط¹ط§ط¯ظ„ط© ط§ظ„ظ†ط¬ط§ط­:</strong> (ظ‚ظ‡ظˆط© ط¹ط§ظ„ظٹط© ط§ظ„ط¬ظˆط¯ط© + ظ…ط§ط، ظ…ط«ط§ظ„ظٹ + ط·ط­ظ† ط¯ظ‚ظٹظ‚ + ظ†ط³ط¨ط© طµط­ظٹط­ط© + ط­ط±ط§ط±ط© ظ…ط¶ط¨ظˆط·ط© + ظˆظ‚طھ ظ…ظ†ط§ط³ط¨) أ— ط§ظ„ط§طھط³ط§ظ‚ = ظپظ†ط¬ط§ظ† ظ…ظ…طھط§ط² ظƒظ„ ظ…ط±ط©</div>
<div class="ok-box"><strong>ًں’، طھظˆطµظٹط©:</strong> ط§ط­طھظپط¸ ط¨ط¯ظپطھط± (Brew Log) ظ„ظƒظ„ ظ‚ظ‡ظˆط© طھظ‚ط¯ظ…ظ‡ط§. ط¨ط¹ط¯ 100 طھط³ط¬ظٹظ„طŒ ط³طھطµط¨ط­ ظ‚ط§ط¯ط±ط§ظ‹ ط¹ظ„ظ‰ طھظˆظ‚ط¹ ط§ظ„ظ†طھط§ط¦ط¬ ط¨ط¯ظ‚ط© 90% ظ‚ط¨ظ„ ط£ظ† طھط¨ط¯ط£ ط§ظ„طھط­ط¶ظٹط±.</div>`, en:`<h3>ًں“ٹ Cup Quality Optimization â€” The Science of Dialing In</h3><p>Quality optimization isn't talent â€” it's a <strong>system</strong>. Professional baristas log every variable and connect it to tasting results. This is the difference between guessing and science.</p>
<h3>ًں“‹ Brew Log Template</h3>
<table><tr><th>Variable</th><th>Value</th><th>Flavor Impact</th></tr><tr><td>Grind Setting</td><td>Burr # / Micron</td><td>Controls extraction speed â€” finer = slower</td></tr><tr><td>Water Temp</td><td>آ°C</td><td>Controls dissolution rate â€” hotter = faster</td></tr><tr><td>Ratio</td><td>Coffee:Water</td><td>Controls strength and concentration</td></tr><tr><td>Contact Time</td><td>min:sec</td><td>Controls total dissolved solids</td></tr><tr><td>TDS</td><td>%</td><td>Measures coffee concentration in brew</td></tr><tr><td>Yield Weight</td><td>grams</td><td>For calculating final extraction</td></tr><tr><td>Taste Score</td><td>1-10</td><td>Personal assessment of acidity, sweet, body</td></tr></table>
<h3>ًں”¬ Systematic Diagnosis</h3><p>When serving a new coffee to a customer:</p><ol><li><strong>Ask:</strong> Do you taste high acidity? Bitterness? Thin body?</li><li><strong>Analyze:</strong> High acidity â†گ under-extracted â†گ grind finer. Bitterness â†گ over-extracted â†گ grind coarser.</li><li><strong>Change only ONE variable</strong> at a time.</li><li><strong>Log:</strong> Write the adjustment and result. Repeat until perfect.</li></ol>
<div class="hl"><strong>ًں“ٹ Success Formula:</strong> (Quality coffee + ideal water + precise grind + correct ratio + controlled temp + proper time) أ— Consistency = Perfect cup every time</div>
<div class="ok-box"><strong>ًں’، Recommendation:</strong> Keep a Brew Log for every coffee you serve. After 100 entries, you'll predict results with 90% accuracy before you even start brewing.</div>`};

L['C1-0'] = {ar:`<h3>ًں‘ƒ ط£ط³ط§ط³ظٹط§طھ ط§ظ„طھط°ظˆظ‚ (Cupping) â€” ط¯ظ„ظٹظ„ظƒ ط§ظ„ظƒط§ظ…ظ„</h3>
<p>ط§ظ„ظƒط§ط¨ظٹظ†ط¬ (Cupping) ظ‡ظˆ <strong>ط§ظ„ط·ط±ظٹظ‚ط© ط§ظ„ظ…ط¹ظٹط§ط±ظٹط© ط§ظ„ط¯ظˆظ„ظٹط©</strong> ظ„طھظ‚ظٹظٹظ… ط§ظ„ظ‚ظ‡ظˆط©طŒ ط·ظˆط±طھظ‡ط§ SCA ظ„طھظˆط­ظٹط¯ ظ„ط؛ط© ط§ظ„طھظ‚ظٹظٹظ… ط¨ظٹظ† ظ…ط­طھط±ظپظٹ ط§ظ„ظ‚ظ‡ظˆط© ظپظٹ ط¬ظ…ظٹط¹ ط£ظ†ط­ط§ط، ط§ظ„ط¹ط§ظ„ظ…. ظٹط³ظ…ط­ ظ„ظƒ ط¨طھط°ظˆظ‚ ط§ظ„ظ‚ظ‡ظˆط© <strong>ظ†ظ‚ظٹط© ط¨ط¯ظˆظ† ط­ظ„ظٹط¨ ط£ظˆ ط³ظƒط±</strong>طŒ ظ„طھظ‚ظٹظٹظ… طµظپط§طھظ‡ط§ ط§ظ„ط­ظ‚ظٹظ‚ظٹط©.</p>
<div class="img-c"><img src="\${photo('cupping')}" alt=""><div class="cap">ًں§ھ ظ…ط­ط·ط© ط§ظ„ظƒط¨ظٹظ†ط¬ â€” طھظ‚ظٹظٹظ… ط§ط­طھط±ط§ظپظٹ ظ„ظ„ظ‚ظ‡ظˆط©</div></div>
<div class="img-c"><img src="${photo('cupping')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًں§ھ ط§ظ„طھظ‚ظٹظٹظ… ط§ظ„ط­ط³ظٹ â€” ظپظ† طھط°ظˆظ‚ ط§ظ„ظ‚ظ‡ظˆط©</div></div>
<h3>ًں“‹ ط®ط·ظˆط§طھ ط§ظ„ظƒط§ط¨ظٹظ†ط¬ â€” 6 ظ…ط±ط§ط­ظ„</h3>
<ol><li><strong>ط§ظ„ط·ط­ظ†:</strong> ط§ط·ط­ظ† ط§ظ„ط¨ظ† ط¨ط¯ط±ط¬ط© ط®ط´ظ†ط© (ظ…ط«ظ„ ظ…ظ„ط­ ط§ظ„ط¨ط­ط±) â€” ظˆط²ظ† 8-9 ط¬ط±ط§ظ… ظ„ظƒظ„ ظƒظˆط¨ ظƒط§ط¨ظٹظ†ط¬ ظ‚ظٹط§ط³ظٹ</li>
<li><strong>ط§ظ„ط±ط§ط¦ط­ط© ط§ظ„ط¬ط§ظپط© (Fragrance):</strong> ط§ط´ظ… ط§ظ„ط¨ظ† ط§ظ„ظ…ط·ط­ظˆظ† ظ…ط¨ط§ط´ط±ط© â€” ط³ط¬ظ„ ط£ظˆظ„ ط§ظ†ط·ط¨ط§ط¹ (ط²ظ‡ط±ظٹطں ظپط§ظƒظ‡ظٹطں ظ…ط­ظ…طµطں)</li>
<li><strong>ط¥ط¶ط§ظپط© ط§ظ„ظ…ط§ط،:</strong> ط£ط¶ظپ ظ…ط§ط، ط¨ط¯ط±ط¬ط© 93-96آ°ظ… ط¨ظ†ط³ط¨ط© 1:18 (150 ظ…ظ„ ظ„ظƒظ„ 8 ط¬ط±ط§ظ… ط¨ظ†). ط§ط¨ط¯ط£ ط§ظ„ظ…ط¤ظ‚طھ</li>
<li><strong>ط§ظ„ط±ط§ط¦ط­ط© ط§ظ„ط±ط·ط¨ط© (Aroma):</strong> ط¨ط¹ط¯ ط¥ط¶ط§ظپط© ط§ظ„ظ…ط§ط، ظ…ط¨ط§ط´ط±ط©طŒ ط§ط´ظ… ط§ظ„ط±ط§ط¦ط­ط© ط§ظ„ظ…طھطµط§ط¹ط¯ط© â€” ظ‡ظ†ط§ طھط¸ظ‡ط± ط§ظ„ظ†ظƒظ‡ط§طھ ط§ظ„ط¯ظ‚ظٹظ‚ط©</li>
<li><strong>ظƒط³ط± ط§ظ„ظ‚ط´ط±ط© (Crust):</strong> ط¨ط¹ط¯ 4 ط¯ظ‚ط§ط¦ظ‚طŒ ط§ظƒط³ط± ط§ظ„ظ‚ط´ط±ط© ط§ظ„ظ…طھظƒظˆظ†ط© ط¹ظ„ظ‰ ط§ظ„ط³ط·ط­ ط¨ظ…ظ„ط¹ظ‚ط© ط§ظ„ظƒط§ط¨ظٹظ†ط¬ â€” ط§ط´ظ… ط§ظ„طھطµط§ط¹ط¯ ط§ظ„ظ‚ظˆظٹ ظ„ظ„ط±ظˆط§ط¦ط­</li>
<li><strong>ط§ظ„طھط°ظˆظ‚ (Tasting):</strong> ط¨ط¹ط¯ 8-15 ط¯ظ‚ظٹظ‚ط© (ط¹ظ†ط¯ظ…ط§ طھط¨ط±ط¯ ط§ظ„ظ‚ظ‡ظˆط© ظ„ظ€ 70آ°ظ…)طŒ ط§ط¨ط¯ط£ ط§ظ„طھط°ظˆظ‚. ط§ط³طھط®ط¯ظ… ظ…ظ„ط¹ظ‚ط© ظƒط§ط¨ظٹظ†ط¬ ط¹ظ…ظٹظ‚ط© ظˆط§ظ…طھطµ ط§ظ„ظ‚ظ‡ظˆط© ط¨طµظˆطھ ط¹ط§ظ„ظچ (Slurp) ظ„طھط±ط´ظٹط´ظ‡ط§ ط¹ظ„ظ‰ ظƒظ„ ط¨ط±ط§ط¹ظ… ط§ظ„طھط°ظˆظ‚</li></ol>
<h3>ًں“ٹ ط§ط³طھظ…ط§ط±ط© ط§ظ„طھظ‚ظٹظٹظ… SCA â€” 10 ظ…ط¹ط§ظٹظٹط±</h3>
<table><tr><th>ط§ظ„ظ…ط¹ظٹط§ط±</th><th>ط§ظ„ظˆطµظپ</th><th>ط§ظ„ط¯ط±ط¬ط©</th></tr><tr><td>Fragrance/Aroma</td><td>ط§ظ„ط±ط§ط¦ط­ط© ط§ظ„ط¬ط§ظپط© ظˆط§ظ„ط±ط·ط¨ط©</td><td>0-10</td></tr><tr><td>Flavor</td><td>ط§ظ„ظ†ظƒظ‡ط© ط§ظ„ظƒظ„ظٹط© â€” ط§ظ„ط§ظ†ط·ط¨ط§ط¹ ط§ظ„ط£ظˆظ„</td><td>0-10</td></tr><tr><td>Aftertaste</td><td>ط§ظ„ظ†ظƒظ‡ط© ط§ظ„ط¨ط§ظ‚ظٹط© ط¨ط¹ط¯ ط§ظ„ط¨ظ„ط¹</td><td>0-10</td></tr><tr><td>Acidity</td><td>ط§ظ„ط­ظ…ظˆط¶ط© â€” ظ†ط¶ط§ط±ط© ظˆط¥ط´ط±ط§ظ‚</td><td>0-10</td></tr><tr><td>Body</td><td>ط§ظ„ظ‚ظˆط§ظ… â€” ط§ظ„ظˆط²ظ† ط¹ظ„ظ‰ ط§ظ„ظ„ط³ط§ظ†</td><td>0-10</td></tr><tr><td>Balance</td><td>طھظˆط§ط²ظ† ط§ظ„ظ†ظƒظ‡ط§طھ</td><td>0-10</td></tr><tr><td>Uniformity</td><td>ط§طھط³ط§ظ‚ ط§ظ„ط¹ظٹظ†ط§طھ</td><td>0-10</td></tr><tr><td>Clean Cup</td><td>ظ†ط¸ط§ظپط© ط§ظ„ظƒظˆط¨ â€” ظ„ط§ ط¹ظٹظˆط¨</td><td>0-10</td></tr><tr><td>Sweetness</td><td>ط§ظ„ط­ظ„ط§ظˆط© ط§ظ„ط·ط¨ظٹط¹ظٹط©</td><td>0-10</td></tr><tr><td>Overall</td><td>ط§ظ„ط§ظ†ط·ط¨ط§ط¹ ط§ظ„ط¹ط§ظ…</td><td>0-10</td></tr></table>
<div class="hl"><strong>ًں“ٹ ظ…ظپطھط§ط­ ط§ظ„ط¯ط±ط¬ط§طھ:</strong> 6-6.75 = ط¬ظٹط¯ آ· 7-7.75 = ط¬ظٹط¯ ط¬ط¯ط§ظ‹ آ· 8-8.75 = ظ…ظ…طھط§ط² آ· 9-10 = ط§ط³طھط«ظ†ط§ط¦ظٹ. ط§ظ„ط¯ط±ط¬ط© ط§ظ„ظƒظ„ظٹط© 80+ = Specialty Grade.</div>
<div class="ok-box"><strong>ًںژ¯ طھظ…ط±ظٹظ†:</strong> ط§ط´طھط±ظٹ 3 ط£ظ†ظˆط§ط¹ ط¨ظ† ظ…ظ† ط£طµظˆظ„ ظ…ط®طھظ„ظپط© (ط¥ط«ظٹظˆط¨ظٹطŒ ظƒظˆظ„ظˆظ…ط¨ظٹطŒ ظˆط¨ط±ط§ط²ظٹظ„ظٹ). ط§ط¹ظ…ظ„ ظƒط§ط¨ظٹظ†ط¬ ظ„ط¬ظ…ظٹط¹ظ‡ظ… ظپظٹ ط¬ظ„ط³ط© ظˆط§ط­ط¯ط©. ط¯ظˆظ† ظ…ظ„ط§ط­ط¸ط§طھظƒ ظ„ظƒظ„ ظ…ط¹ظٹط§ط±. ط­ط§ظˆظ„ طھط®ظ…ظٹظ† ط£ظٹ ط¨ظ† ظ‡ظˆ ط£ظٹ ط£طµظ„ ط¨ظ†ط§ط،ظ‹ ط¹ظ„ظ‰ ط§ظ„ظ†ظƒظ‡ط§طھ ظپظ‚ط·.</div>`, en:`<h3>ًں‘ƒ Cupping Fundamentals â€” Complete Guide</h3>
<p>Cupping is the <strong>international standard method</strong> for coffee evaluation, developed by SCA to standardize tasting language among coffee professionals worldwide. It allows you to taste coffee <strong>pure â€” without milk or sugar</strong> â€” to evaluate its true qualities.</p>
<div class="img-c"><img src="\${photo('cupping')}" alt=""><div class="cap">ًں§ھ Cupping Station â€” Professional Coffee Evaluation</div></div>
<div class="img-c"><img src="${photo('cupping')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًں§ھ Sensory Evaluation â€” The Art of Coffee Tasting</div></div>
<h3>ًں“‹ Cupping Steps â€” 6 Phases</h3>
<ol><li><strong>Grind:</strong> Grind coffee coarsely (like sea salt) â€” 8-9g per standard cupping bowl</li>
<li><strong>Fragrance (Dry):</strong> Smell the ground coffee immediately â€” note first impression (floral? fruity? roasted?)</li>
<li><strong>Add Water:</strong> Add water at 93-96آ°C at 1:18 ratio (150ml per 8g coffee). Start the timer</li>
<li><strong>Aroma (Wet):</strong> Right after adding water, smell the rising aromas â€” delicate notes appear here</li>
<li><strong>Break the Crust:</strong> After 4 minutes, break the crust with a cupping spoon â€” smell the powerful burst of aromas</li>
<li><strong>Tasting:</strong> After 8-15 minutes (when coffee cools to ~70آ°C), start tasting. Use a deep cupping spoon and slurp loudly to spray coffee across all taste buds</li></ol>
<h3>ًں“ٹ SCA Scoring Form â€” 10 Criteria</h3>
<table><tr><th>Attribute</th><th>Description</th><th>Score</th></tr><tr><td>Fragrance/Aroma</td><td>Dry and wet aroma</td><td>0-10</td></tr><tr><td>Flavor</td><td>Total flavor â€” first impression</td><td>0-10</td></tr><tr><td>Aftertaste</td><td>Flavor remaining after swallowing</td><td>0-10</td></tr><tr><td>Acidity</td><td>Brightness and liveliness</td><td>0-10</td></tr><tr><td>Body</td><td>Weight on the tongue</td><td>0-10</td></tr><tr><td>Balance</td><td>How flavors harmonize</td><td>0-10</td></tr><tr><td>Uniformity</td><td>Sample consistency</td><td>0-10</td></tr><tr><td>Clean Cup</td><td>No defects</td><td>0-10</td></tr><tr><td>Sweetness</td><td>Natural sweetness</td><td>0-10</td></tr><tr><td>Overall</td><td>Overall impression</td><td>0-10</td></tr></table>
<div class="hl"><strong>ًں“ٹ Score Key:</strong> 6-6.75 = Good آ· 7-7.75 = Very Good آ· 8-8.75 = Excellent آ· 9-10 = Extraordinary. Total 80+ = Specialty Grade.</div>
<div class="ok-box"><strong>ًںژ¯ Exercise:</strong> Buy 3 coffees from different origins (Ethiopian, Colombian, Brazilian). Cup all three in one session. Take notes for each criterion. Try to guess which coffee is which origin based on flavor alone.</div>`};

L['C1-1'] = {ar:`<h3>ًںژ¨ ط¹ط¬ظ„ط© ط§ظ„ظ†ظƒظ‡ط§طھ SCA â€” ط¯ظ„ظٹظ„ظƒ ظ„ظ„طھط°ظˆظ‚</h3><p>ط¹ط¬ظ„ط© ط§ظ„ظ†ظƒظ‡ط§طھ (SCA Flavor Wheel) ط·ظˆط±ظ‡ط§ <strong>ظ…ط¹ظ‡ط¯ ط¬ظˆط¯ط© ط§ظ„ظ‚ظ‡ظˆط© (CQI)</strong> ط¨ط§ظ„طھط¹ط§ظˆظ† ظ…ط¹ <strong>SCA</strong> ظˆ <strong>World Coffee Research</strong>. ظ‡ظٹ ط§ظ„ط£ط¯ط§ط© ط§ظ„ط£ط³ط§ط³ظٹط© ظ„طھظˆط­ظٹط¯ ظ„ط؛ط© ط§ظ„طھط°ظˆظ‚ ط¨ظٹظ† ظ…ط­طھط±ظپظٹ ط§ظ„ظ‚ظ‡ظˆط© ط¹ط§ظ„ظ…ظٹط§ظ‹.</p>
<h3>ًں—؛ï¸ڈ ظ‡ظٹظƒظ„ ط§ظ„ط¹ط¬ظ„ط© â€” 3 ظ…ط³طھظˆظٹط§طھ</h3>
<table><tr><th>ط§ظ„ظ…ط³طھظˆظ‰</th><th>ط§ظ„ظˆطµظپ</th><th>ظ…ط«ط§ظ„</th></tr><tr><td>ط§ظ„ط£ظˆظ„ (ط¹ط§ظ…)</td><td>9 ظپط¦ط§طھ ط±ط¦ظٹط³ظٹط©</td><td>ظپط§ظƒظ‡ظٹطŒ ط²ظ‡ط±ظٹطŒ ط­ظ„ظˆطŒ ط¨ظ‡ط§ط±ط§طھ</td></tr><tr><td>ط§ظ„ط«ط§ظ†ظٹ (ظ…طھظˆط³ط·)</td><td>طھطµظ†ظٹظپط§طھ ظپط±ط¹ظٹط©</td><td>ظپط§ظƒظ‡ظٹ â†’ ط­ظ…ط¶ظٹط§طھطŒ طھظˆطھطŒ ظپظˆط§ظƒظ‡ ط§ط³طھظˆط§ط¦ظٹط©</td></tr><tr><td>ط§ظ„ط«ط§ظ„ط« (ظ…ط­ط¯ط¯)</td><td>ظ†ظƒظ‡ط§طھ ظ…ط­ط¯ط¯ط©</td><td>ظ„ظٹظ…ظˆظ†طŒ ط¨ط±طھظ‚ط§ظ„طŒ ط¬ط±ظٹط¨ ظپط±ظˆطھ</td></tr></table>
<h3>ًں‘ƒ ط§ظ„ظپط¦ط§طھ ط§ظ„طھط³ط¹ ط§ظ„ط±ط¦ظٹط³ظٹط©</h3><p><strong>ط²ظ‡ط±ظٹ Floral</strong> آ· <strong>ظپط§ظƒظ‡ظٹ Fruity</strong> آ· <strong>ط­ط§ظ…ط¶ Sour/Fermented</strong> آ· <strong>ط­ظ„ظˆ Sweet</strong> آ· <strong>ط¨ظ‡ط§ط±ط§طھ Spices</strong> آ· <strong>ط£ط®ط¶ط± Green/Vegetative</strong> آ· <strong>ظ…ط­ظ…طµ Roasted</strong> آ· <strong>ط¬ظˆط²ظٹ Nutty/Cocoa</strong> آ· <strong>ط¢ط®ط± Others</strong></p>
<h3>ًں“‌ ظƒظٹظپ طھط³طھط®ط¯ظ… ط§ظ„ط¹ط¬ظ„ط©طں</h3><ol><li><strong>ط§ط´ظ… ط§ظ„ط±ط§ط¦ط­ط© ط§ظ„ط¬ط§ظپط©</strong> ظ„ظ„ط¨ظ† ط§ظ„ظ…ط·ط­ظˆظ† â€” ط³ط¬ظ„ ط£ظˆظ„ ط§ظ†ط·ط¨ط§ط¹</li><li><strong>ط£ط¶ظپ ط§ظ„ظ…ط§ط،</strong> ظˆط´ظ… ط§ظ„ط±ط§ط¦ط­ط© ط§ظ„ط±ط·ط¨ط© â€” ط§ط¨ط­ط« ط¹ظ† ظ†ظƒظ‡ط§طھ ظ…ط­ط¯ط¯ط©</li><li><strong>طھط°ظˆظ‚</strong> ط¨ظ‚ظˆط© (Slurp) ظ„طھط±ط´ظٹط´ ط§ظ„ظ‚ظ‡ظˆط© ط¹ظ„ظ‰ ظƒظ„ ط¨ط±ط§ط¹ظ… ط§ظ„طھط°ظˆظ‚</li><li><strong>ط§ط¨ط¯ط£ ظ…ظ† ط§ظ„ط¹ط§ظ…:</strong> ظ‡ظ„ ظ‡ط°ط§ ظپط§ظƒظ‡ظٹطں ط²ظ‡ط±ظٹطں ظ…ط­ظ…طµطں</li><li><strong>ط§ظ†طھظ‚ظ„ ظ„ظ„ط®ط§طµ:</strong> ط¥ط°ط§ ظپط§ظƒظ‡ظٹطŒ ظ‡ظ„ ظ‡ظˆ ط­ظ…ط¶ظٹط§طھطں طھظˆطھطں ظپظˆط§ظƒظ‡ ط³ظƒط±ظٹط©طں</li><li><strong>ظƒظ† ظ…ط­ط¯ط¯ط§ظ‹:</strong> ط¥ط°ط§ ط­ظ…ط¶ظٹط§طھطŒ ظ‡ظ„ ظ‡ظˆ ظ„ظٹظ…ظˆظ† ط£طµظپط±طں ط¨ط±طھظ‚ط§ظ„طں ط¬ط±ظٹط¨ ظپط±ظˆطھطں</li></ol>
<div class="hl"><strong>ًں’¬ ظ…ط¹ط¬ظ… ط§ظ„ظ†ظƒظ‡ط§طھ (Lexicon):</strong> ط£ظƒط«ط± ظ…ظ† 100 ظ…طµط·ظ„ط­ ظ…ظˆط­ط¯ ظٹطµظپ ظ†ظƒظ‡ط§طھ ط§ظ„ظ‚ظ‡ظˆط©. ط£ظ…ط«ظ„ط©: <em>Bergamot</em> (ط¨ط±ط؛ظ…ظˆطھ â€” ط²ظ‡ط±ظٹ ط­ظ…ط¶ظٹ)طŒ <em>Blackcurrant</em> (ظƒط´ظ…ط´ ط£ط³ظˆط¯ â€” طھظˆطھظٹ ط­ط§ظ…ط¶ظٹ)طŒ <em>Molasses</em> (ط¯ط¨ط³ â€” ط­ظ„ظˆ ط«ظ‚ظٹظ„).</div>
<div class="info-box"><strong>ًںژ¯ طھظ…ط±ظٹظ† ظٹظˆظ…ظٹ:</strong> ط®ط° 3 ط£ظ†ظˆط§ط¹ ط¨ظ† ظ…ط®طھظ„ظپط©. ط§ط³طھط®ط¯ظ… ط§ظ„ط¹ط¬ظ„ط© ظ„ظˆطµظپ ظƒظ„ ظˆط§ط­ط¯ط© ط¨ظ€ 3 ظ†ظƒظ‡ط§طھ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„. ظƒط±ط± ط§ظ„طھظ…ط±ظٹظ† ظٹظˆظ…ظٹط§ظ‹ ظ„ظ…ط¯ط© ط£ط³ط¨ظˆط¹ â€” ط³طھطھط­ط³ظ† ظ…ظپط±ط¯ط§طھظƒ ط§ظ„طھط°ظˆظ‚ظٹط© 300%.</div>
<div class="quiz-box"><strong>ًں’¬ طھط­ط¯ظ‘:</strong> طµظپ ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„طھظٹ طھط´ط±ط¨ظ‡ط§ ط§ظ„ط¢ظ† ط¨ط§ط³طھط®ط¯ط§ظ… ط§ظ„ط¹ط¬ظ„ط©. ط§ط¨ط¯ط£ ط¨ط§ظ„ط¹ط§ظ… â†’ ط§ظ„ط®ط§طµ. ظ…ط«ظ„ط§ظ‹: ظپط§ظƒظ‡ظٹ â†گ ط­ظ…ط¶ظٹط§طھ â†گ ظ„ظٹظ…ظˆظ† + ط­ظ„ظˆ â†گ ظƒط±ط§ظ…ظٹظ„. ظ‡ظ„ طھط³طھط·ظٹط¹طں</div>`, en:`<h3>ًںژ¨ SCA Flavor Wheel â€” Your Tasting Guide</h3><p>The SCA Flavor Wheel was developed by the <strong>Coffee Quality Institute (CQI)</strong> in collaboration with <strong>SCA</strong> and <strong>World Coffee Research</strong>. It's the essential tool for standardizing tasting language among coffee professionals worldwide.</p>
<h3>ًں—؛ï¸ڈ Wheel Structure â€” 3 Levels</h3>
<table><tr><th>Level</th><th>Description</th><th>Example</th></tr><tr><td>1st (General)</td><td>9 main categories</td><td>Fruity, Floral, Sweet, Spices</td></tr><tr><td>2nd (Medium)</td><td>Sub-classifications</td><td>Fruity â†’ Citrus, Berry, Tropical fruit</td></tr><tr><td>3rd (Specific)</td><td>Specific flavors</td><td>Lemon, Orange, Grapefruit</td></tr></table>
<h3>ًں‘ƒ Nine Main Categories</h3><p><strong>Floral</strong> آ· <strong>Fruity</strong> آ· <strong>Sour/Fermented</strong> آ· <strong>Sweet</strong> آ· <strong>Spices</strong> آ· <strong>Green/Vegetative</strong> آ· <strong>Roasted</strong> آ· <strong>Nutty/Cocoa</strong> آ· <strong>Others</strong></p>
<h3>ًں“‌ How to Use the Wheel?</h3><ol><li><strong>Smell the dry fragrance</strong> of ground coffee â€” note your first impression</li><li><strong>Add water</strong> and smell the wet aroma â€” look for specific notes</li><li><strong>Slurp</strong> loudly to spray coffee across all taste buds</li><li><strong>Start general:</strong> Is this fruity? Floral? Roasted?</li><li><strong>Go specific:</strong> If fruity, is it citrus? Berry? Stone fruit?</li><li><strong>Be precise:</strong> If citrus, is it lemon? Orange? Grapefruit?</li></ol>
<div class="hl"><strong>ًں’¬ Flavor Lexicon:</strong> Over 100 standardized terms describe coffee flavors. Examples: <em>Bergamot</em> (floral-citrus), <em>Blackcurrant</em> (tart berry), <em>Molasses</em> (heavy sweet).</div>
<div class="info-box"><strong>ًںژ¯ Daily Exercise:</strong> Take 3 different coffees. Use the wheel to describe each with at least 3 flavors. Repeat daily for one week â€” your tasting vocabulary will improve 300%.</div>
<div class="quiz-box"><strong>ًں’¬ Challenge:</strong> Describe the coffee you're drinking right now using the wheel. Start general â†’ specific. E.g.: Fruity â†گ Citrus â†گ Lemon + Sweet â†گ Caramel. Can you do it?</div>`};

L['C1-2'] = {ar:`<h3>ًں“ٹ ط¨ط±ظˆطھظˆظƒظˆظ„ SCA ظ„ظ„طھظ‚ظٹظٹظ… â€” ظ…ظ† 0 ط¥ظ„ظ‰ 100</h3>
<p>ط§ط³طھظ…ط§ط±ط© SCA ظ‡ظٹ <strong>ط§ظ„ظ„ط؛ط© ط§ظ„ط¹ط§ظ„ظ…ظٹط© ط§ظ„ظ…ظˆط­ط¯ط©</strong> ظ„طھظ‚ظٹظٹظ… ط¬ظˆط¯ط© ط§ظ„ظ‚ظ‡ظˆط©. طھط³طھط®ط¯ظ…ظ‡ط§ ظ…ط³ط§ط¨ظƒط§طھ ط§ظ„ط¨ط§ط±ظٹط³طھط§ ط§ظ„ط¹ط§ظ„ظ…ظٹط© (World Barista Championship) ظˆظ…ط­ط·ط§طھ طھط­ظ…ظٹطµ specialty ط­ظˆظ„ ط§ظ„ط¹ط§ظ„ظ…. ط¥ظ„ظٹظƒ ط§ظ„طھظپط§طµظٹظ„ ط§ظ„ظƒط§ظ…ظ„ط© ظ„ظƒظ„ ظ…ط¹ظٹط§ط±.</p>
<h3>ًں“‹ ط§ظ„ظ…ط¹ط§ظٹظٹط± ط§ظ„ط¹ط´ط±ط© â€” ط¯ظ„ظٹظ„ ط§ظ„طھظ‚ظٹظٹظ… ط§ظ„ظƒط§ظ…ظ„</h3>
<table><tr><th>ط§ظ„ظ…ط¹ظٹط§ط±</th><th>ط§ظ„ط¯ط±ط¬ط© ط§ظ„ظ‚طµظˆظ‰</th><th>ظ…ط§ ط§ظ„ط°ظٹ ظ†ظ‚ظٹظ…ظ‡طں</th></tr><tr><td><strong>Fragrance/Aroma</strong></td><td>10</td><td>ط´ظ… ط§ظ„ط±ط§ط¦ط­ط© ط§ظ„ط¬ط§ظپط© ط¨ط¹ط¯ ط§ظ„ط·ط­ظ† ظ…ط¨ط§ط´ط±ط© (Fragrance) ظˆط§ظ„ط±ط§ط¦ط­ط© ط§ظ„ط±ط·ط¨ط© ط¨ط¹ط¯ ط¥ط¶ط§ظپط© ط§ظ„ظ…ط§ط، (Aroma). ط§ط¨ط­ط« ط¹ظ†: ط²ظ‡ط±ظٹطŒ ظپط§ظƒظ‡ظٹطŒ ط´ظˆظƒظˆظ„ط§طھظٹطŒ ط¬ظˆط²ظٹ</td></tr>
<tr><td><strong>Flavor</strong></td><td>10</td><td>ط§ظ„ط§ظ†ط·ط¨ط§ط¹ ط§ظ„ظƒظ„ظٹ ظ„ظ„ظ†ظƒظ‡ط© ظپظٹ ط§ظ„ظپظ…. ط§ط¨ط­ط« ط¹ظ†: ط§ظ„طھط¹ظ‚ظٹط¯طŒ ط§ظ„ط¹ظ…ظ‚طŒ ط§ظ„ظˆط¶ظˆط­طŒ ط§ظ„ظ…طھط¹ط©. ظ‚ط§ط±ظ† ط¨ظٹظ† ط£ظˆظ„ ط±ط´ظپط© ظˆط¢ط®ط±ظ‡ط§</td></tr>
<tr><td><strong>Aftertaste</strong></td><td>10</td><td>ط§ظ„ظ†ظƒظ‡ط© ط§ظ„طھظٹ طھط¨ظ‚ظ‰ ط¨ط¹ط¯ ط¨ظ„ط¹ ط§ظ„ظ‚ظ‡ظˆط©. ط§ط¨ط­ط« ط¹ظ†: ط§ظ„ظ…ط¯ط© (ظƒظ… ط«ط§ظ†ظٹط© طھط¯ظˆظ…طں)طŒ ط§ظ„ط¬ظˆط¯ط© (ظ‡ظ„ ظ‡ظٹ ظ…ظ…طھط¹ط© ط£ظ… ظ…ط±ظ‘ط©طں)</td></tr>
<tr><td><strong>Acidity</strong></td><td>10</td><td>ط§ظ„ط­ظ…ظˆط¶ط© ط§ظ„ط¬ظٹط¯ط© ظ‡ظٹ ظ†ط¶ط§ط±ط© ظˆط¥ط´ط±ط§ظ‚ â€” ظ…ط«ظ„ ط­ظ…ظˆط¶ط© ط§ظ„طھظپط§ط­ ط£ظˆ ط§ظ„ط­ظ…ط¶ظٹط§طھ. ط§ظ„ط­ظ…ظˆط¶ط© ط§ظ„ط³ظٹط¦ط© ظ‡ظٹ ط­ط§ط¯ط© ط£ظˆ ظ‚ط§ط¨ط¶ط© ظ…ط«ظ„ ط§ظ„ط®ظ„</td></tr>
<tr><td><strong>Body</strong></td><td>10</td><td>ط§ظ„ظ‚ظˆط§ظ… â€” ط«ظ‚ظ„ ط£ظˆ ط®ظپط© ط§ظ„ظ‚ظ‡ظˆط© ط¹ظ„ظ‰ ط§ظ„ظ„ط³ط§ظ†. ظ…ظ† ط®ظپظٹظپ ظ…ط«ظ„ ط§ظ„ط´ط§ظٹ ط¥ظ„ظ‰ ط«ظ‚ظٹظ„ ظ…ط«ظ„ ط§ظ„ظƒط±ظٹظ…ط©. ط§ط¨ط­ط« ط¹ظ†: ط§ظ„ظ†ط¹ظˆظ…ط© ظˆط§ظ„ظ…طھط§ظ†ط©</td></tr>
<tr><td><strong>Balance</strong></td><td>10</td><td>ظƒظٹظپ طھطھظپط§ط¹ظ„ ط§ظ„ظ†ظƒظ‡ط§طھ ظ…ط¹ط§ظ‹. ظ‡ظ„ طھط·ط؛ظ‰ ط§ظ„ط­ظ…ظˆط¶ط© ط¹ظ„ظ‰ ط§ظ„ظ‚ظˆط§ظ…طں ظ‡ظ„ ط§ظ„ظ‚ظˆط§ظ… ظٹط®ظپظٹ ط§ظ„ظ†ظƒظ‡ط§طھطں ط§ظ„طھظˆط§ط²ظ† ط§ظ„ظ…ط«ط§ظ„ظٹ = ظƒظ„ ط¹ظ†طµط± ظپظٹ ظ…ظƒط§ظ†ظ‡</td></tr>
<tr><td><strong>Uniformity</strong></td><td>10</td><td>ط§طھط³ط§ظ‚ ط§ظ„ط¹ظٹظ†ط§طھ â€” ظپظٹ ط§ظ„ظƒط§ط¨ظٹظ†ط¬طŒ ظ†ظ‚ظٹظ… 5 ط£ظƒظˆط§ط¨ ظ…ظ† ظ†ظپط³ ط§ظ„ظ‚ظ‡ظˆط©. ظ‡ظ„ ظƒظ„ظ‡ط§ ظ…طھط·ط§ط¨ظ‚ط© ظپظٹ ط§ظ„ط·ط¹ظ…طں ط¥ط°ط§ ط§ط®طھظ„ظپ ظƒظˆط¨ ظˆط§ط­ط¯طŒ ظ‡ط°ط§ ط¹ظٹط¨</td></tr>
<tr><td><strong>Clean Cup</strong></td><td>10</td><td>ظ†ط¸ط§ظپط© ط§ظ„ظƒظˆط¨ â€” ظ„ط§ ط¹ظٹظˆط¨ طھظƒظ†ظٹظƒظٹط©. ط¥ط°ط§ ظˆط¬ط¯طھ ط·ط¹ظ… طھط±ط§ط¨ظٹطŒ ط¹ظپظ†طŒ ظپظٹظ†ظˆظ„ظٹطŒ ط£ظˆ ط£ظٹ ط¹ظٹط¨ â€” ط®طµظ… ط¯ط±ط¬ط§طھ</td></tr>
<tr><td><strong>Sweetness</strong></td><td>10</td><td>ط§ظ„ط­ظ„ط§ظˆط© ط§ظ„ط·ط¨ظٹط¹ظٹط© â€” ظ‡ظ„ طھط´ط¹ط± ط¨ط­ظ„ط§ظˆط© ط§ظ„ظƒط±ط§ظ…ظٹظ„طŒ ط§ظ„ط¹ط³ظ„طŒ ط§ظ„ط³ظƒط± ط§ظ„ط¨ظ†ظٹطŒ ط§ظ„ظپظˆط§ظƒظ‡ ط§ظ„ظ†ط§ط¶ط¬ط©طں ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط¬ظٹط¯ط© ط¯ط§ط¦ظ…ط§ظ‹ ظپظٹظ‡ط§ ط­ظ„ط§ظˆط© ط·ط¨ظٹط¹ظٹط©</td></tr>
<tr><td><strong>Overall</strong></td><td>10</td><td>ط§ظ†ط·ط¨ط§ط¹ظƒ ط§ظ„ط¹ط§ظ… â€” ظ‡ظ„ ظ‡ط°ظ‡ ظ‚ظ‡ظˆط© طھط±ظٹط¯ ط´ط±ط¨ظ‡ط§ ظƒظ„ ظٹظˆظ…طں ظ‡ظ„ طھط´طھط±ظٹظ‡ط§ ظ„ظ…ظ‚ظ‡ط§ظƒطں ظ‡ظ„ طھط«ظٹط± ط§ظ‡طھظ…ط§ظ…ظƒطں</td></tr></table>
<h3>ًں”¢ ظ†ط¸ط§ظ… ط­ط³ط§ط¨ ط§ظ„ط¯ط±ط¬ط§طھ</h3><p>ظƒظ„ ظ…ط¹ظٹط§ط± ظٹط³ط¬ظ„ ظ…ظ† 0-10 ط¨ظپظˆط§طµظ„ ط±ط¨ط¹ ط¯ط±ط¬ط© (6.25طŒ 6.5طŒ 6.75...). ط§ظ„ط¯ط±ط¬ط§طھ طھظڈط¶ط±ط¨ أ— 2 ظ„ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط§ظ„ظ†طھظٹط¬ط© ط§ظ„ظ†ظ‡ط§ط¦ظٹط©.<br><strong>ظ…ط«ط§ظ„:</strong> 7.5 + 8 + 7.75 + 8.25 + 7.5 + 8 + 8 + 8 + 8 + 8 = 79 ظ†ظ‚ط·ط© أ— 2 = <strong>79/100</strong></p>
<div class="hl"><strong>ًں“ٹ ط¬ط¯ظˆظ„ ط§ظ„طھطµظ†ظٹظپ:</strong><br>â€¢ 90-100: Outstanding (ط§ط³طھط«ظ†ط§ط¦ظٹ) â€” ظ‚ظ‡ظˆط© ظ†ط§ط¯ط±ط© ط¬ط¯ط§ظ‹<br>â€¢ 85-89.99: Excellent (ظ…ظ…طھط§ط²) â€” Specialty ط¹ط§ظ„ظٹ ط§ظ„ط¬ظˆط¯ط©<br>â€¢ 80-84.99: Very Good (ط¬ظٹط¯ ط¬ط¯ط§ظ‹) â€” Specialty Grade<br>â€¢ 60-79.99: Commercial Grade (طھط¬ط§ط±ظٹ)<br>â€¢ ط£ظ‚ظ„ ظ…ظ† 60: Below Grade (ط¯ظˆظ† ط§ظ„ظ…ط³طھظˆظ‰)</div>
<div class="info-box"><strong>ًں’¬ ظ‡ظ„ طھط¹ظ„ظ…طں</strong> ط£ظ‚ظ„ ظ…ظ† 1% ظ…ظ† ظ‚ظ‡ظˆط© ط§ظ„ط¹ط§ظ„ظ… طھط­طµظ„ ط¹ظ„ظ‰ ط¯ط±ط¬ط© 90+. ظ‡ط°ظ‡ ط§ظ„ظ‚ظ‡ظˆط© طھط¨ط§ط¹ ظپظٹ ظ…ط²ط§ط¯ط§طھ ط®ط§طµط© ط¨ط£ط³ط¹ط§ط± طھطھط¬ط§ظˆط² $100 ظ„ظ„ط±ط·ظ„ (ظ…ط«ظ„ Panama Geisha).</div>
<div class="ok-box"><strong>ًںژ¯ طھط­ط¯ظ‘:</strong> ط§ط¨ط­ط« ط¹ظ† ظ‚ظ‡ظˆط© ظ…ظƒطھظˆط¨ ط¹ظ„ظٹظ‡ط§ ط¯ط±ط¬ط© SCA (طھط¬ط¯ظ‡ط§ ط¹ظ„ظ‰ ط£ظƒظٹط§ط³ ط§ظ„ط¨ظ† specialty). ط§ط´طھط±ظ‡ط§طŒ ط§ط¹ظ…ظ„ ظƒط§ط¨ظٹظ†ط¬طŒ ظˆط³ط¬ظ„ ط¯ط±ط¬ط§طھظƒ ط§ظ„ط®ط§طµط©. ظ‚ط§ط±ظ† ط¯ط±ط¬ط§طھظƒ ظ…ط¹ ط§ظ„ط¯ط±ط¬ط© ط§ظ„ظ…ط·ط¨ظˆط¹ط©. ط§ظ„ظپط±ظ‚ ط¨ظٹظ† 1-2 ط¯ط±ط¬ط© ط·ط¨ظٹط¹ظٹ â€” ظ…ط¹ ط§ظ„طھط¯ط±ظٹط¨ ط³ظٹظ‚ظ„ ط§ظ„ظپط±ظ‚.</div>`, en:`<h3>ًں“ٹ SCA Scoring Protocol â€” From 0 to 100</h3>
<p>The SCA form is the <strong>universal standardized language</strong> for coffee quality evaluation. Used in World Barista Championships and specialty roasters worldwide. Here's the complete guide.</p>
<h3>ًں“‹ Ten Criteria â€” Complete Scoring Guide</h3>
<table><tr><th>Attribute</th><th>Max</th><th>What We Evaluate</th></tr>
<tr><td><strong>Fragrance/Aroma</strong></td><td>10</td><td>Dry smell after grinding + wet smell after adding water. Look for: floral, fruity, chocolate, nutty</td></tr>
<tr><td><strong>Flavor</strong></td><td>10</td><td>Total flavor impression in the mouth. Look for: complexity, depth, clarity, enjoyment</td></tr>
<tr><td><strong>Aftertaste</strong></td><td>10</td><td>Flavor remaining after swallowing. Look for: duration, quality (pleasant vs bitter)</td></tr>
<tr><td><strong>Acidity</strong></td><td>10</td><td>Good acidity = brightness, liveliness (apple, citrus). Bad = sharp, puckering</td></tr>
<tr><td><strong>Body</strong></td><td>10</td><td>Weight on the tongue â€” tea-like to cream-like. Look for: smoothness, viscosity</td></tr>
<tr><td><strong>Balance</strong></td><td>10</td><td>How flavors interact â€” no single element dominates</td></tr>
<tr><td><strong>Uniformity</strong></td><td>10</td><td>Sample consistency â€” 5 cups of same coffee. If one tastes different, it's a defect</td></tr>
<tr><td><strong>Clean Cup</strong></td><td>10</td><td>No technical defects (earthy, moldy, phenolic, etc.)</td></tr>
<tr><td><strong>Sweetness</strong></td><td>10</td><td>Natural sweetness â€” caramel, honey, brown sugar, ripe fruit. Good coffee is always sweet</td></tr>
<tr><td><strong>Overall</strong></td><td>10</td><td>Your overall impression â€” would you drink this daily? Buy for your cafe?</td></tr></table>
<h3>ًں”¢ Scoring System</h3><p>Each attribute scored 0-10 in quarter-point increments (6.25, 6.5, 6.75...). Scores are summed, then أ— 2 for final result.<br><strong>Example:</strong> 7.5+8+7.75+8.25+7.5+8+8+8+8+8 = 79 أ— 2 = <strong>79/100</strong></p>
<div class="hl"><strong>ًں“ٹ Classification Table:</strong><br>â€¢ 90-100: Outstanding â€” extremely rare<br>â€¢ 85-89.99: Excellent â€” high-end Specialty<br>â€¢ 80-84.99: Very Good â€” Specialty Grade<br>â€¢ 60-79.99: Commercial Grade<br>â€¢ Below 60: Below Grade</div>
<div class="info-box"><strong>ًں’¬ Did You Know?</strong> Less than 1% of world coffee scores 90+. These are sold at private auctions for $100+/lb (e.g., Panama Geisha).</div>
<div class="ok-box"><strong>ًںژ¯ Challenge:</strong> Find coffee with an SCA score on its bag (specialty roasters print this). Buy it, cup it, and score it yourself. Compare with the printed score. A 1-2 point difference is normal â€” with practice it shrinks.</div>`};

L['C2-0'] = {ar:`<h3>ًں«ک ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط·ط¨ظٹط¹ظٹط© (Natural) â€” ط£ظ‚ط¯ظ… طھظ‚ظ†ظٹط© ظپظٹ ط§ظ„طھط§ط±ظٹط®</h3>
<p>ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط·ط¨ظٹط¹ظٹط© ظ‡ظٹ <strong>ط£ظ‚ط¯ظ… ط·ط±ظٹظ‚ط© ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط¨ظ†</strong>طŒ ط§ط³طھظڈط®ط¯ظ…طھ ظپظٹ ط¥ط«ظٹظˆط¨ظٹط§ ظˆط§ظ„ظٹظ…ظ† ظ…ظ†ط° ظ‚ط±ظˆظ† ط¯ظˆظ† طھط؛ظٹظٹط± ط¬ظˆظ‡ط±ظٹ. ط§ط³ظ…ظ‡ط§ ط§ظ„ط¢ط®ط±: <strong>Dry Process</strong>. ط§ظ„ظپظƒط±ط© ط¨ط³ظٹط·ط©: طھط¬ظپظپ ط§ظ„ط«ظ…ط±ط© ظƒط§ظ…ظ„ط© â€” ط¨ظ‚ط´ط±طھظ‡ط§ ظˆظ„ط¨ظ‡ط§ â€” طھط­طھ ط£ط´ط¹ط© ط§ظ„ط´ظ…ط³.</p>
<div class="img-c"><img src="${photo('beans_tree')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًں«ک ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط·ط¨ظٹط¹ظٹط© â€” ط£ط¨ط³ط· ط·ط±ظ‚ طھط­ط¶ظٹط± ط§ظ„ط¨ظ†</div></div>
<h3>ًں”¬ ط®ط·ظˆط§طھ ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط·ط¨ظٹط¹ظٹط©</h3>
<ol><li><strong>ط§ظ„ظ‚ط·ظپ:</strong> طھظ‚ط·ظپ ط§ظ„ظƒط±ط²ط§طھ ط§ظ„ط­ظ…ط±ط§ط، ط§ظ„ظ†ط§ط¶ط¬ط© ظپظ‚ط· (ظٹط¯ظˆظٹط§ظ‹ ط£ظˆ ظ…ظٹظƒط§ظ†ظٹظƒظٹط§ظ‹)</li>
<li><strong>ط§ظ„ظپط±ط²:</strong> طھط·ظپظˆ ط§ظ„ظƒط±ط²ط§طھ ظپظٹ ط§ظ„ظ…ط§ط، â€” ط§ظ„ظƒط±ط²ط§طھ ط§ظ„ظ†ط§ط¶ط¬ط© طھط؛ظˆطµطŒ ط؛ظٹط± ط§ظ„ظ†ط§ط¶ط¬ط© طھط·ظپظˆ (طھظڈط±ظپط¶)</li>
<li><strong>ط§ظ„ظ†ط´ط±:</strong> طھظ†ط´ط± ط§ظ„ظƒط±ط²ط§طھ ط¹ظ„ظ‰ <strong>ط³ط±ط§ظٹط± ط§ظ„طھط¬ظپظٹظپ (African drying beds)</strong> ط£ظˆ ظپظٹ ط³ط§ط­ط§طھ ط¥ط³ظ…ظ†طھظٹط©</li>
<li><strong>ط§ظ„طھظ‚ظ„ظٹط¨:</strong> طھظ‚ظ„ط¨ ط§ظ„ظƒط±ط²ط§طھ ظƒظ„ 2-4 ط³ط§ط¹ط§طھ ظ„ط¶ظ…ط§ظ† طھط¬ظپظٹظپ ظ…طھط³ط§ظˆظچ ظˆظ…ظ†ط¹ ط§ظ„طھط¹ظپظ†</li>
<li><strong>ط§ظ„طھط¬ظپظٹظپ:</strong> طھط³طھط؛ط±ظ‚ 2-4 ط£ط³ط§ط¨ظٹط¹ ط­طھظ‰ طھطµظ„ ط±ط·ظˆط¨ط© ط§ظ„ظƒط±ط²ط© ط¥ظ„ظ‰ 11-12%</li>
<li><strong>ط§ظ„ط·ط­ظ† ط§ظ„ط¬ط§ظپ:</strong> طھط²ط§ظ„ ط§ظ„ظ‚ط´ط±ط© ظˆط§ظ„ظ„ط¨ ط§ظ„ظ…ظٹطھ ظ…ظٹظƒط§ظ†ظٹظƒظٹط§ظ‹ â€” ظٹظ†طھط¬ ط§ظ„ط¨ظ† ط§ظ„ط£ط®ط¶ط±</li></ol>
<h3>ًںŒ،ï¸ڈ ط¸ط±ظˆظپ ط§ظ„طھط¬ظپظٹظپ ط§ظ„ظ…ط«ط§ظ„ظٹط©</h3>
<table><tr><th>ط§ظ„ط¹ط§ظ…ظ„</th><th>ط§ظ„ظ†ط·ط§ظ‚ ط§ظ„ظ…ط«ط§ظ„ظٹ</th></tr><tr><td>ط¯ط±ط¬ط© ط§ظ„ط­ط±ط§ط±ط©</td><td>30-40آ°ظ…</td></tr><tr><td>ط§ظ„ط±ط·ظˆط¨ط© ط§ظ„ظ†ط³ط¨ظٹط©</td><td>ط£ظ‚ظ„ ظ…ظ† 60%</td></tr><tr><td>ط³ظ…ظƒ ط·ط¨ظ‚ط© ط§ظ„ظƒط±ط²ط§طھ</td><td>2-5 ط³ظ…</td></tr><tr><td>ظˆظ‚طھ ط§ظ„طھط¬ظپظٹظپ</td><td>15-30 ظٹظˆظ…ط§ظ‹</td></tr><tr><td>ط§ظ„ط±ط·ظˆط¨ط© ط§ظ„ظ†ظ‡ط§ط¦ظٹط©</td><td>10-12%</td></tr></table>
<h3>ًں‘ƒ ظ†ظƒظ‡ط§طھ ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط·ط¨ظٹط¹ظٹط©</h3><p><strong>ط§ظ„ظ…ظ…ظٹط²ط§طھ:</strong> ط­ظ„ط§ظˆط© ط¹ط§ظ„ظٹط©طŒ ظ†ظƒظ‡ط§طھ ظپط§ظƒظ‡ظٹط© ط¬ط±ظٹط¦ط© (طھظˆطھطŒ ظپط±ط§ظˆظ„ط©طŒ ط¹ظ†ط¨ظٹط©)طŒ ظ‚ظˆط§ظ… ظƒط§ظ…ظ„طŒ طھط¹ظ‚ظٹط¯.<br><strong>ط§ظ„ط¹ظٹظˆط¨ ط§ظ„ظ…ط­طھظ…ظ„ط©:</strong> ظ‚ط¯ طھط¸ظ‡ط± ظ†ظƒظ‡ط§طھ طھط®ظ…ظ‘ط± ط؛ظٹط± ظ…ط±ط؛ظˆط¨ ظپظٹظ‡ط§طŒ ط£ظˆ ط·ط¹ظ… طھط±ط§ط¨ظٹ ط¥ط°ط§ ظ„ظ… طھظڈط¬ظپظپ ط¨ط´ظƒظ„ طµط­ظٹط­.<br><strong>ط£ط´ظ‡ط± ط§ظ„ظ…ظ†ط§ط·ظ‚:</strong> ط¥ط«ظٹظˆط¨ظٹط§ (ط·ط¨ظٹط¹ظٹط© ظٹظٹط±ط؛ط§ط´ظٹظپظٹ)طŒ ط§ظ„ظٹظ…ظ†طŒ ط§ظ„ط¨ط±ط§ط²ظٹظ„طŒ ظƒظˆط³طھط§ط±ظٹظƒط§.</p>
<div class="err-box"><strong>â‌Œ ط®ط·ط£ ط´ط§ط¦ط¹:</strong> ط¸ظ† ط£ظ† ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط·ط¨ظٹط¹ظٹط© ط£ط³ظ‡ظ„ ظ…ظ† ط§ظ„ظ…ط؛ط³ظˆظ„ط©. ط§ظ„ط­ظ‚ظٹظ‚ط©: ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط·ط¨ظٹط¹ظٹط© طھطھط·ظ„ط¨ ظ…ظ‡ط§ط±ط© ط¹ط§ظ„ظٹط© ظپظٹ ط§ظ„طھط­ظƒظ… ط¨ط¹ظ…ظ„ظٹط© ط§ظ„طھط¬ظپظٹظپ â€” ط®ط·ط£ ط¨ط³ظٹط· ظٹط³ط¨ط¨ طھط¹ظپظ† ط§ظ„ظƒط±ط²ط§طھ ط¨ط§ظ„ظƒط§ظ…ظ„.</div>
<div class="ok-box"><strong>ًںژ¯ ظ†ط´ط§ط·:</strong> ط§ط´طھط± ط¨ظ†ط§ظ‹ ط·ط¨ظٹط¹ظٹط§ظ‹ ظˆظ…ط؛ط³ظˆظ„ط§ظ‹ ظ…ظ† ظ†ظپط³ ط§ظ„ط£طµظ„ (ظ…ط«ظ„ط§ظ‹: ط¥ط«ظٹظˆط¨ظٹ ظٹظٹط±ط؛ط§ط´ظٹظپظٹ ط·ط¨ظٹط¹ظٹ ظˆظ…ط؛ط³ظˆظ„). ط­ط¶ظ‘ط± ط¨ظ†ظپط³ ط§ظ„ط·ط±ظٹظ‚ط© ظˆطھط°ظˆظ‚ ط§ظ„ظپط±ظ‚. ط§ظ„ط·ط¨ظٹط¹ظٹ ط³ظٹظƒظˆظ† ط£ط­ظ„ظ‰ ظˆط£ظپط§ظƒظ‡ظٹطŒ ط§ظ„ظ…ط؛ط³ظˆظ„ ط£ظ†ط¸ظپ ظˆط£ط²ظ‡ط±ظٹ.</div>`, en:`<h3>ًں«ک Natural Processing â€” The Oldest Technique in History</h3>
<p>Natural processing is the <strong>oldest coffee processing method</strong>, used in Ethiopia and Yemen for centuries without fundamental change. Also called <strong>Dry Process</strong>. The idea is simple: dry the whole cherry â€” skin, pulp and all â€” under the sun.</p>
<div class="img-c"><img src="${photo('beans_tree')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًں«ک Natural Processing â€” The Simplest Coffee Preparation Method</div></div>
<h3>ًں”¬ Natural Processing Steps</h3>
<ol><li><strong>Harvest:</strong> Pick only ripe red cherries (hand or machine)</li>
<li><strong>Sorting:</strong> Float cherries in water â€” ripe ones sink, unripe float (rejected)</li>
<li><strong>Spreading:</strong> Spread on <strong>African drying beds</strong> or concrete patios</li>
<li><strong>Turning:</strong> Turn every 2-4 hours for even drying and to prevent mold</li>
<li><strong>Drying:</strong> Takes 2-4 weeks until cherry moisture reaches 11-12%</li>
<li><strong>Dry Milling:</strong> Dried skin and pulp removed mechanically â€” green coffee emerges</li></ol>
<h3>ًںŒ،ï¸ڈ Ideal Drying Conditions</h3>
<table><tr><th>Factor</th><th>Ideal Range</th></tr><tr><td>Temperature</td><td>30-40آ°C</td></tr><tr><td>Relative Humidity</td><td>Below 60%</td></tr><tr><td>Cherry Layer Thickness</td><td>2-5 cm</td></tr><tr><td>Drying Time</td><td>15-30 days</td></tr><tr><td>Final Moisture</td><td>10-12%</td></tr></table>
<h3>ًں‘ƒ Natural Processing Flavors</h3><p><strong>Strengths:</strong> High sweetness, bold fruity notes (berry, strawberry, blueberry), full body, complexity.<br><strong>Potential defects:</strong> Unpleasant fermented notes, earthy taste if not dried properly.<br><strong>Famous regions:</strong> Ethiopia (Yirgacheffe Natural), Yemen, Brazil, Costa Rica.</p>
<div class="err-box"><strong>â‌Œ Common Mistake:</strong> Thinking natural processing is easier than washed. Truth: natural processing requires high skill in controlling the drying process â€” a small mistake can ruin the entire batch.</div>
<div class="ok-box"><strong>ًںژ¯ Activity:</strong> Buy natural and washed coffee from the same origin (e.g., Ethiopian Yirgacheffe). Brew both the same way and taste the difference. Natural will be sweeter and fruitier, washed will be cleaner and more floral.</div>`};

L['C2-1'] = {ar:`<h3>ًں’§ ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ظ…ط؛ط³ظˆظ„ط© (Washed) â€” ط§ظ„ظ†ظ‚ط§ط، ظˆط§ظ„ظˆط¶ظˆط­</h3>
<p>ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ظ…ط؛ط³ظˆظ„ط© â€” ط£ظˆ <strong>Wet Process</strong> â€” ط§ط®طھط±ط¹ظ‡ط§ ط§ظ„ظ‡ظˆظ„ظ†ط¯ظٹظˆظ† ظپظٹ ط¬ط§ظˆط© ط¨ط§ظ„ظ‚ط±ظ† ط§ظ„ط«ط§ظ…ظ† ط¹ط´ط±. ظپظƒط±طھظ‡ط§: ط¥ط²ط§ظ„ط© ط§ظ„ظ‚ط´ط±ط© ظˆط§ظ„ظ„ط¨ ظپظˆط± ظ‚ط·ظپ ط§ظ„ط«ظ…ط±ط©طŒ ظ‚ط¨ظ„ ط§ظ„طھط¬ظپظٹظپ. ط§ظ„ظ†طھظٹط¬ط©: <strong>ظ‚ظ‡ظˆط© ط£ظ†ظ‚ظ‰ ظˆط£ظƒط«ط± ط¥ط´ط±ط§ظ‚ط§ظ‹</strong> طھط¨ط±ط² ط§ظ„ظ†ظƒظ‡ط§طھ ط§ظ„ط£طµظ„ظٹط© ظ„ظ„ط¨ظ†.</p>
<h3>ًں”¬ ط®ط·ظˆط§طھ ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ظ…ط؛ط³ظˆظ„ط©</h3>
<ol><li><strong>ط§ظ„ظ‚ط·ظپ ظˆط§ظ„ظپط±ط²:</strong> طھط·ظپظˆ ط§ظ„ظƒط±ط²ط§طھ ظپظٹ ط§ظ„ظ…ط§ط، â€” طھظپطµظ„ ط§ظ„ظ†ط§ط¶ط¬ط© ط¹ظ† ط؛ظٹط± ط§ظ„ظ†ط§ط¶ط¬ط©</li>
<li><strong>ظ†ط²ط¹ ط§ظ„ظ‚ط´ط±ط© (Depulping):</strong> طھظ…ط± ط§ظ„ظƒط±ط²ط§طھ ظپظٹ ظ…ط§ظƒظٹظ†ط© طھط²ظٹظ„ ط§ظ„ظ‚ط´ط±ط© ظˆط§ظ„ظ„ط¨ ط§ظ„ط®ط§ط±ط¬ظٹ ظ…ظٹظƒط§ظ†ظٹظƒظٹط§ظ‹</li>
<li><strong>ط§ظ„طھط®ظ…ظٹط± (Fermentation):</strong> طھظˆط¶ط¹ ط§ظ„ط¨ط°ظˆط± â€” ظ…ط؛ط·ط§ط© ط¨ط·ط¨ظ‚ط© ط§ظ„ظ…ظٹظˆط³ظٹظ„ط§ط¬ ط§ظ„ظ„ط²ط¬ط© â€” ظپظٹ ط£ط­ظˆط§ط¶ طھط®ظ…ظٹط± ظ„ظ…ط¯ط© 24-36 ط³ط§ط¹ط©. ط§ظ„ط¨ظƒطھظٹط±ظٹط§ ظˆط§ظ„ط®ظ…ط§ط¦ط± طھظپظƒظƒ ط§ظ„ط³ظƒط±ظٹط§طھ ط§ظ„ظ„ط²ط¬ط©</li>
<li><strong>ط§ظ„ط؛ط³ظٹظ„ (Washing):</strong> طھط؛ط³ظ„ ط§ظ„ط¨ط°ظˆط± ط¨ط§ظ„ظ…ط§ط، ط§ظ„ظ†ط¸ظٹظپ ظ„ط¥ط²ط§ظ„ط© ظƒظ„ ط¢ط«ط§ط± ط§ظ„ظ…ظٹظˆط³ظٹظ„ط§ط¬ ط§ظ„ظ…طھط®ظ…ط±</li>
<li><strong>ط§ظ„طھط¬ظپظٹظپ:</strong> طھط¬ظپظپ ط§ظ„ط¨ط°ظˆط± (ط¨ظ‚ط´ط±طھظ‡ط§ ط§ظ„ط±ظ‚ظٹظ‚ط©) ط¹ظ„ظ‰ ط³ط±ط§ظٹط± ط§ظ„طھط¬ظپظٹظپ ظ„ظ…ط¯ط© 7-15 ظٹظˆظ…ط§ظ‹ ط­طھظ‰ 11-12% ط±ط·ظˆط¨ط©</li>
<li><strong>ط§ظ„ط·ط­ظ† ط§ظ„ط±ط·ط¨ (Wet Milling):</strong> طھط²ط§ظ„ ط§ظ„ظ‚ط´ط±ط© ط§ظ„ط±ظ‚ظٹظ‚ط© (Parchment) ظˆط·ط¨ظ‚ط© ط§ظ„ظپط¶ط© ظ…ظٹظƒط§ظ†ظٹظƒظٹط§ظ‹</li></ol>
<h3>ًں’§ ط§ط³طھظ‡ظ„ط§ظƒ ط§ظ„ظ…ظٹط§ظ‡</h3>
<p>ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ظ…ط؛ط³ظˆظ„ط© طھط³طھظ‡ظ„ظƒ <strong>ظƒظ…ظٹط© ظƒط¨ظٹط±ط© ظ…ظ† ط§ظ„ظ…ط§ط،</strong> â€” 40-60 ظ„طھط± ظ„ظƒظ„ ظƒظٹظ„ظˆ ط¨ظ† ط£ط®ط¶ط±. ظ‡ط°ط§ ظٹظ…ط«ظ„ طھط­ط¯ظٹط§ظ‹ ط¨ظٹط¦ظٹط§ظ‹ ظƒط¨ظٹط±ط§ظ‹ ظپظٹ ظ…ظ†ط§ط·ظ‚ ط²ط±ط§ط¹ط© ط§ظ„ط¨ظ† ط§ظ„طھظٹ طھط¹ط§ظ†ظٹ ظ…ظ† ط´ط­ ط§ظ„ظ…ظٹط§ظ‡. ط§ظ„طھظ‚ظ†ظٹط§طھ ط§ظ„ط­ط¯ظٹط«ط© ظ‚ظ„ظ‘طµطھ ط§ظ„ط§ط³طھظ‡ظ„ط§ظƒ ط¥ظ„ظ‰ 5-10 ظ„طھط± ط¨ط§ط³طھط®ط¯ط§ظ… ط£ظ†ط¸ظ…ط© ط¥ط¹ط§ط¯ط© ط§ظ„طھط¯ظˆظٹط±.</p>
<h3>ًں‘ƒ ظ†ظƒظ‡ط§طھ ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ظ…ط؛ط³ظˆظ„ط©</h3>
<p><strong>ط§ظ„ظ…ظ…ظٹط²ط§طھ:</strong> ظ†ظ‚ط§ط، ط¹ط§ظ„ظچطŒ ط­ظ…ظˆط¶ط© ظ…طھط£ظ„ظ‚ط©طŒ ظ†ظƒظ‡ط§طھ ط²ظ‡ط±ظٹط© ظˆط­ظ…ط¶ظٹط© ظˆط§ط¶ط­ط©طŒ ظ‚ظˆط§ظ… ط®ظپظٹظپ ط¥ظ„ظ‰ ظ…طھظˆط³ط·.<br><strong>ط§ظ„ظ…ط³ط§ظˆط¦:</strong> ظ‚ط¯ طھظپطھظ‚ط± ط¥ظ„ظ‰ ط§ظ„طھط¹ظ‚ظٹط¯ ظˆط§ظ„ط­ظ„ط§ظˆط© ط§ظ„طھظٹ طھظ…ظ†ط­ظ‡ط§ ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط·ط¨ظٹط¹ظٹط©.<br><strong>ط£ط´ظ‡ط± ط§ظ„ظ…ظ†ط§ط·ظ‚:</strong> ظƒظˆظ„ظˆظ…ط¨ظٹط§طŒ ظƒظٹظ†ظٹط§طŒ ظƒظˆط³طھط§ط±ظٹظƒط§طŒ ط¥ط«ظٹظˆط¨ظٹط§ ط§ظ„ظ…ط؛ط³ظˆظ„ط©.</p>
<div class="hl"><strong>ًں“ٹ ظ…ظ‚ط§ط±ظ†ط©:</strong> ط§ظ„ظ…ط؛ط³ظˆظ„ط© طھط¨ط±ط² ط§ظ„ط´ط®طµظٹط© ط§ظ„ط­ظ‚ظٹظ‚ظٹط© ظ„ظ„ط­ط¨ط© (Terroir) â€” ط§ظ„ظ†ظƒظ‡ط§طھ ط§ظ„طھظٹ طھط¹ط·ظٹظ‡ط§ ط§ظ„طھط±ط¨ط© ظˆط§ظ„ظ…ظ†ط§ط®. ط§ظ„ط·ط¨ظٹط¹ظٹط© طھط¶ظٹظپ ظ†ظƒظ‡ط§طھ ظ…ظ† ط§ظ„طھط®ظ…ظٹط± ظ†ظپط³ظ‡ â€” ط·ط¨ظ‚ط© ط¥ط¶ط§ظپظٹط© ظپظˆظ‚ Terroir.</div>
<div class="info-box"><strong>ًں’¬ ط­ظ‚ط§ط¦ظ‚:</strong> 60% ظ…ظ† ط¥ظ†طھط§ط¬ ط§ظ„ط¨ظ† ظپظٹ ط£ظ…ط±ظٹظƒط§ ط§ظ„ظˆط³ط·ظ‰ ظ…ط؛ط³ظˆظ„. ظپظٹ ط¥ط«ظٹظˆط¨ظٹط§طŒ ظ†ط³ط¨ط© ط§ظ„ظ…ط؛ط³ظˆظ„ طھطھط²ط§ظٹط¯ â€” ظ…ظ† 30% ظپظٹ 2010 ط¥ظ„ظ‰ 50% ظپظٹ 2025.</div>`, en:`<h3>ًں’§ Washed Processing â€” Purity and Clarity</h3>
<p>Washed processing â€” or <strong>Wet Process</strong> â€” was invented by the Dutch in 18th century Java. The idea: remove the skin and pulp immediately after harvesting, before drying. The result: <strong>cleaner, brighter coffee</strong> that highlights the bean's original flavors.</p>
<h3>ًں”¬ Washed Processing Steps</h3>
<ol><li><strong>Harvest &amp; Sort:</strong> Cherries floated in water â€” ripe from unripe separated</li>
<li><strong>Depulping:</strong> Cherries pass through a machine that removes skin and outer pulp mechanically</li>
<li><strong>Fermentation:</strong> Seeds â€” covered in sticky mucilage â€” sit in fermentation tanks for 24-36 hours. Bacteria and yeasts break down the sticky sugars</li>
<li><strong>Washing:</strong> Seeds washed with clean water to remove all fermented mucilage</li>
<li><strong>Drying:</strong> Seeds dried (with parchment intact) on drying beds for 7-15 days to 11-12% moisture</li>
<li><strong>Wet Milling:</strong> Parchment and silver skin removed mechanically</li></ol>
<h3>ًں’§ Water Consumption</h3>
<p>Washed processing consumes <strong>significant water</strong> â€” 40-60 liters per kg of green coffee. This is a major environmental challenge in coffee-growing regions facing water scarcity. Modern technology has reduced this to 5-10L using recycling systems.</p>
<h3>ًں‘ƒ Washed Processing Flavors</h3>
<p><strong>Strengths:</strong> High clarity, bright acidity, clear floral and citrus notes, light to medium body.<br><strong>Weaknesses:</strong> May lack the complexity and sweetness of natural processing.<br><strong>Famous regions:</strong> Colombia, Kenya, Costa Rica, washed Ethiopians.</p>
<div class="hl"><strong>ًں“ٹ Comparison:</strong> Washed highlights the true character of the bean (Terroir) â€” flavors imparted by soil and climate. Natural adds fermentation flavors â€” an extra layer on top of Terroir.</div>
<div class="info-box"><strong>ًں’¬ Facts:</strong> 60% of Central American coffee is washed. In Ethiopia, washed percentage is increasing â€” from 30% in 2010 to 50% in 2025.</div>`};

L['C2-2'] = {ar:`<h3>ًںچ¯ ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط¨ط§ظ„ط¹ط³ظ„ ظˆط§ظ„طھط¬ط±ظٹط¨ظٹط© â€” ط§ظ„ط§ط¨طھظƒط§ط± ظپظٹ ط§ظ„ظ…ط°ط§ظ‚</h3>
<p>ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط¨ط§ظ„ط¹ط³ظ„ (Honey Process) ظ‡ظٹ <strong>ط§ظ„ظˆط³ظٹط· ط¨ظٹظ† ط§ظ„ط·ط¨ظٹط¹ظٹط© ظˆط§ظ„ظ…ط؛ط³ظˆظ„ط©</strong>. طھظڈطھط±ظƒ ط·ط¨ظ‚ط© ظ…ظ† ط§ظ„ظ…ظٹظˆط³ظٹظ„ط§ط¬ (ط§ظ„ظ„ط¨ ط§ظ„ظ„ط²ط¬ ط§ظ„ط­ظ„ظˆ) ط¹ظ„ظ‰ ط§ظ„ط¨ط°ط±ط© ط£ط«ظ†ط§ط، ط§ظ„طھط¬ظپظٹظپ. ظƒظ„ظ…ط© "ط¹ط³ظ„" طھط´ظٹط± ط¥ظ„ظ‰ <strong>ظ„ط²ظˆط¬ط© ط§ظ„ظ…ظٹظˆط³ظٹظ„ط§ط¬</strong> ظˆظ„ظٹط³ ط§ظ„ط¹ط³ظ„ ط§ظ„ط­ظ‚ظٹظ‚ظٹ.</p>
<h3>ًںچ¯ ط£ظ†ظˆط§ط¹ ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط¨ط§ظ„ط¹ط³ظ„ â€” 3 ظ…ط³طھظˆظٹط§طھ</h3>
<table><tr><th>ط§ظ„ظ†ظˆط¹</th><th>ظƒظ…ظٹط© ط§ظ„ظ„ط¨ ط§ظ„ظ…طھط±ظˆظƒ</th><th>ط§ظ„ظ†ظƒظ‡ط©</th></tr>
<tr><td><strong>ط£طµظپط± (Yellow Honey)</strong></td><td>ظ‚ظ„ظٹظ„ط© â€” 20-30%</td><td>ط£ظ†ظ‚ظ‰ ظ†ظƒظ‡ط© â€” ظ‚ط±ظٹط¨ط© ظ…ظ† ط§ظ„ظ…ط؛ط³ظˆظ„ط©طŒ ط­ظ…ظˆط¶ط© ظ…طھظˆط³ط·ط©</td></tr>
<tr><td><strong>ط£ط­ظ…ط± (Red Honey)</strong></td><td>ظ…طھظˆط³ط·ط© â€” 50-60%</td><td>طھظˆط§ط²ظ† â€” ط­ظ„ط§ظˆط© ط·ط¨ظٹط¹ظٹط© ظ…ط¹ ط­ظ…ظˆط¶ط© ط®ظپظٹظپط©طŒ ظ‚ظˆط§ظ… ظƒط§ظ…ظ„</td></tr>
<tr><td><strong>ط£ط³ظˆط¯ (Black Honey)</strong></td><td>ظƒط§ظ…ظ„ط© â€” 80-100%</td><td>ط£ط؛ظ†ظ‰ ظ†ظƒظ‡ط© â€” ط­ظ„ط§ظˆط© ط¹ط§ظ„ظٹط©طŒ ظ†ظƒظ‡ط§طھ ظپط§ظƒظ‡ظٹط© ط¯ط§ظƒظ†ط©طŒ ظ‚ظˆط§ظ… ط«ظ‚ظٹظ„</td></tr></table>
<h3>ًں§ھ ط§ظ„ظ…ط¹ط§ظ„ط¬ط§طھ ط§ظ„طھط¬ط±ظٹط¨ظٹط© â€” ط­ط¯ظˆط¯ ط¬ط¯ظٹط¯ط© ظ„ظ„ط·ط¹ظ…</h3>
<p><strong>ط§ظ„طھط®ظ…ظٹط± ط§ظ„ظ„ط§ظ‡ظˆط§ط¦ظٹ (Anaerobic Fermentation):</strong> طھظˆط¶ط¹ ط§ظ„ظƒط±ط²ط§طھ ظپظٹ ط®ط²ط§ظ†ط§طھ ظ…ط­ظƒظ…ط© ط§ظ„ط¥ط؛ظ„ط§ظ‚ ظ…ط¹ ط¥ط²ط§ظ„ط© ط§ظ„ط£ظƒط³ط¬ظٹظ†. ظٹطھظ… ط§ظ„طھط®ظ…ظٹط± ط¨ظˆط§ط³ط·ط© ط¨ظƒطھظٹط±ظٹط§ ظ„ط§ طھط­طھط§ط¬ ط£ظƒط³ط¬ظٹظ† â€” طھظ†طھط¬ ظ†ظƒظ‡ط§طھ ط¬ط±ظٹط¦ط©طŒ ظپط§ظƒظ‡ظٹط© ط§ط³طھظˆط§ط¦ظٹط©طŒ ط£ط²ظ‡ط§ط± ط؛ط±ظٹط¨ط©. ظٹط³طھط؛ط±ظ‚ 48-120 ط³ط§ط¹ط©.</p>
<p><strong>ط§ظ„ظƒط±ط¨ظˆظ†ظٹظƒ ظ…ط§ظƒظٹط±ظٹط´ظ† (Carbonic Maceration):</strong> ظ…ظ‚طھط¨ط³ط© ظ…ظ† طµظ†ط§ط¹ط© ط§ظ„ظ†ط¨ظٹط° â€” طھظˆط¶ط¹ ط§ظ„ظƒط±ط²ط§طھ ط§ظ„ظƒط§ظ…ظ„ط© ظپظٹ ط¨ظٹط¦ط© COâ‚‚ ظ†ظ‚ظٹط©. ط§ظ„طھط®ظ…ظٹط± ط¯ط§ط®ظ„ ط§ظ„ط«ظ…ط±ط© ظ†ظپط³ظ‡ط§ ظٹظ†طھط¬ ظ†ظƒظ‡ط§طھ <strong>ظ…ط°ظ‡ظ„ط©</strong>: ظ†ط¨ظٹط°ظٹط©طŒ طھظˆطھ ط£ط­ظ…ط±طŒ ط£ط²ظ‡ط§ط±طŒ ط¨ظ‡ط§ط±ط§طھ. ط£ط´ظ‡ط± ظ…ط«ط§ظ„: ظ‚ظ‡ظˆط© ظƒظˆط³طھط§ط±ظٹظƒط§ "Las Lajas" ط§ظ„ط­ط§طµظ„ط© ط¹ظ„ظ‰ 93 ظ†ظ‚ط·ط©.</p>
<p><strong>ط§ظ„طھط®ظ…ظٹط± ط¨ط§ظ„ط®ظ…ط§ط¦ط± ط§ظ„ظ…ط®طھط§ط±ط© (Yeast Inoculation):</strong> طھط¶ط§ظپ ط³ظ„ط§ظ„ط§طھ ط®ظ…ط§ط¦ط± ظ…ط­ط¯ط¯ط© (ظ…ط«ظ„ Saccharomyces cerevisiae) ظ„ظ„طھط­ظƒظ… ط¨ط¯ظ‚ط© ظپظٹ ظ†ظˆط§طھط¬ ط§ظ„طھط®ظ…ظٹط±. ظ…ط«ظ„ط§ظ‹: ط®ظ…ظٹط±ط© ط§ظ„طھظˆطھ ط§ظ„ط¨ط±ظٹ طھط¹ط·ظٹ ظ†ظƒظ‡ط§طھ طھظˆطھ ظˆط§ط¶ط­ط©.</p>
<div class="hl"><strong>ًں“ٹ ط³ظˆظ‚ ط§ظ„ظ…ط¹ط§ظ„ط¬ط§طھ ط§ظ„طھط¬ط±ظٹط¨ظٹط©:</strong> ظپظٹ 2015طŒ ظƒط§ظ†طھ ط£ظ‚ظ„ ظ…ظ† 2% ظ…ظ† ظ‚ظ‡ظˆط© specialty طھط¬ط±ظٹط¨ظٹط©. ظپظٹ 2025طŒ طھطھط¬ط§ظˆط² 15% â€” ظˆط§ظ„ظ…ط³طھظ‡ظ„ظƒظˆظ† ظٹط¯ظپط¹ظˆظ† 30-50% ط£ظƒط«ط± ط«ظ…ظ†ط§ظ‹ ظ„ظ‡ط§. ظ‡ط°ط§ ظ‡ظˆ ظ…ط³طھظ‚ط¨ظ„ ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ط®طھطµط©.</div>
<div class="ok-box"><strong>ًںژ¯ طھط¬ط±ط¨ط©:</strong> ط§ط¨ط­ط« ط¹ظ† ظ‚ظ‡ظˆط© "Anaerobic Natural" ط£ظˆ "Carbonic Maceration" ظ…ظ† ظ…ط­ظ…طµط© specialty ظ…ط­ظ„ظٹط©. ظ‚ط§ط±ظ†ظ‡ط§ ظ…ط¹ ظ‚ظ‡ظˆط© ظ…ط؛ط³ظˆظ„ط© ظ…ظ† ظ†ظپط³ ط§ظ„ط¨ظ„ط¯. ط§ظ„ظپط±ظ‚ ط³ظٹظƒظˆظ† طµط§ط¯ظ…ط§ظ‹ â€” ظƒط£ظ†ظ‡ط§ ظپط§ظƒظ‡ط© ط³ط§ط¦ظ„ط©!</div>`, en:`<h3>ًںچ¯ Honey & Experimental Processing â€” Innovation in Taste</h3>
<p>Honey processing is the <strong>middle ground between natural and washed</strong>. A layer of mucilage (sticky sweet pulp) is left on the bean during drying. The word "honey" refers to the <strong>stickiness of the mucilage</strong>, not actual honey.</p>
<h3>ًںچ¯ Types of Honey Processing â€” 3 Levels</h3>
<table><tr><th>Type</th><th>Mucilage Left</th><th>Flavor</th></tr>
<tr><td><strong>Yellow Honey</strong></td><td>Minimal â€” 20-30%</td><td>Cleanest â€” close to washed, medium acidity</td></tr>
<tr><td><strong>Red Honey</strong></td><td>Medium â€” 50-60%</td><td>Balanced â€” natural sweetness with light acidity</td></tr>
<tr><td><strong>Black Honey</strong></td><td>Full â€” 80-100%</td><td>Richest â€” high sweetness, dark fruity notes, heavy body</td></tr></table>
<h3>ًں§ھ Experimental Processing â€” New Flavor Frontiers</h3>
<p><strong>Anaerobic Fermentation:</strong> Cherries placed in sealed tanks with oxygen removed. Fermented by bacteria that don't need oxygen â€” producing bold, tropical fruit, exotic floral notes. Takes 48-120 hours.</p>
<p><strong>Carbonic Maceration:</strong> Borrowed from winemaking â€” whole cherries placed in pure COâ‚‚ environment. Fermentation inside the fruit produces <strong>stunning</strong> flavors: winey, red berry, floral, spicy. Famous example: Costa Rica "Las Lajas" scoring 93 points.</p>
<p><strong>Yeast Inoculation:</strong> Specific yeast strains added (e.g., Saccharomyces cerevisiae) to precisely control fermentation byproducts. E.g., cranberry yeast gives clear berry notes.</p>
<div class="hl"><strong>ًں“ٹ Experimental Market:</strong> In 2015, less than 2% of specialty coffee was experimental. By 2025, it exceeds 15% â€” and consumers pay 30-50% more for it. This is the future of specialty coffee.</div>
<div class="ok-box"><strong>ًںژ¯ Experience:</strong> Find an "Anaerobic Natural" or "Carbonic Maceration" coffee from a local specialty roaster. Compare it with a washed coffee from the same country. The difference will be shocking â€” like liquid fruit!</div>`};

L['C3-0'] = {ar:`<h3>ًںڈھ طھط®ط·ظٹط· ظˆطھط´ط؛ظٹظ„ ط§ظ„ظ…ظ‚ظ‡ظ‰ â€” ظ…ظ† ط§ظ„ظپظƒط±ط© ط¥ظ„ظ‰ ط§ظ„ظˆط§ظ‚ط¹</h3><p>ط§ظپطھطھط§ط­ ظ…ظ‚ظ‡ظ‰ ظ†ط§ط¬ط­ ظٹط¨ط¯ط£ ظ‚ط¨ظ„ ط£ظˆظ„ ظƒظˆط¨ ظ‚ظ‡ظˆط© ط¨ظپطھط±ط© ط·ظˆظٹظ„ط©. <strong>ط§ظ„طھط®ط·ظٹط· ط§ظ„ط¬ظٹط¯</strong> ظ‡ظˆ ط§ظ„ظپط±ظ‚ ط¨ظٹظ† ظ…ظ‚ظ‡ظ‰ ظٹط؛ظ„ظ‚ ط¨ط¹ط¯ 6 ط£ط´ظ‡ط± ظˆظ…ظ‚ظ‡ظ‰ ظٹط³طھظ…ط± ظ„ط¹ظ‚ظˆط¯. ظپظٹ ظ‡ط°ظ‡ ط§ظ„ظˆط­ط¯ط©طŒ ط³ظ†ط؛ط·ظٹ ظƒظ„ ط¬ظˆط§ظ†ط¨ ط§ظ„طھط®ط·ظٹط·.</p>
<div class="img-c"><img src="\${photo('cafe')}" alt=""><div class="cap">ًںڈھ طھطµظ…ظٹظ… ط§ظ„ظ…ظ‚ظ‡ظ‰ â€” طھط®ط·ظٹط· ط§ظ„ظ…ط³ط§ط­ط© ظˆط§ظ„ط¹ظ…ظ„</div></div>
<h3>ًں“چ ط§ط®طھظٹط§ط± ط§ظ„ظ…ظˆظ‚ط¹ â€” ط£ظ‡ظ… ظ‚ط±ط§ط±</h3><p>ط§ظ„ظ…ظˆظ‚ط¹ ط§ظ„ط¬ظٹط¯ ظ‡ظˆ <strong>ط£ظƒط«ط± ظ…ظ† 50% ظ…ظ† ظ†ط³ط¨ط© ط§ظ„ظ†ط¬ط§ط­</strong>.<br>â€¢ <strong>ط§ظ„ط±ط¤ظٹط© (Visibility):</strong> ظ‡ظ„ ط§ظ„ظ…ظ‚ظ‡ظ‰ ظ…ط±ط¦ظٹ ظ…ظ† ط§ظ„ط´ط§ط±ط¹ ط§ظ„ط±ط¦ظٹط³ظٹطں ظ‡ظ„ ظ‡ظ†ط§ظƒ ظ„ط§ظپطھط© ظˆط§ط¶ط­ط©طں<br>â€¢ <strong>ط­ط±ظƒط© ط§ظ„ظ…ط´ط§ط© (Foot Traffic):</strong> ظƒظ… ط´ط®طµ ظٹظ…ط± ط£ظ…ط§ظ… ط§ظ„ظ…ظ‚ظ‡ظ‰ ظٹظˆظ…ظٹط§ظ‹طں ظ‡ظ„ ظ‡ظ… ط¬ظ…ظ‡ظˆط±ظƒ ط§ظ„ظ…ط³طھظ‡ط¯ظپطں<br>â€¢ <strong>ط§ظ„ظ…ظ†ط§ظپط³ط©:</strong> ظƒظ… ظ…ظ‚ظ‡ظ‰ ظپظٹ ط§ظ„ظ…ظ†ط·ظ‚ط©طں ظ…ط§ط°ط§ ظٹظ‚ط¯ظ…ظˆظ†طں ط£ظٹظ† ظپط±طµطھظƒ ط§ظ„طھظ†ط§ظپط³ظٹط©طں<br>â€¢ <strong>ظ…ظˆط§ظ‚ظپ ط§ظ„ط³ظٹط§ط±ط§طھ:</strong> ظ‡ظ„ ظ‡ظ†ط§ظƒ ظ…ظˆط§ظ‚ظپ ظƒط§ظپظٹط© ظ„ظ„ط²ط¨ط§ط¦ظ†طں</p>
<h3>ًں“گ طھطµظ…ظٹظ… ط§ظ„ظ…ط³ط§ط­ط© â€” طھط¯ظپظ‚ ط§ظ„ط¹ظ…ظ„</h3><table><tr><th>ط§ظ„ظ…ظ†ط·ظ‚ط©</th><th>ط§ظ„ظˆط¸ظٹظپط©</th><th>ط§ظ„ظ…ط³ط§ط­ط© ط§ظ„ظ…ط«ظ„ظ‰</th></tr><tr><td>ظ…ظ†ط·ظ‚ط© ط§ظ„ط¹ظ…ظ„ ط§ظ„ط®ظ„ظپظٹط© (Back of House)</td><td>طھط®ط²ظٹظ†طŒ طھط­ظ…ظٹطµ (ط¥ظ† ظˆط¬ط¯)طŒ طھط¬ظ‡ظٹط²</td><td>30-40% ظ…ظ† ط§ظ„ظ…ط³ط§ط­ط©</td></tr><tr><td>ظ…ظ†ط·ظ‚ط© ط§ظ„ط¨ط§ط±ظٹط³طھط§ (Front Bar)</td><td>طھط­ط¶ظٹط± ط§ظ„ظ‚ظ‡ظˆط©طŒ طھظ‚ط¯ظٹظ… ط§ظ„ط®ط¯ظ…ط©</td><td>15-20%</td></tr><tr><td>ظ…ظ†ط·ظ‚ط© ط§ظ„ط¬ظ„ظˆط³ (Seating)</td><td>ط§ط³طھظ‚ط¨ط§ظ„ ط§ظ„ط²ط¨ط§ط¦ظ†</td><td>40-50%</td></tr><tr><td>ظ…ظ†ط·ظ‚ط© ط§ظ„ط§ظ†طھط¸ط§ط± ظˆط§ظ„ط¯ظپط¹</td><td>طھظ†ط¸ظٹظ… ط§ظ„ط·ظ„ط¨ط§طھ</td><td>5-10%</td></tr></table>
<div class="hl"><strong>ًں’، ظ…ط¨ط¯ط£ ط§ظ„ظ…ط«ظ„ط« ط§ظ„ط°ظ‡ط¨ظٹ:</strong> ظپظٹ طھطµظ…ظٹظ… ط§ظ„ظ…ظ‚ظ‡ظ‰طŒ ط´ظƒظ„ ط§ظ„ظ…ط«ظ„ط« ط¨ظٹظ† (ظ…ظ†ط·ظ‚ط© ط§ظ„ط¯ظپط¹) ظˆ (ظ…ظ†ط·ظ‚ط© طھط³ظ„ظٹظ… ط§ظ„ظ‚ظ‡ظˆط©) ظˆ (ظ…ظ†ط·ظ‚ط© طھط­ط¶ظٹط± ط§ظ„ط­ظ„ظٹط¨) ظ‡ظˆ ظ…ظپطھط§ط­ ط³ط±ط¹ط© ط§ظ„ط®ط¯ظ…ط©. ط§ظ„ظ…ط³ط§ظپط© ط¨ظٹظ† ظƒظ„ ظ†ظ‚ط·ط© ظٹط¬ط¨ ط£ظ„ط§ طھط²ظٹط¯ ط¹ظ† 1.5 ظ…طھط±.</div>
<h3>âڑ™ï¸ڈ ط§ط®طھظٹط§ط± ط§ظ„ظ…ط¹ط¯ط§طھ â€” ط§ط³طھط«ظ…ط§ط± ط·ظˆظٹظ„ ط§ظ„ظ…ط¯ظ‰</h3><p><strong>ظ…ط§ظƒظٹظ†ط© ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ:</strong> ط£ظ‡ظ… ظ‚ط·ط¹ط© ظ…ط¹ط¯ط§طھ. ط§ط®طھط± ظ…ط§ظƒظٹظ†ط© طھظ†ط§ط³ط¨ ط­ط¬ظ… ط¹ظ…ظ„ظƒ (ظ…ط¬ظ…ظˆط¹طھظٹظ† ط£ظˆ 3 ظ„ظ„ظ…ظ‚ط§ظ‡ظٹ ظ…طھظˆط³ط·ط© ط§ظ„ط­ط¬ظ…). ط§ظ„ظ…ط§ط±ظƒط§طھ ط§ظ„ظ…ظˆط«ظˆظ‚ط©: La MarzoccoطŒ LineaطŒ Nuova SimonelliطŒ Rancilio.<br><strong>ط§ظ„ظ…ط·ط§ط­ظ†:</strong> ظ„ط§ طھظˆظپط± ظپظٹ ط§ظ„ظ…ط·ط­ظ†ط© â€” ظ…ط·ط­ظ†ط© ط¬ظٹط¯ط© طھط¹ظ†ظٹ ظ‚ظ‡ظˆط© ظ…طھط³ظ‚ط©. ط§ط³طھط«ظ…ط± ظپظٹ ظ…ط·ط­ظ†ط© ط¥ط³ط¨ط±ظٹط³ظˆ (MythosطŒ EK43) ظˆظ…ط·ط­ظ†ط© ظ„ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ظ‚ط·ط±ط©.<br><strong>ظپظ„طھط± ط§ظ„ظ…ظٹط§ظ‡:</strong> ظ…ط§ط، ط¬ظٹط¯ = ظ‚ظ‡ظˆط© ط¬ظٹط¯ط©. ظ†ط¸ط§ظ… ظƒط±ط¨ظˆظ† ظ†ط´ط· + طھط¨ط§ط¯ظ„ ط£ظٹظˆظ†ظٹ ظƒط§ظپظچ ظ„ظ…ط¹ط¸ظ… ط§ظ„ظ…ظ‚ط§ظ‡ظٹ.</p>
<div class="err-box"><strong>â‌Œ ط®ط·ط£ ط´ط§ط¦ط¹:</strong> ط´ط±ط§ط، ظ…ط¹ط¯ط§طھ ط±ط®ظٹطµط© ظ„طھظˆظپظٹط± ط§ظ„طھظƒط§ظ„ظٹظپ. ط§ظ„ط­ظ‚ظٹظ‚ط©: ط§ظ„ظ…ط¹ط¯ط§طھ ط§ظ„ط±ط®ظٹطµط© طھطھط¹ط·ظ„ ط¨ط§ط³طھظ…ط±ط§ط± ظˆطھظ†طھط¬ ظ‚ظ‡ظˆط© ط؛ظٹط± ظ…طھط³ظ‚ط© â€” ط®ط³ط§ط±ط© ط£ظƒط¨ط± ط¹ظ„ظ‰ ط§ظ„ظ…ط¯ظ‰ ط§ظ„ط·ظˆظٹظ„.</div>
<div class="ok-box"><strong>âœ… ظ‚ط§ط¦ظ…ط© ط§ظ„طھط­ظ‚ظ‚ ظ‚ط¨ظ„ ط§ظ„ط§ظپطھطھط§ط­:</strong> ط±ط®طµط© ط§ظ„ط¨ظ„ط¯ظٹط© âœ“ آ· ظپط­طµ ط§ظ„ط¯ظپط§ط¹ ط§ظ„ظ…ط¯ظ†ظٹ âœ“ آ· ظپظ„ط§طھط± ط§ظ„ظ…ظٹط§ظ‡ âœ“ آ· طھط¯ط±ظٹط¨ ط§ظ„ط·ط§ظ‚ظ… âœ“ آ· ط§ط®طھط¨ط§ط± ط§ظ„ظ‚ط§ط¦ظ…ط© âœ“ آ· طھطµظ…ظٹظ… ظ‚ط§ط¦ظ…ط© ط§ظ„ط£ط³ط¹ط§ط± âœ“ آ· ظ†ط¸ط§ظ… ظ†ظ‚ط§ط· ط§ظ„ط¨ظٹط¹ (POS) âœ“</div>`, en:`<h3>ًںڈھ Cafe Planning & Operations â€” From Idea to Reality</h3><p>Opening a successful cafe starts long before the first cup of coffee. <strong>Good planning</strong> is the difference between a cafe that closes after 6 months and one that lasts for decades. This module covers every aspect of planning.</p>
<div class="img-c"><img src="\${photo('cafe')}" alt=""><div class="cap">ًںڈھ Cafe Design â€” Space & Workflow Planning</div></div>
<h3>ًں“چ Location Selection â€” The Most Important Decision</h3><p>A good location accounts for <strong>over 50% of success</strong>.<br>â€¢ <strong>Visibility:</strong> Is the cafe visible from the main street? Is there clear signage?<br>â€¢ <strong>Foot Traffic:</strong> How many people pass by daily? Are they your target audience?<br>â€¢ <strong>Competition:</strong> How many cafes in the area? What do they offer? What's your competitive edge?<br>â€¢ <strong>Parking:</strong> Is there adequate parking for customers?</p>
<h3>ًں“گ Space Design â€” Workflow</h3><table><tr><th>Zone</th><th>Function</th><th>Ideal Space</th></tr><tr><td>Back of House</td><td>Storage, roasting, prep</td><td>30-40%</td></tr><tr><td>Front Bar</td><td>Brewing, service</td><td>15-20%</td></tr><tr><td>Seating Area</td><td>Customer comfort</td><td>40-50%</td></tr><tr><td>Waiting &amp; Payment</td><td>Order flow</td><td>5-10%</td></tr></table>
<div class="hl"><strong>ًں’، The Golden Triangle Principle:</strong> In cafe design, the triangle between (payment point), (coffee pickup), and (milk prep station) is key to service speed. Distance between each point should not exceed 1.5m.</div>
<h3>âڑ™ï¸ڈ Equipment Selection â€” Long-term Investment</h3><p><strong>Espresso Machine:</strong> The most important equipment piece. Choose a machine matching your volume (2 or 3-group for medium cafes). Trusted brands: La Marzocco, Linea, Nuova Simonelli, Rancilio.<br><strong>Grinders:</strong> Don't skimp on the grinder â€” a good grinder means consistent coffee. Invest in an espresso grinder (Mythos, EK43) and a brew grinder.<br><strong>Water Filtration:</strong> Good water = good coffee. Carbon + ion exchange filter is sufficient for most cafes.</p>
<div class="err-box"><strong>â‌Œ Common Mistake:</strong> Buying cheap equipment to save costs. Truth: cheap equipment breaks down constantly and produces inconsistent coffee â€” bigger loss long-term.</div>
<div class="ok-box"><strong>âœ… Pre-Opening Checklist:</strong> Municipal license âœ“ آ· Fire safety inspection âœ“ آ· Water filters âœ“ آ· Staff training âœ“ آ· Menu testing âœ“ آ· Price list design âœ“ آ· POS system âœ“</div>`};

L['C3-1'] = {ar:`<h3>ًں’° ط­ط³ط§ط¨ط§طھ ط§ظ„طھظƒط§ظ„ظٹظپ ظˆط§ظ„ط£ط±ط¨ط§ط­ â€” ط¥ط¯ط§ط±ط© ظ…ط§ظ„ظٹط© ظ„ظ„ظ…ظ‚ط§ظ‡ظٹ</h3><p>ظپظ‡ظ… ط§ظ„طھظƒط§ظ„ظٹظپ ظ‡ظˆ ظ…ط§ ظٹط­ظˆظ„ ط´ط؛ظپ ط§ظ„ظ‚ظ‡ظˆط© ط¥ظ„ظ‰ ط¹ظ…ظ„ طھط¬ط§ط±ظٹ ظ†ط§ط¬ط­. ظƒط«ظٹط± ظ…ظ† ط§ظ„ظ…ظ‚ط§ظ‡ظٹ طھظپط´ظ„ ظ„ظٹط³ ظ„ط£ظ† ظ‚ظ‡ظˆطھظ‡ظ… ط³ظٹط¦ط©طŒ ط¨ظ„ ظ„ط£ظ†ظ‡ظ… ظ„ط§ ظٹظپظ‡ظ…ظˆظ† <strong>ط§ظ„ط£ط±ظ‚ط§ظ…</strong>.</p>
<h3>ًں“ٹ ظ‡ظٹظƒظ„ ط§ظ„طھظƒط§ظ„ظٹظپ ظپظٹ ط§ظ„ظ…ظ‚ظ‡ظ‰</h3>
<table><tr><th>ظ†ظˆط¹ ط§ظ„طھظƒظ„ظپط©</th><th>ط§ظ„ظ†ط³ط¨ط© ط§ظ„طھظ‚ط±ظٹط¨ظٹط©</th><th>ط£ظ…ط«ظ„ط©</th></tr><tr><td>طھظƒظ„ظپط© ط§ظ„ظ…ط´ط±ظˆط¨ط§طھ (COGS)</td><td>25-35%</td><td>ط§ظ„ط¨ظ†طŒ ط§ظ„ط­ظ„ظٹط¨طŒ ط§ظ„ط´ظˆظƒظˆظ„ط§طھط©طŒ ط§ظ„ط¥ط¶ط§ظپط§طھ</td></tr><tr><td>ط§ظ„ط¥ظٹط¬ط§ط±</td><td>10-20%</td><td>ط§ظ„ط¥ظٹط¬ط§ط± ط§ظ„ط´ظ‡ط±ظٹ + ط§ظ„طµظٹط§ظ†ط©</td></tr><tr><td>ط§ظ„ط±ظˆط§طھط¨</td><td>25-35%</td><td>ط§ظ„ط¨ط§ط±ظٹط³طھط§طŒ ط§ظ„ظ…ط¯ظٹط±طŒ ط§ظ„ط¹ظ…ط§ظ„ط©</td></tr><tr><td>ط§ظ„ظ…طµط§ط±ظٹظپ ط§ظ„طھط´ط؛ظٹظ„ظٹط©</td><td>10-15%</td><td>ظƒظ‡ط±ط¨ط§ط،طŒ ظ…ط§ط،طŒ ط¥ظ†طھط±ظ†طھطŒ طھظ†ط¸ظٹظپ</td></tr><tr><td>ط§ظ„طھط³ظˆظٹظ‚</td><td>3-5%</td><td>ط¥ط¹ظ„ط§ظ†ط§طھطŒ ظˆط³ط§ط¦ظ„ طھظˆط§طµظ„</td></tr><tr><td>ط§ظ„ط¥ظ‡ظ„ط§ظƒ ظˆط§ظ„ط·ظˆط§ط±ط¦</td><td>5-10%</td><td>طµظٹط§ظ†ط© ط§ظ„ظ…ط¹ط¯ط§طھطŒ طھط¬ط¯ظٹط¯ط§طھ</td></tr></table>
<h3>ًں§® ط­ط³ط§ط¨ طھظƒظ„ظپط© ط§ظ„ظ…ط´ط±ظˆط¨ (Cost per Drink)</h3><p><strong>ظ…ط¹ط§ط¯ظ„ط© ط§ظ„طھظƒظ„ظپط©:</strong> ظˆط²ظ† ط§ظ„ط¨ظ† (ط¬ط±ط§ظ…) أ— ط³ط¹ط± ط§ظ„ظƒظٹظ„ظˆ أ· 1000 + ط§ظ„ط­ظ„ظٹط¨ + ط§ظ„ط¥ط¶ط§ظپط§طھ + ط§ظ„طھط؛ظ„ظٹظپ<br><br><strong>ظ…ط«ط§ظ„ (ظ„ط§طھظٹظ‡):</strong><br>â€¢ ط¨ظ†: 18 ط¬ط±ط§ظ… أ— 400 ط¬ظ†ظٹظ‡/ظƒط¬ظ… = 7.2 ط¬ظ†ظٹظ‡<br>â€¢ ط­ظ„ظٹط¨: 200 ظ…ظ„ أ— 30 ط¬ظ†ظٹظ‡/ظ„طھط± = 6 ط¬ظ†ظٹظ‡<br>â€¢ ظƒظˆط¨ + ط؛ط·ط§ط، = 1.5 ط¬ظ†ظٹظ‡<br>â€¢ ط¥ط¬ظ…ط§ظ„ظٹ = 14.7 ط¬ظ†ظٹظ‡ â†گ ط³ط¹ط± ط§ظ„ط¨ظٹط¹ = 60 ط¬ظ†ظٹظ‡ â†گ ظ‡ط§ظ…ط´ = 75% âœ…</p>
<h3>ًںژ¯ ظ…ط¤ط´ط±ط§طھ ط§ظ„ط£ط¯ط§ط، ط§ظ„ط±ط¦ظٹط³ظٹط© (KPIs)</h3><p>â€¢ <strong>ظ‡ط§ظ…ط´ ط§ظ„ط±ط¨ط­ ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ:</strong> ظٹط¬ط¨ ط£ظ† ظٹظƒظˆظ† 70-80% ظ„ظ„ظ…ط´ط±ظˆط¨ط§طھ<br>â€¢ <strong>ظ…طھظˆط³ط· ظ‚ظٹظ…ط© ط§ظ„ظپط§طھظˆط±ط©:</strong> ظƒظ… ظٹظ†ظپظ‚ ط§ظ„ط²ط¨ظˆظ† ظپظٹ ظƒظ„ ط²ظٹط§ط±ط©طں<br>â€¢ <strong>ظ…ط¹ط¯ظ„ ط¯ظˆط±ط§ظ† ط§ظ„ط·ط§ظˆظ„ط§طھ:</strong> ظƒظ… ط²ط¨ظˆظ† ظ„ظƒظ„ ط·ط§ظˆظ„ط© ظپظٹ ط§ظ„ظٹظˆظ…طں<br>â€¢ <strong>ظ†ظ‚ط·ط© ط§ظ„طھط¹ط§ط¯ظ„ (Break-even):</strong> ظƒظ… ظƒظˆط¨ ظ‚ظ‡ظˆط© ظٹط¬ط¨ ط£ظ† طھط¨ظٹط¹ ظ„طھط؛ط·ظٹ ط§ظ„طھظƒط§ظ„ظٹظپ ط§ظ„ط«ط§ط¨طھط©طں</p>
<div class="hl"><strong>ًں“ٹ ظ…ط«ط§ظ„ ظ„ط­ط³ط§ط¨ ظ†ظ‚ط·ط© ط§ظ„طھط¹ط§ط¯ظ„:</strong><br>ط§ظ„طھظƒط§ظ„ظٹظپ ط§ظ„ط«ط§ط¨طھط© ط§ظ„ط´ظ‡ط±ظٹط© (ط¥ظٹط¬ط§ط± + ط±ظˆط§طھط¨ + ظ…طµط§ط±ظٹظپ) = 50,000 ط¬ظ†ظٹظ‡<br>ظ‡ط§ظ…ط´ ط§ظ„ط±ط¨ط­ ظ„ظƒظ„ ظƒظˆط¨ = 45 ط¬ظ†ظٹظ‡ (ط³ط¹ط± 60 - طھظƒظ„ظپط© 15)<br>ظ†ظ‚ط·ط© ط§ظ„طھط¹ط§ط¯ظ„ = 50,000 أ· 45 = 1,112 ظƒظˆط¨ ط´ظ‡ط±ظٹط§ظ‹ â‰ˆ 37 ظƒظˆط¨ ظٹظˆظ…ظٹط§ظ‹</div>
<div class="err-box"><strong>â‌Œ ط®ط·ط£ ط´ط§ط¦ط¹:</strong> ظ†ط³ظٹط§ظ† ط§ظ„طھظƒط§ظ„ظٹظپ ط§ظ„ط®ظپظٹط© â€” ط£ظƒظˆط§ط¨ ظ…ط³ط±ط¨ط©طŒ ط£ط®ط·ط§ط، ظپظٹ ط§ظ„طھط­ط¶ظٹط±طŒ ط®طµظˆظ…ط§طھطŒ ظ‚ظ‡ظˆط© ظ…ط¬ط§ظ†ظٹط© ظ„ظ„ظ…ظˆط¸ظپظٹظ†. ط£ط¶ظپ 5-10% "ظ‡ط¯ط±" ط¥ظ„ظ‰ ط­ط³ط§ط¨ط§طھظƒ.</div>`, en:`<h3>ًں’° Cost & Profit â€” Financial Management for Cafes</h3><p>Understanding costs is what turns coffee passion into a successful business. Many cafes fail not because their coffee is bad, but because they don't understand the <strong>numbers</strong>.</p>
<h3>ًں“ٹ Cafe Cost Structure</h3>
<table><tr><th>Cost Type</th><th>Approx %</th><th>Examples</th></tr><tr><td>COGS (Beverage Cost)</td><td>25-35%</td><td>Coffee, milk, chocolate, syrups</td></tr><tr><td>Rent</td><td>10-20%</td><td>Monthly rent + maintenance</td></tr><tr><td>Labor</td><td>25-35%</td><td>Baristas, manager, staff</td></tr><tr><td>Operating Expenses</td><td>10-15%</td><td>Electricity, water, internet, cleaning</td></tr><tr><td>Marketing</td><td>3-5%</td><td>Ads, social media</td></tr><tr><td>Depreciation &amp; Contingency</td><td>5-10%</td><td>Equipment maintenance, renovations</td></tr></table>
<h3>ًں§® Cost Per Drink Calculation</h3><p><strong>Formula:</strong> Coffee weight (g) أ— price per kg أ· 1000 + milk + add-ons + packaging<br><br><strong>Example (Latte):</strong><br>â€¢ Coffee: 18g أ— 400 EGP/kg = 7.2 EGP<br>â€¢ Milk: 200ml أ— 30 EGP/L = 6 EGP<br>â€¢ Cup + lid = 1.5 EGP<br>â€¢ Total = 14.7 EGP â†گ Selling price = 60 EGP â†گ Margin = 75% âœ…</p>
<h3>ًںژ¯ Key KPIs</h3><p>â€¢ <strong>Gross Profit Margin:</strong> 70-80% for drinks<br>â€¢ <strong>Average Ticket:</strong> How much per visit?<br>â€¢ <strong>Table Turnover:</strong> How many customers per table daily?<br>â€¢ <strong>Break-even Point:</strong> How many cups to cover fixed costs?</p>
<div class="hl"><strong>ًں“ٹ Break-even Example:</strong><br>Monthly fixed costs (rent + labor + expenses) = $15,000<br>Profit per cup = $1.50 (price $2 - cost $0.50)<br>Break-even = 15,000 أ· 1.50 = 10,000 cups/month â‰ˆ 333 cups/day</div>
<div class="err-box"><strong>â‌Œ Common Mistake:</strong> Forgetting hidden costs â€” spilled cups, remakes, discounts, free staff drinks. Add 5-10% "waste" to your calculations.</div>`};

L['C3-2'] = {ar:`<h3>ًں¤‌ ط®ط¯ظ…ط© ط§ظ„ط¹ظ…ظ„ط§ط، ط§ظ„ظ…طھظ…ظٹط²ط© â€” ظ‚ظ„ط¨ ط§ظ„ظ…ظ‚ظ‡ظ‰ ط§ظ„ظ†ط§ط¬ط­</h3><p>ط§ظ„ط²ط¨ظˆظ† ظ„ط§ ظٹط´طھط±ظٹ ظ‚ظ‡ظˆط© ظپظ‚ط· â€” ظٹط´طھط±ظٹ <strong>طھط¬ط±ط¨ط©</strong>. ظپظٹ ط³ظˆظ‚ طھظ†ط§ظپط³ظٹطŒ ط®ط¯ظ…ط© ط§ظ„ط¹ظ…ظ„ط§ط، ط§ظ„ظ…طھظ…ظٹط²ط© ظ‡ظٹ ظ…ط§ ظٹط¬ط¹ظ„ظƒ ظ…ط®طھظ„ظپط§ظ‹. ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط¬ظٹط¯ط© طھط¬ط°ط¨ ط§ظ„ط²ط¨ظˆظ†طŒ ط§ظ„ط®ط¯ظ…ط© ط§ظ„ظ…ظ…طھط§ط²ط© طھط¹ظٹط¯ظ‡.</p>
<h3>ًں“‹ ظ…ط¹ط§ظٹظٹط± ط§ظ„ط®ط¯ظ…ط© ط§ظ„ط°ظ‡ط¨ظٹط©</h3>
<table><tr><th>ط§ظ„ظ…ط¹ظٹط§ط±</th><th>ط§ظ„طھظپط§طµظٹظ„</th></tr><tr><td>ط§ظ„ط§ط³طھظ‚ط¨ط§ظ„</td><td>ط§ط¨طھط³ظ…طŒ ط±ط­ط¨ ط¨ط§ظ„ط²ط¨ظˆظ† ط®ظ„ط§ظ„ 30 ط«ط§ظ†ظٹط© ظ…ظ† ط¯ط®ظˆظ„ظ‡طŒ ط­طھظ‰ ظ„ظˆ ظƒظ†طھ ظ…ط´ط؛ظˆظ„ط§ظ‹</td></tr><tr><td>ط·ظ„ط¨ ط§ظ„ظ‚ظ‡ظˆط©</td><td>ط§ط³ط£ظ„ ط¹ظ† ط§ظ„طھظپط¶ظٹظ„ط§طھ: ظ†ظˆط¹ ط§ظ„ط­ظ„ظٹط¨طں ط­ط±ط§ط±ط©طں ط³ظƒط±طں</td></tr><tr><td>ط§ظ„طھظ‚ط¯ظٹظ…</td><td>ظ‚ط¯ظ… ط§ظ„ظ‚ظ‡ظˆط© ط¨ظٹط¯ظٹظƒطŒ ط§ط°ظƒط± ط§ط³ظ… ط§ظ„ظ…ط´ط±ظˆط¨طŒ ط§ط¨طھط³ظ…</td></tr><tr><td>ط§ظ„ظ…طھط§ط¨ط¹ط©</td><td>ط¨ط¹ط¯ 2-3 ط¯ظ‚ط§ط¦ظ‚طŒ ط§ط³ط£ظ„: "ظƒظٹظپ ط§ظ„ظ‚ظ‡ظˆط©طں ظ‡ظ„ طھط­طھط§ط¬ ط´ظٹط¦ط§ظ‹طں"</td></tr><tr><td>ط§ظ„ظˆط¯ط§ط¹</td><td>ط´ظƒط±ط§ظ‹ ط¨ط§ظ„ط§ط³ظ… (ط¥ط°ط§ ظƒظ†طھ طھط¹ط±ظپظ‡)طŒ ط§ط¨طھط³ط§ظ…ط©طŒ ط§ط¯ط¹ظˆظ‡ ظ„ظ„ط¹ظˆط¯ط©</td></tr></table>
<h3>ًں’¬ ط§ظ„طھط¹ط§ظ…ظ„ ظ…ط¹ ط§ظ„ط´ظƒط§ظˆظ‰ â€” طھط­ظˆظٹظ„ ط§ظ„ط³ظ„ط¨ظٹ ط¥ظ„ظ‰ ط¥ظٹط¬ط§ط¨ظٹ</h3><p>ط§ظ„ط²ط¨ظˆظ† ط§ظ„ط°ظٹ ظٹط´طھظƒظٹ  ظˆظٹط±طھط§ط­  ظٹط¹ظˆط¯ ظ…ط±ط© ط£ط®ط±ظ‰. ط§ظ„ط²ط¨ظˆظ† ط§ظ„ط°ظٹ ظٹط´طھظƒظٹ ظˆظ„ط§ ظٹط±طھط§ط­  ظٹط®ط¨ط± 10 ط£ط´ط®ط§طµ.<br><strong>ط¨ط±ظˆطھظˆظƒظˆظ„ ط§ظ„طھط¹ط§ظ…ظ„ ظ…ط¹ ط§ظ„ط´ظƒظˆظ‰:</strong></p><ol><li><strong>ط§ط³طھظ…ط¹</strong> ط¨ط§ظ†طھط¨ط§ظ‡ ظƒط§ظ…ظ„ â€” ظ„ط§ طھظ‚ط§ط·ط¹</li><li><strong>ط§ط¹طھط°ط±</strong> ط¨طµط¯ظ‚ â€” ظ„ظٹط³ ط¨ط§ظ„ط¶ط±ظˆط±ط© ط£ظ† طھظƒظˆظ† ظ…ط®ط·ط¦ط§ظ‹طŒ ظ„ظƒظ†ظƒ ط¢ط³ظپ ظ„طھط¬ط±ط¨طھظ‡ ط§ظ„ط³ظٹط¦ط©</li><li><strong>ط­ظ„ظ‘</strong> ط¨ط³ط±ط¹ط© â€” ط£ط¹ط¯ طھط­ط¶ظٹط± ط§ظ„ظ…ط´ط±ظˆط¨ ظپظˆط±ط§ظ‹طŒ ظ„ط§ طھط¬ط¹ظ„ ط§ظ„ط²ط¨ظˆظ† ظٹظ†طھط¸ط±</li><li><strong>ط¹ظˆظ‘ط¶</strong> â€” ظ…ط´ط±ظˆط¨ ظ…ط¬ط§ظ†ظٹ ظپظٹ ط§ظ„ط²ظٹط§ط±ط© ط§ظ„ظ‚ط§ط¯ظ…ط© ط£ظˆ ط®طµظ…</li><li><strong>ط³ط¬ظ‘ظ„</strong> ط§ظ„ط´ظƒظˆظ‰ ظˆط­ظ„ظ‘ظ‡ط§ ظ„طھط­ط³ظٹظ† ط§ظ„ط¹ظ…ظ„ ظ…ط³طھظ‚ط¨ظ„ط§ظ‹</li></ol>
<div class="hl"><strong>ًں“ٹ ط¥ط­طµط§ط¦ظٹط©:</strong> 70% ظ…ظ† ط§ظ„ط²ط¨ط§ط¦ظ† ط§ظ„ط°ظٹظ† ظٹظ‚ط¯ظ…ظˆظ† ط´ظƒظˆظ‰ ظˆظٹط¹ط§ظ„ط¬ظˆظ† ط¨ط´ظƒظ„ ط¬ظٹط¯ ظٹط¹ظˆط¯ظˆظ† ظ„ظ„ط´ط±ط§ط،. ط¥ط°ط§ طھظ… ط­ظ„ظ‡ط§ ط¨ط³ط±ط¹ط©طŒ طھط±طھظپط¹ ط§ظ„ظ†ط³ط¨ط© ط¥ظ„ظ‰ 95%.</div>
<h3>ًںژ¯ ط¨ط±ظ†ط§ظ…ط¬ ط§ظ„ظˆظ„ط§ط، â€” ظ„ظ…ط§ط°ط§ ظٹط¹ظˆط¯ ط§ظ„ط²ط¨ظˆظ†طں</h3><p><strong>ط¨ط·ط§ظ‚ط© ط§ظ„ظˆظ„ط§ط،:</strong> ط§ط´طھط± 10 ظ‚ظ‡ظˆط§طھ ظˆط§ط­طµظ„ ط¹ظ„ظ‰ 11 ظ…ط¬ط§ظ†ط§ظ‹ â€” ط¨ط³ظٹط·ط© ظ„ظƒظ†ظ‡ط§ ظپط¹ظ‘ط§ظ„ط©.<br><strong>ط§ظ„ط²ط¨ظˆظ† ط§ظ„ط¯ط§ط¦ظ…:</strong> طھط°ظƒط± ط§ط³ظ…ظ‡طŒ ظ…ط´ط±ظˆط¨ظ‡ ط§ظ„ظ…ظپط¶ظ„طŒ ظˆط§ط³طھظپط³ط± ط¹ظ† ط¹ط§ط¦ظ„طھظ‡/ط¹ظ…ظ„ظ‡.<br><strong>ط§ظ„ظ…ظپط§ط¬ط¢طھ ط§ظ„ط³ط§ط±ط©:</strong> ظ…ط±ط© ظƒظ„ ط£ط³ط¨ظˆط¹طŒ ظ‚ط¯ظ… ظ„ط²ط¨ظˆظ† ط¯ط§ط¦ظ… ظ…ط´ط±ظˆط¨ط§ظ‹ ظ…ط¬ط§ظ†ط§ظ‹ "ط¨ظ…ظ†ط§ط³ط¨ط© ط§ظ„ظٹظˆظ…" â€” ط³ظٹظ†ط´ط± ط§ظ„ط®ط¨ط± ظ„ط£طµط¯ظ‚ط§ط¦ظ‡.</p>
<div class="err-box"><strong>â‌Œ ط®ط·ط£ ط´ط§ط¦ط¹:</strong> طھط¬ط§ظ‡ظ„ ط§ظ„ط²ط¨ظˆظ† ط£ط«ظ†ط§ط، طھطµظپط­ ط§ظ„ط¬ظˆط§ظ„ ط£ظˆ ط§ظ„طھط­ط¶ظٹط±. ط§ظ„ط²ط¨ظˆظ† ظٹط±ظٹط¯ ط£ظ† ظٹط´ط¹ط± ط£ظ†ظ‡ ظ…ظ‡ظ…. ط§ظ†ط¸ط± ظپظٹ ط¹ظٹظ†ظٹظ‡طŒ ط§ط¨طھط³ظ…طŒ ظˆطھظپط§ط¹ظ„.</div>`, en:`<h3>ًں¤‌ Premium Customer Service â€” Heart of a Successful Cafe</h3><p>Customers don't just buy coffee â€” they buy an <strong>experience</strong>. In a competitive market, exceptional customer service is what sets you apart. Good coffee attracts customers, great service brings them back.</p>
<h3>ًں“‹ Golden Service Standards</h3>
<table><tr><th>Standard</th><th>Details</th></tr><tr><td>Greeting</td><td>Smile, welcome within 30 seconds of entry, even if busy</td></tr><tr><td>Order Taking</td><td>Ask preferences: milk type? Temperature? Sugar?</td></tr><tr><td>Serving</td><td>Present with both hands, name the drink, smile</td></tr><tr><td>Follow-up</td><td>After 2-3 minutes, ask: "How's your coffee? Need anything?"</td></tr><tr><td>Farewell</td><td>Thank by name (if regular), smile, invite to return</td></tr></table>
<h3>ًں’¬ Handling Complaints â€” Turning Negative into Positive</h3><p>A customer who complains and is satisfied returns. One who complains and is unsatisfied tells 10 people.<br><strong>Complaint Protocol:</strong></p><ol><li><strong>Listen</strong> fully â€” don't interrupt</li><li><strong>Apologize</strong> sincerely â€” not admitting fault, but sorry for their experience</li><li><strong>Solve</strong> quickly â€” remake immediately, don't make them wait</li><li><strong>Compensate</strong> â€” free drink next visit or discount</li><li><strong>Log</strong> the complaint and solution to improve</li></ol>
<div class="hl"><strong>ًں“ٹ Stat:</strong> 70% of complaining customers who are satisfied return. If resolved quickly, the rate rises to 95%.</div>
<h3>ًںژ¯ Loyalty Programs â€” Why Customers Return</h3><p><strong>Punch Card:</strong> Buy 10, get 1 free â€” simple but effective.<br><strong>Regulars:</strong> Remember their name, favorite drink, ask about family/work.<br><strong>Surprise &amp; Delight:</strong> Once a week, offer a regular a free drink "just because" â€” they'll tell their friends.</p>
<div class="err-box"><strong>â‌Œ Common Mistake:</strong> Ignoring customers while scrolling your phone or prepping. Customers want to feel important. Make eye contact, smile, engage.</div>`};

L['C3-3'] = {ar:`<h3>ًں‘¥ طھط·ظˆظٹط± ظپط±ظٹظ‚ ط§ظ„ط¹ظ…ظ„ â€” ظ…ظ† ط§ظ„ط¨ط§ط±ظٹط³طھط§ ط¥ظ„ظ‰ ط§ظ„ظ‚ط§ط¦ط¯</h3>
<p>ظپط±ظٹظ‚ ط§ظ„ط¹ظ…ظ„ ظ‡ظˆ <strong>ط£ظ‡ظ… ط£طµظˆظ„ ط§ظ„ظ…ظ‚ظ‡ظ‰</strong>. ط§ظ„ظ…ط¹ط¯ط§طھ ط§ظ„ط¬ظٹط¯ط© ظˆط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ظ…طھط§ط²ط© ظ„ط§ طھط³ط§ظˆظٹ ط´ظٹط¦ط§ظ‹ ط¨ط¯ظˆظ† ظپط±ظٹظ‚ ظ…ط¯ط±ط¨ ظˆظ…طھط­ظ…ط³. ط§ظ„ط¨ط§ط±ظٹط³طھط§ ظ„ظٹط³ ظ…ط¬ط±ط¯ ظ…ظˆط¸ظپ â€” ط¥ظ†ظ‡ <strong>ط³ظپظٹط± ط§ظ„ظ…ظ‚ظ‡ظ‰</strong> ظˆط£ظˆظ„ ظ…ظ† ظٹطھظپط§ط¹ظ„ ظ…ط¹ ط§ظ„ط²ط¨ظˆظ†.</p>
<h3>ًں“‹ ظ†ط¸ط§ظ… ط§ظ„طھط¯ط±ظٹط¨ ط§ظ„ط´ط§ظ…ظ„ â€” 4 ظ…ط³طھظˆظٹط§طھ</h3>
<table><tr><th>ط§ظ„ظ…ط³طھظˆظ‰</th><th>ط§ظ„ظ…ط¯ط©</th><th>ط§ظ„ظ…ظ‡ط§ط±ط§طھ</th></tr>
<tr><td><strong>Level 1 â€” ط£ط³ط§ط³ظٹ</strong></td><td>ط§ظ„ط£ط³ط¨ظˆط¹ ط§ظ„ط£ظˆظ„</td><td>ظ†ط¸ط§ظپط© ظ…ط­ط·ط© ط§ظ„ط¹ظ…ظ„طŒ ط·ط­ظ† ظˆطھط§ظ…ط¨ظ†ط¬طŒ طھط³ط®ظٹظ† ط§ظ„ط­ظ„ظٹط¨طŒ طھط­ط¶ظٹط± ظ…ط´ط±ظˆط¨ط§طھ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ط§ظ„ط£ط³ط§ط³ظٹط© (ط¥ط³ط¨ط±ظٹط³ظˆطŒ ظ„ط§طھظٹظ‡طŒ ظƒط§ط¨طھط´ظٹظ†ظˆ)</td></tr>
<tr><td><strong>Level 2 â€” ظ…طھظˆط³ط·</strong></td><td>2-4 ط£ط³ط§ط¨ظٹط¹</td><td>Latte Art (ظ‚ظ„ط¨طŒ ط±ظˆط²ظٹطھط§)طŒ ط¶ط¨ط· ط§ظ„ط·ط­ظ† (Dial-in)طŒ ظ‚ط±ط§ط،ط© ظ…ظ†ط­ظ†ظٹط§طھ ط§ظ„طھط­ظ…ظٹطµطŒ ط®ط¯ظ…ط© ط§ظ„ط¹ظ…ظ„ط§ط، ط§ظ„ظ…طھظ…ظٹط²ط©</td></tr>
<tr><td><strong>Level 3 â€” ظ…طھظ‚ط¯ظ…</strong></td><td>1-3 ط£ط´ظ‡ط±</td><td>ظƒط§ط¨ظٹظ†ط¬ ظˆطھظ‚ظٹظٹظ… ط­ط³ظٹطŒ طھط­ط¶ظٹط± ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ظ‚ط·ط±ط© (V60, Chemex, AeroPress)طŒ ظ…ط¹ط±ظپط© ط£طµظˆظ„ ط§ظ„ط¨ظ† ظˆظ…ظ†ط§ط·ظ‚ ط§ظ„ط¥ظ†طھط§ط¬</td></tr>
<tr><td><strong>Level 4 â€” ط®ط¨ظٹط±</strong></td><td>3-6 ط£ط´ظ‡ط±</td><td>ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط®ط²ظˆظ†طŒ ط§ظ„طھط¯ط±ظٹط¨ ط§ظ„ط¯ط§ط®ظ„ظٹ (Train the Trainer)طŒ طھط·ظˆظٹط± ظˆطµظپط§طھ ط§ظ„ظ…ط´ط±ظˆط¨ط§طھ ط§ظ„ظ…ظˆط³ظ…ظٹط©طŒ ط§ظ„ظ…ط´ط§ط±ظƒط© ظپظٹ ظ…ط³ط§ط¨ظ‚ط§طھ ط¨ط§ط±ظٹط³طھط§</td></tr></table>
<h3>ًں“… ط§ظ„ط¬ط¯ظˆظ„ ط§ظ„ط£ط³ط¨ظˆط¹ظٹ ط§ظ„ظ…ط«ط§ظ„ظٹ</h3>
<p><strong>ط§ظ„ط§ط«ظ†ظٹظ†:</strong> ظƒط§ط¨ظٹظ†ط¬ ط£ط³ط¨ظˆط¹ظٹ â€” طھط°ظˆظ‚ 3-5 ط£ظ†ظˆط§ط¹ ط¨ظ† ظ…ط¹ ط§ظ„ظپط±ظٹظ‚. ظ†ط§ظ‚ط´ ط§ظ„ظ†ظƒظ‡ط§طھطŒ ط§ظ„ظ…طµط§ط¯ط±طŒ ط¯ط±ط¬ط§طھ ط§ظ„طھط­ظ…ظٹطµ. ط³ط¬ظ„ ظ…ظ„ط§ط­ط¸ط§طھظƒظ….<br><strong>ط§ظ„ط£ط±ط¨ط¹ط§ط،:</strong> طھط¯ط±ظٹط¨ طھظ‚ظ†ظٹ â€” ط±ظƒط² ط¹ظ„ظ‰ ظ…ظ‡ط§ط±ط© ظ…ط­ط¯ط¯ط© (ظ…ط«ظ„ط§ظ‹: طھط­ط³ظٹظ† ط§ظ„ظ€ Latte Art ط£ظˆ ط¶ط¨ط· ط§ظ„ط·ط­ظ†).<br><strong>ط§ظ„ط¬ظ…ط¹ط©:</strong> ط§ط®طھط¨ط§ط± â€” ط§ط®طھط¨ط§ط± ظ†ط¸ط±ظٹ (10 ط£ط³ط¦ظ„ط©) ظˆط¹ظ…ظ„ظٹ (طھط­ط¶ظٹط± ظ…ط´ط±ظˆط¨ظٹظ†). ط³ط¬ظ„ ط§ظ„ظ†طھط§ط¦ط¬ ظˆطھطھط¨ط¹ ط§ظ„طھط­ط³ظ†.<br><strong>ظٹظˆظ…ظٹط§ظ‹:</strong> 5 ط¯ظ‚ط§ط¦ظ‚ ظ‚ط¨ظ„ ط§ظ„ط§ظپطھطھط§ط­ â€” طھط°ظˆظ‚ ط³ط±ظٹط¹ ظ„ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ظ„ظ„طھط£ظƒط¯ ظ…ظ† ط§ظ„ط¬ظˆط¯ط©.</p>
<h3>ًںژ¯ ط¨ظ†ط§ط، ط«ظ‚ط§ظپط© ط§ظ„ظپط±ظٹظ‚</h3>
<p>â€¢ <strong>ط§ظ„طھظ‚ط¯ظٹط±:</strong> ظƒظ„ظ…ط© ط´ظƒط± ط¹ظ„ظ†ظٹط© ط¹ظ†ط¯ظ…ط§ ظٹظ‚ط¯ظ… ط£ط­ط¯ظ‡ظ… ط®ط¯ظ…ط© ظ…ظ…طھط§ط²ط© â€” ظپط¹ط§ظ„ط© ط£ظƒط«ط± ظ…ظ† ط§ظ„ظ…ظƒط§ظپط¢طھ ط§ظ„ظ…ط§ط¯ظٹط©<br>â€¢ <strong>ط§ظ„ط´ظپط§ظپظٹط©:</strong> ط´ط§ط±ظƒ ط§ظ„ظپط±ظٹظ‚ ط£ط±ظ‚ط§ظ… ط§ظ„ظ…ط¨ظٹط¹ط§طھ ظˆط§ظ„طھظƒط§ظ„ظٹظپ â€” ط¹ظ†ط¯ظ…ط§ ظٹظپظ‡ظ… ط§ظ„ظ…ظˆط¸ظپ "ظ„ظ…ط§ط°ط§"طŒ ظٹطµط¨ط­ ط¬ط²ط،ط§ظ‹ ظ…ظ† ط§ظ„ط­ظ„<br>â€¢ <strong>ط§ظ„طھط·ظˆظٹط±:</strong> ظƒظ„ ظ…ظˆط¸ظپ ظٹط³طھط­ظ‚ ط®ط·ط© طھط·ظˆظٹط± ط´ط®طµظٹط©. ط§ط³ط£ظ„ظ‡: "ط£ظٹظ† طھط±ظٹط¯ ط£ظ† طھظƒظˆظ† ط¨ط¹ط¯ 6 ط£ط´ظ‡ط±طں"<br>â€¢ <strong>ط§ظ„ط§ط­طھظپط§ظ„:</strong> ط­ظپظ„ط© طµط؛ظٹط±ط© ط¹ظ†ط¯ طھط­ظ‚ظٹظ‚ ظ‡ط¯ظپ ظ…ط¹ظٹظ† (ط£ظˆظ„ 1000 ظƒظˆط¨ ظپظٹ ط§ظ„ط´ظ‡ط±طŒ ط£ظپط¶ظ„ طھظ‚ظٹظٹظ… ظ…ظ† ط§ظ„ط²ط¨ط§ط¦ظ†)</p>
<div class="err-box"><strong>â‌Œ ط®ط·ط£ ط´ط§ط¦ط¹:</strong> ط§ظپطھط±ط§ط¶ ط£ظ† ط§ظ„ط¨ط§ط±ظٹط³طھط§ ط§ظ„ط¬ظٹط¯ = ظ…ظˆط¸ظپ ط¬ظٹط¯. ط§ظ„ط­ظ‚ظٹظ‚ط©: ظ…ظ‡ط§ط±ط§طھ ط§ظ„ظ‚ظ‡ظˆط© ظٹظ…ظƒظ† طھط¹ظ„ظٹظ…ظ‡ط§. ط§ظ„ظ…ظˆظ‚ظپ (Attitude) ظ„ط§ ظٹظ…ظƒظ†. ظˆط¸ظگظ‘ظپ ط¹ظ„ظ‰ ط§ظ„ظ…ظˆظ‚ظپطŒ ط¯ط±ظ‘ط¨ ط¹ظ„ظ‰ ط§ظ„ظ…ظ‡ط§ط±ط§طھ.</div>
<div class="ok-box"><strong>ًں’، ظ‚ط§ط¹ط¯ط© 70-20-10:</strong> 70% ظ…ظ† ط§ظ„طھط¹ظ„ظ… = ط§ظ„ط¹ظ…ظ„ ط§ظ„ظپط¹ظ„ظٹ (On-the-job). 20% = ط§ظ„طھط¹ظ„ظ… ظ…ظ† ط§ظ„ط¢ط®ط±ظٹظ† (ط²ظ…ظ„ط§ط،طŒ ظ…ط±ط´ط¯ظٹظ†). 10% = ط§ظ„طھط¹ظ„ظ… ط§ظ„ط±ط³ظ…ظٹ (ط¯ظˆط±ط§طھطŒ ظƒطھط¨). طµظ…ظ… ط¨ط±ظ†ط§ظ…ط¬ظƒ ط§ظ„طھط¯ط±ظٹط¨ظٹ ط¨ظ†ط§ط،ظ‹ ط¹ظ„ظ‰ ظ‡ط°ظ‡ ط§ظ„ظ†ط³ط¨.</div>
<div class="quiz-box"><strong>ًں’¬ طھط­ط¯ظ‘:</strong> طµظ…ظ… ط®ط·ط© طھط¯ط±ظٹط¨ ظ„ظ…ظˆط¸ظپ ط¬ط¯ظٹط¯ ظ„ظ…ط¯ط© ط´ظ‡ط± ظˆط§ط­ط¯. ط­ط¯ط¯: ظƒظ„ ط£ط³ط¨ظˆط¹ ظ…ط§ط°ط§ ط³ظٹطھط¹ظ„ظ…طŒ ظƒظٹظپ ط³طھظ‚ظٹط³ طھظ‚ط¯ظ…ظ‡طŒ ظˆظ…طھظ‰ ط³ظٹط¹ظ…ظ„ ط¨ظ…ظپط±ط¯ظ‡.</div>`, en:`<h3>ًں‘¥ Team Development â€” From Barista to Leader</h3>
<p>The team is the <strong>cafe's most valuable asset</strong>. Great equipment and excellent coffee are worthless without a trained, motivated team. A barista is not just an employee â€” they are the <strong>cafe's ambassador</strong> and the first point of contact with customers.</p>
<h3>ًں“‹ Comprehensive Training System â€” 4 Levels</h3>
<table><tr><th>Level</th><th>Duration</th><th>Skills</th></tr>
<tr><td><strong>Level 1 â€” Basic</strong></td><td>Week 1</td><td>Workstation hygiene, grinding &amp; tamping, milk steaming, basic espresso drinks (espresso, latte, cappuccino)</td></tr>
<tr><td><strong>Level 2 â€” Intermediate</strong></td><td>2-4 weeks</td><td>Latte Art (heart, rosetta), Dial-in, reading roast curves, premium customer service</td></tr>
<tr><td><strong>Level 3 â€” Advanced</strong></td><td>1-3 months</td><td>Cupping &amp; sensory evaluation, pour-over (V60, Chemex, AeroPress), coffee origins knowledge</td></tr>
<tr><td><strong>Level 4 â€” Expert</strong></td><td>3-6 months</td><td>Inventory management, Train the Trainer, seasonal drink recipes, barista competition participation</td></tr></table>
<h3>ًں“… Ideal Weekly Schedule</h3>
<p><strong>Monday:</strong> Weekly cupping â€” taste 3-5 coffees as a team. Discuss flavors, origins, roast levels. Log your notes.<br><strong>Wednesday:</strong> Technical training â€” focus on one specific skill (improving Latte Art or dial-in).<br><strong>Friday:</strong> Assessment â€” theory test (10 questions) + practical (prepare 2 drinks). Record scores and track improvement.<br><strong>Daily:</strong> 5 minutes before opening â€” quick espresso taste test to ensure quality.</p>
<h3>ًںژ¯ Building Team Culture</h3>
<p>â€¢ <strong>Recognition:</strong> A public "thank you" when someone provides excellent service â€” more effective than monetary rewards<br>â€¢ <strong>Transparency:</strong> Share sales numbers and costs with the team â€” when an employee understands "why," they become part of the solution<br>â€¢ <strong>Development:</strong> Every employee deserves a personal development plan. Ask them: "Where do you want to be in 6 months?"<br>â€¢ <strong>Celebration:</strong> A small party when hitting a target (first 1000 cups in a month, best customer rating)</p>
<div class="err-box"><strong>â‌Œ Common Mistake:</strong> Assuming a good barista = good employee. Truth: coffee skills can be taught. Attitude cannot. Hire for attitude, train for skills.</div>
<div class="ok-box"><strong>ًں’، 70-20-10 Rule:</strong> 70% of learning = on-the-job. 20% = learning from others (peers, mentors). 10% = formal education (courses, books). Design your training program based on these ratios.</div>
<div class="quiz-box"><strong>ًں’¬ Challenge:</strong> Design a one-month training plan for a new employee. Define: what they'll learn each week, how you'll measure progress, and when they'll work independently.</div>`};

L['A1-4'] = {ar:`<h3>ًں•Œ ط§ظ„ظ‚ظ‡ظˆط© ظپظٹ ط§ظ„ط«ظ‚ط§ظپط© ظˆط§ظ„ط¯ظٹظ† â€” ظ…ظ† ط§ظ„ط­ظ„ط§ظ„ ط¥ظ„ظ‰ ط§ظ„ط­ط±ط§ظ…</h3><p>ظ„ط¹ط¨ ط§ظ„ط¯ظٹظ† ظˆط§ظ„ط«ظ‚ط§ظپط© ط¯ظˆط±ط§ظ‹ <strong>ظ…ط­ظˆط±ظٹط§ظ‹ ظپظٹ طھط§ط±ظٹط® ط§ظ„ظ‚ظ‡ظˆط©</strong>. ظپظٹ ظ…ظƒط© 1511طŒ ط­ط§ظˆظ„ ط­ط§ظƒظ… ظ…ظƒط© ظ…ظ†ط¹ ط§ظ„ظ‚ظ‡ظˆط© â€” ظ„ظƒظ† ط§ظ„ط£ط·ط¨ط§ط، ظˆط§ظ„ط¹ظ„ظ…ط§ط، ط£ط«ط¨طھظˆط§ ط£ظ†ظ‡ط§ ظ„ظٹط³طھ ظ…ط³ظƒط±ط©طŒ ط¨ظ„ ظ…ظ†ط¨ظ‡ط©. ط§ظ†طھطµط±طھ ط§ظ„ظ‚ظ‡ظˆط©. ظپظٹ ط§ظ„ظƒظ†ظٹط³ط© ط§ظ„ظƒط§ط«ظˆظ„ظٹظƒظٹط©طŒ ط£ط·ظ„ظ‚ ط¹ظ„ظٹظ‡ط§ ط§ظ„ط¨ط§ط¨ط§ ظƒظ„ظٹظ…ظ†طھ ط§ظ„ط«ط§ظ…ظ† ط¹ط§ظ… 1600 ط§ط³ظ… "ظ…ط´ط±ظˆط¨ ط§ظ„ط´ظٹط·ط§ظ†" ظ‚ط¨ظ„ ط£ظ† ظٹط¨ط§ط±ظƒظ‡ط§ ط´ط®طµظٹط§ظ‹ ط¨ط¹ط¯ طھط°ظˆظ‚ظ‡ط§. ظپظٹ ط§ظ„ظ…ظ‚ط§ظ‡ظٹ ط§ظ„ط£ظˆط±ظˆط¨ظٹط©طŒ ط³ظ…ظٹطھ "Penny Universities" ظ„ط£ظ† ط¨ظ†ط³ط§ظ‹ ظˆط§ط­ط¯ط§ظ‹ ظٹط´طھط±ظٹ ظ„ظƒ ظپظ†ط¬ط§ظ†ط§ظ‹ ظˆظ…ط­ط§ط¯ط«ط© ظ…ط¹ ط£ط¹ط¸ظ… ط¹ظ‚ظˆظ„ ط§ظ„ط¹طµط±.</p><div class="hl"><strong>ًں“ٹ ط§ظ„طھط³ط§ظ…ط­ ط§ظ„ط¯ظٹظ†ظٹ ظ…ط¹ ط§ظ„ظ‚ظ‡ظˆط©:</strong> ر…ر€ذ¸رپر‚ذ¸ذ°ذ½رپر‚ذ²ذ¾ â†گ ط§ظ„ظƒظ†ظٹط³ط© ط§ظ„ط¨ط±ظˆطھط³طھط§ظ†طھظٹط© ط§ط¹طھط¨ط±طھظ‡ط§ "ظ…ط´ط±ظˆط¨ ط§ظ„ظٹظ‚ط¸ط©" ط§ظ„ط°ظٹ ظٹط¹ظٹظ† ط¹ظ„ظ‰ ط§ظ„ط¹ظ…ظ„ ظˆط§ظ„ط¹ط¨ط§ط¯ط©. ط§ظ„ظٹظ‡ظˆط¯ظٹط© â†گ ط­ط§ط®ط§ظ…ط§طھ ط§ظ„ظٹظ…ظ† ط§ط¹طھط¨ط±ظˆظ‡ط§ "ط·ط¹ط§ظ…ط§ظ‹ ظ„ظ„ط±ظˆط­". ط§ظ„ط¥ط³ظ„ط§ظ… â†گ ط£ط¬ظ…ط¹ ط§ظ„ظپظ‚ظ‡ط§ط، ط¹ظ„ظ‰ ط­ظ„ط§ظ„ظٹطھظ‡ط§ ط¨ط¹ط¯ ط¬ط¯ط§ظ„ ط¯ط§ظ… 200 ط¹ط§ظ….</div><div class="img-c"><img src="${photo('mecca_cafe')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًں•Œ ط£ظˆظ„ ظ…ظ‚ظ‡ظ‰ ظپظٹ ظ…ظƒط© 1511 â€” ط­ظٹط« ط¨ط¯ط£طھ ط«ظ‚ط§ظپط© ط§ظ„ظ…ظ‚ط§ظ‡ظٹ</div></div><div class="quiz-box"><strong>ًں’¬ طھط­ط¯ظ‘:</strong> ظ‡ظ„ طھط¹طھظ‚ط¯ ط£ظ† ظ„ظ„ظ‚ظ‡ظˆط© ط¹ظ„ط§ظ‚ط© ط¨ظ†ظ‡ط¶ط© ط£ظˆط±ظˆط¨ط§طں ط§ظ„ظ…ط¤ط±ط®ظˆظ† ظٹظ‚ظˆظ„ظˆظ†: ط§ظ„ظ…ظ‚ط§ظ‡ظٹ ط­ظ„طھ ظ…ط­ظ„ ط§ظ„ط­ط§ظ†ط§طھ â€” ظˆط¹ظٹ طµط§ظپظچ ط¨ط¯ظ„ط§ظ‹ ظ…ظ† ط§ظ„ط³ظƒط±. ظپطھط­طھ ط¨ط§ط¨ ط§ظ„ظ†ظ‚ط§ط´ ط§ظ„ط¹ظ„ظ…ظٹ ظˆط§ظ„ظپظƒط±ظٹ. ط§ظ„ظ…طµط§ط¯ظپط©طں</div>`, en:`<h3>ًں•Œ Coffee in Culture & Religion â€” From Banned to Blessed</h3><p>Religion and culture played a <strong>pivotal role in coffee's history</strong>. In Mecca 1511, the governor tried to ban coffee â€” but doctors and scholars proved it wasn't intoxicating, just stimulating. Coffee won. In the Catholic Church, Pope Clement VIII called it "Satan's drink" in 1600 before tasting and personally blessing it. In European coffeehouses, they were called "Penny Universities" because a penny bought you a cup and conversation with the greatest minds of the age.</p><div class="hl"><strong>ًں“ٹ Religious Acceptance:</strong> Christianity â†گ Protestants embraced it as "alertness drink" for work and prayer. Judaism â†گ Yemenite rabbis called it "food for the soul." Islam â†گ Scholars unanimously declared it halal after 200 years of debate.</div><div class="img-c"><img src="${photo('mecca_cafe')}" alt="" loading="lazy"> loading="lazy"<div class="cap">ًں•Œ The First Coffeehouse in Mecca 1511 â€” Where Cafe Culture Began</div></div><div class="quiz-box"><strong>ًں’¬ Challenge:</strong> Do you think coffee fueled Europe's Enlightenment? Historians say: coffeehouses replaced pubs â€” clear minds instead of drunk ones. Scientific and intellectual debate flourished. Coincidence?</div>`};

L['A2-4'] = {ar:`<h3>ًں§ٹ ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط¨ط§ط±ط¯ط© â€” Cold Brew, Iced Coffee, Nitro</h3><p>ط³ظˆظ‚ ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط¨ط§ط±ط¯ط© ظٹظ†ظ…ظˆ ط¨ط£ظƒط«ط± ظ…ظ† <strong>20% ط³ظ†ظˆظٹط§ظ‹</strong>. ظƒظ„ ط·ط±ظٹظ‚ط© طھط­ط¶ظٹط± ط¨ط§ط±ط¯ط© طھظ†طھط¬ ط·ط¹ظ…ط§ظ‹ ظ…ط®طھظ„ظپط§ظ‹ ط¬ط°ط±ظٹط§ظ‹. ط¥ظ„ظٹظƒ ط§ظ„ط¯ظ„ظٹظ„ ط§ظ„ظƒط§ظ…ظ„.</p>
<div class="img-c"><img src="\${photo('v60')}" alt=""><div class="cap">ًں§ٹ ط§ظ„طھط­ط¶ظٹط± ط§ظ„ط¨ط§ط±ط¯ â€” ظ†ظƒظ‡ط© ظ…ط®طھظ„ظپط©طŒ ط·ط±ظٹظ‚ط© ظ…ط®طھظ„ظپط©</div></div>
<h3>ًں§ھ Cold Brew â€” ط§ط³طھط®ظ„ط§طµ ط¨ط¯ظˆظ† ط­ط±ط§ط±ط©</h3><p>ظٹظ†ظ‚ط¹ ط§ظ„ط¨ظ† ط§ظ„ظ…ط·ط­ظˆظ† ط®ط´ظˆظ†ط© ظپظٹ ظ…ط§ط، ط¨ط§ط±ط¯ (ط¯ط±ط¬ط© ط­ط±ط§ط±ط© ط§ظ„ط؛ط±ظپط© ط£ظˆ ط£ظ‚ظ„) ظ„ظ…ط¯ط© 12-24 ط³ط§ط¹ط©. ظٹطµظپظ‰ ظˆظٹظ‚ط¯ظ… ظ…ط¹ ط«ظ„ط¬ ط£ظˆ ط­ظ„ظٹط¨.<br><strong>ط§ظ„ظ†ط³ط¨ط©:</strong> 1:8 (ط«ظ‚ظٹظ„) ط£ظˆ 1:10 (ظ…طھظˆط³ط·) â€” ط«ظ… ظٹط®ظپظپ ط¨ط§ظ„ط­ظ„ظٹط¨ ط£ظˆ ط§ظ„ظ…ط§ط، 1:1</p><table><tr><th>ط§ظ„ظ…ط¹ظٹط§ط±</th><th>Cold Brew</th><th>Iced Coffee</th><th>Nitro Cold Brew</th></tr><tr><td>ط·ط±ظٹظ‚ط© ط§ظ„طھط­ط¶ظٹط±</td><td>ظ†ظ‚ط¹ ط¨ط§ط±ط¯ 12-24 ط³ط§ط¹ط©</td><td>ظ‚ظ‡ظˆط© ط³ط§ط®ظ†ط© + ط«ظ„ط¬</td><td>Cold Brew + ط؛ط§ط² ظ†ظٹطھط±ظˆط¬ظٹظ†</td></tr><tr><td>TDS</td><td>1.3-1.8%</td><td>0.8-1.2%</td><td>1.3-1.8%</td></tr><tr><td>ط§ظ„ط­ظ…ظˆط¶ط©</td><td>ظ…ظ†ط®ظپط¶ط© ط¬ط¯ط§ظ‹ (ط£ظ‚ظ„ 60%)</td><td>ظ…طھظˆط³ط·ط© â€” ط¹ط§ظ„ظٹط©</td><td>ظ…ظ†ط®ظپط¶ط© ط¬ط¯ط§ظ‹</td></tr><tr><td>ظ…ط¯ط© ط§ظ„طھط­ط¶ظٹط±</td><td>12-24 ط³ط§ط¹ط©</td><td>3-5 ط¯ظ‚ط§ط¦ظ‚</td><td>12-24 ط³ط§ط¹ط© + ظ†ظٹطھط±ظˆط¬ظٹظ†</td></tr><tr><td>ط§ظ„ظ‚ظˆط§ظ…</td><td>ط­ط±ظٹط±ظٹطŒ ط«ظ‚ظٹظ„</td><td>ط®ظپظٹظپ</td><td>ظƒط±ظٹظ…ظٹ ظ…ط«ظ„ ط§ظ„ط¨ظٹط±ط© (ط´ظƒظ„ ط§ظ„طµط¨)</td></tr></table><div class="ok-box"><strong>ًںژ¯ ظˆطµظپط©:</strong> 100 ط¬ط±ط§ظ… ط¨ظ† (ط®ط´ظˆظ†ط© French Press) + 800 ظ…ظ„ ظ…ط§ط، ط¨ط§ط±ط¯. ط§طھط±ظƒظ‡ 18 ط³ط§ط¹ط© ظپظٹ ط§ظ„ط«ظ„ط§ط¬ط©. طµظپظ‘ظ‡ ط¨ظپظ„ط§طھط± ظˆط±ظ‚ظٹط©. ظٹط®ط²ظ† ط£ط³ط¨ظˆط¹ط§ظ‹ ظپظٹ ط§ظ„ط«ظ„ط§ط¬ط©.</div>`, en:`<h3>ًں§ٹ Cold Coffee â€” Cold Brew, Iced Coffee, Nitro</h3><p>The cold coffee market is growing at over <strong>20% annually</strong>. Each cold method produces radically different flavors. Here's the complete guide.</p>
<div class="img-c"><img src="\${photo('v60')}" alt=""><div class="cap">ًں§ٹ Cold Brew â€” Different Method, Different Flavor</div></div>
<h3>ًں§ھ Cold Brew â€” Extraction Without Heat</h3><p>Coarsely ground coffee steeped in cold water (room temp or below) for 12-24 hours. Filtered and served with ice or milk.<br><strong>Ratio:</strong> 1:8 (concentrate) or 1:10 (medium) â€” then diluted with milk or water 1:1</p><table><tr><th>Standard</th><th>Cold Brew</th><th>Iced Coffee</th><th>Nitro Cold Brew</th></tr><tr><td>Method</td><td>Cold steep 12-24h</td><td>Hot coffee + ice</td><td>Cold Brew + nitrogen</td></tr><tr><td>TDS</td><td>1.3-1.8%</td><td>0.8-1.2%</td><td>1.3-1.8%</td></tr><tr><td>Acidity</td><td>Very low (60% less)</td><td>Medium-high</td><td>Very low</td></tr><tr><td>Time</td><td>12-24 hours</td><td>3-5 minutes</td><td>12-24h + nitro</td></tr><tr><td>Body</td><td>Silky, heavy</td><td>Light</td><td>Creamy (like beer pour)</td></tr></table><div class="ok-box"><strong>ًںژ¯ Recipe:</strong> 100g coffee (French Press coarse) + 800ml cold water. Steep 18 hours in fridge. Filter with paper. Stays fresh 1 week in fridge.</div>`};

L['A3-3'] = {ar:`<h3>âک• ظ…ط§ظƒظٹط§طھظˆ, ط£ظپظˆط¬ط§طھظˆ, ظپظ„ط§طھ ظˆط§ظٹطھ â€” ظ…ط´ط±ظˆط¨ط§طھ ط§ظ„ط¨ط§ط±ظٹط³طھط§ ط§ظ„ظ…ظپط¶ظ„ط©</h3><p>ظ‡ط°ظ‡ ط§ظ„ظ…ط´ط±ظˆط¨ط§طھ طھظ…ط«ظ„ <strong>ط´ط®طµظٹط© ط§ظ„ط¨ط§ط±ظٹط³طھط§ ط§ظ„ظ…ط­طھط±ظپ</strong>. ظ„ظٹط³طھ ظ…ط´ظ‡ظˆط±ط© ظ…ط«ظ„ ط§ظ„ظ„ط§طھظٹظ‡طŒ ظ„ظƒظ†ظ‡ط§ طھط®طھط¨ط± ظپظ‡ظ…ظƒ ط§ظ„ط¹ظ…ظٹظ‚ ظ„ظ„ظ‚ظ‡ظˆط© ظˆط§ظ„ط­ظ„ظٹط¨.</p><h3>ًںژ¯ ظ…ط§ظƒظٹط§طھظˆ (Macchiato) â€” "ظ…ظ„ط·ظ‘ط®"</h3><p>ظ…ط§ظƒظٹط§طھظˆ طھط¹ظ†ظٹ "ظ…ظ„ط·ظ‘ط®" ط¨ط§ظ„ط¥ظٹط·ط§ظ„ظٹط© â€” ط¥ط³ط¨ط±ظٹط³ظˆ ط³ظ†ط¬ظ„ (7-9 ط¬ط±ط§ظ…) ظ…ط¹ <strong>ظ†ظ‚ط·ط© ط±ط؛ظˆط© ط­ظ„ظٹط¨</strong> ط¹ظ„ظ‰ ط§ظ„ط³ط·ط­. ظ„ط§ طھظˆط¬ط¯ ظ†ظƒظ‡ط© ط­ظ„ظٹط¨ â€” ط§ظ„ط±ط؛ظˆط© ظپظ‚ط· ظ„ظ„ط²ظٹظ†ط©. ط§ظ„ط£طµظ„: ظƒط§ظ† ط§ظ„ط¨ط§ط±ظٹط³طھط§ ط§ظ„ط¥ظٹط·ط§ظ„ظٹ ظٹط¶ط¹ ظ†ظ‚ط·ط© ط±ط؛ظˆط© ظ„طھظ…ظٹظٹط² ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ظ„ظ„ظ†ط³ط§ط، â€” "espresso macchiato" = ط¥ط³ط¨ط±ظٹط³ظˆ ظ…ظ„ط·ظ‘ط® ط¨ط§ظ„ط­ظ„ظٹط¨.</p><h3>ًںچ¦ ط£ظپظˆط¬ط§طھظˆ (Affogato) â€” ط­ظ„ظˆظ‰ ط§ظ„ظ‚ظ‡ظˆط©</h3><p>ط£ظپظˆط¬ط§طھظˆ ظٹط¹ظ†ظٹ "ظ…ظڈط؛ط±ظژظ‚" â€” ظ…ط؛ط±ظپط© ط¢ظٹط³ ظƒط±ظٹظ… ظپط§ظ†ظٹظ„ظٹط§ ظٹظڈطµط¨ ظپظˆظ‚ظ‡ط§ ط¥ط³ط¨ط±ظٹط³ظˆ ط³ط§ط®ظ†. ط§ظ„ط­ط±ط§ط±ط© طھط°ظٹط¨ ط§ظ„ط¢ظٹط³ ظƒط±ظٹظ… ظ‚ظ„ظٹظ„ط§ظ‹ â€” ظ…ط²ظٹط¬ ظ…ظ† ط³ط®ظˆظ†ط© ط§ظ„ظ‚ظ‡ظˆط© ظˆط¨ط±ظˆط¯ط© ط§ظ„ط­ظ„ط§ظˆط©. ط§ظ„ظˆطµظپط©: 1 ظ…ط؛ط±ظپط© ظپط§ظ†ظٹظ„ظٹط§ ط¹ط§ظ„ظٹط© ط§ظ„ط¬ظˆط¯ط© + 30 ظ…ظ„ ط¥ط³ط¨ط±ظٹط³ظˆ ط·ط§ط²ط¬. ظٹظ‚ط¯ظ… ظپظˆط±ط§ظ‹ ظ‚ط¨ظ„ ط£ظ† ظٹط°ظˆط¨ طھظ…ط§ظ…ط§ظ‹.</p><h3>ًں‡¦ًں‡؛ ظپظ„ط§طھ ظˆط§ظٹطھ (Flat White) â€” ظ…ظ† ط£ط³طھط±ط§ظ„ظٹط§ ط¥ظ„ظ‰ ط§ظ„ط¹ط§ظ„ظ…</h3><p>ط§ط¨طھظƒط±ظ‡ ط§ظ„ط£ط³طھط±ط§ظ„ظٹظˆظ† ظˆط§ظ„ظ†ظٹظˆط²ظٹظ„ظ†ط¯ظٹظˆظ† ظپظٹ ط§ظ„ط«ظ…ط§ظ†ظٹظ†ظٹط§طھ. ط¥ط³ط¨ط±ظٹط³ظˆ ط±ط³طھط±طھظˆ (60 ظ…ظ„ ظ…ظ† ط¯ط¨ظ„) + ط­ظ„ظٹط¨ ظ…ط¨ط®ط± ظ…ط¹ ط±ط؛ظˆط© <strong>ط±ظ‚ظٹظ‚ط© ط¬ط¯ط§ظ‹ (Microfoam)</strong>. ط§ظ„ظ†ط³ط¨ط©: 1:2 ط¥ط³ط¨ط±ظٹط³ظˆ:ط­ظ„ظٹط¨. ط·ط¹ظ… ط§ظ„ظ‚ظ‡ظˆط© ط£ظ‚ظˆظ‰ ظ…ظ† ط§ظ„ظ„ط§طھظٹظ‡طŒ ظˆط±ط؛ظˆط© ط£ظ‚ظ„ ظ…ظ† ط§ظ„ظƒط§ط¨طھط´ظٹظ†ظˆ.</p><div class="hl"><strong>ًں“ٹ ظ…ظ‚ط§ط±ظ†ط© ط§ظ„ظ…ط´ط±ظˆط¨ط§طھ:</strong> ظ…ظ† ط§ظ„ط£ظ‚ظ„ ط­ظ„ظٹط¨ط§ظ‹ ظ„ظ„ط£ظƒط«ط±: ظ…ط§ظƒظٹط§طھظˆ â†گ ط£ظپظˆط¬ط§طھظˆ (ط¢ظٹط³ ظƒط±ظٹظ… ط¨ط¯ظ„ ط­ظ„ظٹط¨) â†گ ظƒظˆط±طھط§ط¯ظˆ (ط¥ط³ط¨ط±ظٹط³ظˆ + ط­ظ„ظٹط¨ ط¯ط§ظپط¦) â†گ ظƒط§ط¨طھط´ظٹظ†ظˆ â†گ ظپظ„ط§طھ ظˆط§ظٹطھ â†گ ظ„ط§طھظٹظ‡ â†گ ظ…ظˆظƒط§</div>`, en:`<h3>âک• Macchiato, Affogato & Flat White â€” Barista Favorites</h3><p>These drinks represent <strong>the professional barista's character</strong>. Not as famous as latte, but they test your deep understanding of coffee and milk.</p><h3>ًںژ¯ Macchiato â€” "Stained"</h3><p>Macchiato means "stained" in Italian â€” single espresso (7-9g) with a <strong>dot of milk foam</strong> on top. No milk flavor â€” just foam for garnish. Origin: Italian baristas would mark women's espressos with a foam dot â€” "espresso macchiato" = espresso stained with milk.</p><h3>ًںچ¦ Affogato â€” Coffee Dessert</h3><p>Affogato means "drowned" â€” a scoop of vanilla ice cream with hot espresso poured over. Heat melts the ice cream slightly â€” a mix of hot coffee and cold sweetness. Recipe: 1 scoop quality vanilla + 30ml fresh espresso. Serve immediately before fully melting.</p><h3>ًں‡¦ًں‡؛ Flat White â€” From Australia to the World</h3><p>Invented by Australians and New Zealanders in the 1980s. Ristretto espresso (60ml from double) + steamed milk with <strong>very thin microfoam</strong>. Ratio: 1:2 espresso:milk. Coffee taste is stronger than latte, foam less than cappuccino.</p><div class="hl"><strong>ًں“ٹ Drink Comparison:</strong> Least to most milk: Macchiato â†گ Affogato (ice cream) â†گ Cortado â†گ Cappuccino â†گ Flat White â†گ Latte â†گ Mocha</div>`};

L['A3-4'] = {ar:`<h3>ًںژ¨ ط£ط³ط§ط³ظٹط§طھ ط§ظ„ظ„ط§طھظٹظ‡ ط£ط±طھ (Latte Art) â€” ظ…ظ† ط§ظ„ط±ط؛ظˆط© ط¥ظ„ظ‰ ط§ظ„طھط­ظپط© ط§ظ„ظپظ†ظٹط©</h3><p>ط§ظ„ظ„ط§طھظٹظ‡ ط£ط±طھ ظ‡ظˆ <strong>ط£ظƒط«ط± ظ…ط§ ظٹط¨ظ‡ط± ط§ظ„ط²ط¨ط§ط¦ظ†</strong> ظپظٹ ط§ظ„ظ…ظ‚ظ‡ظ‰. ظ„ظƒظ†ظ‡ ظ„ظٹط³ ظ…ط¬ط±ط¯ ط²ظٹظ†ط© â€” ط¥ظ†ظ‡ ط¯ظ„ظٹظ„ ط¹ظ„ظ‰ <strong>ط¬ظˆط¯ط© ط§ظ„ط¨ط®ط§ط± ظˆط¬ظˆط¯ط© ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ</strong>. ظ„ط§ ظٹظ…ظƒظ†ظƒ ط¹ظ…ظ„ ظ„ط§طھظٹظ‡ ط£ط±طھ ط¬ظ…ظٹظ„ ط¨ط¯ظˆظ† ط¥ط³ط¨ط±ظٹط³ظˆ ظ…ط«ط§ظ„ظٹ ظˆط­ظ„ظٹط¨ ظ…ط¨ط®ط± ط¨ط´ظƒظ„ طµط­ظٹط­.</p>
<h3>ًں¥› ط¹ظ„ظ… ط±ط؛ظˆط© ط§ظ„ط­ظ„ظٹط¨ (Milk Steaming Science)</h3><p>ط§ظ„ط­ظ„ظٹط¨ ظٹطھظƒظˆظ† ظ…ظ† <strong>ظ…ط§ط،طŒ ط¯ظ‡ظˆظ†طŒ ظˆط¨ط±ظˆطھظٹظ†ط§طھ</strong>. ط¹ظ†ط¯ ط§ظ„ط¨ط®ط§ط±طŒ ظٹط­ط¯ط« ط§ظ„طھط§ظ„ظٹ:<br>â€¢ <strong>ط¨ط±ظˆطھظٹظ† Whey:</strong> ظٹطھظ…ط¯ط¯ ظˆظٹط­طھظˆظٹ ظپظ‚ط§ط¹ط§طھ ط§ظ„ظ‡ظˆط§ط، â€” ظ‡ط°ط§ ظٹط®ظ„ظ‚ ط§ظ„ط±ط؛ظˆط© (Microfoam)<br>â€¢ <strong>ط¯ظ‡ظ† ط§ظ„ط­ظ„ظٹط¨:</strong> ظٹط«ط¨طھ ط§ظ„ط±ط؛ظˆط© ظˆظٹط¬ط¹ظ„ظ‡ط§ ظƒط±ظٹظ…ظٹط© â€” ط§ظ„ط­ظ„ظٹط¨ ظƒط§ظ…ظ„ ط§ظ„ط¯ط³ظ… (Whole Milk) ط£ط³ظ‡ظ„ ظ„ظ„ط¹ظ…ظ„<br>â€¢ <strong>ط§ظ„ظ„ط§ظƒطھظˆط²:</strong> ط¹ظ†ط¯ 60آ°ظ… ظٹط¨ط¯ط£ ط¨ط§ظ„طھط­ظˆظ„ ط¥ظ„ظ‰ ط³ظƒط± ط§ظ„ظƒط±ط§ظ…ظٹظ„ â€” ظٹط²ظٹط¯ ط§ظ„ط­ظ„ط§ظˆط© ط§ظ„ط·ط¨ظٹط¹ظٹط©<br>ط§ظ„ظ…ط«ط§ظ„ظٹ: طھط³ط®ظٹظ† ط§ظ„ط­ظ„ظٹط¨ ط¥ظ„ظ‰ <strong>55-65آ°ظ…</strong>. ظپظˆظ‚ 70آ°ظ… ظٹطھط­ظ„ظ„ ط§ظ„ط¨ط±ظˆطھظٹظ† â†’ ط±ط؛ظˆط© طھط®طھظپظٹ (Scalding).</p>
<h3>ًں«§ طھظ‚ظ†ظٹط© ط§ظ„ط¨ط®ط§ط± ط§ظ„طµط­ظٹط­ط© (Steaming Technique)</h3><p>1. ط§ط¨ط¯ط£ ط¨طھط¨ط±ظٹط¯ ط§ظ„ظ€ Steam Wand (ط§ظ†ظپط® ط§ظ„ط¨ط®ط§ط± ظ„ط«ط§ظ†ظٹطھظٹظ† ظ‚ط¨ظ„ ط§ظ„ط؛ظ…ط±)<br>2. <strong>ط؛ظ…ط± ط§ظ„ظپظˆظ‡ط© (Tip) ط£ط³ظپظ„ ط³ط·ط­ ط§ظ„ط­ظ„ظٹط¨ ط¨ظ‚ظ„ظٹظ„</strong> â€” ط§ظپطھط­ ط§ظ„ط¨ط®ط§ط± ط¨ط§ظ„ظƒط§ظ…ظ„ ظپظˆط±ط§ظ‹<br>3. <strong>ظ…ط±ط­ظ„ط© ط§ظ„ط³ط­ط¨ (Aeration):</strong> ط§ط®ظپط¶ ط§ظ„ط¥ط¨ط±ظٹظ‚ ظ‚ظ„ظٹظ„ط§ظ‹ ط­طھظ‰ طھط³ظ…ط¹ طµظˆطھ "ظ†ط´ط±" (Tssss) â€” ط§ط³طھظ…ط± 3-5 ط«ظˆط§ظ†ظچ<br>4. <strong>ظ…ط±ط­ظ„ط© ط§ظ„ط¯ظˆط§ظ…ط© (Vortex):</strong> ط§ط¯ظپظ† ط§ظ„ظپظˆظ‡ط© ط£ط¹ظ…ظ‚ ظ„طھط®ظ„ظ‚ ط¯ظˆط§ظ…ط© â€” طھظ…ط²ط¬ ط§ظ„ط±ط؛ظˆط© ظ…ط¹ ط§ظ„ط­ظ„ظٹط¨<br>5. <strong>ط£ظ†ظ‡ظگ ط¹ظ†ط¯ 60آ°ظ…:</strong> ط§ط؛ظ…ط³ ط§ظ„ظپظˆظ‡ط© ط¨ط§ظ„ظƒط§ظ…ظ„ ظˆط£ط·ظپط¦ ط§ظ„ط¨ط®ط§ط± â€” ط§ظ…ط³ط­ ط§ظ„ظ€ Wand ظپظˆط±ط§ظ‹</p>
<h3>ًںژ¨ ط£ط´ظ‡ط± 3 ط±ط³ظˆظ…ط§طھ ظˆط£ط³ط±ط§ط±ظ‡ط§</h3><p><strong>â™¥ ط§ظ„ظ‚ظ„ط¨ (Heart):</strong> ط£ط³ظ‡ظ„ ط±ط³ظ…ط© â€” ط§ط³ظƒط¨ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ط£ظˆظ„ط§ظ‹طŒ ط«ظ… طµط¨ ط§ظ„ط­ظ„ظٹط¨ ظ…ظ† ط§ط±طھظپط§ط¹ 5 ط³ظ… ظپظٹ ظ…ظ†طھطµظپ ط§ظ„ظƒظˆط¨طŒ ظˆط¹ظ†ط¯ ط§ظ„ط§ظ…طھظ„ط§ط، ط§ط±ظپط¹ ط§ظ„ط¥ط¨ط±ظٹظ‚ ظˆط§ط±ط³ظ… ط®ط·ط§ظ‹ ط£ظپظ‚ظٹط§ظ‹.<br><strong>ًںچƒ ط§ظ„ط±ظˆط²ظٹطھط§ (Rosetta):</strong> ط§ط³ظƒط¨ ط§ظ„ط­ظ„ظٹط¨ ط¨ظ‡ط²ظ‘ط§طھ ط®ظپظٹظپط© (Wiggle) ظ…ظ† ط§ظ„ظٹط³ط§ط± ظ„ظ„ظٹظ…ظٹظ† ط£ط«ظ†ط§ط، ط§ظ„طھظ‚ط¯ظ‘ظ… ظ†ط­ظˆ ط§ظ„ط­ط§ظپط©طŒ ط«ظ… ط§ط±ط³ظ… ط®ط·ط§ظ‹ ط£ظپظ‚ظٹط§ظ‹ ط¹ط¨ط± ط§ظ„طھطµظ…ظٹظ….<br><strong>ًںگ» ط§ظ„طھظˆظ„ظٹط¨ (Tulip):</strong> ط§ط³ظƒط¨ ط¹ظ„ظ‰ 3 ظ…ط±ط§ط­ظ„ â€” ظƒظ„ ظ…ط±ط­ظ„ط© طھط®ظ„ظ‚ ط¯ط§ط¦ط±ط© طھط¹ظ„ظˆ ط§ظ„ط³ط§ط¨ظ‚ط©طŒ ط«ظ… ط§ط±ط³ظ… ظ‚ظ„ط¨ط§ظ‹ ظپظٹ ط§ظ„ظ†ظ‡ط§ظٹط©.</p>
<div class="hl"><strong>ًں“ٹ ط­ظ‚ظٹظ‚ط© ظ…ط¯ظ‡ط´ط©:</strong> ظ…ط³ط§ط¨ظ‚ط© World Latte Art Championship طھطھط·ظ„ط¨ 6 ظ…ط´ط±ظˆط¨ط§طھ: ط¥ط³ط¨ط±ظٹط³ظˆ ظ…ط§ظƒظٹط§طھظˆطŒ ظƒط§ط¨طھط´ظٹظ†ظˆطŒ ظ„ط§طھظٹظ‡ ط£ط±طھ ط­ط±طŒ ظˆ 3 ظ…ط´ط±ظˆط¨ط§طھ طھطµظ…ظٹظ… ط­ط±! ط§ظ„ظپط§ط¦ط² ظٹط­طµظ„ ط¹ظ„ظ‰ $5,000+</div>
<div class="ok-box"><strong>ًںژ¯ ظ…ط´ط±ظˆط¹:</strong> ط§ط´طھط±ظٹ ط­ظ„ظٹط¨ ظƒط§ظ…ظ„ ط§ظ„ط¯ط³ظ…. طھط¯ط±ط¨ ط¹ظ„ظ‰ ط§ظ„ط¨ط®ط§ط± ظٹظˆظ…ظٹط§ظ‹ ظ„ظ…ط¯ط© ط£ط³ط¨ظˆط¹ â€” ظƒظ„ ظٹظˆظ…طŒ ط¨ط®ظ‘ط± 200 ظ…ظ„ ط­ظ„ظٹط¨ ظˆط­ط§ظˆظ„ ط¹ظ…ظ„ Microfoam ظ†ط§ط¹ظ… (ط¨ط¯ظˆظ† ظپظ‚ط§ط¹ط§طھ ظƒط¨ظٹط±ط©). ط¨ط¹ط¯ ط¥طھظ‚ط§ظ† ط§ظ„ط±ط؛ظˆط©طŒ ط§ط¨ط¯ط£ ط¨طھط¯ط±ظٹط¨ ط§ظ„ظ‚ظ„ط¨. ط®ط° ظپظٹط¯ظٹظˆ ظ„ط±ط³ظ…طھظƒ ط§ظ„ط£ظˆظ„ظ‰ ظˆط§ظ„ط£ط®ظٹط±ط© â€” ظ‚ط§ط±ظ† ط§ظ„طھط·ظˆط±!</div>`, en:`<h3>ًںژ¨ Latte Art Basics â€” From Foam to Masterpiece</h3><p>Latte Art is the <strong>most visually impressive skill</strong> in the cafe. But it's not just decoration â€” it's proof of <strong>espresso quality and milk steaming skill</strong>. You can't pour beautiful latte art without perfect espresso and properly steamed milk.</p>
<h3>ًں¥› Milk Steaming Science</h3><p>Milk consists of <strong>water, fat, and proteins</strong>. During steaming:<br>â€¢ <strong>Whey Protein:</strong> Expands and traps air bubbles â€” this creates microfoam<br>â€¢ <strong>Milk Fat:</strong> Stabilizes foam and makes it creamy â€” whole milk is easiest to work with<br>â€¢ <strong>Lactose:</strong> At 60آ°C starts caramelizing â€” increases natural sweetness<br>Ideal: heat milk to <strong>55-65آ°C</strong>. Above 70آ°C protein denatures â†’ foam collapses (scalding).</p>
<h3>ًں«§ Proper Steaming Technique</h3><p>1. Purge steam wand (2 seconds before submerging)<br>2. <strong>Submerge tip just below milk surface</strong> â€” open steam fully immediately<br>3. <strong>Aeration phase:</strong> Lower pitcher slightly until you hear "tearing" sound (Tssss) â€” 3-5 seconds<br>4. <strong>Vortex phase:</strong> Bury tip deeper to create whirlpool â€” integrates foam evenly<br>5. <strong>Finish at 60آ°C:</strong> Fully submerge tip and turn off steam â€” wipe wand immediately</p>
<h3>ًںژ¨ 3 Most Popular Designs</h3><p><strong>â™¥ Heart:</strong> Easiest design â€” pour espresso first, then pour milk from 5cm height into center of cup, when nearly full lift pitcher and draw a horizontal line.<br><strong>ًںچƒ Rosetta:</strong> Pour milk with gentle wiggle motions left-to-right while moving toward the cup edge, then draw a horizontal line through the design.<br><strong>ًںگ» Tulip:</strong> Pour in 3 stages â€” each stage creates a circle on top of the previous one, then finish with a heart.</p>
<div class="hl"><strong>ًں“ٹ Amazing Fact:</strong> The World Latte Art Championship requires 6 drinks: Espresso Macchiato, Cappuccino, Free Pour Latte Art, and 3 signature drinks! Winner receives $5,000+</div>
<div class="ok-box"><strong>ًںژ¯ Project:</strong> Buy whole milk. Practice steaming daily for a week â€” each day, steam 200ml milk and try to create smooth microfoam (no large bubbles). Once you master foam, start training the heart. Take video of your first and last pour â€” compare progress!</div>`};

L['A3-5'] = {ar:`<h3>ًں”§ طµظٹط§ظ†ط© ط¢ظ„ط© ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ â€” ط·ظˆظ„ ط§ظ„ط¹ظ…ط± ظˆط£ظپط¶ظ„ ظ†ظƒظ‡ط©</h3><p>ط¢ظ„ط© ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ظ‡ظٹ <strong>ط£ط؛ظ„ظ‰ ظ‚ط·ط¹ط© ظ…ط¹ط¯ط§طھ</strong> ظپظٹ ط§ظ„ظ…ظ‚ظ‡ظ‰ (ط¢ظ„ط© La Marzocco Linea PB طھط¨ط¯ط£ ظ…ظ† $15,000). ط§ظ„طµظٹط§ظ†ط© ط§ظ„ظ…ظ†طھط¸ظ…ط© طھط­ظ…ظٹ ط§ط³طھط«ظ…ط§ط±ظƒ ظˆطھط¶ظ…ظ† <strong>ط§طھط³ط§ظ‚ ط§ظ„ظ†ظƒظ‡ط© ظƒظ„ ظٹظˆظ…</strong>.</p>
<div class="img-c"><img src="\${photo('espresso')}" alt=""><div class="cap">ًں”§ طµظٹط§ظ†ط© ط¢ظ„ط© ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ â€” ظٹظˆظ…ظٹط©طŒ ط£ط³ط¨ظˆط¹ظٹط©طŒ ط´ظ‡ط±ظٹط©</div></div>
<h3>ًں—“ï¸ڈ ط¬ط¯ظˆظ„ ط§ظ„طµظٹط§ظ†ط© ط§ظ„ظٹظˆظ…ظٹ</h3>
<table><tr><th>ط§ظ„طھظƒط±ط§ط±</th><th>ط§ظ„ظ…ظ‡ظ…ط©</th><th>ط§ظ„ط·ط±ظٹظ‚ط©</th></tr><tr><td>ظƒظ„ طµط¨ط§ط­</td><td>طھظپط±ظٹط؛ Backflush ط¨ط§ظ„ظ…ظ†ط¸ظپ</td><td>ط§ط³طھط®ط¯ظ… Blind Basket + 3 ط¬ط±ط§ظ… ظ…ظ†ط¸ظپ (Puly Caff). ط§ط¹ظ…ظ„ backflush 3 ط¯ظˆط±ط§طھ أ— 10 ط«ظˆط§ظ†ظچ. ط§ط´ط·ظپ ط¨ط§ظ„ظ…ط§ط، ط§ظ„ظ†ط¸ظٹظپ.</td></tr><tr><td>ظƒظ„ طµط¨ط§ط­</td><td>طھظ†ط¸ظٹظپ ظپطھط­ط§طھ ط§ظ„ط¨ط®ط§ط± (Steam Tips)</td><td>ط§ظ†ظ‚ط¹ ظپظٹ ظ…ط§ط، ط³ط§ط®ظ† ظ„ظ…ط¯ط© 10 ط¯ظ‚ط§ط¦ظ‚. ط§ط³طھط®ط¯ظ… ط¥ط¨ط±ط© طھظ†ط¸ظٹظپ ظ„ط¥ط²ط§ظ„ط© ط¨ظ‚ط§ظٹط§ ط§ظ„ط­ظ„ظٹط¨ ط§ظ„ظ…طھظƒطھط³.</td></tr><tr><td>ظƒظ„ 2-3 ط³ط§ط¹ط§طھ</td><td>Backflush ط¨ط§ظ„ظ…ط§ط، ظپظ‚ط·</td><td>ط¯ظˆط±ط© ظˆط§ط­ط¯ط© أ— 5 ط«ظˆط§ظ†ظچ ظ„ط¥ط²ط§ظ„ط© طھط±ط§ظƒظ… ط§ظ„ط²ظٹظˆطھ ط§ظ„ط®ظپظٹظپ.</td></tr><tr><td>ظ†ظ‡ط§ظٹط© ط§ظ„ظٹظˆظ…</td><td>طھظ†ط¸ظٹظپ ط´ط§ظ…ظ„</td><td>ط§ظ†ط²ط¹ ط¬ظ…ظٹط¹ ط§ظ„ظ€ Portafilters, Baskets, Screens. ط§ظ†ظ‚ط¹ ظپظٹ ظ…ط­ظ„ظˆظ„ ظ…ظ†ط¸ظپ ط³ط§ط®ظ† ظ„ظ…ط¯ط© 30 ط¯ظ‚ظٹظ‚ط©.</td></tr></table>
<h3>ًں—“ï¸ڈ ط¬ط¯ظˆظ„ ط§ظ„طµظٹط§ظ†ط© ط§ظ„ط£ط³ط¨ظˆط¹ظٹ ظˆط§ظ„ط´ظ‡ط±ظٹ</h3><p><strong>ط£ط³ط¨ظˆط¹ظٹط§ظ‹:</strong> ط§ظ†ظ‚ط¹ ط§ظ„ظ€ Group Gaskets ظˆظ€ Shower Screens ظپظٹ ظ…ظ†ط¸ظپ. طھط£ظƒط¯ ظ…ظ† ط³ظ„ط§ظ…ط© ط§ظ„ظ€ Gasket (ط¥ط°ط§ طھط³ط±ط¨ ط§ظ„ظ…ط§ط،طŒ ط؛ظٹظ‘ط±ظ‡ â€” $5-10 ظ„ظƒظ„ ظ‚ط·ط¹ط© ط¨ط¯ظٹظ„ط©).<br><strong>ط´ظ‡ط±ظٹط§ظ‹:</strong> ط¬ط¯ظˆظ„ ط¥ط²ط§ظ„ط© ط§ظ„طھط±ط³ط¨ط§طھ ط§ظ„ظƒظ„ط³ظٹط© (Descaling) â€” ط¶ط±ظˆط±ظٹ ط®طµظˆطµط§ظ‹ ظپظٹ ط§ظ„ظ…ظ†ط§ط·ظ‚ ط°ط§طھ ط§ظ„ظ…ط§ط، ط§ظ„ط¹ط³ط±. ط§ط³طھط®ط¯ظ… ظ…ط­ظ„ظˆظ„ Dezcal ط£ظˆ Caffetto. ط¹ظ‚ظ… ط®ط²ط§ظ† ط§ظ„ظ…ط§ط، ط¨ظ…ط­ظ„ظˆظ„ طھط¹ظ‚ظٹظ… ط®ظپظٹظپ.<br><strong>ط³ظ†ظˆظٹط§ظ‹:</strong> ط§ط³طھط¨ط¯ط§ظ„ ط­ظ„ظ‚ط§طھ ط§ظ„ظ€ Gaskets (ط¬ظ…ظٹط¹ ط§ظ„ظ€ Groups). ظپط­طµ ظ…ط¶ط®ط© ط§ظ„ظ…ط§ط، â€” ط¶ط؛ط· ط§ظ„ظ…ط«ط§ظ„ظٹ: 9 ط¨ط§ط± (bar). ط§ط³طھط¨ط¯ط§ظ„ ظپظ„طھط± ط§ظ„ظ…ط§ط،. ظپط­طµ General Boiler (طھط³ط±ظٹط¨ط§طھطŒ طھط±ط³ط¨ط§طھ).</p>
<h3>ًں”§ طھط´ط®ظٹطµ ط§ظ„ظ…ط´ط§ظƒظ„ ط§ظ„ط´ط§ط¦ط¹ط©</h3><p>â€¢ <strong>ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ظٹطھظ‚ط·ط± ط¨ط¨ط·ط، ط´ط¯ظٹط¯:</strong> ط§ظ„ظ€ Shower Screen ظ…ط³ط¯ظˆط¯ â†’ ظ†ط¸ظ‘ظپظ‡ ط£ظˆ ط§ط³طھط¨ط¯ظ„ظ‡. ط£ظˆ ط·ط§ط­ظ†ط© طھط­طھط§ط¬ ط¶ط¨ط·.<br>â€¢ <strong>ط¨ط®ط§ط± ط¶ط¹ظٹظپ:</strong> Steam Boiler ظٹط­طھط§ط¬ Descaling. ط£ظˆ ط§ظ„ظ€ Steam Valve طھط§ظ„ظپط©.<br>â€¢ <strong>طھط³ط±ظٹط¨ ظ…ط§ط، طھط­طھ ط§ظ„ط¢ظ„ط©:</strong> Drain Valve طھط§ظ„ظپ ط£ظˆ طھظˆطµظٹظ„ط© ظ…ط§ط، ظ…ظپظƒظˆظƒط© â†’ ط£ط؛ظ„ظ‚ ط§ظ„ظ…ط§ط، ظپظˆط±ط§ظ‹ ظˆط§طھطµظ„ ط¨ظپظ†ظٹ.<br>â€¢ <strong>ط·ط¹ظ… ط²ظٹطھظٹ ط£ظˆ ظپط§ط³ط¯:</strong> ط§ظ„ط²ظٹطھ ط§ظ„ظ…طھط±ط§ظƒظ… ظپظٹ ط§ظ„ظ€ Groups â†’ ط§ط³طھط®ط¯ظ… ظ…ظ†ط¸ظپ ط£ظ‚ظˆظ‰ ط£ظˆ ط²ط¯ طھظƒط±ط§ط± Backflush.<br>â€¢ <strong>ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ط³ط§ط®ظ† ط¬ط¯ط§ظ‹ ط£ظˆ ط¨ط§ط±ط¯:</strong> ظ…ظ†ط¸ظ… ط­ط±ط§ط±ط© (Thermostat/PID) ظٹط­طھط§ط² ط¶ط¨ط·ط§ظ‹ ط£ظˆ طھط¨ط¯ظٹظ„ط§ظ‹.</p>
<div class="err-box"><strong>â‌Œ ط£ط®ط·ط§ط، ط´ط§ط¦ط¹ط©:</strong> 1. ط§ط³طھط®ط¯ط§ظ… ظ…ظ†ط¸ظپ ط؛ط³ظٹظ„ ط§ظ„طµط­ظˆظ† ظپظٹ Backflush â€” ظٹظ‚طھظ„ ط§ظ„ظ€ Gaskets. ط§ط³طھط®ط¯ظ… Puly Caff ط£ظˆ Urnex. 2. طھط±ظƒ Milk Residue ط¹ظ„ظ‰ ط§ظ„ظ€ Steam Wand ظ„ط£ظƒط«ط± ظ…ظ† ط¯ظ‚ظٹظ‚ط© â€” ظٹطھط­ظˆظ„ ط¥ظ„ظ‰ ظƒطھظ„ط© طµظ„ط¨ط© طھط­طھ ط§ظ„ط­ط±ط§ط±ط©. ط§ظ…ط³ط­ ظˆط·ظ‡ط± ظپظˆط±ط§ظ‹!</div>
<div class="ok-box"><strong>ًںژ¯ طھط­ط¯ظٹ:</strong> ط®ط° طµظˆط±ط© ظ„ط¢ظ„ط© ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ظپظٹ ظ…ظ‚ظ‡ظ‰ ظ‚ط±ظٹط¨ â€” ط§ط¨ط­ط« ط¹ظ† 3 ط¹ظ„ط§ظ…ط§طھ طµظٹط§ظ†ط© ط³ظٹط¦ط© (ط¨ظ‚ط¹ ط­ظ„ظٹط¨ ظ‚ط¯ظٹظ…ط© ط¹ظ„ظ‰ ط§ظ„ظ€ WandطŒ ظ„ظˆظ† ط¨ظ†ظٹ ط¹ظ„ظ‰ ط§ظ„ظ€ Shower ScreenطŒ ط¨ظ‚ط¹ ظ…ط§ط، ظ…ط¬ظپظپط© طھط­طھ ط§ظ„ظ€ Group). طھط¹ظ„ظ‘ظ… ظƒظٹظپ طھظ…ظ†ط¹ظ‡ط§ ظپظٹ ط¢ظ„طھظƒ.</div>`, en:`<h3>ًں”§ Espresso Machine Maintenance â€” Longevity & Peak Flavor</h3><p>The espresso machine is the <strong>most expensive piece of equipment</strong> in the cafe (a La Marzocco Linea PB starts at $15,000). Regular maintenance protects your investment and ensures <strong>consistent flavor every day</strong>.</p>
<div class="img-c"><img src="\${photo('espresso')}" alt=""><div class="cap">ًں”§ Espresso Machine Maintenance â€” Daily, Weekly, Monthly</div></div>
<h3>ًں—“ï¸ڈ Daily Maintenance Schedule</h3>
<table><tr><th>Frequency</th><th>Task</th><th>Method</th></tr><tr><td>Every Morning</td><td>Detergent Backflush</td><td>Use blind basket + 3g detergent (Puly Caff). Backflush 3 cycles أ— 10 seconds. Rinse with clean water.</td></tr><tr><td>Every Morning</td><td>Clean Steam Tips</td><td>Soak in hot water for 10 minutes. Use cleaning needle to remove baked-on milk residue.</td></tr><tr><td>Every 2-3 hours</td><td>Water Backflush</td><td>1 cycle أ— 5 seconds to remove light oil buildup.</td></tr><tr><td>End of Day</td><td>Full Clean</td><td>Remove all portafilters, baskets, screens. Soak in hot detergent solution for 30 minutes.</td></tr></table>
<h3>ًں—“ï¸ڈ Weekly & Monthly Maintenance</h3><p><strong>Weekly:</strong> Soak group gaskets and shower screens in detergent. Check gasket integrity (if leaking, replace â€” $5-10 per replacement part).<br><strong>Monthly:</strong> Descaling schedule â€” essential especially in hard water areas. Use Dezcal or Caffetto solution. Sanitize water tank with mild sanitizer.<br><strong>Yearly:</strong> Replace all group gaskets. Check water pump â€” ideal pressure: 9 bar. Replace water filter. Inspect general boiler (leaks, scale).</p>
<h3>ًں”§ Common Problem Diagnosis</h3><p>â€¢ <strong>Espresso dripping too slowly:</strong> Shower screen clogged â†’ clean or replace. Or grinder needs adjustment.<br>â€¢ <strong>Weak steam:</strong> Steam boiler needs descaling. Or steam valve is damaged.<br>â€¢ <strong>Water leaking under machine:</strong> Drain valve damaged or loose water connection â†’ shut off water immediately and call technician.<br>â€¢ <strong>Oily or rancid taste:</strong> Oil buildup in groups â†’ use stronger detergent or increase backflush frequency.<br>â€¢ <strong>Espresso too hot or too cold:</strong> Thermostat/PID needs adjustment or replacement.</p>
<div class="err-box"><strong>â‌Œ Common Mistakes:</strong> 1. Using dish soap for backflush â€” kills gaskets. Use Puly Caff or Urnex. 2. Leaving milk residue on steam wand for over a minute â€” hardens into solid under heat. Wipe and purge immediately!</div>
<div class="ok-box"><strong>ًںژ¯ Challenge:</strong> Take a photo of an espresso machine at a nearby cafe â€” find 3 signs of poor maintenance (old milk spots on wand, brown color on shower screen, dried water marks under group). Learn how to prevent them on your machine.</div>`};

L['B1-3'] = {ar:`<h3>ًں”¥ طھط­ظ…ظٹطµ ط­ط³ط¨ ط§ظ„ظ…ظ†ط´ط£ â€” ظ„ظƒظ„ ط¨ظ† ط´ط®طµظٹطھظ‡</h3><p>ظƒظ„ ظ…ظ†ط·ظ‚ط© ظ…ظ†طھط¬ط© ظ„ظ„ط¨ظ† طھط­طھط§ط¬ <strong>ظ…ظ†ط­ظ†ظ‰ طھط­ظ…ظٹطµ ظ…ط®طھظ„ظپط§ظ‹</strong>. طھط­ظ…ظٹطµ ط¨ظ† ط¥ط«ظٹظˆط¨ظٹ ظ…ط«ظ„ طھط­ظ…ظٹطµ ط¨ظ† ط¨ط±ط§ط²ظٹظ„ظٹ ظٹط¤ط¯ظٹ ط¥ظ„ظ‰ ظƒط§ط±ط«ط© ظپظٹ ط§ظ„ط·ط¹ظ…. ظ‡ط°ط§ ظ‡ظˆ ط§ظ„ظپط±ظ‚ ط¨ظٹظ† ط§ظ„ظ…ط­ظ…طµ ط§ظ„ط¹ط§ط¯ظٹ ظˆط§ظ„ظ…ط­ظ…طµ ط§ظ„ظ…ط­طھط±ظپ.</p><table><tr><th>ط§ظ„ظ…ظ†ط´ط£</th><th>ط§ظ„ظƒط«ط§ظپط©</th><th>طھط­ظ…ظٹطµ ظ…ط«ط§ظ„ظٹ</th><th>ط§ظ„ظ†ظƒظ‡ط© ط§ظ„ظ…ط³طھظ‡ط¯ظپط©</th></tr><tr><td>ط¥ط«ظٹظˆط¨ظٹط§ / ظƒظٹظ†ظٹط§</td><td>ط¹ط§ظ„ظٹط© ط¬ط¯ط§ظ‹</td><td>ظپط§طھط­ â€” Light (Agtron #75-85)</td><td>ط­ظ…ظˆط¶ط© ظ…طھط£ظ„ظ‚ط©طŒ ط²ظ‡ط±ظٹطŒ ظپط§ظƒظ‡ظٹ</td></tr><tr><td>ظƒظˆظ„ظˆظ…ط¨ظٹط§ / ط£ظ…ط±ظٹظƒط§ ط§ظ„ظˆط³ط·ظ‰</td><td>ط¹ط§ظ„ظٹط©</td><td>ظپط§طھط­-ظ…طھظˆط³ط· (Agtron #65-75)</td><td>طھظˆط§ط²ظ†طŒ ط­ظ„ط§ظˆط©طŒ ط­ظ…ظˆط¶ط© ظ…ط¹طھط¯ظ„ط©</td></tr><tr><td>ط§ظ„ط¨ط±ط§ط²ظٹظ„ / ط£ظ…ط±ظٹظƒط§ ط§ظ„ط¬ظ†ظˆط¨ظٹط©</td><td>ظ…طھظˆط³ط·ط©</td><td>ظ…طھظˆط³ط· (Agtron #55-65)</td><td>ط´ظˆظƒظˆظ„ط§طھط©طŒ ط¬ظˆط²ظٹطŒ ظ‚ظˆط§ظ… ظƒط§ظ…ظ„</td></tr><tr><td>ط¥ظ†ط¯ظˆظ†ظٹط³ظٹط§ / ط¢ط³ظٹط§</td><td>ظ…ظ†ط®ظپط¶ط©</td><td>ظ…طھظˆط³ط·-ط¯ط§ظƒظ† (Agtron #45-55)</td><td>طھط±ط§ط¨ظٹطŒ ط¨ظ‡ط§ط±ط§طھطŒ ظ‚ظˆط§ظ… ط«ظ‚ظٹظ„</td></tr></table><div class="info-box"><strong>ًں’، ط§ظ„ظ‚ط§ط¹ط¯ط© ط§ظ„ط°ظ‡ط¨ظٹط©:</strong> ط§ظ„ط¨ظ† ط¹ط§ظ„ظٹ ط§ظ„ظƒط«ط§ظپط© (ط¥ط«ظٹظˆط¨ظٹ) ظٹط­طھط§ط¬ ط·ط§ظ‚ط© ط­ط±ط§ط±ط© ط£ط¹ظ„ظ‰ ظپظٹ ط¨ط¯ط§ظٹط© ط§ظ„طھط­ظ…ظٹطµ. ط§ظ„ط¨ظ† ظ…ظ†ط®ظپط¶ ط§ظ„ظƒط«ط§ظپط© (ط¥ظ†ط¯ظˆظ†ظٹط³ظٹ) ظٹط­طھط§ط¬ ط·ط§ظ‚ط© ط£ظ‚ظ„ â€” ظˆط¥ظ„ط§ ط³ظٹط­طھط±ظ‚ ط§ظ„ط³ط·ط­ ظ‚ط¨ظ„ ظ†ط¶ط¬ ط§ظ„ط¯ط§ط®ظ„. ط§ط¯ط±ط³ ط¨ظ†ظƒ ظ‚ط¨ظ„ ط£ظ† طھط­ظ…طµظ‡!</div>`, en:`<h3>ًں”¥ Origin-Specific Roasting â€” Every Bean Has Its Character</h3><p>Each coffee origin needs a <strong>different roast curve</strong>. Roasting Ethiopian like Brazilian leads to flavor disaster. This is the difference between average and professional roasters.</p><table><tr><th>Origin</th><th>Density</th><th>Ideal Roast</th><th>Target Flavor</th></tr><tr><td>Ethiopia / Kenya</td><td>Very high</td><td>Light (Agtron #75-85)</td><td>Bright acidity, floral, fruity</td></tr><tr><td>Colombia / Central America</td><td>High</td><td>Light-Med (Agtron #65-75)</td><td>Balance, sweetness, moderate acidity</td></tr><tr><td>Brazil / South America</td><td>Medium</td><td>Medium (Agtron #55-65)</td><td>Chocolate, nutty, full body</td></tr><tr><td>Indonesia / Asia</td><td>Low</td><td>Med-Dark (Agtron #45-55)</td><td>Earthy, spice, heavy body</td></tr></table><div class="info-box"><strong>ًں’، Golden Rule:</strong> High-density beans (Ethiopia) need higher heat energy at roast start. Low-density beans (Indonesia) need less energy â€” otherwise the surface burns before the inside develops. Study your bean before roasting!</div>`};

L['B1-4'] = {ar:`<h3>ًں”¥ ط¯ظ„ظٹظ„ ظ…ط¹ط¯ط§طھ ط§ظ„طھط­ظ…ظٹطµ â€” ظ…ظ† ط§ظ„ظ…ظ‚ظ„ط§ط© ط¥ظ„ظ‰ ط§ظ„ظ…ط­ظ…طµط© ط§ظ„ط§ط­طھط±ط§ظپظٹط©</h3><p>ط§ط®طھظٹط§ط± ظ…ط­ظ…طµط© ط§ظ„ظ‚ظ‡ظˆط© ظ‡ظˆ <strong>ط£ظƒط¨ط± ظ‚ط±ط§ط± ط§ط³طھط«ظ…ط§ط±ظٹ</strong> ظپظٹ ظ…ط´ظˆط§ط± ط§ظ„ظ…ط­ظ…طµ. طھطھط±ط§ظˆط­ ط§ظ„ظ…ط¹ط¯ط§طھ ظ…ظ† ظ…ظ‚ظ„ط§ط© ظ…ظ†ط²ظ„ظٹط© ط¨ظ€ $20 ط¥ظ„ظ‰ ظ…ط­ط§ظ…طµ طµظ†ط§ط¹ظٹط© ط¨ظ€ $100,000+. ط¥ظ„ظٹظƒ ط¯ظ„ظٹظ„ ط´ط§ظ…ظ„ ظ„ظƒظ„ ظ†ظˆط¹.</p>
<div class="img-c"><img src="\${photo('roast')}" alt=""><div class="cap">ًںڈ­ ظ…ط¹ط¯ط§طھ ط§ظ„طھط­ظ…ظٹطµ â€” ظ…ظ† ط§ظ„ظ…ط­ظ…طµط© ط§ظ„ظٹط¯ظˆظٹط© ط¥ظ„ظ‰ ط§ظ„طھط¬ط§ط±ظٹط©</div></div>
<h3>ًںڈ  ظ…ط­ط§ظ…طµ ط§ظ„ط¯ظپط¹ط© ط§ظ„ظ…ظ†ط²ظ„ظٹط© ظˆط§ظ„طµط؛ظٹط±ط© (0.1-5 ظƒط¬ظ…)</h3>
<table><tr><th>ط§ظ„ظ†ظˆط¹</th><th>ط§ظ„ظ…ط¯ظ‰ ط§ظ„ط³ط¹ط±ظٹ</th><th>ط§ظ„ط³ط¹ط©</th><th>ط§ظ„ظ…ظ…ظٹط²ط§طھ</th><th>ط§ظ„ط¹ظٹظˆط¨</th></tr><tr><td>ظ…ظ‚ظ„ط§ط© (Pan)</td><td>$15-40</td><td>50-100 ط¬ط±ط§ظ…</td><td>ط£ط±ط®طµ ط­ظ„ â€” طھطھط¹ظ„ظ… ط§ظ„طھط­ظƒظ… ط§ظ„ظٹط¯ظˆظٹ</td><td>طھط­ظ…ظٹطµ ط؛ظٹط± ظ…طھط³ط§ظˆظچ â€” طھط­طھط§ط¬ طھط­ط±ظٹظƒ ط¯ط§ط¦ظ… â€” ظ„ط§ طھط­ظƒظ… ظپظٹ ط§ظ„ط­ط±ط§ط±ط©</td></tr><tr><td>ظپط±ظ† ظ…ظ†ط²ظ„ظٹ (Oven)</td><td>$0 (ظ…ظˆط¬ظˆط¯)</td><td>200-500 ط¬ط±ط§ظ…</td><td>طھط¬ط±ظٹط¨ ظƒظ…ظٹط© ط£ظƒط¨ط± â€” ظ…ظ†ط§ط³ط¨ ظ„ظ„ط¨ط¯ط§ظٹط©</td><td>طھط³ط®ظٹظ† ط؛ظٹط± ظ…طھط³ط§ظˆظچ â€” طµط¹ظˆط¨ط© ظپظٹ ط§ظ„طھط¨ط±ظٹط¯ ط§ظ„ط³ط±ظٹط¹</td></tr><tr><td>Whirley Pop / ظ…ظ‚ظ„ط§ط© ظٹط¯ظˆظٹط©</td><td>$30-80</td><td>100-200 ط¬ط±ط§ظ…</td><td>طھظˆط²ظٹط¹ ط­ط±ط§ط±ط© ط£ظپط¶ظ„ â€” طھط­ظƒظ… ظپظٹ ط³ط±ط¹ط© ط§ظ„طھط­ط±ظٹظƒ</td><td>ط³ط¹ط© طµط؛ظٹط±ط© â€” طھط­طھط§ط¬ ط¬ظ‡ط¯ ط¨ط¯ظ†ظٹ</td></tr><tr><td>FreshRoast SR540/SR800</td><td>$200-350</td><td>120-225 ط¬ط±ط§ظ…</td><td>طھط­ظ…ظٹطµ ط¨ط§ظ„ظ‡ظˆط§ط، ط§ظ„ط³ط§ط®ظ† â€” ظ†ط¸ظٹظپ â€” ظ†طھط§ط¦ط¬ ظ…طھط³ظ‚ط©</td><td>ط³ط¹ط© ظ…ط­ط¯ظˆط¯ط© â€” طµظˆطھ ط¹ط§ظ„ظچ â€” ظ…ظ†ط­ظ†ظ‰ ظ…ط­ط¯ظˆط¯</td></tr><tr><td>Behmor 2000AB Plus</td><td>$400-500</td><td>225-450 ط¬ط±ط§ظ…</td><td>ط¢ظ…ظ† â€” ط¯ط®ط§ظ† ظ‚ظ„ظٹظ„ â€” ط¨ط±ط§ظ…ط¬ طھط­ظ…ظٹطµ ط£ظˆطھظˆظ…ط§طھظٹظƒظٹط© ظˆظٹط¯ظˆظٹط©</td><td>ط­ط±ط§ط±ط© ط¶ط¹ظٹظپط© ظ„ظ„طھط­ظ…ظٹطµ ط§ظ„ط¯ط§ظƒظ† â€” طµظٹط§ظ†ط© ظ…ط¹ظ‚ط¯ط©</td></tr></table>
<h3>ًںڈھ ظ…ط­ط§ظ…طµ ط´ط¨ظ‡ ط§ط­طھط±ط§ظپظٹط© ظˆط§ط­طھط±ط§ظپظٹط© (1-30 ظƒط¬ظ…)</h3><p><strong>Diedrich IR-5</strong> â€” ط§ظ„ظ…ط­ظ…طµط© ط§ظ„ظ…ظپط¶ظ„ط© ظ„ظ„ظ…ط®طھط¨ط±ط§طھ ظˆظ…ط­ط§ظ…طµ Specialty. طھط­ظƒظ… ط§ط³طھط«ظ†ط§ط¦ظٹ ط¨ظپط¶ظ„ ط¹ظ†ط§طµط± ط§ظ„ط£ط´ط¹ط© طھط­طھ ط§ظ„ط­ظ…ط±ط§ط،. $12,000-18,000.<br><strong>Probat P5/Probat UG22</strong> â€” ط§ظ„طµظ†ط§ط¹ط© ط§ظ„ط£ظ„ظ…ط§ظ†ظٹط© â€” ط§ظ„ظ…ط¹ظٹط§ط± ط§ظ„ط°ظ‡ط¨ظٹ. ظ…ظˆط«ظˆظ‚ط©طŒ ظ‚ط·ط¹ ط؛ظٹط§ط± ظ…طھظˆظپط±ط©طŒ ظ†طھط§ط¦ط¬ ظ…طھط³ظ‚ط© ظ„ط³ظ†ظˆط§طھ. P5 (~5 ظƒط¬ظ…): $20,000-30,000 | UG22 (~22 ظƒط¬ظ…): $40,000-60,000.<br><strong>Loring S30</strong> â€” ظ…ط­ظ…طµط© طµط¯ظٹظ‚ط© ظ„ظ„ط¨ظٹط¦ط© â€” طھط¹ظٹط¯ طھط¯ظˆظٹط± ط§ظ„ط­ط±ط§ط±ط© ظˆطھظˆظپط± 50% ظ…ظ† ط§ظ„ط·ط§ظ‚ط©. $30,000-50,000.<br><strong>Aillio Bullet R1 V2</strong> â€” ط§ظ„ظ€ "Tesla" ظ„ظ„ظ…ط­ط§ظ…طµ â€” ظ…ط­ظ…طµط© ط¯ظˆط§ط±ط© (Drum) ط¨طھط­ظƒظ… ط¥ظ„ظƒطھط±ظˆظ†ظٹ ط¯ظ‚ظٹظ‚طŒ 1 ظƒط¬ظ…. $3,500-4,500. ظ…ط«ط§ظ„ظٹط© ظ„ظ„ظ…ط­ظ…طµ ط§ظ„ظ…ظ†ط²ظ„ظٹ ط§ظ„ظ…ط­طھط±ظپ.</p>
<h3>ًں”§ ط§ظ„ظ…ظٹط²ط§طھ ط§ظ„ط£ط³ط§ط³ظٹط© ط§ظ„طھظٹ طھظپط±ظ‚ ط§ظ„ظ…ط­ظ…طµط© ط§ظ„ظ…ظ…طھط§ط²ط©</h3><p>â€¢ <strong>طھط­ظƒظ… ظپظٹ طھط¯ظپظ‚ ط§ظ„ظ‡ظˆط§ط، (Airflow):</strong> ظٹطھط­ظƒظ… ظپظٹ ط³ط±ط¹ط© ط§ظ†طھظ‚ط§ظ„ ط§ظ„ط­ط±ط§ط±ط© ظˆط¥ط²ط§ظ„ط© ط§ظ„ظ‚ط´ط±ط© â€” ط¶ط±ظˆط±ظٹ ظ„ظ„طھط­ظ…ظٹطµ ط§ظ„ظ…طھط³ظ‚<br>â€¢ <strong>ط£ط®ط° ط§ظ„ط¹ظٹظ†ط§طھ (Triple Sampling):</strong> ط¨ط§ط¨ ط£ط®ط° ط¹ظٹظ†ط© ط£ط«ظ†ط§ط، ط§ظ„طھط­ظ…ظٹطµ â€” ظ„طھظ‚ظٹظٹظ… ط§ظ„ظ„ظˆظ† ظˆط§ظ„طھط·ظˆط±<br>â€¢ <strong>ط¨ط±ظ…ط¬ظٹط§طھ طھطھط¨ط¹ ط§ظ„ظ…ظ†ط­ظ†ظ‰ (Roast Logger):</strong> Artisan, Cropster, Roastmaster â€” ط³ط¬ظ„ ظƒظ„ ظ…ظ†ط­ظ†ظ‰ ظˆظ‚ط§ط±ظ† ط§ظ„ظ†طھط§ط¦ط¬<br>â€¢ <strong>ظ†ط¸ط§ظ… طھط¨ط±ظٹط¯ (Cooling Tray):</strong> ظٹط¨ط±ط¯ ط§ظ„ط¯ظپط¹ط© ظ…ظ† 200آ°ظ… ط¥ظ„ظ‰ 40آ°ظ… ظپظٹ ط£ظ‚ظ„ ظ…ظ† 4 ط¯ظ‚ط§ط¦ظ‚ â€” ظٹظˆظ‚ظپ ط§ظ„طھط­ظ…ظٹطµ ظپظˆط±ط§ظ‹<br>â€¢ <strong>Burner Type:</strong> Gas (ط§ظ„طھط­ظƒظ… ط§ظ„ط£ظپط¶ظ„) vs Infrared (ط£ظ†ط¸ظپ â€” ظ…طھط³ظ‚ ط£ظƒط«ط±) vs Electric (ط«ط§ط¨طھ â€” ظ…ط«ط§ظ„ظٹ ظ„ظ„ظ…ط®طھط¨ط±ط§طھ)</p>
<div class="ok-box"><strong>ًںژ¯ ظ…ط´ط±ظˆط¹:</strong> ط§ط¨ط­ط« ط¹ظ† ظ…ط­ظ…طµط© ظ…ط­ظ„ظٹط© ظˆط§ط³ط£ظ„ ط¹ظ† ظ†ظˆط¹ ظ…ط­ظ…طµطھظ‡ظ… â€” ط§ظ„ط³ط¹ط©طŒ ط§ظ„ط¹ظ…ط±طŒ ط§ظ„طھط­ط¯ظٹط«ط§طھ. ط§ط³ط£ظ„ظ‡ظ… ط¹ظ† ظ…ظٹط²طھظ‡ظ… ط§ظ„ظ…ظپط¶ظ„ط© ظˆط£ظƒط¨ط± ظ…ط´ظƒظ„ط© ظˆط§ط¬ظ‡ظˆظ‡ط§. ظ‡ط°ط§ ط³ظٹط³ط§ط¹ط¯ظƒ ظپظٹ ظ‚ط±ط§ط± ط§ظ„ط´ط±ط§ط، ط¹ظ†ط¯ظ…ط§ طھط¨ط¯ط£!</div>`, en:`<h3>ًں”¥ Roasting Equipment Guide â€” From Frying Pan to Professional Roaster</h3><p>Choosing a coffee roaster is the <strong>biggest investment decision</strong> in a roaster's journey. Equipment ranges from a $20 home pan to $100,000+ industrial roasters. Here's a comprehensive guide to each type.</p>
<div class="img-c"><img src="\${photo('roast')}" alt=""><div class="cap">ًںڈ­ Roasting Equipment â€” From Hand to Commercial</div></div>
<h3>ًںڈ  Home & Small Batch Roasters (0.1-5kg)</h3>
<table><tr><th>Type</th><th>Price Range</th><th>Capacity</th><th>Pros</th><th>Cons</th></tr><tr><td>Pan</td><td>$15-40</td><td>50-100g</td><td>Cheapest â€” learn manual control</td><td>Uneven roast â€” constant stirring â€” no heat control</td></tr><tr><td>Oven</td><td>$0 (already have)</td><td>200-500g</td><td>Larger batches â€” good to start</td><td>Uneven heating â€” difficult fast cooling</td></tr><tr><td>Whirley Pop / Stovetop</td><td>$30-80</td><td>100-200g</td><td>Better heat distribution â€” stirring speed control</td><td>Small capacity â€” physical effort needed</td></tr><tr><td>FreshRoast SR540/SR800</td><td>$200-350</td><td>120-225g</td><td>Hot air roasting â€” clean â€” consistent results</td><td>Limited capacity â€” loud â€” limited curve control</td></tr><tr><td>Behmor 2000AB Plus</td><td>$400-500</td><td>225-450g</td><td>Safe â€” low smoke â€” auto/manual programs</td><td>Weak for dark roasts â€” complex maintenance</td></tr></table>
<h3>ًںڈھ Semi-Pro & Pro Roasters (1-30kg)</h3><p><strong>Diedrich IR-5</strong> â€” The favorite for labs and specialty roasters. Exceptional control via infrared elements. $12,000-18,000.<br><strong>Probat P5/Probat UG22</strong> â€” German engineering â€” the gold standard. Reliable, available parts, consistent results for years. P5 (~5kg): $20,000-30,000 | UG22 (~22kg): $40,000-60,000.<br><strong>Loring S30</strong> â€” Eco-friendly â€” recirculates heat, saving 50% energy. $30,000-50,000.<br><strong>Aillio Bullet R1 V2</strong> â€” The "Tesla" of roasters â€” rotating drum with precise electronic control, 1kg. $3,500-4,500. Perfect for pro home roasters.</p>
<h3>ًں”§ Key Features That Separate Good From Great</h3><p>â€¢ <strong>Airflow Control:</strong> Controls heat transfer speed and chaff removal â€” essential for consistent roasting<br>â€¢ <strong>Triple Sampling Port:</strong> Sample door during roasting â€” evaluate color and development<br>â€¢ <strong>Roast Logger Software:</strong> Artisan, Cropster, Roastmaster â€” log every curve and compare results<br>â€¢ <strong>Cooling Tray:</strong> Cools batch from 200آ°C to 40آ°C in under 4 minutes â€” instantly stops roasting<br>â€¢ <strong>Burner Type:</strong> Gas (best control) vs Infrared (cleaner â€” more consistent) vs Electric (stable â€” ideal for labs)</p>
<div class="ok-box"><strong>ًںژ¯ Project:</strong> Find a local roastery and ask about their roaster â€” capacity, age, upgrades. Ask about their favorite feature and biggest challenge. This will help your purchase decision when you start!</div>`};

L['B1-5'] = {ar:`<h3>ًںڈ­ ط§ظ„ظ…ط­ط§ظ…طµ ط§ظ„ط­ط±ظپظٹط© ظ…ظ‚ط§ط¨ظ„ ط§ظ„طھط¬ط§ط±ظٹط© â€” ظ…ظ‚ط§ط±ظ†ط© ط´ط§ظ…ظ„ط© ظ„ط§ط³طھط±ط§طھظٹط¬ظٹط© ط§ظ„طھط­ظ…ظٹطµ</h3><p>ط¹ظ†ط¯ظ…ط§ طھظ‚ط±ط± ط¨ط¯ط، ظ…ط´ط±ظˆط¹ طھط­ظ…ظٹطµطŒ ط£ظ…ط§ظ…ظƒ <strong>ط®ظٹط§ط±ط§ظ† ط£ط³ط§ط³ظٹط§ظ†</strong>: ظ…ط­ظ…طµط© ط­ط±ظپظٹط© (Artisan) ط£ظˆ طھط¬ط§ط±ظٹط© (Commercial). ط§ظ„ظپط±ظ‚ ظ„ط§ ظٹظ‚طھطµط± ط¹ظ„ظ‰ ط§ظ„ط³ط¹ط© â€” ط¥ظ†ظ‡ <strong>ظپظ„ط³ظپط© ط¹ظ…ظ„ ظƒط§ظ…ظ„ط©</strong>.</p>
<h3>ًں“ٹ ظ…ظ‚ط§ط±ظ†ط© ط§ظ„ظ…ظˆط¯ظٹظ„ظٹظ†</h3>
<table><tr><th>ط§ظ„ظ…ط¹ظٹط§ط±</th><th>ط§ظ„ط­ط±ظپظٹط© (Artisan)</th><th>ط§ظ„طھط¬ط§ط±ظٹط© (Commercial)</th></tr><tr><td>ط§ظ„ط³ط¹ط©</td><td>0.5-15 ظƒط¬ظ…</td><td>15-120+ ظƒط¬ظ…</td></tr><tr><td>ط¹ط¯ط¯ ط§ظ„ط¯ظپط¹ط§طھ ط§ظ„ظٹظˆظ…ظٹ</td><td>3-15 ط¯ظپط¹ط©</td><td>20-80+ ط¯ظپط¹ط©</td></tr><tr><td>ط§ظ„ط¥ظ†طھط§ط¬ ط§ظ„ط£ط³ط¨ظˆط¹ظٹ</td><td>20-200 ظƒط¬ظ…</td><td>500-10,000+ ظƒط¬ظ…</td></tr><tr><td>ط§ظ„ط²ط¨ط§ط¦ظ† ط§ظ„ظ…ط³طھظ‡ط¯ظپظˆظ†</td><td>ظ…ظ‚ط§ظ‡ظٹ Specialty â€” ط£ظپط±ط§ط¯</td><td>ظ…ط­ظ„ط§طھ ط³ظˆط¨ط±ظ…ط§ط±ظƒطھ â€” ظپظ†ط§ط¯ظ‚ â€” ط´ط±ظƒط§طھ</td></tr><tr><td>ط§ظ„طھظ†ظˆط¹ (Origins)</td><td>8-20 ظ†ظˆط¹</td><td>2-6 ط£ظ†ظˆط§ط¹ ط£ط³ط§ط³ظٹط©</td></tr><tr><td>ط³ط¹ط± ط§ظ„ظƒظٹظ„ظˆ ظ„ظ„ط²ط¨ظˆظ†</td><td>$30-60/ظƒط¬ظ…</td><td>$15-25/ظƒط¬ظ…</td></tr><tr><td>ظ‡ط§ظ…ط´ ط§ظ„ط±ط¨ط­</td><td>40-60%</td><td>20-35%</td></tr><tr><td>ط§ظ„ظ…ط±ظˆظ†ط© ظپظٹ ط§ظ„طھط­ظ…ظٹطµ</td><td>ط¹ط§ظ„ظٹط© ط¬ط¯ط§ظ‹ â€” ظƒظ„ ط¯ظپط¹ط© ظپط±ظٹط¯ط©</td><td>ظ…ظ†ط®ظپط¶ط© â€” ظٹط¬ط¨ ط§ظ„ط§طھط³ط§ظ‚ ط§ظ„ظƒط§ظ…ظ„</td></tr></table>
<h3>ًں§  ظ‡ظ„ طھط¨ط¯ط£ Artisan ط£ظ… Commercialطں</h3><p>ط§ط¨ط¯ط£ <strong>Artisan</strong> ط¥ط°ط§:<br>â€¢ طھط±ظٹط¯ ط§ظ„طھط±ظƒظٹط² ط¹ظ„ظ‰ ط§ظ„ط¬ظˆط¯ط© ظ‚ط¨ظ„ ط§ظ„ظƒظ…ظٹط©<br>â€¢ ظ„ط¯ظٹظƒ ط¹ظ„ط§ظ‚ط§طھ ظ…ط¹ ظ…ظ‚ط§ظ‡ظٹ طµط؛ظٹط±ط© طھط¨ط­ط« ط¹ظ† ظ‚ظ‡ظˆط© ظپط±ظٹط¯ط©<br>â€¢ ط£ظ†طھ ظ…ط³طھط¹ط¯ ظ„طھط¹ظ„ظٹظ… ط²ط¨ط§ط¦ظ†ظƒ ط¹ظ† ط§ظ„ط£طµظˆظ„ ظˆط§ظ„ظ…ط¹ط§ظ„ط¬ط§طھ ظˆط§ظ„ظ†ظƒظ‡ط§طھ<br>â€¢ طھط±ظٹط¯ ظ‡ط§ظ…ط´ ط±ط¨ط­ ط£ط¹ظ„ظ‰ â€” ط­طھظ‰ ظ„ظˆ ظƒط§ظ† ط§ظ„ط¥ظ†طھط§ط¬ ط£ظ‚ظ„</p><p>ط§ظ†طھظ‚ظ„ ط¥ظ„ظ‰ <strong>Commercial</strong> ط¥ط°ط§:<br>â€¢ ظ„ط¯ظٹظƒ ط·ظ„ط¨ ط«ط§ط¨طھ ظ…ظ† 5+ ظ…ظ‚ط§ظ‡ظٹ ط£ظˆ ظ…طھط¬ط± ظˆط§ط­ط¯ ظƒط¨ظٹط±<br>â€¢ طھط­طھط§ط¬ ط³ط¹ط© 30+ ظƒط¬ظ…/ط¯ظپط¹ط© ظ„طھظ„ط¨ظٹط© ط§ظ„ط·ظ„ط¨<br>â€¢ ط£ظ†طھ ظ…ط³طھط¹ط¯ ظ„طھظˆط­ظٹط¯ ظ…ظ†ط­ظ†ظٹط§طھ ط§ظ„طھط­ظ…ظٹطµ (Standardization)<br>â€¢ طھط±ظٹط¯ ط¯ط®ظˆظ„ ظ‚ظ†ظˆط§طھ طھظˆط²ظٹط¹ ط£ظˆط³ط¹ (ط³ظˆط¨ط±ظ…ط§ط±ظƒطھطŒ ظپظ†ط§ط¯ظ‚)</p>
<h3>ًں“ˆ ط§ط³طھط±ط§طھظٹط¬ظٹط© ط§ظ„طھظˆط³ط¹ (Scaling Strategy)</h3><p>ط§ظ„ظ†ظ…ظˆط°ط¬ ط§ظ„ط£ظ†ط¬ط­ ظپظٹ ط³ظˆظ‚ Specialty ط§ظ„ط­ط§ظ„ظٹ:<br>1. <strong>ط§ط¨ط¯ط£ طµط؛ظٹط±ط§ظ‹:</strong> ظ…ط­ظ…طµط© 1-3 ظƒط¬ظ… (Aillio Bullet, Diedrich IR-1) â€” ط§ط®طھط¨ط± ط§ظ„ط³ظˆظ‚ ظˆط­ط³ظ‘ظ† ظ…ظ†طھط¬ظƒ<br>2. <strong>ط§ط¨ظ†ظگ ط¬ظ…ظ‡ظˆط±ط§ظ‹:</strong> ط§ظپطھط­ ظƒظˆظپظٹ ظƒظˆط±ظ†ط± ط£ظˆ ظ…ظ‚ظ‡ظ‰ طµط؛ظٹط± â€” ط¨ط¹ ظ‚ظ‡ظˆطھظƒ ظ…ط¨ط§ط´ط±ط© ظ„ظ„ط²ط¨ط§ط¦ظ†<br>3. <strong>ظˆط³ظ‘ط¹ ط¹ظ†ط¯ ط§ظ„ط·ظ„ط¨:</strong> ط¹ظ†ط¯ظ…ط§ طھطµظ„ ظ„ظ€ 80% ظ‚ط¯ط±ط© ط§ظ„ظ…ط­ظ…طµط© ظ„ظ…ط¯ط© 3 ط£ط´ظ‡ط± â†’ ط­ط§ظ† ظˆظ‚طھ ط§ظ„طھظˆط³ط¹<br>4. <strong>ط§ط®طھط± ظ…ط­ظ…طµط© ط£ظƒط¨ط±:</strong> ط§ظ†طھظ‚ظ„ ط¥ظ„ظ‰ 15-30 ظƒط¬ظ… (Probat, Loring) â€” ط­ط§ظپط¸ ط¹ظ„ظ‰ ط¬ظˆط¯ط© ط§ظ„ظ€ Small Batch ظ„ظ„ط²ط¨ط§ط¦ظ† ط§ظ„ظ…ط®ظ„طµظٹظ†</p>
<div class="info-box"><strong>ًں’، ظ†طµظٹط­ط© ظ…ظ† ظ…ط¬ط±ط¨:</strong> <strong>ظ„ط§ طھط´طھط±ظگ ظ…ط­ظ…طµط© ط£ظƒط¨ط± ظ…ظ† ط§ط­طھظٹط§ط¬ظƒ</strong>. ظ…ط­ظ…طµط© 15 ظƒط¬ظ… طھط¹ظ…ظ„ ط¨ط­ظ…ظ„ 2 ظƒط¬ظ… â€” ظ‡ط°ط§ ط؛ظٹط± ظپط¹ط§ظ„ (طھظ‡ط¯ط± ط·ط§ظ‚ط©طŒ ظٹطµط¹ط¨ ط§ظ„طھط­ظƒظ… ط¨ط§ظ„ط­ط±ط§ط±ط©). ط§ط®طھط± ظ…ط­ظ…طµط© ط³ط¹طھظ‡ط§ ط§ظ„ظ‚طµظˆظ‰ = 120% ظ…ظ† ط·ظ„ط¨ظƒ ط§ظ„ظٹظˆظ…ظٹ ط§ظ„ظ…طھظˆظ‚ط¹.</div>
<div class="ok-box"><strong>ًںژ¯ ظ…ط´ط±ظˆط¹:</strong> ط§ظƒطھط¨ ط®ط·ط© ط¹ظ…ظ„ (Business Plan) ظ„ظ…ط­ظ…طµط© ط§ظپطھط±ط§ط¶ظٹط©. ط­ط¯ط¯: ط§ظ„ط³ط¹ط© ط§ظ„ط£ظˆظ„ظٹط©طŒ ط§ظ„طھظ…ظˆظٹظ„طŒ ط¹ط¯ط¯ ط§ظ„ط²ط¨ط§ط¦ظ† ط§ظ„ظ…ط³طھظ‡ط¯ظپظٹظ†طŒ ط³ط¹ط± ط§ظ„ط¨ظٹط¹ ظ„ظ„ظƒظٹظ„ظˆطŒ ط§ظ„طھظƒط§ظ„ظٹظپ ط§ظ„طھط´ط؛ظٹظ„ظٹط©. ط§ط­ط³ط¨ ظ…طھظ‰ طھط­ظ‚ظ‚ ظ†ظ‚ط·ط© ط§ظ„طھط¹ط§ط¯ظ„ (Break-Even).</div>`, en:`<h3>ًںڈ­ Artisan vs Commercial Roasting â€” A Comprehensive Strategy Comparison</h3><p>When deciding to start a roasting business, you face <strong>two fundamental choices</strong>: Artisan or Commercial roastery. The difference isn't just capacity â€” it's a <strong>complete business philosophy</strong>.</p>
<h3>ًں“ٹ Model Comparison</h3>
<table><tr><th>Parameter</th><th>Artisan</th><th>Commercial</th></tr><tr><td>Capacity</td><td>0.5-15 kg</td><td>15-120+ kg</td></tr><tr><td>Daily Batches</td><td>3-15</td><td>20-80+</td></tr><tr><td>Weekly Output</td><td>20-200 kg</td><td>500-10,000+ kg</td></tr><tr><td>Target Customers</td><td>Specialty cafes â€” individuals</td><td>Supermarkets â€” hotels â€” companies</td></tr><tr><td>Variety (Origins)</td><td>8-20 types</td><td>2-6 core types</td></tr><tr><td>Price per kg</td><td>$30-60/kg</td><td>$15-25/kg</td></tr><tr><td>Profit Margin</td><td>40-60%</td><td>20-35%</td></tr><tr><td>Roast Flexibility</td><td>Very high â€” each batch unique</td><td>Low â€” must be fully consistent</td></tr></table>
<h3>ًں§  Artisan or Commercial?</h3><p>Start <strong>Artisan</strong> if:<br>â€¢ You want to focus on quality before quantity<br>â€¢ You have relationships with small cafes seeking unique coffee<br>â€¢ You're ready to educate customers about origins, processing, and flavors<br>â€¢ You want higher margins â€” even with lower output</p><p>Move to <strong>Commercial</strong> if:<br>â€¢ You have steady demand from 5+ cafes or one large store<br>â€¢ You need 30+ kg/batch capacity<br>â€¢ You're ready to standardize roast curves<br>â€¢ You want to enter broader distribution channels (supermarkets, hotels)</p>
<h3>ًں“ˆ Scaling Strategy</h3><p>The most successful model in today's Specialty market:<br>1. <strong>Start small:</strong> 1-3kg roaster (Aillio Bullet, Diedrich IR-1) â€” test the market and refine your product<br>2. <strong>Build an audience:</strong> Open a coffee corner or small cafe â€” sell directly to customers<br>3. <strong>Scale on demand:</strong> When you hit 80% capacity for 3 months â†’ time to expand<br>4. <strong>Choose a larger roaster:</strong> Move to 15-30kg (Probat, Loring) â€” keep Small Batch quality for loyal customers</p>
<div class="info-box"><strong>ًں’، Pro Tip:</strong> <strong>Don't buy a roaster larger than your need</strong>. A 15kg roaster running at 2kg load â€” inefficient (wastes energy, hard to control temperature). Choose a roaster whose max capacity = 120% of your expected daily demand.</div>
<div class="ok-box"><strong>ًںژ¯ Project:</strong> Write a Business Plan for a hypothetical roastery. Decide: initial capacity, funding, target customers, selling price per kg, operational costs. Calculate when you reach Break-Even point.</div>`};

L['B2-3'] = {ar:`<h3>ًں§ھ ظˆطµظپط§طھ ط§ظ„ظ…ط§ط، ط§ظ„ظ…ط«ط§ظ„ظٹط© ظ„ظ„ظ‚ظ‡ظˆط© â€” ط§طµظ†ط¹ ظ…ط§ط،ظƒ ط¨ظ†ظپط³ظƒ</h3><p>ط£ظپط¶ظ„ ظ…ط­ط§ظ…طµ ط§ظ„ط¹ط§ظ„ظ… طھط³طھط®ط¯ظ… <strong>ظ…ط§ط، ظ…طµظ†ظˆط¹ط§ظ‹ ظپظٹ ط§ظ„ظ…ط®طھط¨ط±</strong> ظ„ط¶ظ…ط§ظ† ط§ظ„ط§طھط³ط§ظ‚ ط§ظ„ظƒط§ظ…ظ„. ط¥ظ„ظٹظƒ ظƒظٹظپظٹط© طµظ†ط¹ ظ…ط§ط، ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ط«ط§ظ„ظٹ ظپظٹ ط¨ظٹطھظƒ.</p><h3>ًں§ھ ظˆطµظپط© SCA ط§ظ„ط£ط³ط§ط³ظٹط© â€” Third Wave Water</h3><p>ط§ط¨ط¯ط£ ط¨ظ…ط§ط، ظ…ظ‚ط·ط± (Distilled Water) â€” طµظپط­ط© ط¨ظٹط¶ط§ط،. ط£ط¶ظپ:<br>â€¢ <strong>ط¨ظٹظƒط±ط¨ظˆظ†ط§طھ ط§ظ„طµظˆط¯ظٹظˆظ… (NaHCOâ‚ƒ):</strong> 150 ظ…ظ„ط؛ ظ„ظƒظ„ 1 ظ„طھط± â€” ظٹظˆظپط± ط§ظ„ظ‚ظ„ظˆظٹط© (Buffering capacity)<br>â€¢ <strong>ظƒط¨ط±ظٹطھط§طھ ط§ظ„ظ…ط؛ظ†ظٹط³ظٹظˆظ… (MgSOâ‚„):</strong> 150 ظ…ظ„ط؛ ظ„ظƒظ„ 1 ظ„طھط± â€” ظٹط¶ظٹظپ ط§ظ„ظ…ط؛ظ†ظٹط³ظٹظˆظ… ظ„ظ„ظ†ظƒظ‡ط§طھ ط§ظ„ط­ظ„ظˆط©<br>â€¢ <strong>ظƒظ„ظˆط±ظٹط¯ ط§ظ„ظƒط§ظ„ط³ظٹظˆظ… (CaClâ‚‚):</strong> 100 ظ…ظ„ط؛ ظ„ظƒظ„ 1 ظ„طھط± â€” ظٹط¶ظٹظپ ط§ظ„ظƒط§ظ„ط³ظٹظˆظ… ظ„ظ„ظ‚ظˆط§ظ…</p><h3>ًں“ٹ ظ…ط³طھظˆظٹط§طھ ط§ظ„ظ…ظٹط§ط، ط­ط³ط¨ ط§ظ„ظ‚ظ‡ظˆط©</h3><table><tr><th>ظ†ظˆط¹ ط§ظ„ظ‚ظ‡ظˆط©</th><th>TDS ظ…ط«ط§ظ„ظٹ</th><th>Ca (ظ…ط¬ظ…/ظ„طھط±)</th><th>Mg (ظ…ط¬ظ…/ظ„طھط±)</th><th>HCOâ‚ƒ (ظ…ط¬ظ…/ظ„طھط±)</th></tr><tr><td>ط¥ط³ط¨ط±ظٹط³ظˆ</td><td>100-120</td><td>40-60</td><td>20-30</td><td>40-60</td></tr><tr><td>ظ‚ظ‡ظˆط© ظ…ظ‚ط·ط±ط©</td><td>120-175</td><td>50-80</td><td>10-20</td><td>40-80</td></tr><tr><td>ط¨ظ† ظپط§طھط­ (ط²ظ‡ط±ظٹ)</td><td>80-120</td><td>30-50</td><td>15-25</td><td>30-50</td></tr><tr><td>ط¨ظ† ط¯ط§ظƒظ† (ط´ظˆظƒظˆظ„ط§طھظٹ)</td><td>150-200</td><td>60-100</td><td>5-15</td><td>60-100</td></tr></table><div class="err-box"><strong>â‌Œ ط®ط·ط£ ط´ط§ط¦ط¹:</strong> ط§ط³طھط®ط¯ط§ظ… ط§ظ„ظ…ط§ط، ط§ظ„ظ…ط¹ط¯ظ†ظٹ (Spring Water) ظ…ط¨ط§ط´ط±ط©. ظ…ط§ط، ط§ظ„ظٹظ†ط§ط¨ظٹط¹ ظ…طھط؛ظٹط± ظ…ظˆط³ظ…ظٹط§ظ‹ â€” ظٹط­طھظˆظٹ ط¹ظ„ظ‰ ط¨ظٹظƒط±ط¨ظˆظ†ط§طھ ط£ظƒط«ط± ظ…ظ† ط§ظ„ظ„ط§ط²ظ… (طھظ‚طھظ„ ط§ظ„ط­ظ…ظˆط¶ط©). ط§ط³طھط®ط¯ظ… ظ…ط§ط، ظ…ظ‚ط·ط± ظˆط£ط¶ظپ ط§ظ„ظ…ط¹ط§ط¯ظ† ط¨ظ†ظپط³ظƒ!</div>`, en:`<h3>ًں§ھ DIY Water Recipes â€” Make Your Own Perfect Coffee Water</h3><p>The world's best roasters use <strong>lab-made water</strong> for complete consistency. Here's how to make perfect coffee water at home.</p><h3>ًں§ھ SCA Base Recipe â€” Third Wave Water</h3><p>Start with distilled water â€” a blank slate. Add:<br>â€¢ <strong>Sodium Bicarbonate (NaHCOâ‚ƒ):</strong> 150mg per 1L â€” provides alkalinity (buffering capacity)<br>â€¢ <strong>Magnesium Sulfate (MgSOâ‚„):</strong> 150mg per 1L â€” adds magnesium for sweet flavors<br>â€¢ <strong>Calcium Chloride (CaClâ‚‚):</strong> 100mg per 1L â€” adds calcium for body</p><h3>ًں“ٹ Water Levels by Coffee Type</h3><table><tr><th>Coffee Type</th><th>Ideal TDS</th><th>Ca (mg/L)</th><th>Mg (mg/L)</th><th>HCOâ‚ƒ (mg/L)</th></tr><tr><td>Espresso</td><td>100-120</td><td>40-60</td><td>20-30</td><td>40-60</td></tr><tr><td>Drip coffee</td><td>120-175</td><td>50-80</td><td>10-20</td><td>40-80</td></tr><tr><td>Light roast (floral)</td><td>80-120</td><td>30-50</td><td>15-25</td><td>30-50</td></tr><tr><td>Dark roast (chocolate)</td><td>150-200</td><td>60-100</td><td>5-15</td><td>60-100</td></tr></table><div class="err-box"><strong>â‌Œ Common Mistake:</strong> Using spring water directly. Spring water varies seasonally â€” often too much bicarbonate (kills acidity). Use distilled water and add minerals yourself!</div>`};

L['B2-4'] = {ar:`<h3>ًں’§ ط¹ط³ط± ط§ظ„ظ…ط§ط، ظˆطھط£ط«ظٹط±ظ‡ ط¹ظ„ظ‰ ط§ظ„ظ‚ظ‡ظˆط© â€” ظƒظٹظ…ظٹط§ط، ط§ظ„ط§ط³طھط®ظ„ط§طµ ط§ظ„ظ…ط§ط¦ظٹ</h3><p>ط§ظ„ظ‚ظ‡ظˆط© ط¹ط¨ط§ط±ط© ط¹ظ† <strong>98% ظ…ط§ط،</strong>. ط¬ظˆط¯ط© ط§ظ„ظ…ط§ط، ظ‡ظٹ <strong>ط£ظ‡ظ… ط¹ط§ظ…ظ„ ظ…ظ†ظپط±ط¯</strong> ظٹط¤ط«ط± ط¹ظ„ظ‰ ط·ط¹ظ… ط§ظ„ظ‚ظ‡ظˆط© â€” ط£ظƒط«ط± ظ…ظ† ط¯ط±ط¬ط© ط§ظ„طھط­ظ…ظٹطµ ط£ظˆ ظ…ظ†ط´ط£ ط§ظ„ط¨ظ†. ط§ظ„ظ…ط§ط، ط§ظ„ط³ظٹط¦ ظٹط®ط±ط¨ ط£ظپط¶ظ„ ظ‚ظ‡ظˆط© ظپظٹ ط§ظ„ط¹ط§ظ„ظ….</p>
<div class="img-c"><img src="\${photo('water')}" alt=""><div class="cap">ًں“ٹ ط¹ط³ط± ط§ظ„ظ…ط§ط، â€” طھط£ط«ظٹط±ظ‡ ط¹ظ„ظ‰ ط§ظ„ط§ط³طھط®ظ„ط§طµ ظˆط§ظ„ظ†ظƒظ‡ط©</div></div>
<h3>ًں§ھ ظ…ط§ ظ‡ظˆ "ط¹ط³ط± ط§ظ„ظ…ط§ط،" (Water Hardness)طں</h3><p>ط§ظ„ط¹ط³ط± ظ‡ظˆ <strong>ظƒظ…ظٹط© ط§ظ„ظ…ط¹ط§ط¯ظ† ط§ظ„ط°ط§ط¦ط¨ط©</strong> ظپظٹ ط§ظ„ظ…ط§ط،طŒ ط®طµظˆطµط§ظ‹ ط§ظ„ظƒط§ظ„ط³ظٹظˆظ… (Caآ²âپ؛) ظˆط§ظ„ظ…ط؛ظ†ظٹط³ظٹظˆظ… (Mgآ²âپ؛).<br>â€¢ <strong>ط§ظ„ط¹ط³ط± ط§ظ„ظƒظ„ظٹ (GH):</strong> ظ…ط¬ظ…ظˆط¹ ط§ظ„ظƒط§ظ„ط³ظٹظˆظ… ظˆط§ظ„ظ…ط؛ظ†ظٹط³ظٹظˆظ… â€” ظٹط¤ط«ط± ط¹ظ„ظ‰ ط§ظ„ط§ط³طھط®ظ„ط§طµ<br>â€¢ <strong>ط§ظ„ط¹ط³ط± ط§ظ„ظ‚ظ„ظˆظٹ (KH / Alkalinity):</strong> ظ‚ط¯ط±ط© ط§ظ„ظ…ط§ط، ط¹ظ„ظ‰ ظ…ظ‚ط§ظˆظ…ط© طھط؛ظٹط± ط§ظ„ظ€ pH â€” ظٹط­ظ…ظٹ ط§ظ„ظ‚ظ‡ظˆط© ظ…ظ† ط§ظ„ط­ظ…ظˆط¶ط© ط§ظ„ط²ط§ط¦ط¯ط©<br>â€¢ <strong>TDS (ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ظˆط§ط¯ ط§ظ„طµظ„ط¨ط© ط§ظ„ط°ط§ط¦ط¨ط©):</strong> 0-500+ ط¬ط²ط، ظپظٹ ط§ظ„ظ…ظ„ظٹظˆظ† (ppm) â€” ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ط«ط§ظ„ظٹط©: 75-175 ppm</p>
<table><tr><th>TDS (ppm)</th><th>ط§ظ„طھطµظ†ظٹظپ</th><th>ط§ظ„طھط£ط«ظٹط± ط¹ظ„ظ‰ ط§ظ„ظ‚ظ‡ظˆط©</th></tr><tr><td>0-50</td><td>ظ…ظ†ط®ظپط¶ ط¬ط¯ط§ظ‹ (ظ…ظ‚ط·ط±/ظ…ظ‚ط·ط±)</td><td>ط§ط³طھط®ظ„ط§طµ ط²ط§ط¦ط¯ â€” ط·ط¹ظ… ط£ط¬ظˆظپطŒ ط­ط§ظ…ط¶طŒ ط؛ظٹط± ظ…طھظˆط§ط²ظ†</td></tr><tr><td>75-175</td><td>ظ…ط«ط§ظ„ظٹ ظ„ظ„ظ‚ظ‡ظˆط©</td><td>ط§ط³طھط®ظ„ط§طµ ظ…طھظˆط§ط²ظ† â€” ط­ظ„ط§ظˆط© ظˆط§ط¶ط­ط©طŒ ط­ظ…ظˆط¶ط© ظ…ط´ط±ظ‚ط©</td></tr><tr><td>175-300</td><td>ط¹ط³ط± ظ…طھظˆط³ط·</td><td>ط§ط³طھط®ظ„ط§طµ ظ…ط­ط¯ظˆط¯ â€” ظ†ظƒظ‡ط§طھ ط¨ط§ظ‡طھط©طŒ طھط±ط³ط¨ط§طھ ظƒظ„ط³ظٹط©</td></tr><tr><td>300+</td><td>ط¹ط³ط± ط¹ط§ظ„ظچ</td><td>ط§ط³طھط®ظ„ط§طµ ط¶ط¹ظٹظپ ط¬ط¯ط§ظ‹ â€” ط·ط¹ظ… ظ…ط¹ط¯ظ†طŒ طھط±ط³ط¨ط§طھ ط³ط±ظٹط¹ط© ظپظٹ ط§ظ„ظ…ط¹ط¯ط§طھ</td></tr></table>
<h3>ًںڈ  ط­ظ„ظˆظ„ ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ظ…ط§ط، ظپظٹ ط§ظ„ظ…ظ†ط²ظ„ ظˆط§ظ„ظ…ظ‚ظ‡ظ‰</h3><p>â€¢ <strong>ظپظ„طھط± ظƒط±ط¨ظˆظ†ظٹ (Carbon Filter):</strong> ظٹط²ظٹظ„ ط§ظ„ظƒظ„ظˆط± ظˆط§ظ„ط·ط¹ظ… ط§ظ„ط³ظٹط¦ â€” ظ„ط§ ظٹط؛ظٹط± TDS. ط£ط³ط§ط³ظٹ ظ„ط£ظٹ ظ…ظ‚ظ‡ظ‰.<br>â€¢ <strong>ظ…ظ†ظ‚ظ‘ظٹ ط¨ط§ظ„طھظ†ط§ط¶ط­ ط§ظ„ط¹ظƒط³ظٹ (RO):</strong> ظٹط²ظٹظ„ 95-99% ظ…ظ† ط§ظ„ظ…ط¹ط§ط¯ظ† â€” TDS ظ‚ط±ظٹط¨ ظ…ظ† ط§ظ„طµظپط±. ط¨ط¹ط¯ظ‡ط§ ظ†ط¶ظٹظپ ط£ظ…ظ„ط§ط­ (Third Wave Water) ظ„ط¶ط¨ط· TDS.<br>â€¢ <strong>ط®ظ„ط·ط© ظ…ط§ط، SCA ط§ظ„ظ‚ظٹط§ط³ظٹط©:</strong> ط£ط¶ظپ 0.1 ط¬ط±ط§ظ… ط¨ظٹظƒط±ط¨ظˆظ†ط§طھ ط§ظ„طµظˆط¯ظٹظˆظ… (NaHCOâ‚ƒ) ظˆ 0.15 ط¬ط±ط§ظ… ظƒط¨ط±ظٹطھط§طھ ط§ظ„ظ…ط؛ظ†ظٹط³ظٹظˆظ… (MgSOâ‚„آ·7Hâ‚‚O) ظ„ظƒظ„ ظ„طھط± ظ…ط§ط، ظ…ظ‚ط·ط±<br>â€¢ <strong>ظپظ„طھط± "Pourover" ظ…ظ† ط¨ط±ظٹطھط§ ط£ظˆ ظ…ط§ظٹظپط±:</strong> ظٹط­ط³ظ† ط§ظ„ط·ط¹ظ… ظ„ظƒظ† ظ„ط§ ظٹط¶ط¨ط· TDS ط¨ط¯ظ‚ط© â€” ط­ظ„ ظ…ظ†ط²ظ„ظٹ ط¬ظٹط¯</p>
<div class="hl"><strong>ًں“ٹ طھط£ط«ظٹط± ط§ظ„ظ…ط؛ظ†ظٹط³ظٹظˆظ…:</strong> ط§ظ„ظ…ط؛ظ†ظٹط³ظٹظˆظ… ظٹط±طھط¨ط· ط¨ط£ط­ظ…ط§ط¶ ط§ظ„ظƒظ„ظˆط±ظˆط¬ظٹظ†ظٹظƒ (Chlorogenic Acids) ظˆظٹط³ط­ط¨ظ‡ط§ ظ…ظ† ط§ظ„ظ‚ظ‡ظˆط© ط£ط³ط±ط¹ ط¨ط«ظ„ط§ط« ظ…ط±ط§طھ ظ…ظ† ط§ظ„ظƒط§ظ„ط³ظٹظˆظ…. ط§ظ„ظ…ط§ط، ط§ظ„ط؛ظ†ظٹ ط¨ط§ظ„ظ…ط؛ظ†ظٹط³ظٹظˆظ… ظٹظ†طھط¬ ظ‚ظ‡ظˆط© ط£ظƒط«ط± ط­ظ„ط§ظˆط© ظˆط­ظ…ظˆط¶ط©!</div>
<div class="ok-box"><strong>ًںژ¯ ظ…ط´ط±ظˆط¹:</strong> ط§ط´طھط± ط¬ظ‡ط§ط² TDS Meter (ط£ظ‚ظ„ ظ…ظ† $20). ظ‚ط³ TDS ظ…ط§ط، ط§ظ„طµظ†ط¨ظˆط±طŒ ظ…ط§ط، ط§ظ„ظپظ„طھط±طŒ ظˆظ…ط§ط، ظ…ط¹ط¯ظ†ظٹ. ط¬ط±ط¨ طھط­ط¶ظٹط± ظ†ظپط³ ط§ظ„ظ‚ظ‡ظˆط© ط¨ظƒظ„ ظ†ظˆط¹. ظ„ط§ط­ط¸ ط§ظ„ظپط±ظ‚ ظپظٹ ط§ظ„ط·ط¹ظ…. ط§ط¶ط¨ط· ط¨ظ†ط³ط¨ط© ظ…ط§ط، ظ…ظ‚ط·ط± + ظ…ط§ط، طµظ†ط¨ظˆط± ظ„طھط­طµظ„ ط¹ظ„ظ‰ TDS 150.</div>`, en:`<h3>ًں’§ Water Hardness and Its Impact on Coffee â€” Water Chemistry of Extraction</h3><p>Coffee is <strong>98% water</strong>. Water quality is the <strong>single most important factor</strong> affecting coffee taste â€” more than roast level or origin. Bad water ruins the world's best coffee.</p>
<div class="img-c"><img src="\${photo('water')}" alt=""><div class="cap">ًں“ٹ Water Hardness â€” Its Effect on Extraction & Flavor</div></div>
<h3>ًں§ھ What is Water Hardness?</h3><p>Hardness is the <strong>amount of dissolved minerals</strong> in water, especially calcium (Caآ²âپ؛) and magnesium (Mgآ²âپ؛).<br>â€¢ <strong>General Hardness (GH):</strong> Total calcium + magnesium â€” affects extraction<br>â€¢ <strong>Carbonate Hardness (KH / Alkalinity):</strong> Water's ability to resist pH change â€” protects coffee from excess acidity<br>â€¢ <strong>TDS (Total Dissolved Solids):</strong> 0-500+ ppm â€” ideal coffee: 75-175 ppm</p>
<table><tr><th>TDS (ppm)</th><th>Classification</th><th>Coffee Impact</th></tr><tr><td>0-50</td><td>Very low (distilled/RO)</td><td>Over-extraction â€” hollow, sour, unbalanced</td></tr><tr><td>75-175</td><td>Ideal for coffee</td><td>Balanced extraction â€” clear sweetness, bright acidity</td></tr><tr><td>175-300</td><td>Medium hardness</td><td>Limited extraction â€” muted flavors, scale build-up</td></tr><tr><td>300+</td><td>Hard water</td><td>Very weak extraction â€” metallic taste, rapid scale</td></tr></table>
<h3>ًںڈ  Water Treatment Solutions</h3><p>â€¢ <strong>Carbon Filter:</strong> Removes chlorine and bad taste â€” doesn't change TDS. Essential for any cafe.<br>â€¢ <strong>Reverse Osmosis (RO):</strong> Removes 95-99% of minerals â€” TDS near zero. Then add minerals (Third Wave Water) to adjust TDS.<br>â€¢ <strong>SCA Standard Water Recipe:</strong> Add 0.1g sodium bicarbonate (NaHCOâ‚ƒ) and 0.15g magnesium sulfate (MgSOâ‚„آ·7Hâ‚‚O) per liter of distilled water<br>â€¢ <strong>Brita / Mavea Pitcher:</strong> Improves taste but doesn't control TDS precisely â€” good home solution</p>
<div class="hl"><strong>ًں“ٹ Magnesium Effect:</strong> Magnesium binds with Chlorogenic Acids and extracts them 3x faster than calcium. Magnesium-rich water produces sweeter, more acidic coffee!</div>
<div class="ok-box"><strong>ًںژ¯ Project:</strong> Buy a TDS Meter (under $20). Measure TDS of tap water, filtered water, and bottled water. Brew the same coffee with each. Notice the taste difference. Blend distilled + tap to achieve TDS 150.</div>`};

L['B2-5'] = {ar:`<h3>ًں’§ ظˆطµظپط§طھ ط§ظ„ظ…ط§ط، ط§ظ„ظ…ط«ط§ظ„ظٹط© ظ„ظƒظ„ ط·ط±ظٹظ‚ط© طھط­ط¶ظٹط±</h3><p>ظ„ظƒظ„ ط·ط±ظٹظ‚ط© طھط­ط¶ظٹط±طŒ <strong>ظ…ظ„ظپ ظ…ط§ط¦ظٹ ظ…ط«ط§ظ„ظٹ</strong> ظٹط¨ط±ط² ط£ظپط¶ظ„ ظ…ط§ ظپظٹظ‡ط§. ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ظٹط­طھط§ط¬ ظ…ط§ط،ظ‹ ظ…ط®طھظ„ظپط§ظ‹ ط¹ظ† ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ظ‚ط·ط±ط©. ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط¨ط§ط±ط¯ط© (Cold Brew) طھط­طھط§ط¬ ط´ظٹط¦ط§ظ‹ ط¢ط®ط± طھظ…ط§ظ…ط§ظ‹.</p>
<h3>ًں“ٹ ظ…ظ„ظپط§طھ ط§ظ„ظ…ط§ط، ط§ظ„ظ…ط«ط§ظ„ظٹط© ط­ط³ط¨ ط·ط±ظٹظ‚ط© ط§ظ„طھط­ط¶ظٹط±</h3>
<table><tr><th>ط·ط±ظٹظ‚ط© ط§ظ„طھط­ط¶ظٹط±</th><th>TDS (ppm)</th><th>KH (ppm)</th><th>GH (ppm)</th><th>pH ظ…ط«ط§ظ„ظٹ</th><th>ظ…ظ„ط§ط­ط¸ط§طھ</th></tr><tr><td>ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ</td><td>100-150</td><td>40-60</td><td>50-80</td><td>7.0-7.2</td><td>ظ…ط§ط، ظ†ط§ط¹ظ… ظ‚ظ„ظٹظ„ط§ظ‹ â€” ظٹط­ظ…ظٹ ط§ظ„ط¢ظ„ط© ظˆظٹط¨ط±ط² ط§ظ„ط­ظ„ط§ظˆط©</td></tr><tr><td>ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ظ‚ط·ط±ط© (V60/Chemex)</td><td>75-125</td><td>30-50</td><td>40-70</td><td>6.8-7.0</td><td>TDS ط£ظ‚ظ„ ظٹط¨ط±ط² ط§ظ„ط­ظ…ظˆط¶ط© â€” ظ…ط«ط§ظ„ظٹ ظ„ظ„ظ‚ظ‡ظˆط© ط§ظ„ط®ظپظٹظپط©</td></tr><tr><td>Aeropress</td><td>100-175</td><td>40-60</td><td>50-80</td><td>7.0-7.2</td><td>ظ…ط´ط§ط¨ظ‡ ظ„ظ„ط¥ط³ط¨ط±ظٹط³ظˆ â€” ظˆظ‚طھ ط§ط³طھط®ظ„ط§طµ ظ‚طµظٹط± ظٹط­طھط§ط¬ TDS ط£ط¹ظ„ظ‰</td></tr><tr><td>French Press</td><td>125-175</td><td>50-70</td><td>60-90</td><td>7.0-7.2</td><td>ظ…ط§ط، ط£ط¹ظ„ظ‰ TDS â€” ظٹظˆط§ط²ظ† ط§ظ„ظ‚ظˆط§ظ… ط§ظ„ط«ظ‚ظٹظ„ ظˆط§ظ„ط²ظٹظˆطھ</td></tr><tr><td>Cold Brew</td><td>150-200</td><td>50-80</td><td>70-100</td><td>7.0-7.5</td><td>ط£ط¹ظ„ظ‰ TDS â€” ط§ظ„طھط¹ظ‚ظٹط¯ ط§ظ„ظ…ظ†ط®ظپط¶ ظٹط­طھط§ط¬ ظ…ط§ط، ظ…ط¹ط¯ظ†ظٹ</td></tr><tr><td>Batch Brew</td><td>100-150</td><td>40-60</td><td>50-80</td><td>7.0</td><td>ظ…طھظˆط³ط· â€” ظ…ظ†ط§ط³ط¨ ظ„ط£طµظ†ط§ظپ ظ…طھط¹ط¯ط¯ط©</td></tr></table>
<h3>ًں§ھ ظƒظٹظپظٹط© طµظ†ط¹ ط§ظ„ظ…ط§ط، ط§ظ„ظ…ط«ط§ظ„ظٹ ظپظٹ ط§ظ„ظ…ظ†ط²ظ„</h3><p>ط§ظ„ط·ط±ظٹظ‚ط© ط§ظ„ط£ط³ظ‡ظ„ ظˆط§ظ„ط£ط¯ظ‚: <strong>Third Wave Water</strong> â€” ط£ظƒظٹط§ط³ ط¬ط§ظ‡ط²ط© طھط¶ط§ظپ ط¥ظ„ظ‰ ط§ظ„ظ…ط§ط، ط§ظ„ظ…ظ‚ط·ط±. ظ„ظƒظ„ ظƒظٹط³ ظˆطµظپطھظ‡ ط§ظ„ط®ط§طµط©: "Light Roast", "Dark Roast", "Espresso". ط§ظ„ط·ط±ظٹظ‚ط© ط§ظ„ط£ط±ط®طµ (DIY):<br>â€¢ <strong>ظ„ظ„ظ…ظ‚ط·ط±ط© (V60):</strong> 0.08 ط¬ط±ط§ظ… NaHCOâ‚ƒ + 0.12 ط¬ط±ط§ظ… MgSOâ‚„آ·7Hâ‚‚O ظ„ظƒظ„ 1 ظ„طھط± ظ…ط§ط، ظ…ظ‚ط·ط±<br>â€¢ <strong>ظ„ظ„ط¥ط³ط¨ط±ظٹط³ظˆ:</strong> 0.12 ط¬ط±ط§ظ… NaHCOâ‚ƒ + 0.18 ط¬ط±ط§ظ… MgSOâ‚„آ·7Hâ‚‚O ظ„ظƒظ„ 1 ظ„طھط± ظ…ط§ط، ظ…ظ‚ط·ط±<br>â€¢ <strong>ظ„ظ€ Cold Brew:</strong> 0.15 ط¬ط±ط§ظ… NaHCOâ‚ƒ + 0.25 ط¬ط±ط§ظ… MgSOâ‚„آ·7Hâ‚‚O ظ„ظƒظ„ 1 ظ„طھط± ظ…ط§ط، ظ…ظ‚ط·ط±</p>
<div class="info-box"><strong>ًں’، طھط°ظƒظٹط± ظ…ظ‡ظ…:</strong> <strong>ظ„ط§ طھط³طھط®ط¯ظ… ط£ط¨ط¯ط§ظ‹ ط§ظ„ظ…ط§ط، ط§ظ„ظ…ظ‚ط·ط± ط£ظˆ ط§ظ„ظ€ RO ط¨ظ…ظپط±ط¯ظ‡</strong> â€” ط¨ط¯ظˆظ† ظ…ط¹ط§ط¯ظ†طŒ ط§ظ„ظ…ط§ط، ظٹط³ط­ط¨ ظƒظ…ظٹط© ظ‡ط§ط¦ظ„ط© ظ…ظ† ط§ظ„ظ…ط±ظƒط¨ط§طھ ط§ظ„ظ‚ط§ط¨ظ„ط© ظ„ظ„ط°ظˆط¨ط§ظ† â†’ ط·ط¹ظ… ظ„ط§ط°ط¹طŒ ط£ط¬ظˆظپ. ط§ظ„ظ…ط§ط، ط§ظ„ط®ط§ظ„ظٹ ظ…ظ† ط§ظ„ظ…ط¹ط§ط¯ظ† ظ‡ظˆ ط£ط³ظˆط£ ظ…ط§ط، ظ„ظ„ظ‚ظ‡ظˆط©!</div>
<div class="ok-box"><strong>ًںژ¯ طھط­ط¯ظچ:</strong> ط§ط®طھط± ظ‚ظ‡ظˆطھظƒ ط§ظ„ظ…ظپط¶ظ„ط©. ط­ط¶ظ‘ط±ظ‡ط§ ط¨ط·ط±ظٹظ‚طھظٹظ†: ط¨ظ…ط§ط، طµظ†ط¨ظˆط± ط¹ط§ط¯ظٹ ظˆط¨ظ…ط§ط، ظ…ط¹ط¯ظ„ (ط§ط´طھط± Third Wave Water ط£ظˆ ط­ط¶ظ‘ط± ط¨ظ†ظپط³ظƒ). ط§ط¹ظ…ظ„ Blind Test â€” ظ‡ظ„ طھط³طھط·ظٹط¹ طھط°ظˆظ‚ ط§ظ„ظپط±ظ‚طں ط®ظ…ظ† ط£ظٹ ظپظ†ط¬ط§ظ† ط£ظٹ ظ…ط§ط،!</div>`, en:`<h3>ًں’§ Ideal Water Recipes for Every Brew Method</h3><p>Each brew method has an <strong>ideal water profile</strong> that brings out its best qualities. Espresso needs different water than drip coffee. Cold Brew needs something entirely different.</p>
<h3>ًں“ٹ Ideal Water Profiles by Brew Method</h3>
<table><tr><th>Brew Method</th><th>TDS (ppm)</th><th>KH (ppm)</th><th>GH (ppm)</th><th>Ideal pH</th><th>Notes</th></tr><tr><td>Espresso</td><td>100-150</td><td>40-60</td><td>50-80</td><td>7.0-7.2</td><td>Slightly soft â€” protects machine, highlights sweetness</td></tr><tr><td>Pour Over (V60/Chemex)</td><td>75-125</td><td>30-50</td><td>40-70</td><td>6.8-7.0</td><td>Lower TDS highlights acidity â€” ideal for light roasts</td></tr><tr><td>Aeropress</td><td>100-175</td><td>40-60</td><td>50-80</td><td>7.0-7.2</td><td>Similar to espresso â€” short brew time needs higher TDS</td></tr><tr><td>French Press</td><td>125-175</td><td>50-70</td><td>60-90</td><td>7.0-7.2</td><td>Higher TDS â€” balances heavy body and oils</td></tr><tr><td>Cold Brew</td><td>150-200</td><td>50-80</td><td>70-100</td><td>7.0-7.5</td><td>Highest TDS â€” low complexity needs mineral water</td></tr><tr><td>Batch Brew</td><td>100-150</td><td>40-60</td><td>50-80</td><td>7.0</td><td>Medium â€” suitable for multiple origins</td></tr></table>
<h3>ًں§ھ How to Make Ideal Water at Home</h3><p>Easiest and most accurate: <strong>Third Wave Water</strong> â€” ready-to-use packets added to distilled water. Each packet has its own recipe: "Light Roast", "Dark Roast", "Espresso". Cheaper method (DIY):<br>â€¢ <strong>For Drip (V60):</strong> 0.08g NaHCOâ‚ƒ + 0.12g MgSOâ‚„آ·7Hâ‚‚O per 1L distilled water<br>â€¢ <strong>For Espresso:</strong> 0.12g NaHCOâ‚ƒ + 0.18g MgSOâ‚„آ·7Hâ‚‚O per 1L distilled water<br>â€¢ <strong>For Cold Brew:</strong> 0.15g NaHCOâ‚ƒ + 0.25g MgSOâ‚„آ·7Hâ‚‚O per 1L distilled water</p>
<div class="info-box"><strong>ًں’، Important Reminder:</strong> <strong>Never use distilled or RO water alone</strong> â€” without minerals, water pulls massive amounts of soluble compounds â†’ sour, hollow taste. Mineral-free water is the worst coffee water!</div>
<div class="ok-box"><strong>ًںژ¯ Challenge:</strong> Choose your favorite coffee. Brew it two ways: with regular tap water and with adjusted water (buy Third Wave Water or make your own). Do a blind test â€” can you taste the difference? Guess which cup is which!</div>`};

L['B3-3'] = {ar:`<h3>ًںڈ­ طھط­ط¶ظٹط± ط§ظ„ظƒظ…ظٹط§طھ ط§ظ„ظƒط¨ظٹط±ط© â€” Batch Brew ظ„ظ„طھظ…ظˆظٹظ†</h3><p>ظپظٹ ط§ظ„ظ…ظ‚ظ‡ظ‰ ط§ظ„ظ…ط²ط¯ط­ظ…طŒ ط§ظ„ظ€ Batch Brew ظ‡ظˆ <strong>ط§ظ„ط¹ظ…ظˆط¯ ط§ظ„ظپظ‚ط±ظٹ</strong> ظ„ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ظ‚ط·ط±ط©. ط§ظ„ظ…ظ‚ط§ظ‡ظٹ ط§ظ„ظ…طھظˆط³ط·ط© طھط®ط¯ظ… 50-100 ظƒظˆط¨ Batch Brew ظٹظˆظ…ظٹط§ظ‹. ط¥ظ„ظٹظƒ ظƒظٹظپ طھطµظ†ط¹ظ‡ط§ ظ…طھط³ظ‚ط©.</p>
<div class="img-c"><img src="\${photo('water')}" alt=""><div class="cap">ًںڈ­ طھط­ط¶ظٹط± ط§ظ„ظƒظ…ظٹط§طھ â€” ط§ظ„ط§طھط³ط§ظ‚ ظپظٹ ط§ظ„ط¥ظ†طھط§ط¬ ط§ظ„ظƒط¨ظٹط±</div></div>
<h3>âڑ™ï¸ڈ ط¨ط§ط±ط§ظ…طھط±ط§طھ Batch Brew</h3><table><tr><th>ط§ظ„ط¹ط§ظ…ظ„</th><th>ط§ظ„ظ†ط·ط§ظ‚ ط§ظ„ظ…ط«ط§ظ„ظٹ</th></tr><tr><td>ط­ط¬ظ… ط§ظ„ط¯ظپط¹ط©</td><td>1.5 - 3 ظ„طھط±</td></tr><tr><td>ظ†ط³ط¨ط© ط§ظ„ظ‚ظ‡ظˆط©:ط§ظ„ظ…ط§ط،</td><td>1:16 - 1:18</td></tr><tr><td>ط¯ط±ط¬ط© ط§ظ„ط·ط­ظ†</td><td>ظ…طھظˆط³ط·-ط®ط´ظ† (ط­ط¨ظٹط¨ط§طھ ظƒط§ظ…ظ„ط©)</td></tr><tr><td>ط­ط±ط§ط±ط© ط§ظ„ظ…ط§ط،</td><td>93-96آ°ظ…</td></tr><tr><td>ظˆظ‚طھ ط§ظ„ط§ط³طھط®ظ„ط§طµ</td><td>4-6 ط¯ظ‚ط§ط¦ظ‚</td></tr><tr><td>ظˆظ‚طھ ط§ظ„ط­ظپط¸ (Hold Time)</td><td>ط£ظ‚ظ„ ظ…ظ† 30 ط¯ظ‚ظٹظ‚ط© (Carafe ظ…ط­ظƒظ…ط©)</td></tr></table><h3>ًں§ھ ظ…ط¹ط§ط¯ظ„ط© ط­ط³ط§ط¨ ط§ظ„ط¯ظپط¹ط© â€” ظ…ط«ط§ظ„ ط¹ظ…ظ„ظٹ</h3><p>طھط­طھط§ط¬ 2 ظ„طھط± ظ‚ظ‡ظˆط© (2000 ظ…ظ„):<br>â€¢ 2000 أ· 16 = <strong>125 ط¬ط±ط§ظ… ط¨ظ†</strong> (ظ„ظ†ط³ط¨ط© 1:16)<br>â€¢ ط·ط­ظ†: 60% ظ…طھظˆط³ط· (ظ…ظ‚ظٹط§ط³ 20 ط¹ظ„ظ‰ EK43) + 40% ط®ط´ظ† (ظ…ظ‚ظٹط§ط³ 22)<br>â€¢ ط§ط´ط·ظپ ط§ظ„ظپظ„طھط± ظˆط±ظ‚ظٹط§ظ‹ ظ‚ط¨ظ„ ط§ظ„ط§ط³طھط®ط¯ط§ظ…<br>â€¢ ط§ط¨ط¯ط£ ط§ظ„طµط¨ ط¨ظ€ 60% ظ…ظ† ط§ظ„ظ…ط§ط، ط¯ظپط¹ط© ظˆط§ط­ط¯ط© (Blooming + ط¯ظپط¹ط©)<br>â€¢ ط£ط¶ظپ ط§ظ„ظ€ 40% ط§ظ„ط¨ط§ظ‚ظٹط© ظƒط¯ظپط¹ط© ط¨ط·ظٹط¦ط© ط¨ط¹ط¯ 30 ط«ط§ظ†ظٹط©</p><div class="err-box"><strong>â‌Œ ط®ط·ط£ ط´ط§ط¦ط¹:</strong> ط­ظپط¸ ط§ظ„ظ€ Batch Brew ط¹ظ„ظ‰ ظ…طµط¨ ط³ط§ط®ظ† (Hot Plate) ظ„ط£ظƒط«ط± ظ…ظ† 30 ط¯ظ‚ظٹظ‚ط©. ط§ظ„ط­ط±ط§ط±ط© ط§ظ„ظ…ظ†ط®ظپط¶ط© طھط­ط±ظ‚ ط§ظ„ظ‚ظ‡ظˆط© ظˆطھط¹ط·ظٹ ط·ط¹ظ…ط§ظ‹ ظ…ط¹ط¯ظ†ظٹط§ظ‹. ط§ط³طھط®ط¯ظ… Carafe ظ…ط¹ط²ظˆظ„ط© (Thermal).</div>`, en:`<h3>ًںڈ­ Batch Brew & High Volume â€” Feeding the Masses</h3><p>In a busy cafe, Batch Brew is the <strong>backbone</strong> of drip coffee. Medium cafes serve 50-100 Batch Brew cups daily. Here's how to make it consistent.</p>
<div class="img-c"><img src="\${photo('water')}" alt=""><div class="cap">ًںڈ­ Batch Brew â€” Consistency in Volume Production</div></div>
<h3>âڑ™ï¸ڈ Batch Brew Parameters</h3><table><tr><th>Factor</th><th>Ideal Range</th></tr><tr><td>Batch Size</td><td>1.5 - 3 liters</td></tr><tr><td>Coffee:Water Ratio</td><td>1:16 - 1:18</td></tr><tr><td>Grind Size</td><td>Medium-coarse</td></tr><tr><td>Water Temp</td><td>93-96آ°C</td></tr><tr><td>Extraction Time</td><td>4-6 minutes</td></tr><tr><td>Hold Time</td><td>Under 30 minutes (sealed thermal carafe)</td></tr></table><h3>ًں§ھ Batch Calculation â€” Practical Example</h3><p>Need 2 liters (2000ml):<br>â€¢ 2000 أ· 16 = <strong>125g coffee</strong> (for 1:16 ratio)<br>â€¢ Grind: 60% medium (EK43 setting 20) + 40% coarse (setting 22)<br>â€¢ Rinse paper filter before use<br>â€¢ Start by pouring 60% of water in one go (bloom + main pour)<br>â€¢ Add remaining 40% as slow pour after 30 seconds</p><div class="err-box"><strong>â‌Œ Common Mistake:</strong> Keeping Batch Brew on a hot plate for over 30 minutes. Low heat burns the coffee giving metallic taste. Use a thermal carafe.</div>`};

L['B3-4'] = {ar:`<h3>âڑ™ï¸ڈ ط£ظ†ظˆط§ط¹ ط§ظ„ط·ظˆط§ط­ظٹظ† â€” Burrs vs Blades ظˆطھط£ط«ظٹط±ظ‡ط§ ط¹ظ„ظ‰ ط§ظ„ظ†ظƒظ‡ط©</h3><p>ط§ظ„ط·ط§ط­ظ†ط© ظ‡ظٹ <strong>ط«ط§ظ†ظٹ ط£ظ‡ظ… ظ‚ط·ط¹ط© ظ…ط¹ط¯ط§طھ</strong> ط¨ط¹ط¯ ظ…ط­ظ…طµط© ط§ظ„ظ‚ظ‡ظˆط©. ظ†ظˆط¹ ط§ظ„ط·ط§ط­ظ†ط© ظٹط­ط¯ط¯ طھظˆط²ظٹط¹ ط£ط­ط¬ط§ظ… ط§ظ„ط·ط­ظ† (Particle Size Distribution) â€” ظˆظ‡ظˆ ظ…ط§ ظٹط­ط¯ط¯ ط¬ظˆط¯ط© ط§ظ„ط§ط³طھط®ظ„ط§طµ.</p>
<h3>ًں”ھ ط·ط§ط­ظ†ط© ط§ظ„ط´ظپط±ط§طھ (Blade Grinder)</h3><p>طھط¹ظ…ظ„ ظ…ط«ظ„ ط§ظ„ط®ظ„ط§ط· â€” <strong>ط´ظپط±ط§طھ ظ…ط¹ط¯ظ†ظٹط© طھط¯ظˆط± ط¨ط³ط±ط¹ط© ط¹ط§ظ„ظٹط©</strong> (20,000+ RPM) طھظ‚ط·ط¹ ظˆطھظƒط³ط± ط§ظ„ط­ط¨ط§طھ ط¨ط´ظƒظ„ ط¹ط´ظˆط§ط¦ظٹ. ط§ظ„ظ†طھظٹط¬ط©: طھظˆط²ظٹط¹ ط؛ظٹط± ظ…طھط³ط§ظˆظچ ط¬ط¯ط§ظ‹ â€” ظ…ط³ط­ظˆظ‚ ظ†ط§ط¹ظ… (ظٹطھط³ط¨ط¨ ط¨ظ…ط±ط§ط±ط©) ظ…ط¹ ظ‚ط·ط¹ ط®ط´ظ†ط© (طھط³ط¨ط¨ ط­ظ…ظˆط¶ط© ط؛ظٹط± ظ…ظƒطھظ…ظ„ط©). ط§ظ„ط§ط³طھط®ط¯ط§ظ…: ظپظ‚ط· ظ„ظ„ظ‚ظ‡ظˆط© ط§ظ„ط¹ط§ط¯ظٹط© ط§ظ„ظ…ظ†ط²ظ„ظٹط©. <span class="hl">ظ„ط§ ظٹظˆطµظ‰ ط¨ظ‡ط§ ظ„ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…طھط®طµطµط©.</span></p>
<h3>ًں”„ ط·ط§ط­ظ†ط© ط§ظ„ط­ط¬ط§ط±ط© (Burr Grinder)</h3><p>طھط³طھط®ط¯ظ… <strong>ط­ط¬ط±ظٹظ† ظ…طھظ‚ط§ط¨ظ„ظٹظ†</strong> ظٹط³ط­ظ‚ط§ظ† ط§ظ„ط­ط¨ط© ط¨طھظˆط²ظٹط¹ ظ…طھط³ط§ظˆظچ. ظ†ظˆط¹ط§ظ† ط±ط¦ظٹط³ظٹط§ظ†:<br>â€¢ <strong>Conical Burr (ظ…ط®ط±ظˆط·ظٹط©):</strong> ط­ط¬ط± ظ…ط®ط±ظˆط·ظٹ ط¯ط§ط®ظ„ظٹ ظٹط¯ظˆط± ظ…ظ‚ط§ط¨ظ„ ط­ظ„ظ‚ط© ط®ط§ط±ط¬ظٹط©. ظ…ط«ط§ظ„ظٹط© ظ„ظ„ط¥ط³ط¨ط±ظٹط³ظˆ â€” طھظ†طھط¬ ط·ط­ظ†ط§ظ‹ ظ…طھط³ط§ظˆظٹط§ظ‹ ط¬ط¯ط§ظ‹ ظ…ط¹ ط­ط¯ ط£ط¯ظ†ظ‰ ظ…ظ† ط§ظ„ط­ط±ط§ط±ط©. ظ…ط«ط§ظ„: Baratza Sette 270, Mahlkأ¶nig K30<br>â€¢ <strong>Flat Burr (ظ…ط³ط·ط­ط©):</strong> ط­ط¬ط±طھط§ظ† ظ…ط³ط·ط­طھط§ظ† ظ…طھظˆط§ط²ظٹطھط§ظ†. طھظˆظپط± طھط­ظƒظ…ط§ظ‹ ط¯ظ‚ظٹظ‚ط§ظ‹ ط¬ط¯ط§ظ‹ ظپظٹ طھظˆط²ظٹط¹ ط§ظ„ط·ط­ظ†. ظ…ط«ط§ظ„ظٹط© ظ„ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ظ‚ط·ط±ط© ظˆ Brewing. ظ…ط«ط§ظ„: EK43 (ظ…ط¹ظٹط§ط± ط§ظ„ظ…ظ‚ط§ظ‡ظٹ ط§ظ„ط¹ط§ظ„ظ…ظٹط©), Ditting 804</p>
<h3>ًں“ٹ ظ…ظ‚ط§ط±ظ†ط© طھظˆط²ظٹط¹ ط§ظ„ط·ط­ظ†</h3>
<table><tr><th>ط§ظ„ظ…ط¹ظٹط§ط±</th><th>ط´ظپط±ط§طھ (Blade)</th><th>ظ…ط®ط±ظˆط·ظٹط© (Conical)</th><th>ظ…ط³ط·ط­ط© (Flat)</th></tr><tr><td>ط§ظ†طھط¸ط§ظ… ط§ظ„ط·ط­ظ†</td><td>ط³ظٹط، ط¬ط¯ط§ظ‹</td><td>ط¬ظٹط¯ ط¬ط¯ط§ظ‹</td><td>ظ…ظ…طھط§ط²</td></tr><tr><td>ط¹ط¯ط¯ ط§ظ„ط¬ط³ظٹظ…ط§طھ ط§ظ„ظ†ط§ط¹ظ…ط© (Fines)</td><td>ظƒط«ظٹط± (~25%)</td><td>ظ‚ظ„ظٹظ„ (~10-15%)</td><td>ظ‚ظ„ظٹظ„ ط¬ط¯ط§ظ‹ (~5-10%)</td></tr><tr><td>ط³ط±ط¹ط© ط§ظ„ط¯ظˆط±ط§ظ†</td><td>20,000+ RPM</td><td>500-800 RPM</td><td>1,000-1,400 RPM</td></tr><tr><td>ط§ظ„ط³ط¹ط±</td><td>$15-50</td><td>$200-1,000</td><td>$500-3,000+</td></tr><tr><td>ط§ظ„طھط·ط¨ظٹظ‚ ط§ظ„ظ…ط«ط§ظ„ظٹ</td><td>ظ‚ظ‡ظˆط© ظ…ظ†ط²ظ„ظٹط© ط¹ط§ط¯ظٹط©</td><td>ط¥ط³ط¨ط±ظٹط³ظˆ</td><td>ط¥ط³ط¨ط±ظٹط³ظˆ + ظ‚ظ‡ظˆط© ظ…ظ‚ط·ط±ط©</td></tr></table>
<h3>ًں”§ طµظٹط§ظ†ط© ط§ظ„ط·ظˆط§ط­ظٹظ† â€” ط£ظ‡ظ… ظ†ظ‚ط·ط© ظٹطھط¬ط§ظ‡ظ„ظ‡ط§ ط§ظ„ظ…ط¨طھط¯ط¦ظˆظ†</h3><p><strong>ظ†ط¸ظپ ط·ط§ط­ظ†طھظƒ ظƒظ„ ط£ط³ط¨ظˆط¹:</strong> ط§ظ„ط²ظٹظˆطھ ط§ظ„ظ…طھط±ط§ظƒظ…ط© طھظپط³ط¯ ط§ظ„ظ†ظƒظ‡ط© ظˆطھط²ظٹط¯ ط§ظ„ط§ط­طھظƒط§ظƒ. ط§ط³طھط®ط¯ظ… ظپط±ط´ط§ط© ظˆ Grindz (ط­ط¨ظٹط¨ط§طھ طھظ†ط¸ظٹظپ) â€” ظ„ط§ طھط³طھط®ط¯ظ… ط§ظ„ظ…ط§ط، ط£ط¨ط¯ط§ظ‹. <strong>ط؛ظٹظ‘ط± ط§ظ„ط­ط¬ط§ط±ط©:</strong> ط§ظ„ط­ط¬ط§ط±ط© ط§ظ„ظ…ط³ط·ط­ط© طھط­طھط§ط¬ طھط؛ظٹظٹط± ظƒظ„ 500-1000 ظƒط¬ظ… (ط­ط³ط¨ ط§ظ„طµظ„ط§ط¨ط©). ط§ظ„ط­ط¬ط§ط±ط© ط§ظ„ظ…ط®ط±ظˆط·ظٹط© طھط¯ظˆظ… 2-3 ط£ط¶ط¹ط§ظپ.</p>
<div class="ok-box"><strong>ًںژ¯ ظ…ط´ط±ظˆط¹:</strong> ط§ط¨ط­ط« ط¹ظ† ط·ط§ط­ظ†ط© ظپظٹ ظ…ظ‚ظ‡ظ‰ ظ…ط­ظ„ظٹ ظˆط§ط³ط£ظ„ظ‡ظ… ط¹ظ† ظ†ظˆط¹ ط§ظ„ط­ط¬ط§ط±ط©. ط¬ط±ط¨ ط·ط­ظ† ظ†ظپط³ ط§ظ„ظ‚ظ‡ظˆط© ط¹ظ„ظ‰ 3 ط¯ط±ط¬ط§طھ ط·ط­ظ† ظ…ط®طھظ„ظپط© ظˆط­ط¶ظ‘ط±ظ‡ط§. ظ„ط§ط­ط¸ ظƒظٹظپ ظٹط¤ط«ط± ط­ط¬ظ… ط§ظ„ط·ط­ظ† ط¹ظ„ظ‰ ظ…ط¯ط© ط§ظ„ط§ط³طھط®ظ„ط§طµ ظˆط§ظ„ط·ط¹ظ….</div>`, en:`<h3>âڑ™ï¸ڈ Grinder Types â€” Burrs vs Blades and Their Flavor Impact</h3><p>The grinder is the <strong>second most important piece of equipment</strong> after the coffee roaster. The grinder type determines the Particle Size Distribution (PSD) â€” which determines extraction quality.</p>
<h3>ًں”ھ Blade Grinder</h3><p>Works like a blender â€” <strong>metal blades spinning at high speed</strong> (20,000+ RPM) chopping and breaking beans randomly. Result: very uneven distribution â€” fine powder (causing bitterness) with coarse chunks (causing under-extracted sourness). Use: only for regular household coffee. <span class="hl">Not recommended for specialty coffee.</span></p>
<h3>ًں”„ Burr Grinder</h3><p>Uses <strong>two opposing surfaces</strong> that crush the bean with even distribution. Two main types:<br>â€¢ <strong>Conical Burr:</strong> A cone-shaped inner burr spins against an outer ring. Ideal for espresso â€” produces very even grind with minimal heat. Examples: Baratza Sette 270, Mahlkأ¶nig K30<br>â€¢ <strong>Flat Burr:</strong> Two parallel flat discs. Provides very precise control over grind distribution. Ideal for drip coffee and brewing. Examples: EK43 (global cafe standard), Ditting 804</p>
<h3>ًں“ٹ Grind Distribution Comparison</h3>
<table><tr><th>Parameter</th><th>Blade</th><th>Conical</th><th>Flat</th></tr><tr><td>Grind Uniformity</td><td>Very poor</td><td>Very good</td><td>Excellent</td></tr><tr><td>Fines Percentage</td><td>High (~25%)</td><td>Low (~10-15%)</td><td>Very low (~5-10%)</td></tr><tr><td>RPM</td><td>20,000+</td><td>500-800</td><td>1,000-1,400</td></tr><tr><td>Price</td><td>$15-50</td><td>$200-1,000</td><td>$500-3,000+</td></tr><tr><td>Best For</td><td>Regular household</td><td>Espresso</td><td>Espresso + Drip</td></tr></table>
<h3>ًں”§ Grinder Maintenance â€” The Overlooked Key</h3><p><strong>Clean your grinder weekly:</strong> Built-up oils ruin flavor and increase friction. Use a brush and Grindz (cleaning pellets) â€” never use water. <strong>Replace burrs:</strong> Flat burrs need replacement every 500-1000kg (depending on hardness). Conical burrs last 2-3x longer.</p>
<div class="ok-box"><strong>ًںژ¯ Project:</strong> Find a grinder at a local cafe and ask about their burr type. Try grinding the same coffee at 3 different grind sizes and brew. Note how grind size affects extraction time and flavor.</div>`};

L['B3-5'] = {ar:`<h3>ًںژ¯ ط§ظ„ظ€ Dialing In ط§ظ„ظ…ظ†ظ‡ط¬ظٹ â€” ظ…ظ† ط§ظ„طھط®ظ…ظٹظ† ط¥ظ„ظ‰ ط§ظ„ط¯ظ‚ط© ط§ظ„ط¹ظ„ظ…ظٹط©</h3><p>ط§ظ„ظ€ Dialing In ظ‡ظˆ <strong>ط¹ظ…ظ„ظٹط© ط¶ط¨ط· ظ…طھط؛ظٹط±ط§طھ ط§ظ„طھط­ط¶ظٹط±</strong> ظ„ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط£ظپط¶ظ„ ط§ط³طھط®ظ„ط§طµ ظ…ظ…ظƒظ†. ط¨ط¯ظˆظ† ظ…ظ†ظ‡ط¬ظٹط©طŒ ط£ظ†طھ طھط®ظ…ظ†. ظ…ط¹ ط§ظ„ظ…ظ†ظ‡ط¬ظٹط©طŒ ط£ظ†طھ <strong>طھطھط­ظƒظ… ط¹ظ„ظ…ظٹط§ظ‹</strong> ظپظٹ ط§ظ„ظ†طھظٹط¬ط©.</p>
<h3>ًں“گ ط§ظ„ط¥ط·ط§ط± ط§ظ„ط®ظ…ط§ط³ظٹ ظ„ظ„ظ€ Dialling In</h3>
<table><tr><th>ط§ظ„ظ…طھط؛ظٹط±</th><th>ط§ظ„طھط£ط«ظٹط±</th><th>ط®ط·ظˆط© ط§ظ„طھط¹ط¯ظٹظ„ ط§ظ„ط£ظˆظ„ظ‰</th></tr><tr><td>1. ط¯ط±ط¬ط© ط§ظ„ط·ط­ظ†</td><td>ط£ظƒط¨ط± طھط£ط«ظٹط± â€” ظٹط­ط¯ط¯ ظ…ط¹ط¯ظ„ ط§ظ„ط§ط³طھط®ظ„ط§طµ</td><td>ط£ط±ظپط¹ ط¥ط°ط§ ط§ظ„ط§ط³طھط®ظ„ط§طµ ط¨ط·ظٹط، ط¬ط¯ط§ظ‹ / ط£ظ†ط¹ظ… ط¥ط°ط§ ط³ط±ظٹط¹ ط¬ط¯ط§ظ‹</td></tr><tr><td>2. ط§ظ„ط¬ط±ط¹ط©</td><td>ظٹط­ط¯ط¯ طھط±ظƒظٹط² ط§ظ„ط§ط³طھط®ظ„ط§طµ</td><td>ط«ط¨ظ‘طھ ط§ظ„ط¬ط±ط¹ط© ط£ظˆظ„ط§ظ‹ ط«ظ… ط§ط¶ط¨ط· ط§ظ„ط·ط­ظ†</td></tr><tr><td>3. ط¯ط±ط¬ط© ط§ظ„ط­ط±ط§ط±ط©</td><td>ظٹط¤ط«ط± ط¹ظ„ظ‰ ط³ط±ط¹ط© ط§ظ„ط§ط³طھط®ظ„ط§طµ ظˆظ†ظˆط¹ ط§ظ„ظ…ط±ظƒط¨ط§طھ</td><td>ط¥ط°ط§ ظƒط§ظ† ط§ظ„ط·ط¹ظ… "ط¨ط§ظƒظٹ" â€” ط§ط±ظپط¹ ط§ظ„ط­ط±ط§ط±ط© 1-2آ°ظ…</td></tr><tr><td>4. ظˆظ‚طھ ط§ظ„ط§ط³طھط®ظ„ط§طµ</td><td>ظ†طھظٹط¬ط© â€” ظٹظ…ظƒظ† ط§ظ„طھط­ظƒظ… ظپظٹظ‡ ط¨ط§ظ„ط·ط­ظ† ظˆط§ظ„ط¬ط±ط¹ط©</td><td>ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ: 25-30 ط«ط§ظ†ظٹط© | ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ظ‚ط·ط±ط©: 2:30-4:00 ط¯</td></tr><tr><td>5. طھظˆط²ظٹط¹ ط§ظ„ظ…ط§ط، (ظپظٹ ط§ظ„ظ…ظ‚ط·ط±ط©)</td><td>ظٹط¤ط«ط± ط¹ظ„ظ‰ ط§ظ„طھط¬ط§ظ†ط³</td><td>ط¬ط±ط¨ Pulse Pouring ط¨ط¯ظ„ط§ظ‹ ظ…ظ† ط§ظ„ط¯ظپط¹ط© ط§ظ„ظˆط§ط­ط¯ط©</td></tr></table>
<h3>ًں§ھ ظ…ظ†ظ‡ط¬ظٹط© ط§ظ„ظ€ Dialling In ظ„ظ„ط¥ط³ط¨ط±ظٹط³ظˆ (5 ط®ط·ظˆط§طھ)</h3><p><strong>ط§ظ„ط®ط·ظˆط© 1 â€” ط«ط¨ظ‘طھ ط§ظ„ط£ط³ط§ط³:</strong> ط¬ط±ط¹ط© 18 ط¬ط±ط§ظ…طŒ ط­ط±ط§ط±ط© 93آ°ظ…طŒ ظ†ط³ط¨ط© 1:2 (36 ط¬ط±ط§ظ… ط¥ط³ط¨ط±ظٹط³ظˆ)<br><strong>ط§ظ„ط®ط·ظˆط© 2 â€” ط¬ط±ط¨ ط·ط­ظ† "ظ…ط±ط¬ط¹ظٹ":</strong> ط¥ط°ط§ ط®ط±ط¬طھ 36 ط¬ط±ط§ظ… ظپظٹ 18 ط«ط§ظ†ظٹط© â†’ ط§ظ„ط·ط­ظ† ط®ط´ظ† ط¬ط¯ط§ظ‹. ظپظٹ 40 ط«ط§ظ†ظٹط© â†’ ط§ظ„ط·ط­ظ† ظ†ط§ط¹ظ… ط¬ط¯ط§ظ‹. ط§ظ„ظ…ط«ط§ظ„ظٹ: 25-30 ط«ط§ظ†ظٹط©.<br><strong>ط§ظ„ط®ط·ظˆط© 3 â€” ط§ط¶ط¨ط· ط§ظ„ط·ط­ظ†:</strong> ط£ط±ظپط¹ ط¨ظ†ظ‚ط±ط© ظˆط§ط­ط¯ط© (One Microstep) ط¥ط°ط§ ط³ط±ظٹط¹ ط¬ط¯ط§ظ‹. ط£ظ†ط¹ظ… ط¨ظ†ظ‚ط±ط© ط¥ط°ط§ ط¨ط·ظٹط، ط¬ط¯ط§ظ‹. ط£ط¹ط¯ ط§ظ„ظ…ط­ط§ظˆظ„ط©.<br><strong>ط§ظ„ط®ط·ظˆط© 4 â€” ط­ط³ظ‘ظ† ط§ظ„ط·ط¹ظ…:</strong> ظˆطµظ„طھ ظ„ظ„ظˆظ‚طھ ط§ظ„ظ…ظ†ط§ط³ط¨ ظ„ظƒظ† ط§ظ„ط·ط¹ظ… ط­ط§ظ…ط¶طں â†’ ط§ظ„ط¬ط±ط¹ط© ط£ظƒط¨ط± ط£ظˆ ط§ظ„ظ…ط§ط، ط£ط¯ظپط£. ط§ظ„ط·ط¹ظ… ظ…ط±طں â†’ ط§ظ„ط¬ط±ط¹ط© ط£ظ‚ظ„ ط£ظˆ ط£ط±ظپط¹ ط§ظ„ط·ط­ظ†.<br><strong>ط§ظ„ط®ط·ظˆط© 5 â€” ط³ط¬ظ„:</strong> ط§ظƒطھط¨ ظƒظ„ ط´ظٹط، â€” ظˆظ‚طھطŒ ط¬ط±ط¹ط©طŒ ط¯ط±ط¬ط© ط·ط­ظ†طŒ ط­ط±ط§ط±ط©طŒ TDSطŒ ظ†طھظٹط¬ط© ط§ظ„طھط°ظˆظ‚. ط¨ط¯ظˆظ† طھط³ط¬ظٹظ„طŒ ط£ظ†طھ طھط¹ظٹط¯ ظ†ظپط³ ط§ظ„ط£ط®ط·ط§ط،.</p>
<div class="hl"><strong>ًں“ٹ ظ…ط¹ط§ط¯ظ„ط© ط§ظ„ظ€ Yield:</strong> Weight Out (ظ†ط§طھط¬ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ) أ· Weight In (ط§ظ„ط¬ط±ط¹ط©) = Ratio. ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ط§ظ„طھظ‚ظ„ظٹط¯ظٹ: 1:2. Modern (Lungo): 1:3. Ristretto: 1:1.5</div>
<div class="info-box"><strong>ًں’، ظ‚ط§ط¹ط¯ط© Squad:</strong> ط؛ظٹط± ظ…طھط؛ظٹط±ط§ظ‹ ظˆط§ط­ط¯ط§ظ‹ ظپظ‚ط· ظپظٹ ظƒظ„ ظ…ط±ط©. ط¥ط°ط§ ط؛ظٹط±طھ ط§ظ„ط·ط­ظ† ظˆط¯ط±ط¬ط© ط§ظ„ط­ط±ط§ط±ط© ظ…ط¹ط§ظ‹ â†’ ظ„ط§ طھط¹ط±ظپ ط£ظٹظ‡ظ…ط§ ظپط¹ظ„ ط§ظ„ظپط±ظ‚. ط§ظ„طھط؛ظٹظٹط± ط§ظ„ظˆط­ظٹط¯ ط§ظ„ظ…طھط؛ظٹط± = ط¯ظ‚ط© ظ‚ط§ط¨ظ„ط© ظ„ظ„طھظƒط±ط§ط±.</div>
<div class="ok-box"><strong>ًںژ¯ طھط­ط¯ظٹ 21 ظٹظˆظ…ط§ظ‹:</strong> ظƒظ„ ظٹظˆظ…طŒ ط­ط¶ظ‘ط± ط¥ط³ط¨ط±ظٹط³ظˆ (ط£ظˆ ظ‚ظ‡ظˆط© ظ…ظ‚ط·ط±ط©) ظˆط³ط¬ظ„ ط§ظ„ط¨ط§ط±ط§ظ…طھط±ط§طھ ظˆط§ظ„ط·ط¹ظ…. ط¨ط¹ط¯ 21 ظٹظˆظ…ط§ظ‹طŒ ط±ط§ط¬ط¹ ظ…ظ„ط§ط­ط¸ط§طھظƒ. ط³طھظ†ط¯ظ‡ط´ ظ…ظ† طھط·ظˆط± ط°ط§ط¦ظ‚طھظƒ!</div>`, en:`<h3>ًںژ¯ Systematic Dialing In â€” From Guessing to Scientific Precision</h3><p>Dialing In is the <strong>process of adjusting brew variables</strong> to achieve optimal extraction. Without a methodology, you're guessing. With methodology, you're <strong>scientifically in control</strong>.</p>
<h3>ًں“گ The Five-Variable Framework</h3>
<table><tr><th>Variable</th><th>Impact</th><th>First Adjustment</th></tr><tr><td>1. Grind Size</td><td>Largest impact â€” determines extraction rate</td><td>Coarser if extraction too slow / Finer if too fast</td></tr><tr><td>2. Dose</td><td>Determines extraction concentration</td><td>Lock dose first then adjust grind</td></tr><tr><td>3. Temperature</td><td>Affects extraction speed and compound type</td><td>If "baked" taste â€” raise temp 1-2آ°C</td></tr><tr><td>4. Extraction Time</td><td>Result â€” controllable via grind and dose</td><td>Espresso: 25-30s | Drip: 2:30-4:00 min</td></tr><tr><td>5. Water Distribution (Drip)</td><td>Affects evenness</td><td>Try Pulse Pouring vs single pour</td></tr></table>
<h3>ًں§ھ Espresso Dialing In (5 Steps)</h3><p><strong>Step 1 â€” Lock baseline:</strong> 18g dose, 93آ°C, 1:2 ratio (36g espresso)<br><strong>Step 2 â€” Try "reference" grind:</strong> If 36g in 18s â†’ grind too coarse. 40s â†’ too fine. Target: 25-30s.<br><strong>Step 3 â€” Adjust grind:</strong> One microstep coarser if too fast. One finer if too slow. Retry.<br><strong>Step 4 â€” Fine-tune taste:</strong> Time correct but sour? â†’ higher dose or hotter water. Bitter? â†’ lower dose or coarser grind.<br><strong>Step 5 â€” Log:</strong> Write everything â€” time, dose, grind, temp, TDS, taste score. Without logging, you repeat mistakes.</p>
<div class="hl"><strong>ًں“ٹ Yield Formula:</strong> Weight Out أ· Weight In = Ratio. Traditional espresso: 1:2. Modern (Lungo): 1:3. Ristretto: 1:1.5</div>
<div class="info-box"><strong>ًں’، Golden Rule:</strong> Change only ONE variable at a time. If you change grind AND temperature together â†’ you won't know which made the difference. Single variable change = reproducible precision.</div>
<div class="ok-box"><strong>ًںژ¯ 21-Day Challenge:</strong> Every day, brew espresso (or drip) and log parameters and taste. After 21 days, review your notes. You'll be amazed at how your palate develops!</div>`};

L['C1-3'] = {ar:`<h3>ًں”چ ط¹ظٹظˆط¨ ط§ظ„ظ‚ظ‡ظˆط© â€” ظƒظٹظپ طھط´ط®طµ ط§ظ„ظ…ط´ظƒظ„ط© ظ…ظ† ط§ظ„ط·ط¹ظ…طں</h3><p>طھط°ظˆظ‚ ط§ظ„ط¹ظٹظˆط¨ ظ…ظ‡ظ… ط¨ظ‚ط¯ط± طھط°ظˆظ‚ ط§ظ„طµظپط§طھ ط§ظ„ط¬ظٹط¯ط©. ط§ظ„ظ…ظ‚ظٹظ… ط§ظ„ظ…ط­طھط±ظپ <strong>ظٹطھط¹ط±ظپ ط¹ظ„ظ‰ ط§ظ„ظ…ط´ظƒظ„ط© ظپظˆط±ط§ظ‹</strong> ظˆظٹط¹ط±ظپ ظ…طµط¯ط±ظ‡ط§. ط¥ظ„ظٹظƒ ط£ظƒط«ط± 10 ط¹ظٹظˆط¨ ط´ظٹظˆط¹ط§ظ‹.</p><table><tr><th>ط§ظ„ط¹ظٹط¨</th><th>ط§ظ„ط·ط¹ظ…/ط§ظ„ط±ط§ط¦ط­ط©</th><th>ط§ظ„ط³ط¨ط¨</th></tr><tr><td>ظ‚ط¯ظٹظ… (Old Crop)</td><td>ط®ط´ط¨ ط¬ط§ظپطŒ ظƒط±طھظˆظ†</td><td>طھط®ط²ظٹظ† ط£ظƒط«ط± ظ…ظ† 12 ط´ظ‡ط±ط§ظ‹ ط¨ط¹ط¯ ط§ظ„ط­طµط§ط¯</td></tr><tr><td>ظپظٹظ†ظˆظ„ظٹ (Phenolic)</td><td>ط¯ظˆط§ط،طŒ ط¨ظ„ط§ط³طھظٹظƒطŒ ظƒظ„ظˆط±</td><td>ط§ط³طھط®ط¯ط§ظ… ظ…ط¨ظٹط¯ط§طھ ط؛ظٹط± ظ…ظ†ط§ط³ط¨ط© ط£ظˆ طھظ„ظˆط« ط§ظ„ظ…ط§ط،</td></tr><tr><td>طھط±ط§ط¨ظٹ (Earthy)</td><td>طھط±ط¨ط©طŒ ط¹ظژظپظژظ†</td><td>طھط®ظ…ظٹط± ط؛ظٹط± طµط­ظٹط­ ظپظٹ ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ظ…ط؛ط³ظˆظ„ط©</td></tr><tr><td>ط®ط§ظ…ط± (Ferment)</td><td>ط®ظ„ظ‘طŒ ظپط§ظƒظ‡ط© ظپط§ط³ط¯ط©</td><td>طھط®ظ…ظٹط± ط²ط§ط¦ط¯ ط£ظˆ طھط¬ظپظٹظپ ط؛ظٹط± ظ…طھط³ط§ظˆظچ</td></tr><tr><td>ظ„ط­ظ…ظٹ (Meaty/Hide)</td><td>ط¬ظ„ط¯ ط­ظٹظˆط§ظ†طŒ ظ…ط³ظ„ط®</td><td>طھظ„ظˆط« ط£ط«ظ†ط§ط، ط§ظ„طھط®ظ…ظٹط± (ط­ظٹظˆط§ظ†ط§طھ ط¯ط®ظ„طھ ط§ظ„ط£ط­ظˆط§ط¶)</td></tr><tr><td>ط¯ط®ط§ظ†ظٹ (Smoky)</td><td>ط¯ط®ط§ظ† ظ…ط¨ط§ط´ط±</td><td>طھط­ظ…ظٹطµ ط¨ظ„ظ‡ط¨ ظ…ظ„ط§ظ…ط³ ظ„ظ„ط¨ظ† (ظپظ„طھط± ط§ظ„ط£ط´ط¹ط© طھط­طھ ط§ظ„ط­ظ…ط±ط§ط، ظ…ط¹ط·ظ„)</td></tr><tr><td>ط¨ط§ظƒظٹ (Baked)</td><td>ط¨ط³ظƒظˆظٹطھ ظ…ط³ط·ط­طŒ ط´ظˆظپط§ظ†</td><td>طھط­ظ…ظٹطµ ط¨ط­ط±ط§ط±ط© ظ…ظ†ط®ظپط¶ط© ط¬ط¯ط§ظ‹ ط£ظˆ ظ…ظ†ط­ظ†ظ‰ ظ…ط³ط·ط­ ط¬ط¯ط§ظ‹</td></tr><tr><td>ط®ط¶ط±ط§ط، (Under-developed)</td><td>ط¨ط§ط²ظ„ط§ط،طŒ ظ‚ط´</td><td>ظˆظ‚طھ طھط·ظˆظٹط± ظ‚طµظٹط± ط¬ط¯ط§ظ‹ (ط£ظ‚ظ„ ظ…ظ† 15%)</td></tr><tr><td>ظ…ط­ط±ظˆظ‚ط© (Scorched)</td><td>ط±ظ…ط§ط¯طŒ ط³ظٹط¬ط§ط±ط©</td><td>طھط­ظ…ظٹطµ ط¨ط­ط±ط§ط±ط© ط¹ط§ظ„ظٹط© ط¬ط¯ط§ظ‹ ظپظٹ ط§ظ„ط¨ط¯ط§ظٹط©</td></tr><tr><td>ط·ظٹظ†ظٹ (Muddy)</td><td>ط·ظ…ظٹطŒ ط¹ظƒط±</td><td>ظ†ظ‚ط¹ ط·ظˆظٹظ„ ط¬ط¯ط§ظ‹ ط£ظˆ ط·ط­ظ† ظ†ط§ط¹ظ… ط¬ط¯ط§ظ‹ ظ„ظ„طھط­ط¶ظٹط±</td></tr></table><div class="ok-box"><strong>ًںژ¯ طھظ…ط±ظٹظ†:</strong> ط§ط¨ط­ط« ط¹ظ† ظ‚ظ‡ظˆط© "ظ…ط¹ظٹط¨ط©" ط¹ظ† ظ‚طµط¯ â€” ط§طھط±ظƒ ط¨ظ†ط§ظ‹ ظ…ط­ظ…طµط§ظ‹ ظ…ظپطھظˆط­ط§ظ‹ ظ„ظ…ط¯ط© ط£ط³ط¨ظˆط¹ظٹظ†. طھط°ظˆظ‚ظ‡ط§. طھط¹ط±ظپ ط¹ظ„ظ‰ ط·ط¹ظ… "ط§ظ„ظ‚ط¯ظٹظ…". ط§ظ„ط¢ظ† ط³طھط¹ط±ظپ ط§ظ„ظپط±ظ‚ ط¹ظ†ط¯ظ…ط§ طھط´ط±ط¨ ظ‚ظ‡ظˆط© ط·ط§ط²ط¬ط©!</div>`, en:`<h3>ًں”چ Coffee Defects â€” Diagnose Problems by Taste</h3><p>Tasting defects is as important as tasting good qualities. A professional evaluator <strong>recognizes problems instantly</strong> and knows their source. Here are the 10 most common defects.</p><table><tr><th>Defect</th><th>Taste/Smell</th><th>Cause</th></tr><tr><td>Old Crop</td><td>Dry wood, cardboard</td><td>Storage over 12 months post-harvest</td></tr><tr><td>Phenolic</td><td>Medicine, plastic, chlorine</td><td>Improper pesticides or water contamination</td></tr><tr><td>Earthy</td><td>Soil, mold</td><td>Improper fermentation in washed processing</td></tr><tr><td>Ferment</td><td>Vinegar, rotten fruit</td><td>Over-fermentation or uneven drying</td></tr><tr><td>Meaty/Hide</td><td>Animal skin</td><td>Contamination during fermentation (animals in tanks)</td></tr><tr><td>Smoky</td><td>Direct smoke</td><td>Roasting with flame touching beans (IR filter broken)</td></tr><tr><td>Baked</td><td>Flat biscuit, oatmeal</td><td>Roasting at too low temp or too flat curve</td></tr><tr><td>Under-developed</td><td>Peas, straw</td><td>Development time too short (under 15%)</td></tr><tr><td>Scorched</td><td>Ash, cigarette</td><td>Very high heat at roast start</td></tr><tr><td>Muddy</td><td>Silt, cloudy</td><td>Over-extraction or too fine grind for brewing method</td></tr></table><div class="ok-box"><strong>ًںژ¯ Exercise:</strong> Find a "defective" coffee intentionally â€” leave roasted beans open for 2 weeks. Taste it. Learn what "old" tastes like. Now you'll know the difference when drinking fresh coffee!</div>`};

L['C1-4'] = {ar:`<h3>ًں§ھ ط§ظ„طھط­ظ„ظٹظ„ ط§ظ„ط­ط³ظٹ (Sensory Analysis) â€” ظ„ط؛ط© ط§ظ„ظ…ط­ظ…طµ ط§ظ„ظ…ط­طھط±ظپ</h3><p>ط§ظ„طھط­ظ„ظٹظ„ ط§ظ„ط­ط³ظٹ ظ‡ظˆ <strong>ط£ط¯ط§ط© ط§ظ„ظ…ط­ظ…طµ ط§ظ„ط£ط³ط§ط³ظٹط©</strong> ظ„طھظ‚ظٹظٹظ… ط¬ظˆط¯ط© ط§ظ„ظ‚ظ‡ظˆط©. ظٹطھط·ظ„ط¨ طھط¯ط±ظٹط¨ط§ظ‹ ظ…ظ†ط¸ظ…ط§ظ‹ ظ„ظ„ط£ظ†ظپطŒ ط§ظ„ظ„ط³ط§ظ†طŒ ظˆط§ظ„ط°ط§ظƒط±ط© ط§ظ„ط­ط³ظٹط©. SCAA ظˆ SCA ط·ظˆط±ط§ ط¨ط±ظˆطھظˆظƒظˆظ„ ظ‚ظٹط§ط³ظٹ ظٹط³ظ…ظ‰ <strong>SCA Cupping Protocol</strong>.</p>
<div class="img-c"><img src="\${photo('cupping')}" alt=""><div class="cap">ًں‘ƒ طھط¯ط±ظٹط¨ ط§ظ„ط­ظˆط§ط³ â€” ظƒظٹظپ طھطµط¨ط­ ط®ط¨ظٹط± طھط°ظˆظ‚</div></div>
<h3>ًں‘ƒ طھط¯ط±ظٹط¨ ط§ظ„ط£ظ†ظپ (Olfactory Training)</h3><p>ظٹظ…ظٹط² ط§ظ„ط£ظ†ظپ ط§ظ„ط¨ط´ط±ظٹ ط£ظƒط«ط± ظ…ظ† <strong>10,000 ط±ط§ط¦ط­ط© ظ…ط®طھظ„ظپط©</strong>. ظ„ظ„طھط¯ط±ظٹط¨طŒ ط§ط³طھط®ط¯ظ… <strong>Le Nez du Cafأ©</strong> (ظ…ط¬ظ…ظˆط¹ط© 36 ط±ط§ط¦ط­ط© ظ‚ظٹط§ط³ظٹط© ظ„ظ„ظ‚ظ‡ظˆط©) ط£ظˆ ط·ط¨ظ‚ ط§ظ„ظ…ط¨ط¯ط£ ط¨ظ…ظˆط§ط¯ ط·ط¨ظٹط¹ظٹط©. ط§ظ„ط±ظˆط§ط¦ط­ ط§ظ„ط£ط³ط§ط³ظٹط© ظپظٹ ط§ظ„ظ‚ظ‡ظˆط© طھظ†ظ‚ط³ظ… ظ„ظ€:<br>â€¢ <strong>ط²ظ‡ط±ظٹط©:</strong> ظٹط§ط³ظ…ظٹظ†طŒ ظˆط±ط¯طŒ ط²ظ‡ط± ط§ظ„ط¨ط±طھظ‚ط§ظ„ â€” طھظˆط¬ط¯ ظپظٹ ط¨ظ† ط¥ط«ظٹظˆط¨ظٹط§<br>â€¢ <strong>ظپط§ظƒظ‡ط© ط­ظ…ط±ط§ط،:</strong> طھظˆطھطŒ ظƒط±ط²طŒ ظپط±ط§ظˆظ„ط© â€” طھظˆط¬ط¯ ظپظٹ ط§ظ„ط¨ظ† ط§ظ„ط·ط¨ظٹط¹ظٹ<br>â€¢ <strong>ط­ظ…ط¶ظٹط§طھ:</strong> ظ„ظٹظ…ظˆظ†طŒ ط¨ط±طھظ‚ط§ظ„طŒ ط¬ط±ظٹط¨ ظپط±ظˆطھ â€” طھظˆط¬ط¯ ظپظٹ ط§ظ„ط¨ظ† ط§ظ„ظ…ط؛ط³ظˆظ„ ظ…ظ† ظƒظٹظ†ظٹط§<br>â€¢ <strong>ظ…ظƒط³ط±ط§طھ/ط´ظˆظƒظˆظ„ط§طھط©:</strong> ظ„ظˆط²طŒ ظƒط§ظƒط§ظˆ â€” طھظˆط¬ط¯ ظپظٹ ط§ظ„ط¨ظ† ط§ظ„ط¨ط±ط§ط²ظٹظ„ظٹ<br>â€¢ <strong>طھظˆط§ط¨ظ„:</strong> ظ‚ط±ظپط©طŒ ظ‡ظٹظ„طŒ ظ‚ط±ظ†ظپظ„ â€” طھظˆط¬ط¯ ظپظٹ ط¨ظ† ط¥ظ†ط¯ظˆظ†ظٹط³ظٹط§</p>
<h3>ًں‘… طھط¯ط±ظٹط¨ ط§ظ„طھط°ظˆظ‚ (Taste Training)</h3><p>ط§ظ„ط£ط°ظˆط§ظ‚ ط§ظ„ط£ط³ط§ط³ظٹط© ط§ظ„ط®ظ…ط³ط©: <strong>ط­ظ„ظˆطŒ ط­ط§ظ…ط¶طŒ ظ…ط§ظ„ط­طŒ ظ…ط±طŒ ظˆط£ظˆظ…ط§ظ…ظٹ</strong>. ط§ظ„ظ‚ظ‡ظˆط© طھط­طھظˆظٹ ط¹ظ„ظ‰ ط§ظ„ط£ط±ط¨ط¹ط© ط§ظ„ط£ظˆظ„ظ‰ ط¨ط´ظƒظ„ ط£ط³ط§ط³ظٹ.<br>â€¢ <strong>ط§ظ„ط­ظ…ظˆط¶ط© (Acidity):</strong> ظ…ظ‚ظٹط§ط³ ط¬ظˆط¯ط© â€” طھظڈطµظ†ظپ ظ…ظ† ظ…ظ†ط®ظپط¶ط© (ط¨ط±ط§ط²ظٹظ„ ط·ط¨ظٹط¹ظٹ) ط¥ظ„ظ‰ ط¹ط§ظ„ظٹط© ط¬ط¯ط§ظ‹ (ظƒظٹظ†ظٹط§ SL28). ظ…ظ‚ظٹط§ط³ SCA: 0-10<br>â€¢ <strong>ط§ظ„ط­ظ„ط§ظˆط© (Sweetness):</strong> ظ…ظ‚ظٹط§ط³ ط§ظ„ظ†ط¶ط¬ â€” طھط²ط¯ط§ط¯ ظ…ط¹ ط§ظ„طھط­ظ…ظٹطµ ط§ظ„ظ…ظ†ط§ط³ط¨ ظˆط§ظ„طھط®ظ…ظٹط± ط§ظ„ط¬ظٹط¯<br>â€¢ <strong>ط§ظ„ظ…ط±ط§ط±ط© (Bitterness):</strong> ظ†طھظٹط¬ط© ط·ط¨ظٹط¹ظٹط© ظ„ظ„ظƒط§ظپظٹظٹظ† ظˆط§ظ„طھط­ظ…ظٹطµ ط§ظ„ط¯ط§ظƒظ† â€” ظٹط¬ط¨ ط£ظ† طھظƒظˆظ† ظ…طھظˆط§ط²ظ†ط© ظ„ط§ ظ…ط²ط¹ط¬ط©<br>â€¢ <strong>ط§ظ„ظ‚ظˆط§ظ… (Body):</strong> ظ…ظ† ط®ظپظٹظپ ظƒط§ظ„ط´ط§ظٹ (طھط­ظ…ظٹطµ ظپط§طھط­) ط¥ظ„ظ‰ ط«ظ‚ظٹظ„ ظƒط§ظ„ظƒط±ظٹظ…ط© (ط¥ط³ط¨ط±ظٹط³ظˆ ط¨ط±ط§ط²ظٹظ„ظٹ)</p>
<div class="hl"><strong>ًں“ٹ ط³ظ„ظ… SCA ظ„ظ„ظ†ظ‚ط§ط·:</strong> Specialty â‰¥ 80 ظ†ظ‚ط·ط© | Premium 85-89 | Reserve 90+ | ظƒظ„ ظ†ظ‚ط·ط© طھظ…ط«ظ„ ط³ط¹ط±ط§ظ‹ ط£ط¹ظ„ظ‰ ط¨ظ€ $0.10-0.50/ط±ط·ظ„</div>
<h3>ًں“‹ ط¨ط±ظˆطھظˆظƒظˆظ„ ط§ظ„ظƒط§ط¨ظٹظ†ط¬ (Cupping Protocol)</h3><p>1. <strong>ط·ط­ظ†:</strong> 8.3 ط¬ط±ط§ظ… ط¨ظ† ط®ط´ظ† (ط·ط­ظ†ط© Chemex طھظ‚ط±ظٹط¨ط§ظ‹)<br>2. <strong>ط´ظ… ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ط·ط­ظˆظ†ط©:</strong> ط³ط¬ظ„ ط§ظ„ط±ط§ط¦ط­ط© ط§ظ„ط¬ط§ظپط© (Fragrance)<br>3. <strong>طµط¨ ط§ظ„ظ…ط§ط،:</strong> 150 ظ…ظ„ ظ…ط§ط، ط¹ظ†ط¯ 93آ°ظ…<br>4. <strong>ط´ظ… ط¨ط¹ط¯ 4 ط¯ظ‚ط§ط¦ظ‚:</strong> ط§ظƒط³ط± ط§ظ„ظƒط±ط§ط³طھ (Crust) â€” ظ‡ط°ظ‡ ط£ظ‡ظ… ط®ط·ظˆط© ظ„ط´ظ… ط§ظ„ظ†ظƒظ‡ط§طھ ط§ظ„ظ…طھط·ط§ظٹط±ط©<br>5. <strong>ط§ظ„طھط°ظˆظ‚ ط¨ط¹ط¯ 8-10 ط¯ظ‚ط§ط¦ظ‚:</strong> ط§ط³طھط®ط¯ظ… ظ…ظ„ط¹ظ‚ط© ط§ظ„ظƒط§ط¨ظٹظ†ط¬ â€” ط§ظ…طµ ط§ظ„ظ‚ظ‡ظˆط© ط¨طµظˆطھ (Slurp) ظ„طھط±ط°ظٹط°ظ‡ط§ ظپظٹ ط§ظ„ظپظ…<br>6. <strong>طھط³ط¬ظٹظ„ ط§ظ„ظ†طھط§ط¦ط¬:</strong> Fragrance/Aroma, Flavor, Aftertaste, Acidity, Body, Balance, Uniformity, Clean Cup, Sweetness, Overall</p>
<div class="ok-box"><strong>ًںژ¯ ظ…ط´ط±ظˆط¹:</strong> ط§ط´طھط±ظٹ 3 ظ‚ظ‡ظˆط§طھ ظ…ظ† ط£طµظˆظ„ ظ…ط®طھظ„ظپط© (ظ…ط«ظ„ط§ظ‹: ط¥ط«ظٹظˆط¨ظٹط§طŒ ظƒظˆظ„ظˆظ…ط¨ظٹط§طŒ ط¨ط±ط§ط²ظٹظ„). ط§ط¹ظ…ظ„ ظƒط§ط¨ظٹظ†ط¬ ظ„ظ„ط£ط«ظ„ط§ط«. ط³ط¬ظ„ ظ…ظ„ط§ط­ط¸ط§طھظƒ ظ„ظƒظ„ ظ…ط±ط­ظ„ط©. طµظ†ظپ ط§ظ„ظ†ظƒظ‡ط§طھ ط­ط³ط¨ ط§ظ„ط±ظˆط§ط¦ط­ ط§ظ„ط£ط³ط§ط³ظٹط©. ط­ط§ظˆظ„ طھظˆظ‚ط¹ ط¯ط±ط¬ط© SCA ظ„ظƒظ„ ط¨ظ†.</div>`, en:`<h3>ًں§ھ Sensory Analysis â€” The Roaster's Essential Language</h3><p>Sensory analysis is the <strong>roaster's fundamental tool</strong> for evaluating coffee quality. It requires systematic training of the nose, tongue, and sensory memory. SCAA and SCA developed the standard <strong>SCA Cupping Protocol</strong>.</p>
<div class="img-c"><img src="\${photo('cupping')}" alt=""><div class="cap">ًں‘ƒ Sensory Training â€” How to Become a Tasting Expert</div></div>
<h3>ًں‘ƒ Olfactory Training</h3><p>The human nose can distinguish over <strong>10,000 different scents</strong>. For training, use <strong>Le Nez du Cafأ©</strong> (a set of 36 standard coffee aromas) or apply the principle with natural materials. Key coffee aroma categories:<br>â€¢ <strong>Floral:</strong> Jasmine, rose, orange blossom â€” found in Ethiopian coffee<br>â€¢ <strong>Red fruit:</strong> Berry, cherry, strawberry â€” found in natural processed coffee<br>â€¢ <strong>Citrus:</strong> Lemon, orange, grapefruit â€” found in washed Kenyan coffee<br>â€¢ <strong>Nut/Chocolate:</strong> Almond, cocoa â€” found in Brazilian coffee<br>â€¢ <strong>Spice:</strong> Cinnamon, cardamom, clove â€” found in Indonesian coffee</p>
<h3>ًں‘… Taste Training</h3><p>The five basic tastes: <strong>sweet, sour, salty, bitter, and umami</strong>. Coffee primarily contains the first four.<br>â€¢ <strong>Acidity:</strong> A quality measure â€” rated from low (Brazilian natural) to very high (Kenyan SL28). SCA scale: 0-10<br>â€¢ <strong>Sweetness:</strong> A ripeness measure â€” increases with proper roasting and good brewing<br>â€¢ <strong>Bitterness:</strong> Natural result of caffeine and dark roasting â€” should be balanced, not unpleasant<br>â€¢ <strong>Body:</strong> From tea-like (light roast) to creamy (Brazilian espresso)</p>
<div class="hl"><strong>ًں“ٹ SCA Scoring:</strong> Specialty â‰¥ 80 points | Premium 85-89 | Reserve 90+ | Each point represents $0.10-0.50/lb price increase</div>
<h3>ًں“‹ Cupping Protocol</h3><p>1. <strong>Grind:</strong> 8.3g coffee, coarse (Chemex grind approx)<br>2. <strong>Smell dry grounds:</strong> Record fragrance<br>3. <strong>Pour water:</strong> 150ml water at 93آ°C<br>4. <strong>Smell after 4 min:</strong> Break the crust â€” the most important step for capturing volatile aromas<br>5. <strong>Taste after 8-10 min:</strong> Use cupping spoon â€” slurp to aerate across the palate<br>6. <strong>Score:</strong> Fragrance/Aroma, Flavor, Aftertaste, Acidity, Body, Balance, Uniformity, Clean Cup, Sweetness, Overall</p>
<div class="ok-box"><strong>ًںژ¯ Project:</strong> Buy 3 coffees from different origins (e.g., Ethiopia, Colombia, Brazil). Cup all three. Record observations at each stage. Classify flavors by basic aroma categories. Try to predict each coffee's SCA score.</div>`};

L['C1-5'] = {ar:`<h3>ًں”چ ط¹ظٹظˆط¨ ط§ظ„ظ‚ظ‡ظˆط© â€” طھط´ط®ظٹطµ ط§ظ„ظ…ط´ط§ظƒظ„ ظˆط­ظ„ظˆظ„ظ‡ط§ ط§ظ„ط¹ظ…ظ„ظٹط©</h3><p>طھط´ط®ظٹطµ ط¹ظٹظˆط¨ ط§ظ„ظ‚ظ‡ظˆط© ظ‡ظˆ <strong>ظ…ظ‡ط§ط±ط© طھظ…ظٹط² ط§ظ„ظ…ط­ظ…طµ ط§ظ„ط¹ط§ط¯ظٹ ظ…ظ† ط§ظ„ظ…ط­طھط±ظپ</strong>. ظˆظپظ‚ط§ظ‹ ظ„ظ€ SCAطŒ ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط­ط§طµظ„ط© ط¹ظ„ظ‰ ط£ظƒط«ط± ظ…ظ† 80 ظ†ظ‚ط·ط© ظٹط¬ط¨ ط£ظ„ط§ طھط­طھظˆظٹ ط£ظٹ ط¹ظٹط¨ ظ…ظ† ط§ظ„ظپط¦ط© ط§ظ„ط£ظˆظ„ظ‰ (Primary Defects).</p>
<h3>âڑ ï¸ڈ ط¹ظٹظˆط¨ ط§ظ„ظپط¦ط© ط§ظ„ط£ظˆظ„ظ‰ (Primary Defects)</h3>
<table><tr><th>ط§ظ„ط¹ظٹط¨</th><th>ط§ظ„ط³ط¨ط¨</th><th>ط§ظ„طھط£ط«ظٹط±</th><th>ط§ظ„ط­ظ„</th></tr><tr><td>ط¨ظ† ط£ط³ظˆط¯ ظƒط§ظ…ظ„</td><td>ط¥ظپط±ط§ط· ظپظٹ ط§ظ„ظ†ط¶ط¬ ط£ظˆ ظ…ط±ط¶ ط§ظ„طھظˆطھ</td><td>ط·ط¹ظ… ط¹ظپظ†طŒ طھط±ط§ط¨ظٹطŒ ظ‚ط°ط±</td><td>ظپط±ط² ظٹط¯ظˆظٹ â€” ط§ط±ظپط¹ ط£ظٹ ط­ط¨ط© ط³ظˆط¯ط§ط،</td></tr><tr><td>ط­ط§ظ…ط¶ظٹط© (Sour)</td><td>طھط­ظ…ظٹطµ ط؛ظٹط± ظƒط§ظپظچ â€” طھط®ظ…ظٹط± ط³ظٹط¦</td><td>ط·ط¹ظ… ظ„ط§ط°ط¹ ظٹط°ظƒط±ظ†ط§ ط¨ط§ظ„ط®ظ„</td><td>ط²ط¯ ظˆظ‚طھ ط§ظ„طھط­ظ…ظٹطµ ط¨ط¹ط¯ ط§ظ„ظƒط±ط§ظƒ ط§ظ„ط£ظˆظ„</td></tr><tr><td>ظپط·ط±ظٹط§طھ (Fungus)</td><td>طھط®ط²ظٹظ† ط±ط·ط¨ â€” طھظ„ظپ ط£ط«ظ†ط§ط، ط§ظ„طھط¬ظپظٹظپ</td><td>ط·ط¹ظ… ط§ظ„ط·ظٹظ†طŒ ط§ظ„ط¹ظپظ† â€” ط®ط·ط± طµط­ظٹ</td><td>ط§ظ„طھط®ظ„طµ ظ…ظ† ط§ظ„ط¯ظپط¹ط© ط¨ط§ظ„ظƒط§ظ…ظ„</td></tr><tr><td>ط£ط¬ط³ط§ظ… ط؛ط±ظٹط¨ط©</td><td>طھظ„ظˆط« ط£ط«ظ†ط§ط، ط§ظ„ط­طµط§ط¯ ط£ظˆ ط§ظ„طھط¬ظپظٹظپ</td><td>ط­ط¬ط§ط±ط©طŒ ط²ط¬ط§ط¬ â€” ط®ط·ط± ط¹ظ„ظ‰ ط§ظ„ط·ط§ط­ظ†ط©</td><td>ط§ط³طھط®ط¯ظ… Magnetic Separator ظˆ Destoner</td></tr></table>
<h3>âڑ ï¸ڈ ط¹ظٹظˆط¨ ط§ظ„ظپط¦ط© ط§ظ„ط«ط§ظ†ظٹط© (Secondary Defects)</h3>
<table><tr><th>ط§ظ„ط¹ظٹط¨</th><th>ط§ظ„ط³ط¨ط¨</th><th>ط§ظ„طھط£ط«ظٹط±</th><th>ط¹ط¯ط¯ ظ„ظ„ظ€ 350 ط¬ط±ط§ظ…</th></tr><tr><td>Sinker (ط­ط¨ط© ط®ظپظٹظپط©)</td><td>ط­ط¨ط© ط؛ظٹط± ظ†ط§ط¶ط¬ط©</td><td>ط·ط¹ظ… ط£ط®ط¶ط±طŒ ط¹ط´ط¨ظٹطŒ ظ„ط§ط°ط¹</td><td>â‰¥ 5 ط¹ظٹظˆط¨</td></tr><tr><td>Quaker</td><td>طھط­ظ…ظٹطµ ط؛ظٹط± ظ…طھط³ط§ظˆظچ</td><td>ط·ط¹ظ… ظ‚ط´طŒ ظˆط±ظ‚ ط¬ط§ظپ</td><td>â‰¥ 5 ط¹ظٹظˆط¨</td></tr><tr><td>ظ…ظƒط³ظˆط±/ظ…ظ‚ط·ط¹</td><td>ظ…ط¹ط§ظ„ط¬ط© ظ…ظٹظƒط§ظ†ظٹظƒظٹط© ط¹ظ†ظٹظپط©</td><td>طھط­ظ…ظٹطµ ط؛ظٹط± ظ…ظ†طھط¸ظ…طŒ ط­ظ…ظˆط¶ط© ط²ط§ط¦ط¯ط©</td><td>ط؛ظٹط± ظ…ط­ط¯ط¯</td></tr><tr><td>ظ‚ط´ط±ط©/ط´ظ„</td><td>طھط´ظ‚ظ‚ ط£ط«ظ†ط§ط، ط§ظ„طھط­ظ…ظٹطµ</td><td>ط§ط­طھط±ط§ظ‚ â€” ط·ط¹ظ… ط±ظ…ط§ط¯</td><td>ظٹط­طھط³ط¨ ط¨ط¹ط¯ ط§ظ„طھط­ظ…ظٹطµ</td></tr></table>
<h3>ًں› ï¸ڈ ط§ظ„طھط´ط®ظٹطµ ط§ظ„ط¹ظ…ظ„ظٹ ظپظٹ ط§ظ„ظ…ط­ظ…طµط©</h3><p>ط¯ظپط¹ط© طھط­ظ…ظٹطµ ظ…ظƒطھظˆط¨ ط¹ظ„ظٹظ‡ط§ "ظ†ظƒظ‡ط§طھ ط¹ط´ط¨ظٹط©" â€” ظ…ط§ط°ط§ طھظپط¹ظ„طں<br>â†’ ط§ظ„ظپط±ط²: ط§ظپط­طµ ط¹ظٹظ†ط© 100 ط¬ط±ط§ظ… ظ‚ط¨ظ„ ط§ظ„طھط­ظ…ظٹطµ â€” ط§ط¨ط­ط« ط¹ظ† Quakers ظˆ Sinkers<br>â†’ ط¯ط±ط¬ط© ط§ظ„ط­ط±ط§ط±ط©: طھط£ظƒط¯ ظ…ظ† ظƒظپط§ظٹط© ظˆظ‚طھ ط§ظ„طھط­ظ…ظٹطµ â€” ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„ 2 ط¯ظ‚ظٹظ‚ط© ط¨ط¹ط¯ ط§ظ„ظƒط±ط§ظƒ ط§ظ„ط£ظˆظ„ (First Crack)<br>â†’ ظ…ظ†ط­ظ†ظ‰ ط§ظ„طھط­ظ…ظٹطµ: طھط£ظƒط¯ ظ…ظ† ط¹ط¯ظ… flatlining ظپظٹ ط§ظ„ظ…ط±ط­ظ„ط© ط§ظ„ط£ط®ظٹط±ط© (ظٹط¨ط±ط¯ ط§ظ„ظپط±ظ† ظ‚ط¨ظ„ ط§ظƒطھظ…ط§ظ„ ط§ظ„طھط·ظˆظٹط±)<br>â†’ ط§ظ„طھط®ظ…ظٹط±: ط¬ط±ط¨ ظ†ط³ط¨ط© ط·ط­ظ† ظ…ط®طھظ„ظپط© (ط£ط±ظپط¹ ط¨ظ†ط³ط¨ط© 10%) ظˆظ†ط³ط¨ط© ظ…ط§ط، ظ…ط®طھظ„ظپط© (ط£ط¶ط¨ط· TDS)</p>
<div class="info-box"><strong>ًں’، طھط°ظƒط±:</strong> <strong>90% ظ…ظ† ط¹ظٹظˆط¨ ط§ظ„ظ‚ظ‡ظˆط© ط³ط¨ط¨ظ‡ط§ ظ…ط´ط§ظƒظ„ ظپظٹ ط³ظ„ط³ظ„ط© ط§ظ„طھظˆط±ظٹط¯ ظ‚ط¨ظ„ ط§ظ„طھط­ظ…ظٹطµ</strong>. ط§ظ„ظ…ط­ظ…طµ ط§ظ„ط¬ظٹط¯ ظٹط¹ط±ظپ ظƒظٹظپ ظٹط®طھط§ط± ط§ظ„ط¨ظ† ط§ظ„ط£ط®ط¶ط±طŒ ظ„ط§ ظƒظٹظپ ظٹط®ظپظٹ ظ…ط´ط§ظƒظ„ظ‡ ط¨ط§ظ„طھط­ظ…ظٹطµ ط§ظ„ط¯ط§ظƒظ†!</div>
<div class="ok-box"><strong>ًںژ¯ ظ…ط´ط±ظˆط¹:</strong> ط§ط´طھط±ظٹ 500 ط¬ط±ط§ظ… ط¨ظ† ط؛ظٹط± ظ…ظ‚ط´ط± (ط·ط¨ظٹط¹ظٹ). ط§ظپط±ط² ظٹط¯ظˆظٹط§ظ‹ ظƒظ„ ط§ظ„ط­ط¨ط§طھ ط§ظ„ط³ظˆط¯ط§ط، ظˆط§ظ„طھط§ظ„ظپط©. ط§ط­ط³ط¨ ط¹ط¯ط¯ ط§ظ„ط¹ظٹظˆط¨ ظ„ظƒظ„ 350 ط¬ط±ط§ظ… (ط§ظ„ظ…ط¹ظٹط§ط± SCA). ط­ظ…طµظ‡ط§ ظˆط§ط¹ظ…ظ„ ظƒط§ط¨ظٹظ†ط¬. ظ‡ظ„ طھط´ط¹ط± ط¨طھط­ط³ظ† ظˆط§ط¶ط­ ط¨ط¹ط¯ ط§ظ„ظپط±ط²طں</div>`, en:`<h3>ًں”چ Coffee Defects â€” Diagnosis and Practical Solutions</h3><p>Diagnosing coffee defects is a <strong>skill that separates the average roaster from the professional</strong>. According to SCA, coffee scoring over 80 points must contain zero Category 1 defects.</p>
<h3>âڑ ï¸ڈ Primary Defects (Category 1)</h3>
<table><tr><th>Defect</th><th>Cause</th><th>Impact</th><th>Solution</th></tr><tr><td>Full Black</td><td>Overripe or berry disease</td><td>Musty, dirty, earthy taste</td><td>Hand sorting â€” remove every black bean</td></tr><tr><td>Sour</td><td>Under-roasting â€” bad fermentation</td><td>Sharp, vinegar-like taste</td><td>Increase roast time after first crack</td></tr><tr><td>Fungus</td><td>Wet storage â€” drying damage</td><td>Moldy, musty â€” health risk</td><td>Discard entire batch</td></tr><tr><td>Foreign Matter</td><td>Harvest or drying contamination</td><td>Stones, glass â€” grinder hazard</td><td>Use Magnetic Separator + Destoner</td></tr></table>
<h3>âڑ ï¸ڈ Secondary Defects (Category 2)</h3>
<table><tr><th>Defect</th><th>Cause</th><th>Impact</th><th>Count per 350g</th></tr><tr><td>Sinker (light bean)</td><td>Unripe bean</td><td>Green, grassy, astringent taste</td><td>â‰¥ 5 defects</td></tr><tr><td>Quaker</td><td>Uneven roasting</td><td>Straw, dry paper taste</td><td>â‰¥ 5 defects</td></tr><tr><td>Broken/Bitten</td><td>Harsh mechanical processing</td><td>Uneven roasting, excess acidity</td><td>Unspecified</td></tr><tr><td>Shell/Ear</td><td>Cracking during roasting</td><td>Burning â€” ash taste</td><td>Counted post-roast</td></tr></table>
<h3>ًں› ï¸ڈ Practical Roastery Diagnosis</h3><p>A roast batch tastes "grassy" â€” what do you do?<br>â†’ Sort: Examine a 100g sample before roasting â€” look for Quakers and Sinkers<br>â†’ Temperature: Ensure sufficient roast time â€” at least 2 minutes after First Crack<br>â†’ Roast curve: Check for no flatlining in the final stage (oven cools before development completes)<br>â†’ Brew: Try a different grind ratio (10% finer) and different water ratio (adjust TDS)</p>
<div class="info-box"><strong>ًں’، Remember:</strong> <strong>90% of coffee defects come from supply chain issues before roasting</strong>. A good roaster knows how to select green beans, not how to hide problems with dark roasting!</div>
<div class="ok-box"><strong>ًںژ¯ Project:</strong> Buy 500g of unwashed (natural) coffee. Hand-sort all black and damaged beans. Calculate defect count per 350g (SCA standard). Roast and cup. Can you taste a clear improvement after sorting?</div>`};

L['C2-3'] = {ar:`<h3>ًں“¦ طھط®ط²ظٹظ† ط§ظ„ط¨ظ† ظˆظ†ط¶ط§ط±طھظ‡ â€” ظ…ظ† ط§ظ„طھط­ظ…ظٹطµ ط¥ظ„ظ‰ ط§ظ„ظپظ†ط¬ط§ظ†</h3><p>ط§ظ„ظ‚ظ‡ظˆط© <strong>طھطھظ†ظپط³</strong>. ط¨ط¹ط¯ ط§ظ„طھط­ظ…ظٹطµطŒ طھظپظ‚ط¯ ط§ظ„ظ‚ظ‡ظˆط© 30-60% ظ…ظ† ظ†ظƒظ‡طھظ‡ط§ ط®ظ„ط§ظ„ 3 ط£ط³ط§ط¨ظٹط¹. ظپظ‡ظ… ظƒظٹظپظٹط© طھط®ط²ظٹظ† ط§ظ„ط¨ظ† ظ‡ظˆ ط§ظ„ظپط±ظ‚ ط¨ظٹظ† ظ‚ظ‡ظˆط© ظ…ظ…طھط§ط²ط© ظˆظ‚ظ‡ظˆط© ط¹ط§ط¯ظٹط©.</p><h3>âڑ، ط¯ظˆط±ط© ط­ظٹط§ط© ط§ظ„ط¨ظ† ط§ظ„ظ…ط­ظ…طµ</h3><table><tr><th>ط§ظ„ظپطھط±ط©</th><th>ط§ظ„ط­ط§ظ„ط©</th><th>ط§ظ„ط§ط³طھط®ط¯ط§ظ… ط§ظ„ظ…ط«ط§ظ„ظٹ</th></tr><tr><td>ظٹظˆظ… 1-2 ط¨ط¹ط¯ ط§ظ„طھط­ظ…ظٹطµ</td><td>ط؛ط§ط²ط§طھ ط¹ط§ظ„ظٹط© (Degassing) â€” ظƒط±ظٹظ…ط§ ط؛ظٹط± ظ…ط³طھظ‚ط±ط©</td><td>ظ„ظٹط³ ظ…ط«ط§ظ„ظٹط§ظ‹ ظ„ظ„ط¥ط³ط¨ط±ظٹط³ظˆ â€” ظ…ظ…طھط§ط² ظ„ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ظ‚ط·ط±ط© ظپظ‚ط·</td></tr><tr><td>ظٹظˆظ… 3-7</td><td>ط°ط±ظˆط© ط§ظ„ظ†ط¶ط¬ â€” ظƒط±ظٹظ…ط§ ظ…ط«ط§ظ„ظٹط©طŒ ظ†ظƒظ‡ط§طھ ظ…طھظˆط§ط²ظ†ط©</td><td>ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ظˆط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ظ‚ط·ط±ط© â€” ط£ظپط¶ظ„ ظپطھط±ط©</td></tr><tr><td>ط£ط³ط¨ظˆط¹ 2-3</td><td>ط¬ظٹط¯ ط¬ط¯ط§ظ‹ â€” ظ†ظƒظ‡ط§طھ ظ„ط§ طھط²ط§ظ„ ظˆط§ط¶ط­ط©</td><td>ط§ط³طھظ‡ظ„ط§ظƒ ظٹظˆظ…ظٹطŒ ظ…ظ†ط§ط³ط¨ ظ„ظ€ Batch Brew</td></tr><tr><td>ط£ط³ط¨ظˆط¹ 4-5</td><td>ظ…ظ‚ط¨ظˆظ„ â€” ظ†ظƒظ‡ط§طھ ط¨ط§ظ‡طھط©طŒ ط­ظ„ط§ظˆط© ط£ظ‚ظ„</td><td>ظ…ط´ط±ظˆط¨ط§طھ ط¨ط§ظ„ط­ظ„ظٹط¨طŒ Cold Brew (ظٹط®ظپظٹ ط§ظ„ط¹ظٹظˆط¨)</td></tr><tr><td>ط´ظ‡ط± 2+</td><td>ظ‚ط¯ظٹظ… â€” ظ†ظƒظ‡ط§طھ ظ…ظ†ط®ظپط¶ط© ط¬ط¯ط§ظ‹</td><td>ط§ط³طھط®ط¯ط§ظ…ط§طھ ط؛ظٹط± ظ…ط¨ط§ط´ط±ط© (ط­ظ„ظˆظٹط§طھطŒ طھطھط¨ظٹظ„ط§طھ)</td></tr></table><h3>ًںڈ  ظ‚ظˆط§ط¹ط¯ ط§ظ„طھط®ط²ظٹظ† ط§ظ„ظ…ط«ط§ظ„ظٹط© â€” DOs and DON'Ts</h3><p><strong>âœ… ط§ظپط¹ظ„:</strong><br>â€¢ ط§ط³طھط®ط¯ظ… ظˆط¹ط§ط، ظ…ط­ظƒظ… ط§ظ„ط¥ط؛ظ„ط§ظ‚ (Airscape, Fellow Atmos) ظ…ط¹ طµظ…ط§ظ… طھظپط±ظٹط؛<br>â€¢ ط§ط­ظپط¸ظ‡ ظپظٹ ظ…ظƒط§ظ† ط¨ط§ط±ط¯ ظˆظ…ط¸ظ„ظ… (ط®ط²ط§ظ†ط© ط¨ط¹ظٹط¯ط§ظ‹ ط¹ظ† ط§ظ„ظپط±ظ† ظˆط§ظ„ط´ظ…ط³)<br>â€¢ ط§ط´طھط± ظƒظ…ظٹط§طھ طµط؛ظٹط±ط© طھظƒظپظٹظƒ ظ„ط£ط³ط¨ظˆط¹ظٹظ† ظپظ‚ط·<br>â€¢ ط§ط·ط­ظ† ظ…ط¨ط§ط´ط±ط© ظ‚ط¨ظ„ ط§ظ„طھط­ط¶ظٹط± â€” ط§ظ„ط¨ظ† ط§ظ„ظ…ط·ط­ظˆظ† ظٹظپظ‚ط¯ ظ†ظƒظ‡طھظ‡ ظپظٹ 15 ط¯ظ‚ظٹظ‚ط©!</p><p><strong>â‌Œ ظ„ط§ طھظپط¹ظ„:</strong><br>â€¢ ظ„ط§ طھط­طھظپط¸ ط¨ط§ظ„ط¨ظ† ظپظٹ ط§ظ„ط«ظ„ط§ط¬ط© â€” ط§ظ„ط±ط·ظˆط¨ط© طھط¯ظ…ط± ط§ظ„ظ†ظƒظ‡ط© (ظٹطھظƒطھظ‘ظ„ ظˆظٹظ…طھطµ ط±ظˆط§ط¦ط­ ط§ظ„ط¬ط¨ظ†!)<br>â€¢ ظ„ط§ طھط­طھظپط¸ ط¨ط§ظ„ط¨ظ† ظپظٹ ط§ظ„ظپط±ظٹط²ط± ظ„ط§ط³طھط®ط¯ط§ظ… ظٹظˆظ…ظٹ â€” ط§ظ„طھظƒط«ظپ ط¹ظ†ط¯ ط§ظ„ط¥ط®ط±ط§ط¬ ظٹط¯ظ…ط± ط§ظ„ط­ط¨ط©<br>â€¢ ظ„ط§ طھط´طھط±ظٹ ط¨ظ†ط§ظ‹ ظ…ط·ط­ظˆظ†ط§ظ‹ â€” ظٹظپظ‚ط¯ 80% ظ…ظ† ظ†ظƒظ‡طھظ‡ ظپظٹ ط£ظˆظ„ 24 ط³ط§ط¹ط©</p><div class="quiz-box"><strong>ًں’¬ ظ‡ظ„ طھط¹ظ„ظ…طں</strong> ط§ظ„ط¨ظ† ط§ظ„ظ…ط·ط­ظˆظ† ظٹظپظ‚ط¯ 50% ظ…ظ† ظ…ط±ظƒط¨ط§طھظ‡ ط§ظ„ظ…طھط·ط§ظٹط±ط© ظپظٹ ط£ظˆظ„ 15 ط¯ظ‚ظٹظ‚ط© ط¨ط¹ط¯ ط§ظ„ط·ط­ظ†. ظ„ظ‡ط°ط§ ط§ظ„ط¨ط§ط±ظٹط³طھط§ ط§ظ„ظ…ط­طھط±ظپ ظٹط·ط­ظ† ظ„ظƒظ„ ط¬ط±ط¹ط©!</div>`, en:`<h3>ًں“¦ Coffee Storage & Freshness â€” From Roast to Cup</h3><p>Coffee <strong>breathes</strong>. After roasting, coffee loses 30-60% of its flavor within 3 weeks. Understanding storage is the difference between excellent and mediocre coffee.</p><h3>âڑ، Roasted Coffee Lifecycle</h3><table><tr><th>Period</th><th>State</th><th>Best Use</th></tr><tr><td>Day 1-2 post-roast</td><td>High degassing â€” unstable crema</td><td>Not ideal for espresso â€” great for pour-over</td></tr><tr><td>Day 3-7</td><td>Peak freshness â€” perfect crema, balanced</td><td>Espresso and pour-over â€” best period</td></tr><tr><td>Week 2-3</td><td>Very good â€” flavors still clear</td><td>Daily consumption, good for Batch Brew</td></tr><tr><td>Week 4-5</td><td>Acceptable â€” faded flavors, less sweet</td><td>Milk drinks, Cold Brew (hides defects)</td></tr><tr><td>Month 2+</td><td>Old â€” very low flavor</td><td>Non-beverage uses (desserts, rubs)</td></tr></table><h3>ًںڈ  Storage Rules â€” DOs and DON'Ts</h3><p><strong>âœ… DO:</strong><br>â€¢ Use airtight container (Airscape, Fellow Atmos) with one-way valve<br>â€¢ Store in cool, dark place (cabinet away from stove and sun)<br>â€¢ Buy small amounts â€” 2 weeks supply max<br>â€¢ Grind immediately before brewing â€” ground coffee loses flavor in 15 minutes!</p><p><strong>â‌Œ DON'T:</strong><br>â€¢ Don't keep coffee in fridge â€” moisture destroys flavor (absorbs cheese smells!)<br>â€¢ Don't keep in freezer for daily use â€” condensation upon removal damages beans<br>â€¢ Don't buy pre-ground coffee â€” loses 80% of flavor in first 24 hours</p><div class="quiz-box"><strong>ًں’¬ Did You Know?</strong> Ground coffee loses 50% of volatile compounds in the first 15 minutes after grinding. That's why professional baristas grind per dose!</div>`};

L['C2-4'] = {ar:`<h3>ًں§ھ ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„طھط¬ط±ظٹط¨ظٹط© â€” ط¢ظپط§ظ‚ ط¬ط¯ظٹط¯ط© ظپظٹ ط¹ط§ظ„ظ… ط§ظ„ظ†ظƒظ‡ط©</h3><p>ط§ظ„ظ…ط¹ط§ظ„ط¬ط§طھ ط§ظ„طھط¬ط±ظٹط¨ظٹط© طھظ…ط«ظ„ <strong>ط§ظ„ط­ط¯ظˆط¯ ط§ظ„ط¬ط¯ظٹط¯ط© ظ„ط§ط¨طھظƒط§ط± ط§ظ„ظ‚ظ‡ظˆط©</strong>. ظپظٹ ط§ظ„ط¹ظ‚ط¯ ط§ظ„ط£ط®ظٹط±طŒ طھط¬ط§ظˆط²طھ ظ†ط³ط¨ط© ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„طھط¬ط±ظٹط¨ظٹط© ظپظٹ ط³ظˆظ‚ specialty ظ…ظ† 2% ط¥ظ„ظ‰ ط£ظƒط«ط± ظ…ظ† 15%طŒ ظˆظٹط¨ط­ط« ط§ظ„ظ…ظ†طھط¬ظˆظ† ط¹ظ† ط·ط±ظ‚ ط¬ط¯ظٹط¯ط© ظ„ط¥ظ†طھط§ط¬ ظ†ظƒظ‡ط§طھ ط؛ظٹط± ظ…ط³ط¨ظˆظ‚ط©.</p>
<h3>ًں«§ ط§ظ„طھط®ظ…ظٹط± ط§ظ„ظ„ط§ظ‡ظˆط§ط¦ظٹ (Anaerobic Fermentation)</h3><p>طھظˆط¶ط¹ ط§ظ„ظƒط±ط²ط§طھ ط§ظ„ظƒط§ظ…ظ„ط© ظپظٹ ط®ط²ط§ظ†ط§طھ <strong>ظ…ط­ظƒظ…ط© ط§ظ„ط¥ط؛ظ„ط§ظ‚</strong> ظ…ط¹ طµظ…ط§ظ…ط§طھ ط£ط­ط§ط¯ظٹط© ط§ظ„ط§طھط¬ط§ظ‡ طھظ…ظ†ط¹ ط¯ط®ظˆظ„ ط§ظ„ط£ظƒط³ط¬ظٹظ†. ظٹطھظ… ط§ظ„طھط®ظ…ظٹط± ط¨ظˆط§ط³ط·ط© ط¨ظƒطھظٹط±ظٹط§ ظ„ط§ طھط­طھط§ط¬ ط£ظƒط³ط¬ظٹظ† â€” طھظ†طھط¬ ظ†ظƒظ‡ط§طھ ط¬ط±ظٹط¦ط© ط؛ظٹط± طھظ‚ظ„ظٹط¯ظٹط©.</p><table><tr><th>ط§ظ„ظ…ط¹ظٹط§ط±</th><th>ط§ظ„طھط®ظ…ظٹط± ط§ظ„طھظ‚ظ„ظٹط¯ظٹ</th><th>ط§ظ„طھط®ظ…ظٹط± ط§ظ„ظ„ط§ظ‡ظˆط§ط¦ظٹ</th></tr><tr><td>ظˆط¬ظˆط¯ ط§ظ„ط£ظƒط³ط¬ظٹظ†</td><td>ظ…ظپطھظˆط­ ظ„ظ„ظ‡ظˆط§ط،</td><td>ظ…ط؛ظ„ظ‚ طھظ…ط§ظ…ط§ظ‹</td></tr><tr><td>ط¯ط±ط¬ط© ط§ظ„ط­ط±ط§ط±ط©</td><td>ظ…ط­ظٹط·ط© (20-30آ°ظ…)</td><td>ظ…ط¶ط¨ظˆط·ط© (15-25آ°ظ…)</td></tr><tr><td>ط§ظ„ظ…ط¯ط©</td><td>24-36 ط³ط§ط¹ط©</td><td>48-120 ط³ط§ط¹ط©</td></tr><tr><td>ط§ظ„ظ†ظƒظ‡ط§طھ ط§ظ„ظ†ط§طھط¬ط©</td><td>ظ†ط¸ظٹظپط©طŒ ط²ظ‡ط±ظٹط©</td><td>ظپط§ظƒظ‡ط© ط§ط³طھظˆط§ط¦ظٹط©طŒ ظ†ط¨ظٹط°ظٹط©طŒ ط£ط²ظ‡ط§ط± ط؛ط±ظٹط¨ط©</td></tr><tr><td>ظ…ط³طھظˆظ‰ ط§ظ„طھط­ظƒظ…</td><td>ظ…ظ†ط®ظپط¶</td><td>ط¹ط§ظ„ظچ â€” ظ‚ط§ط¨ظ„ ظ„ظ„ظ‚ظٹط§ط³</td></tr></table>
<h3>ًںچ· ط§ظ„ظƒط±ط¨ظˆظ†ظٹظƒ ظ…ط§ظƒظٹط±ظٹط´ظ† (Carbonic Maceration)</h3><p>ظ…ظ‚طھط¨ط³ط© ظ…ظ† طµظ†ط§ط¹ط© ط§ظ„ظ†ط¨ظٹط° (ط®طµظˆطµط§ظ‹ <strong>Pinot Noir</strong> ظپظٹ ط¨ظˆط±ط؛ظˆظ†ط¯ظٹ). طھظˆط¶ط¹ ط§ظ„ظƒط±ط²ط§طھ ط§ظ„ظƒط§ظ…ظ„ط© ط؛ظٹط± ط§ظ„ظ…ظ‚ط´ظˆط±ط© ظپظٹ ط¨ظٹط¦ط© <strong>COâ‚‚ ظ†ظ‚ظٹط©</strong> ظ…ط¶ط؛ظˆط·ط©. ط¯ط§ط®ظ„ ظƒظ„ ط«ظ…ط±ط©طŒ ظٹط­ط¯ط« طھط®ظ…ظٹط± ط¯ط§ط®ظ„ظٹ طھظ†طھط¬ ظپظٹظ‡ ط®ظ…ط§ط¦ط± ط·ط¨ظٹط¹ظٹط© ظ†ظƒظ‡ط§طھ ظ…ط°ظ‡ظ„ط©: طھظˆطھ ط£ط­ظ…ط± ظ…ط´ط±ظ‚طŒ ط£ط²ظ‡ط§ط± ط؛ط±ظٹط¨ط©طŒ ظˆظ†ط¨ظٹط°ظٹط© ظ…ط¹ظ‚ط¯ط©. ط£ط´ظ‡ط± ظ…ط«ط§ظ„: ظ‚ظ‡ظˆط© ظƒظˆط³طھط§ط±ظٹظƒط§ "Las Lajas" ط§ظ„طھظٹ ط­طµظ„طھ ط¹ظ„ظ‰ 93 ظ†ظ‚ط·ط© SCA â€” ط«ظˆط±ط© ظپظٹ ط¹ط§ظ„ظ… ط§ظ„طھط®ظ…ظٹط±.</p>
<h3>ًں§¬ ط§ظ„طھط®ظ…ظٹط± ط¨ط§ظ„ط®ظ…ط§ط¦ط± ط§ظ„ظ…ط®طھط§ط±ط© (Yeast Inoculation)</h3><p>ط¨ط¯ظ„ط§ظ‹ ظ…ظ† ط§ظ„ط§ط¹طھظ…ط§ط¯ ط¹ظ„ظ‰ ط§ظ„ط®ظ…ط§ط¦ط± ط§ظ„ط·ط¨ظٹط¹ظٹط© ط§ظ„ظ…ظˆط¬ظˆط¯ط© ط¹ظ„ظ‰ ط§ظ„ط«ظ…ط±ط©طŒ ظٹط¶ظٹظپ ط§ظ„ظ…ظ†طھط¬ظˆظ† <strong>ط³ظ„ط§ظ„ط§طھ ظ…ط­ط¯ط¯ط© ظ…ظ† ط§ظ„ط®ظ…ط§ط¦ط±</strong> ظ„ظ„طھط­ظƒظ… ط¨ط¯ظ‚ط© ظپظٹ ظ†ظˆط§طھط¬ ط§ظ„طھط®ظ…ظٹط±. ظ…ط«ظ„ط§ظ‹:<br>â€¢ <strong>Saccharomyces cerevisiae:</strong> ط§ظ„ط®ظ…ظٹط±ط© ط§ظ„ط£ظƒط«ط± ط´ظٹظˆط¹ط§ظ‹ â€” طھظ†طھط¬ ظ†ظƒظ‡ط§طھ ط§ظ„ظپط§ظƒظ‡ط© ط§ظ„ط­ظ…ط±ط§ط،<br>â€¢ <strong>Pichia kluyveri:</strong> طھظ†طھط¬ ظ†ظƒظ‡ط§طھ ط§ط³طھظˆط§ط¦ظٹط© ظˆط²ظ‡ط±ظٹط©<br>â€¢ <strong>Torulaspora delbrueckii:</strong> طھظ†طھط¬ ظ†ظƒظ‡ط§طھ ظ†ط¸ظٹظپط© ظ…ط¹ ط­ظ…ظˆط¶ط© ظ…ظ†ط®ظپط¶ط©</p>
<div class="hl"><strong>ًں“ٹ ط³ظˆظ‚ ط§ظ„ظ…ط¹ط§ظ„ط¬ط§طھ ط§ظ„طھط¬ط±ظٹط¨ظٹط©:</strong> ظپظٹ 2025طŒ طھط´ظƒظ„ ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„طھط¬ط±ظٹط¨ظٹط© 18% ظ…ظ† ظˆط§ط±ط¯ط§طھ specialty ظپظٹ ط£ظ…ط±ظٹظƒط§ ظˆط£ظˆط±ظˆط¨ط§. ظ…طھظˆط³ط· ط§ظ„ط³ط¹ط±: $15-25 ظ„ظ„ط±ط·ظ„ â€” ظ…ظ‚ط§ط¨ظ„ $3-5 ظ„ظ„ظ‚ظ‡ظˆط© ط§ظ„طھظ‚ظ„ظٹط¯ظٹط©. ط§ظ„ظ…ط³طھظ‡ظ„ظƒظˆظ† ظٹط¨ط­ط«ظˆظ† ط¹ظ† طھط¬ط§ط±ط¨ ط¬ط¯ظٹط¯ط©!</div>
<div class="qr-box"><strong>ًں’¬ طھط­ط¯ظ‘:</strong> ط§ط´طھط± ظ‚ظ‡ظˆط© "Anaerobic Natural" ظ…ظ† ظ…ط­ظ…طµط© ظ…ط­ظ„ظٹط©. ط­ط¶ظ‘ط±ظ‡ط§ ط¨ط·ط±ظٹظ‚طھظƒ ط§ظ„ظ…ظپط¶ظ„ط©. طµظپ ط§ظ„ظ†ظƒظ‡ط§طھ ط§ظ„طھظٹ طھط´ط¹ط± ط¨ظ‡ط§ â€” ظ‡ظ„ طھط´ط¨ظ‡ ط£ظٹ ظپط§ظƒظ‡ط© طھط¹ط±ظپظ‡ط§طں</div>`, en:`<h3>ًں§ھ Experimental Processing â€” New Frontiers in Flavor</h3><p>Experimental processing represents <strong>the new frontier of coffee innovation</strong>. In the last decade, experimental coffee has grown from 2% to over 15% of the specialty market, with producers seeking new ways to create unprecedented flavors.</p>
<h3>ًں«§ Anaerobic Fermentation</h3><p>Whole cherries are placed in <strong>sealed tanks</strong> with one-way valves preventing oxygen entry. Fermentation occurs via bacteria that don't need oxygen â€” producing bold, unconventional flavors.</p><table><tr><th>Parameter</th><th>Traditional</th><th>Anaerobic</th></tr><tr><td>Oxygen</td><td>Open to air</td><td>Completely sealed</td></tr><tr><td>Temperature</td><td>Ambient (20-30آ°C)</td><td>Controlled (15-25آ°C)</td></tr><tr><td>Duration</td><td>24-36 hours</td><td>48-120 hours</td></tr><tr><td>Resulting Flavors</td><td>Clean, floral</td><td>Tropical fruit, winey, exotic floral</td></tr><tr><td>Control Level</td><td>Low</td><td>High â€” measurable</td></tr></table>
<h3>ًںچ· Carbonic Maceration</h3><p>Borrowed from winemaking (especially <strong>Pinot Noir</strong> in Burgundy). Whole uncrushed cherries are placed in a <strong>pure COâ‚‚</strong> pressurized environment. Inside each fruit, internal fermentation occurs where natural yeasts produce stunning flavors: bright red berry, exotic florals, and complex winey notes. Famous example: Costa Rica "Las Lajas" scoring 93 SCA points â€” a revolution in fermentation.</p>
<h3>ًں§¬ Yeast Inoculation</h3><p>Instead of relying on natural yeasts on the fruit, producers add <strong>specific yeast strains</strong> to precisely control fermentation byproducts. For example:<br>â€¢ <strong>Saccharomyces cerevisiae:</strong> Most common â€” produces red fruit flavors<br>â€¢ <strong>Pichia kluyveri:</strong> Produces tropical and floral notes<br>â€¢ <strong>Torulaspora delbrueckii:</strong> Produces clean flavors with low acidity</p>
<div class="hl"><strong>ًں“ٹ Experimental Market:</strong> In 2025, experimental coffee makes up 18% of specialty imports in the US and Europe. Average price: $15-25/lb â€” vs $3-5 for conventional coffee. Consumers are seeking new experiences!</div>
<div class="quiz-box"><strong>ًں’¬ Challenge:</strong> Buy an "Anaerobic Natural" coffee from a local roaster. Brew it your favorite way. Describe the flavors you perceive â€” do they remind you of any fruit you know?</div>`};

L['C2-5'] = {ar:`<h3>ًں”— ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ظˆط§ظ„ظ†ظƒظ‡ط© â€” ظƒظٹظپ طھط®طھط§ط± ط·ط±ظٹظ‚ط© ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط­ط³ط¨ ط§ظ„ظ†طھظٹط¬ط© ط§ظ„ظ…ط±ط¬ظˆط©</h3><p>ط§ط®طھظٹط§ط± ط·ط±ظٹظ‚ط© ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ظ‡ظˆ <strong>ط£ظˆظ„ ظˆط£ظ‡ظ… ظ‚ط±ط§ط±</strong> ظٹط­ط¯ط¯ ط´ط®طµظٹط© ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ†ظ‡ط§ط¦ظٹط©. ظ„ظƒظ„ ط·ط±ظٹظ‚ط© ط£ط«ط±ظ‡ط§ ط§ظ„ظ…ط¨ط§ط´ط± ط¹ظ„ظ‰ <strong>ط§ظ„ط­ظ…ظˆط¶ط©طŒ ط§ظ„ط­ظ„ط§ظˆط©طŒ ط§ظ„ظ‚ظˆط§ظ…طŒ ظˆط§ظ„طھط¹ظ‚ظٹط¯</strong>.</p>
<h3>ًں“ٹ ظ…طµظپظˆظپط© ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ظˆط§ظ„ظ†ظƒظ‡ط©</h3>
<table><tr><th>ط·ط±ظٹظ‚ط© ط§ظ„ظ…ط¹ط§ظ„ط¬ط©</th><th>ط§ظ„ط­ظ…ظˆط¶ط©</th><th>ط§ظ„ط­ظ„ط§ظˆط©</th><th>ط§ظ„ظ‚ظˆط§ظ…</th><th>ط§ظ„طھط¹ظ‚ظٹط¯</th><th>ط§ظ„ظ†ط¸ط§ظپط©</th></tr><tr><td>ط·ط¨ظٹط¹ظٹط© (Natural)</td><td>ظ…ظ†ط®ظپط¶ط©</td><td>ط¹ط§ظ„ظٹط© ط¬ط¯ط§ظ‹</td><td>ظƒط§ظ…ظ„</td><td>ط¹ط§ظ„ظچ</td><td>ظ…ظ†ط®ظپط¶ط©</td></tr><tr><td>ظ…ط؛ط³ظˆظ„ط© (Washed)</td><td>ط¹ط§ظ„ظٹط©</td><td>ظ…طھظˆط³ط·ط©</td><td>ط®ظپظٹظپ-ظ…طھظˆط³ط·</td><td>ظ…طھظˆط³ط·</td><td>ط¹ط§ظ„ظٹط© ط¬ط¯ط§ظ‹</td></tr><tr><td>ط¹ط³ظ„ ط£طµظپط±</td><td>ظ…طھظˆط³ط·ط©</td><td>ط¹ط§ظ„ظٹط©</td><td>ظ…طھظˆط³ط·</td><td>ظ…طھظˆط³ط·</td><td>ط¹ط§ظ„ظٹط©</td></tr><tr><td>ط¹ط³ظ„ ط£ط­ظ…ط±</td><td>ظ…ظ†ط®ظپط¶ط©-ظ…طھظˆط³ط·ط©</td><td>ط¹ط§ظ„ظٹط© ط¬ط¯ط§ظ‹</td><td>ظƒط§ظ…ظ„</td><td>ط¹ط§ظ„ظچ</td><td>ظ…طھظˆط³ط·ط©</td></tr><tr><td>ط¹ط³ظ„ ط£ط³ظˆط¯</td><td>ظ…ظ†ط®ظپط¶ط©</td><td>ط¹ط§ظ„ظٹط© ط¬ط¯ط§ظ‹</td><td>ط«ظ‚ظٹظ„</td><td>ط¹ط§ظ„ظچ ط¬ط¯ط§ظ‹</td><td>ظ…ظ†ط®ظپط¶ط©</td></tr><tr><td>ظ„ط§ظ‡ظˆط§ط¦ظٹ</td><td>ظپط±ظٹط¯ط©</td><td>ط¹ط§ظ„ظٹط©</td><td>ظƒط§ظ…ظ„</td><td>ط§ط³طھط«ظ†ط§ط¦ظٹ</td><td>ظ…طھظˆط³ط·ط©</td></tr><tr><td>ظƒط±ط¨ظˆظ†ظٹظƒ</td><td>ظ†ط¨ظٹط°ظٹط©</td><td>ط¹ط§ظ„ظٹط© ط¬ط¯ط§ظ‹</td><td>ظƒط§ظ…ظ„-ط­ط±ظٹط±ظٹ</td><td>ط§ط³طھط«ظ†ط§ط¦ظٹ</td><td>ط¹ط§ظ„ظٹط©</td></tr></table>
<h3>ًںŒ،ï¸ڈ طھط£ط«ظٹط± ط§ظ„ظ…ظ†ط§ط® ظˆط§ظ„طھط±ط¨ط© (Terroir) ط¹ظ„ظ‰ ط§ط®طھظٹط§ط± ط§ظ„ظ…ط¹ط§ظ„ط¬ط©</h3><p><strong>ط§ظ„ظ…ظ†ط§ط·ظ‚ ط§ظ„ط¬ط§ظپط© (ط§ظ„ط¨ط±ط§ط²ظٹظ„طŒ ط§ظ„ظٹظ…ظ†):</strong> ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط·ط¨ظٹط¹ظٹط© ظ…ط«ط§ظ„ظٹط© ظ„ط£ظ† ط§ظ„ط±ط·ظˆط¨ط© ط§ظ„ظ…ظ†ط®ظپط¶ط© طھط³ظ…ط­ ط¨طھط¬ظپظٹظپ ط¨ط·ظٹط، ظˆظ…ظ†ط¶ط¨ط·. طھظ†طھط¬ ظ†ظƒظ‡ط§طھ ط´ظˆظƒظˆظ„ط§طھظٹط© ظˆط¬ظˆط²ظٹط© ظ…ط¹ ط­ظ„ط§ظˆط© ط¹ط§ظ„ظٹط©.<br><strong>ط§ظ„ظ…ظ†ط§ط·ظ‚ ط§ظ„ط±ط·ط¨ط© (ظƒظˆظ„ظˆظ…ط¨ظٹط§طŒ ظƒظٹظ†ظٹط§):</strong> ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ظ…ط؛ط³ظˆظ„ط© ط¶ط±ظˆط±ظٹط© ظ„ظ…ظ†ط¹ ط§ظ„طھط¹ظپظ† â€” ظ„ظƒظ† ظ‡ط°ط§ ظٹظ†طھط¬ ط£ط±ظˆط¹ ظ†ظƒظ‡ط§طھ ط§ظ„ط­ظ…ط¶ظٹط§طھ ظˆط§ظ„طھظˆطھ.<br><strong>ط§ظ„ظ…ظ†ط§ط·ظ‚ ط°ط§طھ ط§ظ„ظ…ظˆط§ط³ظ… ط§ظ„ظ…ظ…ط·ط±ط© ط§ظ„ظ…طھظ‚ط·ط¹ط© (ظƒظˆط³طھط§ط±ظٹظƒط§):</strong> ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط¨ط§ظ„ط¹ط³ظ„ ظ…ط«ط§ظ„ظٹط© â€” طھط­طھط§ط¬ ظˆظ‚طھ طھط¬ظپظٹظپ ط£ظ‚ظ„ ظ…ظ† ط§ظ„ط·ط¨ظٹط¹ظٹط© ظ„ظƒظ†ظ‡ط§ طھط­طھظپط¸ ط¨ط§ظ„ط­ظ„ط§ظˆط©.</p>
<h3>ًں§ھ ط§ظ„طھظˆط¬ظٹظ‡ ط§ظ„ط¹ظ…ظ„ظٹ ظ„ظ„ظ…ط­ظ…طµ</h3><p>ظƒظ…ط­ظ…طµطŒ ط§ط®طھط± ط·ط±ظٹظ‚ط© ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط¨ظ†ط§ط،ظ‹ ط¹ظ„ظ‰ ط§ظ„ظ†طھظٹط¬ط© ط§ظ„ظ…ط±ط¬ظˆط©:<br>â€¢ <strong>طھط±ظٹط¯ ط­ظ…ظˆط¶ط© ظ…طھط£ظ„ظ‚ط© ظˆظ†ظƒظ‡ط§طھ ط²ظ‡ط±ظٹط©طں</strong> â†’ ط§ط®طھط± ظ…ط؛ط³ظˆظ„ط© â€” ظ…ط«ظ„ ط¥ط«ظٹظˆط¨ظٹط§ ظٹظٹط±ط؛ط§ط´ظٹظپظٹ ط§ظ„ظ…ط؛ط³ظˆظ„ط©<br>â€¢ <strong>طھط±ظٹط¯ ط­ظ„ط§ظˆط© ظپط§ظƒظ‡ظٹط© ط¬ط±ظٹط¦ط©طں</strong> â†’ ط§ط®طھط± ط·ط¨ظٹط¹ظٹط© â€” ظ…ط«ظ„ ط¥ط«ظٹظˆط¨ظٹط§ ط·ط¨ظٹط¹ظٹط© ط£ظˆ ط¨ط±ط§ط²ظٹظ„ظٹط© ط·ط¨ظٹط¹ظٹط©<br>â€¢ <strong>طھط±ظٹط¯ طھظˆط§ط²ظ†ط§ظ‹ ط¨ظٹظ† ط§ظ„ط­ظ„ط§ظˆط© ظˆط§ظ„ظ†ط¸ط§ظپط©طں</strong> â†’ ط§ط®طھط± ط¹ط³ظ„ â€” ظ…ط«ظ„ ظƒظˆط³طھط§ط±ظٹظƒط§ ط¹ط³ظ„ ط£ط­ظ…ط±<br>â€¢ <strong>طھط±ظٹط¯ ط¥ط¨ظ‡ط§ط± ط²ط¨ط§ط¦ظ†ظƒ ط¨ظ†ظƒظ‡ط§طھ ط؛ظٹط± ظ…طھظˆظ‚ط¹ط©طں</strong> â†’ ط§ط®طھط± طھط¬ط±ظٹط¨ظٹط© â€” ظ„ط§ظ‡ظˆط§ط¦ظٹ ط£ظˆ ظƒط±ط¨ظˆظ†ظٹظƒ</p>
<div class="info-box"><strong>ًں’، ظ‚ط§ط¹ط¯ط© ط°ظ‡ط¨ظٹط©:</strong> ظ„ط§ طھظˆط¬ط¯ ظ…ط¹ط§ظ„ط¬ط© "ط£ظپط¶ظ„" ظ…ظ† ط£ط®ط±ظ‰ â€” ظƒظ„ ظ…ط¹ط§ظ„ط¬ط© طھظƒط´ظپ ط¬ط§ظ†ط¨ط§ظ‹ ظ…ط®طھظ„ظپط§ظ‹ ظ…ظ† ط´ط®طµظٹط© ط§ظ„ط¨ظ†. ط§ظ„ظ…ط­ظ…طµ ط§ظ„ظ…ط­طھط±ظپ ظٹط®طھط§ط± ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„طھظٹ طھط¨ط±ط² ط£ظپط¶ظ„ ظ…ط§ ظپظٹ ط§ظ„ط¨ظ† ط§ظ„ط°ظٹ ظٹط¹ظ…ظ„ ظ…ط¹ظ‡.</div>
<div class="ok-box"><strong>ًںژ¯ ظ…ط´ط±ظˆط¹:</strong> ط§ط®طھط± ط¨ظ†ط§ظ‹ ظˆط§ط­ط¯ط§ظ‹ ظ…ظ† ط£طµظ„ ظˆط§ط­ط¯ (ظ…ط«ظ„ط§ظ‹: ط¥ط«ظٹظˆط¨ظٹ). ط§ط´طھط±ظ‡ ط¨ط«ظ„ط§ط« ظ…ط¹ط§ظ„ط¬ط§طھ ظ…ط®طھظ„ظپط©: ط·ط¨ظٹط¹ظٹط©طŒ ظ…ط؛ط³ظˆظ„ط©طŒ ظˆط¹ط³ظ„. ط§ط¹ظ…ظ„ ظƒط§ط¨ظٹظ†ط¬ ظ„ظ„ط«ظ„ط§ط«ط©. طµظپ ط§ظ„ط§ط®طھظ„ط§ظپط§طھ ظپظٹ ط§ظ„ط­ظ…ظˆط¶ط©طŒ ط§ظ„ط­ظ„ط§ظˆط©طŒ ط§ظ„ظ‚ظˆط§ظ…طŒ ظˆط§ظ„ظ†ط¸ط§ظپط©. ط£ظٹ ظ…ط¹ط§ظ„ط¬ط© طھظپط¶ظ‘ظ„ظ‡ط§ ظˆظ„ظ…ط§ط°ط§طں</div>`, en:`<h3>ًں”— Processing & Flavor Correlation â€” Choosing the Right Method for Your Goal</h3><p>Choosing a processing method is the <strong>first and most important decision</strong> determining the final coffee character. Each method directly impacts <strong>acidity, sweetness, body, and complexity</strong>.</p>
<h3>ًں“ٹ Processing & Flavor Matrix</h3>
<table><tr><th>Method</th><th>Acidity</th><th>Sweetness</th><th>Body</th><th>Complexity</th><th>Cleanliness</th></tr><tr><td>Natural</td><td>Low</td><td>Very high</td><td>Full</td><td>High</td><td>Low</td></tr><tr><td>Washed</td><td>High</td><td>Medium</td><td>Light-Med</td><td>Medium</td><td>Very high</td></tr><tr><td>Yellow Honey</td><td>Medium</td><td>High</td><td>Medium</td><td>Medium</td><td>High</td></tr><tr><td>Red Honey</td><td>Low-Med</td><td>Very high</td><td>Full</td><td>High</td><td>Medium</td></tr><tr><td>Black Honey</td><td>Low</td><td>Very high</td><td>Heavy</td><td>Very high</td><td>Low</td></tr><tr><td>Anaerobic</td><td>Unique</td><td>High</td><td>Full</td><td>Exceptional</td><td>Medium</td></tr><tr><td>Carbonic Maceration</td><td>Winey</td><td>Very high</td><td>Full-Silky</td><td>Exceptional</td><td>High</td></tr></table>
<h3>ًںŒ،ï¸ڈ Climate & Terroir Effect on Processing Choice</h3><p><strong>Dry regions (Brazil, Yemen):</strong> Natural processing is ideal because low humidity allows slow, controlled drying. Produces chocolatey, nutty flavors with high sweetness.<br><strong>Wet regions (Colombia, Kenya):</strong> Washed processing is necessary to prevent mold â€” but this produces the brightest citrus and berry flavors.<br><strong>Regions with intermittent rainy seasons (Costa Rica):</strong> Honey processing is ideal â€” needs less drying time than natural but retains sweetness.</p>
<h3>ًں§ھ Practical Guide for Roasters</h3><p>As a roaster, choose your processing method based on desired outcome:<br>â€¢ <strong>Want bright acidity and floral notes?</strong> â†’ Choose washed â€” like Ethiopian Yirgacheffe washed<br>â€¢ <strong>Want bold fruity sweetness?</strong> â†’ Choose natural â€” like Ethiopian or Brazilian natural<br>â€¢ <strong>Want balance between sweetness and cleanliness?</strong> â†’ Choose honey â€” like Costa Rica red honey<br>â€¢ <strong>Want to amaze customers with unexpected flavors?</strong> â†’ Choose experimental â€” anaerobic or carbonic maceration</p>
<div class="info-box"><strong>ًں’، Golden Rule:</strong> No processing method is "better" than another â€” each reveals a different aspect of the bean's character. The professional roaster chooses the method that best highlights the coffee they work with.</div>
<div class="ok-box"><strong>ًںژ¯ Project:</strong> Choose one coffee from one origin (e.g., Ethiopian). Buy it in three different processing methods: natural, washed, and honey. Cup all three. Describe differences in acidity, sweetness, body, and cleanliness. Which processing do you prefer and why?</div>`};

L['C3-4'] = {ar:`<h3>ًں“± طھط³ظˆظٹظ‚ ط§ظ„ظ…ظ‚ظ‡ظ‰ â€” ظ…ظ† ط£ظˆظ„ ط²ط¨ظˆظ† ط¥ظ„ظ‰ ظ…ظ„ظٹظˆظ† ظ…طھط§ط¨ط¹</h3><p>ظپظٹ ط³ظˆظ‚ ط§ظ„ظٹظˆظ…طŒ <strong>ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط¬ظٹط¯ط© ظˆط­ط¯ظ‡ط§ ظ„ط§ طھظƒظپظٹ</strong>. طھط­طھط§ط¬ ط§ط³طھط±ط§طھظٹط¬ظٹط© طھط³ظˆظٹظ‚ طھط¬ط°ط¨ ط§ظ„ط²ط¨ط§ط¦ظ† ظˆطھط­ظˆظ„ظ‡ظ… ط¥ظ„ظ‰ ط³ظپط±ط§ط، ظ„ط¹ظ„ط§ظ…طھظƒ ط§ظ„طھط¬ط§ط±ظٹط©.</p>
<h3>ًں“¸ ط¥ظ†ط³طھط؛ط±ط§ظ… â€” ظˆط§ط¬ظ‡ط© ط§ظ„ظ…ظ‚ظ‡ظ‰ ط§ظ„ط±ظ‚ظ…ظٹط©</h3><p><strong>60% ظ…ظ† ط§ظ„ط²ط¨ط§ط¦ظ†</strong> ظٹظƒطھط´ظپظˆظ† ظ…ظ‚ط§ظ‡ظٹ ط¬ط¯ظٹط¯ط© ط¹ط¨ط± ط¥ظ†ط³طھط؛ط±ط§ظ…. ط¥ظ„ظٹظƒ ط®ط·ط© ط§ظ„ظ†ط´ط± ط§ظ„ط£ط³ط¨ظˆط¹ظٹط©:<br><strong>ط§ظ„ط§ط«ظ†ظٹظ†:</strong> طµظˆط±ط© ظ„ط§طھظٹظ‡ ط¢ط±طھ (ط£ط¹ظ„ظ‰ ظ†ط³ط¨ط© طھظپط§ط¹ظ„)<br><strong>ط§ظ„ط£ط±ط¨ط¹ط§ط،:</strong> ظپظٹط¯ظٹظˆ ظ‚طµظٹط± ظ„طھط­ط¶ظٹط± ظ…ط´ط±ظˆط¨ (Reels â€” ظˆطµظˆظ„ ط£ط¹ظ„ظ‰ 200%)<br><strong>ط§ظ„ط¬ظ…ط¹ط©:</strong> طµظˆط±ط© ط§ظ„ظ…ظ‚ظ‡ظ‰ ظˆط§ظ„ط£ط¬ظˆط§ط، (ظٹط¬ط°ط¨ ط§ظ„ط²ط¨ط§ط¦ظ† ظ„ظ„ط²ظٹط§ط±ط©)<br><strong>ط§ظ„ط³ط¨طھ:</strong> ظ‚طµط© "ظˆط±ط§ط، ط§ظ„ظƒظˆط§ظ„ظٹط³" â€” ظپط±ظٹظ‚ ط§ظ„ط¹ظ…ظ„ ظٹط­ظ…طµ ط£ظˆ ظٹط­ط¶ظ‘ط±</p>
<h3>ًں’³ ط¨ط±ظ†ط§ظ…ط¬ ط§ظ„ظˆظ„ط§ط، â€” ظ„ظٹط³ ظ…ط¬ط±ط¯ ط¨ط·ط§ظ‚ط© طھط«ظ‚ظٹط¨</h3><p>ط¨ط±ط§ظ…ط¬ ط§ظ„ظˆظ„ط§ط، ط§ظ„ط±ظ‚ظ…ظٹط© (ظ…ط«ظ„ Belly, Loyverse) طھط²ظٹط¯ ظ…ط¨ظٹط¹ط§طھظƒ 20-40%. ط§ظ„ظپظƒط±ط©: 10 ظ†ظ‚ط§ط· = ظ…ط´ط±ظˆط¨ ظ…ط¬ط§ظ†ظٹ. ط§ظ„ظ†ظ‚ط·ط© = ط£ظٹ ظ…ط´طھط±ظٹط§طھ ط¨ظ‚ظٹظ…ط© 10 ط¬ظ†ظٹظ‡. ط§ظ„ط²ط¨ظˆظ† ط§ظ„ط¹ط§ط¦ط¯ ظ‡ظˆ ط£ط؛ظ„ظ‰ ط²ط¨ظˆظ† ظ„ط¯ظٹظƒ â€” ظƒظ„ظپط© ط§ظƒطھط³ط§ط¨ ط²ط¨ظˆظ† ط¬ط¯ظٹط¯ 5 ط£ط¶ط¹ط§ظپ ط§ظ„ط§ط­طھظپط§ط¸ ط¨ط²ط¨ظˆظ† ظ…ظˆط¬ظˆط¯.</p>
<h3>ًں¤‌ ط§ظ„طھط³ظˆظٹظ‚ ط§ظ„ظ…ط¬طھظ…ط¹ظٹ</h3><p>â€¢ <strong>ط¥ظٹظپظٹظ†طھط§طھ ط£ط³ط¨ظˆط¹ظٹط©:</strong> ظˆط±ط´ ظƒط§ط¨ظٹظ†ط¬ ظ…ط¬ط§ظ†ظٹط© ظٹظˆظ… ط§ظ„ط®ظ…ظٹط³ â€” طھط¬ط°ط¨ 10-15 ط´ط®طµط§ظ‹ ظٹطھط¹ظ„ظ…ظˆظ† ظˆظٹط´طھط±ظˆظ† ظ‚ظ‡ظˆطھظƒ<br>â€¢ <strong>طھط­ط¯ظ‘ظٹ ط§ظ„ظ„ط§طھظٹظ‡ ط¢ط±طھ:</strong> ظ…ط³ط§ط¨ظ‚ط© ط´ظ‡ط±ظٹط© ط¨ظٹظ† ط§ظ„ط²ط¨ط§ط¦ظ† â€” ط§ظ„ط¬ط§ط¦ط²ط©: ظ‚ظ‡ظˆط© ظ…ط¬ط§ظ†ظٹط© ط´ظ‡ط±<br>â€¢ <strong>طھط¹ط§ظˆظ† ظ…ط¹ ظ…ط­ظ„ط§طھ ظ…ط­ظ„ظٹط©:</strong> ظ…ط®ط¨ط² ظٹظ‚ط¯ظ… ظ…ط¹ط¬ظ†ط§طھظƒ â€” ظˆط£ظ†طھ طھظ‚ط¯ظ… ظ‚ظ‡ظˆطھظ‡. ط®طµظ… ظ…طھط¨ط§ط¯ظ„ ظ„ظ„ط²ط¨ط§ط¦ظ†</p>
<div class="err-box"><strong>â‌Œ ط®ط·ط£ ط´ط§ط¦ط¹:</strong> ط§ظ„طھط±ظƒظٹط² ظپظ‚ط· ط¹ظ„ظ‰ ط¬ط°ط¨ ط²ط¨ط§ط¦ظ† ط¬ط¯ط¯ ظˆط¥ظ‡ظ…ط§ظ„ ط§ظ„ط²ط¨ط§ط¦ظ† ط§ظ„ط­ط§ظ„ظٹظٹظ†. ط£ط³ظ‡ظ„ ظˆط£ط±ط®طµ ط¨ظٹط¹ ظ„ظ„ط²ط¨ظˆظ† ط§ظ„ظ…ظˆط¬ظˆط¯ ط¨ط¯ظ„ط§ظ‹ ظ…ظ† ط§ظ„ط¨ط­ط« ط¹ظ† ط²ط¨ظˆظ† ط¬ط¯ظٹط¯. ط¨ط±ظ†ط§ظ…ط¬ ظˆظ„ط§ط، ط¨ط³ظٹط· ظٹط­ط¯ط« ظپط±ظ‚ط§ظ‹ ظƒط¨ظٹط±ط§ظ‹!</div>`, en:`<h3>ًں“± Marketing Your Cafe â€” From First Customer to Million Followers</h3><p>In today's market, <strong>good coffee alone isn't enough</strong>. You need a marketing strategy that attracts customers and turns them into brand ambassadors.</p>
<h3>ًں“¸ Instagram â€” The Cafe's Digital Front</h3><p><strong>60% of customers</strong> discover new cafes through Instagram. Weekly posting plan:<br><strong>Monday:</strong> Latte art photo (highest engagement)<br><strong>Wednesday:</strong> Short brew video (Reels â€” 200% more reach)<br><strong>Friday:</strong> Cafe atmosphere photo (drives visits)<br><strong>Saturday:</strong> Behind-the-scenes story â€” team roasting or prepping</p>
<h3>ًں’³ Loyalty Program â€” Not Just a Punch Card</h3><p>Digital loyalty programs (Belly, Loyverse) increase sales 20-40%. Idea: 10 points = free drink. Points per $2 spent. A returning customer is your most valuable asset â€” acquiring a new customer costs 5x more than retaining an existing one.</p>
<h3>ًں¤‌ Community Marketing</h3><p>â€¢ <strong>Weekly events:</strong> Free cupping workshop Thursday â€” attracts 10-15 people who learn and buy your coffee<br>â€¢ <strong>Latte Art Challenge:</strong> Monthly customer competition â€” prize: free coffee for a month<br>â€¢ <strong>Local business collabs:</strong> Bakery sells your pastries â€” you serve their coffee. Mutual customer discounts</p>
<div class="err-box"><strong>â‌Œ Common Mistake:</strong> Focusing only on new customers and ignoring existing ones. It's easier and cheaper to sell to an existing customer than find a new one. A simple loyalty program makes a huge difference!</div>`};

/* ===== Quizzes ===== */
const Q = {};
function qz(key, a, e){ Q[key] = {ar:a,en:e} }
qz('A1-1','ًں’¬ ظƒظ… ظ†ظˆط¹ط§ظ‹ ظ…ظ† ط§ظ„ط¨ظ† ظٹط³ظٹط·ط± ط¹ظ„ظ‰ ط§ظ„ط¥ظ†طھط§ط¬ ط§ظ„طھط¬ط§ط±ظٹ ط§ظ„ط¹ط§ظ„ظ…ظٹطں (ط§ظ„ط¥ط¬ط§ط¨ط©: ظ†ظˆط¹ط§ظ† â€” ط£ط±ط§ط¨ظٹظƒط§ 60-70% ظˆط±ظˆط¨ظˆط³طھط§ 30-40%)','ًں’¬ How many coffee species dominate global production? (Answer: Two â€” Arabica 60-70% and Robusta 30-40%)');
qz('A1-2','ًں’¬ ط£ظٹظ† ط§ظپطھطھط­ ط£ظˆظ„ ظ…ظ‚ظ‡ظ‰ ظپظٹ ط§ظ„طھط§ط±ظٹط®طں (ط§ظ„ط¥ط¬ط§ط¨ط©: ظ…ظƒط©طŒ ط£ظˆط§ط¦ظ„ ط§ظ„ظ‚ط±ظ† ط§ظ„ط³ط§ط¯ط³ ط¹ط´ط±)','ًں’¬ Where was the first coffeehouse in history? (Answer: Mecca, early 16th century)');
qz('A2-0','ًں’¬ ظ…ط§ ظ‡ظٹ ط§ظ„ظ†ط³ط¨ط© ط§ظ„ظ…ط«ظ„ظ‰ ظ„ظ„ط§ط³طھط®ظ„ط§طµ ط­ط³ط¨ SCAطں (ط§ظ„ط¥ط¬ط§ط¨ط©: 18-22%)','ًں’¬ What is the SCA optimal extraction yield? (Answer: 18-22%)');
qz('A2-1','ًں’¬ ط£ظٹ ط·ط±ظٹظ‚ط© طھط­ط¶ظٹط± طھظ†طµط­ ط¨ظ‡ط§ ظ„ظ„ظ…ط¨طھط¯ط¦ظٹظ†طں (ط§ظ„ط¥ط¬ط§ط¨ط©: V60 â€” ط§ظ„ط£ط¨ط³ط· ظˆط§ظ„ط£ظƒط«ط± طھط­ظƒظ…ط§ظ‹)','ًں’¬ Which brewing method do you recommend for beginners? (Answer: V60 â€” simplest and most controllable)');
qz('A2-3','ًں’¬ ظƒظ… ظ…ظ† ط§ظ„ظˆظ‚طھ طھظ†طھط¸ط± ط¨ط¹ط¯ طµط¨ ط§ظ„ظ€ Bloom ظپظٹ طھط­ط¶ظٹط± V60طں (ط§ظ„ط¥ط¬ط§ط¨ط©: 30 ط«ط§ظ†ظٹط©)','ًں’¬ How long do you wait after pouring the bloom in V60? (Answer: 30 seconds)');
qz('A3-1','ًں’¬ ظ…ط§ ظ‡ظٹ ط§ظ„ط­ط±ط§ط±ط© ط§ظ„ظ…ط«ط§ظ„ظٹط© ظ„طھط³ط®ظٹظ† ط§ظ„ط­ظ„ظٹط¨طں (ط§ظ„ط¥ط¬ط§ط¨ط©: 55-65آ°ظ… â€” ط£ظƒط«ط± ظ…ظ† 70آ°ظ… ظٹط­ط±ظ‚ ط§ظ„ط¨ط±ظˆطھظٹظ†ط§طھ)','ًں’¬ What is the ideal milk steaming temperature? (Answer: 55-65آ°C â€” above 70آ°C burns proteins)');
qz('A3-2','ًں’¬ ظ…ط§ ظ‡ظٹ ظ†ط³ط¨ط© ط§ظ„ظƒط§ط¨طھط´ظٹظ†ظˆ ط§ظ„ظ…ط«ط§ظ„ظٹط©طں (ط§ظ„ط¥ط¬ط§ط¨ط©: 1:1:1 â€” ط¥ط³ط¨ط±ظٹط³ظˆ : ط­ظ„ظٹط¨ ظ…ط¨ط®ط± : ط±ط؛ظˆط©)','ًں’¬ What is the ideal cappuccino ratio? (Answer: 1:1:1 â€” espresso : steamed milk : foam)');
qz('B1-1','ًں’¬ ظ…ط§ط°ط§ طھط¹ظ†ظٹ RoR ظپظٹ ط§ظ„طھط­ظ…ظٹطµطں (ط§ظ„ط¥ط¬ط§ط¨ط©: Rate of Rise â€” ظ…ط¹ط¯ظ„ ط§ط±طھظپط§ط¹ ط§ظ„ط­ط±ط§ط±ط© ط¨ط§ظ„ط¯ط±ط¬ط© ظپظٹ ط§ظ„ط¯ظ‚ظٹظ‚ط©)','ًں’¬ What does RoR mean in roasting? (Answer: Rate of Rise â€” temperature increase rate in آ°C/min)');
qz('B1-2','ًں’¬ ظ‡ظ„ ط§ظ„ط¨ظ† ط§ظ„ظپط§طھط­ ظٹط­طھط§ط¬ ط·ط­ظ†ط§ظ‹ ط£ط¯ظ‚ ط£ظ… ط£ط®ط´ظ†طں (ط§ظ„ط¥ط¬ط§ط¨ط©: ط£ط¯ظ‚ â€” ظ„ط£ظ†ظ‡ ط£ظƒط«ط± ظƒط«ط§ظپط©)','ًں’¬ Does light roast need finer or coarser grind? (Answer: Finer â€” it\'s denser)');
qz('B2-0','ًں’¬ ظ…ط§ ظ‡ظˆ ظ†ط·ط§ظ‚ TDS ط§ظ„ظ…ط«ط§ظ„ظٹ ظ„ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ظ‚ط·ط±ط© ط­ط³ط¨ SCAطں (ط§ظ„ط¥ط¬ط§ط¨ط©: 150-175 ppm)','ًں’¬ What is the ideal TDS range for drip coffee per SCA? (Answer: 150-175 ppm)');
qz('B2-1','ًں’¬ ط¨ط£ظٹ ط¬ظ‡ط§ط² ظٹظ‚ط§ط³ TDSطں (ط§ظ„ط¥ط¬ط§ط¨ط©: Refractometer â€” ط¬ظ‡ط§ط² ظ‚ظٹط§ط³ ط§ظ„ط§ظ†ظƒط³ط§ط±)','ًں’¬ What device measures TDS? (Answer: Refractometer)');
qz('B2-2','ًں’¬ ظ…ط§ ظ‡ظ…ط§ ط§ظ„ظ†ط¸ط§ظ…ط§ظ† ط§ظ„ظƒط§ظپظٹط§ظ† ظ„ظ…ط¹ط§ظ„ط¬ط© ظ…ظٹط§ظ‡ ط§ظ„ظ…ظ‚ط§ظ‡ظٹطں (ط§ظ„ط¥ط¬ط§ط¨ط©: ظƒط±ط¨ظˆظ† ظ†ط´ط· + طھط¨ط§ط¯ظ„ ط£ظٹظˆظ†ظٹ)','ًں’¬ What two systems are sufficient for cafe water treatment? (Answer: Activated carbon + ion exchange)');
qz('B3-0','ًں’¬ ظ…ط§ ظ‡ظˆ ظ…ط¯ظ‰ ط·ط­ظ† ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ط¨ط§ظ„ظ…ظٹظƒط±ظˆظ†طں (ط§ظ„ط¥ط¬ط§ط¨ط©: 200-350 ظ…ظٹظƒط±ظˆظ†)','ًں’¬ What is the espresso grind range in microns? (Answer: 200-350 microns)');
qz('C1-0','ًں’¬ ظƒظ… ط¯ظ‚ظٹظ‚ط© طھظ†طھط¸ط± ظ‚ط¨ظ„ طھط°ظˆظ‚ ط§ظ„ظ‚ظ‡ظˆط© ط¨ط¹ط¯ ط¥ط¶ط§ظپط© ط§ظ„ظ…ط§ط، ظپظٹ ط§ظ„ظƒط§ط¨ظٹظ†ط¬طں (ط§ظ„ط¥ط¬ط§ط¨ط©: 8-15 ط¯ظ‚ط§ط¦ظ‚)','ًں’¬ How many minutes before tasting after adding water in cupping? (Answer: 8-15 minutes)');
qz('C1-2','ًں’¬ ظ…ط§ ظ‡ظٹ ط§ظ„ط¯ط±ط¬ط© ط§ظ„طھظٹ طھط¬ط¹ظ„ ط§ظ„ط¨ظ† Specialty Gradeطں (ط§ظ„ط¥ط¬ط§ط¨ط©: 80+ ظ…ظ† 100)','ًں’¬ What score qualifies coffee as Specialty Grade? (Answer: 80+ out of 100)');
qz('C2-0','ًں’¬ ظƒظ… طھط³طھط؛ط±ظ‚ ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط·ط¨ظٹط¹ظٹط© ظ…ظ† ط§ظ„ظˆظ‚طھطں (ط§ظ„ط¥ط¬ط§ط¨ط©: 2-4 ط£ط³ط§ط¨ظٹط¹ طھط­طھ ط§ظ„ط´ظ…ط³)','ًں’¬ How long does natural processing take? (Answer: 2-4 weeks in the sun)');
qz('C2-1','ًں’¬ ظƒظ… ط³ط§ط¹ط© طھط®ظ…ظٹط± ظپظٹ ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ظ…ط؛ط³ظˆظ„ط©طں (ط§ظ„ط¥ط¬ط§ط¨ط©: 24-36 ط³ط§ط¹ط© ظپظٹ ط§ظ„ظ…ط§ط،)','ًں’¬ How many hours of fermentation in washed processing? (Answer: 24-36 hours in water)');
qz('C2-2','ًں’¬ ظ…ط§ ظ‡ظٹ ط£ظ†ظˆط§ط¹ ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط¨ط§ظ„ط¹ط³ظ„طں (ط§ظ„ط¥ط¬ط§ط¨ط©: ط£طµظپط±طŒ ط£ط­ظ…ط±طŒ ط£ط³ظˆط¯ â€” ط­ط³ط¨ ظƒظ…ظٹط© ط§ظ„ظ„ط¨ ط§ظ„ظ…طھط±ظˆظƒ)','ًں’¬ What are the types of honey processing? (Answer: Yellow, red, black â€” depending on mucilage amount)');
qz('C3-3','ًں’¬ ظƒظ… ظ…ط±ط© طھظ†طµط­ ط¨ط¹ظ…ظ„ ظƒط§ط¨ظٹظ†ط¬ ظ…ط¹ ط§ظ„ظپط±ظٹظ‚طں (ط§ظ„ط¥ط¬ط§ط¨ط©: ط£ط³ط¨ظˆط¹ظٹط§ظ‹)','ًں’¬ How often do you recommend cupping with the team? (Answer: Weekly)');

/* ===== Interactive Exam Questions ===== */
const EX = {
  A:[
    {q:{ar:'ظ…ط§ ط§ظ„ظ†ظˆط¹ط§ظ† ط§ظ„ظ…ط³ظٹط·ط±ط§ظ† ط¹ظ„ظ‰ ط§ظ„ط¥ظ†طھط§ط¬ ط§ظ„طھط¬ط§ط±ظٹ ظ„ظ„ط¨ظ†طں',en:'Which two species dominate commercial coffee production?'},opts:[
      {ar:'ط£ط±ط§ط¨ظٹظƒط§ ظˆط±ظˆط¨ظˆط³طھط§',en:'Arabica & Robusta'},
      {ar:'ط£ط±ط§ط¨ظٹظƒط§ ظˆظ„ظٹط¨ظٹط±ظٹظƒط§',en:'Arabica & Liberica'},
      {ar:'ط±ظˆط¨ظˆط³طھط§ ظˆط¥ظƒط³ظ„ط³ط§',en:'Robusta & Excelsa'},
      {ar:'ط£ط±ط§ط¨ظٹظƒط§ ظپظ‚ط·',en:'Arabica only'}
    ],ans:0},
    {q:{ar:'ط£ظٹظ† ط§ظپطھظڈطھط­ ط£ظˆظ„ ظ…ظ‚ظ‡ظ‰ ظپظٹ ط§ظ„طھط§ط±ظٹط®طں',en:'Where was the first coffeehouse in history?'},opts:[
      {ar:'ظ„ظ†ط¯ظ†',en:'London'},
      {ar:'ظ…ظƒط©',en:'Mecca'},
      {ar:'ط¨ط§ط±ظٹط³',en:'Paris'},
      {ar:'ط¥ط³ط·ظ†ط¨ظˆظ„',en:'Istanbul'}
    ],ans:1},
    {q:{ar:'ظ…ط§ ط§ظ„ظ†ط³ط¨ط© ط§ظ„ظ…ط«ظ„ظ‰ ظ„ظ„ط§ط³طھط®ظ„ط§طµ ط­ط³ط¨ SCAطں',en:'What is the optimal extraction yield per SCA?'},opts:[
      {ar:'10-15%',en:'10-15%'},
      {ar:'18-22%',en:'18-22%'},
      {ar:'25-30%',en:'25-30%'},
      {ar:'30-35%',en:'30-35%'}
    ],ans:1},
    {q:{ar:'ظƒظ… ط«ط§ظ†ظٹط© طھظ†طھط¸ط± ط¨ط¹ط¯ طµط¨ ط§ظ„ظ€ Bloom ظپظٹ طھط­ط¶ظٹط± V60طں',en:'How many seconds after the bloom pour in V60?'},opts:[
      {ar:'15 ط«ط§ظ†ظٹط©',en:'15 seconds'},
      {ar:'20 ط«ط§ظ†ظٹط©',en:'20 seconds'},
      {ar:'30 ط«ط§ظ†ظٹط©',en:'30 seconds'},
      {ar:'45 ط«ط§ظ†ظٹط©',en:'45 seconds'}
    ],ans:2},
    {q:{ar:'ظ…ط§ ط¯ط±ط¬ط© ط­ط±ط§ط±ط© طھط³ط®ظٹظ† ط§ظ„ط­ظ„ظٹط¨ ط§ظ„ظ…ط«ط§ظ„ظٹط©طں',en:'What is the ideal milk steaming temperature?'},opts:[
      {ar:'40-50آ°ظ…',en:'40-50آ°C'},
      {ar:'55-65آ°ظ…',en:'55-65آ°C'},
      {ar:'70-80آ°ظ…',en:'70-80آ°C'},
      {ar:'85-95آ°ظ…',en:'85-95آ°C'}
    ],ans:1},
    {q:{ar:'ظ…ط§ ظ†ط³ط¨ط© ط§ظ„ظƒط§ط¨طھط´ظٹظ†ظˆ ط§ظ„ظ…ط«ط§ظ„ظٹط©طں',en:'What is the ideal cappuccino ratio?'},opts:[
      {ar:'1:1:1 (ط¥ط³ط¨ط±ظٹط³ظˆ:ط­ظ„ظٹط¨:ط±ط؛ظˆط©)',en:'1:1:1 (espresso:milk:foam)'},
      {ar:'1:2:1',en:'1:2:1'},
      {ar:'2:1:1',en:'2:1:1'},
      {ar:'1:1:2',en:'1:1:2'}
    ],ans:0},
    {q:{ar:'ظƒظ… ظ†ظˆط¹ط§ظ‹ ظ…ظ† ط§ظ„ط¨ظ† ظٹط³ظٹط·ط± ط¹ظ„ظ‰ ط§ظ„ط¥ظ†طھط§ط¬ ط§ظ„ط¹ط§ظ„ظ…ظٹطں',en:'How many coffee species dominate world production?'},opts:[
      {ar:'ظ†ظˆط¹ ظˆط§ط­ط¯',en:'One'},
      {ar:'ظ†ظˆط¹ط§ظ†',en:'Two'},
      {ar:'ط«ظ„ط§ط«ط© ط£ظ†ظˆط§ط¹',en:'Three'},
      {ar:'ط£ط±ط¨ط¹ط© ط£ظ†ظˆط§ط¹',en:'Four'}
    ],ans:1},
    {q:{ar:'ط£ظٹ ط·ط¨ظ‚ط© ظ…ظ† ط«ظ…ط±ط© ط§ظ„ظ‚ظ‡ظˆط© طھطھط­ظˆظ„ ط¥ظ„ظ‰ Chaff ط£ط«ظ†ط§ط، ط§ظ„طھط­ظ…ظٹطµطں',en:'Which layer becomes chaff during roasting?'},opts:[
      {ar:'ط§ظ„ظ‚ط´ط±ط© ط§ظ„ط®ط§ط±ط¬ظٹط© (Exocarp)',en:'Exocarp'},
      {ar:'ط§ظ„ظ„ط¨ (Mucilage)',en:'Mucilage'},
      {ar:'ط§ظ„ط؛ط´ط§ط، ط§ظ„ظپط¶ظٹ (Silver Skin)',en:'Silver Skin'},
      {ar:'ط§ظ„ط¨ط°ط±ط© (Endosperm)',en:'Endosperm'}
    ],ans:2},
    {q:{ar:'ط£ظٹ ط·ط±ظٹظ‚ط© طھط­ط¶ظٹط± طھظ†طµط­ ط¨ظ‡ط§ ظ„ظ„ظ…ط¨طھط¯ط¦ظٹظ†طں',en:'Which brewing method for beginners?'},opts:[
      {ar:'ط¥ط³ط¨ط±ظٹط³ظˆ',en:'Espresso'},
      {ar:'V60',en:'V60'},
      {ar:'Aeropress',en:'Aeropress'},
      {ar:'ظپط±ظ†ط´ ط¨ط±ظٹط³',en:'French Press'}
    ],ans:1},
    {q:{ar:'ظ…ظ† ط£ظٹظ† ط§ط´طھظ‚ ط§ط³ظ… "Coffee"طں',en:'Where does the word "Coffee" derive from?'},opts:[
      {ar:'ط§ظ„ظ„ط§طھظٹظ†ظٹط©',en:'Latin'},
      {ar:'ط§ظ„ط¥ظٹط·ط§ظ„ظٹط©',en:'Italian'},
      {ar:'ط§ظ„ط¹ط±ط¨ظٹط©',en:'Arabic'},
      {ar:'ط§ظ„ط¥ط«ظٹظˆط¨ظٹط©',en:'Ethiopian'}
    ],ans:2}
  ],
  B:[
    {q:{ar:'ظ…ط§ط°ط§ طھط¹ظ†ظٹ RoR ظپظٹ ط§ظ„طھط­ظ…ظٹطµطں',en:'What does RoR mean in roasting?'},opts:[
      {ar:'Rate of Rise â€” ظ…ط¹ط¯ظ„ ط§ط±طھظپط§ط¹ ط§ظ„ط­ط±ط§ط±ط©',en:'Rate of Rise'},
      {ar:'Roast on Request',en:'Roast on Request'},
      {ar:'Ratio of Roast',en:'Ratio of Roast'},
      {ar:'Return of Roast',en:'Return of Roast'}
    ],ans:0},
    {q:{ar:'ط§ظ„ط¨ظ† ط§ظ„ظپط§طھط­ ظٹط­طھط§ط¬ ط·ط­ظ†ط§ظ‹...',en:'Light roast needs... grind'},opts:[
      {ar:'ط£ط¯ظ‚ (ط£ظƒط«ط± ظ†ط¹ظˆظ…ط©)',en:'Finer'},
      {ar:'ط£ط®ط´ظ†',en:'Coarser'},
      {ar:'ظ†ظپط³ ط¯ط±ط¬ط© ط§ظ„ط·ط­ظ†',en:'Same as dark'},
      {ar:'ظ…طھظˆط³ط·',en:'Medium'}
    ],ans:0},
    {q:{ar:'ظ…ط§ ظ†ط·ط§ظ‚ TDS ط§ظ„ظ…ط«ط§ظ„ظٹ ظ„ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ظ‚ط·ط±ط© ط­ط³ط¨ SCAطں',en:'Ideal TDS range for drip coffee per SCA?'},opts:[
      {ar:'50-100 ppm',en:'50-100 ppm'},
      {ar:'150-175 ppm',en:'150-175 ppm'},
      {ar:'200-250 ppm',en:'200-250 ppm'},
      {ar:'300-400 ppm',en:'300-400 ppm'}
    ],ans:1},
    {q:{ar:'ط¨ط£ظٹ ط¬ظ‡ط§ط² ظٹظ‚ط§ط³ TDSطں',en:'What device measures TDS?'},opts:[
      {ar:'ظ…ظٹط²ط§ظ† ط­ط±ط§ط±ط©',en:'Thermometer'},
      {ar:'ظ…ظ‚ظٹط§ط³ ط§ظ†ظƒط³ط§ط± (Refractometer)',en:'Refractometer'},
      {ar:'ظ…ظ‚ظٹط§ط³ pH',en:'pH meter'},
      {ar:'ظ…ظ‚ظٹط§ط³ طھط¯ظپظ‚',en:'Flow meter'}
    ],ans:1},
    {q:{ar:'ظ…ط§ ظ…ط¯ظ‰ ط·ط­ظ† ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ط¨ط§ظ„ظ…ظٹظƒط±ظˆظ†طں',en:'Espresso grind range in microns?'},opts:[
      {ar:'50-100 ظ…ظٹظƒط±ظˆظ†',en:'50-100 microns'},
      {ar:'200-350 ظ…ظٹظƒط±ظˆظ†',en:'200-350 microns'},
      {ar:'400-600 ظ…ظٹظƒط±ظˆظ†',en:'400-600 microns'},
      {ar:'700-1000 ظ…ظٹظƒط±ظˆظ†',en:'700-1000 microns'}
    ],ans:1},
    {q:{ar:'ظ…ط§ ط§ظ„ظ†ط¸ط§ظ…ط§ظ† ط§ظ„ط£ط³ط§ط³ظٹط§ظ† ظ„ظ…ط¹ط§ظ„ط¬ط© ظ…ظٹط§ظ‡ ط§ظ„ظ…ظ‚ط§ظ‡ظٹطں',en:'Two essential cafe water treatments?'},opts:[
      {ar:'ط؛ظ„ظٹ + طھط¨ط±ظٹط¯',en:'Boiling + Cooling'},
      {ar:'ظƒط±ط¨ظˆظ† ظ†ط´ط· + طھط¨ط§ط¯ظ„ ط£ظٹظˆظ†ظٹ',en:'Activated carbon + Ion exchange'},
      {ar:'طھظ‚ط·ظٹط± + ظپظ„طھط±ط©',en:'Distillation + Filtration'},
      {ar:'ط£ظˆط²ظˆظ† + ظƒظ„ظˆط±',en:'Ozone + Chlorine'}
    ],ans:1},
    {q:{ar:'ظ…ط§ طھط£ط«ظٹط± ط¯ط±ط¬ط© ط§ظ„ط·ط­ظ† ط¹ظ„ظ‰ ط²ظ…ظ† ط§ظ„ط§ط³طھط®ظ„ط§طµطں',en:'How does grind size affect extraction time?'},opts:[
      {ar:'ط·ط­ظ† ط£ط¯ظ‚ = ط²ظ…ظ† ط£ظ‚طµط±',en:'Finer = shorter time'},
      {ar:'ط·ط­ظ† ط£ط¯ظ‚ = ط²ظ…ظ† ط£ط·ظˆظ„',en:'Finer = longer time'},
      {ar:'ظ„ط§ طھط£ط«ظٹط±',en:'No effect'},
      {ar:'ظٹط¹طھظ…ط¯ ط¹ظ„ظ‰ ط§ظ„ظ‚ظ‡ظˆط© ظپظ‚ط·',en:'Depends only on coffee'}
    ],ans:1},
    {q:{ar:'ظ…ط§ ط¯ط±ط¬ط© ط­ط±ط§ط±ط© ط§ظ„ظ…ط§ط، ط§ظ„ظ…ط«ط§ظ„ظٹط© ظ„ظ„طھط­ط¶ظٹط± ط§ظ„ظ…ظ‚ط·ط±طں',en:'Ideal water temp for pour-over?'},opts:[
      {ar:'80-85آ°ظ…',en:'80-85آ°C'},
      {ar:'90-96آ°ظ…',en:'90-96آ°C'},
      {ar:'70-75آ°ظ…',en:'70-75آ°C'},
      {ar:'100آ°ظ…',en:'100آ°C'}
    ],ans:1},
    {q:{ar:'ظ…ط§ ط§ظ„ظ†ط³ط¨ط© ط§ظ„ظ…ط«ط§ظ„ظٹط© ظ„ظ„ظ‚ظ‡ظˆط© ط¥ظ„ظ‰ ط§ظ„ظ…ط§ط،طں',en:'Ideal coffee-to-water ratio?'},opts:[
      {ar:'1:10',en:'1:10'},
      {ar:'1:12',en:'1:12'},
      {ar:'1:16',en:'1:16'},
      {ar:'1:20',en:'1:20'}
    ],ans:2},
    {q:{ar:'ظ…ط§ط°ط§ طھط¹ظ†ظٹ ظƒظ„ظ…ط© Q Graderطں',en:'What is a Q Grader?'},opts:[
      {ar:'ظ…ط­ظ…طµ ظ‚ظ‡ظˆط© ظ…ط­طھط±ظپ',en:'Professional roaster'},
      {ar:'ظ…ظڈظ‚ظٹظ… ظ‚ظ‡ظˆط© ظ…ط¹طھظ…ط¯',en:'Certified coffee taster'},
      {ar:'ط¨ط§ط±ظٹط³طھط§ ظ…ط­طھط±ظپ',en:'Professional barista'},
      {ar:'ظ…ط²ط§ط±ط¹ ط¨ظ†',en:'Coffee farmer'}
    ],ans:1}
  ],
  C:[
    {q:{ar:'ظƒظ… ط¯ظ‚ظٹظ‚ط© طھظ†طھط¸ط± ظ‚ط¨ظ„ طھط°ظˆظ‚ ط§ظ„ظ‚ظ‡ظˆط© ط¨ط¹ط¯ ط¥ط¶ط§ظپط© ط§ظ„ظ…ط§ط، ظپظٹ ط§ظ„ظƒط§ط¨ظٹظ†ط¬طں',en:'Minutes to wait before tasting in cupping?'},opts:[
      {ar:'2-4 ط¯ظ‚ط§ط¦ظ‚',en:'2-4 minutes'},
      {ar:'8-15 ط¯ظ‚ط§ط¦ظ‚',en:'8-15 minutes'},
      {ar:'20-30 ط¯ظ‚ظٹظ‚ط©',en:'20-30 minutes'},
      {ar:'ط³ط§ط¹ط©',en:'1 hour'}
    ],ans:1},
    {q:{ar:'ظ…ط§ ط§ظ„ط¯ط±ط¬ط© ط§ظ„طھظٹ طھط¬ط¹ظ„ ط§ظ„ط¨ظ† Specialty Gradeطں',en:'Score that qualifies Specialty Grade?'},opts:[
      {ar:'70+',en:'70+'},
      {ar:'75+',en:'75+'},
      {ar:'80+',en:'80+'},
      {ar:'90+',en:'90+'}
    ],ans:2},
    {q:{ar:'ظƒظ… طھط³طھط؛ط±ظ‚ ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط·ط¨ظٹط¹ظٹط©طں',en:'How long does natural processing take?'},opts:[
      {ar:'3-5 ط£ظٹط§ظ…',en:'3-5 days'},
      {ar:'1 ط£ط³ط¨ظˆط¹',en:'1 week'},
      {ar:'2-4 ط£ط³ط§ط¨ظٹط¹',en:'2-4 weeks'},
      {ar:'2-3 ط£ط´ظ‡ط±',en:'2-3 months'}
    ],ans:2},
    {q:{ar:'ظƒظ… ط³ط§ط¹ط© طھط®ظ…ظٹط± ظپظٹ ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ظ…ط؛ط³ظˆظ„ط©طں',en:'Fermentation hours in washed processing?'},opts:[
      {ar:'6-12 ط³ط§ط¹ط©',en:'6-12 hours'},
      {ar:'12-18 ط³ط§ط¹ط©',en:'12-18 hours'},
      {ar:'24-36 ط³ط§ط¹ط©',en:'24-36 hours'},
      {ar:'48-72 ط³ط§ط¹ط©',en:'48-72 hours'}
    ],ans:2},
    {q:{ar:'ظ…ط§ ط£ظ†ظˆط§ط¹ ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط¨ط§ظ„ط¹ط³ظ„طں',en:'Types of honey processing?'},opts:[
      {ar:'ط£ط®ط¶ط±طŒ ط¨ظ†ظٹطŒ ط£ط³ظˆط¯',en:'Green, brown, black'},
      {ar:'ط£طµظپط±طŒ ط£ط­ظ…ط±طŒ ط£ط³ظˆط¯',en:'Yellow, red, black'},
      {ar:'ط£ط¨ظٹط¶طŒ ط£طµظپط±طŒ ط£ط­ظ…ط±',en:'White, yellow, red'},
      {ar:'ط°ظ‡ط¨ظٹطŒ ظپط¶ظٹطŒ ط¨ط±ظˆظ†ط²ظٹ',en:'Gold, silver, bronze'}
    ],ans:1},
    {q:{ar:'ظƒظ… ظ…ط±ط© طھظ†طµط­ ط¨ط¹ظ…ظ„ ظƒط§ط¨ظٹظ†ط¬ ظ…ط¹ ط§ظ„ظپط±ظٹظ‚طں',en:'How often to cup with the team?'},opts:[
      {ar:'ط´ظ‡ط±ظٹط§ظ‹',en:'Monthly'},
      {ar:'ط£ط³ط¨ظˆط¹ظٹط§ظ‹',en:'Weekly'},
      {ar:'ظٹظˆظ…ظٹط§ظ‹',en:'Daily'},
      {ar:'ط±ط¨ط¹ ط³ظ†ظˆظٹ',en:'Quarterly'}
    ],ans:1},
    {q:{ar:'ظ…ط§ ظ‡ظˆ ظ†ط·ط§ظ‚ ط§ظ„ط±ط·ظˆط¨ط© ط§ظ„ظ…ط«ط§ظ„ظٹ ظ„طھط®ط²ظٹظ† ط§ظ„ط¨ظ† ط§ظ„ط£ط®ط¶ط±طں',en:'Ideal humidity for green bean storage?'},opts:[
      {ar:'ط£ظ‚ظ„ ظ…ظ† 40%',en:'Below 40%'},
      {ar:'ط£ظ‚ظ„ ظ…ظ† 60%',en:'Below 60%'},
      {ar:'60-80%',en:'60-80%'},
      {ar:'80-100%',en:'80-100%'}
    ],ans:1},
    {q:{ar:'ظ…ط§ ط§ظ„ظ‡ط¯ظپ ظ…ظ† ظ…ط±ط­ظ„ط© Degassing ط¨ط¹ط¯ ط§ظ„طھط­ظ…ظٹطµطں',en:'Purpose of degassing after roasting?'},opts:[
      {ar:'طھط¨ط±ظٹط¯ ط§ظ„ط¨ظ†',en:'Cool the beans'},
      {ar:'ط¥ط·ظ„ط§ظ‚ ط؛ط§ط² ط«ط§ظ†ظٹ ط£ظƒط³ظٹط¯ ط§ظ„ظƒط±ط¨ظˆظ†',en:'Release CO2'},
      {ar:'ط¥ط¶ط§ظپط© ظ†ظƒظ‡ط©',en:'Add flavor'},
      {ar:'طھط±ط·ظٹط¨ ط§ظ„ط¨ظ†',en:'Moisten beans'}
    ],ans:1},
    {q:{ar:'ظ…ط§ ظ‡ظٹ ط£ظƒط³ظٹط¯ط§ط² ط§ظ„ظƒظ„ظˆط±ظˆط¬ظٹظ†ظٹظƒ (CGA) ظپظٹ ط§ظ„ظ‚ظ‡ظˆط©طں',en:'What is Chlorogenic Acid (CGA) in coffee?'},opts:[
      {ar:'ظ…ظڈط­ظ„ظٹ ط·ط¨ظٹط¹ظٹ',en:'Natural sweetener'},
      {ar:'ظ…ط¶ط§ط¯ ط£ظƒط³ط¯ط©',en:'Antioxidant'},
      {ar:'ظ†ظˆط¹ ظ…ظ† ط§ظ„ظƒط§ظپظٹظٹظ†',en:'Type of caffeine'},
      {ar:'طµط¨ط؛ط© طھظ„ظˆظٹظ†',en:'Food coloring'}
    ],ans:1},
    {q:{ar:'ظ…ظ† ط§ط®طھط±ط¹ ط£ظˆظ„ ظ…ط­ظ…طµط© ط£ط³ط·ظˆط§ظ†ظٹط© طھط¬ط§ط±ظٹط©طں',en:'Who invented the first commercial drum roaster?'},opts:[
      {ar:'ظ„ظˆظٹط¬ظٹ ط¨ط²ظٹط±ط§',en:'Luigi Bezzera'},
      {ar:'ط¬ط§ط¨ظٹط² ط¨ظˆط±ظ†ط²',en:'Jabez Burns'},
      {ar:'ط£ظƒظٹظ„ظٹ ط¬ط§ط¬ظٹط§',en:'Achille Gaggia'},
      {ar:'ظƒظ„ط¯',en:'Kaldi'}
    ],ans:1}
  ]
};

/* ===== Lesson Content Helper ===== */
function getLessonBody(mi, li){
  let key = CM[mi].id + '-' + li;
  let body = L[key] ? L[key][lang] || L[key].en || '' : '';
  if(body && !body.includes('quiz-box')){
    let qq = Q[key];
    if(qq) body += '<div class="quiz-box"><strong>' + (qq[lang] || qq.en) + '</strong></div>';
  }
  return body;
}

/* ===== Module Stories ===== */
const STORIES = {};
function str(key, a, e){ STORIES[key] = {ar:a,en:e} }
str('A1','<div class="story-box"><h4>ًں“œ ظ‚طµط© ظƒظ„ط¯ ظˆط§ظƒطھط´ط§ظپ ط§ظ„ظ‚ظ‡ظˆط©</h4><p>ط¹ط§ظ… 850ظ… ظپظٹ ظ…ط±طھظپط¹ط§طھ <strong>ظƒط§ظپط§</strong> ط§ظ„ط¥ط«ظٹظˆط¨ظٹط©طŒ ظ„ط§ط­ط¸ ط§ظ„ط±ط§ط¹ظٹ <strong>ظƒظ„ط¯ (Kaldi)</strong> ط£ط؛ظ†ط§ظ…ظ‡ طھظ‚ظپط² ط¨ظ†ط´ط§ط· ط؛ط±ظٹط¨ ط¨ط¹ط¯ ط£ظƒظ„ ط«ظ…ط§ط± ط­ظ…ط±ط§ط،. ط¬ط±ط¨ظ‡ط§ ط¨ظ†ظپط³ظ‡ ظˆط´ط¹ط± ط¨ط§ظ†طھط¹ط§ط´ ظ„ظ… ظٹط¹ظ‡ط¯ظ‡. ط£ط®ط°ظ‡ط§ ظ„ط¯ظٹط± ظ‚ط±ظٹط¨طŒ ظˆط§ظƒطھط´ظپ ط§ظ„ط±ظ‡ط¨ط§ظ† ط£ظ†ظ‡ط§ طھط³ط§ط¹ط¯ظ‡ظ… ط¹ظ„ظ‰ ط§ظ„ط³ظ‡ط± ظپظٹ ط§ظ„طµظ„ط§ط©. ظ…ظ† ظ‡ظ†ط§ ط¨ط¯ط£طھ ط±ط­ظ„ط© ط§ظ„ظ‚ظ‡ظˆط© ظ…ط¹ ط§ظ„ط¨ط´ط±ظٹط© â€” ظ„ط£ظƒط«ط± ظ…ظ† 1000 ط¹ط§ظ….</p><div class="story-src">ًں“– ط§ظ„ظ…طµط¯ط±: ط§ظ„ط£ط³ط·ظˆط±ط© ط§ظ„ط¥ط«ظٹظˆط¨ظٹط©طŒ ظˆط±ط¯طھ ظپظٹ "De Plantis Aegypti" (1592) ظ„ظ„ط·ط¨ظٹط¨ ط¨ط±ظˆط³ط¨ظٹط±ظˆ ط£ظ„ط¨ظٹظ†ظٹ</div></div>','<div class="story-box"><h4>ًں“œ Kaldi and the Discovery of Coffee</h4><p>In 850 AD in the highlands of <strong>Kaffa</strong>, Ethiopia, goat herder <strong>Kaldi</strong> noticed his goats jumping with unusual energy after eating red berries. He tried them himself and felt a refreshing alertness. He took them to a nearby monastery, where monks discovered the berries helped them stay awake during night prayers. Thus began coffee\'s 1,000+ year journey with humanity.</p><div class="story-src">ًں“– Source: Ethiopian legend, recorded in "De Plantis Aegypti" (1592) by physician Prospero Alpini</div></div>');
str('A2','<div class="story-box"><h4>ًں“œ ط£ظˆظ„ ظپظ†ط¬ط§ظ† ظ‚ظ‡ظˆط© ظپظٹ ط§ظ„طھط§ط±ظٹط®</h4><p>ظپظٹ ط§ظ„ظٹظ…ظ† ط§ظ„ظ‚ط±ظ† ط§ظ„ط®ط§ظ…ط³ ط¹ط´ط±طŒ ظƒط§ظ†طھ ط§ظ„ظ‚ظ‡ظˆط© طھظڈط­ط¶ظ‘ط± ط¨ط؛ظ„ظٹ ط§ظ„ط¨ظ† ط§ظ„ظ…ط·ط­ظˆظ† ظ…ط¹ ط§ظ„ظ…ط§ط، ظˆط§ظ„ط³ظƒط± ظˆط§ظ„ط¨ظ‡ط§ط±ط§طھ ظپظٹ <strong>"ط§ظ„ط¥ط¨ط±ظٹظ‚"</strong>. ظ‡ط°ظ‡ ط§ظ„ط·ط±ظٹظ‚ط© â€” ط§ظ„طھظٹ ظ†ط¹ط±ظپظ‡ط§ ط§ظ„ظٹظˆظ… ظƒظ€"ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„طھط±ظƒظٹط©" â€” ظƒط§ظ†طھ ط£ظˆظ„ طھظ‚ظ†ظٹط© طھط­ط¶ظٹط±. ط§ظ†طھظ‚ظ„طھ ظ…ظ† ط§ظ„ظٹظ…ظ† ط¥ظ„ظ‰ ظ…ظƒط©طŒ ط§ظ„ظ‚ط§ظ‡ط±ط©طŒ ط¥ط³ط·ظ†ط¨ظˆظ„طŒ ط­ظٹط« ط£طµط¨ط­ ط¥ط¹ط¯ط§ط¯ ط§ظ„ظ‚ظ‡ظˆط© ظپظ†ط§ظ‹ ظ„ظ‡ ط·ظ‚ظˆط³ظ‡.</p><div class="story-src">ًں“– ط§ظ„ظ…طµط¯ط±: "ط§ظ„ظ‚ظ‡ظˆط© ظˆط§ظ„ظ‚ظ‡ط§ظˆظٹ" ظ„ظ„ط¹ظ„ط§ظ…ط© ط¹ط¨ط¯ ط§ظ„ظ‚ط§ط¯ط± ط§ظ„ط¬ط²ظٹط±ظٹ (1558) â€” ط£ظ‚ط¯ظ… ظ…ط®ط·ظˆط·ط© ط¹ظ† ط§ظ„ظ‚ظ‡ظˆط©</div></div>','<div class="story-box"><h4>ًں“œ The First Cup of Coffee in History</h4><p>In 15th century Yemen, coffee was prepared by boiling ground beans with water, sugar and spices in an <strong>"Ibrik"</strong>. This method â€” known today as "Turkish Coffee" â€” was history\'s first brewing technique. It spread from Yemen to Mecca, Cairo, and Istanbul, where coffee preparation became an art with its own rituals.</p><div class="story-src">ًں“– Source: "Coffee and Coffeehouses" by Abd al-Qadir al-Jaziri (1558)</div></div>');
str('A3','<div class="story-box"><h4>ًں“œ ط«ظˆط±ط© ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ â€” ظ…ظ† ط§ظ„ط¨ط®ط§ط± ط¥ظ„ظ‰ ط§ظ„ظƒط±ظٹظ…ط§</h4><p>ط¹ط§ظ… 1901طŒ ط­طµظ„ <strong>ظ„ظˆظٹط¬ظٹ ط¨ط²ظٹط±ط§</strong> ط¹ظ„ظ‰ ط¨ط±ط§ط،ط© ط§ط®طھط±ط§ط¹ ط£ظˆظ„ ظ…ط§ظƒظٹظ†ط© ظ‚ظ‡ظˆط© ط¨ط¶ط؛ط· ط§ظ„ط¨ط®ط§ط±. ظ„ظƒظ† ط§ظ„ط«ظˆط±ط© ط§ظ„ط­ظ‚ظٹظ‚ظٹط© ظƒط§ظ†طھ 1946 ط¹ظ†ط¯ظ…ط§ ط§ط®طھط±ط¹ <strong>ط£ظƒظٹظ„ظٹ ط¬ط§ط¬ظٹط§</strong> ظ†ط¸ط§ظ… ط§ظ„ط±ط§ظپط¹ط© ط§ظ„ط°ظٹ ظٹظˆظ„ط¯ 9 ط¨ط§ط± â€” ظ…ظ†طھط¬ط§ظ‹ <strong>ط£ظˆظ„ ظƒط±ظٹظ…ط§</strong> ظپظٹ طھط§ط±ظٹط® ط§ظ„ظ‚ظ‡ظˆط©. ظ‚ط¨ظ„ ط¬ط§ط¬ظٹط§طŒ ظƒط§ظ† ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ظ…ط¬ط±ط¯ ط³ط§ط¦ظ„ ط¨ظ†ظٹ.</p><div class="story-src">ًں“– ط§ظ„ظ…طµط¯ط±: ط¨ط±ط§ط،ط© ط§ط®طھط±ط§ط¹ ط¥ظٹط·ط§ظ„ظٹط© ط±ظ‚ظ… 139/601 (1946) â€” Achille Gaggia</div></div>','<div class="story-box"><h4>ًں“œ The Espresso Revolution â€” From Steam to Crema</h4><p>In 1901, <strong>Luigi Bezzera</strong> patented the first steam-pressure coffee machine. The real revolution came in 1946 when <strong>Achille Gaggia</strong> invented the lever system generating 9 bars â€” producing the <strong>first crema</strong> in coffee history. Before Gaggia, espresso was just brown liquid.</p><div class="story-src">ًں“– Source: Italian Patent No. 139/601 (1946) â€” Achille Gaggia</div></div>');
str('B1','<div class="story-box"><h4>ًں“œ طھط·ظˆط± طھط­ظ…ظٹطµ ط§ظ„ظ‚ظ‡ظˆط©</h4><p>ط¨ط¯ط£ ط§ظ„طھط­ظ…ظٹطµ ظپظٹ ط§ظ„ظ‚ط±ظ† 15 ط¹ظ„ظ‰ ط§ظ„ظ†ط§ط± ط§ظ„ظ…ظƒط´ظˆظپط© ط¨ط£ظˆط¹ظٹط© ظپط®ط§ط±ظٹط© ظٹظ…ظ†ظٹط©. ط£ظˆظ„ ظ…ط­ظ…طµط© طھط¬ط§ط±ظٹط© ط¸ظ‡ط±طھ ظپظٹ ط¥ط³ط·ظ†ط¨ظˆظ„ ط§ظ„ظ‚ط±ظ† 17. ط¹ط§ظ… 1864طŒ ط§ط®طھط±ط¹ <strong>ط¬ط§ط¨ظٹط² ط¨ظˆط±ظ†ط²</strong> ظپظٹ ظ†ظٹظˆظٹظˆط±ظƒ ط£ظˆظ„ ظ…ط­ظ…طµط© ط£ط³ط·ظˆط§ظ†ظٹط© â€” ط§ظ„طھطµظ…ظٹظ… ط§ظ„ظ…ط³طھط®ط¯ظ… ط­طھظ‰ ط§ظ„ظٹظˆظ….</p><div class="story-src">ًں“– ط§ظ„ظ…طµط¯ط±: James Boyce, "The Coffee Roasting Industry" (1840)</div></div>','<div class="story-box"><h4>ًں“œ The Evolution of Coffee Roasting</h4><p>Roasting began in the 15th century over open fires using Yemeni clay pans. The first commercial roaster appeared in 17th century Istanbul. In 1864, <strong>Jabez Burns</strong> in New York invented the first commercial drum roaster â€” the design still used today.</p><div class="story-src">ًں“– Source: James Boyce, "The Coffee Roasting Industry" (1840)</div></div>');
str('B2','<div class="story-box"><h4>ًں“œ ط§ظ„ظ…ط§ط، â€” ط³ط± ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط®ظپظٹ</h4><p>ظپظٹ ظ„ظ†ط¯ظ† 1660طŒ ط§ظƒطھط´ظپ ط£طµط­ط§ط¨ ط§ظ„ظ…ظ‚ط§ظ‡ظٹ ط£ظ† ط§ظ„ظ…ط§ط، ظ…ظ† ط¢ط¨ط§ط± ظ…ط®طھظ„ظپط© ظٹظ†طھط¬ ظ‚ظ‡ظˆط© ظ…ط®طھظ„ظپط© ط¬ط°ط±ظٹط§ظ‹. ط£ظˆظ„ ظ…ظ„ط§ط­ط¸ط© ظ…ط³ط¬ظ„ط© ط¹ظ† طھط£ط«ظٹط± ظƒظٹظ…ظٹط§ط، ط§ظ„ظ…ط§ط، ط¹ظ„ظ‰ ط§ظ„ظ‚ظ‡ظˆط©. ظٹظ‚ظˆظ„ ط§ظ„ظ…ط«ظ„: "ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط¬ظٹط¯ط© 99% ظ…ط§ط،".</p><div class="story-src">ًں“– ط§ظ„ظ…طµط¯ط±: ظ…ط°ظƒط±ط§طھ Samuel Pepys (1663)</div></div>','<div class="story-box"><h4>ًں“œ Water â€” Coffee\'s Hidden Secret</h4><p>In 1660s London, coffeehouse owners discovered water from different wells produced dramatically different coffee. The first recorded observation of water chemistry\'s effect on coffee. The saying goes: "Good coffee is 99% water."</p><div class="story-src">ًں“– Source: Samuel Pepys\' Diary (1663)</div></div>');
str('B3','<div class="story-box"><h4>ًں“œ ط§ظ„ظ…ظˆط¬ط© ط§ظ„ط«ط§ظ„ط«ط© â€” ط§ظ„ظ‚ظ‡ظˆط© ظƒط¹ظ„ظ…</h4><p>ظپظٹ ط§ظ„طھط³ط¹ظٹظ†ظٹط§طھطŒ ط¨ط¯ط£طھ ط§ظ„ظ…ظˆط¬ط© ط§ظ„ط«ط§ظ„ط«ط© ظ…ط¹ ظ…ط­ظ…طµظٹظ† ظٹط¹ط§ظ…ظ„ظˆظ† ط§ظ„ظ‚ظ‡ظˆط© ظƒظ…ظ†طھط¬ ط­ط±ظپظٹ. ط¯ط®ظ„طھ ط£ط¬ظ‡ط²ط© ط§ظ„ظ‚ظٹط§ط³ ظˆظ…ظ†ط­ظ†ظٹط§طھ ط§ظ„ط§ط³طھط®ظ„ط§طµ ظˆط¹ظ„ظ… ط§ظ„ط¬ظˆط¯ط© ظ„ظ„ظ‚ظ‡ظˆط© ظ„ط£ظˆظ„ ظ…ط±ط©. ط§ظ„ط¨ط§ط±ظٹط³طھط§ ط£طµط¨ط­ ط¹ط§ظ„ظ…ط§ظ‹ ظˆطھظ‚ظ†ظٹط§ظ‹.</p><div class="story-src">ًں“– ط§ظ„ظ…طµط¯ط±: Trish Rothgeb, "The Third Wave of Coffee" (2002)</div></div>','<div class="story-box"><h4>ًں“œ The Third Wave â€” Coffee as Science</h4><p>In the 1990s, the Third Wave began with roasters treating coffee as artisan product. Refractometers, extraction curves, and quality science entered coffee culture. The barista became a scientist.</p><div class="story-src">ًں“– Source: Trish Rothgeb, "The Third Wave of Coffee" (2002)</div></div>');
str('C1','<div class="story-box"><h4>ًں“œ ظپظ† ط§ظ„طھظ‚ظٹظٹظ… ط§ظ„ط­ط³ظٹ â€” ظ…ظ† ط§ظ„طھط§ط¬ط± ط¥ظ„ظ‰ ط§ظ„ط¹ط§ظ„ظ…</h4><p>ط§ظ„ظƒط§ط¨ظٹظ†ط¬ ط¨ط¯ط£ ظپظٹ ط§ظ„ظ‚ط±ظ† 19 ظ…ط¹ طھط¬ط§ط± ط§ط­طھط§ط¬ظˆط§ ط·ط±ظٹظ‚ط© ظ…طھط³ظ‚ط© ظ„طھظ‚ظٹظٹظ… ط§ظ„ط¬ظˆط¯ط©. ط£ظˆظ„ ط¨ط±ظˆطھظˆظƒظˆظ„ ط±ط³ظ…ظٹ ط¸ظ‡ط± ظپظٹ ط§ظ„ط®ظ…ط³ظٹظ†ظٹط§طھ. ط¹ط§ظ… 2000طŒ ظ†ط´ط±طھ SCA ط£ظˆظ„ ط§ط³طھظ…ط§ط±ط© ظƒط§ط¨ظٹظ†ط¬ ظ…ظˆط­ط¯ط© â€” ط§ظ„ظ…ط³طھط®ط¯ظ…ط© ط¹ط§ظ„ظ…ظٹط§ظ‹ ط§ظ„ظٹظˆظ….</p><div class="story-src">ًں“– ط§ظ„ظ…طµط¯ط±: SCAA Cupping Protocol (2000)</div></div>','<div class="story-box"><h4>ًں“œ Sensory Evaluation â€” From Trader to Scientist</h4><p>Cupping began in the 19th century with traders needing consistent quality evaluation. The first formal protocol emerged in the 1950s. In 2000, SCA published the first standardized cupping form â€” used worldwide today.</p><div class="story-src">ًں“– Source: SCAA Cupping Protocol (2000)</div></div>');
str('C2','<div class="story-box"><h4>ًں“œ 500 ط¹ط§ظ… ظ…ظ† ط§ظ„ط§ط¨طھظƒط§ط± ظپظٹ ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط¨ظ†</h4><p>ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط·ط¨ظٹط¹ظٹط© ط£ظ‚ط¯ظ… ط·ط±ظٹظ‚ط© â€” ط¯ظˆظ† طھط؛ظٹظٹط± ظ…ظ†ط° ظ‚ط±ظˆظ† ظپظٹ ط¥ط«ظٹظˆط¨ظٹط§. ط§ظ„ظ…ط؛ط³ظˆظ„ط© ط§ط®طھط±ط¹ظ‡ط§ ط§ظ„ظ‡ظˆظ„ظ†ط¯ظٹظˆظ† ظپظٹ ط¬ط§ظˆط© ط§ظ„ظ‚ط±ظ† 18. ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط¨ط§ظ„ط¹ط³ظ„ ط¨ط¯ط£طھ ظپظٹ ظƒظˆط³طھط§ط±ظٹظƒط§ ط§ظ„ط«ظ…ط§ظ†ظٹظ†ظٹط§طھ. ظƒظ„ ط·ط±ظٹظ‚ط© طھط­ظƒظٹ ظ‚طµط© ظ…ظ†ط§ط® ظˆط«ظ‚ط§ظپط©.</p><div class="story-src">ًں“– ط§ظ„ظ…طµط¯ط±: William H. Ukers, "All About Coffee" (1922)</div></div>','<div class="story-box"><h4>ًں“œ 500 Years of Processing Innovation</h4><p>Natural processing is oldest â€” unchanged for centuries in Ethiopia. Washed was invented by Dutch in 18th century Java. Honey processing began in 1980s Costa Rica. Each method tells a story of climate and culture.</p><div class="story-src">ًں“– Source: William H. Ukers, "All About Coffee" (1922)</div></div>');
str('C3','<div class="story-box"><h4>ًں“œ ط§ظ„ظ…ظ‚ط§ظ‡ظٹ â€” ظ…ط¯ط§ط±ط³ ط§ظ„ط­ظƒظ…ط©</h4><p>ط£ظˆظ„ ظ…ظ‚ظ‡ظ‰ ظپظٹ ظ…ظƒط© ط£ظˆط§ط¦ظ„ ط§ظ„ظ‚ط±ظ† 16طŒ ط«ظ… ط§ظ„ظ‚ط§ظ‡ط±ط©طŒ ط¥ط³ط·ظ†ط¨ظˆظ„طŒ ط£ظƒط³ظپظˆط±ط¯. ظپظٹ ظ„ظ†ط¯ظ† ط³ظڈظ…ظٹطھ "Penny Universities" â€” ط¨ط¨ظ†ط³ ظˆط§ط­ط¯ طھط³ظ…ط¹ ط£ط¹ط¸ظ… ط§ظ„ط¹ظ‚ظˆظ„. ط£ظ†طھ ط§ظ„ظٹظˆظ… طھط­ط§ظپط¸ ط¹ظ„ظ‰ طھظ‚ظ„ظٹط¯ ط¹ظ…ط±ظ‡ 500 ط¹ط§ظ….</p><div class="story-src">ًں“– ط§ظ„ظ…طµط¯ط±: Markman Ellis, "The Coffee-House: A Cultural History" (2004)</div></div>','<div class="story-box"><h4>ًں“œ Coffeehouses â€” Schools of Wisdom</h4><p>First coffeehouse in Mecca early 1500s, then Cairo, Istanbul, Oxford. In London they were "Penny Universities" â€” for a penny you heard the greatest minds. Today you continue a 500-year tradition.</p><div class="story-src">ًں“– Source: Markman Ellis, "The Coffee-House: A Cultural History" (2004)</div></div>');

/* ===== Render Functions ===== */

const CM = [
  {id:'A1',level:'A',title:{ar:'ط§ظƒطھط´ط§ظپ ط§ظ„ظ‚ظ‡ظˆط© ظˆط£طµظˆظ„ظ‡ط§',en:'Coffee Discovery & Origins'},icon:'ًںŒچ',desc:{ar:'طھط§ط±ظٹط®طŒ طھطµظ†ظٹظپطŒ طھط´ط±ظٹط­',en:'History, Classification, Anatomy'},img:imgPath('A1'),lessons:[
    {title:{ar:'ظ‚ظ‡ظˆط© ظ…ط®طھطµط© vs طھط¬ط§ط±ظٹط© + ظ‚طµط© ط§ظ„ط§ظƒطھط´ط§ظپ',en:'Specialty vs Commercial + Discovery Story'},img:imgPath('A1')},
    {title:{ar:'ط§ظ„ط¨ظ† ط§ظ„ط¹ط±ط¨ظٹ â€” ط§ظ„طھطµظ†ظٹظپ ط§ظ„ظ†ط¨ط§طھظٹ',en:'Arabica â€” Botanical Classification'},img:imgPath('cherry')},
    {title:{ar:'ط§ظ†طھط´ط§ط± ط§ظ„ظ‚ظ‡ظˆط© ط­ظˆظ„ ط§ظ„ط¹ط§ظ„ظ…',en:'Coffee Spread Around the World'},img:imgPath('map')},
    {title:{ar:'طھط´ط±ظٹط­ ط­ط¨ط© ط§ظ„ط¨ظ†',en:'Anatomy of the Coffee Bean'},img:imgPath('beans')},
    {title:{ar:'ط§ظ„ظ‚ظ‡ظˆط© ظپظٹ ط§ظ„ط«ظ‚ط§ظپط© ظˆط§ظ„ط¯ظٹظ†',en:'Coffee in Culture & Religion'},img:imgPath('A1')}
  ]},
  {id:'A2',level:'A',title:{ar:'ط£ط³ط§ط³ظٹط§طھ ط§ظ„طھط­ط¶ظٹط±',en:'Brewing Fundamentals'},icon:'âڑ—ï¸ڈ',desc:{ar:'ط¹ظ„ظ… ط§ظ„ط§ط³طھط®ظ„ط§طµ',en:'Extraction Science'},img:imgPath('A2'),lessons:[
    {title:{ar:'ظپظٹط²ظٹط§ط، ظˆظƒظٹظ…ظٹط§ط، ط§ظ„ط§ط³طھط®ظ„ط§طµ',en:'Physics & Chemistry of Extraction'},img:imgPath('A2')},
    {title:{ar:'ط§ظ„ظ…ط¹ط¯ط§طھ ظˆط§ظ„ط£ط¯ظˆط§طھ',en:'Equipment & Tools'},img:imgPath('barista')},
    {title:{ar:'ط§ظ„ظ…ظ‚ط§ظٹظٹط³ ظˆط§ظ„ظ†ط³ط¨ ط§ظ„ط°ظ‡ط¨ظٹط©',en:'Golden Ratios'},img:imgPath('v60')},
    {title:{ar:'طھط­ط¶ظٹط± V60',en:'V60 Brewing'},img:imgPath('v60')},
    {title:{ar:'ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط¨ط§ط±ط¯ط© ظˆط·ط±ظ‚ظ‡ط§',en:'Cold Brew & Iced Coffee'},img:imgPath('coldbrew')}
  ]},
{id:'A3',level:'A',title:{ar:'ظ…ط´ط±ظˆط¨ط§طھ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ',en:'Espresso Drinks'},icon:'âک•',desc:{ar:'ظ…ظ† ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ط¥ظ„ظ‰ ط§ظ„ظ„ط§طھظٹظ‡',en:'From Espresso to Latte'},img:imgPath('A3'),lessons:[
    {title:{ar:'ظ…ط§ ظ‡ظˆ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆطں',en:'What is Espresso?'},img:imgPath('espresso')},
    {title:{ar:'ظ„ط§طھظٹظ‡ â€” ظپظ† ط§ظ„ط­ظ„ظٹط¨',en:'Latte â€” The Art of Milk'},img:imgPath('latte')},
    {title:{ar:'ظƒط§ط¨طھط´ظٹظ†ظˆ ظˆظ…ظˆظƒط§',en:'Cappuccino & Mocha'},img:imgPath('A3')},
    {title:{ar:'ظ…ط§ظƒظٹط§طھظˆ, ط£ظپظˆط¬ط§طھظˆ, ظپظ„ط§طھ ظˆط§ظٹطھ',en:'Macchiato, Affogato & Flat White'},img:imgPath('latte')},
    {title:{ar:'ط£ط³ط§ط³ظٹط§طھ ط§ظ„ظ„ط§طھظٹظ‡ ط£ط±طھ',en:'Latte Art Basics'},img:imgPath('latte')},
    {title:{ar:'طµظٹط§ظ†ط© ط¢ظ„ط© ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ',en:'Espresso Machine Maintenance'},img:imgPath('barista')}
]},
{id:'B1',level:'B',title:{ar:'ط£ط³ط±ط§ط± ط§ظ„طھط­ظ…ظٹطµ',en:'Roasting Secrets'},icon:'ًں”¥',desc:{ar:'ظ…ظ† ط§ظ„ط£ط®ط¶ط± ط¥ظ„ظ‰ ط§ظ„ظ…ط­ظ…طµ',en:'Green to Brown'},img:imgPath('B1'),lessons:[
    {title:{ar:'ظƒظٹظ…ظٹط§ط، ط§ظ„طھط­ظ…ظٹطµ',en:'Roasting Chemistry'},img:imgPath('roast')},
    {title:{ar:'ظ…ظ†ط­ظ†ظٹط§طھ ط§ظ„طھط­ظ…ظٹطµ',en:'Roast Curves'},img:imgPath('roast')},
    {title:{ar:'ط§ظ„طھط­ظ…ظٹطµ ظˆط§ظ„ط§ط³طھط®ظ„ط§طµ',en:'Roast & Extraction'},img:imgPath('B1')},
    {title:{ar:'طھط­ظ…ظٹطµ ط­ط³ط¨ ط§ظ„ظ…ظ†ط´ط£',en:'Origin-Specific Roasting'},img:imgPath('beans')},
    {title:{ar:'ط¯ظ„ظٹظ„ ظ…ط¹ط¯ط§طھ ط§ظ„طھط­ظ…ظٹطµ',en:'Roasting Equipment Guide'},img:imgPath('B1')},
    {title:{ar:'ط­ط±ظپظٹ ط£ظ… طھط¬ط§ط±ظٹ',en:'Artisan vs Commercial'},img:imgPath('cafe')}
]},
  {id:'B2',level:'B',title:{ar:'ط¹ظ„ظ… ط§ظ„ظ…ط§ط،',en:'Water Science'},icon:'ًں’§',desc:{ar:'ط¬ظˆط¯ط© ط§ظ„ظ…ط§ط،',en:'Water Quality'},img:imgPath('B2'),lessons:[
    {title:{ar:'ظƒظٹظ…ظٹط§ط، ط§ظ„ظ…ط§ط،',en:'Water Chemistry'},img:imgPath('water')},
    {title:{ar:'ظ‚ظٹط§ط³ TDS',en:'TDS Measurement'},img:imgPath('water')},
    {title:{ar:'ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ظ…ظٹط§ظ‡',en:'Water Treatment'},img:imgPath('water')},
    {title:{ar:'ظˆطµظپط§طھ ط§ظ„ظ…ط§ط، ط§ظ„ظ…ط«ط§ظ„ظٹط©',en:'DIY Water Recipes'},img:imgPath('B2')},
    {title:{ar:'ط¹ط³ط± ط§ظ„ظ…ط§ط، ظˆطھط£ط«ظٹط±ظ‡',en:'Water Hardness Impact'},img:imgPath('water')},
    {title:{ar:'ط§ظ„ظ…ط§ط، ط§ظ„ظ…ط«ط§ظ„ظٹ ظ„ظƒظ„ ط·ط±ظٹظ‚ط©',en:'Water per Brew Method'},img:imgPath('v60')}
  ]},
{id:'B3',level:'B',title:{ar:'ظ…طھط؛ظٹط±ط§طھ ط§ظ„طھط­ط¶ظٹط±',en:'Advanced Brewing'},icon:'âڑ™ï¸ڈ',desc:{ar:'ط§ظ„ط·ط­ظ† ظˆط§ظ„ط§ط³طھط®ظ„ط§طµ',en:'Grinding & Extraction'},img:imgPath('B3'),lessons:[
    {title:{ar:'طھظˆط²ظٹط¹ ط­ط¬ظ… ط§ظ„ط·ط­ظ†',en:'Particle Size Distribution'},img:imgPath('B3')},
    {title:{ar:'ط§ظ„ط§ط³طھط®ظ„ط§طµ ط§ظ„ظ…طھظ‚ط¯ظ…',en:'Advanced Extraction'},img:imgPath('barista')},
    {title:{ar:'طھط­ط³ظٹظ† ط¬ظˆط¯ط© ط§ظ„ظپظ†ط¬ط§ظ†',en:'Cup Quality'},img:imgPath('cupping')},
    {title:{ar:'طھط­ط¶ظٹط± ط§ظ„ظƒظ…ظٹط§طھ ط§ظ„ظƒط¨ظٹط±ط©',en:'Batch Brew & High Volume'},img:imgPath('cafe')},
    {title:{ar:'ط£ظ†ظˆط§ط¹ ط§ظ„ط·ظˆط§ط­ظٹظ†',en:'Grinder Burr Types'},img:imgPath('B3')},
    {title:{ar:'ط§ظ„ظ€ Dialing In ط§ظ„ظ…ظ†ظ‡ط¬ظٹ',en:'Systematic Dialing In'},img:imgPath('barista')}
]},
{id:'C1',level:'C',title:{ar:'ط§ظ„طھظ‚ظٹظٹظ… ط§ظ„ط­ط³ظٹ',en:'Sensory Science'},icon:'ًں‘ƒ',desc:{ar:'طھط°ظˆظ‚ ظˆطھط­ظ„ظٹظ„',en:'Taste & Analyze'},img:imgPath('C1'),lessons:[
    {title:{ar:'ط§ظ„ظƒط§ط¨ظٹظ†ط¬',en:'Cupping'},img:imgPath('cupping')},
    {title:{ar:'ظ…طµظپظˆظپط© ط§ظ„ظ†ظƒظ‡ط§طھ',en:'Flavor Wheel'},img:imgPath('C1')},
    {title:{ar:'ط¨ط±ظˆطھظˆظƒظˆظ„ SCA',en:'SCA Protocol'},img:imgPath('cupping')},
    {title:{ar:'ط¹ظٹظˆط¨ ط§ظ„ظ‚ظ‡ظˆط© ظˆطھط´ط®ظٹطµظ‡ط§',en:'Coffee Defects & Diagnosis'},img:imgPath('beans')},
    {title:{ar:'ط§ظ„طھط­ظ„ظٹظ„ ط§ظ„ط­ط³ظٹ',en:'Sensory Analysis'},img:imgPath('C1')},
    {title:{ar:'ط­ظ„ظˆظ„ ط¹ظٹظˆط¨ ط§ظ„ظ‚ظ‡ظˆط©',en:'Defects Solutions'},img:imgPath('cupping')}
]},
{id:'C2',level:'C',title:{ar:'ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط¨ظ†',en:'Coffee Processing'},icon:'ًں«ک',desc:{ar:'ط·ط±ظ‚ ط§ظ„ظ…ط¹ط§ظ„ط¬ط©',en:'Processing Methods'},img:imgPath('C2'),lessons:[
    {title:{ar:'ط·ط¨ظٹط¹ظٹط©',en:'Natural'},img:imgPath('cherry')},
    {title:{ar:'ظ…ط؛ط³ظˆظ„ط©',en:'Washed'},img:imgPath('C2')},
    {title:{ar:'ط¹ط³ظ„ ظˆطھط¬ط±ظٹط¨ظٹط©',en:'Honey & Experimental'},img:imgPath('beans')},
    {title:{ar:'طھط®ط²ظٹظ† ط§ظ„ط¨ظ† ظˆظ†ط¶ط§ط±طھظ‡',en:'Storage & Freshness'},img:imgPath('C2')},
    {title:{ar:'ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ط§ظ„طھط¬ط±ظٹط¨ظٹط©',en:'Experimental Processing'},img:imgPath('cherry')},
    {title:{ar:'ط§ظ„ظ…ط¹ط§ظ„ط¬ط© ظˆط§ظ„ظ†ظƒظ‡ط©',en:'Processing & Flavor'},img:imgPath('cupping')}
]},
  {id:'C3',level:'C',title:{ar:'ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظ‚ظ‡ظ‰',en:'Cafe Management'},icon:'ًںڈھ',desc:{ar:'ظ…ظ† ط§ظ„ط¨ط§ط±ظٹط³طھط§ ط¥ظ„ظ‰ طµط§ط­ط¨ ط§ظ„ظ…ظ‚ظ‡ظ‰',en:'Barista to Owner'},img:imgPath('C3'),lessons:[
    {title:{ar:'طھط®ط·ظٹط· ط§ظ„ظ…ظ‚ظ‡ظ‰',en:'Cafe Planning'},img:imgPath('map')},
    {title:{ar:'ط§ظ„طھظƒط§ظ„ظٹظپ ظˆط§ظ„ط£ط±ط¨ط§ط­',en:'Cost & Profit'},img:imgPath('cafe')},
    {title:{ar:'ط®ط¯ظ…ط© ط§ظ„ط¹ظ…ظ„ط§ط،',en:'Customer Service'},img:imgPath('team')},
    {title:{ar:'طھط·ظˆظٹط± ط§ظ„ظپط±ظٹظ‚',en:'Team Development'},img:imgPath('team')},
    {title:{ar:'طھط³ظˆظٹظ‚ ط§ظ„ظ…ظ‚ظ‡ظ‰',en:'Marketing Your Cafe'},img:imgPath('cafe')}
  ]}
];

function rT(tab){
  if(curTab===tab) return;
  curTab = tab || 'home';
  document.body.classList.remove('projector-mode');
  localStorage.removeItem('wha_projector');
  if(document.fullscreenElement) document.exitFullscreen?.();
  let isAdm=isAdmin();
  let tabs=[
    {id:'home',ic:'ًںڈ ',ar:'ط§ظ„ط±ط¦ظٹط³ظٹط©',en:'Home'},
    {id:'curriculum',ic:'ًں“ڑ',ar:'ط§ظ„ظ…ظ†ظ‡ط¬',en:'Curriculum'},
    {id:'journey',ic:'âک•',ar:'ط±ط­ظ„ط© ط§ظ„ظ‚ظ‡ظˆط©',en:'Coffee Journey'},
    {id:'exams',ic:'ًں“‌',ar:'ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ',en:'Exams'},
    {id:'profile',ic:'â­گ',ar:'ظ…ظ„ظپظٹ',en:'Profile'},
    ...(isAdm?[{id:'admin',ic:'âڑ™ï¸ڈ',ar:'ط§ظ„ط¥ط¯ط§ط±ط©',en:'Admin'}]:[])
  ];
  $('tabs').innerHTML = tabs.map(t =>
    '<button class="tab' + (t.id===curTab?' act':'') + '" onclick="rT(\''+t.id+'\')">' + t.ic + ' ' + __({ar:t.ar,en:t.en}) + '</button>'
  ).join('');
  pageTransition(()=>{
    if(curTab === 'home') $('root').innerHTML = sHome();
    else if(curTab === 'curriculum') $('root').innerHTML = sCurriculum();
    else if(curTab === 'journey') $('root').innerHTML = sJourney();
    else if(curTab === 'exams') $('root').innerHTML = sExams();
    else if(curTab === 'profile') $('root').innerHTML = sProfile();
    else if(curTab === 'admin') $('root').innerHTML = sAdmin();
    setTimeout(()=>{initTilt();initMagnetic()},100);
  });
}

function userGreeting(){
  let u=getCurUser();
  if(!u) return '';
  let lvl=XP_LEVELS[u.levelIdx||0];
  return '<div class="user-progress-card"><div class="user-progress-inner">'+
    '<div class="user-progress-avatar">'+u.name[0].toUpperCase()+'</div>'+
    '<div class="user-progress-info"><div class="user-progress-name">'+u.name+'</div>'+
    '<div class="user-progress-title">'+lvl.ic+' '+__(lvl.name)+'</div>'+
    '<div class="user-progress-bar-wrap"><div class="user-progress-bar"><div class="user-progress-fill" style="width:'+xpPct(u)+'%"></div></div>'+
    '<span class="user-progress-xp">'+u.xp+' XP</span></div></div>'+
    '<div class="user-progress-stats"><div class="ups-item"><span class="ups-n">'+(u.completedLessons||[]).length+'</span><span class="ups-l">'+__({ar:'ط¯ط±ظˆط³',en:'Les'})+'</span></div>'+
    '<div class="ups-item"><span class="ups-n">'+(u.badges||[]).length+'</span><span class="ups-l">'+__({ar:'ظˆط³ط§ظ…',en:'Badges'})+'</span></div>'+
    '<div class="ups-item"><span class="ups-n">ًں”¥'+(u.streak||0)+'</span><span class="ups-l">'+__({ar:'ط£ظٹط§ظ…',en:'Days'})+'</span></div></div></div>';
}
function sHome(){
  let totalLessons = CM.reduce((s,m)=>s+m.lessons.length,0);
  return userGreeting() + '<div class="hero glow-gold gradient-border"><div class="hero-glow"></div><h2>' + __({ar:'ط£ظƒط§ط¯ظٹظ…ظٹط© ط§ظ„ط£ظٹط§ط¯ظٹ ط§ظ„ط¨ظٹط¶ط§ط،',en:'White Hands Academy'}) + '</h2><div class="gold-divider"></div><p>' + __({ar:'ظ†ط±طھظ‚ظٹ ط¨ظپظ† ط§ظ„ظ‚ظ‡ظˆط© ظ…ظ† ط§ظ„ط¨ط¯ط§ظٹط© ط¥ظ„ظ‰ ط§ظ„ط§ط­طھط±ط§ظپ â€” طھط¯ط±ظٹط¨ ظ…ط¹طھظ…ط¯ ظˆظپظ‚ ظ…ط¹ط§ظٹظٹط± SCA ط§ظ„ط¹ط§ظ„ظ…ظٹط©',en:'Elevating coffee artistry from start to mastery â€” SCA-aligned certified training'}) + '</p></div><div class="jrny-cta glass-gold gradient-border" data-nav="journey" style="cursor:pointer;margin-bottom:32px;padding:28px 24px;border-radius:var(--radius-lg);text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px;transition:all .4s" onclick="rT(\'journey\')"><span style="font-size:3rem">âک•</span><h3 style="font-family:var(--font-display);font-size:1.3rem">' + __({ar:'ًںŒچ ط±ط­ظ„ط© ط§ظ„ظ‚ظ‡ظˆط©',en:'ًںŒچ Coffee Journey'}) + '</h3><p style="color:var(--text-muted);font-size:.85rem;max-width:500px">' + __({ar:'ظ‚طµط© ط§ظ„ظ‚ظ‡ظˆط© ط¹ط¨ط± 1200 ط¹ط§ظ… â€” ظ…ظ† ط£ط³ط§ط·ظٹط± ط¥ط«ظٹظˆط¨ظٹط§ ط¥ظ„ظ‰ ط£ظƒط§ط¯ظٹظ…ظٹط© ط§ظ„ط£ظٹط§ط¯ظٹ ط§ظ„ط¨ظٹط¶ط§ط،',en:'The story of coffee across 1200 years â€” from Ethiopian legends to White Hands Academy'}) + '</p><span class="btn btn-accent magnetic-btn" style="margin-top:4px">' + __({ar:'ط§ط¨ط¯ط£ ط§ظ„ط±ط­ظ„ط© ًںڑ€',en:'Start the Journey ًںڑ€'}) + '</span></div><div class="stats"><div class="stat-card glass"><div class="num stat-glow">3</div><div class="lbl">' + __({ar:'ظ…ط³طھظˆظٹط§طھ',en:'Levels'}) + '</div></div><div class="stat-card glass"><div class="num stat-glow">9</div><div class="lbl">' + __({ar:'ظˆط­ط¯ط§طھ',en:'Modules'}) + '</div></div><div class="stat-card glass"><div class="num stat-glow">' + totalLessons + '</div><div class="lbl">' + __({ar:'ط¯ط±ط³',en:'Lessons'}) + '</div></div><div class="stat-card glass"><div class="num stat-glow">SCA</div><div class="lbl">' + __({ar:'ظ…ط¹طھظ…ط¯',en:'Certified'}) + '</div></div></div><div class="gold-divider" style="width:200px;margin:32px auto"></div><h2 class="sec-title">' + __({ar:'ظ…ط³ط§ط±ط§طھ ط§ظ„طھط¹ظ„ظ…',en:'Learning Paths'}) + '</h2><p class="sec-sub">' + __({ar:'ط§ط®طھط± ظ…ط³طھظˆط§ظƒ ظˆط§ط¨ط¯ط£ ط±ط­ظ„طھظƒ ظپظٹ ط¹ط§ظ„ظ… ط§ظ„ظ‚ظ‡ظˆط©',en:'Choose your level and start your coffee journey'}) + '</p><div class="grid-3">' + Object.keys(LV).map(k=>{
    let lv=LV[k],mods=CM.filter(m=>m.level===k),tl=mods.reduce((s,m)=>s+m.lessons.length,0);
    return '<div class="card lvl-card tilt-card" data-nav="sModules" data-level="'+k+'"><div class="tilt-inner"><div class="tilt-glare"></div><span class="lvl-ic">' + lv.ic + '</span><h3>' + __(lv.name) + '</h3><div class="lvl-sub">' + __(lv.desc) + '</div><div class="lvl-stats"><div><div class="n">' + mods.length + '</div><div class="l">' + __({ar:'ظˆط­ط¯ط§طھ',en:'Mods'}) + '</div></div><div><div class="n">' + tl + '</div><div class="l">' + __({ar:'ط¯ط±ظˆط³',en:'Les'}) + '</div></div></div></div></div>';
  }).join('') + '</div>';
}

function sCurriculum(){
  let u = getCurUser();
  return '<h2 class="sec-title">' + __({ar:'ًں“ڑ ط§ظ„ظ…ظ†ظ‡ط¬ ط§ظ„ط¯ط±ط§ط³ظٹ',en:'ًں“ڑ Curriculum'}) + '</h2><p class="sec-sub">' + __({ar:'ط§ط®طھط± ظ…ط³طھظˆط§ظƒ ظ„ط§ط³طھط¹ط±ط§ط¶ ط§ظ„ظˆط­ط¯ط§طھ ظˆط§ظ„ط¯ط±ظˆط³',en:'Choose your level to browse modules and lessons'}) + '</p><div class="grid-3">' + Object.keys(LV).map(k=>{
    let lv=LV[k],mods=CM.filter(m=>m.level===k),tl=mods.reduce((s,m)=>s+m.lessons.length,0);
    let doneT = u ? mods.reduce((s,m,mi2)=>s+m.lessons.filter((_,i)=>isLessonDone(u,k,mi2,i)).length,0) : 0;
    let pct = tl > 0 ? Math.round(doneT/tl*100) : 0;
    return '<div class="card lvl-card tilt-card" data-nav="sModules" data-level="'+k+'"><div class="tilt-inner"><div class="tilt-glare"></div><div class="lvl-glow" style="--glow-c:'+(k==='A'?'rgba(76,175,80,.08)':k==='B'?'rgba(255,152,0,.08)':'rgba(156,39,176,.08)')+'"></div><span class="lvl-ic">' + lv.ic + '</span><h3>' + __(lv.name) + '</h3><div class="lvl-sub">' + __(lv.desc) + '</div><div class="lvl-bar"><div class="lvl-bar-fill" style="width:'+pct+'%"></div></div><div class="lvl-stats"><div><div class="n">' + mods.length + '</div><div class="l">' + __({ar:'ظˆط­ط¯ط§طھ',en:'Mods'}) + '</div></div><div><div class="n">' + tl + '</div><div class="l">' + __({ar:'ط¯ط±ظˆط³',en:'Les'}) + '</div></div><div><div class="n">' + pct + '%</div><div class="l">' + __({ar:'ظ…ظƒطھظ…ظ„',en:'Done'}) + '</div></div></div></div></div>';
  }).join('') + '</div>';
}

function sModules(level){
  let lv = LV[level], mods = CM.filter(m => m.level === level);
  let u = getCurUser();
  let h = '<button class="btn btn-sm btn-ghost magnetic-btn" data-nav="curriculum" style="margin-bottom:14px">â¬… ' + __({ar:'ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ظ…ط³طھظˆظٹط§طھ',en:'Back to Levels'}) + '</button>';
  h += '<h2 class="sec-title" style="font-size:1.4rem">' + lv.ic + ' ' + __(lv.name) + ' â€” ' + __({ar:'ط§ظ„ظˆط­ط¯ط§طھ',en:'Modules'}) + '</h2><div class="grid-3">';
  h += mods.map((m,mi) => {
    let totalL = m.lessons.length;
    let doneL = (u ? m.lessons.filter((_,i)=>isLessonDone(u,level,mi,i)).length : 0);
    let pct = totalL > 0 ? Math.round(doneL/totalL*100) : 0;
    let circ = 2*Math.PI*19;
    let off = circ - (pct/100)*circ;
    let allDone = doneL === totalL && totalL > 0;
    let ringCl = allDone ? 'complete' : '';
    return '<div class="card mod-card tilt-card" data-nav="sModule" data-level="'+level+'" data-mi="'+mi+'"><div class="tilt-inner"><div class="tilt-glare"></div><div class="card-img"><div class="card-bg" style="background-image:url('+m.img+')"></div><div class="card-ov"></div><div class="card-ic">' + m.icon + '</div><h3>' + __(m.title) + '</h3><div class="ls-count">' + doneL + '/' + totalL + ' ' + __({ar:'ط¯ط±ظˆط³',en:'les'}) + '</div></div><div class="card-body"><p>' + __(m.desc) + '</p><div class="meta"><div><div class="n">' + totalL + '</div><div class="l">' + __({ar:'ط¯ط±ظˆط³',en:'Lessons'}) + '</div></div></div>' +
    '<div class="mod-prog-ring ' + ringCl + '"><svg viewBox="0 0 44 44"><circle class="track" cx="22" cy="22" r="19"/><circle class="fill" cx="22" cy="22" r="19" stroke-dasharray="' + circ + '" stroke-dashoffset="' + off + '"/></svg><span class="pct">' + pct + '%</span><span class="check">âœ“</span></div>' +
    '</div></div></div>';
  }).join('') + '</div>';
  $('root').innerHTML = h;
  setTimeout(()=>{initTilt();initMagnetic()},100);
}

function sModule(level, mi, li){
  li = li || 0;
  let mods = CM.filter(x => x.level === level);
  let m = mods[mi];
  let l = m.lessons[li];
  let lv = LV[level];
  let body = getLessonBody(CM.indexOf(m), li);
  let story = (li === 0 && STORIES[m.id]) ? (STORIES[m.id][lang] || STORIES[m.id].en) : '';
  let hero = l.img.replace('w=600&q=80','w=1400&q=90');
  let total = m.lessons.length;
  // Sidebar
  let u2 = getCurUser();
  let doneCount = u2 ? m.lessons.filter((_,i)=>isLessonDone(u2,level,mi,i)).length : 0;
  let pctCirc = 2*Math.PI*12;
  let pctOff = pctCirc - (doneCount/total)*pctCirc;
  let side = '<div class="ls-side"><div class="ls-side-top">' +
    '<button class="btn btn-sm btn-ghost" data-nav="sModules" data-level="'+level+'">â¬… ' + __({ar:'ط§ظ„ظˆط­ط¯ط§طھ',en:'Modules'}) + '</button>' +
    '<div class="ls-ring"><svg viewBox="0 0 28 28"><circle class="ls-rt" cx="14" cy="14" r="12"/><circle class="ls-rf" cx="14" cy="14" r="12" stroke-dasharray="' + pctCirc + '" stroke-dashoffset="' + pctOff + '"/></svg><span>' + doneCount + '/' + total + '</span></div>' +
    '<h4>' + lv.ic + ' ' + __(m.title) + '</h4>' +
    '<div class="ls-prog"><div class="ls-prog-bar"><div class="ls-prog-fill" style="width:'+((li+1)/total*100)+'%"></div></div><span>' + (li+1) + '/' + total + '</span></div>' +
    '</div><div class="ls-side-list">' +
    m.lessons.map((l2,i)=>{
      let done=isLessonDone(u2,level,mi,i);
      return '<div class="ls-item'+(i===li?' act':'')+(done?' ls-done':'')+'" data-nav="sModule" data-level="'+level+'" data-mi="'+mi+'" data-li="'+i+'"><div class="ls-node"><div class="ls-dot'+(done?' done':'')+'"></div>'+(i<total-1?'<div class="ls-line'+(done?' done':'')+'"></div>':'')+'</div><div class="ls-tit">'+(i+1)+'. '+__(l2.title)+'</div><div class="ls-done-badge">âœ“</div></div>';
    }).join('') +
    '</div></div>';
  // Main content
  let main = '<div class="ls-main"><div class="ls-hero" style="background-image:url('+hero+')"><div class="ls-hero-ov"></div><div class="ls-hero-inner"><div class="ls-badge">' + lv.ic + ' ' + __(lv.name) + ' / ' + __(m.title) + '</div><h2>' + __(l.title) + '</h2></div></div>' +
    '<div class="ls-body">' + (story + body || '<p class="empty-msg">' + __({ar:'ط¬ط§ط±ظٹ طھط¬ظ‡ظٹط² ط§ظ„ظ…ط­طھظˆظ‰...',en:'Preparing content...'}) + '</p>') + '</div>' +
    '<div class="ls-nav"><div class="ls-nav-inner">' +
    (li>0?'<button class="btn btn-sm" data-nav="sModule" data-level="'+level+'" data-mi="'+mi+'" data-li="'+(li-1)+'">â¬… ' + __({ar:'ط§ظ„ط³ط§ط¨ظ‚',en:'Prev'}) + '</button>':'<div></div>') +
    '<span class="ls-pg">' + __({ar:'ط§ظ„ط¯ط±ط³',en:'Les'}) + ' ' + (li+1) + '/' + total + '</span>' +
'<button class="projector-toggle" onclick="toggleProjector()">ًں“½ï¸ڈ ' + __({ar:'ط¨ط±ظˆط¬ظٹظƒطھظˆط±',en:'Projector'}) + '</button>' +
     (li<total-1?'<button class="btn btn-sm btn-accent" data-nav="continue" data-level="'+level+'" data-mi="'+mi+'" data-li="'+li+'">' + __({ar:'ط£ظƒظ…ظ„ ط§ظ„ط±ط­ظ„ط©',en:'Continue'}) + ' â‍،</button>':'<div style="display:flex;gap:8px"><button class="btn btn-sm btn-success" data-nav="finish" data-level="'+level+'" data-mi="'+mi+'" data-li="'+li+'">âœ“ ' + __({ar:'طھظ…',en:'Done'}) + '</button><button class="btn btn-sm btn-accent" onclick="showCertificate(\''+level+'\','+mi+')">ًںژ“ ' + __({ar:'ط§ظ„ط´ظ‡ط§ط¯ط©',en:'Certificate'}) + '</button></div>') +
    '</div></div></div>';
  $('root').innerHTML = '<div class="lesson-split">' + side + main + '</div>';
  window.scrollTo(0,0);
  setTimeout(()=>{initTilt();initMagnetic()},100);
  // Restore projector mode state
  if(localStorage.getItem('wha_projector')==='1') document.body.classList.add('projector-mode');
}
/* === Magazine layout helpers === */
function magHero(key, caption, opt){
  opt = opt || {};
  let h = opt.h || 420;
  let cls = opt.cls || '';
  return '<div class="img-c mag-hero ' + cls + '" style="min-height:' + h + 'px"><img src="' + photo(key) + '" alt="" style="height:' + h + 'px"><div class="cap" style="font-size:' + (opt.fs || '1.4') + 'rem">' + caption + '</div></div>';
}
function magSection(key, title, bodyHTML){
  return '<div class="mag-card"><div class="img-c" style="min-height:280px;margin:0;border-radius:14px 14px 0 0"><img src="' + photo(key) + '" alt="" style="height:280px"><div class="cap" style="font-size:1.2rem">' + title + '</div></div><div class="mag-card-body">' + bodyHTML + '</div></div>';
}
function magQuote(text, attr){
  return '<div class="mag-quote">' + text + (attr ? '<span class="att">â€” ' + attr + '</span>' : '') + '</div>';
}
function magGrid2(leftKey, leftCap, rightKey, rightCap){
  return '<div class="mag-grid-2"><div class="img-c" style="min-height:200px;margin:0"><img src="' + photo(leftKey) + '" alt="" style="height:200px"><div class="cap" style="font-size:.9rem;padding:12px">' + leftCap + '</div></div><div class="img-c" style="min-height:200px;margin:0"><img src="' + photo(rightKey) + '" alt="" style="height:200px"><div class="cap" style="font-size:.9rem;padding:12px">' + rightCap + '</div></div></div>';
}
function toggleProjector(){
  let on=document.body.classList.toggle('projector-mode');
  localStorage.setItem('wha_projector',on?'1':'0');
  if(on) document.documentElement.requestFullscreen?.();
  else if(document.fullscreenElement) document.exitFullscreen?.();
}
function completeLesson(level,mi,li){
  let u=getCurUser();
  if(!u) return;
  let key=level+'-'+mi+'-'+li;
  if((u.completedLessons||[]).includes(key)) return;
  u.completedLessons=(u.completedLessons||[]); u.completedLessons.push(key);
  u.lessonTimestamps=(u.lessonTimestamps||[]); u.lessonTimestamps.push(todayStr());
  let r=addXP(u,XP_REWARDS.lesson);
  // Check speed learner badge (5+ lessons in one day)
  let todayCount=u.lessonTimestamps.filter(d=>d===todayStr()).length;
  if(todayCount>=5) awardBadge(u,'speed_learner');
  // Check module master
  checkModuleMaster(u,level,mi);
  // Check all-rounder
  let allLessons=CM.reduce((s,m)=>s+m.lessons.length,0);
  if((u.completedLessons||[]).length>=allLessons) awardBadge(u,'all_rounder');
  saveCurUser(u);
  if(r.leveledUp) to('ًںژ‰ '+__(XP_LEVELS[r.newLvl].name)+'! '+__({ar:'طھظ‡ط§ظ†ظٹظ†ط§ ط¹ظ„ظ‰ ط§ظ„ظ…ط³طھظˆظ‰ ط§ظ„ط¬ط¯ظٹط¯',en:'Congratulations on the new level!'}));
}

/* ===== Exam System ===== */
let curExamLevel = null;
let curExamQ = [];
let curExamIdx = 0;
let curExamScore = null;

function sExams(){
  if(curExamQ.length > 0 && curExamScore === null){
    return renderExamInProgress();
  }
  if(curExamScore !== null){
    return renderExamResult();
  }
  let h = '<div class="hero glow-gold gradient-border"><div class="hero-glow"></div><h2>' + __({ar:'ًں“‌ ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ',en:'ًں“‌ Exams'}) + '</h2><p>' + __({ar:'ط§ط®طھط¨ط± ظ…ط¹ط±ظپطھظƒ ط¨ط§ط®طھظٹط§ط± ط§ظ„ظ…ط³طھظˆظ‰ ط§ظ„ظ…ظ†ط§ط³ط¨',en:'Test your knowledge â€” choose your level'}) + '</p></div><div class="grid-3">';
  Object.keys(LV).forEach(k => {
    let lv = LV[k], totalQ = (EX[k]||[]).length;
    h += '<div class="card" onclick="startExam(\''+k+'\')"><div class="card-img"><div class="card-bg '+lv.bgCl+'"></div><div class="card-ov"></div><div class="card-ic">' + lv.ic + '</div><h3>' + __(lv.name) + '</h3></div><div class="card-body"><p>' + totalQ + ' ' + __({ar:'ط³ط¤ط§ظ„',en:'questions'}) + '</p><p style="font-size:.82rem;color:var(--accent);margin-top:6px">' + __({ar:'ظ…ط·ظ„ظˆط¨ 7/10 ظ„ظ„ظ†ط¬ط§ط­',en:'Need 7/10 to pass'}) + '</p></div></div>';
  });
  h += '</div>';
  return h;
}

function startExam(level){
  let pool = EX[level] || [];
  if(pool.length < 10) return;
  curExamLevel = level;
  curExamScore = null;
  curExamIdx = 0;
  let shuffled = [...pool].sort(()=>Math.random()-.5);
  curExamQ = shuffled.slice(0,10).map(q=>({
    q:q, selected:-1
  }));
  $('root').innerHTML = renderExamInProgress();
}

function renderExamInProgress(){
  if(!curExamQ.length || curExamIdx >= curExamQ.length) return '';
  let item = curExamQ[curExamIdx];
  let q = item.q;
  let total = curExamQ.length;
  let h = '<div class="exam-wrap">';
  h += '<div class="exam-sidebar">';
  h += '<button class="btn btn-sm btn-ghost" onclick="resetExam()" style="margin-bottom:8px">â†گ ' + __({ar:'ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ',en:'Exams'}) + '</button>';
  h += '<div class="exam-level-badge">' + LV[curExamLevel].ic + ' ' + __(LV[curExamLevel].name) + '</div>';
  h += '<div class="exam-progress-bar"><div class="exam-progress-fill" style="width:'+((curExamIdx+1)/total*100)+'%"></div></div>';
  h += '<div class="exam-progress-text">' + (curExamIdx+1) + '/' + total + '</div>';
  h += '<div class="exam-dots">';
  for(let i=0; i<total; i++){
    let cls = 'exam-dot';
    if(i < curExamIdx) cls += ' done';
    else if(i === curExamIdx) cls += ' act';
    if(curExamQ[i].selected >= 0) cls += ' answered';
    h += '<div class="' + cls + '" onclick="goToQ('+i+')">' + (i+1) + '</div>';
  }
  h += '</div></div>';
  h += '<div class="exam-main">';
  h += '<div class="exam-question-num">' + __({ar:'ط³ط¤ط§ظ„',en:'Question'}) + ' ' + (curExamIdx+1) + ' / ' + total + '</div>';
  h += '<h3 class="exam-question-text">' + __(q.q) + '</h3>';
  h += '<div class="exam-options">';
  q.opts.forEach((o,i) => {
    let sel = item.selected === i ? ' selected' : '';
    h += '<div class="exam-opt' + sel + '" onclick="selectAns('+i+')">' +
      '<div class="exam-opt-radio' + sel + '"></div>' +
      '<span>' + __(o) + '</span></div>';
  });
  h += '</div>';
  h += '<div class="exam-nav-btns">';
  if(curExamIdx > 0) h += '<button class="btn btn-sm btn-ghost" onclick="goToQ('+(curExamIdx-1)+')">â†گ ' + __({ar:'ط§ظ„ط³ط§ط¨ظ‚',en:'Prev'}) + '</button>';
  else h += '<div></div>';
  if(curExamIdx < total-1){
    h += '<button class="btn btn-sm btn-accent" onclick="goToQ('+(curExamIdx+1)+')">' + __({ar:'ط§ظ„طھط§ظ„ظٹ',en:'Next'}) + ' â†’</button>';
  } else {
    let answered = curExamQ.filter(i=>i.selected>=0).length;
    h += '<button class="btn btn-sm btn-success" onclick="submitExam()"' + (answered<total?' disabled':'') + '>' + __({ar:'ط¥ظ†ظ‡ط§ط، ط§ظ„ط§ط®طھط¨ط§ط±',en:'Finish Exam'}) + ' âœ“</button>';
  }
  h += '</div></div></div>';
  return h;
}

function selectAns(i){
  if(curExamScore !== null) return;
  curExamQ[curExamIdx].selected = i;
  $('root').innerHTML = renderExamInProgress();
}

function goToQ(i){
  if(i < 0 || i >= curExamQ.length || curExamScore !== null) return;
  curExamIdx = i;
  $('root').innerHTML = renderExamInProgress();
}

function submitExam(){
  if(curExamScore !== null) return;
  let correct = 0;
  curExamQ.forEach(item => {
    if(item.selected === item.q.ans) correct++;
  });
  curExamScore = correct;
  let u=getCurUser();
  if(u && correct>=7){
    let lv=LV[curExamLevel];
    u.passedExams=(u.passedExams||[]);
    if(!u.passedExams.includes(curExamLevel)){
      u.passedExams.push(curExamLevel);
      let xpAmt=curExamLevel==='A'?XP_REWARDS.examA:curExamLevel==='B'?XP_REWARDS.examB:XP_REWARDS.examC;
      addXP(u,xpAmt);
      // Award level badge
      if(curExamLevel==='A') awardBadge(u,'level_a');
      else if(curExamLevel==='B') awardBadge(u,'level_b');
      else if(curExamLevel==='C') awardBadge(u,'level_c');
    }
    // Perfect score badge
    if(correct===10) awardBadge(u,'exam_perfect');
    // True master: all 3 exams with 10/10
    if((u.passedExams||[]).length===3 && !hasBadge(u,'true_master')){
      let allPerfect=true;
      ['A','B','C'].forEach(l=>{if(!u.passedExams.includes(l)||!(EX[l]||[]).length) allPerfect=false;});
      if(allPerfect) awardBadge(u,'true_master');
    }
    saveCurUser(u);
  }
  $('root').innerHTML = renderExamResult();
}

function renderExamResult(){
  if(curExamScore === null) return '';
  let total = curExamQ.length;
  let pct = Math.round(curExamScore/total*100);
  let passed = curExamScore >= 7;
  let lv = LV[curExamLevel];
  let h = '<div class="exam-result-wrap">';
  h += '<div class="exam-result-card">';
  h += '<div class="exam-result-icon">' + (passed ? 'ًںژ‰' : 'ًںک‍') + '</div>';
  h += '<h2>' + (passed ? __({ar:'ظ…ط¨ط±ظˆظƒ! ظ†ط¬ط­طھ ًںژ‰',en:'Congratulations! You Passed ًںژ‰'}) : __({ar:'ظ„ظ„ط£ط³ظپ! ظ„ظ… طھظ†ط¬ط­ ًںک‍',en:'Sorry! You Did Not Pass ًںک‍'})) + '</h2>';
  h += '<div class="exam-result-score">' + curExamScore + '/' + total + '</div>';
  h += '<div class="exam-result-pct">' + pct + '%</div>';
  h += '<div class="exam-result-bar"><div class="exam-result-fill" style="width:'+pct+'%;background:'+(passed?'var(--accent)':'#e74c3c')+'"></div></div>';
  h += '<p class="exam-result-msg">' + (passed ? __({ar:'ط£ظ†طھ ظ…ط¤ظ‡ظ„ ط§ظ„ط¢ظ† ظ„ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط´ظ‡ط§ط¯ط© ط¥طھظ…ط§ظ… ط§ظ„ظ…ط³طھظˆظ‰',en:'You are now eligible for a level certificate'}) : __({ar:'ط­ط§ظˆظ„ ظ…ط±ط© ط£ط®ط±ظ‰ ظ„طھط­ط³ظٹظ† ظ†طھظٹط¬طھظƒ',en:'Try again to improve your score'})) + '</p>';
  h += '<div class="exam-result-btns">';
  if(passed){
    h += '<button class="btn btn-accent" onclick="showExamCertificate()">ًںژ“ ' + __({ar:'ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط§ظ„ط´ظ‡ط§ط¯ط©',en:'Get Certificate'}) + '</button>';
  }
  h += '<button class="btn btn-ghost" onclick="resetExam()">ًں”„ ' + __({ar:'ط¥ط¹ط§ط¯ط© ط§ظ„ط§ط®طھط¨ط§ط±',en:'Retry Exam'}) + '</button>';
  h += '<button class="btn btn-ghost" onclick="rT(\'exams\')">â†گ ' + __({ar:'ظƒظ„ ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ',en:'All Exams'}) + '</button>';
  h += '</div></div></div>';
  return h;
}

function resetExam(){
  curExamLevel = null;
  curExamQ = [];
  curExamIdx = 0;
  curExamScore = null;
  rT('exams');
}

function showExamCertificate(){
  let lv = LV[curExamLevel];
  let date = new Date();
  let dStr = date.toLocaleDateString(lang==='ar'?'ar-EG':'en-US',{year:'numeric',month:'long',day:'numeric'});
  let name = __({ar:'ط·ط§ظ„ط¨ ط£ظƒط§ط¯ظٹظ…ظٹط© ط§ظ„ط£ظٹط§ط¯ظٹ ط§ظ„ط¨ظٹط¶ط§ط،',en:'White Hands Academy Student'});
  let ov = document.createElement('div');
  ov.className = 'cert-overlay';
  ov.innerHTML = '<div class="cert-card glass-gold gradient-border"><div class="cert-badge">ط£ظƒط§ط¯ظٹظ…ظٹط© ط§ظ„ط£ظٹط§ط¯ظٹ ط§ظ„ط¨ظٹط¶ط§ط،<br><small>White Hands Academy</small></div>' +
    '<div class="cert-gold-line"></div>' +
    '<div class="cert-icon floating">' + lv.ic + '</div>' +
    '<h2>' + __({ar:'ط´ظ‡ط§ط¯ط© ط¥طھظ…ط§ظ…',en:'Certificate of Completion'}) + '</h2>' +
    '<p class="cert-p1">' + __({ar:'طھط´ظ‡ط¯ ط§ظ„ط£ظƒط§ط¯ظٹظ…ظٹط© ط£ظ†',en:'This certifies that'}) + '</p>' +
    '<div class="cert-name">' + name + '</div>' +
    '<p class="cert-p2">' + __({ar:'ظ‚ط¯ ط£طھظ… ط¨ظ†ط¬ط§ط­ ط§ط®طھط¨ط§ط± ظ…ط³طھظˆظ‰',en:'has successfully passed the exam level'}) + '</p>' +
    '<div class="cert-mod">' + lv.ic + ' ' + __(lv.name) + '</div>' +
    '<p class="cert-p3">' + __({ar:'ط¨ط¯ط±ط¬ط© ' + curExamScore + '/' + curExamQ.length,en:'with score ' + curExamScore + '/' + curExamQ.length}) + '</p>' +
    '<div class="cert-gold-line"></div>' +
    '<div class="cert-foot"><div><strong>' + __({ar:'ط§ظ„طھط§ط±ظٹط®',en:'Date'}) + '</strong><br>' + dStr + '</div><div><strong>' + __({ar:'ط§ظ„ظ…ط³طھظˆظ‰',en:'Level'}) + '</strong><br>' + __(lv.name) + '</div><div><strong>' + __({ar:'ط§ظ„ط¯ط±ط¬ط©',en:'Score'}) + '</strong><br>' + curExamScore + '/' + curExamQ.length + '</div></div>' +
    '<button class="btn btn-sm btn-accent magnetic-btn" onclick="window.print()">ًں–¨ï¸ڈ ' + __({ar:'ط·ط¨ط§ط¹ط©',en:'Print'}) + '</button>' +
    '<button class="btn btn-sm btn-ghost magnetic-btn" onclick="this.closest(\'.cert-overlay\').remove()">âœ• ' + __({ar:'ط¥ط؛ظ„ط§ظ‚',en:'Close'}) + '</button>' +
    '</div>';
  document.body.appendChild(ov);
}

function showCertificate(level, mi){
  let mods = CM.filter(x => x.level === level);
  let m = mods[mi];
  let lv = LV[level];
  let date = new Date();
  let dStr = date.toLocaleDateString(lang==='ar'?'ar-EG':'en-US',{year:'numeric',month:'long',day:'numeric'});
  let ov = document.createElement('div');
  ov.className = 'cert-overlay';
  ov.innerHTML = '<div class="cert-card glass-gold gradient-border"><div class="cert-badge">ط§ظƒط§ط¯ظٹظ…ظٹط© ط§ظ„ط£ظٹط§ط¯ظٹ ط§ظ„ط¨ظٹط¶ط§ط،<br><small>White Hands Academy</small></div>' +
    '<div class="cert-gold-line"></div>' +
    '<div class="cert-icon floating">' + lv.ic + '</div>' +
    '<h2>' + __({ar:'ط´ظ‡ط§ط¯ط© ط¥طھظ…ط§ظ…',en:'Certificate of Completion'}) + '</h2>' +
    '<p class="cert-p1">' + __({ar:'ظ†ط´ظ‡ط¯ ط¨ط£ظ†',en:'This certifies that'}) + '</p>' +
    '<div class="cert-name">' + __({ar:'ط·ط§ظ„ط¨ ط£ظƒط§ط¯ظٹظ…ظٹط© ط§ظ„ط£ظٹط§ط¯ظٹ ط§ظ„ط¨ظٹط¶ط§ط،',en:'White Hands Academy Student'}) + '</div>' +
    '<p class="cert-p2">' + __({ar:'ظ‚ط¯ ط£ظƒظ…ظ„ ط¨ظ†ط¬ط§ط­ ظˆط­ط¯ط©',en:'has successfully completed the module'}) + '</p>' +
    '<div class="cert-mod">' + lv.ic + ' ' + __(m.title) + '</div>' +
    '<p class="cert-p3">' + __({ar:'ظˆظپظ‚ ظ…ط¹ط§ظٹظٹط± SCA ط§ظ„ط¯ظˆظ„ظٹط© ظ„طھط¯ط±ظٹط¨ ط§ظ„ط¨ط§ط±ظٹط³طھط§',en:'Aligned with SCA international barista training standards'}) + '</p>' +
    '<div class="cert-gold-line"></div>' +
    '<div class="cert-foot"><div><strong>' + __({ar:'ط§ظ„طھط§ط±ظٹط®',en:'Date'}) + '</strong><br>' + dStr + '</div><div><strong>' + __({ar:'ط§ظ„ظ…ط³طھظˆظ‰',en:'Level'}) + '</strong><br>' + __(lv.name) + '</div><div><strong>' + __({ar:'ط§ظ„ط¯ط±ظˆط³',en:'Lessons'}) + '</strong><br>' + m.lessons.length + '</div></div>' +
    '<button class="btn btn-sm magnetic-btn" onclick="this.closest(\'.cert-overlay\').remove()">' + __({ar:'âœ• ط¥ط؛ظ„ط§ظ‚',en:'âœ• Close'}) + '</button>' +
    '<button class="btn btn-sm btn-accent magnetic-btn" onclick="window.print()" style="margin-top:6px">ًں–¨ï¸ڈ ' + __({ar:'ط·ط¨ط§ط¹ط©',en:'Print'}) + '</button>' +
    '</div>';
  document.body.appendChild(ov);
}

function sJourney(){
  let ms = [
    {yr:'~850ظ…',enYr:'~850 AD',ic:'ًںگگ',img:'j0',
      title:{ar:'ط£ط³ط·ظˆط±ط© ظƒظ„ط¯ â€” ط§ظƒطھط´ط§ظپ ط§ظ„ظ‚ظ‡ظˆط©',en:'The Legend of Kaldi â€” Coffee Discovered'},
      story:[{ar:'ظپظٹ ط£ط¹ط§ظ„ظٹ ظ…ط±طھظپط¹ط§طھ ظƒط§ظپط§ ط§ظ„ط¥ط«ظٹظˆط¨ظٹط©طŒ ط­ظٹط« طھظ…طھط¯ ط؛ط§ط¨ط§طھ ط§ظ„ط¨ظ† ط§ظ„ط¨ط±ظٹ ط¹ظ„ظ‰ ط³ظپظˆط­ ط§ظ„ط¬ط¨ط§ظ„ ط§ظ„ط®ط¶ط±ط§ط،طŒ ظƒط§ظ† ط§ظ„ط±ط§ط¹ظٹ ظƒظ„ط¯ ظٹط±ط¹ظ‰ ط£ط؛ظ†ط§ظ…ظ‡. ظˆظپظٹ ط£ط­ط¯ ط§ظ„ط£ظٹط§ظ…طŒ ظ„ط§ط­ط¸ ط´ظٹط¦ط§ظ‹ ط؛ط±ظٹط¨ط§ظ‹: ط£ط؛ظ†ط§ظ…ظ‡ طھظ‚ظپط² ظˆطھطھظ…ط§ظٹظ„ ط¨ط·ط§ظ‚ط© ط؛ظٹط± ط¹ط§ط¯ظٹط© ط¨ط¹ط¯ ط£ظ† طھظ†ط§ظˆظ„طھ ط«ظ…ط§ط±ط§ظ‹ ط­ظ…ط±ط§ط، طµط؛ظٹط±ط© ظ…ظ† ط´ط¬ظٹط±ط§طھ ط¨ط±ظٹط©.',en:'High in the Ethiopian highlands of Kaffa, where wild coffee forests blanket the green mountain slopes, the goatherd Kaldi tended his flock. One day, he noticed something strange: his goats were leaping and prancing with unusual energy after eating small red berries from wild bushes.'},
       {ar:'طھط³ظ…ط± ظƒظ„ط¯ ظ…ظ† ط§ظ„ط¯ظ‡ط´ط©. ظ‚ط±ط± ط£ظ† ظٹط¬ط±ط¨ ط§ظ„ط«ظ…ط§ط± ط¨ظ†ظپط³ظ‡. ط¨ط¹ط¯ ط¯ظ‚ط§ط¦ظ‚طŒ ط´ط¹ط± ط¨ظ†ط´ط§ط· ظ…ظ†ط¹ط´ ظˆطµظپط§ط، ط°ظ‡ظ†ظٹ ظ„ظ… ظٹط¹ظ‡ط¯ظ‡ ظ…ظ† ظ‚ط¨ظ„. ط­ظ…ظ„ ط­ظپظ†ط© ظ…ظ† ط§ظ„ط«ظ…ط§ط± ط¥ظ„ظ‰ ط±ط§ظ‡ط¨ ظپظٹ ط¯ظٹط± ظ‚ط±ظٹط¨طŒ ظ„ظƒظ† ط§ظ„ط±ط§ظ‡ط¨ ط±ظپط¶ظ‡ط§ ط؛ط§ط¶ط¨ط§ظ‹ ظˆط±ظ…ظ‰ ط¨ظ‡ط§ ظپظٹ ط§ظ„ظ†ط§ط±. ظ„ظƒظ† ط±ط§ط¦ط­ط© ط§ظ„ط¨ظ† ط§ظ„ظ…ط­ظ…طµ ظƒط§ظ†طھ ظپظˆط§ط­ط© ظ„ط¯ط±ط¬ط© ط£ظ† ط±ط§ظ‡ط¨ط§ظ‹ ط¢ط®ط± ط§ظ‚طھط±ط­ ط®ظ„ط·ظ‡ط§ ط¨ط§ظ„ظ…ط§ط، ط§ظ„ط³ط§ط®ظ† â€” ظˆظ‡ظƒط°ط§ ظˆظڈظ„ط¯ ط£ظˆظ„ ظپظ†ط¬ط§ظ† ظ‚ظ‡ظˆط©.',en:'Kaldi was astonished. He decided to try the berries himself. Within minutes, he felt a refreshing alertness and mental clarity he had never experienced. He carried a handful to a monk at a nearby monastery, but the monk angrily threw them into the fire. The aroma of roasting coffee was so intoxicating that another monk suggested mixing them with hot water â€” and the first cup of coffee was born.'}],
      facts:[{ar:'ظ…ظ†ط·ظ‚ط© ظƒط§ظپط§ ط£ط¹ط·طھ ط§ظ„ظ‚ظ‡ظˆط© ط§ط³ظ…ظ‡ط§',en:'The region Kaffa gave coffee its name'},{ar:'ط£ظˆظ„ طھط¯ظˆظٹظ† ظ„ظ„ط£ط³ط·ظˆط±ط© ظƒط§ظ† ط¹ط§ظ… 1592',en:'First recorded in 1592'},{ar:'ط§ظ„ظ‚ظ‡ظˆط© ظ†ظ…طھ ط¨ط±ظٹط§ظ‹ ظپظٹ ط¥ط«ظٹظˆط¨ظٹط§ ظ‚ط¨ظ„ ط§ظ„طھط§ط±ظٹط®',en:'Coffee grew wild in Ethiopia before recorded history'}]},
    {yr:'1450ظ…',enYr:'1450',ic:'ًںڈ؛',img:'j1',
      title:{ar:'ط§ظ„طµظˆظپظٹظˆظ† ظپظٹ ط§ظ„ظٹظ…ظ† â€” ط£ظˆظ„ ظپظ†ط¬ط§ظ†',en:'Yemeni Sufis â€” The First Cup'},
      story:[{ar:'ط¹ط¨ط± ط§ظ„ط¨ط­ط± ط§ظ„ط£ط­ظ…ط±طŒ ظˆطµظ„طھ ط­ط¨ظˆط¨ ط§ظ„ط¨ظ† ط¥ظ„ظ‰ ط§ظ„ظٹظ…ظ† ظپظٹ ط§ظ„ظ‚ط±ظ† ط§ظ„ط®ط§ظ…ط³ ط¹ط´ط±. ظƒط§ظ† ط§ظ„طµظˆظپظٹظˆظ† ط§ظ„ظٹظ…ظ†ظٹظˆظ† ظٹط¨ط­ط«ظˆظ† ط¹ظ† ط´ظٹط، ظٹط³ط§ط¹ط¯ظ‡ظ… ط¹ظ„ظ‰ ط§ظ„ط¨ظ‚ط§ط، ظ…ط³طھظٹظ‚ط¸ظٹظ† ط·ظˆط§ظ„ ط§ظ„ظ„ظٹظ„ ظپظٹ ط§ظ„ط°ظƒط± ظˆط§ظ„ط¹ط¨ط§ط¯ط©. ظˆط¬ط¯ظˆط§ ط¶ط§ظ„طھظ‡ظ… ظپظٹ ط§ظ„ظ‚ظ‡ظˆط©.',en:'Across the Red Sea, coffee beans reached Yemen in the 15th century. Yemeni Sufis were searching for something to help them stay awake through long nights of worship and dhikr. They found their answer in coffee.'},
       {ar:'ظپظٹ ط§ظ„ط¨ظٹظˆطھ ط§ظ„ظٹظ…ظ†ظٹط©طŒ ظƒط§ظ†ظˆط§ ظٹط؛ظ„ظٹ ط­ط¨ظˆط¨ ط§ظ„ط¨ظ† ظ…ط¹ ط§ظ„ظ…ط§ط، ظˆظٹط¶ظٹظپظˆظ† ط§ظ„ط³ظƒط± ظˆط§ظ„ظ‡ظٹظ„ ظˆط§ظ„ط²ظ†ط¬ط¨ظٹظ„ â€” ظ‡ظƒط°ط§ ظˆظڈظ„ط¯ ط£ط³ظ„ظˆط¨ ط§ظ„طھط­ط¶ظٹط± ط§ظ„ط°ظٹ ظ†ط¹ط±ظپظ‡ ط§ظ„ظٹظˆظ… ط¨ط§ط³ظ… "ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„طھط±ظƒظٹط©". ط§ظ†طھط´ط±طھ ط§ظ„ظ‚ظ‡ظˆط© ظ…ظ† ط§ظ„ظٹظ…ظ† ط¥ظ„ظ‰ ظ…ظƒط© ظپط§ظ„ظ‚ط§ظ‡ط±ط© ظپط¥ط³ط·ظ†ط¨ظˆظ„طŒ ظˆط£طµط¨ط­ طھط­ط¶ظٹط±ظ‡ط§ ظپظ†ط§ظ‹ ظ„ظ‡ ط·ظ‚ظˆط³ظ‡ ط§ظ„ط®ط§طµط©.',en:'In Yemeni homes, they boiled coffee beans with water, adding sugar, cardamom, and ginger â€” thus was born the brewing method we know today as "Turkish Coffee." Coffee spread from Yemen to Mecca, Cairo, and Istanbul, and its preparation became an art with its own rituals.'}],
      facts:[{ar:'ط§ظ„ظٹظ…ظ† ط§ط­طھظƒط±طھ ط²ط±ط§ط¹ط© ط§ظ„ط¨ظ† 200 ط³ظ†ط©',en:'Yemen monopolized coffee cultivation for 200 years'},{ar:'ظ…ظٹظ†ط§ط، ط§ظ„ظ…ط®ط§ ط£ط·ظ„ظ‚ ط§ط³ظ…ظ‡ ط¹ظ„ظ‰ ط§ظ„ظ‚ظ‡ظˆط© (ظ…ظˆظƒط§)',en:'Port Mocha gave its name to Mocha coffee'},{ar:'ط£ظˆظ„ طھظˆط«ظٹظ‚ ظ„ط´ط±ط¨ ط§ظ„ظ‚ظ‡ظˆط© ظƒط§ظ† ظپظٹ ط§ظ„ظٹظ…ظ†',en:'First documented coffee drinking was in Yemen'}]},
    {yr:'1511',enYr:'1511',ic:'ًں•Œ',img:'j2',
      title:{ar:'ظ…ظƒط© â€” ط£ظˆظ„ ظ…ظ‚ط§ظ‡ظٹ ط§ظ„ط¹ط§ظ„ظ…',en:'Mecca â€” The World\'s First Coffeehouses'},
      story:[{ar:'ظپظٹ ظ…ظƒط© ط§ظ„ظ…ظƒط±ظ…ط©طŒ ط¨ط¯ط£طھ ط§ظ„ظ‚ظ‡ظˆط© ط±ط­ظ„طھظ‡ط§ ظƒط¸ط§ظ‡ط±ط© ط§ط¬طھظ…ط§ط¹ظٹط©. ط§ظپطھطھط­ ط£ظˆظ„ ظ…ظ‚ظ‡ظ‰ ظپظٹ ط§ظ„ط¹ط§ظ„ظ… ظپظٹ ظ…ظƒط© ط­ظˆط§ظ„ظٹ ط¹ط§ظ… 1511طŒ ظˆط³ط±ط¹ط§ظ† ظ…ط§ ط§ظ†طھط´ط±طھ ط§ظ„ظ…ظ‚ط§ظ‡ظٹ ظپظٹ ظƒظ„ ط­ظٹ. ظ„ظ… طھظƒظ† ظ…ط¬ط±ط¯ ط£ظ…ط§ظƒظ† ظ„ط´ط±ط¨ ط§ظ„ظ‚ظ‡ظˆط© â€” ط¨ظ„ ط£طµط¨ط­طھ ظ…ظ†طھط¯ظٹط§طھ ظ„ظ„ظ†ظ‚ط§ط´طŒ ظٹظ„طھظ‚ظٹ ظپظٹظ‡ط§ ط§ظ„طھط¬ط§ط± ظˆط§ظ„ط´ط¹ط±ط§ط، ظˆط§ظ„ط¹ظ„ظ…ط§ط،.',en:'In Mecca, coffee began its journey as a social phenomenon. The world\'s first coffeehouse opened in Mecca around 1511, and coffeehouses soon spread to every neighborhood. They weren\'t just places to drink coffee â€” they became forums for discussion where merchants, poets, and scholars gathered.'},
       {ar:'ط£ط«ط§ط±طھ ط§ظ„ظ…ظ‚ط§ظ‡ظٹ ط¬ط¯ظ„ط§ظ‹ ظƒط¨ظٹط±ط§ظ‹. ط¨ط¹ط¶ ط±ط¬ط§ظ„ ط§ظ„ط¯ظٹظ† ط±ط£ظˆط§ ظپظٹظ‡ط§ ط®ط·ط±ط§ظ‹ ظ„ط£ظ†ظ‡ط§ طھط¬ظ…ط¹ ط§ظ„ظ†ط§ط³ ظ„ظ„ظ†ظ‚ط§ط´طŒ ظˆط­ط§ظˆظ„ظˆط§ ظ…ظ†ط¹ ط§ظ„ظ‚ظ‡ظˆط©. ظ„ظƒظ† ط§ظ„ط·ط¹ظ… ط§ظ„ط±ط§ط¦ط¹ ظˆط§ظ„طھط£ط«ظٹط± ط§ظ„ظ…ظ†ط¹ط´ ط¬ط¹ظ„ط§ ط§ظ„ظ‚ظ‡ظˆط© ظ„ط§ طھظڈظ‚ط§ظˆظ…. ط§ظ†طھطµط± ط¹ط´ط§ظ‚ ط§ظ„ظ‚ظ‡ظˆط©طŒ ظˆط¨ط¯ط£طھ ط§ظ„ظ…ظ‚ط§ظ‡ظٹ طھظ†طھط´ط± ظپظٹ ظƒظ„ ط§طھط¬ط§ظ‡ â€” ط¥ظ„ظ‰ ط§ظ„ظ‚ط§ظ‡ط±ط© ظˆط§ظ„ط´ط§ظ… ط«ظ… ط¥ط³ط·ظ†ط¨ظˆظ„.',en:'Coffeehouses sparked great controversy. Some religious scholars saw them as dangerous gathering places for debate and tried to ban coffee. But the delicious taste and refreshing effect made coffee irresistible. Coffee lovers prevailed, and coffeehouses spread in every direction â€” to Cairo, Damascus, then Istanbul.'}],
      facts:[{ar:'ط£ظˆظ„ ظ…ظ‚ظ‡ظ‰ ظپظٹ ط§ظ„طھط§ط±ظٹط® ظƒط§ظ† ظپظٹ ظ…ظƒط©',en:'The first coffeehouse in history was in Mecca'},{ar:'ط£ظڈط·ظ„ظ‚ ط¹ظ„ظٹظ‡ط§ "ظ‚ظ‡ط§ظˆظٹ" â€” ط¬ظ…ط¹ ظ‚ظ‡ظˆط©',en:'Called "Qahawi" â€” plural of Qahwa (coffee)'},{ar:'ط­ط§ظˆظ„ ط§ظ„ط¨ط¹ط¶ ظ…ظ†ط¹ ط§ظ„ظ‚ظ‡ظˆط© ظ„ظƒظ†ظ‡ط§ ط§ظ†طھطµط±طھ',en:'Some tried to ban coffee but it prevailed'}]},
    {yr:'1555',enYr:'1555',ic:'ًںڈ›ï¸ڈ',img:'j3',
      title:{ar:'ط¥ط³ط·ظ†ط¨ظˆظ„ â€” ظ…ط¯ط§ط±ط³ ط§ظ„ط­ظƒظ…ط©',en:'Istanbul â€” The Schools of Wisdom'},
      story:[{ar:'ظپظٹ ط¹ط§ظ… 1555طŒ ط§ظپطھطھط­ ط£ظˆظ„ ظ…ظ‚ظ‡ظ‰ ظپظٹ ط¥ط³ط·ظ†ط¨ظˆظ„ ط§ظ„ط¹ط«ظ…ط§ظ†ظٹط©طŒ ظپظƒط§ظ† ط­ط¯ط«ط§ظ‹ ط؛ظٹط± ظ…ط³ط¨ظˆظ‚. ط£ط·ظ„ظ‚ ط¹ظ„ظ‰ ط§ظ„ظ…ظ‚ط§ظ‡ظٹ ط§ط³ظ… "ظ…ط¯ط§ط±ط³ ط§ظ„ط­ظƒظ…ط©" â€” ظ„ط£ظ† ط±ظˆط§ط¯ظ‡ط§ ظƒط§ظ†ظˆط§ ظٹظ†ط§ظ‚ط´ظˆظ† ط§ظ„ط³ظٹط§ط³ط© ظˆط§ظ„ظپظ„ط³ظپط© ظˆط§ظ„ط£ط¯ط¨ ظˆط§ظ„ظپظ†. ط£طµط¨ط­ ط§ظ„ظ…ظ‚ظ‡ظ‰ ط§ظ„ط¹ط«ظ…ط§ظ†ظٹ ظ…ط¤ط³ط³ط© ط§ط¬طھظ…ط§ط¹ظٹط© ظˆط«ظ‚ط§ظپظٹط© ط¨ظƒظ„ ظ…ط§ طھط­ظ…ظ„ظ‡ ط§ظ„ظƒظ„ظ…ط© ظ…ظ† ظ…ط¹ظ†ظ‰.',en:'In 1555, the first coffeehouse opened in Ottoman Istanbul, an unprecedented event. Coffeehouses were called "Schools of Wisdom" â€” because their patrons discussed politics, philosophy, literature, and art. The Ottoman coffeehouse became a full-fledged social and cultural institution.'},
       {ar:'ط·ظˆط± ط§ظ„ط¹ط«ظ…ط§ظ†ظٹظˆظ† ط·ظ‚ظˆط³ط§ظ‹ ظ…ط¹ظ‚ط¯ط© ظ„طھط­ط¶ظٹط± ط§ظ„ظ‚ظ‡ظˆط©. ظƒط§ظ† "ظ‚ظ‡ظˆط¬ظٹ ط¨ط§ط´ظٹ" (ط±ط¦ظٹط³ ط§ظ„ظ‚ظ‡ظˆط¬ظٹظٹظ†) ظ…ط³ط¤ظˆظ„ط§ظ‹ ط¹ظ† ط§ظ„ظ‚ظ‡ظˆط© ظپظٹ ط§ظ„ظ‚طµط± ط§ظ„ط³ظ„ط·ط§ظ†ظٹ. ط£ط¶ط§ظپ ط§ظ„ط¹ط«ظ…ط§ظ†ظٹظˆظ† ظ„ظ…ط³ط§طھظ‡ظ… ط§ظ„ط®ط§طµط©: طھط­ظ…ظٹطµ ط§ظ„ط¨ظ† ط·ط§ط²ط¬ط§ظ‹ ظƒظ„ ظٹظˆظ…طŒ ظˆط·ط­ظ†ظ‡ ظ†ط§ط¹ظ…ط§ظ‹ ط¬ط¯ط§ظ‹طŒ ظˆطھظ‚ط¯ظٹظ…ظ‡ ظ…ط¹ ط§ظ„ظ…ط§ط، ط§ظ„ط¨ط§ط±ط¯ ظˆط§ظ„ط­ظ„ظ‚ظˆظ… â€” طھط±ط§ط« ظ„ط§ ظٹط²ط§ظ„ ط­ظٹط§ظ‹ ط­طھظ‰ ط§ظ„ظٹظˆظ….',en:'The Ottomans developed elaborate coffee preparation rituals. The "Kahveci Baإںؤ±" (Chief Coffee Maker) was responsible for coffee in the imperial palace. The Ottomans added their own touches: freshly roasting beans daily, grinding them very finely, serving with cold water and Turkish delight â€” a tradition still alive today.'}],
      facts:[{ar:'ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط¹ط«ظ…ط§ظ†ظٹط© ط³ظڈط¬ظ„طھ طھط±ط§ط«ط§ظ‹ ط¹ط§ظ„ظ…ظٹط§ظ‹',en:'Ottoman coffee is a UNESCO heritage'},{ar:'ط§ظ„ظ‚طµط± ط§ظ„ط¹ط«ظ…ط§ظ†ظٹ ظˆط¸ظپ 40 ظ‚ظ‡ظˆط¬ظٹ',en:'The Ottoman palace employed 40 coffee makers'},{ar:'ط£ظˆظ„ ظ…ط±ط© ظٹظڈط¶ط§ظپ ط§ظ„ط³ظƒط± ظ„ظ„ظ‚ظ‡ظˆط©',en:'Sugar was first added to coffee here'}]},
    {yr:'1615',enYr:'1615',ic:'ًں‡®ًں‡¹',img:'j4',
      title:{ar:'ط§ظ„ط¨ظ†ط¯ظ‚ظٹط© â€” ط§ظ„ظ‚ظ‡ظˆط© طھطµظ„ ط£ظˆط±ظˆط¨ط§',en:'Venice â€” Coffee Arrives in Europe'},
      story:[{ar:'ظ…ظ† ظ…ظˆط§ظ†ط¦ ط¥ط³ط·ظ†ط¨ظˆظ„ ظˆط§ظ„ط¥ط³ظƒظ†ط¯ط±ظٹط©طŒ ط­ظ…ظ„ ط§ظ„طھط¬ط§ط± ط§ظ„ط¨ظ†ظ‘ط¯ظ‚ظٹظˆظ† ط­ط¨ظˆط¨ ط§ظ„ط¨ظ† ط¹ط¨ط± ط§ظ„ط¨ط­ط± ط§ظ„ظ…طھظˆط³ط· ط¥ظ„ظ‰ ظ…ظٹظ†ط§ط، ط§ظ„ط¨ظ†ط¯ظ‚ظٹط©. ظƒط§ظ†طھ ط§ظ„ط¨ظ†ط¯ظ‚ظٹط© ط¨ظˆط§ط¨ط© ط£ظˆط±ظˆط¨ط§ ط§ظ„ط´ط±ظ‚ظٹط© â€” ط­ظٹط« طھظ„طھظ‚ظٹ ط«ظ‚ط§ظپط§طھ ط§ظ„ط´ط±ظ‚ ظˆط§ظ„ط؛ط±ط¨. ظˆطµظ„طھ ط£ظˆظ„ ط´ط­ظ†ط© ط¨ظ† ط±ط³ظ…ظٹط© ط¥ظ„ظ‰ ط§ظ„ط¨ظ†ط¯ظ‚ظٹط© ط¹ط§ظ… 1615.',en:'From the ports of Istanbul and Alexandria, Venetian merchants carried coffee beans across the Mediterranean to the port of Venice. Venice was Europe\'s gateway to the East â€” where Eastern and Western cultures met. The first official coffee shipment arrived in Venice in 1615.'},
       {ar:'ظپظٹ ط§ظ„ط¨ط¯ط§ظٹط©طŒ ظƒط§ظ† ط§ظ„ط£ط·ط¨ط§ط، ط§ظ„ط£ظˆط±ظˆط¨ظٹظˆظ† ظٹط´ظƒظƒظˆظ† ظپظٹ ط§ظ„ظ‚ظ‡ظˆط©. ظˆطµظپظ‡ط§ ط§ظ„ط¨ط¹ط¶ ط¨ط£ظ†ظ‡ط§ "ط´ط±ط§ط¨ ط£ط³ظˆط¯ ط®ط·ظٹط±"! ظ„ظƒظ† ط³ط±ط¹ط§ظ† ظ…ط§ ط§ظƒطھط´ظپ ط§ظ„ط£ظˆط±ظˆط¨ظٹظˆظ† ظ…طھط¹ط© ط§ظ„ظ‚ظ‡ظˆط©. ظپظٹ ط¹ط§ظ… 1645طŒ ط§ظپطھطھط­ ط£ظˆظ„ ظ…ظ‚ظ‡ظ‰ ط¥ظٹط·ط§ظ„ظٹ ظپظٹ ط§ظ„ط¨ظ†ط¯ظ‚ظٹط©طŒ ط«ظ… طھظ„طھظ‡ ظ…ظ‚ط§ظ‡ظٹ ظپظٹ ظ„ظ†ط¯ظ† ظˆط¨ط§ط±ظٹط³ ظˆط£ظ…ط³طھط±ط¯ط§ظ…. ط§ظ†ط·ظ„ظ‚طھ ط«ظˆط±ط© ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط£ظˆط±ظˆط¨ظٹط©.',en:'At first, European doctors were suspicious of coffee. Some described it as "dangerous black liquid"! But Europeans soon discovered the pleasure of coffee. In 1645, the first Italian coffeehouse opened in Venice, followed by coffeehouses in London, Paris, and Amsterdam. The European coffee revolution had begun.'}],
      facts:[{ar:'ط§ظ„ط¨ظ†ط¯ظ‚ظٹط© ظƒط§ظ†طھ ط¨ظˆط§ط¨ط© ط§ظ„ظ‚ظ‡ظˆط© ظ„ط£ظˆط±ظˆط¨ط§',en:'Venice was coffee\'s gateway to Europe'},{ar:'ط£ظˆظ„ ظ…ظ‚ظ‡ظ‰ ط¥ظٹط·ط§ظ„ظٹ ط§ظپطھطھط­ ط¹ط§ظ… 1645',en:'First Italian coffeehouse opened in 1645'},{ar:'ط§ظ„ظ‚ظ‡ظˆط© ط³ظڈظ…ظٹطھ "ط´ط±ط§ط¨ ط§ظ„ط´ظٹط·ط§ظ†" ط£ظˆظ„ط§ظ‹',en:'Coffee was first called "Satan\'s drink"'}]},
    {yr:'1683',enYr:'1683',ic:'ًں‡¦ًں‡¹',img:'j5',
      title:{ar:'ظپظٹظٹظ†ط§ â€” ط§ظ„ظ‚ظ‡ظˆط© طھطµط¨ط­ ط£ظˆط±ظˆط¨ظٹط©',en:'Vienna â€” Coffee Becomes European'},
      story:[{ar:'ط¨ط¹ط¯ ط­طµط§ط± ظپظٹظٹظ†ط§ ط§ظ„ط¹ط¸ظٹظ… ط¹ط§ظ… 1683طŒ طھط±ظƒ ط§ظ„ط¬ظٹط´ ط§ظ„ط¹ط«ظ…ط§ظ†ظٹ ظˆط±ط§ط،ظ‡ ط£ظƒظٹط§ط³ط§ظ‹ ط¶ط®ظ…ط© ظ…ظ† ط§ظ„ط¨ظ† ط§ظ„ط£ط®ط¶ط±. ظ„ظ… ظٹط¹ط±ظپ ط§ظ„ط£ظˆط±ظˆط¨ظٹظˆظ† ظ…ط§ط°ط§ ظٹظپط¹ظ„ظˆظ† ط¨ظ‡ط§ â€” ط­طھظ‰ ط¬ط§ط، ط¬ظٹط±ط¬ظٹ ظƒظˆظ„ط´ظٹطھط³ظƒظٹطŒ ظˆظ‡ظˆ ط¨ظˆظ„ظ†ط¯ظٹ ط¹ط§ط´ ظپظٹ ط¥ط³ط·ظ†ط¨ظˆظ„ ظˆط¹ط±ظپ ظ‚ظٹظ…ط© ط§ظ„ظ‚ظ‡ظˆط©. ط§ط³طھظ„ظ… ط§ظ„ط£ظƒظٹط§ط³ ظˆط§ظپطھطھط­ ط£ظˆظ„ ظ…ظ‚ظ‡ظ‰ ظپظٹظٹظ†ظٹ.',en:'After the Great Siege of Vienna in 1683, the Ottoman army left behind huge sacks of green coffee beans. Europeans didn\'t know what to do with them â€” until Jerzy Kulczycki, a Pole who had lived in Istanbul and knew coffee\'s value, claimed the sacks and opened the first Viennese coffeehouse.'},
       {ar:'ظ‡ظ†ط§ ط­ط¯ط« ط§ظ„ط§ط¨طھظƒط§ط± ط§ظ„ظƒط¨ظٹط±: ط£ط¶ط§ظپ ظƒظˆظ„ط´ظٹطھط³ظƒظٹ ط§ظ„ط­ظ„ظٹط¨ ظˆط§ظ„ط³ظƒط± ط¥ظ„ظ‰ ط§ظ„ظ‚ظ‡ظˆط© â€” ظ„ط£ظ† ط§ظ„ط£ط°ظˆط§ظ‚ ط§ظ„ط£ظˆط±ظˆط¨ظٹط© ظƒط§ظ†طھ طھظپط¶ظ„ ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط£ط®ظپ. ظˆظڈظ„ط¯طھ "ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظپظٹظٹظ†ظٹط©" ط§ظ„ط´ظ‡ظٹط±ط©طŒ ظˆط£طµط¨ط­طھ ط§ظ„ظ…ظ‚ط§ظ‡ظٹ ط§ظ„ظپظٹظٹظ†ظٹط© ط¬ط²ط،ط§ظ‹ ظ…ظ† ط§ظ„طھط±ط§ط« ط§ظ„ط«ظ‚ط§ظپظٹ ط§ظ„ط£ظˆط±ظˆط¨ظٹ â€” ظ…ظ„طھظ‚ظ‰ ظ„ظ„ظ…ظپظƒط±ظٹظ† ظˆط§ظ„ظپظ†ط§ظ†ظٹظ†.',en:'Here came the great innovation: Kulczycki added milk and sugar to coffee â€” because European palates preferred milder coffee. The famous "Viennese Coffee" was born, and Viennese coffeehouses became part of European cultural heritage â€” meeting places for thinkers and artists.'}],
      facts:[{ar:'ظƒظˆظ„ط´ظٹطھط³ظƒظٹ ط·ظ„ط¨ ط£ظƒظٹط§ط³ ط§ظ„ط¨ظ† ظƒظ…ظƒط§ظپط£ط©',en:'Kulczycki asked for coffee sacks as his reward'},{ar:'ظپظٹظ†ظٹط§ ط£ط¶ط§ظپطھ ط§ظ„ط­ظ„ظٹط¨ ظˆط§ظ„ط³ظƒط± ظ„ظ„ظ‚ظ‡ظˆط©',en:'Vienna added milk and sugar to coffee'},{ar:'ط§ظ„ظ…ظ‚ط§ظ‡ظٹ ط§ظ„ظپظٹظٹظ†ظٹط© طھط±ط§ط« ط¹ط§ظ„ظ…ظٹ',en:'Viennese coffeehouses are world heritage'}]},
    {yr:'1727',enYr:'1727',ic:'ًں‡§ًں‡·',img:'j6',
      title:{ar:'ط§ظ„ط¨ط±ط§ط²ظٹظ„ â€” ط§ظ„ظ‚ظ‡ظˆط© طھط¹ط¨ط± ط§ظ„ظ…ط­ظٹط·',en:'Brazil â€” Coffee Crosses the Ocean'},
      story:[{ar:'ظپظٹ ظ‚طµط© ط£ط´ط¨ظ‡ ط¨ط£ظپظ„ط§ظ… ط§ظ„طھط¬ط³ط³طŒ ظ†ظڈظ‚ظ„طھ ط´طھظ„ط§طھ ط§ظ„ط¨ظ† ط³ط±ط§ظ‹ ظ…ظ† ط؛ظˆظٹط§ظ†ط§ ط§ظ„ظپط±ظ†ط³ظٹط© ط¥ظ„ظ‰ ط§ظ„ط¨ط±ط§ط²ظٹظ„. ط£ط±ط³ظ„طھ ط§ظ„ط²ظˆط¬ط© ط§ظ„ط¬ظ…ظٹظ„ط© ظ„ط­ط§ظƒظ… ط؛ظˆظٹط§ظ†ط§ ط¨ط§ظ‚ط© ظˆط¯ط§ط¹ ظپظٹظ‡ط§ ط´طھظ„ط§طھ ط¨ظ† ظ…ط®ط¨ط£ط© ط¥ظ„ظ‰ ط§ظ„ط¹ظ‚ظٹط¯ ط§ظ„ط¨ط±ط§ط²ظٹظ„ظٹ ط¨ط§ظ„ظٹطھط§ â€” ط§ظ„ط°ظٹ ط£ط؛ظˆط§ظ‡ط§. ظƒط§ظ†طھ ظ‡ط°ظ‡ ط§ظ„ط´طھظ„ط§طھ ط§ظ„ظ‚ظ„ظٹظ„ط© ط¨ط¯ط§ظٹط© ط¥ظ…ط¨ط±ط§ط·ظˆط±ظٹط© ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط¨ط±ط§ط²ظٹظ„ظٹط©.',en:'In a story worthy of spy films, coffee seedlings were smuggled from French Guiana to Brazil. The beautiful wife of French Guiana\'s governor hid coffee seedlings in a farewell bouquet to Brazilian Colonel Palheta â€” who had seduced her. Those few seedlings were the beginning of Brazil\'s coffee empire.'},
       {ar:'ظ…ظ† طھظ„ظƒ ط§ظ„ط´طھظ„ط§طھ ط§ظ„ظ‚ظ„ظٹظ„ط©طŒ ط£طµط¨ط­طھ ط§ظ„ط¨ط±ط§ط²ظٹظ„ ط£ظƒط¨ط± ظ…ظ†طھط¬ ظ„ظ„ظ‚ظ‡ظˆط© ظپظٹ ط§ظ„ط¹ط§ظ„ظ… â€” ظˆظ„ط§ طھط²ط§ظ„ طھظ†طھط¬ ط£ظƒط«ط± ظ…ظ† ط«ظ„ط« ظ‚ظ‡ظˆط© ط§ظ„ط¹ط§ظ„ظ…. ظ…ط²ط§ط±ط¹ ط§ظ„ط¨ظ† ط§ظ„ط¨ط±ط§ط²ظٹظ„ظٹط© ط§ظ„ط´ط§ط³ط¹ط© ط؛ظٹط±طھ ط§ظ‚طھطµط§ط¯ ط§ظ„ط¨ظ„ط§ط¯ ظˆط¬ط¹ظ„طھ ط§ظ„ظ‚ظ‡ظˆط© ظ…ط´ط±ظˆط¨ط§ظ‹ ط¹ط§ظ„ظ…ظٹط§ظ‹ ظ…طھط§ط­ط§ظ‹ ظ„ظ„ط¬ظ…ظٹط¹.',en:'From those few seedlings, Brazil became the world\'s largest coffee producer â€” still growing over one third of the world\'s coffee. Brazil\'s vast coffee plantations transformed the country\'s economy and made coffee an affordable global beverage.'}],
      facts:[{ar:'ط§ظ„ط¨ط±ط§ط²ظٹظ„ طھظ†طھط¬ â…“ ظ‚ظ‡ظˆط© ط§ظ„ط¹ط§ظ„ظ…',en:'Brazil produces â…“ of the world\'s coffee'},{ar:'ظ‚طµط© طھظ‡ط±ظٹط¨ ط§ظ„ط¨ظ† ظ„ظ„ط¨ط±ط§ط²ظٹظ„ ط£ط´ط¨ظ‡ ط¨ط§ظ„ظپظٹظ„ظ…',en:'Coffee\'s smuggling to Brazil is like a movie'},{ar:'ط£ظƒط«ط± ظ…ظ† 300 ط£ظ„ظپ ظ…ط²ط±ط¹ط© ط¨ظ† ظپظٹ ط§ظ„ط¨ط±ط§ط²ظٹظ„',en:'Over 300,000 coffee farms in Brazil'}]},
    {yr:'1901',enYr:'1901',ic:'âڑ™ï¸ڈ',img:'j7',
      title:{ar:'ظ„ظˆظٹط¬ظٹ ط¨ط²ظٹط±ط§ â€” ط£ظˆظ„ ظ…ط§ظƒظٹظ†ط© ط¥ط³ط¨ط±ظٹط³ظˆ',en:'Bezzera â€” The First Espresso Machine'},
      story:[{ar:'ظپظٹ ظ…ظٹظ„ط§ظ†ظˆطŒ ط¥ظٹط·ط§ظ„ظٹط§طŒ ط­طµظ„ ظ„ظˆظٹط¬ظٹ ط¨ط²ظٹط±ط§ ط¹ظ„ظ‰ ط¨ط±ط§ط،ط© ط§ط®طھط±ط§ط¹ ط؛ظٹط±طھ ط¹ط§ظ„ظ… ط§ظ„ظ‚ظ‡ظˆط© ط¥ظ„ظ‰ ط§ظ„ط£ط¨ط¯: ط£ظˆظ„ ظ…ط§ظƒظٹظ†ط© ظ‚ظ‡ظˆط© طھط¹ظ…ظ„ ط¨ط¶ط؛ط· ط§ظ„ط¨ط®ط§ط±. ط§ظ„ظپظƒط±ط© ظƒط§ظ†طھ ط«ظˆط±ظٹط© â€” ط§ط³طھط®ط¯ط§ظ… ط§ظ„ط¶ط؛ط· ظ„ط¯ظپط¹ ط§ظ„ظ…ط§ط، ط§ظ„ط³ط§ط®ظ† ط¹ط¨ط± ط§ظ„ط¨ظ† ط§ظ„ظ…ط·ط­ظˆظ† ط¨ط³ط±ط¹ط©طŒ ظ„ط¥ط¹ط¯ط§ط¯ ظپظ†ط¬ط§ظ† ظ‚ظˆظٹ ظˆظ…ط±ظƒط² ظپظٹ ط«ظˆط§ظ†ظچ.',en:'In Milan, Italy, Luigi Bezzera patented an invention that changed the coffee world forever: the first steam-pressure coffee machine. The idea was revolutionary â€” using pressure to force hot water through ground coffee quickly, producing a strong, concentrated cup in seconds.'},
       {ar:'ط³ظڈظ…ظٹطھ "ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ" ظ„ط£ظ†ظ‡ط§ طھظڈط­ط¶ظژط± "expressly" (ط®طµظٹطµط§ظ‹) ظ„ظƒظ„ ط²ط¨ظˆظ†. ظ„ظƒظ† ظ…ط´ظƒظ„ط© ظ…ط§ظƒظٹظ†ط© ط¨ط²ظٹط±ط§ ظƒط§ظ†طھ ط£ظ† ط§ظ„ط¶ط؛ط· ط§ظ„ط¹ط§ظ„ظٹ ظٹط¬ط¹ظ„ ط·ط¹ظ… ط§ظ„ظ‚ظ‡ظˆط© ظ…ط±ط§ظ‹. ط§ط³طھظ…ط± ط§ظ„ظ…ط·ظˆط±ظˆظ† ظپظٹ طھط­ط³ظٹظ† ط§ظ„طھطµظ…ظٹظ… â€” ظˆظƒط§ظ†طھ ط§ظ„ط®ط·ظˆط© ط§ظ„ظƒط¨ط±ظ‰ ط§ظ„طھط§ظ„ظٹط© ط¨ط§ظ†طھط¸ط§ط± ط¬ط§ط¬ظٹط§.',en:'It was called "espresso" because it was made "expressly" for each customer. But Bezzera\'s machine had a problem: the high pressure made coffee taste bitter. Developers continued refining the design â€” and the next big step was waiting for Gaggia.'}],
      facts:[{ar:'ظƒظ„ظ…ط© ط¥ط³ط¨ط±ظٹط³ظˆ طھط¹ظ†ظٹ "ظ…ط®طµطµ" ط¨ط§ظ„ط¥ظٹط·ط§ظ„ظٹط©',en:'Espresso means "expressly" in Italian'},{ar:'ط¨ط²ظٹط±ط§ ط§ط®طھط±ط¹ ط£ظˆظ„ ظ…ط§ظƒظٹظ†ط© ط¹ط§ظ… 1901',en:'Bezzera invented the first machine in 1901'},{ar:'ط§ظ„ط¶ط؛ط· ط§ظ„ط²ط§ط¦ط¯ ظƒط§ظ† ظٹط³ط¨ط¨ ظ…ط±ط§ط±ط©',en:'Excess pressure caused bitterness'}]},
    {yr:'1946',enYr:'1946',ic:'âک•',img:'j8',
      title:{ar:'ط£ظƒظٹظ„ظٹ ط¬ط§ط¬ظٹط§ â€” ظˆظ„ط§ط¯ط© ط§ظ„ظƒط±ظٹظ…ط§',en:'Gaggia â€” The Birth of Crema'},
      story:[{ar:'ظپظٹ ط¹ط§ظ… 1946طŒ ط£ط­ط¯ط« ط£ظƒظٹظ„ظٹ ط¬ط§ط¬ظٹط§ ط«ظˆط±ط© ط­ظ‚ظٹظ‚ظٹط©. ط§ط®طھط±ط¹ ظ†ط¸ط§ظ… ط§ظ„ط±ط§ظپط¹ط© ط§ظ„ظ…ظٹظƒط§ظ†ظٹظƒظٹط© ط§ظ„ط°ظٹ ظٹظˆظ„ط¯ ط¶ط؛ط·ط§ظ‹ ظ…ط«ط§ظ„ظٹط§ظ‹ â€” 9 ط¨ط§ط± â€” ظ„ط§ ط²ط§ط¦ط¯ط§ظ‹ ظˆظ„ط§ ظ†ط§ظ‚طµط§ظ‹. ظ„ط£ظˆظ„ ظ…ط±ط© ظپظٹ ط§ظ„طھط§ط±ظٹط®طŒ ط£ظڈظ†طھط¬طھ ظƒط±ظٹظ…ط§ ط°ظ‡ط¨ظٹط© ط¬ظ…ظٹظ„ط© طھط؛ط·ظٹ ظˆط¬ظ‡ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ. ظƒط§ظ†طھ طھظ„ظƒ ط§ظ„ظƒط±ظٹظ…ط§ ط¹ظ„ط§ظ…ط© ط§ظ„ط¬ظˆط¯ط© ط§ظ„طھظٹ طھظ…ظٹط² ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ط§ظ„ط¥ظٹط·ط§ظ„ظٹ.',en:'In 1946, Achille Gaggia created a true revolution. He invented the mechanical lever system that generated the perfect pressure â€” 9 bars â€” not too much, not too little. For the first time in history, a beautiful golden crema crowned the espresso. This crema became the quality hallmark of Italian espresso.'},
       {ar:'ظ‚ط¨ظ„ ط¬ط§ط¬ظٹط§طŒ ظƒط§ظ† ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ظ…ط¬ط±ط¯ ط³ط§ط¦ظ„ ط¨ظ†ظٹ ط¨ط¯ظˆظ† ط§ظ„ظƒط±ظٹظ…ط§ ط§ظ„ظ…ظ…ظٹط²ط©. ط§ط®طھط±ط§ط¹ظ‡ ظ‚ظ„ط¨ ظ…ظˆط§ط²ظٹظ† طµظ†ط§ط¹ط© ط§ظ„ظ‚ظ‡ظˆط© â€” ظˆط£طµط¨ط­طھ ظ…ط§ظƒظٹظ†ط© ط§ظ„ط±ط§ظپط¹ط© ط£ظٹظ‚ظˆظ†ط© ظپظٹ ظ…ظ‚ط§ظ‡ظٹ ط¥ظٹط·ط§ظ„ظٹط§ ظˆط§ظ„ط¹ط§ظ„ظ…. ط§ظ„ظٹظˆظ…طŒ ط§ظ„ظƒط±ظٹظ…ط§ ظ‡ظٹ ط£ظˆظ„ ظ…ط§ ظٹط¨ط­ط« ط¹ظ†ظ‡ ط¹ط´ط§ظ‚ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ.',en:'Before Gaggia, espresso was just brown liquid without the distinctive crema. His invention turned the coffee industry upside down â€” and the lever machine became an icon in Italian cafes worldwide. Today, crema is the first thing espresso lovers look for.'}],
      facts:[{ar:'9 ط¨ط§ط± ظ‡ظˆ ط§ظ„ط¶ط؛ط· ط§ظ„ظ…ط«ط§ظ„ظٹ ظ„ظ„ط¥ط³ط¨ط±ظٹط³ظˆ',en:'9 bar is the perfect espresso pressure'},{ar:'ط¬ط§ط¬ظٹط§ ط£ظ†طھط¬ ط£ظˆظ„ ظƒط±ظٹظ…ط§ ظپظٹ ط§ظ„طھط§ط±ظٹط®',en:'Gaggia produced history\'s first crema'},{ar:'ظ…ط§ظƒظٹظ†ط© ط§ظ„ط±ط§ظپط¹ط© ط£ظٹظ‚ظˆظ†ط© ط¥ظٹط·ط§ظ„ظٹط©',en:'The lever machine is an Italian icon'}]},
    {yr:'ط§ظ„ظ…ظˆط¬ط© ط§ظ„ط«ط§ظ„ط«ط©',enYr:'Third Wave',ic:'ًںŒٹ',img:'j9',
      title:{ar:'ط§ظ„ظ…ظˆط¬ط© ط§ظ„ط«ط§ظ„ط«ط© â€” ط§ظ„ظ‚ظ‡ظˆط© ظƒظپظ† ظˆط¹ظ„ظ…',en:'Third Wave â€” Coffee as Art & Science'},
      story:[{ar:'ظپظٹ ط§ظ„طھط³ط¹ظٹظ†ط§طھطŒ ط¨ط¯ط£طھ ظ…ظˆط¬ط© ط¬ط¯ظٹط¯ط© ظپظٹ ط¹ط§ظ„ظ… ط§ظ„ظ‚ظ‡ظˆط©. ظ„ظ… طھط¹ط¯ ط§ظ„ظ‚ظ‡ظˆط© ظ…ط¬ط±ط¯ ط³ظ„ط¹ط© â€” ط£طµط¨ط­طھ ظ…ظ†طھط¬ط§ظ‹ ط­ط±ظپظٹط§ظ‹ ظٹظڈظ‚ط¯ظژظ‘ط± ظ…ط«ظ„ ط§ظ„ظ†ط¨ظٹط°. ط¨ط¯ط£ ط§ظ„ظ…ط­ظ…طµظˆظ† ظپظٹ طھطھط¨ط¹ ظ…طµط¯ط± ط§ظ„ط¨ظ† ظ…ظ† ظ…ط²ط±ط¹ط© ظˆط§ط­ط¯ط©طŒ ظˆظ…ط¹ط§ظ…ظ„ط© ظƒظ„ ط­ط¨ط© ط¨ظ† ط¨ط§ط­طھط±ط§ظ… ظٹط³طھط­ظ‚ظ‡.',en:'In the 1990s, a new wave began in the coffee world. Coffee was no longer just a commodity â€” it became an artisan product appreciated like wine. Roasters began tracing beans from a single farm, treating each coffee cherry with the respect it deserves.'},
       {ar:'ط¯ط®ظ„طھ ط£ط¬ظ‡ط²ط© ظ‚ظٹط§ط³ TDS ظˆظ…ظ†ط­ظ†ظٹط§طھ ط§ظ„ط§ط³طھط®ظ„ط§طµ ظˆط§ظ„ظ…ظ‚ط§ظٹظٹط³ ط§ظ„ط±ظ‚ظ…ظٹط© ط¥ظ„ظ‰ ط¹ط§ظ„ظ… ط§ظ„ظ‚ظ‡ظˆط©. ط§ظ„ط¨ط§ط±ظٹط³طھط§ ط£طµط¨ط­ ط¹ط§ظ„ظ…ط§ظ‹ ظٹطھط°ظˆظ‚ ظˆظٹط­ظ„ظ„ ظˆظٹط¨طھظƒط±. ط¸ظ‡ط±طھ ط·ط±ظ‚ طھط­ط¶ظٹط± ط¬ط¯ظٹط¯ط©: V60طŒ AeroPressطŒ ChemexطŒ Cold Brew. ظˆط§ظ„ظٹظˆظ…طŒ ط£ظƒط§ط¯ظٹظ…ظٹط© ط§ظ„ط£ظٹط§ط¯ظٹ ط§ظ„ط¨ظٹط¶ط§ط، طھظˆط§طµظ„ ظ‡ط°ظ‡ ط§ظ„ط±ط­ظ„ط©.',en:'TDS meters, extraction curves, and digital scales entered the coffee world. The barista became a scientist who tastes, analyzes, and creates. New brewing methods emerged: V60, AeroPress, Chemex, Cold Brew. And today, White Hands Academy continues this journey.'}],
      facts:[{ar:'ط§ظ„ظ…ظˆط¬ط© ط§ظ„ط«ط§ظ„ط«ط© ط¨ط¯ط£طھ ظپظٹ ط§ظ„طھط³ط¹ظٹظ†ط§طھ',en:'Third Wave began in the 1990s'},{ar:'ط§ظ„ظ‚ظ‡ظˆط© ط£طµط¨ط­طھ ظ…ط«ظ„ ط§ظ„ظ†ط¨ظٹط° ظپظٹ ط§ظ„طھظ‚ظٹظٹظ…',en:'Coffee is now evaluated like wine'},{ar:'ط·ط±ظ‚ طھط­ط¶ظٹط± ط¬ط¯ظٹط¯ط© ط؛ظٹط±طھ ظƒظ„ ط´ظٹط،',en:'New brewing methods changed everything'}]},
    {yr:'2024',enYr:'2024',ic:'ًں¤²',img:'j10',
      title:{ar:'ط£ظƒط§ط¯ظٹظ…ظٹط© ط§ظ„ط£ظٹط§ط¯ظٹ ط§ظ„ط¨ظٹط¶ط§ط،',en:'White Hands Academy'},
      story:[{ar:'ظپظٹ ط¹ط§ظ… 2024طŒ ط§ظ†ط·ظ„ظ‚طھ ط£ظƒط§ط¯ظٹظ…ظٹط© ط§ظ„ط£ظٹط§ط¯ظٹ ط§ظ„ط¨ظٹط¶ط§ط، â€” ط£ظˆظ„ ظ…ظ†طµط© طھط¹ظ„ظٹظ…ظٹط© ط¹ط±ط¨ظٹط© ظ…طھظƒط§ظ…ظ„ط© ظ„طھط¯ط±ظٹط¨ ط§ظ„ط¨ط§ط±ظٹط³طھط§. ظ…ظ† ط§ظ„ط¨ط°ط±ط© ط¥ظ„ظ‰ ط§ظ„ظپظ†ط¬ط§ظ†طŒ ظ†ط£ط®ط°ظƒ ظپظٹ ط±ط­ظ„ط© طھط¹ظ„ظ… ط´ط§ظ…ظ„ط©: 3 ظ…ط³طھظˆظٹط§طھطŒ 9 ظˆط­ط¯ط§طھطŒ ط¹ط´ط±ط§طھ ط§ظ„ط¯ط±ظˆط³ ط§ظ„طھظپط§ط¹ظ„ظٹط©طŒ ظˆط§ط®طھط¨ط§ط±ط§طھ طھظ‚ظٹط³ ظ…ط³طھظˆط§ظƒ.',en:'In 2024, White Hands Academy launched â€” the first integrated Arabic barista training platform. From seed to cup, we take you on a comprehensive learning journey: 3 levels, 9 modules, dozens of interactive lessons, and exams that measure your progress.'},
       {ar:'ط±ط³ط§ظ„طھظ†ط§: ظ†ط´ط± ط«ظ‚ط§ظپط© ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ط®طھطµط© ط¨ط§ظ„ظ„ط؛ط© ط§ظ„ط¹ط±ط¨ظٹط©طŒ ط¨ظ…ط­طھظˆظ‰ طھط¹ظ„ظٹظ…ظٹ ط§ط­طھط±ط§ظپظٹ ظ…ط¹طھظ…ط¯ ط¹ظ„ظ‰ ظ…ظ†ظ‡ط¬ SCA ط§ظ„ط¹ط§ظ„ظ…ظٹ. ظ†ط­ظ† ظ†ط¤ظ…ظ† ط£ظ† ط§ظ„ظ‚ظ‡ظˆط© ظ„ظٹط³طھ ظ…ط¬ط±ط¯ ظ…ط´ط±ظˆط¨ â€” ط¥ظ†ظ‡ط§ ط¹ظ„ظ… ظˆظپظ† ظˆط«ظ‚ط§ظپط© طھط³طھط­ظ‚ ط£ظ† طھظڈط¯ط±ظژظ‘ط³ ط¨ط£ط¹ظ„ظ‰ ظ…ط¹ط§ظٹظٹط± ط§ظ„ط¬ظˆط¯ط©.',en:'Our mission: spreading specialty coffee culture in Arabic, with professional educational content aligned with global SCA standards. We believe coffee is not just a drink â€” it is a science, an art, and a culture that deserves to be taught at the highest quality standards.'}],
      facts:[{ar:'3 ظ…ط³طھظˆظٹط§طھ â€” A â€¢ B â€¢ C',en:'3 Levels â€” A â€¢ B â€¢ C'},{ar:'ظ…ظ†ظ‡ط¬ ظ…طھظˆط§ظپظ‚ ظ…ط¹ SCA',en:'SCA-aligned curriculum'},{ar:'ط´ظ‡ط§ط¯ط§طھ ط¥طھظ…ط§ظ… ظ…ط¹طھظ…ط¯ط©',en:'Official completion certificates'}]}
  ];
  let h = '<div class="hero"><div class="hero-glow"></div><h2>' + __({ar:'âک• ط±ط­ظ„ط© ط§ظ„ظ‚ظ‡ظˆط©',en:'âک• Coffee Journey'}) + '</h2><div class="gold-divider"></div><p>' + __({ar:'ط§ط±طھط­ظ„ ظ…ط¹ظ†ط§ ط¹ط¨ط± 1200 ط¹ط§ظ… ظ…ظ† طھط§ط±ظٹط® ط§ظ„ظ‚ظ‡ظˆط© â€” ظ…ظ† ط؛ط§ط¨ط§طھ ط¥ط«ظٹظˆط¨ظٹط§ ط¥ظ„ظ‰ ظپظ†ط§ط¬ظٹظ†ظƒظ…',en:'Travel with us through 1,200 years of coffee history â€” from Ethiopian forests to your cup'}) + '</p></div>';
  h += '<div class="jrny"><div class="jrny-track"></div>';
  ms.forEach((m, i) => {
    h += '<div class="jrny-stop"><div class="jrny-marker">' + (i+1) + '</div>';
    h += '<div class="jrny-card"><div class="jrny-img"><img src="' + photoSmall(m.img) + '" alt="" loading="lazy"><div class="jrny-img-ov"></div><div class="jrny-badge">' + (lang==='ar'?m.yr:m.enYr) + '</div><div class="jrny-ic">' + m.ic + '</div></div>';
    h += '<div class="jrny-body"><h3>' + __(m.title) + '</h3>';
    __(m.story).forEach(p => { h += '<p>' + p + '</p>'; });
    h += '<div class="jrny-facts"><div class="jrny-facts-title">' + (lang==='ar'?'ًں”چ ط­ظ‚ط§ط¦ظ‚ ط³ط±ظٹط¹ط©':'ًں”چ Quick Facts') + '</div>';
    __(m.facts).forEach(f => { h += '<div class="jrny-fact"><span>âœ¦</span> ' + f + '</div>'; });
    h += '</div></div></div></div>';
  });
  h += '</div>';
  // === PRODUCING & CONSUMING COUNTRIES ===
  h += '<div class="hero" style="margin-top:30px"><div class="hero-glow"></div><h2>' + __({ar:'ًںŒچ ط§ظ„ط¯ظˆظ„ ط§ظ„ظ…ظ†طھط¬ط© ظ„ظ„ط¨ظ†',en:'ًںŒچ Coffee Producing Countries'}) + '</h2><div class="gold-divider"></div><p>' + __({ar:'ط§ظ„ظ‚ظ‡ظˆط© طھظ†ظ…ظˆ ظپظٹ ط£ظƒط«ط± ظ…ظ† 70 ط¯ظˆظ„ط© ط­ظˆظ„ ط§ظ„ط¹ط§ظ„ظ… â€” ظ„ظƒظ† 10 ط¯ظˆظ„ طھظ†طھط¬ 90% ظ…ظ† ط§ظ„ط¥ظ†طھط§ط¬ ط§ظ„ط¹ط§ظ„ظ…ظٹ',en:'Coffee grows in over 70 countries worldwide â€” but 10 countries produce 90% of global output'}) + '</p></div>';
  h += '<div class="img-c"><img src="' + photo('map') + '" alt="" loading="lazy" style="width:100%;border-radius:var(--radius-lg)"><div class="cap">' + __({ar:'ًں—؛ï¸ڈ ط­ط²ط§ظ… ط§ظ„ط¨ظ† ط§ظ„ط¹ط§ظ„ظ…ظٹ â€” Bean Belt',en:'ًں—؛ï¸ڈ The Coffee Bean Belt'}) + '</div></div>';
  h += '<h3>' + __({ar:'âک• ط£ظ‡ظ… 10 ط¯ظˆظ„ ظ…ظ†طھط¬ط© ظ„ظ„ط¨ظ†',en:'âک• Top 10 Producing Countries'}) + '</h3>';
  h += '<div style="display:flex;flex-direction:column;gap:8px;margin:12px 0">';
  let prod = [
    {ar:'ط§ظ„ط¨ط±ط§ط²ظٹظ„',en:'Brazil',fl:'ًں‡§ًں‡·',q:'3.7B',pct:37,cl:'#4caf50',t:'ط£ط±ط§ط¨ظٹظƒط§ + ط±ظˆط¨ظˆط³طھط§',te:'Arabica + Robusta'},
    {ar:'ظپظٹطھظ†ط§ظ…',en:'Vietnam',fl:'ًں‡»ًں‡³',q:'1.8B',pct:17,cl:'#ff9800',t:'ط±ظˆط¨ظˆط³طھط§',te:'Robusta'},
    {ar:'ظƒظˆظ„ظˆظ…ط¨ظٹط§',en:'Colombia',fl:'ًں‡¨ًں‡´',q:'840M',pct:8,cl:'#2196f3',t:'ط£ط±ط§ط¨ظٹظƒط§',te:'Arabica'},
    {ar:'ط¥ظ†ط¯ظˆظ†ظٹط³ظٹط§',en:'Indonesia',fl:'ًں‡®ًں‡©',q:'670M',pct:6,cl:'#9c27b0',t:'ط£ط±ط§ط¨ظٹظƒط§ + ط±ظˆط¨ظˆط³طھط§',te:'Arabica + Robusta'},
    {ar:'ط¥ط«ظٹظˆط¨ظٹط§',en:'Ethiopia',fl:'ًں‡ھًں‡¹',q:'500M',pct:5,cl:'#e91e63',t:'ط£ط±ط§ط¨ظٹظƒط§ (ط¨ط±ظ‘ظٹ)',te:'Arabica (Wild)'},
    {ar:'ظ‡ظ†ط¯ظˆط±ط§ط³',en:'Honduras',fl:'ًں‡­ًں‡³',q:'460M',pct:4,cl:'#00bcd4',t:'ط£ط±ط§ط¨ظٹظƒط§',te:'Arabica'},
    {ar:'ط§ظ„ظ‡ظ†ط¯',en:'India',fl:'ًں‡®ًں‡³',q:'350M',pct:3,cl:'#ff5722',t:'ط±ظˆط¨ظˆط³طھط§',te:'Robusta'},
    {ar:'ط£ظˆط؛ظ†ط¯ط§',en:'Uganda',fl:'ًں‡؛ًں‡¬',q:'320M',pct:3,cl:'#8bc34a',t:'ط±ظˆط¨ظˆط³طھط§',te:'Robusta'},
    {ar:'ط§ظ„ظ…ظƒط³ظٹظƒ',en:'Mexico',fl:'ًں‡²ًں‡½',q:'280M',pct:3,cl:'#f44336',t:'ط£ط±ط§ط¨ظٹظƒط§',te:'Arabica'},
    {ar:'ط؛ظˆط§طھظٹظ…ط§ظ„ط§',en:'Guatemala',fl:'ًں‡¬ًں‡¹',q:'250M',pct:2,cl:'#3f51b5',t:'ط£ط±ط§ط¨ظٹظƒط§',te:'Arabica'}
  ];
  prod.forEach((c,i) => {
    let cnt = (lang === 'ar' ? c.ar : c.en);
    let tp = (lang === 'ar' ? c.t : c.te);
    h += '<div class="budget-bar" style="margin:0"><div class="budget-lbl" style="display:flex;justify-content:space-between;margin-bottom:3px"><span>' + c.fl + ' <strong>' + cnt + '</strong></span><span style="color:var(--accent);font-size:.8rem">' + c.q + ' آ· ' + c.pct + '%</span></div><div class="budget-track" style="height:20px;background:rgba(255,255,255,.05);border-radius:10px;overflow:hidden"><div class="budget-fill" style="width:' + c.pct + '%;height:100%;background:' + c.cl + ';border-radius:10px;transition:width 1s ease"></div></div><div style="font-size:.75rem;color:var(--text-muted);margin-top:2px">' + tp + '</div></div>';
  });
  h += '</div>';
  h += '<div class="hl"><strong>' + __({ar:'ًں’، ظ…ط¹ظ„ظˆظ…ط©:',en:'ًں’، Fact:'}) + '</strong> ' + __({ar:'ط§ظ„ط¨ط±ط§ط²ظٹظ„ ظˆط­ط¯ظ‡ط§ طھظ†طھط¬ ط£ظƒط«ط± ظ…ظ† ط«ظ„ط« ظ‚ظ‡ظˆط© ط§ظ„ط¹ط§ظ„ظ…! ظپظٹطھظ†ط§ظ… طھطھطµط¯ط± ط¥ظ†طھط§ط¬ ط§ظ„ط±ظˆط¨ظˆط³طھط§. ط¥ط«ظٹظˆط¨ظٹط§ ظ‡ظٹ ظ…ظˆط·ظ† ط§ظ„ط¨ظ† ط§ظ„ط£طµظ„ظٹ.',en:'Brazil alone produces over one third of the world\'s coffee! Vietnam leads Robusta production. Ethiopia is coffee\'s birthplace.'}) + '</div>';
  // Visual comparison: Producers vs Consumers
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0">';
  h += '<div class="hl" style="text-align:center;padding:16px;background:linear-gradient(135deg,rgba(76,175,80,.1),rgba(76,175,80,.02))"><div style="font-size:2.2rem">ًںŒ±</div><div style="font-weight:700;font-size:1.1rem;color:#4caf50">' + __({ar:'ظ…ظ†طھط¬ظˆظ†',en:'Producers'}) + '</div><div style="font-size:.82rem;color:var(--text-muted)">' + __({ar:'ط­ط²ط§ظ… ط§ظ„ط¨ظ† â€” ط¯ظˆظ„ ظ†ط§ظ…ظٹط© ظ‚ط±ط¨ ط®ط· ط§ظ„ط§ط³طھظˆط§ط،',en:'Bean Belt â€” Developing nations near equator'}) + '</div></div>';
  h += '<div class="hl" style="text-align:center;padding:16px;background:linear-gradient(135deg,rgba(33,150,243,.1),rgba(33,150,243,.02))"><div style="font-size:2.2rem">ًں“¦</div><div style="font-weight:700;font-size:1.1rem;color:#2196f3">' + __({ar:'ظ…ط³طھظ‡ظ„ظƒظˆظ†',en:'Consumers'}) + '</div><div style="font-size:.82rem;color:var(--text-muted)">' + __({ar:'ط£ظ…ط±ظٹظƒط§ ط§ظ„ط´ظ…ط§ظ„ظٹط© â€” ط£ظˆط±ظˆط¨ط§ â€” ط¢ط³ظٹط§',en:'North America â€” Europe â€” Asia'}) + '</div></div>';
  h += '</div>';
  // Consuming / Importing
  h += '<h3 style="margin-top:30px">' + __({ar:'ًں“¦ ط£ظ‡ظ… ط§ظ„ط¯ظˆظ„ ط§ظ„ظ…ط³طھظˆط±ط¯ط© ظˆط§ظ„ظ…ط³طھظ‡ظ„ظƒط© ظ„ظ„ظ‚ظ‡ظˆط©',en:'ًں“¦ Top Coffee Importing & Consuming Countries'}) + '</h3>';
  h += '<div style="display:flex;flex-direction:column;gap:8px;margin:12px 0">';
  let cons = [
    {ar:'ط§ظ„ظˆظ„ط§ظٹط§طھ ط§ظ„ظ…طھط­ط¯ط©',en:'USA',fl:'ًں‡؛ًں‡¸',q:'1.7B',pc:'4.5 kg',pcp:'4.5 kg',pct:100,n:'ط£ظƒط¨ط± ظ…ط³طھظˆط±ط¯ â€” 25% ظ…ظ† ط§ظ„ط§ط³طھظ‡ظ„ط§ظƒ ط§ظ„ط¹ط§ظ„ظ…ظٹ',ne:'Largest importer â€” 25% global'},
    {ar:'ط£ظ„ظ…ط§ظ†ظٹط§',en:'Germany',fl:'ًں‡©ًں‡ھ',q:'1.1B',pc:'6.7 kg',pcp:'6.7 kg',pct:65,n:'ط«ط§ظ†ظٹ ط£ظƒط¨ط± â€” ط±ط§ط¦ط¯ط© ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط£ظˆط±ظˆط¨ظٹط©',ne:'Second largest â€” European leader'},
    {ar:'ط¥ظٹط·ط§ظ„ظٹط§',en:'Italy',fl:'ًں‡®ًں‡¹',q:'500M',pc:'5.8 kg',pcp:'5.8 kg',pct:30,n:'ظ…ظ‡ط¯ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ â€” ط«ظ‚ط§ظپط© ط¹ط±ظٹظ‚ط©',ne:'Espresso birthplace â€” rich culture'},
    {ar:'ط§ظ„ظٹط§ط¨ط§ظ†',en:'Japan',fl:'ًں‡¯ًں‡µ',q:'450M',pc:'3.5 kg',pcp:'3.5 kg',pct:26,n:'ط£ظƒط¨ط± ط³ظˆظ‚ ظ‚ظ‡ظˆط© ظپظٹ ط¢ط³ظٹط§',ne:'Largest Asian coffee market'},
    {ar:'ظپط±ظ†ط³ط§',en:'France',fl:'ًں‡«ًں‡·',q:'350M',pc:'5.4 kg',pcp:'5.4 kg',pct:20,n:'ظ…ظ‚ط§ظ‡ظٹ ط¨ط§ط±ظٹط³ ط§ظ„ط´ظ‡ظٹط±ط©',ne:'Famous Parisian cafes'},
    {ar:'ظƒظ†ط¯ط§',en:'Canada',fl:'ًں‡¨ًں‡¦',q:'250M',pc:'6.5 kg',pcp:'6.5 kg',pct:15,n:'ظ†ظ…ظˆ ط³ط±ظٹط¹ ظپظٹ ط³ظˆظ‚ Specialty',ne:'Fast-growing specialty market'},
    {ar:'ط¥ط³ط¨ط§ظ†ظٹط§',en:'Spain',fl:'ًں‡ھًں‡¸',q:'200M',pc:'4.2 kg',pcp:'4.2 kg',pct:12,n:'ط«ظ‚ط§ظپط© ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…طھظˆط³ط·ظٹط©',ne:'Mediterranean coffee culture'},
    {ar:'ط§ظ„ظ…ظ…ظ„ظƒط© ط§ظ„ظ…طھط­ط¯ط©',en:'UK',fl:'ًں‡¬ًں‡§',q:'180M',pc:'2.8 kg',pcp:'2.8 kg',pct:10,n:'ظ†ظ…ظˆ ظ‡ط§ط¦ظ„ ظپظٹ ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ط®طھطµط©',ne:'Huge specialty coffee growth'},
    {ar:'ظƒظˆط±ظٹط§ ط§ظ„ط¬ظ†ظˆط¨ظٹط©',en:'South Korea',fl:'ًں‡°ًں‡·',q:'160M',pc:'3.1 kg',pcp:'3.1 kg',pct:9,n:'ط£ط³ط±ط¹ ط³ظˆظ‚ ظ†ظ…ظˆ ظپظٹ ط¢ط³ظٹط§',ne:'Fastest growing Asian market'},
    {ar:'ظ‡ظˆظ„ظ†ط¯ط§',en:'Netherlands',fl:'ًں‡³ًں‡±',q:'150M',pc:'8.4 kg',pcp:'8.4 kg',pct:9,n:'ط£ط¹ظ„ظ‰ ط§ط³طھظ‡ظ„ط§ظƒ ظ„ظ„ظپط±ط¯ ظپظٹ ط£ظˆط±ظˆط¨ط§',ne:'Highest per capita in Europe'}
  ];
  cons.forEach((c,i) => {
    let cnt = (lang === 'ar' ? c.ar : c.en);
    let nt = (lang === 'ar' ? c.n : c.ne);
    h += '<div class="budget-bar" style="margin:0"><div class="budget-lbl" style="display:flex;justify-content:space-between;margin-bottom:3px"><span>' + c.fl + ' <strong>' + cnt + '</strong></span><span style="color:var(--accent);font-size:.8rem">' + __({ar:'ط§ط³طھظٹط±ط§ط¯',en:'Import'}) + ': ' + c.q + ' آ· ' + __({ar:'ظ„ظ„ظپط±ط¯',en:'pc'}) + ': ' + __({ar:c.pc,en:c.pcp}) + '</span></div><div class="budget-track" style="height:16px;background:rgba(255,255,255,.05);border-radius:10px;overflow:hidden"><div class="budget-fill" style="width:' + c.pct + '%;height:100%;background:linear-gradient(90deg,#2196f3,#64b5f6);border-radius:10px;transition:width 1s ease"></div></div><div style="font-size:.75rem;color:var(--text-muted);margin-top:2px">' + nt + '</div></div>';
  });
  h += '</div>';
  h += '<div class="ok-box"><strong>' + __({ar:'ًںژ¯ ط§ظ„ط®ظ„ط§طµط©:',en:'ًںژ¯ Summary:'}) + '</strong> ' + __({ar:'ط§ظ„ظ‚ظ‡ظˆط© ط±ط­ظ„ط© ط¹ط§ظ„ظ…ظٹط© â€” طھط²ط±ط¹ ظپظٹ ط§ظ„ط¬ظ†ظˆط¨ ظˆطھظڈط³طھظ‡ظ„ظƒ ظپظٹ ط§ظ„ط´ظ…ط§ظ„. ظپظ‡ظ… ط§ظ„ط®ط±ظٹط·ط© ظٹط³ط§ط¹ط¯ظƒ طھط¹ط±ظپ ظ…طµط¯ط± ط¨ظ†ظƒ ظˆطھطھظˆظ‚ط¹ ظ†ظƒظ‡ط§طھظ‡.',en:'Coffee is a global journey â€” grown in the south, consumed in the north. Understanding the map helps you trace your coffee\'s source and anticipate its flavors.'}) + '</div>';
  return h;
}

/* ===== Admin Panel ===== */
let _pendingUsersCache = [];
let _allUsersCache = [];
async function loadAdminData(){
  _pendingUsersCache = await getPendingUsersFromFirestore();
  _allUsersCache = await getAllUsersFromFirestore();
  let el = document.getElementById('adminPanel');
  if(el) el.innerHTML = renderAdminHTML();
}
function renderAdminHTML(){
  let pending=_pendingUsersCache, allUsers=_allUsersCache;
  let h='<div class="profile-wrap" style="max-width:900px">';
  h+='<div class="profile-hero"><div class="profile-hero-glow"></div><div class="profile-avatar-lg">âڑ™ï¸ڈ</div><h2>'+__({ar:'ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…',en:'Admin Panel'})+'</h2><p class="profile-title">'+__({ar:'ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† ظˆط§ظ„ظ…ظˆط§ظپظ‚ط§طھ',en:'Manage users & approvals'})+'</p></div>';
  h+='<div class="profile-section"><h3>âڈ³ '+__({ar:'ظپظٹ ط§ظ†طھط¸ط§ط± ط§ظ„ظ…ظˆط§ظپظ‚ط©',en:'Pending Approval'})+' <span class="pending-count">'+pending.length+'</span></h3>';
  if(pending.length===0){
    h+='<p class="empty-msg">'+__({ar:'ظ„ط§ ظٹظˆط¬ط¯ ظ…ط³طھط®ط¯ظ…ظˆظ† ظپظٹ ط§ظ†طھط¸ط§ط± ط§ظ„ظ…ظˆط§ظپظ‚ط©',en:'No pending users'})+'</p>';
  } else {
    h+='<div class="admin-user-list">';
    pending.forEach(p=>{
      h+='<div class="admin-user-item pending">'+
        '<div class="admin-user-ava">'+p.name[0].toUpperCase()+'</div>'+
        '<div class="admin-user-info"><div class="admin-user-name">'+p.name+'</div><div class="admin-user-email">'+p.email+'</div><div class="admin-user-date">'+__({ar:'طھط§ط±ظٹط® ط§ظ„طھط³ط¬ظٹظ„:',en:'Joined:'})+' '+p.joinDate+'</div></div>'+
        '<div class="admin-user-actions">'+
        '<button class="btn btn-sm btn-success" onclick="approveUser(\''+p.id+'\').then(()=>loadAdminData())">âœ“ '+__({ar:'ظ…ظˆط§ظپظ‚ط©',en:'Approve'})+'</button>'+
        '<button class="btn btn-sm btn-ghost" style="color:#e74c3c" onclick="rejectUser(\''+p.id+'\').then(()=>loadAdminData())">âœ• '+__({ar:'ط±ظپط¶',en:'Reject'})+'</button></div></div>';
    });
    h+='</div>';
  }
  h+='</div>';
  h+='<div class="profile-section"><h3>ًں‘¥ '+__({ar:'ط¬ظ…ظٹط¹ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†',en:'All Users'})+' <span class="pending-count">'+allUsers.length+'</span></h3>';
  if(allUsers.length===0){
    h+='<p class="empty-msg">'+__({ar:'ظ„ط§ ظٹظˆط¬ط¯ ظ…ط³طھط®ط¯ظ…ظˆظ† ط¨ط¹ط¯',en:'No users yet'})+'</p>';
  } else {
    h+='<div class="admin-user-list">';
    allUsers.forEach(p=>{
      let statusCls=p.role==='active'?'active':p.role==='banned'?'banned':'pending';
      let statusTxt=__({ar:p.role==='active'?'ظ†ط´ط·':p.role==='banned'?'ظ…ط­ط¸ظˆط±':'ظ…ط¹ظ„ظ‚',en:p.role==='active'?'Active':p.role==='banned'?'Banned':'Pending'});
      h+='<div class="admin-user-item '+statusCls+'">'+
        '<div class="admin-user-ava">'+p.name[0].toUpperCase()+'</div>'+
        '<div class="admin-user-info"><div class="admin-user-name">'+p.name+'</div><div class="admin-user-email">'+p.email+'</div>'+
        '<div class="admin-user-meta">'+
        '<span>ًںژ¯ '+(p.xp||0)+' XP</span><span>ًں”¥ '+(p.streak||0)+'</span><span>ًں“ڑ '+(p.completedLessons||[]).length+'</span>'+
        '</div></div>'+
        '<div class="admin-user-status '+statusCls+'">'+statusTxt+'</div>'+
        '<div class="admin-user-actions">'+
        (p.role==='active'?'<button class="btn btn-sm btn-ghost" style="color:#e74c3c" onclick="banUser(\''+p.id+'\').then(()=>loadAdminData())">ًںڑ« '+__({ar:'ط­ط¸ط±',en:'Ban'})+'</button>':'')+
        (p.role==='banned'?'<button class="btn btn-sm btn-success" onclick="unbanUser(\''+p.id+'\').then(()=>loadAdminData())">âœ“ '+__({ar:'ط¥ظ„ط؛ط§ط، ط§ظ„ط­ط¸ط±',en:'Unban'})+'</button>':'')+
        (p.role==='pending'?'<button class="btn btn-sm btn-success" onclick="approveUser(\''+p.id+'\').then(()=>loadAdminData())">âœ“ '+__({ar:'ظ…ظˆط§ظپظ‚ط©',en:'Approve'})+'</button>':'')+
        ' <button class="btn btn-sm btn-ghost" style="color:#e74c3c" onclick="rejectUser(\''+p.id+'\').then(()=>loadAdminData())">âœ•</button></div></div>';
    });
    h+='</div>';
  }
  h+='</div>';
  h+='<div class="profile-section" style="text-align:center;color:var(--text-muted);font-size:.82rem">'+
    '<p>ًں”گ '+__({ar:'ط£ظ†طھ ظ…ط³ط¤ظˆظ„ ط§ظ„ظ†ط¸ط§ظ…. ط£ظˆظ„ ظ…ط³طھط®ط¯ظ… ظ…ط³ط¬ظ„ ظٹطµط¨ط­ ظ…ط³ط¤ظˆظ„ط§ظ‹ طھظ„ظ‚ط§ط¦ظٹط§ظ‹.',en:'You are the system admin. The first registered user becomes admin automatically.'})+'</p>'+
    '<p>ًں›،ï¸ڈ '+__({ar:'ظٹظ…ظƒظ†ظƒ ط§ظ„ظ…ظˆط§ظپظ‚ط© ط¹ظ„ظ‰ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† ط§ظ„ط¬ط¯ط¯طŒ ط­ط¸ط±ظ‡ظ…طŒ ط£ظˆ ط­ط°ظپظ‡ظ….',en:'You can approve new users, ban them, or remove them.'})+'</p></div>';
  h+='</div>';
  return h;
}
function sAdmin(){
  if(!curUser||!isAdmin()) return '<p>'+__({ar:'ط؛ظٹط± ظ…طµط±ط­',en:'Unauthorized'})+'</p>';
  setTimeout(loadAdminData, 50);
  return '<div id="adminPanel"><div style="text-align:center;padding:40px;color:var(--text-muted)">âڈ³ '+__({ar:'ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ...',en:'Loading data...'})+'</div></div>';
}

/* ===== Profile / Dashboard ===== */
function sProfile(){
  let u=getCurUser();
  if(!u) return '<p style="text-align:center;padding:40px;color:var(--text-muted)">'+__({ar:'ط§ظ„ط±ط¬ط§ط، طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„',en:'Please login'})+'</p>';
  let lvl=XP_LEVELS[u.levelIdx||0];
  let h='<div class="profile-wrap">';
  // Hero
  h+='<div class="profile-hero"><div class="profile-hero-glow"></div><div class="profile-avatar-lg">'+u.name[0].toUpperCase()+'</div>'+
    '<h2>'+u.name+'</h2><p class="profile-title">'+lvl.ic+' '+__(lvl.name)+'</p>'+
    '<div class="profile-xp-bar"><div class="profile-xp-fill" style="width:'+xpPct(u)+'%"></div></div>'+
    '<div class="profile-xp-info">'+u.xp+' XP'+(xpToNext(u)>0?' آ· '+xpToNext(u)+' '+__({ar:'ظ„ظ„ظ…ط³طھظˆظ‰ ط§ظ„طھط§ظ„ظٹ',en:'to next level'}):' آ· '+__({ar:'ط§ظ„ظ…ط³طھظˆظ‰ ط§ظ„ط£ظ‚طµظ‰!',en:'MAX LEVEL!'}))+'</div>'+
    '<div class="profile-stats-row"><div><span class="ps-n">'+(u.completedLessons||[]).length+'</span><span class="ps-l">'+__({ar:'ط¯ط±ط³ ظ…ظƒطھظ…ظ„',en:'Lessons'})+'</span></div>'+
    '<div><span class="ps-n">'+(u.completedModules||[]).length+'</span><span class="ps-l">'+__({ar:'ظˆط­ط¯ط©',en:'Modules'})+'</span></div>'+
    '<div><span class="ps-n">'+(u.passedExams||[]).length+'</span><span class="ps-l">'+__({ar:'ط§ط®طھط¨ط§ط±',en:'Exams'})+'</span></div>'+
    '<div><span class="ps-n">ًں”¥'+(u.streak||0)+'</span><span class="ps-l">'+__({ar:'ط£ظٹط§ظ…',en:'Streak'})+'</span></div></div></div>';
  // Badges
  h+='<div class="profile-section"><h3>'+__({ar:'ًںڈ… ط§ظ„ط£ظˆط³ظ…ط©',en:'ًںڈ… Badges'})+'</h3><div class="badge-grid">';
  BADGE_DEFS.forEach(b=>{
    let owned=hasBadge(u,b.id);
    h+='<div class="badge-item'+(owned?' owned':'')+'"><div class="badge-ic">'+b.ic+'</div><div class="badge-name">'+__(b.name)+'</div><div class="badge-desc">'+__(b.desc)+'</div></div>';
  });
  h+='</div></div>';
  // Completed lessons
  h+='<div class="profile-section"><h3>'+__({ar:'ًں“– طھظ‚ط¯ظ…ظٹ',en:'ًں“– My Progress'})+'</h3><div class="progress-mod-list">';
  CM.forEach((m,mi)=>{
    let lessonsDone=m.lessons.filter((_,li)=>isLessonDone(u,m.level,mi,li)).length;
    let pct=Math.round(lessonsDone/m.lessons.length*100);
    h+='<div class="progress-mod-item"><div class="pm-top"><span class="pm-ic">'+m.icon+'</span><span class="pm-title">'+__(m.title)+'</span><span class="pm-pct">'+lessonsDone+'/'+m.lessons.length+'</span></div>'+
      '<div class="pm-bar"><div class="pm-fill" style="width:'+pct+'%"></div></div></div>';
  });
  h+='</div></div>';
  h+='<button class="btn btn-ghost" onclick="logoutUser();showAuth();rT(\'home\')" style="margin:30px auto;display:block">ًںڑھ '+__({ar:'طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬',en:'Logout'})+'</button>';
  h+='</div>';
  return h;
}

/* ===== AI Coffee Assistant ===== */
const AI = {
  kb:[
    {tags:['hello','hi','ظ…ط±ط­ط¨ط§','ط§ظ„ط³ظ„ط§ظ…','ظ…ط³ط§ط،','طµط¨ط§ط­','hey','ط³ظ„ط§ظ…'],ar:'ظ…ط±ط­ط¨ط§ظ‹ ط¨ظƒ ظپظٹ ط£ظƒط§ط¯ظٹظ…ظٹط© ط§ظ„ط£ظٹط§ط¯ظٹ ط§ظ„ط¨ظٹط¶ط§ط،! ًںکٹ ط£ظ†ط§ ظ…ط³ط§ط¹ط¯ ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط°ظƒظٹ. ط§ط³ط£ظ„ظ†ظٹ ط¹ظ† ط£ظٹ ط´ظٹط، ظپظٹ ط¹ط§ظ„ظ… ط§ظ„ظ‚ظ‡ظˆط©: ط£ظ†ظˆط§ط¹ ط§ظ„ط¨ظ†طŒ ط·ط±ظ‚ ط§ظ„طھط­ط¶ظٹط±طŒ ط§ظ„طھط­ظ…ظٹطµطŒ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆطŒ ط§ظ„ظ„ط§طھظٹظ‡طŒ ظˆط£ظƒط«ط±!',en:'Welcome to White Hands Academy! ًںکٹ I\'m your coffee assistant. Ask me anything about coffee: bean types, brewing methods, roasting, espresso, latte art, and more!'},
    {tags:['ط§ط³ظ…','what is your name','who are you','ط§ظ†طھ ظ…ظٹظ†'],ar:'ط£ظ†ط§ ًں§  ط¨ط§ط±ظٹط³طھط§ ط§ظ„ط°ظƒظٹ â€” ظ…ط³ط§ط¹ط¯ ط£ظƒط§ط¯ظٹظ…ظٹط© ط§ظ„ط£ظٹط§ط¯ظٹ ط§ظ„ط¨ظٹط¶ط§ط،. ط§ظ‚ط¯ط± ط£ط³ط§ط¹ط¯ظƒ ظپظٹ ظƒظ„ ط­ط§ط¬ط© ط¹ظ† ط§ظ„ظ‚ظ‡ظˆط©!',en:'I\'m ًں§  Barista AI â€” the White Hands Academy assistant. I can help you with everything about coffee!'},
    {tags:['arabica','ط§ط±ط§ط¨ظٹظƒط§','ط£ط±ط§ط¨ظٹظƒط§','arabic'],ar:'ًںŒ± **ط§ظ„ط¨ظ† ط§ظ„ط£ط±ط§ط¨ظٹظƒط§** â€” ط£ط´ظ‡ط± ط£ظ†ظˆط§ط¹ ط§ظ„ظ‚ظ‡ظˆط© ظˆط£ط¬ظˆط¯ظ‡ط§. ظ†ط³ط¨ط© ظƒط§ظپظٹظٹظ† ط£ظ‚ظ„ (1.2-1.5%)طŒ ط·ط¹ظ… ط£ط­ظ„ظ‰ ظˆظ†ط§ط¹ظ…طŒ ط±ط§ط¦ط­ط© ظپظˆط§ظƒظ‡ ظˆط²ظ‡ظˆط±. طھط²ط±ط¹ ظپظٹ ظ…ط±طھظپط¹ط§طھ 600-2000 ظ…طھط±. ط£ط´ظ‡ط± ط§ظ„ط¯ظˆظ„: ط¥ط«ظٹظˆط¨ظٹط§طŒ ظƒظˆظ„ظˆظ…ط¨ظٹط§طŒ ط§ظ„ط¨ط±ط§ط²ظٹظ„طŒ ظƒظٹظ†ظٹط§.',en:'ًںŒ± **Arabica** â€” The most popular and highest quality coffee. Lower caffeine (1.2-1.5%), sweeter and smoother taste, fruity and floral aroma. Grown at 600-2000m elevation. Top origins: Ethiopia, Colombia, Brazil, Kenya.'},
    {tags:['robusta','ط±ظˆط¨ظˆط³طھط§','ط±ظˆ busta'],ar:'ًںŒ° **ط§ظ„ط¨ظ† ط§ظ„ط±ظˆط¨ظˆط³طھط§** â€” ط£ظ‚ظˆظ‰ ظˆط£ظƒط«ط± ظ…ط±ط§ط±ط© ظ…ظ† ط§ظ„ط£ط±ط§ط¨ظٹظƒط§. ظ†ط³ط¨ط© ظƒط§ظپظٹظٹظ† ط£ط¹ظ„ظ‰ (2.2-2.7%)طŒ ظٹظڈط²ط±ط¹ ظپظٹ ط§ظ„ظ…ظ†ط®ظپط¶ط§طھ. ظٹظڈط³طھط®ط¯ظ… ط¨ظƒط«ط±ط© ظپظٹ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ ط§ظ„ط¥ظٹط·ط§ظ„ظٹ ظˆط§ظ„ط¥ط¨ط³ظˆ ظ„ط²ظٹط§ط¯ط© ط§ظ„ظƒط±ظٹظ…ط§ ظˆط§ظ„ظ‚ظˆط§ظ….',en:'ًںŒ° **Robusta** â€” Stronger and more bitter than Arabica. Higher caffeine (2.2-2.7%), grown at lower elevations. Widely used in Italian espresso blends for better crema and body.'},
    {tags:['espresso','ط¥ط³ط¨ط±ظٹط³ظˆ','ط§ط³ط¨ط±ط³ظˆ','ط§ط³ط¨ط±ظٹط³ظˆ','espresso shot'],ar:'âک• **ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ** â€” ظ‚ظ„ط¨ ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ…ط®طھطµط©. 7-9 ط¬ط±ط§ظ… ط¨ظ† ظ…ط·ط­ظˆظ† ظ†ط§ط¹ظ…طŒ 25-30 ظ…ظ„ ظ…ط§ط، ط¨ط¶ط؛ط· 9 ط¨ط§ط±طŒ ط­ط±ط§ط±ط© 92-96آ°ظ…طŒ ظˆظ‚طھ 25-30 ط«ط§ظ†ظٹط©. ط§ظ„ظ†طھظٹط¬ط©: ظپظ†ط¬ط§ظ† ظ…ط±ظƒط² ط¨ظƒط±ظٹظ…ط§ ط°ظ‡ط¨ظٹط©.',en:'âک• **Espresso** â€” The heart of specialty coffee. 7-9g finely ground coffee, 25-30ml water at 9 bar pressure, 92-96آ°C, 25-30 seconds. Result: a concentrated shot with golden crema.'},
    {tags:['ظ„ط§طھظٹظ‡','latte','ظ„ط§طھظٹظ‡ ط§ط±طھ','latte art'],ar:'ًںژ¨ **ظ„ط§طھظٹظ‡ ط¢ط±طھ** â€” ظپظ† طµط¨ ط§ظ„ط­ظ„ظٹط¨ ط¹ظ„ظ‰ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ. ط§ظ„ط­ظ„ظٹط¨ ط§ظ„ظ…ط¨ط®ط± ط¨ظ‚ظˆط§ظ… ظ…ط®ظ…ظ„ظٹ ظٹظڈطµط¨ ط¨ط­ط±ظƒط§طھ ط¯ظ‚ظٹظ‚ط© ظ„طھط´ظƒظٹظ„ ط±ط³ظˆظ…ط§طھ: ظ‚ظ„ط¨طŒ ط±ظˆط²ظٹطھط§طŒ طھظˆظ„ظٹط¨. ظٹط­طھط§ط¬ طھط¯ط±ظٹط¨ ظƒط«ظٹط± ط¹ط´ط§ظ† طھطھظ‚ظ†ظ‡! ًں–¤',en:'ًںژ¨ **Latte Art** â€” The art of pouring steamed milk over espresso. Velvety textured milk is poured with precise movements to create patterns: heart, rosetta, tulip. Requires lots of practice to master! ًں–¤'},
    {tags:['v60','ظپظٹ 60','v 60','pour over','pour-over','v60'],ar:'ًں¥ƒ **V60** â€” ط·ط±ظٹظ‚ط© طھط­ط¶ظٹط± ط¨ط§ظ„طµط¨ (Pour Over). ظ‚ظ…ط¹ ظ…ط®ط±ظˆط·ظٹ ط­ظ„ط²ظˆظ†ظٹطŒ ظپظ„طھط± ظˆط±ظ‚طŒ ط¨ظ† ظ…طھظˆط³ط· ط§ظ„ظ†ط¹ظˆظ…ط©طŒ ظ…ط§ط، 93آ°ظ…. ط§ظ„ظ†ط³ط¨ط©: 60g ط¨ظ† ظ„ظƒظ„ 1 ظ„طھط± ظ…ط§ط،. ظˆظ‚طھ: 2:30-3:00 ط¯ظ‚ظٹظ‚ط©. ط·ط¹ظ… ظ†ط¸ظٹظپ ظˆظ…ط´ط±ظ‚!',en:'ًں¥ƒ **V60** â€” A pour-over brewing method. Spiral cone, paper filter, medium-fine grind, 93آ°C water. Ratio: 60g coffee per 1L water. Time: 2:30-3:00 min. Clean, bright taste!'},
    {tags:['طھط­ظ…ظٹطµ','roast','roasting','طھط­ظ…ظٹطµ ط§ظ„ط¨ظ†'],ar:'ًں”¥ **ط§ظ„طھط­ظ…ظٹطµ** â€” ظٹط­ظˆظ„ ط§ظ„ط¨ظ† ط§ظ„ط£ط®ط¶ط± ظ„ظ„ط¨ظ†ظٹ ط§ظ„ظ…ط­ظ…طµ. 3 ظ…ط±ط§ط­ظ„: 1) ط§ظ„طھط¬ظپظٹظپ (ط­طھظ‰ 160آ°ظ…) 2) ط§ظ„طھظپط§ط¹ظ„ (160-190آ°ظ…) 3) ط§ظ„طھط­ظ…ظٹطµ (190-220آ°ظ…). ط£ظˆظ„ ظƒط±ط§ظƒ (First Crack) ~196آ°ظ…. ط¯ط±ط¬ط§طھ: ظپط§طھط­ (Light)طŒ ظ…طھظˆط³ط· (Medium)طŒ ط؛ط§ظ…ظ‚ (Dark).',en:'ًں”¥ **Roasting** â€” Transforms green beans into roasted coffee. 3 stages: 1) Drying (to 160آ°C) 2) Reaction (160-190آ°C) 3) Roasting (190-220آ°C). First crack ~196آ°C. Levels: Light, Medium, Dark.'},
    {tags:['ظƒط±ظٹظ…ط§','crema','golden'],ar:'ًںں، **ط§ظ„ظƒط±ظٹظ…ط§** â€” ط§ظ„ط·ط¨ظ‚ط© ط§ظ„ط°ظ‡ط¨ظٹط© ط¹ظ„ظ‰ ظˆط¬ظ‡ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ. ط¹ظ„ط§ظ…ط© ط§ظ„ط¬ظˆط¯ط©! طھطھظƒظˆظ† ظ…ظ† ط²ظٹظˆطھ ط§ظ„ط¨ظ† ظˆط«ط§ظ†ظٹ ط£ظƒط³ظٹط¯ ط§ظ„ظƒط±ط¨ظˆظ† ط§ظ„ظ…ط­ط¨ظˆط³ طھط­طھ ط¶ط؛ط· 9 ط¨ط§ط±. ظƒط±ظٹظ…ط§ ظƒط«ظٹظپط© ط¨ظ„ظˆظ† ط§ظ„ط¨ظ†ط¯ظ‚ ط§ظ„ظ…ط­ظ…طµ = ط¥ط³ط¨ط±ظٹط³ظˆ ظ…ط«ط§ظ„ظٹ.',en:'ًںں، **Crema** â€” The golden layer on top of espresso. A quality mark! Formed by coffee oils and COâ‚‚ trapped under 9 bar pressure. Thick, hazelnut-colored crema = perfect espresso.'},
    {tags:['ظƒط§ظپظٹظٹظ†','caffeine','ط§ظ„ظƒط§ظپظٹظٹظ†'],ar:'âڑ، **ط§ظ„ظƒط§ظپظٹظٹظ†** â€” ط§ظ„ظ…ظ†ط¨ظ‡ ط§ظ„ط·ط¨ظٹط¹ظٹ ظپظٹ ط§ظ„ظ‚ظ‡ظˆط©. ط§ظ„ط£ط±ط§ط¨ظٹظƒط§: 1.2-1.5% | ط§ظ„ط±ظˆط¨ظˆط³طھط§: 2.2-2.7%. ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ (30ظ…ظ„): ~63mg ظƒط§ظپظٹظٹظ†. ظپظ†ط¬ط§ظ† V60 (250ظ…ظ„): ~120-200mg. ط§ظ„ط¬ط±ط¹ط© ط§ظ„ط¢ظ…ظ†ط© ظٹظˆظ…ظٹط§ظ‹: ط­طھظ‰ 400mg.',en:'âڑ، **Caffeine** â€” Coffee\'s natural stimulant. Arabica: 1.2-1.5% | Robusta: 2.2-2.7%. Espresso (30ml): ~63mg. V60 cup (250ml): ~120-200mg. Safe daily limit: up to 400mg.'},
    {tags:['ظƒظˆظ„ط¯ ط¨ط±ظˆ','cold brew','ظƒظˆظ„ ط¨ط±ظˆ','cold brew'],ar:'ًں§ٹ **ط§ظ„ظƒظˆظ„ط¯ ط¨ط±ظˆ** â€” ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ط¨ط§ط±ط¯ط© ط§ظ„ظ…ظ†ظ‚ظˆط¹ط©. ط¨ظ† ط®ط´ظ† + ظ…ط§ط، ط¨ط§ط±ط¯ ظ„ظ…ط¯ط© 12-24 ط³ط§ط¹ط© ظپظٹ ط§ظ„ط«ظ„ط§ط¬ط©. ط·ط¹ظ… ظ†ط§ط¹ظ…طŒ ط­ظ„ط§ظˆط© ط·ط¨ظٹط¹ظٹط©طŒ ظƒط§ظپظٹظٹظ† ط¹ط§ظ„ظٹ. ط§ظ„ظ†ط³ط¨ط©: 1:8 ط¨ظ† ظ„ظ…ط§ط،. طھظ‚ط¯ظ… ظ…ط¹ ط«ظ„ط¬ ظˆط­ظ„ظٹط¨ ط­ط³ط¨ ط§ظ„ط±ط؛ط¨ط©!',en:'ًں§ٹ **Cold Brew** â€” Cold steeped coffee. Coarse grounds + cold water for 12-24 hours in the fridge. Smooth taste, natural sweetness, high caffeine. Ratio: 1:8 coffee to water. Serve over ice!'},
    {tags:['ط·ط¹ظ…','flavor','ظ†ظƒظ‡ط©','taste','sweet','ط­ظ„ظˆ','ظ…ط±','bitter','ط­ط§ظ…ط¶','sour','fruity','ظپظˆط§ظƒظ‡'],ar:'ًں‘… **ظ†ظƒظ‡ط§طھ ط§ظ„ظ‚ظ‡ظˆط©** â€” طھط®طھظ„ظپ ط­ط³ط¨: ط£طµظ„ ط§ظ„ط¨ظ†طŒ ط¯ط±ط¬ط© ط§ظ„طھط­ظ…ظٹطµطŒ ط·ط±ظٹظ‚ط© ط§ظ„طھط­ط¶ظٹط±. ط§ظ„ظپظˆط§ظƒظ‡ ظˆط§ظ„طھظˆطھ â†گ ط¨ظ† ط¥ط«ظٹظˆط¨ظٹ. ط§ظ„ط´ظˆظƒظˆظ„ط§طھط© ظˆط§ظ„ظ…ظƒط³ط±ط§طھ â†گ ط¨ظ† ط¨ط±ط§ط²ظٹظ„ظٹ. ط§ظ„ط²ظ‡ظˆط± ظˆط§ظ„ظٹط§ط³ظ…ظٹظ† â†گ ط¨ظ† ظƒظٹظ†ظٹ. ط§ظ„ط­ظ…ظˆط¶ط© ط§ظ„ط²ط§ط¦ط¯ط© â†گ طھط­ظ…ظٹطµ ظپط§طھط­ ط£ظˆ ط§ط³طھط®ظ„ط§طµ ط²ط§ط¦ط¯.',en:'ًں‘… **Coffee Flavors** â€” Vary by: origin, roast level, brewing method. Fruits & berries â†گ Ethiopian. Chocolate & nuts â†گ Brazilian. Floral & jasmine â†گ Kenyan. Excess acidity â†گ under-roasted or over-extracted.'},
    {tags:['ط¨ط§ط±ظٹط³طھط§','barista','skill','ظ…ظ‡ط§ط±ط§طھ'],ar:'ًں‘¨â€چًںچ³ **ظ…ظ‡ط§ط±ط§طھ ط§ظ„ط¨ط§ط±ظٹط³طھط§** â€” 1) ط¶ط¨ط· ط§ظ„ط·ط§ط­ظˆظ†ط© (Grinder Calibration) 2) طھظˆط²ظٹط¹ ط§ظ„ط¨ظ† (Distribution) 3) ط§ظ„ط¶ط؛ط· (Tamping) ط¨ظ‚ظˆط© ~15kg 4) طھط­ط¶ظٹط± ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ 5) طھط¨ط®ظٹط± ط§ظ„ط­ظ„ظٹط¨ 6) ط§ظ„ظ„ط§طھظٹظ‡ ط¢ط±طھ. ط£ظƒط§ط¯ظٹظ…ظٹط© ط§ظ„ط£ظٹط§ط¯ظٹ ط§ظ„ط¨ظٹط¶ط§ط، ط¨طھط¹ظ„ظ…ظƒ ظƒظ„ ط¯ظ‡! ًں’ھ',en:'ًں‘¨â€چًںچ³ **Barista Skills** â€” 1) Grinder Calibration 2) Distribution 3) Tamping (~15kg pressure) 4) Espresso pulling 5) Milk steaming 6) Latte Art. White Hands Academy teaches all of this! ًں’ھ'},
    {tags:['ط·ط­ظ†ط©','grind','grind size','ظ†ط§ط¹ظ…','ط®ط´ظ†','coarse'],ar:'âڑ™ï¸ڈ **ط§ظ„ط·ط­ظ†ط©** â€” ط­ط¬ظ… ط§ظ„ط·ط­ظ† ظٹط­ط¯ط¯ ط³ط±ط¹ط© ط§ظ„ط§ط³طھط®ظ„ط§طµ. ظ†ط§ط¹ظ… ط¬ط¯ط§ظ‹ â†گ ط¥ط¨ط±ظٹظƒ (Turkish). ظ†ط§ط¹ظ… â†گ ط¥ط³ط¨ط±ظٹط³ظˆ. ظ…طھظˆط³ط· â†گ V60. ظ…طھظˆط³ط· ط®ط´ظ† â†گ Chemex. ط®ط´ظ† â†گ French Press. ط®ط´ظ† ط¬ط¯ط§ظ‹ â†گ Cold Brew.',en:'âڑ™ï¸ڈ **Grind Size** â€” Determines extraction speed. Extra fine â†گ Turkish. Fine â†گ Espresso. Medium â†گ V60. Medium-coarse â†گ Chemex. Coarse â†گ French Press. Extra coarse â†گ Cold Brew.'},
    {tags:['ظ…ط§ط،','water','ظ†ط³ط¨ط©','ratio'],ar:'ًں’§ **ط§ظ„ظ…ط§ط،** â€” 98% ظ…ظ† ظپظ†ط¬ط§ظ† ط§ظ„ظ‚ظ‡ظˆط©! TDS ظ…ط«ط§ظ„ظٹ: 100-150ppm. ظƒظ„ظˆط±ظٹط¯ ط§ظ„ظƒط§ظ„ط³ظٹظˆظ… ظˆط§ظ„ظ…ط؛ظ†ظٹط³ظٹظˆظ… ظٹط³ط§ط¹ط¯ط§ظ† ظپظٹ ط§ظ„ط§ط³طھط®ظ„ط§طµ. ط§ظ„ظ†ط³ط¨ط© ط§ظ„ط°ظ‡ط¨ظٹط©: 60g ط¨ظ† / 1 ظ„طھط± ظ…ط§ط، (ظ„ظ€ V60). ظ„ظ„ط¥ط³ط¨ط±ظٹط³ظˆ: 1:2 (ط¨ظ†:ظ…ط§ط،) = 18g ط¨ظ† â†’ 36g ط¥ط³ط¨ط±ظٹط³ظˆ.',en:'ًں’§ **Water** â€” 98% of your coffee cup! Ideal TDS: 100-150ppm. Calcium and magnesium help extraction. Golden ratio: 60g coffee / 1L water (for V60). For espresso: 1:2 (coffee:water) = 18g â†’ 36g espresso.'},
    {tags:['ط´ظ‡ط§ط¯ط©','certificate','cert','ط§ط¹طھظ…ط§ط¯'],ar:'ًں“œ **ط§ظ„ط´ظ‡ط§ط¯ط§طھ** â€” ط£ظƒط§ط¯ظٹظ…ظٹط© ط§ظ„ط£ظٹط§ط¯ظٹ ط§ظ„ط¨ظٹط¶ط§ط، طھظ…ظ†ط­ ط´ظ‡ط§ط¯ط§طھ ط¥طھظ…ط§ظ… ظ„ظƒظ„ ظ…ط³طھظˆظ‰ (A, B, C) ط¨ط¹ط¯ ط§ط¬طھظٹط§ط² ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ. ط§ظ„ط´ظ‡ط§ط¯ط§طھ ظ…ط¹طھظ…ط¯ط© ط¹ظ„ظ‰ ظ…ظ†ظ‡ط¬ SCA ط§ظ„ط¹ط§ظ„ظ…ظٹ. ط£ط¸ظ‡ط± ظ…ظ‡ط§ط±ط§طھظƒ ظˆط§ط­طµظ„ ط¹ظ„ظ‰ ط´ظ‡ط§ط¯طھظƒ! ًںژ“',en:'ًں“œ **Certificates** â€” White Hands Academy awards completion certificates for each level (A, B, C) after passing exams. Certificates are SCA-aligned. Show your skills and earn your certificate! ًںژ“'},
    {tags:['ظ…ط³طھظˆظ‰','level','levels','levels a','levels b','levels c'],ar:'ًں“ڑ **ط§ظ„ظ…ط³طھظˆظٹط§طھ:** A (ظ…ط¨طھط¯ط¦): ط£ط³ط§ط³ظٹط§طھ ط§ظ„ظ‚ظ‡ظˆط©طŒ ط£طµظ„ ط§ظ„ط¨ظ†طŒ طھط­ط¶ظٹط± ط¨ط³ظٹط·. B (ظ…طھظˆط³ط·): ط¹ظ„ظ… ط§ظ„طھط­ظ…ظٹطµطŒ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆطŒ ط§ظ„ظ„ط§طھظٹظ‡. C (ظ…طھظ‚ط¯ظ…): طھط­ظƒظٹظ… ط§ظ„ظ‚ظ‡ظˆط©طŒ ظƒط§ط¨ظٹظ†ط¬طŒ ط¥ط¯ط§ط±ط© ظ…ظ‚ظ‡ظ‰. ط§ط¨ط¯ط£ ظ…ظ† A ظˆط§ظ†طھظ‚ظ„ ظ„ظ„ط§ط­طھط±ط§ظپ!',en:'ًں“ڑ **Levels:** A (Beginner): Coffee basics, bean origins, simple brewing. B (Intermediate): Roasting science, espresso, latte art. C (Advanced): Coffee judging, cupping, cafe management. Start from A and level up!'},
    {tags:['ظƒط§ط¨ظٹظ†ط¬','cupping','tasting','طھط°ظˆظ‚'],ar:'ًں§ھ **ط§ظ„ظƒط§ط¨ظٹظ†ط¬** â€” ط§ظ„طھط­ظƒظٹظ… ط§ظ„ط§ط­طھط±ط§ظپظٹ ظ„ظ„ظ‚ظ‡ظˆط©. طھط·ط¨ظٹظ‚ ط¨ط±ظˆطھظˆظƒظˆظ„ SCA: طھظ‚ظٹظٹظ… ط§ظ„ط±ط§ط¦ط­ط© (Fragrance/Aroma)طŒ ط§ظ„ظ†ظƒظ‡ط© (Flavor)طŒ ط§ظ„ط­ظ…ظˆط¶ط© (Acidity)طŒ ط§ظ„ظ‚ظˆط§ظ… (Body)طŒ ط§ظ„طھظˆط§ط²ظ† (Balance)طŒ ط§ظ„ظ†ظ‡ط§ظٹط© (Aftertaste). ظƒظ„ طµظپط© ظ…ظ† 0-10.',en:'ًں§ھ **Cupping** â€” Professional coffee judging. SCA protocol: evaluate Fragrance/Aroma, Flavor, Acidity, Body, Balance, Aftertaste. Each attribute scored 0-10.'},
    {tags:['ظ…ط¹ط§ظ„ط¬ط©','processing','ظ…ط؛ط³ظˆظ„','washed','ط·ط¨ظٹط¹ظٹ','natural','ط¹ط³ظ„','honey'],ar:'ًں«ک **ط·ط±ظ‚ ط§ظ„ظ…ط¹ط§ظ„ط¬ط©:** ط§ظ„ظ…ط؛ط³ظˆظ„ (Washed): ظ†ط¸ظٹظپطŒ ط­ظ…ظˆط¶ط© ط¹ط§ظ„ظٹط©. ط§ظ„ط·ط¨ظٹط¹ظٹ (Natural): ظپظˆط§ظƒظ‡طŒ ط­ظ„ط§ظˆط©طŒ ط«ظ‚ظ„. ط§ظ„ط¹ط³ظ„ (Honey): ظˆط³ط· ط¨ظٹظ†ظ‡ظ…. ظƒظ„ ط·ط±ظٹظ‚ط© ط¨طھط£ط«ط± ط¹ظ„ظ‰ ط·ط¹ظ… ط§ظ„ظ‚ظ‡ظˆط© ط§ظ„ظ†ظ‡ط§ط¦ظٹ.',en:'ًں«ک **Processing Methods:** Washed: clean, high acidity. Natural: fruity, sweet, heavy body. Honey: in between. Each method affects the final cup taste.'},
    {tags:['ط²ط±ط§ط¹ط©','grow','ظ…ط²ط±ط¹ط©','farm','coffee cherry','ط§ظ„ظƒط±ط²'],ar:'ًںŒ؟ **ط²ط±ط§ط¹ط© ط§ظ„ط¨ظ†** â€” ط´ط¬ط±ط© ط§ظ„ط¨ظ† طھط­طھط§ط¬ 3-5 ط³ظ†ظٹظ† ط¹ط´ط§ظ† طھط«ظ…ط±. ط§ظ„ظƒط±ط²ط© ط§ظ„ط­ظ…ط±ط§ط، = ظ†ط§ط¶ط¬ط©. ظƒظ„ ظƒط±ط²ط© ظپظٹظ‡ط§ 2 ط¨ط°ط±ط© (ط­ط¨ط© ط¨ظ†). ظ…ظˆط³ظ… ط§ظ„ط­طµط§ط¯: 1-2 ظ…ط±ط© ظپظٹ ط§ظ„ط³ظ†ط©. ط£ظپط¶ظ„ ط²ط±ط§ط¹ط© ظپظٹ ط§ظ„ظ…ط±طھظپط¹ط§طھ >1000ظ….',en:'ًںŒ؟ **Coffee Growing** â€” Coffee trees take 3-5 years to bear fruit. Red cherry = ripe. Each cherry contains 2 seeds (coffee beans). Harvest: 1-2 times per year. Best grown at elevations >1000m.'}
  ],
  fallback:{ar:'ًں¤” ظ…ط§ ط¹ظ†ط¯ظٹط´ ظ…ط¹ظ„ظˆظ…ط© ظƒط§ظپظٹط© ط¹ظ† ط¯ظ‡. ط¬ط±ط¨ طھط³ط£ظ„ ط¹ظ†: ط£ظ†ظˆط§ط¹ ط§ظ„ط¨ظ†طŒ ط·ط±ظ‚ ط§ظ„طھط­ط¶ظٹط±طŒ ط§ظ„طھط­ظ…ظٹطµطŒ ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆطŒ ط§ظ„ظ„ط§طھظٹظ‡طŒ ط£ظˆ ط§ظ„ظ…ط³طھظˆظٹط§طھ ط§ظ„ط¯ط±ط§ط³ظٹط©!',en:'ًں¤” I don\'t have enough info on that. Try asking about: coffee types, brewing methods, roasting, espresso, latte art, or course levels!'},
  greetingDone:false,
  find(q){
    q=q.toLowerCase().normalize('NFKD').replace(/[\u064b-\u065f]/g,'').trim();
    let best={idx:-1,score:0};
    this.kb.forEach((item,i)=>{
      let score=0;
      item.tags.forEach(t=>{
        let tl=t.toLowerCase().normalize('NFKD').replace(/[\u064b-\u065f]/g,'');
        if(q.includes(tl)||tl.includes(q)) score+=3;
        else{
          let words=tl.split(' '), qWords=q.split(' ');
          words.forEach(w=>{if(qWords.includes(w))score+=1});
        }
      });
      if(score>best.score){best.idx=i;best.score=score}
    });
    return best.score>0?this.kb[best.idx]:null;
  },
  answer(q){
    let match=this.find(q);
    let txt=match?(lang==='ar'?match.ar:match.en):this.fallback[lang];
    if(!match&&!this.greetingDone){
      this.greetingDone=true;
      txt=this.kb[0][lang]+'\n\n'+txt;
    }
    return txt;
  },
  init(){
    document.body.insertAdjacentHTML('beforeend',
      '<button class="ai-btn" id="aiBtn" onclick="AI.toggle()" title="ًں§  ط¨ط§ط±ظٹط³طھط§ ط§ظ„ط°ظƒظٹ">ًں§ </button>'+
      '<div class="ai-panel" id="aiPanel">'+
        '<div class="ai-hdr"><span>ًں§ </span> '+__({ar:'ط¨ط§ط±ظٹط³طھط§ ط§ظ„ط°ظƒظٹ',en:'Barista AI'})+' <span style="font-size:.6rem;opacity:.5;font-weight:400">v1.0</span>'+
          '<button class="ai-close" onclick="AI.toggle()">âœ•</button></div>'+
        '<div class="ai-msgs" id="aiMsgs"></div>'+
        '<div class="ai-chips" id="aiChips"></div>'+
        '<div class="ai-inp-wrap">'+
          '<input class="ai-inp" id="aiInp" placeholder="'+__({ar:'ط§ط³ط£ظ„ ط¹ظ† ط§ظ„ظ‚ظ‡ظˆط©...',en:'Ask about coffee...'})+'" onkeydown="if(event.key===\'Enter\')AI.send()">'+
          '<button class="ai-send" onclick="AI.send()">â‍¤</button></div></div>'
    );
    this.chips=[{ar:'âک• ط§ظ„ط¥ط³ط¨ط±ظٹط³ظˆ',en:'âک• Espresso'},{ar:'ًں¥ƒ V60',en:'ًں¥ƒ V60'},{ar:'ًں”¥ ط§ظ„طھط­ظ…ظٹطµ',en:'ًں”¥ Roasting'},{ar:'ًںŒ± ط£ط±ط§ط¨ظٹظƒط§',en:'ًںŒ± Arabica'},{ar:'ًںژ¨ ظ„ط§طھظٹظ‡ ط¢ط±طھ',en:'ًںژ¨ Latte Art'},{ar:'âڑ™ï¸ڈ ط§ظ„ط·ط­ظ†ط©',en:'âڑ™ï¸ڈ Grind Size'}];
    this.renderChips();
    this.addMsg(__({ar:'ًں‘‹ ظ…ط±ط­ط¨ط§ظ‹! ط£ظ†ط§ ًں§  ط¨ط§ط±ظٹط³طھط§ ط§ظ„ط°ظƒظٹ. ط§ط³ط£ظ„ظ†ظٹ ط£ظٹ ط´ظٹط، ط¹ظ† ط§ظ„ظ‚ظ‡ظˆط©!',en:'ًں‘‹ Hi! I\'m ًں§  Barista AI. Ask me anything about coffee!'}),'bot');
  },
  renderChips(){
    let c=document.getElementById('aiChips');
    if(!c)return;
    c.innerHTML='';
    this.chips.forEach(ch=>{
      let b=document.createElement('button');b.className='ai-chip';
      b.textContent=ch[lang]||ch.en;
      b.onclick=()=>{let inp=document.getElementById('aiInp');if(inp){inp.value=b.textContent;this.send()}};
      c.appendChild(b);
    });
  },
  toggle(){
    let p=document.getElementById('aiPanel'),b=document.getElementById('aiBtn');
    if(!p)return;
    let open=p.classList.toggle('open');
    if(open){p.style.display='flex';setTimeout(()=>{let m=document.getElementById('aiMsgs');if(m)m.scrollTop=m.scrollHeight},100)}
    else {p.style.display='none'}
    if(b)b.textContent=open?'âœ•':'ًں§ ';
  },
  async send(){
    let inp=document.getElementById('aiInp');
    if(!inp||!inp.value.trim())return;
    let q=inp.value.trim();inp.value='';
    this.addMsg(q,'user');
    this.showTyping();
    await new Promise(r=>setTimeout(r,400+Math.random()*600));
    this.hideTyping();
    let a=this.answer(q);
    this.addMsg(a,'bot');
  },
  addMsg(t,role){
    let c=document.getElementById('aiMsgs');
    if(!c)return;
    let d=document.createElement('div');d.className='ai-msg '+role;
    let txt=t;
    // Convert markdown **bold** to <strong>
    txt=txt.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
    // Convert lesson links
    txt=txt.replace(/\[\[(.+?)\]\]/g,'<a class="ai-link" href="#" onclick="rT(\'curriculum\');AI.toggle()">ًں“– $1</a>');
    d.innerHTML=txt;
    c.appendChild(d);
    c.scrollTop=c.scrollHeight;
  },
  showTyping(){
    let c=document.getElementById('aiMsgs');
    if(!c||document.querySelector('.ai-typing'))return;
    let d=document.createElement('div');d.className='ai-typing';d.id='aiTyping';
    d.innerHTML='<span></span><span></span><span></span>';
    c.appendChild(d);c.scrollTop=c.scrollHeight;
  },
  hideTyping(){
    let t=document.getElementById('aiTyping');
    if(t)t.remove();
  }
};

/* ===== Init ===== */
let _seq='', _magic='whitehands24';
document.addEventListener('keydown',function(e){
  _seq+=e.key.toLowerCase();
  if(_seq.length>_magic.length)_seq=_seq.slice(-_magic.length);
  if(_seq===_magic){_seq='';setLang(lang==='ar'?'en':'ar');to(lang==='ar'?'ًںŒگ Switched to English':'ًںŒگ طھظ… ط§ظ„طھط¨ط¯ظٹظ„ ظ„ظ„ط¹ط±ط¨ظٹط©')}
});
(function(){
  initLoading();
  initParticles();
  initSmoothScroll();
  initFirebase();
  let ua = navigator.language || navigator.userLanguage || 'en';
  setLang(ua.startsWith('ar') ? 'ar' : 'en');
  // If Firebase is not configured, use offline localStorage mode
  if(!firebaseReady){
    let u=getCurUser();
    updateHeaderUser();
    if(!u||u.role==='pending'||u.role==='banned'){
      if(u&&u.role==='banned') localStorage.removeItem('wha_curUser');
      showAuth(); initUI(); return;
    }
    rT('home'); initUI();
  } else {
    setTimeout(() => {
      if(!curUser){ showAuth(); initUI(); return }
      updateHeaderUser();
      rT('home'); initUI();
    }, 200);
  }
})();
