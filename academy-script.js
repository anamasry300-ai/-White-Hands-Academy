/* ===== WHITE HANDS ACADEMY ===== */

let lang = 'ar';
let curTab = '';
let ambientAudio = null;

/* ===== Firebase Configuration ===== */
/* 🔥 IMPORTANT: Create a Firebase project at https://console.firebase.google.com
   1. Go to Project Settings > General > Your apps > Add app > Web
   2. Copy the config values below
   3. Enable Authentication > Sign-in method > Email/Password
   4. Create Firestore Database (start in test mode, then apply rules below)
   ⚠️ Without this, auth works in read-only offline mode */
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
    console.log('🔥 Firebase ready');
  } catch(e){ console.warn('Firebase init failed:', e); }
}

/* ===== Loading Screen ===== */
function initLoading(){
  const fill=document.getElementById('loaderFill');
  if(fill){fill.style.animation='loaderFill 1.8s ease-in-out forwards'}
  setTimeout(()=>{
    const ls=document.getElementById('loading-screen');
    if(ls){ls.classList.add('ls-hide');setTimeout(()=>{ls.style.display='none'},1000)}
  },2000);
}

/* ===== Canvas Steam Particles ===== */
function initParticles(){
  const c=document.getElementById('steam-canvas');
  if(!c) return;
  const ctx=c.getContext('2d');
  let W,H,particles=[], running=true, rafId;
  function resize(){W=c.width=Math.min(window.innerWidth,1600);H=c.height=Math.min(window.innerHeight,1200)}
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
  const pCount=Math.min(30,Math.floor(W*H/24000));
  for(let i=0;i<pCount;i++) particles.push(new Particle());
  function animate(){
    if(!running) return;
    ctx.clearRect(0,0,W,H);
    particles.forEach(p=>{p.update();p.draw()});
    rafId=requestAnimationFrame(animate);
  }
  function start(){if(!running){running=true;animate()}}
  function stop(){running=false;if(rafId){cancelAnimationFrame(rafId);rafId=null}}
  document.addEventListener('visibilitychange',()=>{document.hidden?stop():start()});
  animate();
}

/* ===== Smooth Scroll (native, no external lib) ===== */
function initSmoothScroll(){
  document.documentElement.style.scrollBehavior='smooth';
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

/* ===== Init UI Effects (tilt + magnetic) ===== */
function initUI(){
  initTilt();
  initMagnetic();
}

/* ===== Event Delegation for Navigation ===== */
document.addEventListener('click', function(e) {
  let card = e.target.closest('[data-nav]');
  if (!card) return;
  let a = card.dataset.nav;
  let lv = card.dataset.level;
  let mi = +card.dataset.mi;
  let li = +card.dataset.li;
  if (a === 'sModules') { sModules(lv); setTimeout(initUI,100) }
  else if (a === 'sModule') { sModule(lv, mi, li); setTimeout(initUI,100) }
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
  {name:{ar:'بذرة قهوة',en:'Coffee Seed'}, xp:0, ic:'🫘'},
  {name:{ar:'برعم قهوة',en:'Coffee Sprout'}, xp:100, ic:'🌱'},
  {name:{ar:'كرزة قهوة',en:'Coffee Cherry'}, xp:250, ic:'🍒'},
  {name:{ar:'بن أخضر',en:'Green Bean'}, xp:500, ic:'🟢'},
  {name:{ar:'بن محمص',en:'Roasted Bean'}, xp:800, ic:'🟤'},
  {name:{ar:'باريستا',en:'Barista'}, xp:1200, ic:'☕'},
  {name:{ar:'ماستر قهوة',en:'Coffee Master'}, xp:1700, ic:'👑'},
  {name:{ar:'معتمد SCA',en:'SCA Certified'}, xp:2300, ic:'🎓'},
  {name:{ar:'أسطورة قهوة',en:'Coffee Legend'}, xp:3000, ic:'🏆'}
];
const BADGE_DEFS = [
  {id:'first_lesson',ic:'🌱',name:{ar:'أول درس',en:'First Lesson'},desc:{ar:'أكمل أول درس لك',en:'Complete your first lesson'}},
  {id:'streak_5',ic:'🔥',name:{ar:'5 أيام متتالية',en:'5-Day Streak'},desc:{ar:'سجل الدخول 5 أيام متتالية',en:'Login 5 days in a row'}},
  {id:'module_master',ic:'📚',name:{ar:'أستاذ الوحدة',en:'Module Master'},desc:{ar:'أكمل كل دروس وحدة',en:'Complete all lessons in a module'}},
  {id:'exam_perfect',ic:'💯',name:{ar:'درجة كاملة',en:'Perfect Score'},desc:{ar:'احصل على 10/10 في أي اختبار',en:'Get 10/10 on any exam'}},
  {id:'level_a',ic:'🎓',name:{ar:'خريج مستوى A',en:'Level A Graduate'},desc:{ar:'اجتاز اختبار المستوى A',en:'Pass Level A exam'}},
  {id:'level_b',ic:'🎓',name:{ar:'خريج مستوى B',en:'Level B Graduate'},desc:{ar:'اجتاز اختبار المستوى B',en:'Pass Level B exam'}},
  {id:'level_c',ic:'🎓',name:{ar:'خريج مستوى C',en:'Level C Graduate'},desc:{ar:'اجتاز اختبار المستوى C',en:'Pass Level C exam'}},
  {id:'speed_learner',ic:'⚡',name:{ar:'متسابق',en:'Speed Learner'},desc:{ar:'أكمل 5 دروس في يوم واحد',en:'Complete 5 lessons in one day'}},
  {id:'all_rounder',ic:'🏆',name:{ar:'شامل',en:'All-Rounder'},desc:{ar:'أكمل كل دروس الأكاديمية',en:'Complete all academy lessons'}},
  {id:'true_master',ic:'👑',name:{ar:'المعلم الحقيقي',en:'True Master'},desc:{ar:'اجتاز كل الاختبارات بـ 10/10',en:'Pass all exams with 10/10'}}
];

/* --- User Data Management (Firebase) --- */
let curUser = null;
const ADMIN_EMAIL = 'ana.masry300@gmail.com';
let _myIP = '';
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
  if(!db) return getLocalUsers().filter(u=>u.role!=='admin');
  try {
    let snap = await db.collection('users').get();
    let arr=[];
    snap.forEach(d=>{let d2=d.data(); if(d2.role!=='admin') arr.push({id:d.id,...d2})});
    return arr;
  } catch(e){console.error('Firestore get all err',e); return []}
}
async function getPendingUsersFromFirestore(){
  if(!db) return getLocalUsers().filter(u=>u.role==='pending');
  try {
    let snap = await db.collection('users').where('role','==','pending').get();
    let arr=[];
    snap.forEach(d=>arr.push({id:d.id,...d.data()}));
    return arr;
  } catch(e){console.error('Firestore get pending err',e); return []}
}
function getLocalUsers(){
  try { return JSON.parse(localStorage.getItem('wha_users')||'[]') } catch(e){return []}
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
function clearOldSessions(){
  try { localStorage.removeItem('wha_curUser') } catch(e){}
}
function saveCurUser(u){
  if(!u) return;
  curUser = u;
  try { localStorage.setItem('wha_curUser', JSON.stringify(u)) } catch(e){}
  if(db && u.id) saveUserToFirestore(u.id, u);
}
function isAdmin(){ return curUser && curUser.role==='admin' }
async function registerUser(name,email,pass){
  if(!name||!email||!pass) return {err:__({ar:'جميع الحقول مطلوبة',en:'All fields required'})};
  // Offline mode (no Firebase)
  if(!firebaseReady){
    let users = JSON.parse(localStorage.getItem('wha_users')||'[]');
    if(users.find(u=>u.email===email.trim().toLowerCase())) return {err:__({ar:'البريد مسجل بالفعل',en:'Email already registered'})};
    if(pass.length<3) return {err:__({ar:'كلمة المرور قصيرة جداً',en:'Password too short'})};
    let e=email.trim().toLowerCase();
    let isAdminEmail = e===ADMIN_EMAIL;
    let isFirst = users.length===0;
    let u = {
      id:'u_'+Date.now(), name:name.trim(), email:e, role:isAdminEmail?'admin':(isFirst?'admin':'pending'),
      xp:0, streak:0, lastLogin:'', levelIdx:0, completedLessons:[], completedModules:[],
      passedExams:[], badges:[], perfectScores:[], joinDate:todayStr(), lessonTimestamps:[]
    };
    if(isFirst){ saveCurUser(u); }
    users.push(u);
    localStorage.setItem('wha_users', JSON.stringify(users));
    if(isFirst) return {ok:true, u, msg:__({ar:'🎉 تم إنشاء حساب المسؤول!',en:'🎉 Admin account created!'})};
    return {pending:true, msg:__({ar:'📋 تم التسجيل! في انتظار موافقة المشرف.',en:'📋 Registered! Waiting for admin approval.'})};
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
      return {ok:true, u:newU, msg:__({ar:'🎉 تم إنشاء حساب المسؤول! أنت أول مستخدم.',en:'🎉 Admin account created! You are the first user.'})};
    }
    await firebase.auth().signOut();
    curUser = null;
    return {ok:true, pending:true, msg:__({ar:'📋 تم التسجيل! في انتظار موافقة المشرف.',en:'📋 Registered! Waiting for admin approval.'})};
  } catch(e){
    let msg = e.code === 'auth/email-already-in-use' ? __('@:البريد مسجل بالفعل','Email already registered') :
              e.code === 'auth/weak-password' ? __('@:كلمة المرور ضعيفة (6 أحرف على الأقل)','Password too weak (6+ chars)') :
              __('@:خطأ في التسجيل','Registration failed');
    return {err: msg};
  }
}
async function loginUser(email,pass){
  // Offline mode (no Firebase)
  if(!firebaseReady){
    if(!email||!pass) return {err:__({ar:'البريد وكلمة المرور مطلوبان',en:'Email and password required'})};
    let users = JSON.parse(localStorage.getItem('wha_users')||'[]');
    let u = users.find(x=>x.email===email.trim().toLowerCase());
    if(!u) return {err:__({ar:'البريد غير مسجل',en:'Email not found'})};
    if(u.role==='banned') return {err:__({ar:'🚫 تم حظر حسابك.',en:'🚫 Your account has been banned.'})};
    if(u.role==='pending' && u.email!==ADMIN_EMAIL) return {err:__({ar:'⏳ حسابك قيد المراجعة.',en:'⏳ Account pending review.'})};
    if(u.email===ADMIN_EMAIL && u.role!=='admin'){u.role='admin';localStorage.setItem('wha_users',JSON.stringify(JSON.parse(localStorage.getItem('wha_users')||'[]').map(x=>x.id===u.id?u:x)))}
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
    if(!u) return {err:__({ar:'خطأ في تحميل البيانات',en:'Error loading profile'})};
    if(u.role==='banned'){ await firebase.auth().signOut(); curUser=null; return {err:__({ar:'🚫 تم حظر حسابك.',en:'🚫 Your account has been banned.'})}; }
    if(u.role==='pending'){ await firebase.auth().signOut(); curUser=null; return {err:__({ar:'⏳ حسابك قيد المراجعة.',en:'⏳ Account pending review.'})}; }
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
              __('@:بريد أو كلمة مرور غير صحيحة','Invalid email or password') :
              __('@:خطأ في تسجيل الدخول','Login failed');
    return {err: msg};
  }
}
async function logoutUser(){
  try { await firebase.auth().signOut() } catch(e){}
  if(!firebaseReady) localStorage.removeItem('wha_curUser');
  curUser = null;
}
async function approveUser(id){
  if(!id) return false;
  if(!db) return localUpdateUser(id,{role:'active'});
  try { await db.collection('users').doc(id).update({role:'active'}); return true } catch(e){return false}
}
async function rejectUser(id){
  if(!id) return false;
  if(!db) return localDeleteUser(id);
  try { await db.collection('users').doc(id).delete(); return true } catch(e){return false}
}
async function banUser(id){
  if(!id) return false;
  if(!db) return localUpdateUser(id,{role:'banned'});
  try { await db.collection('users').doc(id).update({role:'banned'}); return true } catch(e){return false}
}
async function unbanUser(id){
  if(!id) return false;
  if(!db) return localUpdateUser(id,{role:'active'});
  try { await db.collection('users').doc(id).update({role:'active'}); return true } catch(e){return false}
}
function localUpdateUser(id,data){
  try {
    let all=JSON.parse(localStorage.getItem('wha_users')||'[]');
    let idx=all.findIndex(x=>x.id===id);
    if(idx<0) return false;
    Object.assign(all[idx],data);
    localStorage.setItem('wha_users',JSON.stringify(all));
    return true;
  } catch(e){return false}
}
function localDeleteUser(id){
  try {
    let all=JSON.parse(localStorage.getItem('wha_users')||'[]');
    let idx=all.findIndex(x=>x.id===id);
    if(idx<0) return false;
    all.splice(idx,1);
    localStorage.setItem('wha_users',JSON.stringify(all));
    return true;
  } catch(e){return false}
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
    __({ar:'تسجيل الدخول',en:'Login'})+'</button><button class="auth-tab" id="authTabReg" onclick="showAuthForm(\'reg\')">'+
    __({ar:'إنشاء حساب',en:'Register'})+'</button></div>'+
    '<div id="authBody">'+
    '<div class="auth-ic floating">☕</div>'+
    '<h2>'+__({ar:'مرحباً بك في الأكاديمية',en:'Welcome to the Academy'})+'</h2>'+
    '<p class="auth-p">'+__({ar:'سجل الدخول لمتابعة تقدمك أو أنشئ حساباً جديداً',en:'Login to track progress or create a new account'})+'</p>'+
    '<div id="authFields"><div class="auth-field"><input type="text" id="authName" placeholder="'+__({ar:'الاسم',en:'Name'})+'" autocomplete="name"></div>'+
    '<div class="auth-field"><input type="email" id="authEmail" placeholder="'+__({ar:'البريد الإلكتروني',en:'Email'})+'" autocomplete="email"></div>'+
    '<div class="auth-field"><input type="password" id="authPass" placeholder="'+__({ar:'كلمة المرور',en:'Password'})+'" autocomplete="current-password" onkeydown="if(event.key===\'Enter\')doAuth()"></div>'+
    '<div class="auth-err" id="authErr"></div>'+
    '<button class="btn btn-accent magnetic-btn" onclick="doAuth()" style="width:100%">'+__({ar:'دخول',en:'Login'})+' 🔓</button></div></div></div>';
  document.body.insertBefore(ov,document.body.firstChild);
  setTimeout(()=>{let el=$('authEmail');if(el)el.focus()},150);
}
function showAuthForm(mode){
  $('authTabLogin').classList.toggle('act',mode==='login');
  $('authTabReg').classList.toggle('act',mode==='reg');
  let btn=$('authBody').querySelector('.btn-accent');
  if(mode==='reg'){
    $('authName').style.display='block';
    btn.textContent=__({ar:'تسجيل',en:'Register'})+ ' 🚀';
    $('authBody').querySelector('h2').textContent=__({ar:'إنشاء حساب جديد',en:'Create Account'});
    $('authBody').querySelector('.auth-p').textContent=__({ar:'سجل حسابك — أول مسؤول يوافق على الطلبات الجديدة',en:'Register — admin must approve new accounts'});
  } else {
    $('authName').style.display='none';
    btn.textContent=__({ar:'دخول',en:'Login'})+ ' 🔓';
    $('authBody').querySelector('h2').textContent=__({ar:'مرحباً بعودتك',en:'Welcome Back'});
    $('authBody').querySelector('.auth-p').textContent=__({ar:'سجل الدخول لمتابعة تقدمك',en:'Login to continue your progress'});
  }
}
async function doAuth(){
  let isReg=$('authTabReg').classList.contains('act');
  let email=$('authEmail'), pass=$('authPass'), err=$('authErr');
  let btn=$('authBody').querySelector('.btn-accent');
  if(btn){btn.disabled=true;btn.textContent='⏳...'}
  if(isReg){
    let name=$('authName'), r=await registerUser(name.value,email.value,pass.value);
    if(r.err){err.textContent=r.err;err.style.display='block';if(btn){btn.disabled=false;btn.textContent=__({ar:'تسجيل',en:'Register'})+' 🚀'};return}
    if(r.pending){
      err.innerHTML=r.msg;err.style.display='block';err.style.color='var(--accent-dark)';
      err.style.background='rgba(201,168,76,.1)';
      if(pass)pass.value='';if(name)name.value='';email.value='';
      if(btn){btn.disabled=false;btn.textContent=__({ar:'تسجيل',en:'Register'})+' 🚀'}
      return;
    }
    finishAuth(r.u,false,r.msg);
  } else {
    let r=await loginUser(email.value,pass.value);
    if(r.err){err.textContent=r.err;err.style.display='block';if(pass)pass.value='';if(btn){btn.disabled=false;btn.textContent=__({ar:'دخول',en:'Login'})+' 🔓'};return}
    finishAuth(r.u,r.streakBonus);
  }
}
function finishAuth(u,streakBonus,msg){
  let ov=$('authOverlay');if(ov)ov.remove();
  saveCurUser(u);
  // Save admin IP for access control
  if(u.role==='admin' && !firebaseReady){
    fetch('https://ip-api.com/json/?fields=query&t='+Date.now()).then(r=>r.json()).then(d=>{
      if(d.query){localStorage.setItem('wha_admin_ip',d.query)}
    }).catch(()=>{});
  }
  if(msg) to(msg);
  else if(streakBonus) to('🔥 '+__({ar:'مكافأة تسجيل الدخول: +'+XP_REWARDS.streak+' XP',en:'Login streak bonus: +'+XP_REWARDS.streak+' XP'}));
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
    el.innerHTML='<button class="lang-btn" onclick="showAuth()" style="opacity:.7">🔐</button>';
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
  A0:'photo-1509042239860-f550ce710b93',A1:'photo-1509042239860-f550ce710b93',
  A2:'photo-1509042239860-f550ce710b93',A3:'photo-1509042239860-f550ce710b93',
  B1:'photo-1509042239860-f550ce710b93',B2:'photo-1509042239860-f550ce710b93',
  B3:'photo-1509042239860-f550ce710b93',C1:'photo-1509042239860-f550ce710b93',
  C2:'photo-1509042239860-f550ce710b93',C3:'photo-1509042239860-f550ce710b93',
  espresso:'photo-1509042239860-f550ce710b93',latte:'photo-1509042239860-f550ce710b93',
  roast:'photo-1509042239860-f550ce710b93',beans:'photo-1509042239860-f550ce710b93',
  cherry:'photo-1509042239860-f550ce710b93',journey:'photo-1509042239860-f550ce710b93',
  map:'photo-1509042239860-f550ce710b93',v60:'photo-1509042239860-f550ce710b93',
  coldbrew:'photo-1509042239860-f550ce710b93',water:'photo-1509042239860-f550ce710b93',
  cupping:'photo-1509042239860-f550ce710b93',cafe:'photo-1509042239860-f550ce710b93',
  team:'photo-1509042239860-f550ce710b93',barista:'photo-1509042239860-f550ce710b93',
  j0:'photo-43TgMa9BHx4',j1:'photo-5xbU5RNRv2g',
  j2:'photo-gYpKyYFdmi8',j3:'photo-JNUELX786BU',
  j4:'photo-62TP7LH9Rqs',j5:'photo-VECTbwTSFIo',
  j6:'photo-N_1lnzUYuAs',j7:'photo-_eaVhum3Tpg',
  j8:'photo-wWwbGb2QipM',j9:'photo-AQTgvFfwOcg',
  j10:'photo-srKIaH_zj98',
   farm:'photo-1509042239860-f550ce710b93',
   roastery:'photo-1509042239860-f550ce710b93',
   beans_tree:'photo-1509042239860-f550ce710b93',
   processing:'photo-1509042239860-f550ce710b93',
   blossom:'photo-1509042239860-f550ce710b93',
   grinder:'photo-1509042239860-f550ce710b93',
   brew:'photo-1509042239860-f550ce710b93',
   aerial:'photo-1509042239860-f550ce710b93',
   sustainability:'photo-1509042239860-f550ce710b93',
   barista_work:'photo-1509042239860-f550ce710b93',
   coffee_bags:'photo-1509042239860-f550ce710b93',
   coffee_shop:'photo-1509042239860-f550ce710b93',
   filter:'photo-1509042239860-f550ce710b93',
   moka:'photo-1509042239860-f550ce710b93',
   aroma:'photo-1509042239860-f550ce710b93',
   plantation:'photo-1509042239860-f550ce710b93',
   fresh_roast:'photo-1509042239860-f550ce710b93',
   lab:'photo-1509042239860-f550ce710b93',
   harvest:'photo-1509042239860-f550ce710b93',
   cup:'photo-1509042239860-f550ce710b93',
   chemex:'photo-1509042239860-f550ce710b93',
   kaldy:'photo-1509042239860-f550ce710b93',
   turkish:'photo-1509042239860-f550ce710b93',
   ethiopian:'photo-1509042239860-f550ce710b93',
   ethiopian_ceremony:'photo-1509042239860-f550ce710b93',
   turkish_delight:'photo-1509042239860-f550ce710b93',
   turkish_cup:'photo-1509042239860-f550ce710b93',
   ottoman_cafe:'photo-1509042239860-f550ce710b93',
   kaldy_monk:'photo-1509042239860-f550ce710b93',
   mecca_cafe:'photo-1509042239860-f550ce710b93',
    coffee_timeline:'photo-1509042239860-f550ce710b93',
    cappuccino:'photo-1509042239860-f550ce710b93',
    mocha_drink:'photo-1509042239860-f550ce710b93',
    macchiato:'photo-1509042239860-f550ce710b93',
    flatwhite:'photo-1509042239860-f550ce710b93',
    affogato:'photo-1509042239860-f550ce710b93'
  };
// Local image path builder — checks images/ folder first, falls back to Unsplash
const LOCAL_IMGS=new Set(['A0','A1','A2','A3','aerial','affogato','aroma','B1','B2','B3','barista','barista_work','beans','beans_tree','bezzera_patent','blossom','brazil_smuggle','brew','C1','C2','C3','cafe','cappuccino','chemex','cherry','coffee_bags','coffee_map','coffee_shop','coffee_story','coffee_timeline','coldbrew','comparison','cortado','cup','cupping','espresso','espresso_gen','espresso_mod','espresso_success','ethiopian','ethiopian_ceremony','farm','filter','flatwhite','fresh_roast','gaggia_lever','grinder','harvest','j0','j1','j10','j2','j3','j4','j5','j6','j7','j8','j9','journey','kaldy','kaldy_monk','lab','latte','macchiato','map','mecca_cafe','mocha_drink','moka','ottoman_cafe','plantation','processing','processing_methods','roast','roastery','sustainability','team','turkish','turkish_cup','turkish_delight','v60','vienna_siege','water']);
function imgPath(key,w=600,q=80){
  if(LOCAL_IMGS.has(key)) return 'images/'+key+'.jpg';
  let id=PHOTOS[key]||'photo-1509042239860-f550ce710b93';
  return 'https://images.unsplash.com/'+id+'?w='+w+'&q='+q+'&auto=format'
}
function photo(key){return imgPath(key,800,80)}
function photoSmall(key){return imgPath(key,600,80)}





















/* ===== DATA ===== */

const LV = {
  A:{id:'A',name:{ar:'مبتدئ',en:'Foundation'},ic:'🌱',cl:'#1a8a3e',bgCl:'lv-a',desc:{ar:'اكتشف عالم القهوة من البداية',en:'Discover coffee from the beginning'}},
  B:{id:'B',name:{ar:'محترف',en:'Professional'},ic:'🔥',cl:'#d97706',bgCl:'lv-b',desc:{ar:'تعمق في علوم القهوة المتقدمة',en:'Deep dive into advanced coffee science'}},
  C:{id:'C',name:{ar:'ماستر',en:'Master'},ic:'👑',cl:'#7c3aed',bgCl:'lv-c',desc:{ar:'أتقن فن إدارة المقهى والتقييم الحسي',en:'Master cafe management & sensory evaluation'}}
};

/* ===== Deep Lesson Content ===== */

const L = {};

L['A0-0'] = {
  ar: `
<div class="hl" style="background:linear-gradient(135deg,rgba(33,150,243,.08),rgba(33,150,243,.02));border:1px solid rgba(33,150,243,.15);padding:18px 22px;border-radius:12px;text-align:center">
<h3 style="color:#90caf9;margin-bottom:6px">🌍 رحلة القهوة — من البذرة إلى الفنجان</h3>
<p style="color:#b0bec5;font-size:.9rem">The Coffee Journey — From Seed to Cup</p>
</div>
<p>قبل ما نغوص في التفاصيل، خلينا ناخد <strong>نظرة شاملة</strong> على رحلة حبة القهوة من شجرة البن في الجبال الإثيوبية إلى الفنجان اللي بين أيديك. كل خطوة في الرحلة لها <strong>علمها وفنها</strong> — وهذي الأكاديمية كلها مبنية عشان تفهم كل خطوة بعمق.</p>
<h3>☕ الرحلة باختصار</h3>
<table><tr><th>#</th><th>المرحلة</th><th>Stage</th><th>المدة التقريبية</th></tr>
<tr><td>1</td><td>🌱 زراعة البن (Coffee Farming)</td><td>Farming</td><td>3-4 سنوات حتى أول حصاد</td></tr>
<tr><td>2</td><td>🍒 الحصاد (Harvesting)</td><td>Harvesting</td><td>موسم واحد + 2-3 قطفات</td></tr>
<tr><td>3</td><td>🧪 المعالجة (Processing)</td><td>Processing</td><td>10-30 يوم</td></tr>
<tr><td>4</td><td>🏭 الطحن والتصدير (Milling & Export)</td><td>Milling</td><td>1-3 أشهر</td></tr>
<tr><td>5</td><td>🔥 التحميص (Roasting)</td><td>Roasting</td><td>8-15 دقيقة</td></tr>
<tr><td>6</td><td>⚙️ الطحن (Grinding)</td><td>Grinding</td><td>ثوانٍ — لحظات</td></tr>
<tr><td>7</td><td>☕ التحضير (Brewing)</td><td>Brewing</td><td>2-5 دقائق</td></tr>
<tr><td>8</td><td>👅 التذوق (Tasting)</td><td>Tasting</td><td>لحظات من المتعة</td></tr></table>
<h3>🌱 1. زراعة البن — Coffee Farming</h3>
<p>القهوة تنمو في <strong>حزام البن</strong> (Bean Belt) — المنطقة بين مداري السرطان والجدي. أفضل أنواع البن تنمو على <strong>ارتفاعات 1200-2000 متر</strong>، في تربة غنية وحرارة 15-24°م. شجرة البن تحتاج 3-4 سنوات لتثمر أول محصول. الزهرة البيضاء (تسمى "قهوة" في اليمن) تتحول إلى <strong>الكرزة الحمراء (Coffee Cherry)</strong> بعد 6-9 أشهر.</p>
<div class="img-c"><img src="${photo('comparison')}" alt="" loading="lazy"><div class="cap">🌱 حزام البن العالمي — بين مداري السرطان والجدي</div></div>


<h3>🍒 2. الحصاد — Harvesting</h3>
<p>القطف اليدوي هو <strong>أفضل طريقة للحصاد</strong> — يختار العمال الكرزات الحمراء الناضجة فقط. تحتاج شجرة بن واحدة 3-4 قطفات في الموسم لأن الكرزات لا تنضج معاً. كل عامل يجمع 50-100 كجم كرز يومياً — تتحول إلى 10-20 كجم بن أخضر فقط.</p>
<h3>🧪 3. المعالجة — Processing</h3>
<p>بعد الحصاد، يُفصل البن عن الكرزة خلال <strong>ساعات</strong> لتجنب التخمر غير المرغوب. ثلاث طرق رئيسية:</p>
<p>• <strong>المعالجة الطبيعية (Natural):</strong> تجفف الكرزات كاملة بالشمس — نكهات فاكهية، حلاوة عالية<br>• <strong>المعالجة المغسولة (Washed):</strong> يُنزع القشر واللب قبل التجفيف — نكهات نظيفة، حموضة مشرقة<br>• <strong>معالجة العسل (Honey):</strong> يُنزع القشر ويترك بعض اللب — نكهات وسط بين الطبيعي والمغسول</p>
<div class="hl"><strong>📊 معلومة:</strong> الكرزة الواحدة تحتوي على بذرتين (حبتين بن) في العادة — منهما يصنع فنجان واحد. كل شجرة بن تنتج حوالي <strong>500 جرام بن أخضر</strong> سنوياً — تكفي لـ 40-50 فنجان.</div>
<h3>🏭 4. الطحن والتصدير — Milling & Export</h3>
<p>بعد المعالجة، يمر البن بمرحلة <strong>الطحن الجاف (Dry Milling)</strong> لإزالة القشرة الداخلية (Parchment). ثم يُفرز حسب الحجم والكثافة واللون — الحبات المعيبة تُرفض. يُعبأ البن الأخضر في أكياس 60-70 كجم للتصدير. <strong>البن الأخضر يحتفظ بنضارته لمدة 12 شهراً</strong> في ظروف تخزين جيدة.</p>
<h3>🔥 5. التحميص — Roasting</h3>
<p>التحميص هو <strong>قلب صناعة القهوة المختصة</strong>. البن الأخضر لا طعم له — الحرارة تحول النشويات والسكريات إلى <strong>أكثر من 800 مركب عطري</strong>. درجات التحميص: فاتح (حموضة، نكهات أصلية) → متوسط (توازن) → داكن (قوام ثقيل، مرة). مدة التحميص: 8-15 دقيقة على درجة 180-240°م.</p>
<h3>⚙️ 6. الطحن — Grinding</h3>
<p>الطحن يحدد <strong>سرعة الاستخلاص</strong>. الطحن الناعم (إسبريسو) = استخلاص سريع. الطحن الخشن (French Press) = استخلاص بطيء. التوحيد في حجم الطحن هو <strong>سر الاتساق</strong> — الطواحين المخروطية (Conical Burr) أفضل من الطواحين الشفرية. <strong>البن المطحون يفقد نكهته في 15 دقيقة</strong> — اطحن قبل التحضير مباشرة!</p>
<h3>☕ 7. التحضير — Brewing</h3>
<p>الهدف: استخلاص <strong>18-22%</strong> من وزن البن المطحون (Extraction Yield) في الماء. كل طريقة لها وقت ونسبة ودرجة حرارة مثالية. الإسبريسو: 9 بار، 92-96°م، 25-30 ثانية. V60: 92-96°م، 2:30-3:00 دقيقة. French Press: 4 دقائق. Cold Brew: 12-24 ساعة.</p>
<h3>👅 8. التذوق — Tasting</h3>
<p>التذوق الاحترافي (Cupping) هو <strong>أداة مراقبة الجودة</strong>. يقيم البن حسب: العطر (Aroma)، النكهة (Flavor)، الحموضة (Acidity)، القوام (Body)، الطعم المتبقي (Aftertaste)، التوازن (Balance). أفضل بن في العالم يحصل على 90+ نقطة من SCA — سعره يصل إلى $100+ للكيلو.</p>
<div class="ok-box"><strong>🎯 الخلاصة:</strong> رحلة البن من البذرة للفنجان تأخذ <strong>3-5 سنوات وفيه 8 خطوات رئيسية</strong>. كل خطوة تؤثر على النكهة النهائية. فهم هذه الرحلة هو <strong>الفرق بين الباريستا العادي والمحترف</strong>. الأكاديمية دي هتاخدك في كل خطوة بالتفصيل — استعد!</div>
`,
  en: `
<div class="hl" style="background:linear-gradient(135deg,rgba(33,150,243,.08),rgba(33,150,243,.02));border:1px solid rgba(33,150,243,.15);padding:18px 22px;border-radius:12px;text-align:center">
<h3 style="color:#90caf9;margin-bottom:6px">🌍 The Coffee Journey — From Seed to Cup</h3>
<p style="color:#b0bec5;font-size:.9rem">رحلتنا مع القهوة — من البذرة إلى الفنجان</p>
</div>
<p>Before we dive into details, let's take a <strong>big-picture view</strong> of the coffee bean's journey — from the tree in Ethiopian highlands to the cup in your hand. Every step has its <strong>science and art</strong> — this entire academy is built to help you understand each step in depth.</p>
<h3>☕ The Journey in Brief</h3>
<table><tr><th>#</th><th>Stage</th><th>المرحلة</th><th>Approx. Duration</th></tr>
<tr><td>1</td><td>🌱 Coffee Farming</td><td>زراعة</td><td>3-4 years to first harvest</td></tr>
<tr><td>2</td><td>🍒 Harvesting</td><td>حصاد</td><td>1 season + 2-3 rounds</td></tr>
<tr><td>3</td><td>🧪 Processing</td><td>معالجة</td><td>10-30 days</td></tr>
<tr><td>4</td><td>🏭 Milling & Export</td><td>طحن وتصدير</td><td>1-3 months</td></tr>
<tr><td>5</td><td>🔥 Roasting</td><td>تحميص</td><td>8-15 minutes</td></tr>
<tr><td>6</td><td>⚙️ Grinding</td><td>طحن</td><td>Seconds</td></tr>
<tr><td>7</td><td>☕ Brewing</td><td>تحضير</td><td>2-5 minutes</td></tr>
<tr><td>8</td><td>👅 Tasting</td><td>تذوق</td><td>Moments of pleasure</td></tr></table>
<h3>🌱 1. Coffee Farming</h3>
<p>Coffee grows in the <strong>Bean Belt</strong> — between the Tropics of Cancer and Capricorn. The best coffee grows at <strong>1200-2000m altitude</strong>, in rich soil with 15-24°C temperatures. A coffee tree takes 3-4 years to produce its first crop. The white flower (called "qahwa" in Yemen) turns into the <strong>red coffee cherry</strong> after 6-9 months.</p>
<div class="img-c"><img src="${photo('comparison')}" alt="" loading="lazy"><div class="cap">🌱 The Coffee Bean Belt — Between the Tropics</div></div>
<h3>🍒 2. Harvesting</h3>
<p>Hand-picking is the <strong>best harvesting method</strong> — workers select only ripe red cherries. A single tree needs 3-4 pickings per season since cherries ripen unevenly. Each worker collects 50-100kg of cherries daily — yielding only 10-20kg of green beans.</p>
<h3>🧪 3. Processing</h3>
<p>After harvest, beans must be separated from the cherry <strong>within hours</strong> to prevent unwanted fermentation. Three main methods:</p>
<p>• <strong>Natural (Dry):</strong> Whole cherries dried in sun — fruity flavors, high sweetness<br>• <strong>Washed (Wet):</strong> Skin and pulp removed before drying — clean flavors, bright acidity<br>• <strong>Honey (Pulped Natural):</strong> Skin removed, some pulp left — middle-ground flavors</p>
<div class="hl"><strong>📊 Fact:</strong> Each cherry typically contains 2 beans — enough for one cup. A single tree produces about <strong>500g green beans</strong> annually — enough for 40-50 cups.</div>
<h3>🏭 4. Milling & Export</h3>
<p>After processing, beans go through <strong>dry milling</strong> to remove the parchment layer, then sorted by size, density, and color — defective beans are rejected. Green beans are packed in 60-70kg bags for export. <strong>Green beans stay fresh for 12 months</strong> in proper storage.</p>
<h3>🔥 5. Roasting</h3>
<p>Roasting is the <strong>heart of specialty coffee</strong>. Green beans have no flavor — heat transforms starches and sugars into <strong>over 800 aromatic compounds</strong>. Roast levels: Light (acidity, origin flavors) → Medium (balance) → Dark (heavy body, bitter). Duration: 8-15 minutes at 180-240°C.</p>
<h3>⚙️ 6. Grinding</h3>
<p>Grind size determines <strong>extraction speed</strong>. Fine grind (espresso) = fast extraction. Coarse grind (French Press) = slow extraction. Consistency in particle size is the <strong>secret to consistency</strong> — conical burr grinders are best. <strong>Ground coffee loses flavor in 15 minutes</strong> — grind just before brewing!</p>
<h3>☕ 7. Brewing</h3>
<p>The goal: extract <strong>18-22%</strong> of ground coffee weight (Extraction Yield) into water. Each method has ideal time, ratio, and temperature. Espresso: 9 bar, 92-96°C, 25-30 seconds. V60: 92-96°C, 2:30-3:00 min. French Press: 4 min. Cold Brew: 12-24 hours.</p>
<h3>👅 8. Tasting</h3>
<p>Professional tasting (Cupping) is the <strong>quality control tool</strong>. Coffee is evaluated on: Aroma, Flavor, Acidity, Body, Aftertaste, Balance. The world's best coffee scores 90+ points from SCA — selling for $100+/kg.</p>
<div class="ok-box"><strong>🎯 Summary:</strong> The coffee journey from seed to cup takes <strong>3-5 years with 8 key stages</strong>. Every step affects the final flavor. Understanding this journey is the <strong>difference between an average and a professional barista</strong>. This academy will take you through every step in detail — get ready!</div>
`
};

L['A1-0'] = {
  ar: `
<div class="img-c"><img src="${photo('coffee_story')}" alt="" loading="lazy"><div class="cap">📜 رحلة القهوة عبر التاريخ — من إثيوبيا إلى العالم</div></div>
<h3>📖 قصة اكتشاف القهوة — أسطورة كلد</h3>
<p>تروي الأسطورة الإثيوبية أن راعياً اسمه <strong>كلد (Kaldi)</strong> كان يرعى أغنامه في مرتفعات إقليم <strong>كافا (Kaffa)</strong> جنوب غرب إثيوبيا، حوالي القرن التاسع الميلادي. لاحظ كلد أن أغنامه أصبحت <strong>نشيطة بشكل غير عادي</strong> بعد أن أكلت ثماراً حمراء من شجرة غريبة. كانت تقفز وتركض بحيوية لم يسبق لها مثيل.</p>
<div class="img-c"><img src="${photo('kaldy')}" alt="" loading="lazy"><div class="cap">🐐 كلد يلاحظ أغنامه ترقص — أول لحظة اكتشاف القهوة</div></div>
<p>قرر كلد تجربة الثمار بنفسه، وشعر فوراً <strong>بانتعاش وتيقظ</strong> لم يعهدهما من قبل. أخذ بعض الثمار إلى <strong>الدير المجاور</strong>، حيث استقبله الرهبان بشك. لكنهم بعد تجربة الثمار، وجدوا أنها تساعدهم على السهر في الصلاة والعبادة طوال الليل. هكذا، حسب الأسطورة، بدأت رحلة القهوة مع البشرية.</p>
<div class="img-c"><img src="${photo('kaldy_monk')}" alt="" loading="lazy"><div class="cap">🐐 كلد عند الدير — القهوة تصل إلى الرهبان</div></div>
<h3>🌿 طقوس القهوة الإثيوبية — تراث حي</h3>
<p>في إثيوبيا اليوم، لا تزال <strong>طقوس القهوة (Buna Tetu)</strong> تمارس في كل بيت وقرية. عملية تحضير تستغرق ساعتين: تُحمص الحبوب الخضراء على النار في مقلاة مسطحة حتى تتصاعد رائحة البخور، ثم تطحن بقذائف الهاون، وتغلى في الإبريق الفخاري التقليدي (الجبانة). تُقدم للأب الروحي أولاً ثم للضيوف حسب الأهمية. الطقس يتكرر ثلاث مرات — الجولة الأولى تسمى "أوّل"، والثانية "كالى"، والثالثة "بركة". هذه الطقوس جسدت ثقافة الضيافة الإثيوبية لأكثر من ألف عام.</p>
<h3>📜 الأدلة التاريخية — الحقيقة والخرافة</h3>
<p>على الرغم من شهرة أسطورة كلد، فإن <strong>أقدم الأدلة التاريخية الموثقة</strong> عن شرب القهوة تعود إلى <strong>اليمن في القرن الخامس عشر</strong>. كان الصوفيون اليمنيون يستخدمون القهوة (التي أسموها "القَهْوَة") للبقاء مستيقظين أثناء الذكر والعبادة الليلية. انتقلت القهوة من اليمن إلى مكة، ثم القاهرة، فدمشق، واسطنبول.</p>
<p><strong>انتشار القهوة في العالم الإسلامي</strong> كان سريعاً بفضل الحجاج والتجار. بحلول عام 1500، كانت القهوة معروفة في كل المدن الكبرى في العالم الإسلامي — من مكة إلى القاهرة، من دمشق إلى حلب. افتتحت المقاهي وأصبحت مراكز للموسيقى والشعر والنقاش السياسي، مما أثار مخاوف الحكام أحياناً. في القاهرة، كانت تسمى "مقاهي العلم" لكونها ملتقى العلماء والطلاب.</p>
<div class="hl"><strong>📊 التسلسل الزمني:</strong><br>• القرن 9: الأسطورة الإثيوبية (كلد)<br>• 1000-1400: انتشار شرب القهوة في القبائل الإثيوبية<br>• 1400-1450: الصوفيون في اليمن يشربون القهوة<br>• 1511: أول محاولة لمنع القهوة في مكة<br>• 1550: انتشار المقاهي في القاهرة واسطنبول<br>• 1615: وصول القهوة إلى أوروبا (البندقية)<br>• 1652: أول مقهى في لندن<br>• 1683: أول مقهى في فيينا بعد حصار الأتراك<br>• 1727: نقل البن إلى البرازيل<br>• 1901: أول ماكينة إسبريسو (بزيرا)</div>
<h3>🌍 القهوة إلى العالم الجديد</h3>
<p>في القرن السابع عشر، حاول <strong>الهولنديون</strong> كسر احتكار اليمن لزراعة البن. نجحوا في تهريب بذور البن من مكة إلى سري لانكا وجاوة (إندونيسيا)، حيث أسسوا أول مزارع بن خارج أفريقيا واليمن. في 1727، أرسل البرتغاليون بذور البن من ماكاو إلى البرازيل — التي أصبحت لاحقاً أكبر منتج للبن في العالم. من شجرة واحدة هُربت في حقيبة دبلوماسي برتغالي، انطلقت صناعة البن البرازيلية التي تنتج اليوم أكثر من 3 مليارات كيلوغرام سنوياً.</p>
<div class="quiz-box"><strong>💬 هل تعلم؟</strong> كلمة "قهوة" في اللغة العربية القديمة كانت تعني "الخمر" أو "ما يُذهب بالنوم"، ثم أصبحت اسماً لمشروب البن. ومنها اشتقّت كلمة "café" في معظم اللغات الأوروبية! أيضاً، شجرة البن الوحيدة في البيت الزجاجي في أمستردام عام 1700 كانت أصل معظم مزارع البن في أمريكا الوسطى والجنوبية.</div>
<h3>☕ القهوة المختصة vs القهوة التجارية — الفرق اللي لازم تفهمه</h3>
<div class="hl" style="background:linear-gradient(135deg,rgba(212,168,90,.12),rgba(212,168,90,.04));border:1px solid rgba(212,168,90,.2);padding:18px 22px;border-radius:12px">
<p style="margin-bottom:8px"><strong>القهوة التجارية (Commercial Coffee):</strong> هي القهوة اللي بتشوفها في السوبر ماركت — منتجة بكميات ضخمة، غالباً روبوستا أو أرابيكا منخفضة الجودة، محمصة من شهور، طعمها مرة وموحدة. <strong>%90 من القهوة في العالم تجارية.</strong></p>
<p style="margin-bottom:8px"><strong>القهوة المختصة (Specialty Coffee):</strong> هي <strong>أجود 3%</strong> من إنتاج القهوة العالمي. حاصلة على 80+ نقطة في تقييم SCA. بن موسمي طازج، محمص بعناية، له نكهات مميزة. <strong>Specialty Coffee مش مجرد قهوة — هي تجربة.</strong></p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
  <div style="background:rgba(220,80,60,.06);border-radius:8px;padding:10px;text-align:center">
    <div style="font-size:1.4rem;color:#dc503c;font-weight:700">❌ تجارية</div>
    <div style="font-size:.8rem;color:#a09890;margin-top:4px">جودة منخفضة • نكهة موحدة • إنتاج ضخم</div>
  </div>
  <div style="background:rgba(76,175,80,.06);border-radius:8px;padding:10px;text-align:center">
    <div style="font-size:1.4rem;color:#4caf50;font-weight:700">✅ مختصة</div>
    <div style="font-size:.8rem;color:#a09890;margin-top:4px">جودة عالية • نكهات مميزة • إنتاج محدود</div>
  </div>
</div>
</div>
<p style="margin-top:10px">طوال رحلتك في أكاديمية الأيادي البيضاء، رح تتعلم ليه الفرق بين النوعين مش مجرد فرق في السعر — هو فرق في كل حاجة: الزراعة، المعالجة، التحميص، التحضير، والتذوق.</p>
`,
  en: `
<div class="img-c"><img src="${photo('coffee_story')}" alt="" loading="lazy"><div class="cap">📜 Coffee's Journey Through History — From Ethiopia to the World</div></div>
<h3>📖 The Story of Coffee Discovery — The Legend of Kaldi</h3>
<p>The Ethiopian legend tells of a goat herder named <strong>Kaldi</strong> who lived in the highlands of <strong>Kaffa</strong> region, southwestern Ethiopia, around the 9th century AD. Kaldi noticed his goats became <strong>unusually energetic</strong> after eating red berries from a strange tree — they were jumping and running with remarkable vitality.</p>
<div class="img-c"><img src="${photo('kaldy')}" alt="" loading="lazy"><div class="cap">🐐 Kaldi watches his goats dance — the first moment of coffee discovery</div></div>
<p>Kaldi tried the berries himself and immediately felt <strong>alert and refreshed</strong>. He took some to a <strong>nearby monastery</strong>, where the monks were skeptical. But after trying the berries, they found they helped them stay awake during night prayers. Thus, according to legend, coffee's journey with humanity began.</p>
<div class="img-c"><img src="${photo('kaldy_monk')}" alt="" loading="lazy"><div class="cap">🐐 Kaldi at the monastery — coffee reaches the monks</div></div>
<h3>🌿 The Ethiopian Coffee Ceremony — A Living Tradition</h3>
<p>In Ethiopia today, the <strong>coffee ceremony (Buna Tetu)</strong> is still practiced in every home and village. A two-hour ritual: green beans are roasted over fire in a flat pan until incense-like scents rise, then ground with a mortar and pestle, and boiled in the traditional clay pot (jebena). It is served to the patriarch first, then to guests in order of importance. The ceremony repeats three times — the first round is called "awol," the second "kale," and the third "baraka." This tradition embodies Ethiopian hospitality culture spanning over a thousand years.</p>
<h3>📜 Historical Evidence — Fact and Legend</h3>
<p>Despite Kaldi's fame, the <strong>earliest documented evidence</strong> of coffee drinking dates to <strong>15th century Yemen</strong>. Yemeni Sufis used coffee (which they called "qahwa") to stay awake during nighttime dhikr and worship. Coffee spread from Yemen to Mecca, Cairo, Damascus, and Istanbul.</p>
<p><strong>The spread through the Islamic world</strong> was rapid thanks to pilgrims and traders. By 1500, coffee was known in every major city of the Islamic world — from Mecca to Cairo, from Damascus to Aleppo. Coffeehouses opened and became centers for music, poetry, and political discussion, sometimes alarming rulers. In Cairo, they were called "schools of knowledge" for gathering scholars and students.</p>
<div class="hl"><strong>📊 Timeline:</strong><br>• 9th century: Ethiopian legend (Kaldi)<br>• 1000-1400: Coffee drinking spreads among Ethiopian tribes<br>• 1400-1450: Sufis in Yemen drink coffee<br>• 1511: First attempt to ban coffee in Mecca<br>• 1550: Coffeehouses spread in Cairo &amp; Istanbul<br>• 1615: Coffee arrives in Europe (Venice)<br>• 1652: First coffeehouse in London<br>• 1683: First coffeehouse in Vienna after the siege<br>• 1727: Coffee brought to Brazil<br>• 1901: First espresso machine (Bezzera)</div>
<h3>🌍 Coffee Goes to the New World</h3>
<p>In the 17th century, the <strong>Dutch</strong> tried to break Yemen's coffee monopoly. They successfully smuggled coffee seeds from Mecca to Sri Lanka and Java (Indonesia), establishing the first coffee farms outside Africa and Yemen. In 1727, the Portuguese sent coffee seeds from Macau to Brazil — which later became the world's largest coffee producer. From a single tree smuggled in a Portuguese diplomat's luggage, the Brazilian coffee industry was born, now producing over 3 billion kilograms annually.</p>
<div class="quiz-box"><strong>💬 Did You Know?</strong> The word "coffee" derives from the Arabic "qahwa" (قهوة), which originally meant "wine" or "that which prevents sleep." It evolved into "café" in most European languages! Also, a single coffee tree in the Amsterdam Botanical Garden in 1700 was the ancestor of most coffee farms in Central and South America.</div>
<h3>☕ Specialty vs Commercial Coffee — The Key Difference</h3>
<div class="hl" style="background:linear-gradient(135deg,rgba(212,168,90,.12),rgba(212,168,90,.04));border:1px solid rgba(212,168,90,.2);padding:18px 22px;border-radius:12px">
<p style="margin-bottom:8px"><strong>Commercial Coffee:</strong> The coffee you find in supermarkets — mass-produced, mostly low-grade Robusta or Arabica, roasted months ago, uniform and bitter taste. <strong>90% of the world's coffee is commercial.</strong></p>
<p style="margin-bottom:8px"><strong>Specialty Coffee:</strong> The <strong>top 3%</strong> of global coffee production. Scores 80+ points on SCA grading. Seasonally fresh, carefully roasted, with distinctive flavor notes. <strong>Specialty Coffee is not just coffee — it's an experience.</strong></p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
  <div style="background:rgba(220,80,60,.06);border-radius:8px;padding:10px;text-align:center">
    <div style="font-size:1.4rem;color:#dc503c;font-weight:700">❌ Commercial</div>
    <div style="font-size:.8rem;color:#a09890;margin-top:4px">Low quality • Uniform flavor • Mass production</div>
  </div>
  <div style="background:rgba(76,175,80,.06);border-radius:8px;padding:10px;text-align:center">
    <div style="font-size:1.4rem;color:#4caf50;font-weight:700">✅ Specialty</div>
    <div style="font-size:.8rem;color:#a09890;margin-top:4px">High quality • Distinct flavors • Limited production</div>
  </div>
</div>
</div>
<p style="margin-top:10px">Throughout your journey in White Hands Academy, you'll learn why the difference between these two is not just about price — it's about everything: farming, processing, roasting, brewing, and tasting.</p>
`
};

L['A1-1'] = {
  ar: `
<h3>🔬 التصنيف النباتي للقهوة</h3>
<p>القهوة تنتمي إلى <strong>المملكة النباتية (Plantae)</strong>، وتحديداً إلى <strong>الفصيلة الفُوْيَة (Rubiaceae)</strong>. <strong>جنس القهوة (Coffea)</strong> يضم حوالي 130 نوعاً، لكن <strong>نوعين فقط</strong> يسيطران على الإنتاج التجاري العالمي.</p>
<div class="img-c"><img src="${photo('comparison')}" alt="" loading="lazy"><div class="cap">🌱 أنواع البن الرئيسية — أرابيكا وروبوستا</div></div>
<table><tr><th>المستوى التصنيفي</th><th>الاسم</th></tr><tr><td>المملكة</td><td>Plantae</td></tr><tr><td>الشعبة</td><td>Magnoliophyta</td></tr><tr><td>الطائفة</td><td>Magnoliopsida</td></tr><tr><td>الرتبة</td><td>Gentianales</td></tr><tr><td>الفصيلة</td><td>Rubiaceae</td></tr><tr><td>الجنس</td><td><em>Coffea</em></td></tr></table>
<h3>🌱 أرابيكا (Coffea arabica)</h3>
<p>يشكل <strong>60-70%</strong> من الإنتاج العالمي. يُعتقد أنه <strong>هجين طبيعي (tetraploid)</strong> بين <em>Coffea eugenioides</em> و <em>Coffea canephora</em>. نسبة الكافيين: 0.8-1.4%. ينمو على ارتفاع 600-2200 متر. نكهته: معقدة، زهرية، فاكهية.</p>
<h3>🌿 روبوستا (Coffea canephora)</h3>
<p>يشكل <strong>30-40%</strong> من الإنتاج. مقاوم للأمراض، يحتوي على كافيين أكثر (1.7-4%). ينمو على ارتفاعات منخفضة (0-800 متر). نكهته: قوية، ترابية، مرة. يُستخدم أساساً في القهوة سريعة التحضير والإسبريسو الإيطالي التقليدي.</p>
<div class="info-box"><strong>📊 مقارنة:</strong> الأرابيكا تحتوي على سكريات أكثر ودهون أفضل — ولهذا نكهتها أحلى وأعقد. الروبوستا تحتوي على كافيين أكثر يمنحها مرارة وقوة جسم (Body) أكبر.</div>
`,
  en: `
<h3>🔬 Botanical Classification of Coffee</h3>
<p>Coffee belongs to the <strong>Plantae kingdom</strong>, specifically the <strong>Rubiaceae family</strong>. The <strong>Coffea genus</strong> includes about 130 species, but only <strong>two species</strong> dominate global commercial production.</p>
<div class="img-c"><img src="${photo('comparison')}" alt="" loading="lazy"><div class="cap">🌱 Main Coffee Species — Arabica & Robusta</div></div>
<table><tr><th>Taxonomic Level</th><th>Name</th></tr><tr><td>Kingdom</td><td>Plantae</td></tr><tr><td>Division</td><td>Magnoliophyta</td></tr><tr><td>Class</td><td>Magnoliopsida</td></tr><tr><td>Order</td><td>Gentianales</td></tr><tr><td>Family</td><td>Rubiaceae</td></tr><tr><td>Genus</td><td><em>Coffea</em></td></tr></table>
<h3>🌱 Arabica (Coffea arabica)</h3>
<p>Accounts for <strong>60-70%</strong> of world production. A <strong>natural hybrid (tetraploid)</strong> between <em>Coffea eugenioides</em> and <em>Coffea canephora</em>. Caffeine content: 0.8-1.4%. Grows at 600-2200m elevation. Flavor: complex, floral, fruity with bright acidity.</p>
<h3>🌿 Robusta (Coffea canephora)</h3>
<p>Accounts for <strong>30-40%</strong> of production. Disease-resistant, higher caffeine content (1.7-4%). Grows at lower altitudes (0-800m). Flavor: strong, earthy, bitter. Primarily used in instant coffee and traditional Italian espresso blends.</p>
<div class="info-box"><strong>📊 Comparison:</strong> Arabica contains more sugars and better lipids — which is why its flavor is sweeter and more complex. Robusta has more caffeine giving it bitterness and heavier body.</div>
`
};

L['A1-2'] = {
  ar: `
<h3>🌍 رحلة القهوة حول العالم</h3>
<p>قصة انتشار القهوة من غابات إثيوبيا إلى كل ركن من أركان العالم هي <strong>أعظم قصص التجارة والثقافة</strong> في التاريخ البشري.</p>
<div class="img-c"><img src="${photo('coffee_map')}" alt="" loading="lazy"><div class="cap">🌍 خريطة الدول المنتجة للقهوة — من إثيوبيا إلى العالم</div></div>
<h3>🇪🇹 إثيوبيا — مهد القهوة</h3>
<p>الموطن الأصلي للبن العربي هو <strong>غابات كافا (Kaffa)</strong> في جنوب غرب إثيوبيا. لا تزال أشجار البن البري تنمو طبيعياً تحت ظل الأشجار العملاقة.</p>
<h3>🇾🇪 اليمن — بوابة التجارة</h3>
<p>في القرن الخامس عشر، أصبحت <strong>مدينة المُخا (Mocha)</strong> الميناء الرئيسي لتصدير القهوة، ومنها اشتق اسم "موكا". طور المزارعون اليمنيون نظام الري في المدرجات الجبلية.</p>
<h3>🇹🇷 الدولة العثمانية — المقاهي الأولى</h3>
<p>افتتح أول مقهى في <strong>اسطنبول</strong> عام 1555. أصبحت المقاهي مراكز للقاءات الاجتماعية والسياسية — لدرجة أنها سُميت "مدارس الحكمة".</p>
<h3>🇮🇹 أوروبا — ثورة القهوة</h3>
<p>وصلت القهوة إلى <strong>البندقية</strong> عام 1615. في عام 1683، بعد حصار فيينا، افتتح أول مقهى في النمسا. في القرن الثامن عشر، انتشرت المقاهي في كل أنحاء أوروبا، وأصبحت مراكز للفكر والثقافة والتجارة.</p>
<div class="hl"><strong>🌎 حزام القهوة:</strong> يقع بين مدار السرطان ومدار الجدي. الدول المنتجة للبن العربي: إثيوبيا، كينيا، كولومبيا، البرازيل، كوستاريكا، غواتيمالا، اليمن. أشهرها: كولومبيا (ناعم ومتوازن)، إثيوبيا (زهري وفاكهي)، كينيا (حموضة عالية ونكهات التوت).</div>
`,
  en: `
<h3>🌍 Coffee's Journey Around the World</h3>
<p>The spread of coffee from Ethiopian forests to every corner of the world is one of the <strong>greatest trade and culture stories</strong> in human history.</p>
<div class="img-c"><img src="${photo('coffee_map')}" alt="" loading="lazy"><div class="cap">🌍 Coffee-Producing Countries Map — From Ethiopia to the World</div></div>
<h3>🇪🇹 Ethiopia — The Birthplace</h3>
<p>The original home of Arabica coffee is the <strong>Kaffa forests</strong> in southwestern Ethiopia. Wild coffee trees still grow naturally under the canopy of giant forest trees.</p>
<h3>🇾🇪 Yemen — The Trade Gateway</h3>
<p>In the 15th century, the port city of <strong>Mocha</strong> became the main export hub for coffee, giving us the name "Mocha". Yemeni farmers developed terraced irrigation systems on steep mountain slopes.</p>
<h3>🇹🇷 Ottoman Empire — The First Coffeehouses</h3>
<p>The first coffeehouse in <strong>Istanbul</strong> opened in 1555. Coffeehouses became centers for social and political gatherings — so influential they were called "schools of wisdom."</p>
<h3>🇮🇹 Europe — The Coffee Revolution</h3>
<p>Coffee reached <strong>Venice</strong> in 1615. In 1683, after the Siege of Vienna, the first coffeehouse opened in Austria. By the 18th century, coffeehouses spread across Europe, becoming centers of thought, culture, and commerce.</p>
<div class="hl"><strong>🌎 The Coffee Belt:</strong> Located between the Tropic of Cancer and the Tropic of Capricorn. Arabica-producing countries: Ethiopia, Kenya, Colombia, Brazil, Costa Rica, Guatemala, Yemen. Famous origins: Colombia (smooth, balanced), Ethiopia (floral, fruity), Kenya (high acidity, berry notes).</div>
`
};

L['A1-3'] = {
  ar: `
<h3>🔬 التشريح الكامل لثمرة القهوة</h3>
<p>ثمرة القهوة هي <strong>ثمرة حسلة (drupe)</strong>، تشبه الكرز. تحتوي على عدة طبقات، لكل منها دور في النكهة النهائية.</p>
<div class="img-c"><img src="${photo('cherry')}" alt="" loading="lazy"><div class="cap">🔬 تشريح حبة القهوة — من البذرة إلى المشروب</div></div>
<table><tr><th>الطبقة</th><th>الوظيفة</th></tr><tr><td><strong>القشرة الخارجية (Exocarp)</strong></td><td>حماية الثمرة، لونها أحمر عند النضج</td></tr><tr><td><strong>اللب (Mucilage)</strong></td><td>طبقة حلوة غنية بالسكريات — تؤثر على التخمير</td></tr><tr><td><strong>الغلاف الرقيق (Parchment)</strong></td><td>غلاف واقٍ يشبه الورق المقوى</td></tr><tr><td><strong>طبقة الفضة (Silver Skin)</strong></td><td>غشاء رقيق — يتحول إلى chaff أثناء التحميص</td></tr><tr><td><strong>جنين البذرة (Endosperm)</strong></td><td>هذا هو "البن" — الجزء الذي نحمصه ونشربه</td></tr></table>
<h3>🧪 التركيب الكيميائي</h3>
<p>تحتوي حبة البن الخضراء على: <strong>كافيين</strong> (0.8-2.5%) — المنبه الرئيسي. <strong>أحماض الكلوروجينيك</strong> (5-8%) — مضادات أكسدة قوية. <strong>سكريات</strong> (6-9%) — مصدر الحلاوة. <strong>دهون</strong> (15-17%) — تحمل النكهات. <strong>ألياف</strong> (23-28%).</p>
<div class="info-box"><strong>💡 معلومة مهمة:</strong> أثناء التحميص، يتضاعف حجم حبة البن (يزيد 50-80%) وتفقد 15-20% من وزنها بسبب تبخر الماء وتحلل المركبات.</div>
<div class="quiz-box"><strong>💬 اختبار سريع:</strong> أي طبقة من ثمرة القهوة تتحول إلى "chaff" أثناء التحميص؟ (الإجابة: طبقة الفضة / Silver Skin)</div>
`,
  en: `
<h3>🔬 Complete Anatomy of the Coffee Cherry</h3>
<p>The coffee fruit is a <strong>drupe</strong>, similar to a cherry. It contains several layers, each playing a role in the final flavor.</p>
<div class="img-c"><img src="${photo('cherry')}" alt="" loading="lazy"><div class="cap">🔬 Coffee Bean Anatomy — From Seed to Cup</div></div>
<table><tr><th>Layer</th><th>Function</th></tr><tr><td><strong>Exocarp (Outer Skin)</strong></td><td>Protects the fruit, turns red when ripe</td></tr><tr><td><strong>Mucilage (Pulp)</strong></td><td>Sweet layer rich in sugars — affects fermentation</td></tr><tr><td><strong>Parchment</strong></td><td>Protective layer like thin cardboard</td></tr><tr><td><strong>Silver Skin</strong></td><td>Thin membrane — becomes chaff during roasting</td></tr><tr><td><strong>Endosperm</strong></td><td>This is the "bean" — what we roast and brew</td></tr></table>
<h3>🧪 Chemical Composition</h3>
<p>Green coffee bean contains: <strong>Caffeine</strong> (0.8-2.5%) — main stimulant. <strong>Chlorogenic acids</strong> (5-8%) — powerful antioxidants. <strong>Sugars</strong> (6-9%) — source of sweetness. <strong>Lipids</strong> (15-17%) — carry flavor compounds. <strong>Fiber</strong> (23-28%).</p>
<div class="info-box"><strong>💡 Key Fact:</strong> During roasting, the coffee bean expands by 50-80% in volume and loses 15-20% of its weight due to water evaporation and compound breakdown.</div>
<div class="quiz-box"><strong>💬 Quick Quiz:</strong> Which layer of the coffee cherry becomes "chaff" during roasting? (Answer: Silver Skin)</div>
`
};

L['A2-0'] = {ar:`<h3>🔬 فيزياء وكيمياء الاستخلاص</h3><p>الاستخلاص هو عملية إذابة المركبات القابلة للذوبان من البن المطحون في الماء. العوامل المؤثرة: درجة الطحن، درجة حرارة الماء (92-96°م)، نسبة القهوة للماء، وقت التلامس.</p>
<div class="img-c"><img src="${photo('water')}" alt="" loading="lazy"><div class="cap">📊 قياس TDS — مفتاح الاتساق والجودة</div></div>
<div class="img-c"><img src="${photo('v60')}" alt="" loading="lazy"><div class="cap">⚗️ علم الاستخلاص — كيف تنتقل النكهات من البن إلى الماء</div></div>
<div class="info-box"><strong>📊 النسبة المثلى للاستخلاص حسب SCA:</strong> 18-22%. أقل من 18% = استخلاص ناقص (طعم حامض ومالح). أكثر من 22% = استخلاص زائد (طعم مر وجاف).</div><table><tr><th>العامل</th><th>النطاق المثالي</th></tr><tr><td>درجة الطحن</td><td>متوسط (مثل حبيبات السكر)</td></tr><tr><td>حرارة الماء</td><td>92-96°م</td></tr><tr><td>وقت التلامس</td><td>2.5-4 دقائق</td></tr><tr><td>النسبة (قهوة:ماء)</td><td>1:15 إلى 1:17</td></tr></table><div class="err-box"><strong>❌ خطأ شائع:</strong> الماء المغلي مباشرة (100°م) يحرق القهوة ويسبب مرارة زائدة. اترك الغلاية 30 ثانية بعد الغليان.</div>`, en:`<h3>🔬 Physics & Chemistry of Extraction</h3><p>Extraction is the process of dissolving soluble compounds from ground coffee into water. Key variables: grind size, water temperature (92-96°C), coffee-to-water ratio, contact time.</p>
<div class="img-c"><img src="${photo('water')}" alt="" loading="lazy"><div class="cap">📊 TDS Measurement — Key to Consistency & Quality</div></div>
<div class="img-c"><img src="${photo('v60')}" alt="" loading="lazy"><div class="cap">⚗️ Extraction Science — How Flavors Move from Bean to Water</div></div>
<div class="info-box"><strong>📊 SCA Optimal Extraction:</strong> 18-22%. Below 18% = under-extraction (sour, salty). Above 22% = over-extraction (bitter, dry).</div><table><tr><th>Variable</th><th>Optimal Range</th></tr><tr><td>Grind Size</td><td>Medium (like sugar granules)</td></tr><tr><td>Water Temp</td><td>92-96°C</td></tr><tr><td>Contact Time</td><td>2.5-4 minutes</td></tr><tr><td>Ratio (coffee:water)</td><td>1:15 to 1:17</td></tr></table><div class="err-box"><strong>❌ Common Mistake:</strong> Boiling water (100°C) scorches coffee and causes excessive bitterness. Let the kettle rest 30 seconds after boiling.</div>`};

L['A2-1'] = {ar:`<h3>🧰 أدوات تحضير القهوة</h3>
<div class="img-c"><img src="${photo('barista')}" alt="" loading="lazy"><div class="cap">🧰 معدات القهوة — من V60 إلى الإسبريسو</div></div>
<table><tr><th>الطريقة</th><th>النكهة</th><th>الوقت</th></tr><tr><td>V60</td><td>نظيفة، زهرية</td><td>2.5 دقيقة</td></tr><tr><td>Chemex</td><td>نظيفة جداً</td><td>4 دقائق</td></tr><tr><td>AeroPress</td><td>غنية، كاملة</td><td>1.5 دقيقة</td></tr><tr><td>French Press</td><td>ثقيلة، زيتية</td><td>4 دقائق</td></tr><tr><td>إسبريسو</td><td>مركزة، كريمية</td><td>25-30 ثانية</td></tr></table><div class="ok-box"><strong>💡 نصيحة:</strong> ابدأ بطريقة V60 — الأبسط والأكثر تحكماً في المتغيرات.</div>`, en:`<h3>🧰 Coffee Brewing Equipment</h3>
<div class="img-c"><img src="${photo('barista')}" alt="" loading="lazy"><div class="cap">🧰 Coffee Equipment — From V60 to Espresso</div></div>
<table><tr><th>Method</th><th>Flavor</th><th>Time</th></tr><tr><td>V60</td><td>Clean, floral</td><td>2.5 min</td></tr><tr><td>Chemex</td><td>Very clean</td><td>4 min</td></tr><tr><td>AeroPress</td><td>Rich, full</td><td>1.5 min</td></tr><tr><td>French Press</td><td>Heavy, oily</td><td>4 min</td></tr><tr><td>Espresso</td><td>Concentrated</td><td>25-30 sec</td></tr></table><div class="ok-box"><strong>💡 Tip:</strong> Start with V60 — the simplest and most controllable method.</div>`};

L['A2-2'] = {ar:`<h3>⚖️ النسب الذهبية — مفتاح الاتساق</h3><p>نسبة القهوة إلى الماء هي <strong>المتغير الأكثر تأثيراً</strong> في طعم الفنجان. النسبة الأساسية التي أوصت بها SCA هي <strong>60 جرام قهوة لكل 1 لتر ماء</strong> (1:16.7). لكن لكل طريقة تحضير نسبتها المثلى.</p>
<table><tr><th>طريقة التحضير</th><th>النسبة (قهوة:ماء)</th><th>مثال (15 جرام)</th></tr><tr><td>V60 / Chemex</td><td>1:15 – 1:17</td><td>15g : 240-255g</td></tr><tr><td>AeroPress</td><td>1:14 – 1:16</td><td>15g : 210-240g</td></tr><tr><td>French Press</td><td>1:12 – 1:15</td><td>15g : 180-225g</td></tr><tr><td>إسبريسو</td><td>1:2 – 1:3</td><td>18g : 36-54g</td></tr><tr><td>Cold Brew</td><td>1:8 – 1:10</td><td>100g : 800-1000g</td></tr><tr><td>Moka Pot</td><td>1:7 – 1:10</td><td>20g : 140-200g</td></tr></table>
<h3>🧮 كيف تختار النسبة المناسبة؟</h3><p><strong>النسبة الأخف (1:17):</strong> تبرز الحموضة والنكهات الزهرية — مثالية للبن الإثيوبي خفيف التحميص.<br><strong>النسبة المتوسطة (1:15):</strong> توازن بين الحموضة والقوام — مناسبة لمعظم أنواع البن.<br><strong>النسبة الأثقل (1:13):</strong> تبرز القوام والجسم والمرارة — مناسبة للبن الداكن أو قهوة الطوافات.</p>
<div class="hl"><strong>📊 قاعدة الـ 60 جرام:</strong> ابدأ بـ 60 جرام بن لكل 1 لتر ماء (1:16.7). اضبط حسب الذوق: زود القهوة للحصول على طعم أقوى، قللها للطعم الأخف. سجل نسبك المفضلة لكل بن!</div>
<div class="info-box"><strong>🔬 العلاقة بـ TDS:</strong> كلما زادت كمية القهوة (نسبة أثقل)، زاد TDS — والعكس صحيح. الهدف: TDS 1.2-1.5% للقهوة المقطرة، و TDS 8-12% للإسبريسو.</div>`, en:`<h3>⚖️ Golden Ratios — The Key to Consistency</h3><p>The coffee-to-water ratio is the <strong>most impactful variable</strong> in cup flavor. The SCA-recommended baseline is <strong>60g coffee per 1 liter of water</strong> (1:16.7). But each brewing method has its optimal ratio.</p>
<table><tr><th>Method</th><th>Ratio (coffee:water)</th><th>Example (15g)</th></tr><tr><td>V60 / Chemex</td><td>1:15 – 1:17</td><td>15g : 240-255g</td></tr><tr><td>AeroPress</td><td>1:14 – 1:16</td><td>15g : 210-240g</td></tr><tr><td>French Press</td><td>1:12 – 1:15</td><td>15g : 180-225g</td></tr><tr><td>Espresso</td><td>1:2 – 1:3</td><td>18g : 36-54g</td></tr><tr><td>Cold Brew</td><td>1:8 – 1:10</td><td>100g : 800-1000g</td></tr><tr><td>Moka Pot</td><td>1:7 – 1:10</td><td>20g : 140-200g</td></tr></table>
<h3>🧮 How to Choose the Right Ratio?</h3><p><strong>Lighter ratio (1:17):</strong> Highlights acidity and floral notes — ideal for light-roast Ethiopian beans.<br><strong>Medium ratio (1:15):</strong> Balanced — suitable for most coffee types.<br><strong>Heavier ratio (1:13):</strong> Emphasizes body and bitterness — ideal for dark roasts.</p>
<div class="hl"><strong>📊 The 60g Rule:</strong> Start with 60g coffee per 1L water (1:16.7). Adjust to taste: increase coffee for stronger flavor, decrease for lighter. Log your preferred ratios for each coffee!</div>
<div class="info-box"><strong>🔬 TDS Relationship:</strong> The more coffee (heavier ratio), the higher the TDS — and vice versa. Target: 1.2-1.5% TDS for drip coffee, 8-12% for espresso.</div>`};

L['A2-3'] = {ar:`<h3>🛠️ تحضير V60 خطوة بخطوة</h3>
<div class="img-c"><img src="${photo('v60')}" alt="" loading="lazy"><div class="cap">🛠️ تحضير V60 خطوة بخطوة — من الغليان إلى التقديم</div></div>
<ol><li><strong>جهز الأدوات:</strong> V60، فلتر ورقي، غلاية، ميزان</li><li><strong>سخن الماء:</strong> اغلي واتركه 30 ثانية (94°م)</li><li><strong>اطحن:</strong> درجة متوسطة (مثل السكر الخشن)</li><li><strong>وزن:</strong> 15 جرام بن + 250 جرام ماء</li><li><strong>Blooming:</strong> 30 مل ماء + انتظر 30 ثانية</li><li><strong>صب:</strong> على 3 مراحل متساوية</li><li><strong>الوقت:</strong> 2.5-3 دقائق إجمالي</li><li><strong>استمتع!</strong></li></ol>`, en:`<h3>🛠️ V60 Step-by-Step</h3>
<div class="img-c"><img src="${photo('v60')}" alt="" loading="lazy"><div class="cap">🛠️ V60 Step by Step — From Boil to Serve</div></div>
<ol><li><strong>Prepare:</strong> V60, paper filter, kettle, scale</li><li><strong>Heat water:</strong> Boil, rest 30 sec (94°C)</li><li><strong>Grind:</strong> Medium (like coarse sugar)</li><li><strong>Weigh:</strong> 15g coffee + 250g water</li><li><strong>Bloom:</strong> 30ml water + wait 30 sec</li><li><strong>Pour:</strong> In 3 equal stages</li><li><strong>Time:</strong> 2.5-3 min total</li><li><strong>Enjoy!</strong></li></ol>`};

L['A3-0'] = {ar:`<h3>☕ ما هو الإسبريسو؟ — العلم والتقنية</h3><p>الإسبريسو ليس مجرد قهوة مركزة — إنه <strong>نظام تحضير متكامل</strong> يعتمد على دفع الماء الساخن (91-96°م) تحت <strong>ضغط 9 بار</strong> عبر طبقة مضغوطة من البن المطحون ناعماً (طحن إسبريسو: 200-350 ميكرون). النتيجة: مشروب مركز بطبقة كريما ذهبية تغطي السطح.</p>
<div class="img-c"><img src="${photo('espresso')}" alt="" loading="lazy"><div class="cap">☕ الإسبريسو — 9 بار، 92°م، 30 ثانية</div></div>
<h3>⚙️ بارامترات الإسبريسو المثالي (SCA)</h3>
<table><tr><th>المعيار</th><th>النطاق المثالي</th></tr><tr><td>وزن الجرعة (Dose)</td><td>7-9 جرام (سنجل) / 16-22 جرام (دبل)</td></tr><tr><td>وزن الناتج (Yield)</td><td>25-35 مل (سنجل) / 50-70 مل (دبل)</td></tr><tr><td>وقت الاستخلاص</td><td>25-30 ثانية</td></tr><tr><td>حرارة الماء</td><td>91-96°م</td></tr><tr><td>الضغط</td><td>9 بار (±0.5)</td></tr><tr><td>الكريما</td><td>ذهبية، 3-5 مم، بدون فقاعات كبيرة</td></tr><tr><td>نسبة الاستخلاص</td><td>18-22%</td></tr></table>
<h3>🧪 ما الذي يحدث أثناء الاستخلاص؟</h3><p>في الـ 25-30 ثانية، يمر الماء عبر 9-10 أجواء من الضغط، مستخلصاً:<br>• <strong>أول 5-7 ثوانٍ:</strong> استخلاص الأحماض والمركبات الخفيفة — بداية تدفق بني فاتح<br>• <strong>7-20 ثانية:</strong> ذروة الاستخلاص — تدفق بني كثيف مع كريما متطورة<br>• <strong>20-30 ثانية:</strong> استخلاص المركبات الثقيلة — قوام كامل ومرارة خفيفة<br>• <strong>بعد 30 ثانية:</strong> استخلاص زائد — طعم جاف ومر وقابض</p>
<div class="hl"><strong>📊 قانون الـ 3-3-3</strong><br>3 ثوانٍ لبداية التقطير (Pre-infusion + dripping)<br>30 ثانية إجمالي الوقت<br>3 أضعاف وزن الجرعة (نسبة 1:3 أو أقل)</div>
<div class="quiz-box"><strong>💬 اختبار سريع:</strong> ما سبب أهمية الكريما في الإسبريسو؟ (الإجابة: الكريما تحبس النكهات المتطايرة والزيوت — هي مؤشر على جودة الاستخلاص)</div>
<div class="err-box"><strong>❌ خطأ شائع:</strong> ظن أن الإسبريسو السريع (أقل من 20 ثانية) أفضل. الحقيقة: الإسبريسو المثالي يحتاج 25-30 ثانية لاستخلاص متوازن. أسرع من 20 ثانية ≈ استخلاص ناقص (طعم حامض).</div>`, en:`<h3>☕ What is Espresso? — The Science & Technique</h3><p>Espresso is not just concentrated coffee — it's an <strong>integrated brewing system</strong> that forces hot water (91-96°C) at <strong>9 bars of pressure</strong> through a compacted puck of finely ground coffee (espresso grind: 200-350 microns). Result: a concentrated beverage with a golden crema layer.</p>
<div class="img-c"><img src="${photo('espresso')}" alt="" loading="lazy"><div class="cap">☕ Espresso — 9 bar, 92°C, 30 seconds</div></div>
<h3>⚙️ Ideal Espresso Parameters (SCA)</h3>
<table><tr><th>Parameter</th><th>Optimal Range</th></tr><tr><td>Dose</td><td>7-9g (single) / 16-22g (double)</td></tr><tr><td>Yield</td><td>25-35ml (single) / 50-70ml (double)</td></tr><tr><td>Extraction Time</td><td>25-30 seconds</td></tr><tr><td>Water Temperature</td><td>91-96°C</td></tr><tr><td>Pressure</td><td>9 bar (±0.5)</td></tr><tr><td>Crema</td><td>Golden, 3-5mm, no large bubbles</td></tr><tr><td>Extraction Yield</td><td>18-22%</td></tr></table>
<h3>🧪 What Happens During Extraction?</h3><p>In 25-30 seconds, water passes through at 9+ atmospheres, extracting:<br>• <strong>First 5-7 sec:</strong> Acids and light compounds — light brown flow starts<br>• <strong>7-20 sec:</strong> Peak extraction — dense brown flow with developing crema<br>• <strong>20-30 sec:</strong> Heavy compounds — full body with light bitterness<br>• <strong>After 30 sec:</strong> Over-extraction — dry, bitter, astringent taste</p>
<div class="hl"><strong>📊 The 3-3-3 Rule</strong><br>3 seconds to start dripping (pre-infusion)<br>30 seconds total time<br>3 times the dose (1:3 ratio or lower)</div>
<div class="quiz-box"><strong>💬 Quick Quiz:</strong> Why is crema important in espresso? (Answer: Crema traps volatile aromatics and oils — it's an indicator of extraction quality)</div>
<div class="err-box"><strong>❌ Common Mistake:</strong> Thinking fast espresso (&lt;20 sec) is better. Truth: ideal espresso needs 25-30 sec for balanced extraction. Faster than 20 sec ≈ under-extracted (sour taste).</div>`};

L['A3-1'] = {ar:`<h3>🥛 لاتيه — فن الحليب</h3><p>اللاتيه هو <strong>أشهر مشروبات الإسبريسو</strong> في العالم. تركيبته بسيطة: إسبريسو + حليب مبخر + رغوة خفيفة. لكن السحر يكمن في <strong>كيفية دمج المكونات</strong> معاً.</p>
<div class="img-c"><img src="${photo('latte')}" alt="" loading="lazy"><div class="cap">🎨 أساسيات اللاتيه أرت — قلب، روزيتا، توليب</div></div>
<h3>📐 النسبة المثالية</h3><p><strong>لاتيه كلاسيك:</strong> 1/3 إسبريسو (30 مل دبل) + 2/3 حليب مبخر (150-180 مل) + طبقة رغوة خفيفة (5-10 مم).<br><strong>لاتيه كبير:</strong> دبل إسبريسو (60 مل) + حليب (250-300 مل) — نسبة 1:4 إلى 1:5.<br><strong>Iced Latte:</strong> حليب بارد + ثلج + إسبريسو يصب على الثلج — يحافظ على النكهة.</p>
<h3>🧪 علم تسخين الحليب</h3><p>الحليب يتكون من: <strong>ماء (87%)</strong>، <strong>دهون (3.5%)</strong>، <strong>بروتينات (3.2%)</strong>، <strong>سكر لاكتوز (4.8%)</strong>. عند التسخين:<br>• <strong>35-55°م:</strong> تبدأ البروتينات بالتمدد — تتكون الرغوة الناعمة<br>• <strong>55-65°م:</strong> النطاق المثالي — لاكتوز يتحلل إلى سكريات بسيطة (حلاوة طبيعية)<br>• <strong>65-70°م:</strong> تبدأ البروتينات بالتكسر — تختفي الرغوة الناعمة<br>• <strong>فوق 70°م:</strong> احتراق البروتينات — طعم محروق، فقدان الحلاوة</p>
<h3>🎨 Latte Art — المستوى المتقدم</h3><p><strong>القلب (Heart):</strong> أبسط شكل — صب سريع في المنتصف، ثم حركة أمامية سريعة.<br><strong>الروزيتا (Rosetta):</strong> أوراق نبات — هز الكوب يميناً ويساراً أثناء الصب مع سحب بطيء.<br><strong>التوليب (Tulip):</strong> 3-4 طبقات من القلوب المتداخلة — يتطلب تحكماً دقيقاً في تدفق الحليب.<br><strong>السوان (Swan):</strong> الشكل الأصعب — يجمع بين الروزيتا والقلب مع عنق البجعة.</p>
<div class="info-box"><strong>💡 سر اللاتيه آرت الناجح:</strong> الإسبريسو يجب أن يكون طازجاً (كريما ذهبية متماسكة). الحليب يجب أن يكون في درجة حرارة 55-60°م مع رغوة ناعمة كالحرير — لا فقاعات كبيرة.</div>
<div class="err-box"><strong>❌ خطأ شائع:</strong> ظن أن الرغوة الكثيفة أفضل. الحقيقة: لاتيه يحتاج رغوة خفيفة جداً (microfoam) — مثل الكريمة السائلة. الرغوة الكثيفة تناسب الكابتشينو فقط.</div>
<div class="ok-box"><strong>🎯 تمرين عملي:</strong> ابدأ بتسخين 200 مل حليب في إبريق. حاول عمل رغوة ناعمة بدون فقاعات. عندما تنجح، ارسم قلباً بسيطاً على سطح اللاتيه. كرر 20 مرة قبل الانتقال للشكل التالي.</div>
<div class="story-box"><h4>📜 قصة اللاتيه — من إيطاليا إلى العالم</h4><p>في إيطاليا، كان <strong>Caffè Latte</strong> مشروباً منزلياً — تصنعه الأمهات لأطفالهن. لم يكن يقدم في المقاهي الإيطالية! في الخمسينيات، حمله المهاجرون الإيطاليون إلى أمريكا. الثورة جاءت في <strong>سياتل 1989</strong> عندما بدأت Starbucks بتقديم لاتيه بحجم 12 أونصة — ومنه انطلق المشروب حول العالم.</p><div class="story-src">📖 المصدر: "The World Atlas of Coffee" — James Hoffmann</div></div>`, en:`<h3>🥛 Latte — The Art of Milk</h3><p>The latte is the <strong>world's most popular espresso drink</strong>. Its composition is simple: espresso + steamed milk + light foam. But the magic lies in <strong>how the ingredients merge</strong> together.</p>
<div class="img-c"><img src="${photo('latte')}" alt="" loading="lazy"><div class="cap">🎨 Latte Art Basics — Heart, Rosetta, Tulip</div></div>
<h3>📐 The Ideal Ratio</h3><p><strong>Classic Latte:</strong> 1/3 espresso (30ml double) + 2/3 steamed milk (150-180ml) + light foam layer (5-10mm).<br><strong>Large Latte:</strong> Double espresso (60ml) + milk (250-300ml) — ratio 1:4 to 1:5.<br><strong>Iced Latte:</strong> Cold milk + ice + espresso poured over ice — preserves the flavor profile.</p>
<h3>🧪 The Science of Steaming Milk</h3><p>Milk consists of: <strong>Water (87%)</strong>, <strong>Fat (3.5%)</strong>, <strong>Proteins (3.2%)</strong>, <strong>Lactose sugar (4.8%)</strong>. During steaming:<br>• <strong>35-55°C:</strong> Proteins begin to expand — fine foam forms<br>• <strong>55-65°C:</strong> Ideal range — lactose breaks into simple sugars (natural sweetness)<br>• <strong>65-70°C:</strong> Proteins start breaking down — fine foam disappears<br>• <strong>Above 70°C:</strong> Protein burns — scorched taste, sweetness lost</p>
<h3>🎨 Latte Art — Advanced Level</h3><p><strong>Heart:</strong> Simplest shape — fast pour in the center, then quick forward motion.<br><strong>Rosetta:</strong> Leaf pattern — wiggle the cup left and right while pouring, slow pull through.<br><strong>Tulip:</strong> 3-4 stacked heart layers — requires precise control of milk flow.<br><strong>Swan:</strong> Most difficult — combines rosetta and heart with a swan neck.</p>
<div class="info-box"><strong>💡 Secret to Successful Latte Art:</strong> Espresso must be fresh (firm golden crema). Milk should be at 55-60°C with silky microfoam — no large bubbles.</div>
<div class="err-box"><strong>❌ Common Mistake:</strong> Thinking thick foam is better. Truth: latte needs very light microfoam — like liquid cream. Thick foam is for cappuccino only.</div>
<div class="ok-box"><strong>🎯 Practice:</strong> Start by steaming 200ml milk in a pitcher. Try to make smooth microfoam without bubbles. Once successful, draw a simple heart on the latte surface. Repeat 20 times before the next shape.</div>
<div class="story-box"><h4>📜 The Latte Story — From Italy to the World</h4><p>In Italy, <strong>Caffè Latte</strong> was a home drink — mothers made it for children. It was never served in Italian coffee bars! In the 1950s, Italian immigrants brought it to America. The revolution came in <strong>Seattle 1989</strong> when Starbucks introduced a 12oz latte — and the drink spread worldwide.</p><div class="story-src">📖 Source: "The World Atlas of Coffee" — James Hoffmann</div></div>`};

L['A3-2'] = {ar:`<h3>☕ كابتشينو وموكا — الفروق والتقنيات</h3>
<p>معرفة الفروق بين مشروبات الإسبريسو المختلفة هي <strong>علامة الباريستا المحترف</strong>. لكل مشروب شخصيته ونسبة وتقنية تحضير.</p>
<h3>🟤 الكابتشينو — 1:1:1</h3>
<p>سُمي <strong>الكابتشينو</strong> على اسم رهبان <strong>الكابوتشين (Capuchin)</strong> لأن لون المشروب يشبه لون أرديتهم البنية الفاتحة. المكونات:<br>• <strong>1/3 إسبريسو</strong> — القاعدة (30 مل دبل)<br>• <strong>1/3 حليب مبخر</strong> — القوام الكريمي<br>• <strong>1/3 رغوة كثيفة</strong> — طبقة سميكة جافة على السطح<br><br>الكابتشينو الإيطالي التقليدي يقدم في كوب <strong>150-180 مل</strong>، مع رشّة كاكاو أو قرفة على السطح. يجب أن يكون ثقيلاً بما يكفي لتحمل الرغوة الكثيفة دون أن يغرق.</p>
<h3>🍫 الموكا — إسبريسو + شوكولاتة</h3>
<p><strong>Mocha</strong> (أو Mochaccino) هو مشروب إسبريسو مع شوكولاتة. اشتق اسمه من ميناء <strong>المُخا (Mocha)</strong> اليمني — أول ميناء صدّر القهوة للعالم. التركيبة:<br>• <strong>إسبريسو دبل</strong> (30-60 مل)<br>• <strong>صلصة شوكولاتة</strong> (15-30 مل) أو بودرة كاكاو ممزوجة بالماء الساخن<br>• <strong>حليب مبخر</strong> (150-200 مل)<br>• <strong>كريمة مخفوقة</strong> (اختياري) + رشّة كاكاو</p>
<table><tr><th>المشروب</th><th>إسبريسو</th><th>حليب</th><th>رغوة</th><th>إضافات</th></tr><tr><td>لاتيه</td><td>1</td><td>2</td><td>خفيفة</td><td>—</td></tr><tr><td>كابتشينو</td><td>1</td><td>1</td><td>كثيفة جافة</td><td>كاكاو/قرفة</td></tr><tr><td>موكا</td><td>1</td><td>2</td><td>خفيفة</td><td>شوكولاتة + كريمة</td></tr><tr><td>Flat White</td><td>1</td><td>2</td><td>رقيقة جداً</td><td>—</td></tr><tr><td>Macchiato</td><td>1</td><td>القليل</td><td>نقطة رغوة</td><td>—</td></tr><tr><td>Affogato</td><td>1</td><td>—</td><td>—</td><td>آيس كريم فانيليا</td></tr></table>
<div class="hl"><strong>📊 الفرق بين Flat White ولاتيه:</strong> الفلات وايت يستخدم <strong>نسبة إسبريسو أعلى</strong> (إسبريسو دبل 60 مل) مقابل 2/3 حليب مع طبقة رغوة رقيقة جداً — أصلها من أستراليا/نيوزيلندا. طعم القهوة أقوى وأكثر بروزاً.</div>
<div class="err-box"><strong>❌ خطأ شائع:</strong> تقديم الكابتشينو في كوب كبير. كوب الكابتشينو الكلاسيكي 150-180 مل فقط. إذا كان أكبر، يصبح لاتيه برغوة.</div>
<div class="ok-box"><strong>🎯 تمرين:</strong> في جلسة واحدة، حضّر 3 مشروبات: لاتيه، كابتشينو، وفلات وايت باستخدام نفس كمية الإسبريسو. لاحظ كيف تغير كمية الرغوة الطعم والقوام. سجل انطباعك.</div>`, en:`<h3>☕ Cappuccino & Mocha — Differences & Techniques</h3>
<p>Knowing the differences between espresso drinks is a <strong>hallmark of a professional barista</strong>. Each drink has its personality, ratio, and preparation technique.</p>
<h3>🟤 Cappuccino — 1:1:1</h3>
<p><strong>Cappuccino</strong> was named after <strong>Capuchin monks</strong> because the drink's color resembles their light brown robes. Composition:<br>• <strong>1/3 espresso</strong> — the base (30ml double)<br>• <strong>1/3 steamed milk</strong> — creamy texture<br>• <strong>1/3 thick foam</strong> — a thick dry layer on top<br><br>Traditional Italian cappuccino is served in a <strong>150-180ml cup</strong>, dusted with cocoa or cinnamon. It should be strong enough to support the thick foam without sinking.</p>
<h3>🍫 Mocha — Espresso + Chocolate</h3>
<p><strong>Mocha</strong> (or Mochaccino) is an espresso drink with chocolate. Its name derives from the Yemeni port <strong>Mocha</strong> — the first coffee exporting port. Composition:<br>• <strong>Double espresso</strong> (30-60ml)<br>• <strong>Chocolate sauce</strong> (15-30ml) or cocoa powder mixed with hot water<br>• <strong>Steamed milk</strong> (150-200ml)<br>• <strong>Whipped cream</strong> (optional) + cocoa dusting</p>
<table><tr><th>Drink</th><th>Espresso</th><th>Milk</th><th>Foam</th><th>Add-ons</th></tr><tr><td>Latte</td><td>1</td><td>2</td><td>Light</td><td>—</td></tr><tr><td>Cappuccino</td><td>1</td><td>1</td><td>Thick dry</td><td>Cocoa/cinnamon</td></tr><tr><td>Mocha</td><td>1</td><td>2</td><td>Light</td><td>Chocolate + cream</td></tr><tr><td>Flat White</td><td>1</td><td>2</td><td>Very thin</td><td>—</td></tr><tr><td>Macchiato</td><td>1</td><td>Splash</td><td>Foam dot</td><td>—</td></tr><tr><td>Affogato</td><td>1</td><td>—</td><td>—</td><td>Vanilla ice cream</td></tr></table>
<div class="hl"><strong>📊 Flat White vs Latte:</strong> Flat white uses <strong>more espresso</strong> (60ml double) with 2/3 milk and a very thin microfoam layer — originally from Australia/New Zealand. Coffee flavor is stronger and more prominent.</div>
<div class="err-box"><strong>❌ Common Mistake:</strong> Serving cappuccino in a large cup. Classic cappuccino cup is 150-180ml only. Larger = latte with foam.</div>
<div class="ok-box"><strong>🎯 Exercise:</strong> In one session, prepare 3 drinks: latte, cappuccino, flat white — using the same espresso amount. Notice how foam amount changes taste and texture. Log your impressions.</div>`};

L['B1-0'] = {ar:`<h3>🔥 كيمياء التحميص — تفاعل ميلارد</h3><p>التحميص يحول البن الأخضر كيميائياً وفيزيائياً إلى بن محمص. يبدأ تفاعل ميلارد (Maillard) عند 150°م — وهو المسؤول عن النكهات المعقدة.</p>
<div class="img-c"><img src="${photo('roast')}" alt="" loading="lazy"><div class="cap">🔥 تحول حبة البن تحت الحرارة — الكيمياء خلف النكهة</div></div>
<table><tr><th>المرحلة</th><th>درجة الحرارة</th></tr><tr><td>التجفيف</td><td>30-100°م</td></tr><tr><td>تفاعل ميلارد</td><td>150-190°م</td></tr><tr><td>First Crack</td><td>196°م</td></tr><tr><td>التطوير</td><td>196-220°م</td></tr><tr><td>Second Crack</td><td>220°م+</td></tr></table><div class="quiz-box"><strong>💬 مرجع SCA:</strong> مقياس Agtron: #95 = فاتح جداً، #55 = متوسط (توازن)، #25 = داكن جداً.</div>`, en:`<h3>🔥 Roasting Chemistry — Maillard Reaction</h3><p>Roasting transforms green coffee chemically and physically into roasted coffee. The Maillard Reaction starts at 150°C — responsible for complex flavors.</p>
<div class="img-c"><img src="${photo('roast')}" alt="" loading="lazy"><div class="cap">🔥 The Bean's Transformation Under Heat — The Chemistry Behind Flavor</div></div>
<table><tr><th>Stage</th><th>Temperature</th></tr><tr><td>Drying</td><td>30-100°C</td></tr><tr><td>Maillard</td><td>150-190°C</td></tr><tr><td>First Crack</td><td>196°C</td></tr><tr><td>Development</td><td>196-220°C</td></tr><tr><td>Second Crack</td><td>220°C+</td></tr></table><div class="quiz-box"><strong>💬 SCA Reference:</strong> Agtron scale: #95 = very light, #55 = medium (balanced), #25 = very dark.</div>`};

L['B1-1'] = {ar:`<h3>📈 منحنيات التحميص</h3><p>منحنى التحميص (Roast Curve) هو رسم بياني يوثق درجة حرارة البن عبر الزمن. <strong>Rate of Rise (RoR):</strong> معدل ارتفاع الحرارة بالدرجة في الدقيقة. منحنى مثالي يبدأ بانحدار تدريجي.</p><div class="info-box"><strong>📊 الثالوث الذهبي:</strong> 1) وقت التجفيف: 4-5 دقائق 2) وقت ميلارد: 3-5 دقائق 3) وقت التطوير: 20-25% من إجمالي الوقت.</div>`, en:`<h3>📈 Roast Curves</h3><p>A roast curve is a graph documenting bean temperature over time. <strong>Rate of Rise (RoR):</strong> Temperature increase rate in °C/min.</p><div class="info-box"><strong>📊 Golden Triad:</strong> 1) Drying time: 4-5 min 2) Maillard time: 3-5 min 3) Development time: 20-25% of total.</div>`};

L['B1-2'] = {ar:`<h3>🔬 تأثير التحميص على الاستخلاص</h3><p>البن الفاتح (Light Roast) أكثر كثافة ويحتاج طحناً أدق. البن الداكن (Dark Roast) أكثر مسامية ويستخلص بسرعة.</p><table><tr><th>التحميص</th><th>طحن مناسب</th></tr><tr><td>فاتح</td><td>ناعم</td></tr><tr><td>متوسط</td><td>متوسط</td></tr><tr><td>داكن</td><td>خشن</td></tr></table><div class="err-box"><strong>❌ خطأ شائع:</strong> استخدام نفس الطحن لكل درجات التحميص. البن الفاتح يحتاج طحناً أدق والداكن يحتاج أخشن.</div>`, en:`<h3>🔬 Roast Effect on Extraction</h3><p>Light roast is denser, needs finer grind. Dark roast is more porous, extracts quickly.</p><table><tr><th>Roast</th><th>Grind</th></tr><tr><td>Light</td><td>Fine</td></tr><tr><td>Medium</td><td>Medium</td></tr><tr><td>Dark</td><td>Coarse</td></tr></table><div class="err-box"><strong>❌ Common Mistake:</strong> Using the same grind for all roast levels. Light needs finer, dark needs coarser.</div>`};

L['B2-0'] = {ar:`<h3>💧 كيمياء الماء</h3><p>القهوة 98-99% ماء. العناصر المؤثرة: الكالسيوم (Ca²⁺) للجسم والقوام، المغنيسيوم (Mg²⁺) للنكهات الزهرية، البيكربونات (HCO₃⁻) لتخفيف الحموضة.</p>
<div class="img-c"><img src="${photo('water')}" alt="" loading="lazy"><div class="cap">💧 الماء — المكوّن الرئيسي في فنجانك</div></div>
<div class="info-box"><strong>📊 قياسات SCA لماء القهوة:</strong> TDS: 150-175 ppm · العسر: 60-120 ppm · القلوية: 40-80 ppm · pH: 6.5-7.5</div>`, en:`<h3>💧 Water Chemistry</h3><p>Coffee is 98-99% water. Key elements: Calcium (Ca²⁺) for body, Magnesium (Mg²⁺) for floral notes, Bicarbonate (HCO₃⁻) buffers acidity.</p>
<div class="img-c"><img src="${photo('water')}" alt="" loading="lazy"><div class="cap">💧 Water — The Main Ingredient in Your Cup</div></div>
<div class="info-box"><strong>📊 SCA Water Standards:</strong> TDS: 150-175 ppm · Hardness: 60-120 ppm · Alkalinity: 40-80 ppm · pH: 6.5-7.5</div>`};

L['B2-1'] = {ar:`<h3>📊 TDS — مفتاح الاتساق</h3><p>TDS (Total Dissolved Solids) = إجمالي المواد الصلبة الذائبة. النسبة المثلى للقهوة المقطرة: 1.2-1.5%. يقاس بجهاز Refractometer.</p><div class="hl"><strong>مثال:</strong> 250 مل قهوة TDS=1.4% = 3.5 جرام مواد صلبة. إذا استخدمت 20 جرام بن، الاستخلاص = 3.5÷20×100 = 17.5%.</div>`, en:`<h3>📊 TDS — Key to Consistency</h3><p>TDS (Total Dissolved Solids) = total dissolved solids. Optimal for drip coffee: 1.2-1.5%. Measured with a Refractometer.</p><div class="hl"><strong>Example:</strong> 250ml coffee at 1.4% TDS = 3.5g solids. Using 20g coffee, extraction yield = 3.5/20x100 = 17.5%.</div>`};

L['B2-2'] = {ar:`<h3>🛠️ أنظمة معالجة المياه</h3>
<div class="img-c"><img src="${photo('water')}" alt="" loading="lazy"><div class="cap">💧 مراحل تنقية الماء — من الصنبور إلى الفنجان</div></div>
<table><tr><th>النظام</th><th>المميزات</th></tr><tr><td>كربون نشط</td><td>رخيص، يزيل الكلور والروائح</td></tr><tr><td>تبادل أيوني</td><td>يضبط العسر والقلوية</td></tr><tr><td>RO + إعادة تمعدن</td><td>تحكم كامل، غالي</td></tr></table><div class="ok-box"><strong>💡 توصية:</strong> لمعظم المقاهي: كربون نشط + فلتريوم أيوني يكفي للوصول إلى TDS 150-175 ppm.</div>`, en:`<h3>🛠️ Water Treatment Systems</h3>
<div class="img-c"><img src="${photo('water')}" alt="" loading="lazy"><div class="cap">💧 Water Purification — From Tap to Cup</div></div>
<table><tr><th>System</th><th>Pros</th></tr><tr><td>Activated Carbon</td><td>Cheap, removes chlorine</td></tr><tr><td>Ion Exchange</td><td>Adjusts hardness &amp; alkalinity</td></tr><tr><td>RO + Remineralization</td><td>Full control, expensive</td></tr></table><div class="ok-box"><strong>💡 Recommendation:</strong> Most cafes: carbon + ion exchange filter to reach TDS 150-175 ppm.</div>`};

L['B3-0'] = {ar:`<h3>⚙️ توزيع حجم الطحن (PSD)</h3><p>كل درجة طحن تنتج توزيعاً من الأحجام. المطحنة الجيدة تنتج توزيعاً ضيقاً. المطحنة الرديئة تنتج غبار ناعم (Fines) وحبيبات خشنة (Boulders).</p>
<div class="img-c"><img src="${photo('beans')}" alt="" loading="lazy"><div class="cap">⚙️ توزيع حجم الطحن — مفتاح الاستخلاص المتساوي</div></div>
<div class="info-box"><strong>📊 قياس الطحن:</strong> الإسبريسو = 200-350 ميكرون · V60 = 500-800 ميكرون · French Press = 800-1200 ميكرون</div>`, en:`<h3>⚙️ Particle Size Distribution (PSD)</h3><p>Every grind setting produces a distribution of particle sizes. A good grinder produces a narrow distribution. Poor grinders produce fines and boulders.</p>
<div class="img-c"><img src="${photo('beans')}" alt="" loading="lazy"><div class="cap">⚙️ Particle Size Distribution — Key to Even Extraction</div></div>
<div class="info-box"><strong>📊 Grind Measurement:</strong> Espresso = 200-350 micron · V60 = 500-800 micron · French Press = 800-1200 micron</div>`};

L['B3-1'] = {ar:`<h3>⚙️ الاستخلاص المتقدم — التحكم في TDS</h3><p>الاستخلاص (Extraction Yield) هو <strong>نسبة المواد الصلبة المذابة</strong> من القهوة الجافة إلى وزن المشروب النهائي. هذه هي <strong>المعادلة الذهبية</strong> التي تفصل الباريستا العادي عن المحترف.</p>
<div class="info-box"><strong>📊 معادلة الاستخلاص:</strong><br>Extraction Yield (%) = (TDS × وزن المشروب) ÷ وزن القهوة الجافة × 100<br><br><strong>مثال:</strong> 20 جرام قهوة → 300 مل مشروب TDS=1.4%<br>= (0.014 × 300) ÷ 20 × 100 = 4.2 ÷ 20 × 100 = <strong>21%</strong> ✅ ضمن النطاق المثالي</div>
<h3>📈 خريطة التحكم في الاستخلاص (Brewing Control Chart)</h3><table><tr><th>المنطقة</th><th>النطاق</th><th>الطعم</th><th>الحل</th></tr><tr><td>استخلاص ناقص</td><td>&lt; 18%</td><td>حامض، مالح، خفيف</td><td>اطحن أدق / سخّن الماء / زوّد الوقت</td></tr><tr><td>النطاق المثالي</td><td>18-22%</td><td>متوازن، حلو، كامل</td><td>—</td></tr><tr><td>استخلاص زائد</td><td>&gt; 22%</td><td>مر، جاف، قابض</td><td>اطحن أخشن / برّد الماء / قلّل الوقت</td></tr></table>
<h3>🛠️ كيف تضبط الاستخلاص؟</h3><p>عند مواجهة مشكلة في الطعم، اتبع هذا التسلسل:<br>• <strong>طعم حامض (استخلاص ناقص):</strong> اطحن أدق أولاً — هذا أسهل تغيير. إذا ما زال حامضاً، زوّد حرارة الماء 1-2°م.<br>• <strong>طعم مر (استخلاص زائد):</strong> اطحن أخشن أولاً — سيقلّل وقت التلامس. إذا ما زال مراً، قلّل حرارة الماء.<br>• <strong>طعم مالح أو عكر:</strong> تأكد من توزيع الطحن بالتساوي (WDT) وضغط القهوة بشكل متساوٍ.</p>
<div class="hl"><strong>📊 نطاق TDS المثالي:</strong><br>• قهوة مقطرة: 1.2-1.5% TDS<br>• إسبريسو: 8-12% TDS<br>• Cold Brew: 1.3-1.8% TDS<br>• AeroPress: 1.3-1.7% TDS</div>
<div class="ok-box"><strong>💡 تقنية متقدمة:</strong> استخدم TDS متر (Refractometer) لقياس TDS بدقة. سجل كل متغير (طحن، حرارة، نسبة، وقت) لكل قهوة تقدمها. بعد 50 تسجيل، ستبدأ برؤية أنماط واضحة.</div>`, en:`<h3>⚙️ Advanced Extraction — TDS Control</h3><p>Extraction Yield is the <strong>percentage of dissolved solids</strong> from dry coffee in the final beverage. This is the <strong>golden formula</strong> that separates average baristas from professionals.</p>
<div class="info-box"><strong>📊 Extraction Formula:</strong><br>Extraction Yield (%) = (TDS × Beverage Weight) ÷ Dry Coffee Weight × 100<br><br><strong>Example:</strong> 20g coffee → 300ml brew at 1.4% TDS<br>= (0.014 × 300) ÷ 20 × 100 = 4.2 ÷ 20 × 100 = <strong>21%</strong> ✅ Within optimal range</div>
<h3>📈 Brewing Control Chart</h3><table><tr><th>Zone</th><th>Range</th><th>Taste</th><th>Fix</th></tr><tr><td>Under-extracted</td><td>&lt; 18%</td><td>Sour, salty, thin</td><td>Grind finer / hotter water / longer time</td></tr><tr><td>Optimal</td><td>18-22%</td><td>Balanced, sweet, full</td><td>—</td></tr><tr><td>Over-extracted</td><td>&gt; 22%</td><td>Bitter, dry, astringent</td><td>Grind coarser / cooler water / shorter time</td></tr></table>
<h3>🛠️ How to Dial In?</h3><p>When troubleshooting flavor, follow this sequence:<br>• <strong>Sour (under-extracted):</strong> Grind finer first — this is the easiest change. If still sour, increase water temp 1-2°C.<br>• <strong>Bitter (over-extracted):</strong> Grind coarser first — reduces contact time. If still bitter, lower water temp.<br>• <strong>Salty or uneven:</strong> Ensure even grind distribution (WDT) and level tamping.</p>
<div class="hl"><strong>📊 Ideal TDS Range:</strong><br>• Drip coffee: 1.2-1.5% TDS<br>• Espresso: 8-12% TDS<br>• Cold Brew: 1.3-1.8% TDS<br>• AeroPress: 1.3-1.7% TDS</div>
<div class="ok-box"><strong>💡 Advanced Tip:</strong> Use a Refractometer to measure TDS precisely. Log every variable (grind, temp, ratio, time) for each coffee you serve. After 50 logs, patterns will emerge clearly.</div>`};

L['B3-2'] = {ar:`<h3>📊 تحسين جودة الفنجان — علم الضبط</h3><p>تحسين الجودة ليس موهبة — إنه <strong>نظام</strong>. الباريستا المحترف يسجل كل متغير ويربطه بنتيجة التذوق. هذا هو الفرق بين التخمين والعلم.</p>
<h3>📋 سجل التحضير المثالي</h3>
<table><tr><th>المتغير</th><th>القيمة</th><th>تأثيره على الطعم</th></tr><tr><td>درجة الطحن</td><td>رقم المطحنة / الميكرون</td><td>يحدد سرعة الاستخلاص — أدق = أبطأ</td></tr><tr><td>حرارة الماء</td><td>°م</td><td>يحدد معدل الذوبان — أسخن = أسرع</td></tr><tr><td>النسبة</td><td>قهوة:ماء</td><td>يحدد القوة والتركيز</td></tr><tr><td>وقت التلامس</td><td>دقيقة:ثانية</td><td>يحدد كمية المواد المذابة</td></tr><tr><td>TDS</td><td>%</td><td>يقيس تركيز القهوة في المشروب</td></tr><tr><td>وزن الناتج</td><td>جرام</td><td>لحساب الاستخلاص النهائي</td></tr><tr><td>تقيم الطعم</td><td>1-10</td><td>تقييم شخصي للحموضة، الحلاوة، القوام</td></tr></table>
<h3>🔬 التشخيص المنهجي</h3><p>عندما تقدم قهوة جديدة لزبون:</p><ol><li><strong>اسأل:</strong> هل تشعر بحموضة عالية؟ مرارة؟ قوام خفيف؟</li><li><strong>حلّل:</strong> الحموضة العالية ← استخلاص ناقص ← اطحن أدق. المرارة ← استخلاص زائد ← اطحن أخشن.</li><li><strong>عدّل متغيراً واحداً فقط</strong> في كل مرة.</li><li><strong>سجل:</strong> اكتب التعديل والنتيجة. كرر حتى تصل للطعم المثالي.</li></ol>
<div class="hl"><strong>📊 معادلة النجاح:</strong> (قهوة عالية الجودة + ماء مثالي + طحن دقيق + نسبة صحيحة + حرارة مضبوطة + وقت مناسب) × الاتساق = فنجان ممتاز كل مرة</div>
<div class="ok-box"><strong>💡 توصية:</strong> احتفظ بدفتر (Brew Log) لكل قهوة تقدمها. بعد 100 تسجيل، ستصبح قادراً على توقع النتائج بدقة 90% قبل أن تبدأ التحضير.</div>`, en:`<h3>📊 Cup Quality Optimization — The Science of Dialing In</h3><p>Quality optimization isn't talent — it's a <strong>system</strong>. Professional baristas log every variable and connect it to tasting results. This is the difference between guessing and science.</p>
<h3>📋 Brew Log Template</h3>
<table><tr><th>Variable</th><th>Value</th><th>Flavor Impact</th></tr><tr><td>Grind Setting</td><td>Burr # / Micron</td><td>Controls extraction speed — finer = slower</td></tr><tr><td>Water Temp</td><td>°C</td><td>Controls dissolution rate — hotter = faster</td></tr><tr><td>Ratio</td><td>Coffee:Water</td><td>Controls strength and concentration</td></tr><tr><td>Contact Time</td><td>min:sec</td><td>Controls total dissolved solids</td></tr><tr><td>TDS</td><td>%</td><td>Measures coffee concentration in brew</td></tr><tr><td>Yield Weight</td><td>grams</td><td>For calculating final extraction</td></tr><tr><td>Taste Score</td><td>1-10</td><td>Personal assessment of acidity, sweet, body</td></tr></table>
<h3>🔬 Systematic Diagnosis</h3><p>When serving a new coffee to a customer:</p><ol><li><strong>Ask:</strong> Do you taste high acidity? Bitterness? Thin body?</li><li><strong>Analyze:</strong> High acidity ← under-extracted ← grind finer. Bitterness ← over-extracted ← grind coarser.</li><li><strong>Change only ONE variable</strong> at a time.</li><li><strong>Log:</strong> Write the adjustment and result. Repeat until perfect.</li></ol>
<div class="hl"><strong>📊 Success Formula:</strong> (Quality coffee + ideal water + precise grind + correct ratio + controlled temp + proper time) × Consistency = Perfect cup every time</div>
<div class="ok-box"><strong>💡 Recommendation:</strong> Keep a Brew Log for every coffee you serve. After 100 entries, you'll predict results with 90% accuracy before you even start brewing.</div>`};

L['C1-0'] = {ar:`<h3>👃 أساسيات التذوق (Cupping) — دليلك الكامل</h3>
<p>الكابينج (Cupping) هو <strong>الطريقة المعيارية الدولية</strong> لتقييم القهوة، طورتها SCA لتوحيد لغة التقييم بين محترفي القهوة في جميع أنحاء العالم. يسمح لك بتذوق القهوة <strong>نقية بدون حليب أو سكر</strong>، لتقييم صفاتها الحقيقية.</p>
<div class="img-c"><img src="${photo('cupping')}" alt="" loading="lazy"><div class="cap">🧪 التقييم الحسي — فن تذوق القهوة</div></div>
<h3>📋 خطوات الكابينج — 6 مراحل</h3>
<ol><li><strong>الطحن:</strong> اطحن البن بدرجة خشنة (مثل ملح البحر) — وزن 8-9 جرام لكل كوب كابينج قياسي</li>
<li><strong>الرائحة الجافة (Fragrance):</strong> اشم البن المطحون مباشرة — سجل أول انطباع (زهري؟ فاكهي؟ محمص؟)</li>
<li><strong>إضافة الماء:</strong> أضف ماء بدرجة 93-96°م بنسبة 1:18 (150 مل لكل 8 جرام بن). ابدأ المؤقت</li>
<li><strong>الرائحة الرطبة (Aroma):</strong> بعد إضافة الماء مباشرة، اشم الرائحة المتصاعدة — هنا تظهر النكهات الدقيقة</li>
<li><strong>كسر القشرة (Crust):</strong> بعد 4 دقائق، اكسر القشرة المتكونة على السطح بملعقة الكابينج — اشم التصاعد القوي للروائح</li>
<li><strong>التذوق (Tasting):</strong> بعد 8-15 دقيقة (عندما تبرد القهوة لـ 70°م)، ابدأ التذوق. استخدم ملعقة كابينج عميقة وامتص القهوة بصوت عالٍ (Slurp) لترشيشها على كل براعم التذوق</li></ol>
<h3>📊 استمارة التقييم SCA — 10 معايير</h3>
<table><tr><th>المعيار</th><th>الوصف</th><th>الدرجة</th></tr><tr><td>Fragrance/Aroma</td><td>الرائحة الجافة والرطبة</td><td>0-10</td></tr><tr><td>Flavor</td><td>النكهة الكلية — الانطباع الأول</td><td>0-10</td></tr><tr><td>Aftertaste</td><td>النكهة الباقية بعد البلع</td><td>0-10</td></tr><tr><td>Acidity</td><td>الحموضة — نضارة وإشراق</td><td>0-10</td></tr><tr><td>Body</td><td>القوام — الوزن على اللسان</td><td>0-10</td></tr><tr><td>Balance</td><td>توازن النكهات</td><td>0-10</td></tr><tr><td>Uniformity</td><td>اتساق العينات</td><td>0-10</td></tr><tr><td>Clean Cup</td><td>نظافة الكوب — لا عيوب</td><td>0-10</td></tr><tr><td>Sweetness</td><td>الحلاوة الطبيعية</td><td>0-10</td></tr><tr><td>Overall</td><td>الانطباع العام</td><td>0-10</td></tr></table>
<div class="hl"><strong>📊 مفتاح الدرجات:</strong> 6-6.75 = جيد · 7-7.75 = جيد جداً · 8-8.75 = ممتاز · 9-10 = استثنائي. الدرجة الكلية 80+ = Specialty Grade.</div>
<div class="ok-box"><strong>🎯 تمرين:</strong> اشتري 3 أنواع بن من أصول مختلفة (إثيوبي، كولومبي، وبرازيلي). اعمل كابينج لجميعهم في جلسة واحدة. دون ملاحظاتك لكل معيار. حاول تخمين أي بن هو أي أصل بناءً على النكهات فقط.</div>`, en:`<h3>👃 Cupping Fundamentals — Complete Guide</h3>
<p>Cupping is the <strong>international standard method</strong> for coffee evaluation, developed by SCA to standardize tasting language among coffee professionals worldwide. It allows you to taste coffee <strong>pure — without milk or sugar</strong> — to evaluate its true qualities.</p>
<div class="img-c"><img src="${photo('cupping')}" alt="" loading="lazy"><div class="cap">🧪 Sensory Evaluation — The Art of Coffee Tasting</div></div>
<h3>📋 Cupping Steps — 6 Phases</h3>
<ol><li><strong>Grind:</strong> Grind coffee coarsely (like sea salt) — 8-9g per standard cupping bowl</li>
<li><strong>Fragrance (Dry):</strong> Smell the ground coffee immediately — note first impression (floral? fruity? roasted?)</li>
<li><strong>Add Water:</strong> Add water at 93-96°C at 1:18 ratio (150ml per 8g coffee). Start the timer</li>
<li><strong>Aroma (Wet):</strong> Right after adding water, smell the rising aromas — delicate notes appear here</li>
<li><strong>Break the Crust:</strong> After 4 minutes, break the crust with a cupping spoon — smell the powerful burst of aromas</li>
<li><strong>Tasting:</strong> After 8-15 minutes (when coffee cools to ~70°C), start tasting. Use a deep cupping spoon and slurp loudly to spray coffee across all taste buds</li></ol>
<h3>📊 SCA Scoring Form — 10 Criteria</h3>
<table><tr><th>Attribute</th><th>Description</th><th>Score</th></tr><tr><td>Fragrance/Aroma</td><td>Dry and wet aroma</td><td>0-10</td></tr><tr><td>Flavor</td><td>Total flavor — first impression</td><td>0-10</td></tr><tr><td>Aftertaste</td><td>Flavor remaining after swallowing</td><td>0-10</td></tr><tr><td>Acidity</td><td>Brightness and liveliness</td><td>0-10</td></tr><tr><td>Body</td><td>Weight on the tongue</td><td>0-10</td></tr><tr><td>Balance</td><td>How flavors harmonize</td><td>0-10</td></tr><tr><td>Uniformity</td><td>Sample consistency</td><td>0-10</td></tr><tr><td>Clean Cup</td><td>No defects</td><td>0-10</td></tr><tr><td>Sweetness</td><td>Natural sweetness</td><td>0-10</td></tr><tr><td>Overall</td><td>Overall impression</td><td>0-10</td></tr></table>
<div class="hl"><strong>📊 Score Key:</strong> 6-6.75 = Good · 7-7.75 = Very Good · 8-8.75 = Excellent · 9-10 = Extraordinary. Total 80+ = Specialty Grade.</div>
<div class="ok-box"><strong>🎯 Exercise:</strong> Buy 3 coffees from different origins (Ethiopian, Colombian, Brazilian). Cup all three in one session. Take notes for each criterion. Try to guess which coffee is which origin based on flavor alone.</div>`};

L['C1-1'] = {ar:`<h3>🎨 عجلة النكهات SCA — دليلك للتذوق</h3><p>عجلة النكهات (SCA Flavor Wheel) طورها <strong>معهد جودة القهوة (CQI)</strong> بالتعاون مع <strong>SCA</strong> و <strong>World Coffee Research</strong>. هي الأداة الأساسية لتوحيد لغة التذوق بين محترفي القهوة عالمياً.</p>
<h3>🗺️ هيكل العجلة — 3 مستويات</h3>
<table><tr><th>المستوى</th><th>الوصف</th><th>مثال</th></tr><tr><td>الأول (عام)</td><td>9 فئات رئيسية</td><td>فاكهي، زهري، حلو، بهارات</td></tr><tr><td>الثاني (متوسط)</td><td>تصنيفات فرعية</td><td>فاكهي → حمضيات، توت، فواكه استوائية</td></tr><tr><td>الثالث (محدد)</td><td>نكهات محددة</td><td>ليمون، برتقال، جريب فروت</td></tr></table>
<h3>👃 الفئات التسع الرئيسية</h3><p><strong>زهري Floral</strong> · <strong>فاكهي Fruity</strong> · <strong>حامض Sour/Fermented</strong> · <strong>حلو Sweet</strong> · <strong>بهارات Spices</strong> · <strong>أخضر Green/Vegetative</strong> · <strong>محمص Roasted</strong> · <strong>جوزي Nutty/Cocoa</strong> · <strong>آخر Others</strong></p>
<h3>📝 كيف تستخدم العجلة؟</h3><ol><li><strong>اشم الرائحة الجافة</strong> للبن المطحون — سجل أول انطباع</li><li><strong>أضف الماء</strong> وشم الرائحة الرطبة — ابحث عن نكهات محددة</li><li><strong>تذوق</strong> بقوة (Slurp) لترشيش القهوة على كل براعم التذوق</li><li><strong>ابدأ من العام:</strong> هل هذا فاكهي؟ زهري؟ محمص؟</li><li><strong>انتقل للخاص:</strong> إذا فاكهي، هل هو حمضيات؟ توت؟ فواكه سكرية؟</li><li><strong>كن محدداً:</strong> إذا حمضيات، هل هو ليمون أصفر؟ برتقال؟ جريب فروت؟</li></ol>
<div class="hl"><strong>💬 معجم النكهات (Lexicon):</strong> أكثر من 100 مصطلح موحد يصف نكهات القهوة. أمثلة: <em>Bergamot</em> (برغموت — زهري حمضي)، <em>Blackcurrant</em> (كشمش أسود — توتي حامضي)، <em>Molasses</em> (دبس — حلو ثقيل).</div>
<div class="info-box"><strong>🎯 تمرين يومي:</strong> خذ 3 أنواع بن مختلفة. استخدم العجلة لوصف كل واحدة بـ 3 نكهات على الأقل. كرر التمرين يومياً لمدة أسبوع — ستتحسن مفرداتك التذوقية 300%.</div>
<div class="quiz-box"><strong>💬 تحدّ:</strong> صف القهوة التي تشربها الآن باستخدام العجلة. ابدأ بالعام → الخاص. مثلاً: فاكهي ← حمضيات ← ليمون + حلو ← كراميل. هل تستطيع؟</div>`, en:`<h3>🎨 SCA Flavor Wheel — Your Tasting Guide</h3><p>The SCA Flavor Wheel was developed by the <strong>Coffee Quality Institute (CQI)</strong> in collaboration with <strong>SCA</strong> and <strong>World Coffee Research</strong>. It's the essential tool for standardizing tasting language among coffee professionals worldwide.</p>
<h3>🗺️ Wheel Structure — 3 Levels</h3>
<table><tr><th>Level</th><th>Description</th><th>Example</th></tr><tr><td>1st (General)</td><td>9 main categories</td><td>Fruity, Floral, Sweet, Spices</td></tr><tr><td>2nd (Medium)</td><td>Sub-classifications</td><td>Fruity → Citrus, Berry, Tropical fruit</td></tr><tr><td>3rd (Specific)</td><td>Specific flavors</td><td>Lemon, Orange, Grapefruit</td></tr></table>
<h3>👃 Nine Main Categories</h3><p><strong>Floral</strong> · <strong>Fruity</strong> · <strong>Sour/Fermented</strong> · <strong>Sweet</strong> · <strong>Spices</strong> · <strong>Green/Vegetative</strong> · <strong>Roasted</strong> · <strong>Nutty/Cocoa</strong> · <strong>Others</strong></p>
<h3>📝 How to Use the Wheel?</h3><ol><li><strong>Smell the dry fragrance</strong> of ground coffee — note your first impression</li><li><strong>Add water</strong> and smell the wet aroma — look for specific notes</li><li><strong>Slurp</strong> loudly to spray coffee across all taste buds</li><li><strong>Start general:</strong> Is this fruity? Floral? Roasted?</li><li><strong>Go specific:</strong> If fruity, is it citrus? Berry? Stone fruit?</li><li><strong>Be precise:</strong> If citrus, is it lemon? Orange? Grapefruit?</li></ol>
<div class="hl"><strong>💬 Flavor Lexicon:</strong> Over 100 standardized terms describe coffee flavors. Examples: <em>Bergamot</em> (floral-citrus), <em>Blackcurrant</em> (tart berry), <em>Molasses</em> (heavy sweet).</div>
<div class="info-box"><strong>🎯 Daily Exercise:</strong> Take 3 different coffees. Use the wheel to describe each with at least 3 flavors. Repeat daily for one week — your tasting vocabulary will improve 300%.</div>
<div class="quiz-box"><strong>💬 Challenge:</strong> Describe the coffee you're drinking right now using the wheel. Start general → specific. E.g.: Fruity ← Citrus ← Lemon + Sweet ← Caramel. Can you do it?</div>`};

L['C1-2'] = {ar:`<h3>📊 بروتوكول SCA للتقييم — من 0 إلى 100</h3>
<p>استمارة SCA هي <strong>اللغة العالمية الموحدة</strong> لتقييم جودة القهوة. تستخدمها مسابكات الباريستا العالمية (World Barista Championship) ومحطات تحميص specialty حول العالم. إليك التفاصيل الكاملة لكل معيار.</p>
<h3>📋 المعايير العشرة — دليل التقييم الكامل</h3>
<table><tr><th>المعيار</th><th>الدرجة القصوى</th><th>ما الذي نقيمه؟</th></tr><tr><td><strong>Fragrance/Aroma</strong></td><td>10</td><td>شم الرائحة الجافة بعد الطحن مباشرة (Fragrance) والرائحة الرطبة بعد إضافة الماء (Aroma). ابحث عن: زهري، فاكهي، شوكولاتي، جوزي</td></tr>
<tr><td><strong>Flavor</strong></td><td>10</td><td>الانطباع الكلي للنكهة في الفم. ابحث عن: التعقيد، العمق، الوضوح، المتعة. قارن بين أول رشفة وآخرها</td></tr>
<tr><td><strong>Aftertaste</strong></td><td>10</td><td>النكهة التي تبقى بعد بلع القهوة. ابحث عن: المدة (كم ثانية تدوم؟)، الجودة (هل هي ممتعة أم مرّة؟)</td></tr>
<tr><td><strong>Acidity</strong></td><td>10</td><td>الحموضة الجيدة هي نضارة وإشراق — مثل حموضة التفاح أو الحمضيات. الحموضة السيئة هي حادة أو قابضة مثل الخل</td></tr>
<tr><td><strong>Body</strong></td><td>10</td><td>القوام — ثقل أو خفة القهوة على اللسان. من خفيف مثل الشاي إلى ثقيل مثل الكريمة. ابحث عن: النعومة والمتانة</td></tr>
<tr><td><strong>Balance</strong></td><td>10</td><td>كيف تتفاعل النكهات معاً. هل تطغى الحموضة على القوام؟ هل القوام يخفي النكهات؟ التوازن المثالي = كل عنصر في مكانه</td></tr>
<tr><td><strong>Uniformity</strong></td><td>10</td><td>اتساق العينات — في الكابينج، نقيم 5 أكواب من نفس القهوة. هل كلها متطابقة في الطعم؟ إذا اختلف كوب واحد، هذا عيب</td></tr>
<tr><td><strong>Clean Cup</strong></td><td>10</td><td>نظافة الكوب — لا عيوب تكنيكية. إذا وجدت طعم ترابي، عفن، فينولي، أو أي عيب — خصم درجات</td></tr>
<tr><td><strong>Sweetness</strong></td><td>10</td><td>الحلاوة الطبيعية — هل تشعر بحلاوة الكراميل، العسل، السكر البني، الفواكه الناضجة؟ القهوة الجيدة دائماً فيها حلاوة طبيعية</td></tr>
<tr><td><strong>Overall</strong></td><td>10</td><td>انطباعك العام — هل هذه قهوة تريد شربها كل يوم؟ هل تشتريها لمقهاك؟ هل تثير اهتمامك؟</td></tr></table>
<h3>🔢 نظام حساب الدرجات</h3><p>كل معيار يسجل من 0-10 بفواصل ربع درجة (6.25، 6.5، 6.75...). الدرجات تُضرب × 2 للحصول على النتيجة النهائية.<br><strong>مثال:</strong> 7.5 + 8 + 7.75 + 8.25 + 7.5 + 8 + 8 + 8 + 8 + 8 = 79 نقطة × 2 = <strong>79/100</strong></p>
<div class="hl"><strong>📊 جدول التصنيف:</strong><br>• 90-100: Outstanding (استثنائي) — قهوة نادرة جداً<br>• 85-89.99: Excellent (ممتاز) — Specialty عالي الجودة<br>• 80-84.99: Very Good (جيد جداً) — Specialty Grade<br>• 60-79.99: Commercial Grade (تجاري)<br>• أقل من 60: Below Grade (دون المستوى)</div>
<div class="info-box"><strong>💬 هل تعلم؟</strong> أقل من 1% من قهوة العالم تحصل على درجة 90+. هذه القهوة تباع في مزادات خاصة بأسعار تتجاوز $100 للرطل (مثل Panama Geisha).</div>
<div class="ok-box"><strong>🎯 تحدّ:</strong> ابحث عن قهوة مكتوب عليها درجة SCA (تجدها على أكياس البن specialty). اشترها، اعمل كابينج، وسجل درجاتك الخاصة. قارن درجاتك مع الدرجة المطبوعة. الفرق بين 1-2 درجة طبيعي — مع التدريب سيقل الفرق.</div>`, en:`<h3>📊 SCA Scoring Protocol — From 0 to 100</h3>
<p>The SCA form is the <strong>universal standardized language</strong> for coffee quality evaluation. Used in World Barista Championships and specialty roasters worldwide. Here's the complete guide.</p>
<h3>📋 Ten Criteria — Complete Scoring Guide</h3>
<table><tr><th>Attribute</th><th>Max</th><th>What We Evaluate</th></tr>
<tr><td><strong>Fragrance/Aroma</strong></td><td>10</td><td>Dry smell after grinding + wet smell after adding water. Look for: floral, fruity, chocolate, nutty</td></tr>
<tr><td><strong>Flavor</strong></td><td>10</td><td>Total flavor impression in the mouth. Look for: complexity, depth, clarity, enjoyment</td></tr>
<tr><td><strong>Aftertaste</strong></td><td>10</td><td>Flavor remaining after swallowing. Look for: duration, quality (pleasant vs bitter)</td></tr>
<tr><td><strong>Acidity</strong></td><td>10</td><td>Good acidity = brightness, liveliness (apple, citrus). Bad = sharp, puckering</td></tr>
<tr><td><strong>Body</strong></td><td>10</td><td>Weight on the tongue — tea-like to cream-like. Look for: smoothness, viscosity</td></tr>
<tr><td><strong>Balance</strong></td><td>10</td><td>How flavors interact — no single element dominates</td></tr>
<tr><td><strong>Uniformity</strong></td><td>10</td><td>Sample consistency — 5 cups of same coffee. If one tastes different, it's a defect</td></tr>
<tr><td><strong>Clean Cup</strong></td><td>10</td><td>No technical defects (earthy, moldy, phenolic, etc.)</td></tr>
<tr><td><strong>Sweetness</strong></td><td>10</td><td>Natural sweetness — caramel, honey, brown sugar, ripe fruit. Good coffee is always sweet</td></tr>
<tr><td><strong>Overall</strong></td><td>10</td><td>Your overall impression — would you drink this daily? Buy for your cafe?</td></tr></table>
<h3>🔢 Scoring System</h3><p>Each attribute scored 0-10 in quarter-point increments (6.25, 6.5, 6.75...). Scores are summed, then × 2 for final result.<br><strong>Example:</strong> 7.5+8+7.75+8.25+7.5+8+8+8+8+8 = 79 × 2 = <strong>79/100</strong></p>
<div class="hl"><strong>📊 Classification Table:</strong><br>• 90-100: Outstanding — extremely rare<br>• 85-89.99: Excellent — high-end Specialty<br>• 80-84.99: Very Good — Specialty Grade<br>• 60-79.99: Commercial Grade<br>• Below 60: Below Grade</div>
<div class="info-box"><strong>💬 Did You Know?</strong> Less than 1% of world coffee scores 90+. These are sold at private auctions for $100+/lb (e.g., Panama Geisha).</div>
<div class="ok-box"><strong>🎯 Challenge:</strong> Find coffee with an SCA score on its bag (specialty roasters print this). Buy it, cup it, and score it yourself. Compare with the printed score. A 1-2 point difference is normal — with practice it shrinks.</div>`};

L['C2-0'] = {ar:`<h3>🫘 المعالجة الطبيعية (Natural) — أقدم تقنية في التاريخ</h3>
<p>المعالجة الطبيعية هي <strong>أقدم طريقة لمعالجة البن</strong>، استُخدمت في إثيوبيا واليمن منذ قرون دون تغيير جوهري. اسمها الآخر: <strong>Dry Process</strong>. الفكرة بسيطة: تجفف الثمرة كاملة — بقشرتها ولبها — تحت أشعة الشمس.</p>
<div class="img-c"><img src="${photo('processing_methods')}" alt="" loading="lazy"><div class="cap">🫘 طرق معالجة البن — من الطبيعية إلى التجريبية</div></div>
<h3>🔬 خطوات المعالجة الطبيعية</h3>
<ol><li><strong>القطف:</strong> تقطف الكرزات الحمراء الناضجة فقط (يدوياً أو ميكانيكياً)</li>
<li><strong>الفرز:</strong> تطفو الكرزات في الماء — الكرزات الناضجة تغوص، غير الناضجة تطفو (تُرفض)</li>
<li><strong>النشر:</strong> تنشر الكرزات على <strong>سراير التجفيف (African drying beds)</strong> أو في ساحات إسمنتية</li>
<li><strong>التقليب:</strong> تقلب الكرزات كل 2-4 ساعات لضمان تجفيف متساوٍ ومنع التعفن</li>
<li><strong>التجفيف:</strong> تستغرق 2-4 أسابيع حتى تصل رطوبة الكرزة إلى 11-12%</li>
<li><strong>الطحن الجاف:</strong> تزال القشرة واللب الميت ميكانيكياً — ينتج البن الأخضر</li></ol>
<h3>🌡️ ظروف التجفيف المثالية</h3>
<table><tr><th>العامل</th><th>النطاق المثالي</th></tr><tr><td>درجة الحرارة</td><td>30-40°م</td></tr><tr><td>الرطوبة النسبية</td><td>أقل من 60%</td></tr><tr><td>سمك طبقة الكرزات</td><td>2-5 سم</td></tr><tr><td>وقت التجفيف</td><td>15-30 يوماً</td></tr><tr><td>الرطوبة النهائية</td><td>10-12%</td></tr></table>
<h3>👃 نكهات المعالجة الطبيعية</h3><p><strong>المميزات:</strong> حلاوة عالية، نكهات فاكهية جريئة (توت، فراولة، عنبية)، قوام كامل، تعقيد.<br><strong>العيوب المحتملة:</strong> قد تظهر نكهات تخمّر غير مرغوب فيها، أو طعم ترابي إذا لم تُجفف بشكل صحيح.<br><strong>أشهر المناطق:</strong> إثيوبيا (طبيعية ييرغاشيفي)، اليمن، البرازيل، كوستاريكا.</p>
<div class="err-box"><strong>❌ خطأ شائع:</strong> ظن أن المعالجة الطبيعية أسهل من المغسولة. الحقيقة: المعالجة الطبيعية تتطلب مهارة عالية في التحكم بعملية التجفيف — خطأ بسيط يسبب تعفن الكرزات بالكامل.</div>
<div class="ok-box"><strong>🎯 نشاط:</strong> اشتر بناً طبيعياً ومغسولاً من نفس الأصل (مثلاً: إثيوبي ييرغاشيفي طبيعي ومغسول). حضّر بنفس الطريقة وتذوق الفرق. الطبيعي سيكون أحلى وأفاكهي، المغسول أنظف وأزهري.</div>`, en:`<h3>🫘 Natural Processing — The Oldest Technique in History</h3>
<p>Natural processing is the <strong>oldest coffee processing method</strong>, used in Ethiopia and Yemen for centuries without fundamental change. Also called <strong>Dry Process</strong>. The idea is simple: dry the whole cherry — skin, pulp and all — under the sun.</p>
<div class="img-c"><img src="${photo('processing_methods')}" alt="" loading="lazy"><div class="cap">🫘 Coffee Processing Methods — From Natural to Experimental</div></div>
<h3>🔬 Natural Processing Steps</h3>
<ol><li><strong>Harvest:</strong> Pick only ripe red cherries (hand or machine)</li>
<li><strong>Sorting:</strong> Float cherries in water — ripe ones sink, unripe float (rejected)</li>
<li><strong>Spreading:</strong> Spread on <strong>African drying beds</strong> or concrete patios</li>
<li><strong>Turning:</strong> Turn every 2-4 hours for even drying and to prevent mold</li>
<li><strong>Drying:</strong> Takes 2-4 weeks until cherry moisture reaches 11-12%</li>
<li><strong>Dry Milling:</strong> Dried skin and pulp removed mechanically — green coffee emerges</li></ol>
<h3>🌡️ Ideal Drying Conditions</h3>
<table><tr><th>Factor</th><th>Ideal Range</th></tr><tr><td>Temperature</td><td>30-40°C</td></tr><tr><td>Relative Humidity</td><td>Below 60%</td></tr><tr><td>Cherry Layer Thickness</td><td>2-5 cm</td></tr><tr><td>Drying Time</td><td>15-30 days</td></tr><tr><td>Final Moisture</td><td>10-12%</td></tr></table>
<h3>👃 Natural Processing Flavors</h3><p><strong>Strengths:</strong> High sweetness, bold fruity notes (berry, strawberry, blueberry), full body, complexity.<br><strong>Potential defects:</strong> Unpleasant fermented notes, earthy taste if not dried properly.<br><strong>Famous regions:</strong> Ethiopia (Yirgacheffe Natural), Yemen, Brazil, Costa Rica.</p>
<div class="err-box"><strong>❌ Common Mistake:</strong> Thinking natural processing is easier than washed. Truth: natural processing requires high skill in controlling the drying process — a small mistake can ruin the entire batch.</div>
<div class="ok-box"><strong>🎯 Activity:</strong> Buy natural and washed coffee from the same origin (e.g., Ethiopian Yirgacheffe). Brew both the same way and taste the difference. Natural will be sweeter and fruitier, washed will be cleaner and more floral.</div>`};

L['C2-1'] = {ar:`<h3>💧 المعالجة المغسولة (Washed) — النقاء والوضوح</h3>
<p>المعالجة المغسولة — أو <strong>Wet Process</strong> — اخترعها الهولنديون في جاوة بالقرن الثامن عشر. فكرتها: إزالة القشرة واللب فور قطف الثمرة، قبل التجفيف. النتيجة: <strong>قهوة أنقى وأكثر إشراقاً</strong> تبرز النكهات الأصلية للبن.</p>
<h3>🔬 خطوات المعالجة المغسولة</h3>
<ol><li><strong>القطف والفرز:</strong> تطفو الكرزات في الماء — تفصل الناضجة عن غير الناضجة</li>
<li><strong>نزع القشرة (Depulping):</strong> تمر الكرزات في ماكينة تزيل القشرة واللب الخارجي ميكانيكياً</li>
<li><strong>التخمير (Fermentation):</strong> توضع البذور — مغطاة بطبقة الميوسيلاج اللزجة — في أحواض تخمير لمدة 24-36 ساعة. البكتيريا والخمائر تفكك السكريات اللزجة</li>
<li><strong>الغسيل (Washing):</strong> تغسل البذور بالماء النظيف لإزالة كل آثار الميوسيلاج المتخمر</li>
<li><strong>التجفيف:</strong> تجفف البذور (بقشرتها الرقيقة) على سراير التجفيف لمدة 7-15 يوماً حتى 11-12% رطوبة</li>
<li><strong>الطحن الرطب (Wet Milling):</strong> تزال القشرة الرقيقة (Parchment) وطبقة الفضة ميكانيكياً</li></ol>
<h3>💧 استهلاك المياه</h3>
<p>المعالجة المغسولة تستهلك <strong>كمية كبيرة من الماء</strong> — 40-60 لتر لكل كيلو بن أخضر. هذا يمثل تحدياً بيئياً كبيراً في مناطق زراعة البن التي تعاني من شح المياه. التقنيات الحديثة قلّصت الاستهلاك إلى 5-10 لتر باستخدام أنظمة إعادة التدوير.</p>
<h3>👃 نكهات المعالجة المغسولة</h3>
<p><strong>المميزات:</strong> نقاء عالٍ، حموضة متألقة، نكهات زهرية وحمضية واضحة، قوام خفيف إلى متوسط.<br><strong>المساوئ:</strong> قد تفتقر إلى التعقيد والحلاوة التي تمنحها المعالجة الطبيعية.<br><strong>أشهر المناطق:</strong> كولومبيا، كينيا، كوستاريكا، إثيوبيا المغسولة.</p>
<div class="hl"><strong>📊 مقارنة:</strong> المغسولة تبرز الشخصية الحقيقية للحبة (Terroir) — النكهات التي تعطيها التربة والمناخ. الطبيعية تضيف نكهات من التخمير نفسه — طبقة إضافية فوق Terroir.</div>
<div class="info-box"><strong>💬 حقائق:</strong> 60% من إنتاج البن في أمريكا الوسطى مغسول. في إثيوبيا، نسبة المغسول تتزايد — من 30% في 2010 إلى 50% في 2025.</div>`, en:`<h3>💧 Washed Processing — Purity and Clarity</h3>
<p>Washed processing — or <strong>Wet Process</strong> — was invented by the Dutch in 18th century Java. The idea: remove the skin and pulp immediately after harvesting, before drying. The result: <strong>cleaner, brighter coffee</strong> that highlights the bean's original flavors.</p>
<h3>🔬 Washed Processing Steps</h3>
<ol><li><strong>Harvest &amp; Sort:</strong> Cherries floated in water — ripe from unripe separated</li>
<li><strong>Depulping:</strong> Cherries pass through a machine that removes skin and outer pulp mechanically</li>
<li><strong>Fermentation:</strong> Seeds — covered in sticky mucilage — sit in fermentation tanks for 24-36 hours. Bacteria and yeasts break down the sticky sugars</li>
<li><strong>Washing:</strong> Seeds washed with clean water to remove all fermented mucilage</li>
<li><strong>Drying:</strong> Seeds dried (with parchment intact) on drying beds for 7-15 days to 11-12% moisture</li>
<li><strong>Wet Milling:</strong> Parchment and silver skin removed mechanically</li></ol>
<h3>💧 Water Consumption</h3>
<p>Washed processing consumes <strong>significant water</strong> — 40-60 liters per kg of green coffee. This is a major environmental challenge in coffee-growing regions facing water scarcity. Modern technology has reduced this to 5-10L using recycling systems.</p>
<h3>👃 Washed Processing Flavors</h3>
<p><strong>Strengths:</strong> High clarity, bright acidity, clear floral and citrus notes, light to medium body.<br><strong>Weaknesses:</strong> May lack the complexity and sweetness of natural processing.<br><strong>Famous regions:</strong> Colombia, Kenya, Costa Rica, washed Ethiopians.</p>
<div class="hl"><strong>📊 Comparison:</strong> Washed highlights the true character of the bean (Terroir) — flavors imparted by soil and climate. Natural adds fermentation flavors — an extra layer on top of Terroir.</div>
<div class="info-box"><strong>💬 Facts:</strong> 60% of Central American coffee is washed. In Ethiopia, washed percentage is increasing — from 30% in 2010 to 50% in 2025.</div>`};

L['C2-2'] = {ar:`<h3>🍯 المعالجة بالعسل والتجريبية — الابتكار في المذاق</h3>
<p>المعالجة بالعسل (Honey Process) هي <strong>الوسيط بين الطبيعية والمغسولة</strong>. تُترك طبقة من الميوسيلاج (اللب اللزج الحلو) على البذرة أثناء التجفيف. كلمة "عسل" تشير إلى <strong>لزوجة الميوسيلاج</strong> وليس العسل الحقيقي.</p>
<h3>🍯 أنواع المعالجة بالعسل — 3 مستويات</h3>
<table><tr><th>النوع</th><th>كمية اللب المتروك</th><th>النكهة</th></tr>
<tr><td><strong>أصفر (Yellow Honey)</strong></td><td>قليلة — 20-30%</td><td>أنقى نكهة — قريبة من المغسولة، حموضة متوسطة</td></tr>
<tr><td><strong>أحمر (Red Honey)</strong></td><td>متوسطة — 50-60%</td><td>توازن — حلاوة طبيعية مع حموضة خفيفة، قوام كامل</td></tr>
<tr><td><strong>أسود (Black Honey)</strong></td><td>كاملة — 80-100%</td><td>أغنى نكهة — حلاوة عالية، نكهات فاكهية داكنة، قوام ثقيل</td></tr></table>
<h3>🧪 المعالجات التجريبية — حدود جديدة للطعم</h3>
<p><strong>التخمير اللاهوائي (Anaerobic Fermentation):</strong> توضع الكرزات في خزانات محكمة الإغلاق مع إزالة الأكسجين. يتم التخمير بواسطة بكتيريا لا تحتاج أكسجين — تنتج نكهات جريئة، فاكهية استوائية، أزهار غريبة. يستغرق 48-120 ساعة.</p>
<p><strong>الكربونيك ماكيريشن (Carbonic Maceration):</strong> مقتبسة من صناعة النبيذ — توضع الكرزات الكاملة في بيئة CO₂ نقية. التخمير داخل الثمرة نفسها ينتج نكهات <strong>مذهلة</strong>: نبيذية، توت أحمر، أزهار، بهارات. أشهر مثال: قهوة كوستاريكا "Las Lajas" الحاصلة على 93 نقطة.</p>
<p><strong>التخمير بالخمائر المختارة (Yeast Inoculation):</strong> تضاف سلالات خمائر محددة (مثل Saccharomyces cerevisiae) للتحكم بدقة في نواتج التخمير. مثلاً: خميرة التوت البري تعطي نكهات توت واضحة.</p>
<div class="hl"><strong>📊 سوق المعالجات التجريبية:</strong> في 2015، كانت أقل من 2% من قهوة specialty تجريبية. في 2025، تتجاوز 15% — والمستهلكون يدفعون 30-50% أكثر ثمناً لها. هذا هو مستقبل القهوة المختصة.</div>
<div class="ok-box"><strong>🎯 تجربة:</strong> ابحث عن قهوة "Anaerobic Natural" أو "Carbonic Maceration" من محمصة specialty محلية. قارنها مع قهوة مغسولة من نفس البلد. الفرق سيكون صادماً — كأنها فاكهة سائلة!</div>`, en:`<h3>🍯 Honey & Experimental Processing — Innovation in Taste</h3>
<p>Honey processing is the <strong>middle ground between natural and washed</strong>. A layer of mucilage (sticky sweet pulp) is left on the bean during drying. The word "honey" refers to the <strong>stickiness of the mucilage</strong>, not actual honey.</p>
<h3>🍯 Types of Honey Processing — 3 Levels</h3>
<table><tr><th>Type</th><th>Mucilage Left</th><th>Flavor</th></tr>
<tr><td><strong>Yellow Honey</strong></td><td>Minimal — 20-30%</td><td>Cleanest — close to washed, medium acidity</td></tr>
<tr><td><strong>Red Honey</strong></td><td>Medium — 50-60%</td><td>Balanced — natural sweetness with light acidity</td></tr>
<tr><td><strong>Black Honey</strong></td><td>Full — 80-100%</td><td>Richest — high sweetness, dark fruity notes, heavy body</td></tr></table>
<h3>🧪 Experimental Processing — New Flavor Frontiers</h3>
<p><strong>Anaerobic Fermentation:</strong> Cherries placed in sealed tanks with oxygen removed. Fermented by bacteria that don't need oxygen — producing bold, tropical fruit, exotic floral notes. Takes 48-120 hours.</p>
<p><strong>Carbonic Maceration:</strong> Borrowed from winemaking — whole cherries placed in pure CO₂ environment. Fermentation inside the fruit produces <strong>stunning</strong> flavors: winey, red berry, floral, spicy. Famous example: Costa Rica "Las Lajas" scoring 93 points.</p>
<p><strong>Yeast Inoculation:</strong> Specific yeast strains added (e.g., Saccharomyces cerevisiae) to precisely control fermentation byproducts. E.g., cranberry yeast gives clear berry notes.</p>
<div class="hl"><strong>📊 Experimental Market:</strong> In 2015, less than 2% of specialty coffee was experimental. By 2025, it exceeds 15% — and consumers pay 30-50% more for it. This is the future of specialty coffee.</div>
<div class="ok-box"><strong>🎯 Experience:</strong> Find an "Anaerobic Natural" or "Carbonic Maceration" coffee from a local specialty roaster. Compare it with a washed coffee from the same country. The difference will be shocking — like liquid fruit!</div>`};

L['C3-0'] = {ar:`<h3>🏪 تخطيط وتشغيل المقهى — من الفكرة إلى الواقع</h3><p>افتتاح مقهى ناجح يبدأ قبل أول كوب قهوة بفترة طويلة. <strong>التخطيط الجيد</strong> هو الفرق بين مقهى يغلق بعد 6 أشهر ومقهى يستمر لعقود. في هذه الوحدة، سنغطي كل جوانب التخطيط.</p>
<div class="img-c"><img src="${photo('cafe')}" alt="" loading="lazy"><div class="cap">🏪 تصميم المقهى — تخطيط المساحة والعمل</div></div>
<h3>📍 اختيار الموقع — أهم قرار</h3><p>الموقع الجيد هو <strong>أكثر من 50% من نسبة النجاح</strong>.<br>• <strong>الرؤية (Visibility):</strong> هل المقهى مرئي من الشارع الرئيسي؟ هل هناك لافتة واضحة؟<br>• <strong>حركة المشاة (Foot Traffic):</strong> كم شخص يمر أمام المقهى يومياً؟ هل هم جمهورك المستهدف؟<br>• <strong>المنافسة:</strong> كم مقهى في المنطقة؟ ماذا يقدمون؟ أين فرصتك التنافسية؟<br>• <strong>مواقف السيارات:</strong> هل هناك مواقف كافية للزبائن؟</p>
<h3>📐 تصميم المساحة — تدفق العمل</h3><table><tr><th>المنطقة</th><th>الوظيفة</th><th>المساحة المثلى</th></tr><tr><td>منطقة العمل الخلفية (Back of House)</td><td>تخزين، تحميص (إن وجد)، تجهيز</td><td>30-40% من المساحة</td></tr><tr><td>منطقة الباريستا (Front Bar)</td><td>تحضير القهوة، تقديم الخدمة</td><td>15-20%</td></tr><tr><td>منطقة الجلوس (Seating)</td><td>استقبال الزبائن</td><td>40-50%</td></tr><tr><td>منطقة الانتظار والدفع</td><td>تنظيم الطلبات</td><td>5-10%</td></tr></table>
<div class="hl"><strong>💡 مبدأ المثلث الذهبي:</strong> في تصميم المقهى، شكل المثلث بين (منطقة الدفع) و (منطقة تسليم القهوة) و (منطقة تحضير الحليب) هو مفتاح سرعة الخدمة. المسافة بين كل نقطة يجب ألا تزيد عن 1.5 متر.</div>
<h3>⚙️ اختيار المعدات — استثمار طويل المدى</h3><p><strong>ماكينة الإسبريسو:</strong> أهم قطعة معدات. اختر ماكينة تناسب حجم عملك (مجموعتين أو 3 للمقاهي متوسطة الحجم). الماركات الموثوقة: La Marzocco، Linea، Nuova Simonelli، Rancilio.<br><strong>المطاحن:</strong> لا توفر في المطحنة — مطحنة جيدة تعني قهوة متسقة. استثمر في مطحنة إسبريسو (Mythos، EK43) ومطحنة للقهوة المقطرة.<br><strong>فلتر المياه:</strong> ماء جيد = قهوة جيدة. نظام كربون نشط + تبادل أيوني كافٍ لمعظم المقاهي.</p>
<div class="err-box"><strong>❌ خطأ شائع:</strong> شراء معدات رخيصة لتوفير التكاليف. الحقيقة: المعدات الرخيصة تتعطل باستمرار وتنتج قهوة غير متسقة — خسارة أكبر على المدى الطويل.</div>
<div class="ok-box"><strong>✅ قائمة التحقق قبل الافتتاح:</strong> رخصة البلدية ✓ · فحص الدفاع المدني ✓ · فلاتر المياه ✓ · تدريب الطاقم ✓ · اختبار القائمة ✓ · تصميم قائمة الأسعار ✓ · نظام نقاط البيع (POS) ✓</div>`, en:`<h3>🏪 Cafe Planning & Operations — From Idea to Reality</h3><p>Opening a successful cafe starts long before the first cup of coffee. <strong>Good planning</strong> is the difference between a cafe that closes after 6 months and one that lasts for decades. This module covers every aspect of planning.</p>
<div class="img-c"><img src="${photo('cafe')}" alt="" loading="lazy"><div class="cap">🏪 Cafe Design — Space & Workflow Planning</div></div>
<h3>📍 Location Selection — The Most Important Decision</h3><p>A good location accounts for <strong>over 50% of success</strong>.<br>• <strong>Visibility:</strong> Is the cafe visible from the main street? Is there clear signage?<br>• <strong>Foot Traffic:</strong> How many people pass by daily? Are they your target audience?<br>• <strong>Competition:</strong> How many cafes in the area? What do they offer? What's your competitive edge?<br>• <strong>Parking:</strong> Is there adequate parking for customers?</p>
<h3>📐 Space Design — Workflow</h3><table><tr><th>Zone</th><th>Function</th><th>Ideal Space</th></tr><tr><td>Back of House</td><td>Storage, roasting, prep</td><td>30-40%</td></tr><tr><td>Front Bar</td><td>Brewing, service</td><td>15-20%</td></tr><tr><td>Seating Area</td><td>Customer comfort</td><td>40-50%</td></tr><tr><td>Waiting &amp; Payment</td><td>Order flow</td><td>5-10%</td></tr></table>
<div class="hl"><strong>💡 The Golden Triangle Principle:</strong> In cafe design, the triangle between (payment point), (coffee pickup), and (milk prep station) is key to service speed. Distance between each point should not exceed 1.5m.</div>
<h3>⚙️ Equipment Selection — Long-term Investment</h3><p><strong>Espresso Machine:</strong> The most important equipment piece. Choose a machine matching your volume (2 or 3-group for medium cafes). Trusted brands: La Marzocco, Linea, Nuova Simonelli, Rancilio.<br><strong>Grinders:</strong> Don't skimp on the grinder — a good grinder means consistent coffee. Invest in an espresso grinder (Mythos, EK43) and a brew grinder.<br><strong>Water Filtration:</strong> Good water = good coffee. Carbon + ion exchange filter is sufficient for most cafes.</p>
<div class="err-box"><strong>❌ Common Mistake:</strong> Buying cheap equipment to save costs. Truth: cheap equipment breaks down constantly and produces inconsistent coffee — bigger loss long-term.</div>
<div class="ok-box"><strong>✅ Pre-Opening Checklist:</strong> Municipal license ✓ · Fire safety inspection ✓ · Water filters ✓ · Staff training ✓ · Menu testing ✓ · Price list design ✓ · POS system ✓</div>`};

L['C3-1'] = {ar:`<h3>💰 حسابات التكاليف والأرباح — إدارة مالية للمقاهي</h3><p>فهم التكاليف هو ما يحول شغف القهوة إلى عمل تجاري ناجح. كثير من المقاهي تفشل ليس لأن قهوتهم سيئة، بل لأنهم لا يفهمون <strong>الأرقام</strong>.</p>
<h3>📊 هيكل التكاليف في المقهى</h3>
<table><tr><th>نوع التكلفة</th><th>النسبة التقريبية</th><th>أمثلة</th></tr><tr><td>تكلفة المشروبات (COGS)</td><td>25-35%</td><td>البن، الحليب، الشوكولاتة، الإضافات</td></tr><tr><td>الإيجار</td><td>10-20%</td><td>الإيجار الشهري + الصيانة</td></tr><tr><td>الرواتب</td><td>25-35%</td><td>الباريستا، المدير، العمالة</td></tr><tr><td>المصاريف التشغيلية</td><td>10-15%</td><td>كهرباء، ماء، إنترنت، تنظيف</td></tr><tr><td>التسويق</td><td>3-5%</td><td>إعلانات، وسائل تواصل</td></tr><tr><td>الإهلاك والطوارئ</td><td>5-10%</td><td>صيانة المعدات، تجديدات</td></tr></table>
<h3>🧮 حساب تكلفة المشروب (Cost per Drink)</h3><p><strong>معادلة التكلفة:</strong> وزن البن (جرام) × سعر الكيلو ÷ 1000 + الحليب + الإضافات + التغليف<br><br><strong>مثال (لاتيه):</strong><br>• بن: 18 جرام × 400 جنيه/كجم = 7.2 جنيه<br>• حليب: 200 مل × 30 جنيه/لتر = 6 جنيه<br>• كوب + غطاء = 1.5 جنيه<br>• إجمالي = 14.7 جنيه ← سعر البيع = 60 جنيه ← هامش = 75% ✅</p>
<h3>🎯 مؤشرات الأداء الرئيسية (KPIs)</h3><p>• <strong>هامش الربح الإجمالي:</strong> يجب أن يكون 70-80% للمشروبات<br>• <strong>متوسط قيمة الفاتورة:</strong> كم ينفق الزبون في كل زيارة؟<br>• <strong>معدل دوران الطاولات:</strong> كم زبون لكل طاولة في اليوم؟<br>• <strong>نقطة التعادل (Break-even):</strong> كم كوب قهوة يجب أن تبيع لتغطي التكاليف الثابتة؟</p>
<div class="hl"><strong>📊 مثال لحساب نقطة التعادل:</strong><br>التكاليف الثابتة الشهرية (إيجار + رواتب + مصاريف) = 50,000 جنيه<br>هامش الربح لكل كوب = 45 جنيه (سعر 60 - تكلفة 15)<br>نقطة التعادل = 50,000 ÷ 45 = 1,112 كوب شهرياً ≈ 37 كوب يومياً</div>
<div class="err-box"><strong>❌ خطأ شائع:</strong> نسيان التكاليف الخفية — أكواب مسربة، أخطاء في التحضير، خصومات، قهوة مجانية للموظفين. أضف 5-10% "هدر" إلى حساباتك.</div>`, en:`<h3>💰 Cost & Profit — Financial Management for Cafes</h3><p>Understanding costs is what turns coffee passion into a successful business. Many cafes fail not because their coffee is bad, but because they don't understand the <strong>numbers</strong>.</p>
<h3>📊 Cafe Cost Structure</h3>
<table><tr><th>Cost Type</th><th>Approx %</th><th>Examples</th></tr><tr><td>COGS (Beverage Cost)</td><td>25-35%</td><td>Coffee, milk, chocolate, syrups</td></tr><tr><td>Rent</td><td>10-20%</td><td>Monthly rent + maintenance</td></tr><tr><td>Labor</td><td>25-35%</td><td>Baristas, manager, staff</td></tr><tr><td>Operating Expenses</td><td>10-15%</td><td>Electricity, water, internet, cleaning</td></tr><tr><td>Marketing</td><td>3-5%</td><td>Ads, social media</td></tr><tr><td>Depreciation &amp; Contingency</td><td>5-10%</td><td>Equipment maintenance, renovations</td></tr></table>
<h3>🧮 Cost Per Drink Calculation</h3><p><strong>Formula:</strong> Coffee weight (g) × price per kg ÷ 1000 + milk + add-ons + packaging<br><br><strong>Example (Latte):</strong><br>• Coffee: 18g × 400 EGP/kg = 7.2 EGP<br>• Milk: 200ml × 30 EGP/L = 6 EGP<br>• Cup + lid = 1.5 EGP<br>• Total = 14.7 EGP ← Selling price = 60 EGP ← Margin = 75% ✅</p>
<h3>🎯 Key KPIs</h3><p>• <strong>Gross Profit Margin:</strong> 70-80% for drinks<br>• <strong>Average Ticket:</strong> How much per visit?<br>• <strong>Table Turnover:</strong> How many customers per table daily?<br>• <strong>Break-even Point:</strong> How many cups to cover fixed costs?</p>
<div class="hl"><strong>📊 Break-even Example:</strong><br>Monthly fixed costs (rent + labor + expenses) = $15,000<br>Profit per cup = $1.50 (price $2 - cost $0.50)<br>Break-even = 15,000 ÷ 1.50 = 10,000 cups/month ≈ 333 cups/day</div>
<div class="err-box"><strong>❌ Common Mistake:</strong> Forgetting hidden costs — spilled cups, remakes, discounts, free staff drinks. Add 5-10% "waste" to your calculations.</div>`};

L['C3-2'] = {ar:`<h3>🤝 خدمة العملاء المتميزة — قلب المقهى الناجح</h3><p>الزبون لا يشتري قهوة فقط — يشتري <strong>تجربة</strong>. في سوق تنافسي، خدمة العملاء المتميزة هي ما يجعلك مختلفاً. القهوة الجيدة تجذب الزبون، الخدمة الممتازة تعيده.</p>
<h3>📋 معايير الخدمة الذهبية</h3>
<table><tr><th>المعيار</th><th>التفاصيل</th></tr><tr><td>الاستقبال</td><td>ابتسم، رحب بالزبون خلال 30 ثانية من دخوله، حتى لو كنت مشغولاً</td></tr><tr><td>طلب القهوة</td><td>اسأل عن التفضيلات: نوع الحليب؟ حرارة؟ سكر؟</td></tr><tr><td>التقديم</td><td>قدم القهوة بيديك، اذكر اسم المشروب، ابتسم</td></tr><tr><td>المتابعة</td><td>بعد 2-3 دقائق، اسأل: "كيف القهوة؟ هل تحتاج شيئاً؟"</td></tr><tr><td>الوداع</td><td>شكراً بالاسم (إذا كنت تعرفه)، ابتسامة، ادعوه للعودة</td></tr></table>
<h3>💬 التعامل مع الشكاوى — تحويل السلبي إلى إيجابي</h3><p>الزبون الذي يشتكي  ويرتاح  يعود مرة أخرى. الزبون الذي يشتكي ولا يرتاح  يخبر 10 أشخاص.<br><strong>بروتوكول التعامل مع الشكوى:</strong></p><ol><li><strong>استمع</strong> بانتباه كامل — لا تقاطع</li><li><strong>اعتذر</strong> بصدق — ليس بالضرورة أن تكون مخطئاً، لكنك آسف لتجربته السيئة</li><li><strong>حلّ</strong> بسرعة — أعد تحضير المشروب فوراً، لا تجعل الزبون ينتظر</li><li><strong>عوّض</strong> — مشروب مجاني في الزيارة القادمة أو خصم</li><li><strong>سجّل</strong> الشكوى وحلّها لتحسين العمل مستقبلاً</li></ol>
<div class="hl"><strong>📊 إحصائية:</strong> 70% من الزبائن الذين يقدمون شكوى ويعالجون بشكل جيد يعودون للشراء. إذا تم حلها بسرعة، ترتفع النسبة إلى 95%.</div>
<h3>🎯 برنامج الولاء — لماذا يعود الزبون؟</h3><p><strong>بطاقة الولاء:</strong> اشتر 10 قهوات واحصل على 11 مجاناً — بسيطة لكنها فعّالة.<br><strong>الزبون الدائم:</strong> تذكر اسمه، مشروبه المفضل، واستفسر عن عائلته/عمله.<br><strong>المفاجآت السارة:</strong> مرة كل أسبوع، قدم لزبون دائم مشروباً مجاناً "بمناسبة اليوم" — سينشر الخبر لأصدقائه.</p>
<div class="err-box"><strong>❌ خطأ شائع:</strong> تجاهل الزبون أثناء تصفح الجوال أو التحضير. الزبون يريد أن يشعر أنه مهم. انظر في عينيه، ابتسم، وتفاعل.</div>`, en:`<h3>🤝 Premium Customer Service — Heart of a Successful Cafe</h3><p>Customers don't just buy coffee — they buy an <strong>experience</strong>. In a competitive market, exceptional customer service is what sets you apart. Good coffee attracts customers, great service brings them back.</p>
<h3>📋 Golden Service Standards</h3>
<table><tr><th>Standard</th><th>Details</th></tr><tr><td>Greeting</td><td>Smile, welcome within 30 seconds of entry, even if busy</td></tr><tr><td>Order Taking</td><td>Ask preferences: milk type? Temperature? Sugar?</td></tr><tr><td>Serving</td><td>Present with both hands, name the drink, smile</td></tr><tr><td>Follow-up</td><td>After 2-3 minutes, ask: "How's your coffee? Need anything?"</td></tr><tr><td>Farewell</td><td>Thank by name (if regular), smile, invite to return</td></tr></table>
<h3>💬 Handling Complaints — Turning Negative into Positive</h3><p>A customer who complains and is satisfied returns. One who complains and is unsatisfied tells 10 people.<br><strong>Complaint Protocol:</strong></p><ol><li><strong>Listen</strong> fully — don't interrupt</li><li><strong>Apologize</strong> sincerely — not admitting fault, but sorry for their experience</li><li><strong>Solve</strong> quickly — remake immediately, don't make them wait</li><li><strong>Compensate</strong> — free drink next visit or discount</li><li><strong>Log</strong> the complaint and solution to improve</li></ol>
<div class="hl"><strong>📊 Stat:</strong> 70% of complaining customers who are satisfied return. If resolved quickly, the rate rises to 95%.</div>
<h3>🎯 Loyalty Programs — Why Customers Return</h3><p><strong>Punch Card:</strong> Buy 10, get 1 free — simple but effective.<br><strong>Regulars:</strong> Remember their name, favorite drink, ask about family/work.<br><strong>Surprise &amp; Delight:</strong> Once a week, offer a regular a free drink "just because" — they'll tell their friends.</p>
<div class="err-box"><strong>❌ Common Mistake:</strong> Ignoring customers while scrolling your phone or prepping. Customers want to feel important. Make eye contact, smile, engage.</div>`};

L['C3-3'] = {ar:`<h3>👥 تطوير فريق العمل — من الباريستا إلى القائد</h3>
<p>فريق العمل هو <strong>أهم أصول المقهى</strong>. المعدات الجيدة والقهوة الممتازة لا تساوي شيئاً بدون فريق مدرب ومتحمس. الباريستا ليس مجرد موظف — إنه <strong>سفير المقهى</strong> وأول من يتفاعل مع الزبون.</p>
<h3>📋 نظام التدريب الشامل — 4 مستويات</h3>
<table><tr><th>المستوى</th><th>المدة</th><th>المهارات</th></tr>
<tr><td><strong>Level 1 — أساسي</strong></td><td>الأسبوع الأول</td><td>نظافة محطة العمل، طحن وتامبنج، تسخين الحليب، تحضير مشروبات الإسبريسو الأساسية (إسبريسو، لاتيه، كابتشينو)</td></tr>
<tr><td><strong>Level 2 — متوسط</strong></td><td>2-4 أسابيع</td><td>Latte Art (قلب، روزيتا)، ضبط الطحن (Dial-in)، قراءة منحنيات التحميص، خدمة العملاء المتميزة</td></tr>
<tr><td><strong>Level 3 — متقدم</strong></td><td>1-3 أشهر</td><td>كابينج وتقييم حسي، تحضير القهوة المقطرة (V60, Chemex, AeroPress)، معرفة أصول البن ومناطق الإنتاج</td></tr>
<tr><td><strong>Level 4 — خبير</strong></td><td>3-6 أشهر</td><td>إدارة المخزون، التدريب الداخلي (Train the Trainer)، تطوير وصفات المشروبات الموسمية، المشاركة في مسابقات باريستا</td></tr></table>
<h3>📅 الجدول الأسبوعي المثالي</h3>
<p><strong>الاثنين:</strong> كابينج أسبوعي — تذوق 3-5 أنواع بن مع الفريق. ناقش النكهات، المصادر، درجات التحميص. سجل ملاحظاتكم.<br><strong>الأربعاء:</strong> تدريب تقني — ركز على مهارة محددة (مثلاً: تحسين الـ Latte Art أو ضبط الطحن).<br><strong>الجمعة:</strong> اختبار — اختبار نظري (10 أسئلة) وعملي (تحضير مشروبين). سجل النتائج وتتبع التحسن.<br><strong>يومياً:</strong> 5 دقائق قبل الافتتاح — تذوق سريع للإسبريسو للتأكد من الجودة.</p>
<h3>🎯 بناء ثقافة الفريق</h3>
<p>• <strong>التقدير:</strong> كلمة شكر علنية عندما يقدم أحدهم خدمة ممتازة — فعالة أكثر من المكافآت المادية<br>• <strong>الشفافية:</strong> شارك الفريق أرقام المبيعات والتكاليف — عندما يفهم الموظف "لماذا"، يصبح جزءاً من الحل<br>• <strong>التطوير:</strong> كل موظف يستحق خطة تطوير شخصية. اسأله: "أين تريد أن تكون بعد 6 أشهر؟"<br>• <strong>الاحتفال:</strong> حفلة صغيرة عند تحقيق هدف معين (أول 1000 كوب في الشهر، أفضل تقييم من الزبائن)</p>
<div class="err-box"><strong>❌ خطأ شائع:</strong> افتراض أن الباريستا الجيد = موظف جيد. الحقيقة: مهارات القهوة يمكن تعليمها. الموقف (Attitude) لا يمكن. وظِّف على الموقف، درّب على المهارات.</div>
<div class="ok-box"><strong>💡 قاعدة 70-20-10:</strong> 70% من التعلم = العمل الفعلي (On-the-job). 20% = التعلم من الآخرين (زملاء، مرشدين). 10% = التعلم الرسمي (دورات، كتب). صمم برنامجك التدريبي بناءً على هذه النسب.</div>
<div class="quiz-box"><strong>💬 تحدّ:</strong> صمم خطة تدريب لموظف جديد لمدة شهر واحد. حدد: كل أسبوع ماذا سيتعلم، كيف ستقيس تقدمه، ومتى سيعمل بمفرده.</div>`, en:`<h3>👥 Team Development — From Barista to Leader</h3>
<p>The team is the <strong>cafe's most valuable asset</strong>. Great equipment and excellent coffee are worthless without a trained, motivated team. A barista is not just an employee — they are the <strong>cafe's ambassador</strong> and the first point of contact with customers.</p>
<h3>📋 Comprehensive Training System — 4 Levels</h3>
<table><tr><th>Level</th><th>Duration</th><th>Skills</th></tr>
<tr><td><strong>Level 1 — Basic</strong></td><td>Week 1</td><td>Workstation hygiene, grinding &amp; tamping, milk steaming, basic espresso drinks (espresso, latte, cappuccino)</td></tr>
<tr><td><strong>Level 2 — Intermediate</strong></td><td>2-4 weeks</td><td>Latte Art (heart, rosetta), Dial-in, reading roast curves, premium customer service</td></tr>
<tr><td><strong>Level 3 — Advanced</strong></td><td>1-3 months</td><td>Cupping &amp; sensory evaluation, pour-over (V60, Chemex, AeroPress), coffee origins knowledge</td></tr>
<tr><td><strong>Level 4 — Expert</strong></td><td>3-6 months</td><td>Inventory management, Train the Trainer, seasonal drink recipes, barista competition participation</td></tr></table>
<h3>📅 Ideal Weekly Schedule</h3>
<p><strong>Monday:</strong> Weekly cupping — taste 3-5 coffees as a team. Discuss flavors, origins, roast levels. Log your notes.<br><strong>Wednesday:</strong> Technical training — focus on one specific skill (improving Latte Art or dial-in).<br><strong>Friday:</strong> Assessment — theory test (10 questions) + practical (prepare 2 drinks). Record scores and track improvement.<br><strong>Daily:</strong> 5 minutes before opening — quick espresso taste test to ensure quality.</p>
<h3>🎯 Building Team Culture</h3>
<p>• <strong>Recognition:</strong> A public "thank you" when someone provides excellent service — more effective than monetary rewards<br>• <strong>Transparency:</strong> Share sales numbers and costs with the team — when an employee understands "why," they become part of the solution<br>• <strong>Development:</strong> Every employee deserves a personal development plan. Ask them: "Where do you want to be in 6 months?"<br>• <strong>Celebration:</strong> A small party when hitting a target (first 1000 cups in a month, best customer rating)</p>
<div class="err-box"><strong>❌ Common Mistake:</strong> Assuming a good barista = good employee. Truth: coffee skills can be taught. Attitude cannot. Hire for attitude, train for skills.</div>
<div class="ok-box"><strong>💡 70-20-10 Rule:</strong> 70% of learning = on-the-job. 20% = learning from others (peers, mentors). 10% = formal education (courses, books). Design your training program based on these ratios.</div>
<div class="quiz-box"><strong>💬 Challenge:</strong> Design a one-month training plan for a new employee. Define: what they'll learn each week, how you'll measure progress, and when they'll work independently.</div>`};

L['A1-4'] = {ar:`<h3>🕌 القهوة في الثقافة والدين — من الحلال إلى الحرام</h3><p>لعب الدين والثقافة دوراً <strong>محورياً في تاريخ القهوة</strong>. في مكة 1511، حاول حاكم مكة منع القهوة — لكن الأطباء والعلماء أثبتوا أنها ليست مسكرة، بل منبهة. انتصرت القهوة. في الكنيسة الكاثوليكية، أطلق عليها البابا كليمنت الثامن عام 1600 اسم "مشروب الشيطان" قبل أن يباركها شخصياً بعد تذوقها. في المقاهي الأوروبية، سميت "Penny Universities" لأن بنساً واحداً يشتري لك فنجاناً ومحادثة مع أعظم عقول العصر.</p><div class="hl"><strong>📊 التسامح الديني مع القهوة:</strong> христианство ← الكنيسة البروتستانتية اعتبرتها "مشروب اليقظة" الذي يعين على العمل والعبادة. اليهودية ← حاخامات اليمن اعتبروها "طعاماً للروح". الإسلام ← أجمع الفقهاء على حلاليتها بعد جدال دام 200 عام.</div><div class="img-c"><img src="${photo('mecca_cafe')}" alt="" loading="lazy"><div class="cap">🕌 أول مقهى في مكة 1511 — حيث بدأت ثقافة المقاهي</div></div><div class="quiz-box"><strong>💬 تحدّ:</strong> هل تعتقد أن للقهوة علاقة بنهضة أوروبا؟ المؤرخون يقولون: المقاهي حلت محل الحانات — وعي صافٍ بدلاً من السكر. فتحت باب النقاش العلمي والفكري. المصادفة؟</div>`, en:`<h3>🕌 Coffee in Culture & Religion — From Banned to Blessed</h3><p>Religion and culture played a <strong>pivotal role in coffee's history</strong>. In Mecca 1511, the governor tried to ban coffee — but doctors and scholars proved it wasn't intoxicating, just stimulating. Coffee won. In the Catholic Church, Pope Clement VIII called it "Satan's drink" in 1600 before tasting and personally blessing it. In European coffeehouses, they were called "Penny Universities" because a penny bought you a cup and conversation with the greatest minds of the age.</p><div class="hl"><strong>📊 Religious Acceptance:</strong> Christianity ← Protestants embraced it as "alertness drink" for work and prayer. Judaism ← Yemenite rabbis called it "food for the soul." Islam ← Scholars unanimously declared it halal after 200 years of debate.</div><div class="img-c"><img src="${photo('mecca_cafe')}" alt="" loading="lazy"><div class="cap">🕌 The First Coffeehouse in Mecca 1511 — Where Cafe Culture Began</div></div><div class="quiz-box"><strong>💬 Challenge:</strong> Do you think coffee fueled Europe's Enlightenment? Historians say: coffeehouses replaced pubs — clear minds instead of drunk ones. Scientific and intellectual debate flourished. Coincidence?</div>`};

L['A2-4'] = {ar:`<h3>🧊 القهوة الباردة — Cold Brew, Iced Coffee, Nitro</h3><p>سوق القهوة الباردة ينمو بأكثر من <strong>20% سنوياً</strong>. كل طريقة تحضير باردة تنتج طعماً مختلفاً جذرياً. إليك الدليل الكامل.</p>
<div class="img-c"><img src="${photo('v60')}" alt="" loading="lazy"><div class="cap">🧊 التحضير البارد — نكهة مختلفة، طريقة مختلفة</div></div>
<h3>🧪 Cold Brew — استخلاص بدون حرارة</h3><p>ينقع البن المطحون خشونة في ماء بارد (درجة حرارة الغرفة أو أقل) لمدة 12-24 ساعة. يصفى ويقدم مع ثلج أو حليب.<br><strong>النسبة:</strong> 1:8 (ثقيل) أو 1:10 (متوسط) — ثم يخفف بالحليب أو الماء 1:1</p><table><tr><th>المعيار</th><th>Cold Brew</th><th>Iced Coffee</th><th>Nitro Cold Brew</th></tr><tr><td>طريقة التحضير</td><td>نقع بارد 12-24 ساعة</td><td>قهوة ساخنة + ثلج</td><td>Cold Brew + غاز نيتروجين</td></tr><tr><td>TDS</td><td>1.3-1.8%</td><td>0.8-1.2%</td><td>1.3-1.8%</td></tr><tr><td>الحموضة</td><td>منخفضة جداً (أقل 60%)</td><td>متوسطة — عالية</td><td>منخفضة جداً</td></tr><tr><td>مدة التحضير</td><td>12-24 ساعة</td><td>3-5 دقائق</td><td>12-24 ساعة + نيتروجين</td></tr><tr><td>القوام</td><td>حريري، ثقيل</td><td>خفيف</td><td>كريمي مثل البيرة (شكل الصب)</td></tr></table><div class="ok-box"><strong>🎯 وصفة:</strong> 100 جرام بن (خشونة French Press) + 800 مل ماء بارد. اتركه 18 ساعة في الثلاجة. صفّه بفلاتر ورقية. يخزن أسبوعاً في الثلاجة.</div>`, en:`<h3>🧊 Cold Coffee — Cold Brew, Iced Coffee, Nitro</h3><p>The cold coffee market is growing at over <strong>20% annually</strong>. Each cold method produces radically different flavors. Here's the complete guide.</p>
<div class="img-c"><img src="${photo('v60')}" alt="" loading="lazy"><div class="cap">🧊 Cold Brew — Different Method, Different Flavor</div></div>
<h3>🧪 Cold Brew — Extraction Without Heat</h3><p>Coarsely ground coffee steeped in cold water (room temp or below) for 12-24 hours. Filtered and served with ice or milk.<br><strong>Ratio:</strong> 1:8 (concentrate) or 1:10 (medium) — then diluted with milk or water 1:1</p><table><tr><th>Standard</th><th>Cold Brew</th><th>Iced Coffee</th><th>Nitro Cold Brew</th></tr><tr><td>Method</td><td>Cold steep 12-24h</td><td>Hot coffee + ice</td><td>Cold Brew + nitrogen</td></tr><tr><td>TDS</td><td>1.3-1.8%</td><td>0.8-1.2%</td><td>1.3-1.8%</td></tr><tr><td>Acidity</td><td>Very low (60% less)</td><td>Medium-high</td><td>Very low</td></tr><tr><td>Time</td><td>12-24 hours</td><td>3-5 minutes</td><td>12-24h + nitro</td></tr><tr><td>Body</td><td>Silky, heavy</td><td>Light</td><td>Creamy (like beer pour)</td></tr></table><div class="ok-box"><strong>🎯 Recipe:</strong> 100g coffee (French Press coarse) + 800ml cold water. Steep 18 hours in fridge. Filter with paper. Stays fresh 1 week in fridge.</div>`};

L['A3-3'] = {ar:`<h3>☕ ماكياتو, أفوجاتو, فلات وايت — مشروبات الباريستا المفضلة</h3><p>هذه المشروبات تمثل <strong>شخصية الباريستا المحترف</strong>. ليست مشهورة مثل اللاتيه، لكنها تختبر فهمك العميق للقهوة والحليب.</p><h3>🎯 ماكياتو (Macchiato) — "ملطّخ"</h3><p>ماكياتو تعني "ملطّخ" بالإيطالية — إسبريسو سنجل (7-9 جرام) مع <strong>نقطة رغوة حليب</strong> على السطح. لا توجد نكهة حليب — الرغوة فقط للزينة. الأصل: كان الباريستا الإيطالي يضع نقطة رغوة لتمييز الإسبريسو للنساء — "espresso macchiato" = إسبريسو ملطّخ بالحليب.</p><h3>🍦 أفوجاتو (Affogato) — حلوى القهوة</h3><p>أفوجاتو يعني "مُغرَق" — مغرفة آيس كريم فانيليا يُصب فوقها إسبريسو ساخن. الحرارة تذيب الآيس كريم قليلاً — مزيج من سخونة القهوة وبرودة الحلاوة. الوصفة: 1 مغرفة فانيليا عالية الجودة + 30 مل إسبريسو طازج. يقدم فوراً قبل أن يذوب تماماً.</p><h3>🇦🇺 فلات وايت (Flat White) — من أستراليا إلى العالم</h3><p>ابتكره الأستراليون والنيوزيلنديون في الثمانينيات. إسبريسو رسترتو (60 مل من دبل) + حليب مبخر مع رغوة <strong>رقيقة جداً (Microfoam)</strong>. النسبة: 1:2 إسبريسو:حليب. طعم القهوة أقوى من اللاتيه، ورغوة أقل من الكابتشينو.</p><div class="hl"><strong>📊 مقارنة المشروبات:</strong> من الأقل حليباً للأكثر: ماكياتو ← أفوجاتو (آيس كريم بدل حليب) ← كورتادو (إسبريسو + حليب دافئ) ← كابتشينو ← فلات وايت ← لاتيه ← موكا</div>`, en:`<h3>☕ Macchiato, Affogato & Flat White — Barista Favorites</h3><p>These drinks represent <strong>the professional barista's character</strong>. Not as famous as latte, but they test your deep understanding of coffee and milk.</p><h3>🎯 Macchiato — "Stained"</h3><p>Macchiato means "stained" in Italian — single espresso (7-9g) with a <strong>dot of milk foam</strong> on top. No milk flavor — just foam for garnish. Origin: Italian baristas would mark women's espressos with a foam dot — "espresso macchiato" = espresso stained with milk.</p><h3>🍦 Affogato — Coffee Dessert</h3><p>Affogato means "drowned" — a scoop of vanilla ice cream with hot espresso poured over. Heat melts the ice cream slightly — a mix of hot coffee and cold sweetness. Recipe: 1 scoop quality vanilla + 30ml fresh espresso. Serve immediately before fully melting.</p><h3>🇦🇺 Flat White — From Australia to the World</h3><p>Invented by Australians and New Zealanders in the 1980s. Ristretto espresso (60ml from double) + steamed milk with <strong>very thin microfoam</strong>. Ratio: 1:2 espresso:milk. Coffee taste is stronger than latte, foam less than cappuccino.</p><div class="hl"><strong>📊 Drink Comparison:</strong> Least to most milk: Macchiato ← Affogato (ice cream) ← Cortado ← Cappuccino ← Flat White ← Latte ← Mocha</div>`};

L['A3-4'] = {ar:`<h3>🎨 أساسيات اللاتيه أرت (Latte Art) — من الرغوة إلى التحفة الفنية</h3><p>اللاتيه أرت هو <strong>أكثر ما يبهر الزبائن</strong> في المقهى. لكنه ليس مجرد زينة — إنه دليل على <strong>جودة البخار وجودة الإسبريسو</strong>. لا يمكنك عمل لاتيه أرت جميل بدون إسبريسو مثالي وحليب مبخر بشكل صحيح.</p>
<h3>🥛 علم رغوة الحليب (Milk Steaming Science)</h3><p>الحليب يتكون من <strong>ماء، دهون، وبروتينات</strong>. عند البخار، يحدث التالي:<br>• <strong>بروتين Whey:</strong> يتمدد ويحتوي فقاعات الهواء — هذا يخلق الرغوة (Microfoam)<br>• <strong>دهن الحليب:</strong> يثبت الرغوة ويجعلها كريمية — الحليب كامل الدسم (Whole Milk) أسهل للعمل<br>• <strong>اللاكتوز:</strong> عند 60°م يبدأ بالتحول إلى سكر الكراميل — يزيد الحلاوة الطبيعية<br>المثالي: تسخين الحليب إلى <strong>55-65°م</strong>. فوق 70°م يتحلل البروتين → رغوة تختفي (Scalding).</p>
<h3>🫧 تقنية البخار الصحيحة (Steaming Technique)</h3><p>1. ابدأ بتبريد الـ Steam Wand (انفخ البخار لثانيتين قبل الغمر)<br>2. <strong>غمر الفوهة (Tip) أسفل سطح الحليب بقليل</strong> — افتح البخار بالكامل فوراً<br>3. <strong>مرحلة السحب (Aeration):</strong> اخفض الإبريق قليلاً حتى تسمع صوت "نشر" (Tssss) — استمر 3-5 ثوانٍ<br>4. <strong>مرحلة الدوامة (Vortex):</strong> ادفن الفوهة أعمق لتخلق دوامة — تمزج الرغوة مع الحليب<br>5. <strong>أنهِ عند 60°م:</strong> اغمس الفوهة بالكامل وأطفئ البخار — امسح الـ Wand فوراً</p>
<h3>🎨 أشهر 3 رسومات وأسرارها</h3><p><strong>♥ القلب (Heart):</strong> أسهل رسمة — اسكب الإسبريسو أولاً، ثم صب الحليب من ارتفاع 5 سم في منتصف الكوب، وعند الامتلاء ارفع الإبريق وارسم خطاً أفقياً.<br><strong>🍃 الروزيتا (Rosetta):</strong> اسكب الحليب بهزّات خفيفة (Wiggle) من اليسار لليمين أثناء التقدّم نحو الحافة، ثم ارسم خطاً أفقياً عبر التصميم.<br><strong>🐻 التوليب (Tulip):</strong> اسكب على 3 مراحل — كل مرحلة تخلق دائرة تعلو السابقة، ثم ارسم قلباً في النهاية.</p>
<div class="hl"><strong>📊 حقيقة مدهشة:</strong> مسابقة World Latte Art Championship تتطلب 6 مشروبات: إسبريسو ماكياتو، كابتشينو، لاتيه أرت حر، و 3 مشروبات تصميم حر! الفائز يحصل على $5,000+</div>
<div class="ok-box"><strong>🎯 مشروع:</strong> اشتري حليب كامل الدسم. تدرب على البخار يومياً لمدة أسبوع — كل يوم، بخّر 200 مل حليب وحاول عمل Microfoam ناعم (بدون فقاعات كبيرة). بعد إتقان الرغوة، ابدأ بتدريب القلب. خذ فيديو لرسمتك الأولى والأخيرة — قارن التطور!</div>`, en:`<h3>🎨 Latte Art Basics — From Foam to Masterpiece</h3><p>Latte Art is the <strong>most visually impressive skill</strong> in the cafe. But it's not just decoration — it's proof of <strong>espresso quality and milk steaming skill</strong>. You can't pour beautiful latte art without perfect espresso and properly steamed milk.</p>
<h3>🥛 Milk Steaming Science</h3><p>Milk consists of <strong>water, fat, and proteins</strong>. During steaming:<br>• <strong>Whey Protein:</strong> Expands and traps air bubbles — this creates microfoam<br>• <strong>Milk Fat:</strong> Stabilizes foam and makes it creamy — whole milk is easiest to work with<br>• <strong>Lactose:</strong> At 60°C starts caramelizing — increases natural sweetness<br>Ideal: heat milk to <strong>55-65°C</strong>. Above 70°C protein denatures → foam collapses (scalding).</p>
<h3>🫧 Proper Steaming Technique</h3><p>1. Purge steam wand (2 seconds before submerging)<br>2. <strong>Submerge tip just below milk surface</strong> — open steam fully immediately<br>3. <strong>Aeration phase:</strong> Lower pitcher slightly until you hear "tearing" sound (Tssss) — 3-5 seconds<br>4. <strong>Vortex phase:</strong> Bury tip deeper to create whirlpool — integrates foam evenly<br>5. <strong>Finish at 60°C:</strong> Fully submerge tip and turn off steam — wipe wand immediately</p>
<h3>🎨 3 Most Popular Designs</h3><p><strong>♥ Heart:</strong> Easiest design — pour espresso first, then pour milk from 5cm height into center of cup, when nearly full lift pitcher and draw a horizontal line.<br><strong>🍃 Rosetta:</strong> Pour milk with gentle wiggle motions left-to-right while moving toward the cup edge, then draw a horizontal line through the design.<br><strong>🐻 Tulip:</strong> Pour in 3 stages — each stage creates a circle on top of the previous one, then finish with a heart.</p>
<div class="hl"><strong>📊 Amazing Fact:</strong> The World Latte Art Championship requires 6 drinks: Espresso Macchiato, Cappuccino, Free Pour Latte Art, and 3 signature drinks! Winner receives $5,000+</div>
<div class="ok-box"><strong>🎯 Project:</strong> Buy whole milk. Practice steaming daily for a week — each day, steam 200ml milk and try to create smooth microfoam (no large bubbles). Once you master foam, start training the heart. Take video of your first and last pour — compare progress!</div>`};

L['A3-5'] = {ar:`<h3>🔧 صيانة آلة الإسبريسو — طول العمر وأفضل نكهة</h3><p>آلة الإسبريسو هي <strong>أغلى قطعة معدات</strong> في المقهى (آلة La Marzocco Linea PB تبدأ من $15,000). الصيانة المنتظمة تحمي استثمارك وتضمن <strong>اتساق النكهة كل يوم</strong>.</p>
<div class="img-c"><img src="${photo('espresso')}" alt="" loading="lazy"><div class="cap">🔧 صيانة آلة الإسبريسو — يومية، أسبوعية، شهرية</div></div>
<h3>🗓️ جدول الصيانة اليومي</h3>
<table><tr><th>التكرار</th><th>المهمة</th><th>الطريقة</th></tr><tr><td>كل صباح</td><td>تفريغ Backflush بالمنظف</td><td>استخدم Blind Basket + 3 جرام منظف (Puly Caff). اعمل backflush 3 دورات × 10 ثوانٍ. اشطف بالماء النظيف.</td></tr><tr><td>كل صباح</td><td>تنظيف فتحات البخار (Steam Tips)</td><td>انقع في ماء ساخن لمدة 10 دقائق. استخدم إبرة تنظيف لإزالة بقايا الحليب المتكتس.</td></tr><tr><td>كل 2-3 ساعات</td><td>Backflush بالماء فقط</td><td>دورة واحدة × 5 ثوانٍ لإزالة تراكم الزيوت الخفيف.</td></tr><tr><td>نهاية اليوم</td><td>تنظيف شامل</td><td>انزع جميع الـ Portafilters, Baskets, Screens. انقع في محلول منظف ساخن لمدة 30 دقيقة.</td></tr></table>
<h3>🗓️ جدول الصيانة الأسبوعي والشهري</h3><p><strong>أسبوعياً:</strong> انقع الـ Group Gaskets وـ Shower Screens في منظف. تأكد من سلامة الـ Gasket (إذا تسرب الماء، غيّره — $5-10 لكل قطعة بديلة).<br><strong>شهرياً:</strong> جدول إزالة الترسبات الكلسية (Descaling) — ضروري خصوصاً في المناطق ذات الماء العسر. استخدم محلول Dezcal أو Caffetto. عقم خزان الماء بمحلول تعقيم خفيف.<br><strong>سنوياً:</strong> استبدال حلقات الـ Gaskets (جميع الـ Groups). فحص مضخة الماء — ضغط المثالي: 9 بار (bar). استبدال فلتر الماء. فحص General Boiler (تسريبات، ترسبات).</p>
<h3>🔧 تشخيص المشاكل الشائعة</h3><p>• <strong>الإسبريسو يتقطر ببطء شديد:</strong> الـ Shower Screen مسدود → نظّفه أو استبدله. أو طاحنة تحتاج ضبط.<br>• <strong>بخار ضعيف:</strong> Steam Boiler يحتاج Descaling. أو الـ Steam Valve تالفة.<br>• <strong>تسريب ماء تحت الآلة:</strong> Drain Valve تالف أو توصيلة ماء مفكوكة → أغلق الماء فوراً واتصل بفني.<br>• <strong>طعم زيتي أو فاسد:</strong> الزيت المتراكم في الـ Groups → استخدم منظف أقوى أو زد تكرار Backflush.<br>• <strong>الإسبريسو ساخن جداً أو بارد:</strong> منظم حرارة (Thermostat/PID) يحتاز ضبطاً أو تبديلاً.</p>
<div class="err-box"><strong>❌ أخطاء شائعة:</strong> 1. استخدام منظف غسيل الصحون في Backflush — يقتل الـ Gaskets. استخدم Puly Caff أو Urnex. 2. ترك Milk Residue على الـ Steam Wand لأكثر من دقيقة — يتحول إلى كتلة صلبة تحت الحرارة. امسح وطهر فوراً!</div>
<div class="ok-box"><strong>🎯 تحدي:</strong> خذ صورة لآلة الإسبريسو في مقهى قريب — ابحث عن 3 علامات صيانة سيئة (بقع حليب قديمة على الـ Wand، لون بني على الـ Shower Screen، بقع ماء مجففة تحت الـ Group). تعلّم كيف تمنعها في آلتك.</div>`, en:`<h3>🔧 Espresso Machine Maintenance — Longevity & Peak Flavor</h3><p>The espresso machine is the <strong>most expensive piece of equipment</strong> in the cafe (a La Marzocco Linea PB starts at $15,000). Regular maintenance protects your investment and ensures <strong>consistent flavor every day</strong>.</p>
<div class="img-c"><img src="${photo('espresso')}" alt="" loading="lazy"><div class="cap">🔧 Espresso Machine Maintenance — Daily, Weekly, Monthly</div></div>
<h3>🗓️ Daily Maintenance Schedule</h3>
<table><tr><th>Frequency</th><th>Task</th><th>Method</th></tr><tr><td>Every Morning</td><td>Detergent Backflush</td><td>Use blind basket + 3g detergent (Puly Caff). Backflush 3 cycles × 10 seconds. Rinse with clean water.</td></tr><tr><td>Every Morning</td><td>Clean Steam Tips</td><td>Soak in hot water for 10 minutes. Use cleaning needle to remove baked-on milk residue.</td></tr><tr><td>Every 2-3 hours</td><td>Water Backflush</td><td>1 cycle × 5 seconds to remove light oil buildup.</td></tr><tr><td>End of Day</td><td>Full Clean</td><td>Remove all portafilters, baskets, screens. Soak in hot detergent solution for 30 minutes.</td></tr></table>
<h3>🗓️ Weekly & Monthly Maintenance</h3><p><strong>Weekly:</strong> Soak group gaskets and shower screens in detergent. Check gasket integrity (if leaking, replace — $5-10 per replacement part).<br><strong>Monthly:</strong> Descaling schedule — essential especially in hard water areas. Use Dezcal or Caffetto solution. Sanitize water tank with mild sanitizer.<br><strong>Yearly:</strong> Replace all group gaskets. Check water pump — ideal pressure: 9 bar. Replace water filter. Inspect general boiler (leaks, scale).</p>
<h3>🔧 Common Problem Diagnosis</h3><p>• <strong>Espresso dripping too slowly:</strong> Shower screen clogged → clean or replace. Or grinder needs adjustment.<br>• <strong>Weak steam:</strong> Steam boiler needs descaling. Or steam valve is damaged.<br>• <strong>Water leaking under machine:</strong> Drain valve damaged or loose water connection → shut off water immediately and call technician.<br>• <strong>Oily or rancid taste:</strong> Oil buildup in groups → use stronger detergent or increase backflush frequency.<br>• <strong>Espresso too hot or too cold:</strong> Thermostat/PID needs adjustment or replacement.</p>
<div class="err-box"><strong>❌ Common Mistakes:</strong> 1. Using dish soap for backflush — kills gaskets. Use Puly Caff or Urnex. 2. Leaving milk residue on steam wand for over a minute — hardens into solid under heat. Wipe and purge immediately!</div>
<div class="ok-box"><strong>🎯 Challenge:</strong> Take a photo of an espresso machine at a nearby cafe — find 3 signs of poor maintenance (old milk spots on wand, brown color on shower screen, dried water marks under group). Learn how to prevent them on your machine.</div>`};

L['B1-3'] = {ar:`<h3>🔥 تحميص حسب المنشأ — لكل بن شخصيته</h3><p>كل منطقة منتجة للبن تحتاج <strong>منحنى تحميص مختلفاً</strong>. تحميص بن إثيوبي مثل تحميص بن برازيلي يؤدي إلى كارثة في الطعم. هذا هو الفرق بين المحمص العادي والمحمص المحترف.</p><table><tr><th>المنشأ</th><th>الكثافة</th><th>تحميص مثالي</th><th>النكهة المستهدفة</th></tr><tr><td>إثيوبيا / كينيا</td><td>عالية جداً</td><td>فاتح — Light (Agtron #75-85)</td><td>حموضة متألقة، زهري، فاكهي</td></tr><tr><td>كولومبيا / أمريكا الوسطى</td><td>عالية</td><td>فاتح-متوسط (Agtron #65-75)</td><td>توازن، حلاوة، حموضة معتدلة</td></tr><tr><td>البرازيل / أمريكا الجنوبية</td><td>متوسطة</td><td>متوسط (Agtron #55-65)</td><td>شوكولاتة، جوزي، قوام كامل</td></tr><tr><td>إندونيسيا / آسيا</td><td>منخفضة</td><td>متوسط-داكن (Agtron #45-55)</td><td>ترابي، بهارات، قوام ثقيل</td></tr></table><div class="info-box"><strong>💡 القاعدة الذهبية:</strong> البن عالي الكثافة (إثيوبي) يحتاج طاقة حرارة أعلى في بداية التحميص. البن منخفض الكثافة (إندونيسي) يحتاج طاقة أقل — وإلا سيحترق السطح قبل نضج الداخل. ادرس بنك قبل أن تحمصه!</div>`, en:`<h3>🔥 Origin-Specific Roasting — Every Bean Has Its Character</h3><p>Each coffee origin needs a <strong>different roast curve</strong>. Roasting Ethiopian like Brazilian leads to flavor disaster. This is the difference between average and professional roasters.</p><table><tr><th>Origin</th><th>Density</th><th>Ideal Roast</th><th>Target Flavor</th></tr><tr><td>Ethiopia / Kenya</td><td>Very high</td><td>Light (Agtron #75-85)</td><td>Bright acidity, floral, fruity</td></tr><tr><td>Colombia / Central America</td><td>High</td><td>Light-Med (Agtron #65-75)</td><td>Balance, sweetness, moderate acidity</td></tr><tr><td>Brazil / South America</td><td>Medium</td><td>Medium (Agtron #55-65)</td><td>Chocolate, nutty, full body</td></tr><tr><td>Indonesia / Asia</td><td>Low</td><td>Med-Dark (Agtron #45-55)</td><td>Earthy, spice, heavy body</td></tr></table><div class="info-box"><strong>💡 Golden Rule:</strong> High-density beans (Ethiopia) need higher heat energy at roast start. Low-density beans (Indonesia) need less energy — otherwise the surface burns before the inside develops. Study your bean before roasting!</div>`};

L['B1-4'] = {ar:`<h3>🔥 دليل معدات التحميص — من المقلاة إلى المحمصة الاحترافية</h3><p>اختيار محمصة القهوة هو <strong>أكبر قرار استثماري</strong> في مشوار المحمص. تتراوح المعدات من مقلاة منزلية بـ $20 إلى محامص صناعية بـ $100,000+. إليك دليل شامل لكل نوع.</p>
<div class="img-c"><img src="${photo('roast')}" alt="" loading="lazy"><div class="cap">🏭 معدات التحميص — من المحمصة اليدوية إلى التجارية</div></div>
<h3>🏠 محامص الدفعة المنزلية والصغيرة (0.1-5 كجم)</h3>
<table><tr><th>النوع</th><th>المدى السعري</th><th>السعة</th><th>المميزات</th><th>العيوب</th></tr><tr><td>مقلاة (Pan)</td><td>$15-40</td><td>50-100 جرام</td><td>أرخص حل — تتعلم التحكم اليدوي</td><td>تحميص غير متساوٍ — تحتاج تحريك دائم — لا تحكم في الحرارة</td></tr><tr><td>فرن منزلي (Oven)</td><td>$0 (موجود)</td><td>200-500 جرام</td><td>تجريب كمية أكبر — مناسب للبداية</td><td>تسخين غير متساوٍ — صعوبة في التبريد السريع</td></tr><tr><td>Whirley Pop / مقلاة يدوية</td><td>$30-80</td><td>100-200 جرام</td><td>توزيع حرارة أفضل — تحكم في سرعة التحريك</td><td>سعة صغيرة — تحتاج جهد بدني</td></tr><tr><td>FreshRoast SR540/SR800</td><td>$200-350</td><td>120-225 جرام</td><td>تحميص بالهواء الساخن — نظيف — نتائج متسقة</td><td>سعة محدودة — صوت عالٍ — منحنى محدود</td></tr><tr><td>Behmor 2000AB Plus</td><td>$400-500</td><td>225-450 جرام</td><td>آمن — دخان قليل — برامج تحميص أوتوماتيكية ويدوية</td><td>حرارة ضعيفة للتحميص الداكن — صيانة معقدة</td></tr></table>
<h3>🏪 محامص شبه احترافية واحترافية (1-30 كجم)</h3><p><strong>Diedrich IR-5</strong> — المحمصة المفضلة للمختبرات ومحامص Specialty. تحكم استثنائي بفضل عناصر الأشعة تحت الحمراء. $12,000-18,000.<br><strong>Probat P5/Probat UG22</strong> — الصناعة الألمانية — المعيار الذهبي. موثوقة، قطع غيار متوفرة، نتائج متسقة لسنوات. P5 (~5 كجم): $20,000-30,000 | UG22 (~22 كجم): $40,000-60,000.<br><strong>Loring S30</strong> — محمصة صديقة للبيئة — تعيد تدوير الحرارة وتوفر 50% من الطاقة. $30,000-50,000.<br><strong>Aillio Bullet R1 V2</strong> — الـ "Tesla" للمحامص — محمصة دوارة (Drum) بتحكم إلكتروني دقيق، 1 كجم. $3,500-4,500. مثالية للمحمص المنزلي المحترف.</p>
<h3>🔧 الميزات الأساسية التي تفرق المحمصة الممتازة</h3><p>• <strong>تحكم في تدفق الهواء (Airflow):</strong> يتحكم في سرعة انتقال الحرارة وإزالة القشرة — ضروري للتحميص المتسق<br>• <strong>أخذ العينات (Triple Sampling):</strong> باب أخذ عينة أثناء التحميص — لتقييم اللون والتطور<br>• <strong>برمجيات تتبع المنحنى (Roast Logger):</strong> Artisan, Cropster, Roastmaster — سجل كل منحنى وقارن النتائج<br>• <strong>نظام تبريد (Cooling Tray):</strong> يبرد الدفعة من 200°م إلى 40°م في أقل من 4 دقائق — يوقف التحميص فوراً<br>• <strong>Burner Type:</strong> Gas (التحكم الأفضل) vs Infrared (أنظف — متسق أكثر) vs Electric (ثابت — مثالي للمختبرات)</p>
<div class="ok-box"><strong>🎯 مشروع:</strong> ابحث عن محمصة محلية واسأل عن نوع محمصتهم — السعة، العمر، التحديثات. اسألهم عن ميزتهم المفضلة وأكبر مشكلة واجهوها. هذا سيساعدك في قرار الشراء عندما تبدأ!</div>`, en:`<h3>🔥 Roasting Equipment Guide — From Frying Pan to Professional Roaster</h3><p>Choosing a coffee roaster is the <strong>biggest investment decision</strong> in a roaster's journey. Equipment ranges from a $20 home pan to $100,000+ industrial roasters. Here's a comprehensive guide to each type.</p>
<div class="img-c"><img src="${photo('roast')}" alt="" loading="lazy"><div class="cap">🏭 Roasting Equipment — From Hand to Commercial</div></div>
<h3>🏠 Home & Small Batch Roasters (0.1-5kg)</h3>
<table><tr><th>Type</th><th>Price Range</th><th>Capacity</th><th>Pros</th><th>Cons</th></tr><tr><td>Pan</td><td>$15-40</td><td>50-100g</td><td>Cheapest — learn manual control</td><td>Uneven roast — constant stirring — no heat control</td></tr><tr><td>Oven</td><td>$0 (already have)</td><td>200-500g</td><td>Larger batches — good to start</td><td>Uneven heating — difficult fast cooling</td></tr><tr><td>Whirley Pop / Stovetop</td><td>$30-80</td><td>100-200g</td><td>Better heat distribution — stirring speed control</td><td>Small capacity — physical effort needed</td></tr><tr><td>FreshRoast SR540/SR800</td><td>$200-350</td><td>120-225g</td><td>Hot air roasting — clean — consistent results</td><td>Limited capacity — loud — limited curve control</td></tr><tr><td>Behmor 2000AB Plus</td><td>$400-500</td><td>225-450g</td><td>Safe — low smoke — auto/manual programs</td><td>Weak for dark roasts — complex maintenance</td></tr></table>
<h3>🏪 Semi-Pro & Pro Roasters (1-30kg)</h3><p><strong>Diedrich IR-5</strong> — The favorite for labs and specialty roasters. Exceptional control via infrared elements. $12,000-18,000.<br><strong>Probat P5/Probat UG22</strong> — German engineering — the gold standard. Reliable, available parts, consistent results for years. P5 (~5kg): $20,000-30,000 | UG22 (~22kg): $40,000-60,000.<br><strong>Loring S30</strong> — Eco-friendly — recirculates heat, saving 50% energy. $30,000-50,000.<br><strong>Aillio Bullet R1 V2</strong> — The "Tesla" of roasters — rotating drum with precise electronic control, 1kg. $3,500-4,500. Perfect for pro home roasters.</p>
<h3>🔧 Key Features That Separate Good From Great</h3><p>• <strong>Airflow Control:</strong> Controls heat transfer speed and chaff removal — essential for consistent roasting<br>• <strong>Triple Sampling Port:</strong> Sample door during roasting — evaluate color and development<br>• <strong>Roast Logger Software:</strong> Artisan, Cropster, Roastmaster — log every curve and compare results<br>• <strong>Cooling Tray:</strong> Cools batch from 200°C to 40°C in under 4 minutes — instantly stops roasting<br>• <strong>Burner Type:</strong> Gas (best control) vs Infrared (cleaner — more consistent) vs Electric (stable — ideal for labs)</p>
<div class="ok-box"><strong>🎯 Project:</strong> Find a local roastery and ask about their roaster — capacity, age, upgrades. Ask about their favorite feature and biggest challenge. This will help your purchase decision when you start!</div>`};

L['B1-5'] = {ar:`<h3>🏭 المحامص الحرفية مقابل التجارية — مقارنة شاملة لاستراتيجية التحميص</h3><p>عندما تقرر بدء مشروع تحميص، أمامك <strong>خياران أساسيان</strong>: محمصة حرفية (Artisan) أو تجارية (Commercial). الفرق لا يقتصر على السعة — إنه <strong>فلسفة عمل كاملة</strong>.</p>
<h3>📊 مقارنة الموديلين</h3>
<table><tr><th>المعيار</th><th>الحرفية (Artisan)</th><th>التجارية (Commercial)</th></tr><tr><td>السعة</td><td>0.5-15 كجم</td><td>15-120+ كجم</td></tr><tr><td>عدد الدفعات اليومي</td><td>3-15 دفعة</td><td>20-80+ دفعة</td></tr><tr><td>الإنتاج الأسبوعي</td><td>20-200 كجم</td><td>500-10,000+ كجم</td></tr><tr><td>الزبائن المستهدفون</td><td>مقاهي Specialty — أفراد</td><td>محلات سوبرماركت — فنادق — شركات</td></tr><tr><td>التنوع (Origins)</td><td>8-20 نوع</td><td>2-6 أنواع أساسية</td></tr><tr><td>سعر الكيلو للزبون</td><td>$30-60/كجم</td><td>$15-25/كجم</td></tr><tr><td>هامش الربح</td><td>40-60%</td><td>20-35%</td></tr><tr><td>المرونة في التحميص</td><td>عالية جداً — كل دفعة فريدة</td><td>منخفضة — يجب الاتساق الكامل</td></tr></table>
<h3>🧠 هل تبدأ Artisan أم Commercial؟</h3><p>ابدأ <strong>Artisan</strong> إذا:<br>• تريد التركيز على الجودة قبل الكمية<br>• لديك علاقات مع مقاهي صغيرة تبحث عن قهوة فريدة<br>• أنت مستعد لتعليم زبائنك عن الأصول والمعالجات والنكهات<br>• تريد هامش ربح أعلى — حتى لو كان الإنتاج أقل</p><p>انتقل إلى <strong>Commercial</strong> إذا:<br>• لديك طلب ثابت من 5+ مقاهي أو متجر واحد كبير<br>• تحتاج سعة 30+ كجم/دفعة لتلبية الطلب<br>• أنت مستعد لتوحيد منحنيات التحميص (Standardization)<br>• تريد دخول قنوات توزيع أوسع (سوبرماركت، فنادق)</p>
<h3>📈 استراتيجية التوسع (Scaling Strategy)</h3><p>النموذج الأنجح في سوق Specialty الحالي:<br>1. <strong>ابدأ صغيراً:</strong> محمصة 1-3 كجم (Aillio Bullet, Diedrich IR-1) — اختبر السوق وحسّن منتجك<br>2. <strong>ابنِ جمهوراً:</strong> افتح كوفي كورنر أو مقهى صغير — بع قهوتك مباشرة للزبائن<br>3. <strong>وسّع عند الطلب:</strong> عندما تصل لـ 80% قدرة المحمصة لمدة 3 أشهر → حان وقت التوسع<br>4. <strong>اختر محمصة أكبر:</strong> انتقل إلى 15-30 كجم (Probat, Loring) — حافظ على جودة الـ Small Batch للزبائن المخلصين</p>
<div class="info-box"><strong>💡 نصيحة من مجرب:</strong> <strong>لا تشترِ محمصة أكبر من احتياجك</strong>. محمصة 15 كجم تعمل بحمل 2 كجم — هذا غير فعال (تهدر طاقة، يصعب التحكم بالحرارة). اختر محمصة سعتها القصوى = 120% من طلبك اليومي المتوقع.</div>
<div class="ok-box"><strong>🎯 مشروع:</strong> اكتب خطة عمل (Business Plan) لمحمصة افتراضية. حدد: السعة الأولية، التمويل، عدد الزبائن المستهدفين، سعر البيع للكيلو، التكاليف التشغيلية. احسب متى تحقق نقطة التعادل (Break-Even).</div>`, en:`<h3>🏭 Artisan vs Commercial Roasting — A Comprehensive Strategy Comparison</h3><p>When deciding to start a roasting business, you face <strong>two fundamental choices</strong>: Artisan or Commercial roastery. The difference isn't just capacity — it's a <strong>complete business philosophy</strong>.</p>
<h3>📊 Model Comparison</h3>
<table><tr><th>Parameter</th><th>Artisan</th><th>Commercial</th></tr><tr><td>Capacity</td><td>0.5-15 kg</td><td>15-120+ kg</td></tr><tr><td>Daily Batches</td><td>3-15</td><td>20-80+</td></tr><tr><td>Weekly Output</td><td>20-200 kg</td><td>500-10,000+ kg</td></tr><tr><td>Target Customers</td><td>Specialty cafes — individuals</td><td>Supermarkets — hotels — companies</td></tr><tr><td>Variety (Origins)</td><td>8-20 types</td><td>2-6 core types</td></tr><tr><td>Price per kg</td><td>$30-60/kg</td><td>$15-25/kg</td></tr><tr><td>Profit Margin</td><td>40-60%</td><td>20-35%</td></tr><tr><td>Roast Flexibility</td><td>Very high — each batch unique</td><td>Low — must be fully consistent</td></tr></table>
<h3>🧠 Artisan or Commercial?</h3><p>Start <strong>Artisan</strong> if:<br>• You want to focus on quality before quantity<br>• You have relationships with small cafes seeking unique coffee<br>• You're ready to educate customers about origins, processing, and flavors<br>• You want higher margins — even with lower output</p><p>Move to <strong>Commercial</strong> if:<br>• You have steady demand from 5+ cafes or one large store<br>• You need 30+ kg/batch capacity<br>• You're ready to standardize roast curves<br>• You want to enter broader distribution channels (supermarkets, hotels)</p>
<h3>📈 Scaling Strategy</h3><p>The most successful model in today's Specialty market:<br>1. <strong>Start small:</strong> 1-3kg roaster (Aillio Bullet, Diedrich IR-1) — test the market and refine your product<br>2. <strong>Build an audience:</strong> Open a coffee corner or small cafe — sell directly to customers<br>3. <strong>Scale on demand:</strong> When you hit 80% capacity for 3 months → time to expand<br>4. <strong>Choose a larger roaster:</strong> Move to 15-30kg (Probat, Loring) — keep Small Batch quality for loyal customers</p>
<div class="info-box"><strong>💡 Pro Tip:</strong> <strong>Don't buy a roaster larger than your need</strong>. A 15kg roaster running at 2kg load — inefficient (wastes energy, hard to control temperature). Choose a roaster whose max capacity = 120% of your expected daily demand.</div>
<div class="ok-box"><strong>🎯 Project:</strong> Write a Business Plan for a hypothetical roastery. Decide: initial capacity, funding, target customers, selling price per kg, operational costs. Calculate when you reach Break-Even point.</div>`};

L['B2-3'] = {ar:`<h3>🧪 وصفات الماء المثالية للقهوة — اصنع ماءك بنفسك</h3><p>أفضل محامص العالم تستخدم <strong>ماء مصنوعاً في المختبر</strong> لضمان الاتساق الكامل. إليك كيفية صنع ماء القهوة المثالي في بيتك.</p><h3>🧪 وصفة SCA الأساسية — Third Wave Water</h3><p>ابدأ بماء مقطر (Distilled Water) — صفحة بيضاء. أضف:<br>• <strong>بيكربونات الصوديوم (NaHCO₃):</strong> 150 ملغ لكل 1 لتر — يوفر القلوية (Buffering capacity)<br>• <strong>كبريتات المغنيسيوم (MgSO₄):</strong> 150 ملغ لكل 1 لتر — يضيف المغنيسيوم للنكهات الحلوة<br>• <strong>كلوريد الكالسيوم (CaCl₂):</strong> 100 ملغ لكل 1 لتر — يضيف الكالسيوم للقوام</p><h3>📊 مستويات المياء حسب القهوة</h3><table><tr><th>نوع القهوة</th><th>TDS مثالي</th><th>Ca (مجم/لتر)</th><th>Mg (مجم/لتر)</th><th>HCO₃ (مجم/لتر)</th></tr><tr><td>إسبريسو</td><td>100-120</td><td>40-60</td><td>20-30</td><td>40-60</td></tr><tr><td>قهوة مقطرة</td><td>120-175</td><td>50-80</td><td>10-20</td><td>40-80</td></tr><tr><td>بن فاتح (زهري)</td><td>80-120</td><td>30-50</td><td>15-25</td><td>30-50</td></tr><tr><td>بن داكن (شوكولاتي)</td><td>150-200</td><td>60-100</td><td>5-15</td><td>60-100</td></tr></table><div class="err-box"><strong>❌ خطأ شائع:</strong> استخدام الماء المعدني (Spring Water) مباشرة. ماء الينابيع متغير موسمياً — يحتوي على بيكربونات أكثر من اللازم (تقتل الحموضة). استخدم ماء مقطر وأضف المعادن بنفسك!</div>`, en:`<h3>🧪 DIY Water Recipes — Make Your Own Perfect Coffee Water</h3><p>The world's best roasters use <strong>lab-made water</strong> for complete consistency. Here's how to make perfect coffee water at home.</p><h3>🧪 SCA Base Recipe — Third Wave Water</h3><p>Start with distilled water — a blank slate. Add:<br>• <strong>Sodium Bicarbonate (NaHCO₃):</strong> 150mg per 1L — provides alkalinity (buffering capacity)<br>• <strong>Magnesium Sulfate (MgSO₄):</strong> 150mg per 1L — adds magnesium for sweet flavors<br>• <strong>Calcium Chloride (CaCl₂):</strong> 100mg per 1L — adds calcium for body</p><h3>📊 Water Levels by Coffee Type</h3><table><tr><th>Coffee Type</th><th>Ideal TDS</th><th>Ca (mg/L)</th><th>Mg (mg/L)</th><th>HCO₃ (mg/L)</th></tr><tr><td>Espresso</td><td>100-120</td><td>40-60</td><td>20-30</td><td>40-60</td></tr><tr><td>Drip coffee</td><td>120-175</td><td>50-80</td><td>10-20</td><td>40-80</td></tr><tr><td>Light roast (floral)</td><td>80-120</td><td>30-50</td><td>15-25</td><td>30-50</td></tr><tr><td>Dark roast (chocolate)</td><td>150-200</td><td>60-100</td><td>5-15</td><td>60-100</td></tr></table><div class="err-box"><strong>❌ Common Mistake:</strong> Using spring water directly. Spring water varies seasonally — often too much bicarbonate (kills acidity). Use distilled water and add minerals yourself!</div>`};

L['B2-4'] = {ar:`<h3>💧 عسر الماء وتأثيره على القهوة — كيمياء الاستخلاص المائي</h3><p>القهوة عبارة عن <strong>98% ماء</strong>. جودة الماء هي <strong>أهم عامل منفرد</strong> يؤثر على طعم القهوة — أكثر من درجة التحميص أو منشأ البن. الماء السيئ يخرب أفضل قهوة في العالم.</p>
<div class="img-c"><img src="${photo('water')}" alt="" loading="lazy"><div class="cap">📊 عسر الماء — تأثيره على الاستخلاص والنكهة</div></div>
<h3>🧪 ما هو "عسر الماء" (Water Hardness)؟</h3><p>العسر هو <strong>كمية المعادن الذائبة</strong> في الماء، خصوصاً الكالسيوم (Ca²⁺) والمغنيسيوم (Mg²⁺).<br>• <strong>العسر الكلي (GH):</strong> مجموع الكالسيوم والمغنيسيوم — يؤثر على الاستخلاص<br>• <strong>العسر القلوي (KH / Alkalinity):</strong> قدرة الماء على مقاومة تغير الـ pH — يحمي القهوة من الحموضة الزائدة<br>• <strong>TDS (إجمالي المواد الصلبة الذائبة):</strong> 0-500+ جزء في المليون (ppm) — القهوة المثالية: 75-175 ppm</p>
<table><tr><th>TDS (ppm)</th><th>التصنيف</th><th>التأثير على القهوة</th></tr><tr><td>0-50</td><td>منخفض جداً (مقطر/مقطر)</td><td>استخلاص زائد — طعم أجوف، حامض، غير متوازن</td></tr><tr><td>75-175</td><td>مثالي للقهوة</td><td>استخلاص متوازن — حلاوة واضحة، حموضة مشرقة</td></tr><tr><td>175-300</td><td>عسر متوسط</td><td>استخلاص محدود — نكهات باهتة، ترسبات كلسية</td></tr><tr><td>300+</td><td>عسر عالٍ</td><td>استخلاص ضعيف جداً — طعم معدن، ترسبات سريعة في المعدات</td></tr></table>
<h3>🏠 حلول معالجة الماء في المنزل والمقهى</h3><p>• <strong>فلتر كربوني (Carbon Filter):</strong> يزيل الكلور والطعم السيئ — لا يغير TDS. أساسي لأي مقهى.<br>• <strong>منقّي بالتناضح العكسي (RO):</strong> يزيل 95-99% من المعادن — TDS قريب من الصفر. بعدها نضيف أملاح (Third Wave Water) لضبط TDS.<br>• <strong>خلطة ماء SCA القياسية:</strong> أضف 0.1 جرام بيكربونات الصوديوم (NaHCO₃) و 0.15 جرام كبريتات المغنيسيوم (MgSO₄·7H₂O) لكل لتر ماء مقطر<br>• <strong>فلتر "Pourover" من بريتا أو مايفر:</strong> يحسن الطعم لكن لا يضبط TDS بدقة — حل منزلي جيد</p>
<div class="hl"><strong>📊 تأثير المغنيسيوم:</strong> المغنيسيوم يرتبط بأحماض الكلوروجينيك (Chlorogenic Acids) ويسحبها من القهوة أسرع بثلاث مرات من الكالسيوم. الماء الغني بالمغنيسيوم ينتج قهوة أكثر حلاوة وحموضة!</div>
<div class="ok-box"><strong>🎯 مشروع:</strong> اشتر جهاز TDS Meter (أقل من $20). قس TDS ماء الصنبور، ماء الفلتر، وماء معدني. جرب تحضير نفس القهوة بكل نوع. لاحظ الفرق في الطعم. اضبط بنسبة ماء مقطر + ماء صنبور لتحصل على TDS 150.</div>`, en:`<h3>💧 Water Hardness and Its Impact on Coffee — Water Chemistry of Extraction</h3><p>Coffee is <strong>98% water</strong>. Water quality is the <strong>single most important factor</strong> affecting coffee taste — more than roast level or origin. Bad water ruins the world's best coffee.</p>
<div class="img-c"><img src="${photo('water')}" alt="" loading="lazy"><div class="cap">📊 Water Hardness — Its Effect on Extraction & Flavor</div></div>
<h3>🧪 What is Water Hardness?</h3><p>Hardness is the <strong>amount of dissolved minerals</strong> in water, especially calcium (Ca²⁺) and magnesium (Mg²⁺).<br>• <strong>General Hardness (GH):</strong> Total calcium + magnesium — affects extraction<br>• <strong>Carbonate Hardness (KH / Alkalinity):</strong> Water's ability to resist pH change — protects coffee from excess acidity<br>• <strong>TDS (Total Dissolved Solids):</strong> 0-500+ ppm — ideal coffee: 75-175 ppm</p>
<table><tr><th>TDS (ppm)</th><th>Classification</th><th>Coffee Impact</th></tr><tr><td>0-50</td><td>Very low (distilled/RO)</td><td>Over-extraction — hollow, sour, unbalanced</td></tr><tr><td>75-175</td><td>Ideal for coffee</td><td>Balanced extraction — clear sweetness, bright acidity</td></tr><tr><td>175-300</td><td>Medium hardness</td><td>Limited extraction — muted flavors, scale build-up</td></tr><tr><td>300+</td><td>Hard water</td><td>Very weak extraction — metallic taste, rapid scale</td></tr></table>
<h3>🏠 Water Treatment Solutions</h3><p>• <strong>Carbon Filter:</strong> Removes chlorine and bad taste — doesn't change TDS. Essential for any cafe.<br>• <strong>Reverse Osmosis (RO):</strong> Removes 95-99% of minerals — TDS near zero. Then add minerals (Third Wave Water) to adjust TDS.<br>• <strong>SCA Standard Water Recipe:</strong> Add 0.1g sodium bicarbonate (NaHCO₃) and 0.15g magnesium sulfate (MgSO₄·7H₂O) per liter of distilled water<br>• <strong>Brita / Mavea Pitcher:</strong> Improves taste but doesn't control TDS precisely — good home solution</p>
<div class="hl"><strong>📊 Magnesium Effect:</strong> Magnesium binds with Chlorogenic Acids and extracts them 3x faster than calcium. Magnesium-rich water produces sweeter, more acidic coffee!</div>
<div class="ok-box"><strong>🎯 Project:</strong> Buy a TDS Meter (under $20). Measure TDS of tap water, filtered water, and bottled water. Brew the same coffee with each. Notice the taste difference. Blend distilled + tap to achieve TDS 150.</div>`};

L['B2-5'] = {ar:`<h3>💧 وصفات الماء المثالية لكل طريقة تحضير</h3><p>لكل طريقة تحضير، <strong>ملف مائي مثالي</strong> يبرز أفضل ما فيها. الإسبريسو يحتاج ماءً مختلفاً عن القهوة المقطرة. القهوة الباردة (Cold Brew) تحتاج شيئاً آخر تماماً.</p>
<h3>📊 ملفات الماء المثالية حسب طريقة التحضير</h3>
<table><tr><th>طريقة التحضير</th><th>TDS (ppm)</th><th>KH (ppm)</th><th>GH (ppm)</th><th>pH مثالي</th><th>ملاحظات</th></tr><tr><td>الإسبريسو</td><td>100-150</td><td>40-60</td><td>50-80</td><td>7.0-7.2</td><td>ماء ناعم قليلاً — يحمي الآلة ويبرز الحلاوة</td></tr><tr><td>القهوة المقطرة (V60/Chemex)</td><td>75-125</td><td>30-50</td><td>40-70</td><td>6.8-7.0</td><td>TDS أقل يبرز الحموضة — مثالي للقهوة الخفيفة</td></tr><tr><td>Aeropress</td><td>100-175</td><td>40-60</td><td>50-80</td><td>7.0-7.2</td><td>مشابه للإسبريسو — وقت استخلاص قصير يحتاج TDS أعلى</td></tr><tr><td>French Press</td><td>125-175</td><td>50-70</td><td>60-90</td><td>7.0-7.2</td><td>ماء أعلى TDS — يوازن القوام الثقيل والزيوت</td></tr><tr><td>Cold Brew</td><td>150-200</td><td>50-80</td><td>70-100</td><td>7.0-7.5</td><td>أعلى TDS — التعقيد المنخفض يحتاج ماء معدني</td></tr><tr><td>Batch Brew</td><td>100-150</td><td>40-60</td><td>50-80</td><td>7.0</td><td>متوسط — مناسب لأصناف متعددة</td></tr></table>
<h3>🧪 كيفية صنع الماء المثالي في المنزل</h3><p>الطريقة الأسهل والأدق: <strong>Third Wave Water</strong> — أكياس جاهزة تضاف إلى الماء المقطر. لكل كيس وصفته الخاصة: "Light Roast", "Dark Roast", "Espresso". الطريقة الأرخص (DIY):<br>• <strong>للمقطرة (V60):</strong> 0.08 جرام NaHCO₃ + 0.12 جرام MgSO₄·7H₂O لكل 1 لتر ماء مقطر<br>• <strong>للإسبريسو:</strong> 0.12 جرام NaHCO₃ + 0.18 جرام MgSO₄·7H₂O لكل 1 لتر ماء مقطر<br>• <strong>لـ Cold Brew:</strong> 0.15 جرام NaHCO₃ + 0.25 جرام MgSO₄·7H₂O لكل 1 لتر ماء مقطر</p>
<div class="info-box"><strong>💡 تذكير مهم:</strong> <strong>لا تستخدم أبداً الماء المقطر أو الـ RO بمفرده</strong> — بدون معادن، الماء يسحب كمية هائلة من المركبات القابلة للذوبان → طعم لاذع، أجوف. الماء الخالي من المعادن هو أسوأ ماء للقهوة!</div>
<div class="ok-box"><strong>🎯 تحدٍ:</strong> اختر قهوتك المفضلة. حضّرها بطريقتين: بماء صنبور عادي وبماء معدل (اشتر Third Wave Water أو حضّر بنفسك). اعمل Blind Test — هل تستطيع تذوق الفرق؟ خمن أي فنجان أي ماء!</div>`, en:`<h3>💧 Ideal Water Recipes for Every Brew Method</h3><p>Each brew method has an <strong>ideal water profile</strong> that brings out its best qualities. Espresso needs different water than drip coffee. Cold Brew needs something entirely different.</p>
<h3>📊 Ideal Water Profiles by Brew Method</h3>
<table><tr><th>Brew Method</th><th>TDS (ppm)</th><th>KH (ppm)</th><th>GH (ppm)</th><th>Ideal pH</th><th>Notes</th></tr><tr><td>Espresso</td><td>100-150</td><td>40-60</td><td>50-80</td><td>7.0-7.2</td><td>Slightly soft — protects machine, highlights sweetness</td></tr><tr><td>Pour Over (V60/Chemex)</td><td>75-125</td><td>30-50</td><td>40-70</td><td>6.8-7.0</td><td>Lower TDS highlights acidity — ideal for light roasts</td></tr><tr><td>Aeropress</td><td>100-175</td><td>40-60</td><td>50-80</td><td>7.0-7.2</td><td>Similar to espresso — short brew time needs higher TDS</td></tr><tr><td>French Press</td><td>125-175</td><td>50-70</td><td>60-90</td><td>7.0-7.2</td><td>Higher TDS — balances heavy body and oils</td></tr><tr><td>Cold Brew</td><td>150-200</td><td>50-80</td><td>70-100</td><td>7.0-7.5</td><td>Highest TDS — low complexity needs mineral water</td></tr><tr><td>Batch Brew</td><td>100-150</td><td>40-60</td><td>50-80</td><td>7.0</td><td>Medium — suitable for multiple origins</td></tr></table>
<h3>🧪 How to Make Ideal Water at Home</h3><p>Easiest and most accurate: <strong>Third Wave Water</strong> — ready-to-use packets added to distilled water. Each packet has its own recipe: "Light Roast", "Dark Roast", "Espresso". Cheaper method (DIY):<br>• <strong>For Drip (V60):</strong> 0.08g NaHCO₃ + 0.12g MgSO₄·7H₂O per 1L distilled water<br>• <strong>For Espresso:</strong> 0.12g NaHCO₃ + 0.18g MgSO₄·7H₂O per 1L distilled water<br>• <strong>For Cold Brew:</strong> 0.15g NaHCO₃ + 0.25g MgSO₄·7H₂O per 1L distilled water</p>
<div class="info-box"><strong>💡 Important Reminder:</strong> <strong>Never use distilled or RO water alone</strong> — without minerals, water pulls massive amounts of soluble compounds → sour, hollow taste. Mineral-free water is the worst coffee water!</div>
<div class="ok-box"><strong>🎯 Challenge:</strong> Choose your favorite coffee. Brew it two ways: with regular tap water and with adjusted water (buy Third Wave Water or make your own). Do a blind test — can you taste the difference? Guess which cup is which!</div>`};

L['B3-3'] = {ar:`<h3>🏭 تحضير الكميات الكبيرة — Batch Brew للتموين</h3><p>في المقهى المزدحم، الـ Batch Brew هو <strong>العمود الفقري</strong> للقهوة المقطرة. المقاهي المتوسطة تخدم 50-100 كوب Batch Brew يومياً. إليك كيف تصنعها متسقة.</p>
<div class="img-c"><img src="${photo('water')}" alt="" loading="lazy"><div class="cap">🏭 تحضير الكميات — الاتساق في الإنتاج الكبير</div></div>
<h3>⚙️ بارامترات Batch Brew</h3><table><tr><th>العامل</th><th>النطاق المثالي</th></tr><tr><td>حجم الدفعة</td><td>1.5 - 3 لتر</td></tr><tr><td>نسبة القهوة:الماء</td><td>1:16 - 1:18</td></tr><tr><td>درجة الطحن</td><td>متوسط-خشن (حبيبات كاملة)</td></tr><tr><td>حرارة الماء</td><td>93-96°م</td></tr><tr><td>وقت الاستخلاص</td><td>4-6 دقائق</td></tr><tr><td>وقت الحفظ (Hold Time)</td><td>أقل من 30 دقيقة (Carafe محكمة)</td></tr></table><h3>🧪 معادلة حساب الدفعة — مثال عملي</h3><p>تحتاج 2 لتر قهوة (2000 مل):<br>• 2000 ÷ 16 = <strong>125 جرام بن</strong> (لنسبة 1:16)<br>• طحن: 60% متوسط (مقياس 20 على EK43) + 40% خشن (مقياس 22)<br>• اشطف الفلتر ورقياً قبل الاستخدام<br>• ابدأ الصب بـ 60% من الماء دفعة واحدة (Blooming + دفعة)<br>• أضف الـ 40% الباقية كدفعة بطيئة بعد 30 ثانية</p><div class="err-box"><strong>❌ خطأ شائع:</strong> حفظ الـ Batch Brew على مصب ساخن (Hot Plate) لأكثر من 30 دقيقة. الحرارة المنخفضة تحرق القهوة وتعطي طعماً معدنياً. استخدم Carafe معزولة (Thermal).</div>`, en:`<h3>🏭 Batch Brew & High Volume — Feeding the Masses</h3><p>In a busy cafe, Batch Brew is the <strong>backbone</strong> of drip coffee. Medium cafes serve 50-100 Batch Brew cups daily. Here's how to make it consistent.</p>
<div class="img-c"><img src="${photo('water')}" alt="" loading="lazy"><div class="cap">🏭 Batch Brew — Consistency in Volume Production</div></div>
<h3>⚙️ Batch Brew Parameters</h3><table><tr><th>Factor</th><th>Ideal Range</th></tr><tr><td>Batch Size</td><td>1.5 - 3 liters</td></tr><tr><td>Coffee:Water Ratio</td><td>1:16 - 1:18</td></tr><tr><td>Grind Size</td><td>Medium-coarse</td></tr><tr><td>Water Temp</td><td>93-96°C</td></tr><tr><td>Extraction Time</td><td>4-6 minutes</td></tr><tr><td>Hold Time</td><td>Under 30 minutes (sealed thermal carafe)</td></tr></table><h3>🧪 Batch Calculation — Practical Example</h3><p>Need 2 liters (2000ml):<br>• 2000 ÷ 16 = <strong>125g coffee</strong> (for 1:16 ratio)<br>• Grind: 60% medium (EK43 setting 20) + 40% coarse (setting 22)<br>• Rinse paper filter before use<br>• Start by pouring 60% of water in one go (bloom + main pour)<br>• Add remaining 40% as slow pour after 30 seconds</p><div class="err-box"><strong>❌ Common Mistake:</strong> Keeping Batch Brew on a hot plate for over 30 minutes. Low heat burns the coffee giving metallic taste. Use a thermal carafe.</div>`};

L['B3-4'] = {ar:`<h3>⚙️ أنواع الطواحين — Burrs vs Blades وتأثيرها على النكهة</h3><p>الطاحنة هي <strong>ثاني أهم قطعة معدات</strong> بعد محمصة القهوة. نوع الطاحنة يحدد توزيع أحجام الطحن (Particle Size Distribution) — وهو ما يحدد جودة الاستخلاص.</p>
<h3>🔪 طاحنة الشفرات (Blade Grinder)</h3><p>تعمل مثل الخلاط — <strong>شفرات معدنية تدور بسرعة عالية</strong> (20,000+ RPM) تقطع وتكسر الحبات بشكل عشوائي. النتيجة: توزيع غير متساوٍ جداً — مسحوق ناعم (يتسبب بمرارة) مع قطع خشنة (تسبب حموضة غير مكتملة). الاستخدام: فقط للقهوة العادية المنزلية. <span class="hl">لا يوصى بها للقهوة المتخصصة.</span></p>
<h3>🔄 طاحنة الحجارة (Burr Grinder)</h3><p>تستخدم <strong>حجرين متقابلين</strong> يسحقان الحبة بتوزيع متساوٍ. نوعان رئيسيان:<br>• <strong>Conical Burr (مخروطية):</strong> حجر مخروطي داخلي يدور مقابل حلقة خارجية. مثالية للإسبريسو — تنتج طحناً متساوياً جداً مع حد أدنى من الحرارة. مثال: Baratza Sette 270, Mahlkönig K30<br>• <strong>Flat Burr (مسطحة):</strong> حجرتان مسطحتان متوازيتان. توفر تحكماً دقيقاً جداً في توزيع الطحن. مثالية للقهوة المقطرة و Brewing. مثال: EK43 (معيار المقاهي العالمية), Ditting 804</p>
<h3>📊 مقارنة توزيع الطحن</h3>
<table><tr><th>المعيار</th><th>شفرات (Blade)</th><th>مخروطية (Conical)</th><th>مسطحة (Flat)</th></tr><tr><td>انتظام الطحن</td><td>سيء جداً</td><td>جيد جداً</td><td>ممتاز</td></tr><tr><td>عدد الجسيمات الناعمة (Fines)</td><td>كثير (~25%)</td><td>قليل (~10-15%)</td><td>قليل جداً (~5-10%)</td></tr><tr><td>سرعة الدوران</td><td>20,000+ RPM</td><td>500-800 RPM</td><td>1,000-1,400 RPM</td></tr><tr><td>السعر</td><td>$15-50</td><td>$200-1,000</td><td>$500-3,000+</td></tr><tr><td>التطبيق المثالي</td><td>قهوة منزلية عادية</td><td>إسبريسو</td><td>إسبريسو + قهوة مقطرة</td></tr></table>
<h3>🔧 صيانة الطواحين — أهم نقطة يتجاهلها المبتدئون</h3><p><strong>نظف طاحنتك كل أسبوع:</strong> الزيوت المتراكمة تفسد النكهة وتزيد الاحتكاك. استخدم فرشاة و Grindz (حبيبات تنظيف) — لا تستخدم الماء أبداً. <strong>غيّر الحجارة:</strong> الحجارة المسطحة تحتاج تغيير كل 500-1000 كجم (حسب الصلابة). الحجارة المخروطية تدوم 2-3 أضعاف.</p>
<div class="ok-box"><strong>🎯 مشروع:</strong> ابحث عن طاحنة في مقهى محلي واسألهم عن نوع الحجارة. جرب طحن نفس القهوة على 3 درجات طحن مختلفة وحضّرها. لاحظ كيف يؤثر حجم الطحن على مدة الاستخلاص والطعم.</div>`, en:`<h3>⚙️ Grinder Types — Burrs vs Blades and Their Flavor Impact</h3><p>The grinder is the <strong>second most important piece of equipment</strong> after the coffee roaster. The grinder type determines the Particle Size Distribution (PSD) — which determines extraction quality.</p>
<h3>🔪 Blade Grinder</h3><p>Works like a blender — <strong>metal blades spinning at high speed</strong> (20,000+ RPM) chopping and breaking beans randomly. Result: very uneven distribution — fine powder (causing bitterness) with coarse chunks (causing under-extracted sourness). Use: only for regular household coffee. <span class="hl">Not recommended for specialty coffee.</span></p>
<h3>🔄 Burr Grinder</h3><p>Uses <strong>two opposing surfaces</strong> that crush the bean with even distribution. Two main types:<br>• <strong>Conical Burr:</strong> A cone-shaped inner burr spins against an outer ring. Ideal for espresso — produces very even grind with minimal heat. Examples: Baratza Sette 270, Mahlkönig K30<br>• <strong>Flat Burr:</strong> Two parallel flat discs. Provides very precise control over grind distribution. Ideal for drip coffee and brewing. Examples: EK43 (global cafe standard), Ditting 804</p>
<h3>📊 Grind Distribution Comparison</h3>
<table><tr><th>Parameter</th><th>Blade</th><th>Conical</th><th>Flat</th></tr><tr><td>Grind Uniformity</td><td>Very poor</td><td>Very good</td><td>Excellent</td></tr><tr><td>Fines Percentage</td><td>High (~25%)</td><td>Low (~10-15%)</td><td>Very low (~5-10%)</td></tr><tr><td>RPM</td><td>20,000+</td><td>500-800</td><td>1,000-1,400</td></tr><tr><td>Price</td><td>$15-50</td><td>$200-1,000</td><td>$500-3,000+</td></tr><tr><td>Best For</td><td>Regular household</td><td>Espresso</td><td>Espresso + Drip</td></tr></table>
<h3>🔧 Grinder Maintenance — The Overlooked Key</h3><p><strong>Clean your grinder weekly:</strong> Built-up oils ruin flavor and increase friction. Use a brush and Grindz (cleaning pellets) — never use water. <strong>Replace burrs:</strong> Flat burrs need replacement every 500-1000kg (depending on hardness). Conical burrs last 2-3x longer.</p>
<div class="ok-box"><strong>🎯 Project:</strong> Find a grinder at a local cafe and ask about their burr type. Try grinding the same coffee at 3 different grind sizes and brew. Note how grind size affects extraction time and flavor.</div>`};

L['B3-5'] = {ar:`<h3>🎯 الـ Dialing In المنهجي — من التخمين إلى الدقة العلمية</h3><p>الـ Dialing In هو <strong>عملية ضبط متغيرات التحضير</strong> للحصول على أفضل استخلاص ممكن. بدون منهجية، أنت تخمن. مع المنهجية، أنت <strong>تتحكم علمياً</strong> في النتيجة.</p>
<h3>📐 الإطار الخماسي للـ Dialling In</h3>
<table><tr><th>المتغير</th><th>التأثير</th><th>خطوة التعديل الأولى</th></tr><tr><td>1. درجة الطحن</td><td>أكبر تأثير — يحدد معدل الاستخلاص</td><td>أرفع إذا الاستخلاص بطيء جداً / أنعم إذا سريع جداً</td></tr><tr><td>2. الجرعة</td><td>يحدد تركيز الاستخلاص</td><td>ثبّت الجرعة أولاً ثم اضبط الطحن</td></tr><tr><td>3. درجة الحرارة</td><td>يؤثر على سرعة الاستخلاص ونوع المركبات</td><td>إذا كان الطعم "باكي" — ارفع الحرارة 1-2°م</td></tr><tr><td>4. وقت الاستخلاص</td><td>نتيجة — يمكن التحكم فيه بالطحن والجرعة</td><td>الإسبريسو: 25-30 ثانية | القهوة المقطرة: 2:30-4:00 د</td></tr><tr><td>5. توزيع الماء (في المقطرة)</td><td>يؤثر على التجانس</td><td>جرب Pulse Pouring بدلاً من الدفعة الواحدة</td></tr></table>
<h3>🧪 منهجية الـ Dialling In للإسبريسو (5 خطوات)</h3><p><strong>الخطوة 1 — ثبّت الأساس:</strong> جرعة 18 جرام، حرارة 93°م، نسبة 1:2 (36 جرام إسبريسو)<br><strong>الخطوة 2 — جرب طحن "مرجعي":</strong> إذا خرجت 36 جرام في 18 ثانية → الطحن خشن جداً. في 40 ثانية → الطحن ناعم جداً. المثالي: 25-30 ثانية.<br><strong>الخطوة 3 — اضبط الطحن:</strong> أرفع بنقرة واحدة (One Microstep) إذا سريع جداً. أنعم بنقرة إذا بطيء جداً. أعد المحاولة.<br><strong>الخطوة 4 — حسّن الطعم:</strong> وصلت للوقت المناسب لكن الطعم حامض؟ → الجرعة أكبر أو الماء أدفأ. الطعم مر؟ → الجرعة أقل أو أرفع الطحن.<br><strong>الخطوة 5 — سجل:</strong> اكتب كل شيء — وقت، جرعة، درجة طحن، حرارة، TDS، نتيجة التذوق. بدون تسجيل، أنت تعيد نفس الأخطاء.</p>
<div class="hl"><strong>📊 معادلة الـ Yield:</strong> Weight Out (ناتج الإسبريسو) ÷ Weight In (الجرعة) = Ratio. الإسبريسو التقليدي: 1:2. Modern (Lungo): 1:3. Ristretto: 1:1.5</div>
<div class="info-box"><strong>💡 قاعدة Squad:</strong> غير متغيراً واحداً فقط في كل مرة. إذا غيرت الطحن ودرجة الحرارة معاً → لا تعرف أيهما فعل الفرق. التغيير الوحيد المتغير = دقة قابلة للتكرار.</div>
<div class="ok-box"><strong>🎯 تحدي 21 يوماً:</strong> كل يوم، حضّر إسبريسو (أو قهوة مقطرة) وسجل البارامترات والطعم. بعد 21 يوماً، راجع ملاحظاتك. ستندهش من تطور ذائقتك!</div>`, en:`<h3>🎯 Systematic Dialing In — From Guessing to Scientific Precision</h3><p>Dialing In is the <strong>process of adjusting brew variables</strong> to achieve optimal extraction. Without a methodology, you're guessing. With methodology, you're <strong>scientifically in control</strong>.</p>
<h3>📐 The Five-Variable Framework</h3>
<table><tr><th>Variable</th><th>Impact</th><th>First Adjustment</th></tr><tr><td>1. Grind Size</td><td>Largest impact — determines extraction rate</td><td>Coarser if extraction too slow / Finer if too fast</td></tr><tr><td>2. Dose</td><td>Determines extraction concentration</td><td>Lock dose first then adjust grind</td></tr><tr><td>3. Temperature</td><td>Affects extraction speed and compound type</td><td>If "baked" taste — raise temp 1-2°C</td></tr><tr><td>4. Extraction Time</td><td>Result — controllable via grind and dose</td><td>Espresso: 25-30s | Drip: 2:30-4:00 min</td></tr><tr><td>5. Water Distribution (Drip)</td><td>Affects evenness</td><td>Try Pulse Pouring vs single pour</td></tr></table>
<h3>🧪 Espresso Dialing In (5 Steps)</h3><p><strong>Step 1 — Lock baseline:</strong> 18g dose, 93°C, 1:2 ratio (36g espresso)<br><strong>Step 2 — Try "reference" grind:</strong> If 36g in 18s → grind too coarse. 40s → too fine. Target: 25-30s.<br><strong>Step 3 — Adjust grind:</strong> One microstep coarser if too fast. One finer if too slow. Retry.<br><strong>Step 4 — Fine-tune taste:</strong> Time correct but sour? → higher dose or hotter water. Bitter? → lower dose or coarser grind.<br><strong>Step 5 — Log:</strong> Write everything — time, dose, grind, temp, TDS, taste score. Without logging, you repeat mistakes.</p>
<div class="hl"><strong>📊 Yield Formula:</strong> Weight Out ÷ Weight In = Ratio. Traditional espresso: 1:2. Modern (Lungo): 1:3. Ristretto: 1:1.5</div>
<div class="info-box"><strong>💡 Golden Rule:</strong> Change only ONE variable at a time. If you change grind AND temperature together → you won't know which made the difference. Single variable change = reproducible precision.</div>
<div class="ok-box"><strong>🎯 21-Day Challenge:</strong> Every day, brew espresso (or drip) and log parameters and taste. After 21 days, review your notes. You'll be amazed at how your palate develops!</div>`};

L['C1-3'] = {ar:`<h3>🔍 عيوب القهوة — كيف تشخص المشكلة من الطعم؟</h3><p>تذوق العيوب مهم بقدر تذوق الصفات الجيدة. المقيم المحترف <strong>يتعرف على المشكلة فوراً</strong> ويعرف مصدرها. إليك أكثر 10 عيوب شيوعاً.</p><table><tr><th>العيب</th><th>الطعم/الرائحة</th><th>السبب</th></tr><tr><td>قديم (Old Crop)</td><td>خشب جاف، كرتون</td><td>تخزين أكثر من 12 شهراً بعد الحصاد</td></tr><tr><td>فينولي (Phenolic)</td><td>دواء، بلاستيك، كلور</td><td>استخدام مبيدات غير مناسبة أو تلوث الماء</td></tr><tr><td>ترابي (Earthy)</td><td>تربة، عَفَن</td><td>تخمير غير صحيح في المعالجة المغسولة</td></tr><tr><td>خامر (Ferment)</td><td>خلّ، فاكهة فاسدة</td><td>تخمير زائد أو تجفيف غير متساوٍ</td></tr><tr><td>لحمي (Meaty/Hide)</td><td>جلد حيوان، مسلخ</td><td>تلوث أثناء التخمير (حيوانات دخلت الأحواض)</td></tr><tr><td>دخاني (Smoky)</td><td>دخان مباشر</td><td>تحميص بلهب ملامس للبن (فلتر الأشعة تحت الحمراء معطل)</td></tr><tr><td>باكي (Baked)</td><td>بسكويت مسطح، شوفان</td><td>تحميص بحرارة منخفضة جداً أو منحنى مسطح جداً</td></tr><tr><td>خضراء (Under-developed)</td><td>بازلاء، قش</td><td>وقت تطوير قصير جداً (أقل من 15%)</td></tr><tr><td>محروقة (Scorched)</td><td>رماد، سيجارة</td><td>تحميص بحرارة عالية جداً في البداية</td></tr><tr><td>طيني (Muddy)</td><td>طمي، عكر</td><td>نقع طويل جداً أو طحن ناعم جداً للتحضير</td></tr></table><div class="ok-box"><strong>🎯 تمرين:</strong> ابحث عن قهوة "معيبة" عن قصد — اترك بناً محمصاً مفتوحاً لمدة أسبوعين. تذوقها. تعرف على طعم "القديم". الآن ستعرف الفرق عندما تشرب قهوة طازجة!</div>`, en:`<h3>🔍 Coffee Defects — Diagnose Problems by Taste</h3><p>Tasting defects is as important as tasting good qualities. A professional evaluator <strong>recognizes problems instantly</strong> and knows their source. Here are the 10 most common defects.</p><table><tr><th>Defect</th><th>Taste/Smell</th><th>Cause</th></tr><tr><td>Old Crop</td><td>Dry wood, cardboard</td><td>Storage over 12 months post-harvest</td></tr><tr><td>Phenolic</td><td>Medicine, plastic, chlorine</td><td>Improper pesticides or water contamination</td></tr><tr><td>Earthy</td><td>Soil, mold</td><td>Improper fermentation in washed processing</td></tr><tr><td>Ferment</td><td>Vinegar, rotten fruit</td><td>Over-fermentation or uneven drying</td></tr><tr><td>Meaty/Hide</td><td>Animal skin</td><td>Contamination during fermentation (animals in tanks)</td></tr><tr><td>Smoky</td><td>Direct smoke</td><td>Roasting with flame touching beans (IR filter broken)</td></tr><tr><td>Baked</td><td>Flat biscuit, oatmeal</td><td>Roasting at too low temp or too flat curve</td></tr><tr><td>Under-developed</td><td>Peas, straw</td><td>Development time too short (under 15%)</td></tr><tr><td>Scorched</td><td>Ash, cigarette</td><td>Very high heat at roast start</td></tr><tr><td>Muddy</td><td>Silt, cloudy</td><td>Over-extraction or too fine grind for brewing method</td></tr></table><div class="ok-box"><strong>🎯 Exercise:</strong> Find a "defective" coffee intentionally — leave roasted beans open for 2 weeks. Taste it. Learn what "old" tastes like. Now you'll know the difference when drinking fresh coffee!</div>`};

L['C1-4'] = {ar:`<h3>🧪 التحليل الحسي (Sensory Analysis) — لغة المحمص المحترف</h3><p>التحليل الحسي هو <strong>أداة المحمص الأساسية</strong> لتقييم جودة القهوة. يتطلب تدريباً منظماً للأنف، اللسان، والذاكرة الحسية. SCAA و SCA طورا بروتوكول قياسي يسمى <strong>SCA Cupping Protocol</strong>.</p>
<div class="img-c"><img src="${photo('cupping')}" alt="" loading="lazy"><div class="cap">👃 تدريب الحواس — كيف تصبح خبير تذوق</div></div>
<h3>👃 تدريب الأنف (Olfactory Training)</h3><p>يميز الأنف البشري أكثر من <strong>10,000 رائحة مختلفة</strong>. للتدريب، استخدم <strong>Le Nez du Café</strong> (مجموعة 36 رائحة قياسية للقهوة) أو طبق المبدأ بمواد طبيعية. الروائح الأساسية في القهوة تنقسم لـ:<br>• <strong>زهرية:</strong> ياسمين، ورد، زهر البرتقال — توجد في بن إثيوبيا<br>• <strong>فاكهة حمراء:</strong> توت، كرز، فراولة — توجد في البن الطبيعي<br>• <strong>حمضيات:</strong> ليمون، برتقال، جريب فروت — توجد في البن المغسول من كينيا<br>• <strong>مكسرات/شوكولاتة:</strong> لوز، كاكاو — توجد في البن البرازيلي<br>• <strong>توابل:</strong> قرفة، هيل، قرنفل — توجد في بن إندونيسيا</p>
<h3>👅 تدريب التذوق (Taste Training)</h3><p>الأذواق الأساسية الخمسة: <strong>حلو، حامض، مالح، مر، وأومامي</strong>. القهوة تحتوي على الأربعة الأولى بشكل أساسي.<br>• <strong>الحموضة (Acidity):</strong> مقياس جودة — تُصنف من منخفضة (برازيل طبيعي) إلى عالية جداً (كينيا SL28). مقياس SCA: 0-10<br>• <strong>الحلاوة (Sweetness):</strong> مقياس النضج — تزداد مع التحميص المناسب والتخمير الجيد<br>• <strong>المرارة (Bitterness):</strong> نتيجة طبيعية للكافيين والتحميص الداكن — يجب أن تكون متوازنة لا مزعجة<br>• <strong>القوام (Body):</strong> من خفيف كالشاي (تحميص فاتح) إلى ثقيل كالكريمة (إسبريسو برازيلي)</p>
<div class="hl"><strong>📊 سلم SCA للنقاط:</strong> Specialty ≥ 80 نقطة | Premium 85-89 | Reserve 90+ | كل نقطة تمثل سعراً أعلى بـ $0.10-0.50/رطل</div>
<h3>📋 بروتوكول الكابينج (Cupping Protocol)</h3><p>1. <strong>طحن:</strong> 8.3 جرام بن خشن (طحنة Chemex تقريباً)<br>2. <strong>شم القهوة المطحونة:</strong> سجل الرائحة الجافة (Fragrance)<br>3. <strong>صب الماء:</strong> 150 مل ماء عند 93°م<br>4. <strong>شم بعد 4 دقائق:</strong> اكسر الكراست (Crust) — هذه أهم خطوة لشم النكهات المتطايرة<br>5. <strong>التذوق بعد 8-10 دقائق:</strong> استخدم ملعقة الكابينج — امص القهوة بصوت (Slurp) لترذيذها في الفم<br>6. <strong>تسجيل النتائج:</strong> Fragrance/Aroma, Flavor, Aftertaste, Acidity, Body, Balance, Uniformity, Clean Cup, Sweetness, Overall</p>
<div class="ok-box"><strong>🎯 مشروع:</strong> اشتري 3 قهوات من أصول مختلفة (مثلاً: إثيوبيا، كولومبيا، برازيل). اعمل كابينج للأثلاث. سجل ملاحظاتك لكل مرحلة. صنف النكهات حسب الروائح الأساسية. حاول توقع درجة SCA لكل بن.</div>`, en:`<h3>🧪 Sensory Analysis — The Roaster's Essential Language</h3><p>Sensory analysis is the <strong>roaster's fundamental tool</strong> for evaluating coffee quality. It requires systematic training of the nose, tongue, and sensory memory. SCAA and SCA developed the standard <strong>SCA Cupping Protocol</strong>.</p>
<div class="img-c"><img src="${photo('cupping')}" alt="" loading="lazy"><div class="cap">👃 Sensory Training — How to Become a Tasting Expert</div></div>
<h3>👃 Olfactory Training</h3><p>The human nose can distinguish over <strong>10,000 different scents</strong>. For training, use <strong>Le Nez du Café</strong> (a set of 36 standard coffee aromas) or apply the principle with natural materials. Key coffee aroma categories:<br>• <strong>Floral:</strong> Jasmine, rose, orange blossom — found in Ethiopian coffee<br>• <strong>Red fruit:</strong> Berry, cherry, strawberry — found in natural processed coffee<br>• <strong>Citrus:</strong> Lemon, orange, grapefruit — found in washed Kenyan coffee<br>• <strong>Nut/Chocolate:</strong> Almond, cocoa — found in Brazilian coffee<br>• <strong>Spice:</strong> Cinnamon, cardamom, clove — found in Indonesian coffee</p>
<h3>👅 Taste Training</h3><p>The five basic tastes: <strong>sweet, sour, salty, bitter, and umami</strong>. Coffee primarily contains the first four.<br>• <strong>Acidity:</strong> A quality measure — rated from low (Brazilian natural) to very high (Kenyan SL28). SCA scale: 0-10<br>• <strong>Sweetness:</strong> A ripeness measure — increases with proper roasting and good brewing<br>• <strong>Bitterness:</strong> Natural result of caffeine and dark roasting — should be balanced, not unpleasant<br>• <strong>Body:</strong> From tea-like (light roast) to creamy (Brazilian espresso)</p>
<div class="hl"><strong>📊 SCA Scoring:</strong> Specialty ≥ 80 points | Premium 85-89 | Reserve 90+ | Each point represents $0.10-0.50/lb price increase</div>
<h3>📋 Cupping Protocol</h3><p>1. <strong>Grind:</strong> 8.3g coffee, coarse (Chemex grind approx)<br>2. <strong>Smell dry grounds:</strong> Record fragrance<br>3. <strong>Pour water:</strong> 150ml water at 93°C<br>4. <strong>Smell after 4 min:</strong> Break the crust — the most important step for capturing volatile aromas<br>5. <strong>Taste after 8-10 min:</strong> Use cupping spoon — slurp to aerate across the palate<br>6. <strong>Score:</strong> Fragrance/Aroma, Flavor, Aftertaste, Acidity, Body, Balance, Uniformity, Clean Cup, Sweetness, Overall</p>
<div class="ok-box"><strong>🎯 Project:</strong> Buy 3 coffees from different origins (e.g., Ethiopia, Colombia, Brazil). Cup all three. Record observations at each stage. Classify flavors by basic aroma categories. Try to predict each coffee's SCA score.</div>`};

L['C1-5'] = {ar:`<h3>🔍 عيوب القهوة — تشخيص المشاكل وحلولها العملية</h3><p>تشخيص عيوب القهوة هو <strong>مهارة تميز المحمص العادي من المحترف</strong>. وفقاً لـ SCA، القهوة الحاصلة على أكثر من 80 نقطة يجب ألا تحتوي أي عيب من الفئة الأولى (Primary Defects).</p>
<h3>⚠️ عيوب الفئة الأولى (Primary Defects)</h3>
<table><tr><th>العيب</th><th>السبب</th><th>التأثير</th><th>الحل</th></tr><tr><td>بن أسود كامل</td><td>إفراط في النضج أو مرض التوت</td><td>طعم عفن، ترابي، قذر</td><td>فرز يدوي — ارفع أي حبة سوداء</td></tr><tr><td>حامضية (Sour)</td><td>تحميص غير كافٍ — تخمير سيئ</td><td>طعم لاذع يذكرنا بالخل</td><td>زد وقت التحميص بعد الكراك الأول</td></tr><tr><td>فطريات (Fungus)</td><td>تخزين رطب — تلف أثناء التجفيف</td><td>طعم الطين، العفن — خطر صحي</td><td>التخلص من الدفعة بالكامل</td></tr><tr><td>أجسام غريبة</td><td>تلوث أثناء الحصاد أو التجفيف</td><td>حجارة، زجاج — خطر على الطاحنة</td><td>استخدم Magnetic Separator و Destoner</td></tr></table>
<h3>⚠️ عيوب الفئة الثانية (Secondary Defects)</h3>
<table><tr><th>العيب</th><th>السبب</th><th>التأثير</th><th>عدد للـ 350 جرام</th></tr><tr><td>Sinker (حبة خفيفة)</td><td>حبة غير ناضجة</td><td>طعم أخضر، عشبي، لاذع</td><td>≥ 5 عيوب</td></tr><tr><td>Quaker</td><td>تحميص غير متساوٍ</td><td>طعم قش، ورق جاف</td><td>≥ 5 عيوب</td></tr><tr><td>مكسور/مقطع</td><td>معالجة ميكانيكية عنيفة</td><td>تحميص غير منتظم، حموضة زائدة</td><td>غير محدد</td></tr><tr><td>قشرة/شل</td><td>تشقق أثناء التحميص</td><td>احتراق — طعم رماد</td><td>يحتسب بعد التحميص</td></tr></table>
<h3>🛠️ التشخيص العملي في المحمصة</h3><p>دفعة تحميص مكتوب عليها "نكهات عشبية" — ماذا تفعل؟<br>→ الفرز: افحص عينة 100 جرام قبل التحميص — ابحث عن Quakers و Sinkers<br>→ درجة الحرارة: تأكد من كفاية وقت التحميص — على الأقل 2 دقيقة بعد الكراك الأول (First Crack)<br>→ منحنى التحميص: تأكد من عدم flatlining في المرحلة الأخيرة (يبرد الفرن قبل اكتمال التطوير)<br>→ التخمير: جرب نسبة طحن مختلفة (أرفع بنسبة 10%) ونسبة ماء مختلفة (أضبط TDS)</p>
<div class="info-box"><strong>💡 تذكر:</strong> <strong>90% من عيوب القهوة سببها مشاكل في سلسلة التوريد قبل التحميص</strong>. المحمص الجيد يعرف كيف يختار البن الأخضر، لا كيف يخفي مشاكله بالتحميص الداكن!</div>
<div class="ok-box"><strong>🎯 مشروع:</strong> اشتري 500 جرام بن غير مقشر (طبيعي). افرز يدوياً كل الحبات السوداء والتالفة. احسب عدد العيوب لكل 350 جرام (المعيار SCA). حمصها واعمل كابينج. هل تشعر بتحسن واضح بعد الفرز؟</div>`, en:`<h3>🔍 Coffee Defects — Diagnosis and Practical Solutions</h3><p>Diagnosing coffee defects is a <strong>skill that separates the average roaster from the professional</strong>. According to SCA, coffee scoring over 80 points must contain zero Category 1 defects.</p>
<h3>⚠️ Primary Defects (Category 1)</h3>
<table><tr><th>Defect</th><th>Cause</th><th>Impact</th><th>Solution</th></tr><tr><td>Full Black</td><td>Overripe or berry disease</td><td>Musty, dirty, earthy taste</td><td>Hand sorting — remove every black bean</td></tr><tr><td>Sour</td><td>Under-roasting — bad fermentation</td><td>Sharp, vinegar-like taste</td><td>Increase roast time after first crack</td></tr><tr><td>Fungus</td><td>Wet storage — drying damage</td><td>Moldy, musty — health risk</td><td>Discard entire batch</td></tr><tr><td>Foreign Matter</td><td>Harvest or drying contamination</td><td>Stones, glass — grinder hazard</td><td>Use Magnetic Separator + Destoner</td></tr></table>
<h3>⚠️ Secondary Defects (Category 2)</h3>
<table><tr><th>Defect</th><th>Cause</th><th>Impact</th><th>Count per 350g</th></tr><tr><td>Sinker (light bean)</td><td>Unripe bean</td><td>Green, grassy, astringent taste</td><td>≥ 5 defects</td></tr><tr><td>Quaker</td><td>Uneven roasting</td><td>Straw, dry paper taste</td><td>≥ 5 defects</td></tr><tr><td>Broken/Bitten</td><td>Harsh mechanical processing</td><td>Uneven roasting, excess acidity</td><td>Unspecified</td></tr><tr><td>Shell/Ear</td><td>Cracking during roasting</td><td>Burning — ash taste</td><td>Counted post-roast</td></tr></table>
<h3>🛠️ Practical Roastery Diagnosis</h3><p>A roast batch tastes "grassy" — what do you do?<br>→ Sort: Examine a 100g sample before roasting — look for Quakers and Sinkers<br>→ Temperature: Ensure sufficient roast time — at least 2 minutes after First Crack<br>→ Roast curve: Check for no flatlining in the final stage (oven cools before development completes)<br>→ Brew: Try a different grind ratio (10% finer) and different water ratio (adjust TDS)</p>
<div class="info-box"><strong>💡 Remember:</strong> <strong>90% of coffee defects come from supply chain issues before roasting</strong>. A good roaster knows how to select green beans, not how to hide problems with dark roasting!</div>
<div class="ok-box"><strong>🎯 Project:</strong> Buy 500g of unwashed (natural) coffee. Hand-sort all black and damaged beans. Calculate defect count per 350g (SCA standard). Roast and cup. Can you taste a clear improvement after sorting?</div>`};

L['C2-3'] = {ar:`<h3>📦 تخزين البن ونضارته — من التحميص إلى الفنجان</h3><p>القهوة <strong>تتنفس</strong>. بعد التحميص، تفقد القهوة 30-60% من نكهتها خلال 3 أسابيع. فهم كيفية تخزين البن هو الفرق بين قهوة ممتازة وقهوة عادية.</p><h3>⚡ دورة حياة البن المحمص</h3><table><tr><th>الفترة</th><th>الحالة</th><th>الاستخدام المثالي</th></tr><tr><td>يوم 1-2 بعد التحميص</td><td>غازات عالية (Degassing) — كريما غير مستقرة</td><td>ليس مثالياً للإسبريسو — ممتاز للقهوة المقطرة فقط</td></tr><tr><td>يوم 3-7</td><td>ذروة النضج — كريما مثالية، نكهات متوازنة</td><td>الإسبريسو والقهوة المقطرة — أفضل فترة</td></tr><tr><td>أسبوع 2-3</td><td>جيد جداً — نكهات لا تزال واضحة</td><td>استهلاك يومي، مناسب لـ Batch Brew</td></tr><tr><td>أسبوع 4-5</td><td>مقبول — نكهات باهتة، حلاوة أقل</td><td>مشروبات بالحليب، Cold Brew (يخفي العيوب)</td></tr><tr><td>شهر 2+</td><td>قديم — نكهات منخفضة جداً</td><td>استخدامات غير مباشرة (حلويات، تتبيلات)</td></tr></table><h3>🏠 قواعد التخزين المثالية — DOs and DON'Ts</h3><p><strong>✅ افعل:</strong><br>• استخدم وعاء محكم الإغلاق (Airscape, Fellow Atmos) مع صمام تفريغ<br>• احفظه في مكان بارد ومظلم (خزانة بعيداً عن الفرن والشمس)<br>• اشتر كميات صغيرة تكفيك لأسبوعين فقط<br>• اطحن مباشرة قبل التحضير — البن المطحون يفقد نكهته في 15 دقيقة!</p><p><strong>❌ لا تفعل:</strong><br>• لا تحتفظ بالبن في الثلاجة — الرطوبة تدمر النكهة (يتكتّل ويمتص روائح الجبن!)<br>• لا تحتفظ بالبن في الفريزر لاستخدام يومي — التكثف عند الإخراج يدمر الحبة<br>• لا تشتري بناً مطحوناً — يفقد 80% من نكهته في أول 24 ساعة</p><div class="quiz-box"><strong>💬 هل تعلم؟</strong> البن المطحون يفقد 50% من مركباته المتطايرة في أول 15 دقيقة بعد الطحن. لهذا الباريستا المحترف يطحن لكل جرعة!</div>`, en:`<h3>📦 Coffee Storage & Freshness — From Roast to Cup</h3><p>Coffee <strong>breathes</strong>. After roasting, coffee loses 30-60% of its flavor within 3 weeks. Understanding storage is the difference between excellent and mediocre coffee.</p><h3>⚡ Roasted Coffee Lifecycle</h3><table><tr><th>Period</th><th>State</th><th>Best Use</th></tr><tr><td>Day 1-2 post-roast</td><td>High degassing — unstable crema</td><td>Not ideal for espresso — great for pour-over</td></tr><tr><td>Day 3-7</td><td>Peak freshness — perfect crema, balanced</td><td>Espresso and pour-over — best period</td></tr><tr><td>Week 2-3</td><td>Very good — flavors still clear</td><td>Daily consumption, good for Batch Brew</td></tr><tr><td>Week 4-5</td><td>Acceptable — faded flavors, less sweet</td><td>Milk drinks, Cold Brew (hides defects)</td></tr><tr><td>Month 2+</td><td>Old — very low flavor</td><td>Non-beverage uses (desserts, rubs)</td></tr></table><h3>🏠 Storage Rules — DOs and DON'Ts</h3><p><strong>✅ DO:</strong><br>• Use airtight container (Airscape, Fellow Atmos) with one-way valve<br>• Store in cool, dark place (cabinet away from stove and sun)<br>• Buy small amounts — 2 weeks supply max<br>• Grind immediately before brewing — ground coffee loses flavor in 15 minutes!</p><p><strong>❌ DON'T:</strong><br>• Don't keep coffee in fridge — moisture destroys flavor (absorbs cheese smells!)<br>• Don't keep in freezer for daily use — condensation upon removal damages beans<br>• Don't buy pre-ground coffee — loses 80% of flavor in first 24 hours</p><div class="quiz-box"><strong>💬 Did You Know?</strong> Ground coffee loses 50% of volatile compounds in the first 15 minutes after grinding. That's why professional baristas grind per dose!</div>`};

L['C2-4'] = {ar:`<h3>🧪 المعالجة التجريبية — آفاق جديدة في عالم النكهة</h3><p>المعالجات التجريبية تمثل <strong>الحدود الجديدة لابتكار القهوة</strong>. في العقد الأخير، تجاوزت نسبة القهوة التجريبية في سوق specialty من 2% إلى أكثر من 15%، ويبحث المنتجون عن طرق جديدة لإنتاج نكهات غير مسبوقة.</p>
<h3>🫧 التخمير اللاهوائي (Anaerobic Fermentation)</h3><p>توضع الكرزات الكاملة في خزانات <strong>محكمة الإغلاق</strong> مع صمامات أحادية الاتجاه تمنع دخول الأكسجين. يتم التخمير بواسطة بكتيريا لا تحتاج أكسجين — تنتج نكهات جريئة غير تقليدية.</p><table><tr><th>المعيار</th><th>التخمير التقليدي</th><th>التخمير اللاهوائي</th></tr><tr><td>وجود الأكسجين</td><td>مفتوح للهواء</td><td>مغلق تماماً</td></tr><tr><td>درجة الحرارة</td><td>محيطة (20-30°م)</td><td>مضبوطة (15-25°م)</td></tr><tr><td>المدة</td><td>24-36 ساعة</td><td>48-120 ساعة</td></tr><tr><td>النكهات الناتجة</td><td>نظيفة، زهرية</td><td>فاكهة استوائية، نبيذية، أزهار غريبة</td></tr><tr><td>مستوى التحكم</td><td>منخفض</td><td>عالٍ — قابل للقياس</td></tr></table>
<h3>🍷 الكربونيك ماكيريشن (Carbonic Maceration)</h3><p>مقتبسة من صناعة النبيذ (خصوصاً <strong>Pinot Noir</strong> في بورغوندي). توضع الكرزات الكاملة غير المقشورة في بيئة <strong>CO₂ نقية</strong> مضغوطة. داخل كل ثمرة، يحدث تخمير داخلي تنتج فيه خمائر طبيعية نكهات مذهلة: توت أحمر مشرق، أزهار غريبة، ونبيذية معقدة. أشهر مثال: قهوة كوستاريكا "Las Lajas" التي حصلت على 93 نقطة SCA — ثورة في عالم التخمير.</p>
<h3>🧬 التخمير بالخمائر المختارة (Yeast Inoculation)</h3><p>بدلاً من الاعتماد على الخمائر الطبيعية الموجودة على الثمرة، يضيف المنتجون <strong>سلالات محددة من الخمائر</strong> للتحكم بدقة في نواتج التخمير. مثلاً:<br>• <strong>Saccharomyces cerevisiae:</strong> الخميرة الأكثر شيوعاً — تنتج نكهات الفاكهة الحمراء<br>• <strong>Pichia kluyveri:</strong> تنتج نكهات استوائية وزهرية<br>• <strong>Torulaspora delbrueckii:</strong> تنتج نكهات نظيفة مع حموضة منخفضة</p>
<div class="hl"><strong>📊 سوق المعالجات التجريبية:</strong> في 2025، تشكل القهوة التجريبية 18% من واردات specialty في أمريكا وأوروبا. متوسط السعر: $15-25 للرطل — مقابل $3-5 للقهوة التقليدية. المستهلكون يبحثون عن تجارب جديدة!</div>
<div class="qr-box"><strong>💬 تحدّ:</strong> اشتر قهوة "Anaerobic Natural" من محمصة محلية. حضّرها بطريقتك المفضلة. صف النكهات التي تشعر بها — هل تشبه أي فاكهة تعرفها؟</div>`, en:`<h3>🧪 Experimental Processing — New Frontiers in Flavor</h3><p>Experimental processing represents <strong>the new frontier of coffee innovation</strong>. In the last decade, experimental coffee has grown from 2% to over 15% of the specialty market, with producers seeking new ways to create unprecedented flavors.</p>
<h3>🫧 Anaerobic Fermentation</h3><p>Whole cherries are placed in <strong>sealed tanks</strong> with one-way valves preventing oxygen entry. Fermentation occurs via bacteria that don't need oxygen — producing bold, unconventional flavors.</p><table><tr><th>Parameter</th><th>Traditional</th><th>Anaerobic</th></tr><tr><td>Oxygen</td><td>Open to air</td><td>Completely sealed</td></tr><tr><td>Temperature</td><td>Ambient (20-30°C)</td><td>Controlled (15-25°C)</td></tr><tr><td>Duration</td><td>24-36 hours</td><td>48-120 hours</td></tr><tr><td>Resulting Flavors</td><td>Clean, floral</td><td>Tropical fruit, winey, exotic floral</td></tr><tr><td>Control Level</td><td>Low</td><td>High — measurable</td></tr></table>
<h3>🍷 Carbonic Maceration</h3><p>Borrowed from winemaking (especially <strong>Pinot Noir</strong> in Burgundy). Whole uncrushed cherries are placed in a <strong>pure CO₂</strong> pressurized environment. Inside each fruit, internal fermentation occurs where natural yeasts produce stunning flavors: bright red berry, exotic florals, and complex winey notes. Famous example: Costa Rica "Las Lajas" scoring 93 SCA points — a revolution in fermentation.</p>
<h3>🧬 Yeast Inoculation</h3><p>Instead of relying on natural yeasts on the fruit, producers add <strong>specific yeast strains</strong> to precisely control fermentation byproducts. For example:<br>• <strong>Saccharomyces cerevisiae:</strong> Most common — produces red fruit flavors<br>• <strong>Pichia kluyveri:</strong> Produces tropical and floral notes<br>• <strong>Torulaspora delbrueckii:</strong> Produces clean flavors with low acidity</p>
<div class="hl"><strong>📊 Experimental Market:</strong> In 2025, experimental coffee makes up 18% of specialty imports in the US and Europe. Average price: $15-25/lb — vs $3-5 for conventional coffee. Consumers are seeking new experiences!</div>
<div class="quiz-box"><strong>💬 Challenge:</strong> Buy an "Anaerobic Natural" coffee from a local roaster. Brew it your favorite way. Describe the flavors you perceive — do they remind you of any fruit you know?</div>`};

L['C2-5'] = {ar:`<h3>🔗 المعالجة والنكهة — كيف تختار طريقة المعالجة حسب النتيجة المرجوة</h3><p>اختيار طريقة المعالجة هو <strong>أول وأهم قرار</strong> يحدد شخصية القهوة النهائية. لكل طريقة أثرها المباشر على <strong>الحموضة، الحلاوة، القوام، والتعقيد</strong>.</p>
<h3>📊 مصفوفة المعالجة والنكهة</h3>
<table><tr><th>طريقة المعالجة</th><th>الحموضة</th><th>الحلاوة</th><th>القوام</th><th>التعقيد</th><th>النظافة</th></tr><tr><td>طبيعية (Natural)</td><td>منخفضة</td><td>عالية جداً</td><td>كامل</td><td>عالٍ</td><td>منخفضة</td></tr><tr><td>مغسولة (Washed)</td><td>عالية</td><td>متوسطة</td><td>خفيف-متوسط</td><td>متوسط</td><td>عالية جداً</td></tr><tr><td>عسل أصفر</td><td>متوسطة</td><td>عالية</td><td>متوسط</td><td>متوسط</td><td>عالية</td></tr><tr><td>عسل أحمر</td><td>منخفضة-متوسطة</td><td>عالية جداً</td><td>كامل</td><td>عالٍ</td><td>متوسطة</td></tr><tr><td>عسل أسود</td><td>منخفضة</td><td>عالية جداً</td><td>ثقيل</td><td>عالٍ جداً</td><td>منخفضة</td></tr><tr><td>لاهوائي</td><td>فريدة</td><td>عالية</td><td>كامل</td><td>استثنائي</td><td>متوسطة</td></tr><tr><td>كربونيك</td><td>نبيذية</td><td>عالية جداً</td><td>كامل-حريري</td><td>استثنائي</td><td>عالية</td></tr></table>
<h3>🌡️ تأثير المناخ والتربة (Terroir) على اختيار المعالجة</h3><p><strong>المناطق الجافة (البرازيل، اليمن):</strong> المعالجة الطبيعية مثالية لأن الرطوبة المنخفضة تسمح بتجفيف بطيء ومنضبط. تنتج نكهات شوكولاتية وجوزية مع حلاوة عالية.<br><strong>المناطق الرطبة (كولومبيا، كينيا):</strong> المعالجة المغسولة ضرورية لمنع التعفن — لكن هذا ينتج أروع نكهات الحمضيات والتوت.<br><strong>المناطق ذات المواسم الممطرة المتقطعة (كوستاريكا):</strong> المعالجة بالعسل مثالية — تحتاج وقت تجفيف أقل من الطبيعية لكنها تحتفظ بالحلاوة.</p>
<h3>🧪 التوجيه العملي للمحمص</h3><p>كمحمص، اختر طريقة المعالجة بناءً على النتيجة المرجوة:<br>• <strong>تريد حموضة متألقة ونكهات زهرية؟</strong> → اختر مغسولة — مثل إثيوبيا ييرغاشيفي المغسولة<br>• <strong>تريد حلاوة فاكهية جريئة؟</strong> → اختر طبيعية — مثل إثيوبيا طبيعية أو برازيلية طبيعية<br>• <strong>تريد توازناً بين الحلاوة والنظافة؟</strong> → اختر عسل — مثل كوستاريكا عسل أحمر<br>• <strong>تريد إبهار زبائنك بنكهات غير متوقعة؟</strong> → اختر تجريبية — لاهوائي أو كربونيك</p>
<div class="info-box"><strong>💡 قاعدة ذهبية:</strong> لا توجد معالجة "أفضل" من أخرى — كل معالجة تكشف جانباً مختلفاً من شخصية البن. المحمص المحترف يختار المعالجة التي تبرز أفضل ما في البن الذي يعمل معه.</div>
<div class="ok-box"><strong>🎯 مشروع:</strong> اختر بناً واحداً من أصل واحد (مثلاً: إثيوبي). اشتره بثلاث معالجات مختلفة: طبيعية، مغسولة، وعسل. اعمل كابينج للثلاثة. صف الاختلافات في الحموضة، الحلاوة، القوام، والنظافة. أي معالجة تفضّلها ولماذا؟</div>`, en:`<h3>🔗 Processing & Flavor Correlation — Choosing the Right Method for Your Goal</h3><p>Choosing a processing method is the <strong>first and most important decision</strong> determining the final coffee character. Each method directly impacts <strong>acidity, sweetness, body, and complexity</strong>.</p>
<h3>📊 Processing & Flavor Matrix</h3>
<table><tr><th>Method</th><th>Acidity</th><th>Sweetness</th><th>Body</th><th>Complexity</th><th>Cleanliness</th></tr><tr><td>Natural</td><td>Low</td><td>Very high</td><td>Full</td><td>High</td><td>Low</td></tr><tr><td>Washed</td><td>High</td><td>Medium</td><td>Light-Med</td><td>Medium</td><td>Very high</td></tr><tr><td>Yellow Honey</td><td>Medium</td><td>High</td><td>Medium</td><td>Medium</td><td>High</td></tr><tr><td>Red Honey</td><td>Low-Med</td><td>Very high</td><td>Full</td><td>High</td><td>Medium</td></tr><tr><td>Black Honey</td><td>Low</td><td>Very high</td><td>Heavy</td><td>Very high</td><td>Low</td></tr><tr><td>Anaerobic</td><td>Unique</td><td>High</td><td>Full</td><td>Exceptional</td><td>Medium</td></tr><tr><td>Carbonic Maceration</td><td>Winey</td><td>Very high</td><td>Full-Silky</td><td>Exceptional</td><td>High</td></tr></table>
<h3>🌡️ Climate & Terroir Effect on Processing Choice</h3><p><strong>Dry regions (Brazil, Yemen):</strong> Natural processing is ideal because low humidity allows slow, controlled drying. Produces chocolatey, nutty flavors with high sweetness.<br><strong>Wet regions (Colombia, Kenya):</strong> Washed processing is necessary to prevent mold — but this produces the brightest citrus and berry flavors.<br><strong>Regions with intermittent rainy seasons (Costa Rica):</strong> Honey processing is ideal — needs less drying time than natural but retains sweetness.</p>
<h3>🧪 Practical Guide for Roasters</h3><p>As a roaster, choose your processing method based on desired outcome:<br>• <strong>Want bright acidity and floral notes?</strong> → Choose washed — like Ethiopian Yirgacheffe washed<br>• <strong>Want bold fruity sweetness?</strong> → Choose natural — like Ethiopian or Brazilian natural<br>• <strong>Want balance between sweetness and cleanliness?</strong> → Choose honey — like Costa Rica red honey<br>• <strong>Want to amaze customers with unexpected flavors?</strong> → Choose experimental — anaerobic or carbonic maceration</p>
<div class="info-box"><strong>💡 Golden Rule:</strong> No processing method is "better" than another — each reveals a different aspect of the bean's character. The professional roaster chooses the method that best highlights the coffee they work with.</div>
<div class="ok-box"><strong>🎯 Project:</strong> Choose one coffee from one origin (e.g., Ethiopian). Buy it in three different processing methods: natural, washed, and honey. Cup all three. Describe differences in acidity, sweetness, body, and cleanliness. Which processing do you prefer and why?</div>`};

L['C3-4'] = {ar:`<h3>📱 تسويق المقهى — من أول زبون إلى مليون متابع</h3><p>في سوق اليوم، <strong>القهوة الجيدة وحدها لا تكفي</strong>. تحتاج استراتيجية تسويق تجذب الزبائن وتحولهم إلى سفراء لعلامتك التجارية.</p>
<h3>📸 إنستغرام — واجهة المقهى الرقمية</h3><p><strong>60% من الزبائن</strong> يكتشفون مقاهي جديدة عبر إنستغرام. إليك خطة النشر الأسبوعية:<br><strong>الاثنين:</strong> صورة لاتيه آرت (أعلى نسبة تفاعل)<br><strong>الأربعاء:</strong> فيديو قصير لتحضير مشروب (Reels — وصول أعلى 200%)<br><strong>الجمعة:</strong> صورة المقهى والأجواء (يجذب الزبائن للزيارة)<br><strong>السبت:</strong> قصة "وراء الكواليس" — فريق العمل يحمص أو يحضّر</p>
<h3>💳 برنامج الولاء — ليس مجرد بطاقة تثقيب</h3><p>برامج الولاء الرقمية (مثل Belly, Loyverse) تزيد مبيعاتك 20-40%. الفكرة: 10 نقاط = مشروب مجاني. النقطة = أي مشتريات بقيمة 10 جنيه. الزبون العائد هو أغلى زبون لديك — كلفة اكتساب زبون جديد 5 أضعاف الاحتفاظ بزبون موجود.</p>
<h3>🤝 التسويق المجتمعي</h3><p>• <strong>إيفينتات أسبوعية:</strong> ورش كابينج مجانية يوم الخميس — تجذب 10-15 شخصاً يتعلمون ويشترون قهوتك<br>• <strong>تحدّي اللاتيه آرت:</strong> مسابقة شهرية بين الزبائن — الجائزة: قهوة مجانية شهر<br>• <strong>تعاون مع محلات محلية:</strong> مخبز يقدم معجناتك — وأنت تقدم قهوته. خصم متبادل للزبائن</p>
<div class="err-box"><strong>❌ خطأ شائع:</strong> التركيز فقط على جذب زبائن جدد وإهمال الزبائن الحاليين. أسهل وأرخص بيع للزبون الموجود بدلاً من البحث عن زبون جديد. برنامج ولاء بسيط يحدث فرقاً كبيراً!</div>`, en:`<h3>📱 Marketing Your Cafe — From First Customer to Million Followers</h3><p>In today's market, <strong>good coffee alone isn't enough</strong>. You need a marketing strategy that attracts customers and turns them into brand ambassadors.</p>
<h3>📸 Instagram — The Cafe's Digital Front</h3><p><strong>60% of customers</strong> discover new cafes through Instagram. Weekly posting plan:<br><strong>Monday:</strong> Latte art photo (highest engagement)<br><strong>Wednesday:</strong> Short brew video (Reels — 200% more reach)<br><strong>Friday:</strong> Cafe atmosphere photo (drives visits)<br><strong>Saturday:</strong> Behind-the-scenes story — team roasting or prepping</p>
<h3>💳 Loyalty Program — Not Just a Punch Card</h3><p>Digital loyalty programs (Belly, Loyverse) increase sales 20-40%. Idea: 10 points = free drink. Points per $2 spent. A returning customer is your most valuable asset — acquiring a new customer costs 5x more than retaining an existing one.</p>
<h3>🤝 Community Marketing</h3><p>• <strong>Weekly events:</strong> Free cupping workshop Thursday — attracts 10-15 people who learn and buy your coffee<br>• <strong>Latte Art Challenge:</strong> Monthly customer competition — prize: free coffee for a month<br>• <strong>Local business collabs:</strong> Bakery sells your pastries — you serve their coffee. Mutual customer discounts</p>
<div class="err-box"><strong>❌ Common Mistake:</strong> Focusing only on new customers and ignoring existing ones. It's easier and cheaper to sell to an existing customer than find a new one. A simple loyalty program makes a huge difference!</div>`};

/* ===== Quizzes ===== */
const Q = {};
function qz(key, a, e){ Q[key] = {ar:a,en:e} }
qz('A1-1','💬 كم نوعاً من البن يسيطر على الإنتاج التجاري العالمي؟ (الإجابة: نوعان — أرابيكا 60-70% وروبوستا 30-40%)','💬 How many coffee species dominate global production? (Answer: Two — Arabica 60-70% and Robusta 30-40%)');
qz('A1-2','💬 أين افتتح أول مقهى في التاريخ؟ (الإجابة: مكة، أوائل القرن السادس عشر)','💬 Where was the first coffeehouse in history? (Answer: Mecca, early 16th century)');
qz('A2-0','💬 ما هي النسبة المثلى للاستخلاص حسب SCA؟ (الإجابة: 18-22%)','💬 What is the SCA optimal extraction yield? (Answer: 18-22%)');
qz('A2-1','💬 أي طريقة تحضير تنصح بها للمبتدئين؟ (الإجابة: V60 — الأبسط والأكثر تحكماً)','💬 Which brewing method do you recommend for beginners? (Answer: V60 — simplest and most controllable)');
qz('A2-3','💬 كم من الوقت تنتظر بعد صب الـ Bloom في تحضير V60؟ (الإجابة: 30 ثانية)','💬 How long do you wait after pouring the bloom in V60? (Answer: 30 seconds)');
qz('A3-1','💬 ما هي الحرارة المثالية لتسخين الحليب؟ (الإجابة: 55-65°م — أكثر من 70°م يحرق البروتينات)','💬 What is the ideal milk steaming temperature? (Answer: 55-65°C — above 70°C burns proteins)');
qz('A3-2','💬 ما هي نسبة الكابتشينو المثالية؟ (الإجابة: 1:1:1 — إسبريسو : حليب مبخر : رغوة)','💬 What is the ideal cappuccino ratio? (Answer: 1:1:1 — espresso : steamed milk : foam)');
qz('B1-1','💬 ماذا تعني RoR في التحميص؟ (الإجابة: Rate of Rise — معدل ارتفاع الحرارة بالدرجة في الدقيقة)','💬 What does RoR mean in roasting? (Answer: Rate of Rise — temperature increase rate in °C/min)');
qz('B1-2','💬 هل البن الفاتح يحتاج طحناً أدق أم أخشن؟ (الإجابة: أدق — لأنه أكثر كثافة)','💬 Does light roast need finer or coarser grind? (Answer: Finer — it\'s denser)');
qz('B2-0','💬 ما هو نطاق TDS المثالي للقهوة المقطرة حسب SCA؟ (الإجابة: 150-175 ppm)','💬 What is the ideal TDS range for drip coffee per SCA? (Answer: 150-175 ppm)');
qz('B2-1','💬 بأي جهاز يقاس TDS؟ (الإجابة: Refractometer — جهاز قياس الانكسار)','💬 What device measures TDS? (Answer: Refractometer)');
qz('B2-2','💬 ما هما النظامان الكافيان لمعالجة مياه المقاهي؟ (الإجابة: كربون نشط + تبادل أيوني)','💬 What two systems are sufficient for cafe water treatment? (Answer: Activated carbon + ion exchange)');
qz('B3-0','💬 ما هو مدى طحن الإسبريسو بالميكرون؟ (الإجابة: 200-350 ميكرون)','💬 What is the espresso grind range in microns? (Answer: 200-350 microns)');
qz('C1-0','💬 كم دقيقة تنتظر قبل تذوق القهوة بعد إضافة الماء في الكابينج؟ (الإجابة: 8-15 دقائق)','💬 How many minutes before tasting after adding water in cupping? (Answer: 8-15 minutes)');
qz('C1-2','💬 ما هي الدرجة التي تجعل البن Specialty Grade؟ (الإجابة: 80+ من 100)','💬 What score qualifies coffee as Specialty Grade? (Answer: 80+ out of 100)');
qz('C2-0','💬 كم تستغرق المعالجة الطبيعية من الوقت؟ (الإجابة: 2-4 أسابيع تحت الشمس)','💬 How long does natural processing take? (Answer: 2-4 weeks in the sun)');
qz('C2-1','💬 كم ساعة تخمير في المعالجة المغسولة؟ (الإجابة: 24-36 ساعة في الماء)','💬 How many hours of fermentation in washed processing? (Answer: 24-36 hours in water)');
qz('C2-2','💬 ما هي أنواع المعالجة بالعسل؟ (الإجابة: أصفر، أحمر، أسود — حسب كمية اللب المتروك)','💬 What are the types of honey processing? (Answer: Yellow, red, black — depending on mucilage amount)');
qz('C3-3','💬 كم مرة تنصح بعمل كابينج مع الفريق؟ (الإجابة: أسبوعياً)','💬 How often do you recommend cupping with the team? (Answer: Weekly)');

/* ===== Interactive Exam Questions ===== */
const EX = {
  A:[
    {q:{ar:'ما النوعان المسيطران على الإنتاج التجاري للبن؟',en:'Which two species dominate commercial coffee production?'},opts:[
      {ar:'أرابيكا وروبوستا',en:'Arabica & Robusta'},
      {ar:'أرابيكا وليبيريكا',en:'Arabica & Liberica'},
      {ar:'روبوستا وإكسلسا',en:'Robusta & Excelsa'},
      {ar:'أرابيكا فقط',en:'Arabica only'}
    ],ans:0},
    {q:{ar:'أين افتُتح أول مقهى في التاريخ؟',en:'Where was the first coffeehouse in history?'},opts:[
      {ar:'لندن',en:'London'},
      {ar:'مكة',en:'Mecca'},
      {ar:'باريس',en:'Paris'},
      {ar:'إسطنبول',en:'Istanbul'}
    ],ans:1},
    {q:{ar:'ما النسبة المثلى للاستخلاص حسب SCA؟',en:'What is the optimal extraction yield per SCA?'},opts:[
      {ar:'10-15%',en:'10-15%'},
      {ar:'18-22%',en:'18-22%'},
      {ar:'25-30%',en:'25-30%'},
      {ar:'30-35%',en:'30-35%'}
    ],ans:1},
    {q:{ar:'كم ثانية تنتظر بعد صب الـ Bloom في تحضير V60؟',en:'How many seconds after the bloom pour in V60?'},opts:[
      {ar:'15 ثانية',en:'15 seconds'},
      {ar:'20 ثانية',en:'20 seconds'},
      {ar:'30 ثانية',en:'30 seconds'},
      {ar:'45 ثانية',en:'45 seconds'}
    ],ans:2},
    {q:{ar:'ما درجة حرارة تسخين الحليب المثالية؟',en:'What is the ideal milk steaming temperature?'},opts:[
      {ar:'40-50°م',en:'40-50°C'},
      {ar:'55-65°م',en:'55-65°C'},
      {ar:'70-80°م',en:'70-80°C'},
      {ar:'85-95°م',en:'85-95°C'}
    ],ans:1},
    {q:{ar:'ما نسبة الكابتشينو المثالية؟',en:'What is the ideal cappuccino ratio?'},opts:[
      {ar:'1:1:1 (إسبريسو:حليب:رغوة)',en:'1:1:1 (espresso:milk:foam)'},
      {ar:'1:2:1',en:'1:2:1'},
      {ar:'2:1:1',en:'2:1:1'},
      {ar:'1:1:2',en:'1:1:2'}
    ],ans:0},
    {q:{ar:'كم نوعاً من البن يسيطر على الإنتاج العالمي؟',en:'How many coffee species dominate world production?'},opts:[
      {ar:'نوع واحد',en:'One'},
      {ar:'نوعان',en:'Two'},
      {ar:'ثلاثة أنواع',en:'Three'},
      {ar:'أربعة أنواع',en:'Four'}
    ],ans:1},
    {q:{ar:'أي طبقة من ثمرة القهوة تتحول إلى Chaff أثناء التحميص؟',en:'Which layer becomes chaff during roasting?'},opts:[
      {ar:'القشرة الخارجية (Exocarp)',en:'Exocarp'},
      {ar:'اللب (Mucilage)',en:'Mucilage'},
      {ar:'الغشاء الفضي (Silver Skin)',en:'Silver Skin'},
      {ar:'البذرة (Endosperm)',en:'Endosperm'}
    ],ans:2},
    {q:{ar:'أي طريقة تحضير تنصح بها للمبتدئين؟',en:'Which brewing method for beginners?'},opts:[
      {ar:'إسبريسو',en:'Espresso'},
      {ar:'V60',en:'V60'},
      {ar:'Aeropress',en:'Aeropress'},
      {ar:'فرنش بريس',en:'French Press'}
    ],ans:1},
    {q:{ar:'من أين اشتق اسم "Coffee"؟',en:'Where does the word "Coffee" derive from?'},opts:[
      {ar:'اللاتينية',en:'Latin'},
      {ar:'الإيطالية',en:'Italian'},
      {ar:'العربية',en:'Arabic'},
      {ar:'الإثيوبية',en:'Ethiopian'}
    ],ans:2}
  ],
  B:[
    {q:{ar:'ماذا تعني RoR في التحميص؟',en:'What does RoR mean in roasting?'},opts:[
      {ar:'Rate of Rise — معدل ارتفاع الحرارة',en:'Rate of Rise'},
      {ar:'Roast on Request',en:'Roast on Request'},
      {ar:'Ratio of Roast',en:'Ratio of Roast'},
      {ar:'Return of Roast',en:'Return of Roast'}
    ],ans:0},
    {q:{ar:'البن الفاتح يحتاج طحناً...',en:'Light roast needs... grind'},opts:[
      {ar:'أدق (أكثر نعومة)',en:'Finer'},
      {ar:'أخشن',en:'Coarser'},
      {ar:'نفس درجة الطحن',en:'Same as dark'},
      {ar:'متوسط',en:'Medium'}
    ],ans:0},
    {q:{ar:'ما نطاق TDS المثالي للقهوة المقطرة حسب SCA؟',en:'Ideal TDS range for drip coffee per SCA?'},opts:[
      {ar:'50-100 ppm',en:'50-100 ppm'},
      {ar:'150-175 ppm',en:'150-175 ppm'},
      {ar:'200-250 ppm',en:'200-250 ppm'},
      {ar:'300-400 ppm',en:'300-400 ppm'}
    ],ans:1},
    {q:{ar:'بأي جهاز يقاس TDS؟',en:'What device measures TDS?'},opts:[
      {ar:'ميزان حرارة',en:'Thermometer'},
      {ar:'مقياس انكسار (Refractometer)',en:'Refractometer'},
      {ar:'مقياس pH',en:'pH meter'},
      {ar:'مقياس تدفق',en:'Flow meter'}
    ],ans:1},
    {q:{ar:'ما مدى طحن الإسبريسو بالميكرون؟',en:'Espresso grind range in microns?'},opts:[
      {ar:'50-100 ميكرون',en:'50-100 microns'},
      {ar:'200-350 ميكرون',en:'200-350 microns'},
      {ar:'400-600 ميكرون',en:'400-600 microns'},
      {ar:'700-1000 ميكرون',en:'700-1000 microns'}
    ],ans:1},
    {q:{ar:'ما النظامان الأساسيان لمعالجة مياه المقاهي؟',en:'Two essential cafe water treatments?'},opts:[
      {ar:'غلي + تبريد',en:'Boiling + Cooling'},
      {ar:'كربون نشط + تبادل أيوني',en:'Activated carbon + Ion exchange'},
      {ar:'تقطير + فلترة',en:'Distillation + Filtration'},
      {ar:'أوزون + كلور',en:'Ozone + Chlorine'}
    ],ans:1},
    {q:{ar:'ما تأثير درجة الطحن على زمن الاستخلاص؟',en:'How does grind size affect extraction time?'},opts:[
      {ar:'طحن أدق = زمن أقصر',en:'Finer = shorter time'},
      {ar:'طحن أدق = زمن أطول',en:'Finer = longer time'},
      {ar:'لا تأثير',en:'No effect'},
      {ar:'يعتمد على القهوة فقط',en:'Depends only on coffee'}
    ],ans:1},
    {q:{ar:'ما درجة حرارة الماء المثالية للتحضير المقطر؟',en:'Ideal water temp for pour-over?'},opts:[
      {ar:'80-85°م',en:'80-85°C'},
      {ar:'90-96°م',en:'90-96°C'},
      {ar:'70-75°م',en:'70-75°C'},
      {ar:'100°م',en:'100°C'}
    ],ans:1},
    {q:{ar:'ما النسبة المثالية للقهوة إلى الماء؟',en:'Ideal coffee-to-water ratio?'},opts:[
      {ar:'1:10',en:'1:10'},
      {ar:'1:12',en:'1:12'},
      {ar:'1:16',en:'1:16'},
      {ar:'1:20',en:'1:20'}
    ],ans:2},
    {q:{ar:'ماذا تعني كلمة Q Grader؟',en:'What is a Q Grader?'},opts:[
      {ar:'محمص قهوة محترف',en:'Professional roaster'},
      {ar:'مُقيم قهوة معتمد',en:'Certified coffee taster'},
      {ar:'باريستا محترف',en:'Professional barista'},
      {ar:'مزارع بن',en:'Coffee farmer'}
    ],ans:1}
  ],
  C:[
    {q:{ar:'كم دقيقة تنتظر قبل تذوق القهوة بعد إضافة الماء في الكابينج؟',en:'Minutes to wait before tasting in cupping?'},opts:[
      {ar:'2-4 دقائق',en:'2-4 minutes'},
      {ar:'8-15 دقائق',en:'8-15 minutes'},
      {ar:'20-30 دقيقة',en:'20-30 minutes'},
      {ar:'ساعة',en:'1 hour'}
    ],ans:1},
    {q:{ar:'ما الدرجة التي تجعل البن Specialty Grade؟',en:'Score that qualifies Specialty Grade?'},opts:[
      {ar:'70+',en:'70+'},
      {ar:'75+',en:'75+'},
      {ar:'80+',en:'80+'},
      {ar:'90+',en:'90+'}
    ],ans:2},
    {q:{ar:'كم تستغرق المعالجة الطبيعية؟',en:'How long does natural processing take?'},opts:[
      {ar:'3-5 أيام',en:'3-5 days'},
      {ar:'1 أسبوع',en:'1 week'},
      {ar:'2-4 أسابيع',en:'2-4 weeks'},
      {ar:'2-3 أشهر',en:'2-3 months'}
    ],ans:2},
    {q:{ar:'كم ساعة تخمير في المعالجة المغسولة؟',en:'Fermentation hours in washed processing?'},opts:[
      {ar:'6-12 ساعة',en:'6-12 hours'},
      {ar:'12-18 ساعة',en:'12-18 hours'},
      {ar:'24-36 ساعة',en:'24-36 hours'},
      {ar:'48-72 ساعة',en:'48-72 hours'}
    ],ans:2},
    {q:{ar:'ما أنواع المعالجة بالعسل؟',en:'Types of honey processing?'},opts:[
      {ar:'أخضر، بني، أسود',en:'Green, brown, black'},
      {ar:'أصفر، أحمر، أسود',en:'Yellow, red, black'},
      {ar:'أبيض، أصفر، أحمر',en:'White, yellow, red'},
      {ar:'ذهبي، فضي، برونزي',en:'Gold, silver, bronze'}
    ],ans:1},
    {q:{ar:'كم مرة تنصح بعمل كابينج مع الفريق؟',en:'How often to cup with the team?'},opts:[
      {ar:'شهرياً',en:'Monthly'},
      {ar:'أسبوعياً',en:'Weekly'},
      {ar:'يومياً',en:'Daily'},
      {ar:'ربع سنوي',en:'Quarterly'}
    ],ans:1},
    {q:{ar:'ما هو نطاق الرطوبة المثالي لتخزين البن الأخضر؟',en:'Ideal humidity for green bean storage?'},opts:[
      {ar:'أقل من 40%',en:'Below 40%'},
      {ar:'أقل من 60%',en:'Below 60%'},
      {ar:'60-80%',en:'60-80%'},
      {ar:'80-100%',en:'80-100%'}
    ],ans:1},
    {q:{ar:'ما الهدف من مرحلة Degassing بعد التحميص؟',en:'Purpose of degassing after roasting?'},opts:[
      {ar:'تبريد البن',en:'Cool the beans'},
      {ar:'إطلاق غاز ثاني أكسيد الكربون',en:'Release CO2'},
      {ar:'إضافة نكهة',en:'Add flavor'},
      {ar:'ترطيب البن',en:'Moisten beans'}
    ],ans:1},
    {q:{ar:'ما هي أكسيداز الكلوروجينيك (CGA) في القهوة؟',en:'What is Chlorogenic Acid (CGA) in coffee?'},opts:[
      {ar:'مُحلي طبيعي',en:'Natural sweetener'},
      {ar:'مضاد أكسدة',en:'Antioxidant'},
      {ar:'نوع من الكافيين',en:'Type of caffeine'},
      {ar:'صبغة تلوين',en:'Food coloring'}
    ],ans:1},
    {q:{ar:'من اخترع أول محمصة أسطوانية تجارية؟',en:'Who invented the first commercial drum roaster?'},opts:[
      {ar:'لويجي بزيرا',en:'Luigi Bezzera'},
      {ar:'جابيز بورنز',en:'Jabez Burns'},
      {ar:'أكيلي جاجيا',en:'Achille Gaggia'},
      {ar:'كلد',en:'Kaldi'}
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
str('A1','<div class="story-box"><h4>📜 قصة كلد واكتشاف القهوة</h4><p>عام 850م في مرتفعات <strong>كافا</strong> الإثيوبية، لاحظ الراعي <strong>كلد (Kaldi)</strong> أغنامه تقفز بنشاط غريب بعد أكل ثمار حمراء. جربها بنفسه وشعر بانتعاش لم يعهده. أخذها لدير قريب، واكتشف الرهبان أنها تساعدهم على السهر في الصلاة. من هنا بدأت رحلة القهوة مع البشرية — لأكثر من 1000 عام.</p><div class="story-src">📖 المصدر: الأسطورة الإثيوبية، وردت في "De Plantis Aegypti" (1592) للطبيب بروسبيرو ألبيني</div></div>','<div class="story-box"><h4>📜 Kaldi and the Discovery of Coffee</h4><p>In 850 AD in the highlands of <strong>Kaffa</strong>, Ethiopia, goat herder <strong>Kaldi</strong> noticed his goats jumping with unusual energy after eating red berries. He tried them himself and felt a refreshing alertness. He took them to a nearby monastery, where monks discovered the berries helped them stay awake during night prayers. Thus began coffee\'s 1,000+ year journey with humanity.</p><div class="story-src">📖 Source: Ethiopian legend, recorded in "De Plantis Aegypti" (1592) by physician Prospero Alpini</div></div>');
str('A2','<div class="story-box"><h4>📜 أول فنجان قهوة في التاريخ</h4><p>في اليمن القرن الخامس عشر، كانت القهوة تُحضّر بغلي البن المطحون مع الماء والسكر والبهارات في <strong>"الإبريق"</strong>. هذه الطريقة — التي نعرفها اليوم كـ"القهوة التركية" — كانت أول تقنية تحضير. انتقلت من اليمن إلى مكة، القاهرة، إسطنبول، حيث أصبح إعداد القهوة فناً له طقوسه.</p><div class="story-src">📖 المصدر: "القهوة والقهاوي" للعلامة عبد القادر الجزيري (1558) — أقدم مخطوطة عن القهوة</div></div>','<div class="story-box"><h4>📜 The First Cup of Coffee in History</h4><p>In 15th century Yemen, coffee was prepared by boiling ground beans with water, sugar and spices in an <strong>"Ibrik"</strong>. This method — known today as "Turkish Coffee" — was history\'s first brewing technique. It spread from Yemen to Mecca, Cairo, and Istanbul, where coffee preparation became an art with its own rituals.</p><div class="story-src">📖 Source: "Coffee and Coffeehouses" by Abd al-Qadir al-Jaziri (1558)</div></div>');
str('A3','<div class="story-box"><h4>📜 ثورة الإسبريسو — من البخار إلى الكريما</h4><p>عام 1901، حصل <strong>لويجي بزيرا</strong> على براءة اختراع أول ماكينة قهوة بضغط البخار. لكن الثورة الحقيقية كانت 1946 عندما اخترع <strong>أكيلي جاجيا</strong> نظام الرافعة الذي يولد 9 بار — منتجاً <strong>أول كريما</strong> في تاريخ القهوة. قبل جاجيا، كان الإسبريسو مجرد سائل بني.</p><div class="story-src">📖 المصدر: براءة اختراع إيطالية رقم 139/601 (1946) — Achille Gaggia</div></div>','<div class="story-box"><h4>📜 The Espresso Revolution — From Steam to Crema</h4><p>In 1901, <strong>Luigi Bezzera</strong> patented the first steam-pressure coffee machine. The real revolution came in 1946 when <strong>Achille Gaggia</strong> invented the lever system generating 9 bars — producing the <strong>first crema</strong> in coffee history. Before Gaggia, espresso was just brown liquid.</p><div class="story-src">📖 Source: Italian Patent No. 139/601 (1946) — Achille Gaggia</div></div>');
str('B1','<div class="story-box"><h4>📜 تطور تحميص القهوة</h4><p>بدأ التحميص في القرن 15 على النار المكشوفة بأوعية فخارية يمنية. أول محمصة تجارية ظهرت في إسطنبول القرن 17. عام 1864، اخترع <strong>جابيز بورنز</strong> في نيويورك أول محمصة أسطوانية — التصميم المستخدم حتى اليوم.</p><div class="story-src">📖 المصدر: James Boyce, "The Coffee Roasting Industry" (1840)</div></div>','<div class="story-box"><h4>📜 The Evolution of Coffee Roasting</h4><p>Roasting began in the 15th century over open fires using Yemeni clay pans. The first commercial roaster appeared in 17th century Istanbul. In 1864, <strong>Jabez Burns</strong> in New York invented the first commercial drum roaster — the design still used today.</p><div class="story-src">📖 Source: James Boyce, "The Coffee Roasting Industry" (1840)</div></div>');
str('B2','<div class="story-box"><h4>📜 الماء — سر القهوة الخفي</h4><p>في لندن 1660، اكتشف أصحاب المقاهي أن الماء من آبار مختلفة ينتج قهوة مختلفة جذرياً. أول ملاحظة مسجلة عن تأثير كيمياء الماء على القهوة. يقول المثل: "القهوة الجيدة 99% ماء".</p><div class="story-src">📖 المصدر: مذكرات Samuel Pepys (1663)</div></div>','<div class="story-box"><h4>📜 Water — Coffee\'s Hidden Secret</h4><p>In 1660s London, coffeehouse owners discovered water from different wells produced dramatically different coffee. The first recorded observation of water chemistry\'s effect on coffee. The saying goes: "Good coffee is 99% water."</p><div class="story-src">📖 Source: Samuel Pepys\' Diary (1663)</div></div>');
str('B3','<div class="story-box"><h4>📜 الموجة الثالثة — القهوة كعلم</h4><p>في التسعينيات، بدأت الموجة الثالثة مع محمصين يعاملون القهوة كمنتج حرفي. دخلت أجهزة القياس ومنحنيات الاستخلاص وعلم الجودة للقهوة لأول مرة. الباريستا أصبح عالماً وتقنياً.</p><div class="story-src">📖 المصدر: Trish Rothgeb, "The Third Wave of Coffee" (2002)</div></div>','<div class="story-box"><h4>📜 The Third Wave — Coffee as Science</h4><p>In the 1990s, the Third Wave began with roasters treating coffee as artisan product. Refractometers, extraction curves, and quality science entered coffee culture. The barista became a scientist.</p><div class="story-src">📖 Source: Trish Rothgeb, "The Third Wave of Coffee" (2002)</div></div>');
str('C1','<div class="story-box"><h4>📜 فن التقييم الحسي — من التاجر إلى العالم</h4><p>الكابينج بدأ في القرن 19 مع تجار احتاجوا طريقة متسقة لتقييم الجودة. أول بروتوكول رسمي ظهر في الخمسينيات. عام 2000، نشرت SCA أول استمارة كابينج موحدة — المستخدمة عالمياً اليوم.</p><div class="story-src">📖 المصدر: SCAA Cupping Protocol (2000)</div></div>','<div class="story-box"><h4>📜 Sensory Evaluation — From Trader to Scientist</h4><p>Cupping began in the 19th century with traders needing consistent quality evaluation. The first formal protocol emerged in the 1950s. In 2000, SCA published the first standardized cupping form — used worldwide today.</p><div class="story-src">📖 Source: SCAA Cupping Protocol (2000)</div></div>');
str('C2','<div class="story-box"><h4>📜 500 عام من الابتكار في معالجة البن</h4><p>المعالجة الطبيعية أقدم طريقة — دون تغيير منذ قرون في إثيوبيا. المغسولة اخترعها الهولنديون في جاوة القرن 18. المعالجة بالعسل بدأت في كوستاريكا الثمانينيات. كل طريقة تحكي قصة مناخ وثقافة.</p><div class="story-src">📖 المصدر: William H. Ukers, "All About Coffee" (1922)</div></div>','<div class="story-box"><h4>📜 500 Years of Processing Innovation</h4><p>Natural processing is oldest — unchanged for centuries in Ethiopia. Washed was invented by Dutch in 18th century Java. Honey processing began in 1980s Costa Rica. Each method tells a story of climate and culture.</p><div class="story-src">📖 Source: William H. Ukers, "All About Coffee" (1922)</div></div>');
str('C3','<div class="story-box"><h4>📜 المقاهي — مدارس الحكمة</h4><p>أول مقهى في مكة أوائل القرن 16، ثم القاهرة، إسطنبول، أكسفورد. في لندن سُميت "Penny Universities" — ببنس واحد تسمع أعظم العقول. أنت اليوم تحافظ على تقليد عمره 500 عام.</p><div class="story-src">📖 المصدر: Markman Ellis, "The Coffee-House: A Cultural History" (2004)</div></div>','<div class="story-box"><h4>📜 Coffeehouses — Schools of Wisdom</h4><p>First coffeehouse in Mecca early 1500s, then Cairo, Istanbul, Oxford. In London they were "Penny Universities" — for a penny you heard the greatest minds. Today you continue a 500-year tradition.</p><div class="story-src">📖 Source: Markman Ellis, "The Coffee-House: A Cultural History" (2004)</div></div>');

/* ===== Render Functions ===== */

const CM = [
  {id:'A1',level:'A',title:{ar:'اكتشاف القهوة وأصولها',en:'Coffee Discovery & Origins'},icon:'🌍',desc:{ar:'تاريخ، تصنيف، تشريح',en:'History, Classification, Anatomy'},img:imgPath('A1'),lessons:[
    {title:{ar:'قهوة مختصة vs تجارية + قصة الاكتشاف',en:'Specialty vs Commercial + Discovery Story'},img:imgPath('A1')},
    {title:{ar:'البن العربي — التصنيف النباتي',en:'Arabica — Botanical Classification'},img:imgPath('cherry')},
    {title:{ar:'انتشار القهوة حول العالم',en:'Coffee Spread Around the World'},img:imgPath('map')},
    {title:{ar:'تشريح حبة البن',en:'Anatomy of the Coffee Bean'},img:imgPath('beans')},
    {title:{ar:'القهوة في الثقافة والدين',en:'Coffee in Culture & Religion'},img:imgPath('A1')}
  ]},
  {id:'A2',level:'A',title:{ar:'أساسيات التحضير',en:'Brewing Fundamentals'},icon:'⚗️',desc:{ar:'علم الاستخلاص',en:'Extraction Science'},img:imgPath('A2'),lessons:[
    {title:{ar:'فيزياء وكيمياء الاستخلاص',en:'Physics & Chemistry of Extraction'},img:imgPath('A2')},
    {title:{ar:'المعدات والأدوات',en:'Equipment & Tools'},img:imgPath('barista')},
    {title:{ar:'المقاييس والنسب الذهبية',en:'Golden Ratios'},img:imgPath('v60')},
    {title:{ar:'تحضير V60',en:'V60 Brewing'},img:imgPath('v60')},
    {title:{ar:'القهوة الباردة وطرقها',en:'Cold Brew & Iced Coffee'},img:imgPath('coldbrew')}
  ]},
{id:'A3',level:'A',title:{ar:'مشروبات الإسبريسو',en:'Espresso Drinks'},icon:'☕',desc:{ar:'من الإسبريسو إلى اللاتيه',en:'From Espresso to Latte'},img:imgPath('A3'),lessons:[
    {title:{ar:'ما هو الإسبريسو؟',en:'What is Espresso?'},img:imgPath('espresso')},
    {title:{ar:'لاتيه — فن الحليب',en:'Latte — The Art of Milk'},img:imgPath('latte')},
    {title:{ar:'كابتشينو وموكا',en:'Cappuccino & Mocha'},img:imgPath('A3')},
    {title:{ar:'ماكياتو, أفوجاتو, فلات وايت',en:'Macchiato, Affogato & Flat White'},img:imgPath('latte')},
    {title:{ar:'أساسيات اللاتيه أرت',en:'Latte Art Basics'},img:imgPath('latte')},
    {title:{ar:'صيانة آلة الإسبريسو',en:'Espresso Machine Maintenance'},img:imgPath('barista')}
]},
{id:'B1',level:'B',title:{ar:'أسرار التحميص',en:'Roasting Secrets'},icon:'🔥',desc:{ar:'من الأخضر إلى المحمص',en:'Green to Brown'},img:imgPath('B1'),lessons:[
    {title:{ar:'كيمياء التحميص',en:'Roasting Chemistry'},img:imgPath('roast')},
    {title:{ar:'منحنيات التحميص',en:'Roast Curves'},img:imgPath('roast')},
    {title:{ar:'التحميص والاستخلاص',en:'Roast & Extraction'},img:imgPath('B1')},
    {title:{ar:'تحميص حسب المنشأ',en:'Origin-Specific Roasting'},img:imgPath('beans')},
    {title:{ar:'دليل معدات التحميص',en:'Roasting Equipment Guide'},img:imgPath('B1')},
    {title:{ar:'حرفي أم تجاري',en:'Artisan vs Commercial'},img:imgPath('cafe')}
]},
  {id:'B2',level:'B',title:{ar:'علم الماء',en:'Water Science'},icon:'💧',desc:{ar:'جودة الماء',en:'Water Quality'},img:imgPath('B2'),lessons:[
    {title:{ar:'كيمياء الماء',en:'Water Chemistry'},img:imgPath('water')},
    {title:{ar:'قياس TDS',en:'TDS Measurement'},img:imgPath('water')},
    {title:{ar:'معالجة المياه',en:'Water Treatment'},img:imgPath('water')},
    {title:{ar:'وصفات الماء المثالية',en:'DIY Water Recipes'},img:imgPath('B2')},
    {title:{ar:'عسر الماء وتأثيره',en:'Water Hardness Impact'},img:imgPath('water')},
    {title:{ar:'الماء المثالي لكل طريقة',en:'Water per Brew Method'},img:imgPath('v60')}
  ]},
{id:'B3',level:'B',title:{ar:'متغيرات التحضير',en:'Advanced Brewing'},icon:'⚙️',desc:{ar:'الطحن والاستخلاص',en:'Grinding & Extraction'},img:imgPath('B3'),lessons:[
    {title:{ar:'توزيع حجم الطحن',en:'Particle Size Distribution'},img:imgPath('B3')},
    {title:{ar:'الاستخلاص المتقدم',en:'Advanced Extraction'},img:imgPath('barista')},
    {title:{ar:'تحسين جودة الفنجان',en:'Cup Quality'},img:imgPath('cupping')},
    {title:{ar:'تحضير الكميات الكبيرة',en:'Batch Brew & High Volume'},img:imgPath('cafe')},
    {title:{ar:'أنواع الطواحين',en:'Grinder Burr Types'},img:imgPath('B3')},
    {title:{ar:'الـ Dialing In المنهجي',en:'Systematic Dialing In'},img:imgPath('barista')}
]},
{id:'C1',level:'C',title:{ar:'التقييم الحسي',en:'Sensory Science'},icon:'👃',desc:{ar:'تذوق وتحليل',en:'Taste & Analyze'},img:imgPath('C1'),lessons:[
    {title:{ar:'الكابينج',en:'Cupping'},img:imgPath('cupping')},
    {title:{ar:'مصفوفة النكهات',en:'Flavor Wheel'},img:imgPath('C1')},
    {title:{ar:'بروتوكول SCA',en:'SCA Protocol'},img:imgPath('cupping')},
    {title:{ar:'عيوب القهوة وتشخيصها',en:'Coffee Defects & Diagnosis'},img:imgPath('beans')},
    {title:{ar:'التحليل الحسي',en:'Sensory Analysis'},img:imgPath('C1')},
    {title:{ar:'حلول عيوب القهوة',en:'Defects Solutions'},img:imgPath('cupping')}
]},
{id:'C2',level:'C',title:{ar:'معالجة البن',en:'Coffee Processing'},icon:'🫘',desc:{ar:'طرق المعالجة',en:'Processing Methods'},img:imgPath('C2'),lessons:[
    {title:{ar:'طبيعية',en:'Natural'},img:imgPath('cherry')},
    {title:{ar:'مغسولة',en:'Washed'},img:imgPath('C2')},
    {title:{ar:'عسل وتجريبية',en:'Honey & Experimental'},img:imgPath('beans')},
    {title:{ar:'تخزين البن ونضارته',en:'Storage & Freshness'},img:imgPath('C2')},
    {title:{ar:'المعالجة التجريبية',en:'Experimental Processing'},img:imgPath('cherry')},
    {title:{ar:'المعالجة والنكهة',en:'Processing & Flavor'},img:imgPath('cupping')}
]},
  {id:'C3',level:'C',title:{ar:'إدارة المقهى',en:'Cafe Management'},icon:'🏪',desc:{ar:'من الباريستا إلى صاحب المقهى',en:'Barista to Owner'},img:imgPath('C3'),lessons:[
    {title:{ar:'تخطيط المقهى',en:'Cafe Planning'},img:imgPath('map')},
    {title:{ar:'التكاليف والأرباح',en:'Cost & Profit'},img:imgPath('cafe')},
    {title:{ar:'خدمة العملاء',en:'Customer Service'},img:imgPath('team')},
    {title:{ar:'تطوير الفريق',en:'Team Development'},img:imgPath('team')},
    {title:{ar:'تسويق المقهى',en:'Marketing Your Cafe'},img:imgPath('cafe')}
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
    {id:'home',ic:'🏠',ar:'الرئيسية',en:'Home'},
    {id:'curriculum',ic:'📚',ar:'المنهج',en:'Curriculum'},
    {id:'journey',ic:'☕',ar:'رحلة القهوة',en:'Coffee Journey'},
    {id:'exams',ic:'📝',ar:'الاختبارات',en:'Exams'},
    {id:'profile',ic:'⭐',ar:'ملفي',en:'Profile'},
    ...(isAdm?[{id:'admin',ic:'⚙️',ar:'الإدارة',en:'Admin'}]:[])
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
    setTimeout(initUI,100);
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
    '<div class="user-progress-stats"><div class="ups-item"><span class="ups-n">'+(u.completedLessons||[]).length+'</span><span class="ups-l">'+__({ar:'دروس',en:'Les'})+'</span></div>'+
    '<div class="ups-item"><span class="ups-n">'+(u.badges||[]).length+'</span><span class="ups-l">'+__({ar:'وسام',en:'Badges'})+'</span></div>'+
    '<div class="ups-item"><span class="ups-n">🔥'+(u.streak||0)+'</span><span class="ups-l">'+__({ar:'أيام',en:'Days'})+'</span></div></div></div>';
}
function sHome(){
  let totalLessons = CM.reduce((s,m)=>s+m.lessons.length,0);
  return userGreeting() + '<div class="hero glow-gold gradient-border"><div class="hero-glow"></div><h2>' + __({ar:'أكاديمية الأيادي البيضاء',en:'White Hands Academy'}) + '</h2><div class="gold-divider"></div><p>' + __({ar:'نرتقي بفن القهوة من البداية إلى الاحتراف — تدريب معتمد وفق معايير SCA العالمية',en:'Elevating coffee artistry from start to mastery — SCA-aligned certified training'}) + '</p></div><div class="jrny-cta glass-gold gradient-border" data-nav="journey" style="cursor:pointer;margin-bottom:32px;padding:28px 24px;border-radius:var(--radius-lg);text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px;transition:all .4s" onclick="rT(\'journey\')"><span style="font-size:3rem">☕</span><h3 style="font-family:var(--font-display);font-size:1.3rem">' + __({ar:'🌍 رحلة القهوة',en:'🌍 Coffee Journey'}) + '</h3><p style="color:var(--text-muted);font-size:.85rem;max-width:500px">' + __({ar:'قصة القهوة عبر 1200 عام — من أساطير إثيوبيا إلى أكاديمية الأيادي البيضاء',en:'The story of coffee across 1200 years — from Ethiopian legends to White Hands Academy'}) + '</p><span class="btn btn-accent magnetic-btn" style="margin-top:4px">' + __({ar:'ابدأ الرحلة 🚀',en:'Start the Journey 🚀'}) + '</span></div><div class="stats"><div class="stat-card glass"><div class="num stat-glow">3</div><div class="lbl">' + __({ar:'مستويات',en:'Levels'}) + '</div></div><div class="stat-card glass"><div class="num stat-glow">9</div><div class="lbl">' + __({ar:'وحدات',en:'Modules'}) + '</div></div><div class="stat-card glass"><div class="num stat-glow">' + totalLessons + '</div><div class="lbl">' + __({ar:'درس',en:'Lessons'}) + '</div></div><div class="stat-card glass"><div class="num stat-glow">SCA</div><div class="lbl">' + __({ar:'معتمد',en:'Certified'}) + '</div></div></div><div class="gold-divider" style="width:200px;margin:32px auto"></div><h2 class="sec-title">' + __({ar:'مسارات التعلم',en:'Learning Paths'}) + '</h2><p class="sec-sub">' + __({ar:'اختر مستواك وابدأ رحلتك في عالم القهوة',en:'Choose your level and start your coffee journey'}) + '</p><div class="grid-3">' + Object.keys(LV).map(k=>{
    let lv=LV[k],mods=CM.filter(m=>m.level===k),tl=mods.reduce((s,m)=>s+m.lessons.length,0);
    return '<div class="card lvl-card tilt-card" data-nav="sModules" data-level="'+k+'"><div class="tilt-inner"><div class="tilt-glare"></div><span class="lvl-ic">' + lv.ic + '</span><h3>' + __(lv.name) + '</h3><div class="lvl-sub">' + __(lv.desc) + '</div><div class="lvl-stats"><div><div class="n">' + mods.length + '</div><div class="l">' + __({ar:'وحدات',en:'Mods'}) + '</div></div><div><div class="n">' + tl + '</div><div class="l">' + __({ar:'دروس',en:'Les'}) + '</div></div></div></div></div>';
  }).join('') + '</div>';
}

function sCurriculum(){
  let u = getCurUser();
  return '<h2 class="sec-title">' + __({ar:'📚 المنهج الدراسي',en:'📚 Curriculum'}) + '</h2><p class="sec-sub">' + __({ar:'اختر مستواك لاستعراض الوحدات والدروس',en:'Choose your level to browse modules and lessons'}) + '</p><div class="grid-3">' + Object.keys(LV).map(k=>{
    let lv=LV[k],mods=CM.filter(m=>m.level===k),tl=mods.reduce((s,m)=>s+m.lessons.length,0);
    let doneT = u ? mods.reduce((s,m,mi2)=>s+m.lessons.filter((_,i)=>isLessonDone(u,k,mi2,i)).length,0) : 0;
    let pct = tl > 0 ? Math.round(doneT/tl*100) : 0;
    return '<div class="card lvl-card tilt-card" data-nav="sModules" data-level="'+k+'"><div class="tilt-inner"><div class="tilt-glare"></div><div class="lvl-glow" style="--glow-c:'+(k==='A'?'rgba(76,175,80,.08)':k==='B'?'rgba(255,152,0,.08)':'rgba(156,39,176,.08)')+'"></div><span class="lvl-ic">' + lv.ic + '</span><h3>' + __(lv.name) + '</h3><div class="lvl-sub">' + __(lv.desc) + '</div><div class="lvl-bar"><div class="lvl-bar-fill" style="width:'+pct+'%"></div></div><div class="lvl-stats"><div><div class="n">' + mods.length + '</div><div class="l">' + __({ar:'وحدات',en:'Mods'}) + '</div></div><div><div class="n">' + tl + '</div><div class="l">' + __({ar:'دروس',en:'Les'}) + '</div></div><div><div class="n">' + pct + '%</div><div class="l">' + __({ar:'مكتمل',en:'Done'}) + '</div></div></div></div></div>';
  }).join('') + '</div>';
}

function sModules(level){
  let lv = LV[level], mods = CM.filter(m => m.level === level);
  let u = getCurUser();
  let h = '<button class="btn btn-sm btn-ghost magnetic-btn" data-nav="curriculum" style="margin-bottom:14px">⬅ ' + __({ar:'العودة للمستويات',en:'Back to Levels'}) + '</button>';
  h += '<h2 class="sec-title" style="font-size:1.4rem">' + lv.ic + ' ' + __(lv.name) + ' — ' + __({ar:'الوحدات',en:'Modules'}) + '</h2><div class="grid-3">';
  h += mods.map((m,mi) => {
    let totalL = m.lessons.length;
    let doneL = (u ? m.lessons.filter((_,i)=>isLessonDone(u,level,mi,i)).length : 0);
    let pct = totalL > 0 ? Math.round(doneL/totalL*100) : 0;
    let circ = 2*Math.PI*19;
    let off = circ - (pct/100)*circ;
    let allDone = doneL === totalL && totalL > 0;
    let ringCl = allDone ? 'complete' : '';
    return '<div class="card mod-card tilt-card" data-nav="sModule" data-level="'+level+'" data-mi="'+mi+'"><div class="tilt-inner"><div class="tilt-glare"></div><div class="card-img"><div class="card-bg" style="background-image:url('+m.img+')"></div><div class="card-ov"></div><div class="card-ic">' + m.icon + '</div><h3>' + __(m.title) + '</h3><div class="ls-count">' + doneL + '/' + totalL + ' ' + __({ar:'دروس',en:'les'}) + '</div></div><div class="card-body"><p>' + __(m.desc) + '</p><div class="meta"><div><div class="n">' + totalL + '</div><div class="l">' + __({ar:'دروس',en:'Lessons'}) + '</div></div></div>' +
    '<div class="mod-prog-ring ' + ringCl + '"><svg viewBox="0 0 44 44"><circle class="track" cx="22" cy="22" r="19"/><circle class="fill" cx="22" cy="22" r="19" stroke-dasharray="' + circ + '" stroke-dashoffset="' + off + '"/></svg><span class="pct">' + pct + '%</span><span class="check">✓</span></div>' +
    '</div></div></div>';
  }).join('') + '</div>';
  $('root').innerHTML = h;
  setTimeout(initUI,100);
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
    '<button class="btn btn-sm btn-ghost" data-nav="sModules" data-level="'+level+'">⬅ ' + __({ar:'الوحدات',en:'Modules'}) + '</button>' +
    '<div class="ls-ring"><svg viewBox="0 0 28 28"><circle class="ls-rt" cx="14" cy="14" r="12"/><circle class="ls-rf" cx="14" cy="14" r="12" stroke-dasharray="' + pctCirc + '" stroke-dashoffset="' + pctOff + '"/></svg><span>' + doneCount + '/' + total + '</span></div>' +
    '<h4>' + lv.ic + ' ' + __(m.title) + '</h4>' +
    '<div class="ls-prog"><div class="ls-prog-bar"><div class="ls-prog-fill" style="width:'+((li+1)/total*100)+'%"></div></div><span>' + (li+1) + '/' + total + '</span></div>' +
    '</div><div class="ls-side-list">' +
    m.lessons.map((l2,i)=>{
      let done=isLessonDone(u2,level,mi,i);
      return '<div class="ls-item'+(i===li?' act':'')+(done?' ls-done':'')+'" data-nav="sModule" data-level="'+level+'" data-mi="'+mi+'" data-li="'+i+'"><div class="ls-node"><div class="ls-dot'+(done?' done':'')+'"></div>'+(i<total-1?'<div class="ls-line'+(done?' done':'')+'"></div>':'')+'</div><div class="ls-tit">'+(i+1)+'. '+__(l2.title)+'</div><div class="ls-done-badge">✓</div></div>';
    }).join('') +
    '</div></div>';
  // Main content
  let main = '<div class="ls-main"><div class="ls-hero" style="background-image:url('+hero+')"><div class="ls-hero-ov"></div><div class="ls-hero-inner"><div class="ls-badge">' + lv.ic + ' ' + __(lv.name) + ' / ' + __(m.title) + '</div><h2>' + __(l.title) + '</h2></div></div>' +
    '<div class="ls-body">' + (story + body || '<p class="empty-msg">' + __({ar:'جاري تجهيز المحتوى...',en:'Preparing content...'}) + '</p>') + '</div>' +
    '<div class="ls-nav"><div class="ls-nav-inner">' +
    (li>0?'<button class="btn btn-sm" data-nav="sModule" data-level="'+level+'" data-mi="'+mi+'" data-li="'+(li-1)+'">⬅ ' + __({ar:'السابق',en:'Prev'}) + '</button>':'<div></div>') +
    '<span class="ls-pg">' + __({ar:'الدرس',en:'Les'}) + ' ' + (li+1) + '/' + total + '</span>' +
'<button class="projector-toggle" onclick="toggleProjector()">📽️ ' + __({ar:'بروجيكتور',en:'Projector'}) + '</button>' +
     (li<total-1?'<button class="btn btn-sm btn-accent" data-nav="continue" data-level="'+level+'" data-mi="'+mi+'" data-li="'+li+'">' + __({ar:'أكمل الرحلة',en:'Continue'}) + ' ➡</button>':'<div style="display:flex;gap:8px"><button class="btn btn-sm btn-success" data-nav="finish" data-level="'+level+'" data-mi="'+mi+'" data-li="'+li+'">✓ ' + __({ar:'تم',en:'Done'}) + '</button><button class="btn btn-sm btn-accent" onclick="showCertificate(\''+level+'\','+mi+')">🎓 ' + __({ar:'الشهادة',en:'Certificate'}) + '</button></div>') +
    '</div></div></div>';
  $('root').innerHTML = '<div class="lesson-split">' + side + main + '</div>';
  window.scrollTo(0,0);
  setTimeout(initUI,100);
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
  return '<div class="mag-quote">' + text + (attr ? '<span class="att">— ' + attr + '</span>' : '') + '</div>';
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
  if(r.leveledUp) to('🎉 '+__(XP_LEVELS[r.newLvl].name)+'! '+__({ar:'تهانينا على المستوى الجديد',en:'Congratulations on the new level!'}));
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
  let h = '<div class="hero glow-gold gradient-border"><div class="hero-glow"></div><h2>' + __({ar:'📝 الاختبارات',en:'📝 Exams'}) + '</h2><p>' + __({ar:'اختبر معرفتك باختيار المستوى المناسب',en:'Test your knowledge — choose your level'}) + '</p></div><div class="grid-3">';
  Object.keys(LV).forEach(k => {
    let lv = LV[k], totalQ = (EX[k]||[]).length;
    h += '<div class="card" onclick="startExam(\''+k+'\')"><div class="card-img"><div class="card-bg '+lv.bgCl+'"></div><div class="card-ov"></div><div class="card-ic">' + lv.ic + '</div><h3>' + __(lv.name) + '</h3></div><div class="card-body"><p>' + totalQ + ' ' + __({ar:'سؤال',en:'questions'}) + '</p><p style="font-size:.82rem;color:var(--accent);margin-top:6px">' + __({ar:'مطلوب 7/10 للنجاح',en:'Need 7/10 to pass'}) + '</p></div></div>';
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
  h += '<button class="btn btn-sm btn-ghost" onclick="resetExam()" style="margin-bottom:8px">← ' + __({ar:'الاختبارات',en:'Exams'}) + '</button>';
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
  h += '<div class="exam-question-num">' + __({ar:'سؤال',en:'Question'}) + ' ' + (curExamIdx+1) + ' / ' + total + '</div>';
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
  if(curExamIdx > 0) h += '<button class="btn btn-sm btn-ghost" onclick="goToQ('+(curExamIdx-1)+')">← ' + __({ar:'السابق',en:'Prev'}) + '</button>';
  else h += '<div></div>';
  if(curExamIdx < total-1){
    h += '<button class="btn btn-sm btn-accent" onclick="goToQ('+(curExamIdx+1)+')">' + __({ar:'التالي',en:'Next'}) + ' →</button>';
  } else {
    let answered = curExamQ.filter(i=>i.selected>=0).length;
    h += '<button class="btn btn-sm btn-success" onclick="submitExam()"' + (answered<total?' disabled':'') + '>' + __({ar:'إنهاء الاختبار',en:'Finish Exam'}) + ' ✓</button>';
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
  h += '<div class="exam-result-icon">' + (passed ? '🎉' : '😞') + '</div>';
  h += '<h2>' + (passed ? __({ar:'مبروك! نجحت 🎉',en:'Congratulations! You Passed 🎉'}) : __({ar:'للأسف! لم تنجح 😞',en:'Sorry! You Did Not Pass 😞'})) + '</h2>';
  h += '<div class="exam-result-score">' + curExamScore + '/' + total + '</div>';
  h += '<div class="exam-result-pct">' + pct + '%</div>';
  h += '<div class="exam-result-bar"><div class="exam-result-fill" style="width:'+pct+'%;background:'+(passed?'var(--accent)':'#e74c3c')+'"></div></div>';
  h += '<p class="exam-result-msg">' + (passed ? __({ar:'أنت مؤهل الآن للحصول على شهادة إتمام المستوى',en:'You are now eligible for a level certificate'}) : __({ar:'حاول مرة أخرى لتحسين نتيجتك',en:'Try again to improve your score'})) + '</p>';
  h += '<div class="exam-result-btns">';
  if(passed){
    h += '<button class="btn btn-accent" onclick="showExamCertificate()">🎓 ' + __({ar:'الحصول على الشهادة',en:'Get Certificate'}) + '</button>';
  }
  h += '<button class="btn btn-ghost" onclick="resetExam()">🔄 ' + __({ar:'إعادة الاختبار',en:'Retry Exam'}) + '</button>';
  h += '<button class="btn btn-ghost" onclick="rT(\'exams\')">← ' + __({ar:'كل الاختبارات',en:'All Exams'}) + '</button>';
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
  let name = __({ar:'طالب أكاديمية الأيادي البيضاء',en:'White Hands Academy Student'});
  let ov = document.createElement('div');
  ov.className = 'cert-overlay';
  ov.innerHTML = '<div class="cert-card glass-gold gradient-border"><div class="cert-badge">أكاديمية الأيادي البيضاء<br><small>White Hands Academy</small></div>' +
    '<div class="cert-gold-line"></div>' +
    '<div class="cert-icon floating">' + lv.ic + '</div>' +
    '<h2>' + __({ar:'شهادة إتمام',en:'Certificate of Completion'}) + '</h2>' +
    '<p class="cert-p1">' + __({ar:'تشهد الأكاديمية أن',en:'This certifies that'}) + '</p>' +
    '<div class="cert-name">' + name + '</div>' +
    '<p class="cert-p2">' + __({ar:'قد أتم بنجاح اختبار مستوى',en:'has successfully passed the exam level'}) + '</p>' +
    '<div class="cert-mod">' + lv.ic + ' ' + __(lv.name) + '</div>' +
    '<p class="cert-p3">' + __({ar:'بدرجة ' + curExamScore + '/' + curExamQ.length,en:'with score ' + curExamScore + '/' + curExamQ.length}) + '</p>' +
    '<div class="cert-gold-line"></div>' +
    '<div class="cert-foot"><div><strong>' + __({ar:'التاريخ',en:'Date'}) + '</strong><br>' + dStr + '</div><div><strong>' + __({ar:'المستوى',en:'Level'}) + '</strong><br>' + __(lv.name) + '</div><div><strong>' + __({ar:'الدرجة',en:'Score'}) + '</strong><br>' + curExamScore + '/' + curExamQ.length + '</div></div>' +
    '<button class="btn btn-sm btn-accent magnetic-btn" onclick="window.print()">🖨️ ' + __({ar:'طباعة',en:'Print'}) + '</button>' +
    '<button class="btn btn-sm btn-ghost magnetic-btn" onclick="this.closest(\'.cert-overlay\').remove()">✕ ' + __({ar:'إغلاق',en:'Close'}) + '</button>' +
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
  ov.innerHTML = '<div class="cert-card glass-gold gradient-border"><div class="cert-badge">اكاديمية الأيادي البيضاء<br><small>White Hands Academy</small></div>' +
    '<div class="cert-gold-line"></div>' +
    '<div class="cert-icon floating">' + lv.ic + '</div>' +
    '<h2>' + __({ar:'شهادة إتمام',en:'Certificate of Completion'}) + '</h2>' +
    '<p class="cert-p1">' + __({ar:'نشهد بأن',en:'This certifies that'}) + '</p>' +
    '<div class="cert-name">' + __({ar:'طالب أكاديمية الأيادي البيضاء',en:'White Hands Academy Student'}) + '</div>' +
    '<p class="cert-p2">' + __({ar:'قد أكمل بنجاح وحدة',en:'has successfully completed the module'}) + '</p>' +
    '<div class="cert-mod">' + lv.ic + ' ' + __(m.title) + '</div>' +
    '<p class="cert-p3">' + __({ar:'وفق معايير SCA الدولية لتدريب الباريستا',en:'Aligned with SCA international barista training standards'}) + '</p>' +
    '<div class="cert-gold-line"></div>' +
    '<div class="cert-foot"><div><strong>' + __({ar:'التاريخ',en:'Date'}) + '</strong><br>' + dStr + '</div><div><strong>' + __({ar:'المستوى',en:'Level'}) + '</strong><br>' + __(lv.name) + '</div><div><strong>' + __({ar:'الدروس',en:'Lessons'}) + '</strong><br>' + m.lessons.length + '</div></div>' +
    '<button class="btn btn-sm magnetic-btn" onclick="this.closest(\'.cert-overlay\').remove()">' + __({ar:'✕ إغلاق',en:'✕ Close'}) + '</button>' +
    '<button class="btn btn-sm btn-accent magnetic-btn" onclick="window.print()" style="margin-top:6px">🖨️ ' + __({ar:'طباعة',en:'Print'}) + '</button>' +
    '</div>';
  document.body.appendChild(ov);
}

function sJourney(){
  let ms = [
    {yr:'~850م',enYr:'~850 AD',ic:'🐐',img:'j0',
      title:{ar:'أسطورة كلد — اكتشاف القهوة',en:'The Legend of Kaldi — Coffee Discovered'},
      story:[{ar:'في أعالي مرتفعات كافا الإثيوبية، حيث تمتد غابات البن البري على سفوح الجبال الخضراء، كان الراعي كلد يرعى أغنامه. وفي أحد الأيام، لاحظ شيئاً غريباً: أغنامه تقفز وتتمايل بطاقة غير عادية بعد أن تناولت ثماراً حمراء صغيرة من شجيرات برية.',en:'High in the Ethiopian highlands of Kaffa, where wild coffee forests blanket the green mountain slopes, the goatherd Kaldi tended his flock. One day, he noticed something strange: his goats were leaping and prancing with unusual energy after eating small red berries from wild bushes.'},
       {ar:'تسمر كلد من الدهشة. قرر أن يجرب الثمار بنفسه. بعد دقائق، شعر بنشاط منعش وصفاء ذهني لم يعهده من قبل. حمل حفنة من الثمار إلى راهب في دير قريب، لكن الراهب رفضها غاضباً ورمى بها في النار. لكن رائحة البن المحمص كانت فواحة لدرجة أن راهباً آخر اقترح خلطها بالماء الساخن — وهكذا وُلد أول فنجان قهوة.',en:'Kaldi was astonished. He decided to try the berries himself. Within minutes, he felt a refreshing alertness and mental clarity he had never experienced. He carried a handful to a monk at a nearby monastery, but the monk angrily threw them into the fire. The aroma of roasting coffee was so intoxicating that another monk suggested mixing them with hot water — and the first cup of coffee was born.'}],
      facts:[{ar:'منطقة كافا أعطت القهوة اسمها',en:'The region Kaffa gave coffee its name'},{ar:'أول تدوين للأسطورة كان عام 1592',en:'First recorded in 1592'},{ar:'القهوة نمت برياً في إثيوبيا قبل التاريخ',en:'Coffee grew wild in Ethiopia before recorded history'}]},
    {yr:'1450م',enYr:'1450',ic:'🏺',img:'j1',
      title:{ar:'الصوفيون في اليمن — أول فنجان',en:'Yemeni Sufis — The First Cup'},
      story:[{ar:'عبر البحر الأحمر، وصلت حبوب البن إلى اليمن في القرن الخامس عشر. كان الصوفيون اليمنيون يبحثون عن شيء يساعدهم على البقاء مستيقظين طوال الليل في الذكر والعبادة. وجدوا ضالتهم في القهوة.',en:'Across the Red Sea, coffee beans reached Yemen in the 15th century. Yemeni Sufis were searching for something to help them stay awake through long nights of worship and dhikr. They found their answer in coffee.'},
       {ar:'في البيوت اليمنية، كانوا يغلي حبوب البن مع الماء ويضيفون السكر والهيل والزنجبيل — هكذا وُلد أسلوب التحضير الذي نعرفه اليوم باسم "القهوة التركية". انتشرت القهوة من اليمن إلى مكة فالقاهرة فإسطنبول، وأصبح تحضيرها فناً له طقوسه الخاصة.',en:'In Yemeni homes, they boiled coffee beans with water, adding sugar, cardamom, and ginger — thus was born the brewing method we know today as "Turkish Coffee." Coffee spread from Yemen to Mecca, Cairo, and Istanbul, and its preparation became an art with its own rituals.'}],
      facts:[{ar:'اليمن احتكرت زراعة البن 200 سنة',en:'Yemen monopolized coffee cultivation for 200 years'},{ar:'ميناء المخا أطلق اسمه على القهوة (موكا)',en:'Port Mocha gave its name to Mocha coffee'},{ar:'أول توثيق لشرب القهوة كان في اليمن',en:'First documented coffee drinking was in Yemen'}]},
    {yr:'1511',enYr:'1511',ic:'🕌',img:'j2',
      title:{ar:'مكة — أول مقاهي العالم',en:'Mecca — The World\'s First Coffeehouses'},
      story:[{ar:'في مكة المكرمة، بدأت القهوة رحلتها كظاهرة اجتماعية. افتتح أول مقهى في العالم في مكة حوالي عام 1511، وسرعان ما انتشرت المقاهي في كل حي. لم تكن مجرد أماكن لشرب القهوة — بل أصبحت منتديات للنقاش، يلتقي فيها التجار والشعراء والعلماء.',en:'In Mecca, coffee began its journey as a social phenomenon. The world\'s first coffeehouse opened in Mecca around 1511, and coffeehouses soon spread to every neighborhood. They weren\'t just places to drink coffee — they became forums for discussion where merchants, poets, and scholars gathered.'},
       {ar:'أثارت المقاهي جدلاً كبيراً. بعض رجال الدين رأوا فيها خطراً لأنها تجمع الناس للنقاش، وحاولوا منع القهوة. لكن الطعم الرائع والتأثير المنعش جعلا القهوة لا تُقاوم. انتصر عشاق القهوة، وبدأت المقاهي تنتشر في كل اتجاه — إلى القاهرة والشام ثم إسطنبول.',en:'Coffeehouses sparked great controversy. Some religious scholars saw them as dangerous gathering places for debate and tried to ban coffee. But the delicious taste and refreshing effect made coffee irresistible. Coffee lovers prevailed, and coffeehouses spread in every direction — to Cairo, Damascus, then Istanbul.'}],
      facts:[{ar:'أول مقهى في التاريخ كان في مكة',en:'The first coffeehouse in history was in Mecca'},{ar:'أُطلق عليها "قهاوي" — جمع قهوة',en:'Called "Qahawi" — plural of Qahwa (coffee)'},{ar:'حاول البعض منع القهوة لكنها انتصرت',en:'Some tried to ban coffee but it prevailed'}]},
    {yr:'1555',enYr:'1555',ic:'🏛️',img:'j3',
      title:{ar:'إسطنبول — مدارس الحكمة',en:'Istanbul — The Schools of Wisdom'},
      story:[{ar:'في عام 1555، افتتح أول مقهى في إسطنبول العثمانية، فكان حدثاً غير مسبوق. أطلق على المقاهي اسم "مدارس الحكمة" — لأن روادها كانوا يناقشون السياسة والفلسفة والأدب والفن. أصبح المقهى العثماني مؤسسة اجتماعية وثقافية بكل ما تحمله الكلمة من معنى.',en:'In 1555, the first coffeehouse opened in Ottoman Istanbul, an unprecedented event. Coffeehouses were called "Schools of Wisdom" — because their patrons discussed politics, philosophy, literature, and art. The Ottoman coffeehouse became a full-fledged social and cultural institution.'},
       {ar:'طور العثمانيون طقوساً معقدة لتحضير القهوة. كان "قهوجي باشي" (رئيس القهوجيين) مسؤولاً عن القهوة في القصر السلطاني. أضاف العثمانيون لمساتهم الخاصة: تحميص البن طازجاً كل يوم، وطحنه ناعماً جداً، وتقديمه مع الماء البارد والحلقوم — تراث لا يزال حياً حتى اليوم.',en:'The Ottomans developed elaborate coffee preparation rituals. The "Kahveci Başı" (Chief Coffee Maker) was responsible for coffee in the imperial palace. The Ottomans added their own touches: freshly roasting beans daily, grinding them very finely, serving with cold water and Turkish delight — a tradition still alive today.'}],
      facts:[{ar:'القهوة العثمانية سُجلت تراثاً عالمياً',en:'Ottoman coffee is a UNESCO heritage'},{ar:'القصر العثماني وظف 40 قهوجي',en:'The Ottoman palace employed 40 coffee makers'},{ar:'أول مرة يُضاف السكر للقهوة',en:'Sugar was first added to coffee here'}]},
    {yr:'1615',enYr:'1615',ic:'🇮🇹',img:'j4',
      title:{ar:'البندقية — القهوة تصل أوروبا',en:'Venice — Coffee Arrives in Europe'},
      story:[{ar:'من موانئ إسطنبول والإسكندرية، حمل التجار البنّدقيون حبوب البن عبر البحر المتوسط إلى ميناء البندقية. كانت البندقية بوابة أوروبا الشرقية — حيث تلتقي ثقافات الشرق والغرب. وصلت أول شحنة بن رسمية إلى البندقية عام 1615.',en:'From the ports of Istanbul and Alexandria, Venetian merchants carried coffee beans across the Mediterranean to the port of Venice. Venice was Europe\'s gateway to the East — where Eastern and Western cultures met. The first official coffee shipment arrived in Venice in 1615.'},
       {ar:'في البداية، كان الأطباء الأوروبيون يشككون في القهوة. وصفها البعض بأنها "شراب أسود خطير"! لكن سرعان ما اكتشف الأوروبيون متعة القهوة. في عام 1645، افتتح أول مقهى إيطالي في البندقية، ثم تلته مقاهي في لندن وباريس وأمستردام. انطلقت ثورة القهوة الأوروبية.',en:'At first, European doctors were suspicious of coffee. Some described it as "dangerous black liquid"! But Europeans soon discovered the pleasure of coffee. In 1645, the first Italian coffeehouse opened in Venice, followed by coffeehouses in London, Paris, and Amsterdam. The European coffee revolution had begun.'}],
      facts:[{ar:'البندقية كانت بوابة القهوة لأوروبا',en:'Venice was coffee\'s gateway to Europe'},{ar:'أول مقهى إيطالي افتتح عام 1645',en:'First Italian coffeehouse opened in 1645'},{ar:'القهوة سُميت "شراب الشيطان" أولاً',en:'Coffee was first called "Satan\'s drink"'}]},
     {yr:'1683',enYr:'1683',ic:'🇦🇹',img:'vienna_siege',
      title:{ar:'فيينا — القهوة تصبح أوروبية',en:'Vienna — Coffee Becomes European'},
      story:[{ar:'بعد حصار فيينا العظيم عام 1683، ترك الجيش العثماني وراءه أكياساً ضخمة من البن الأخضر. لم يعرف الأوروبيون ماذا يفعلون بها — حتى جاء جيرجي كولشيتسكي، وهو بولندي عاش في إسطنبول وعرف قيمة القهوة. استلم الأكياس وافتتح أول مقهى فييني.',en:'After the Great Siege of Vienna in 1683, the Ottoman army left behind huge sacks of green coffee beans. Europeans didn\'t know what to do with them — until Jerzy Kulczycki, a Pole who had lived in Istanbul and knew coffee\'s value, claimed the sacks and opened the first Viennese coffeehouse.'},
       {ar:'هنا حدث الابتكار الكبير: أضاف كولشيتسكي الحليب والسكر إلى القهوة — لأن الأذواق الأوروبية كانت تفضل القهوة الأخف. وُلدت "القهوة الفيينية" الشهيرة، وأصبحت المقاهي الفيينية جزءاً من التراث الثقافي الأوروبي — ملتقى للمفكرين والفنانين.',en:'Here came the great innovation: Kulczycki added milk and sugar to coffee — because European palates preferred milder coffee. The famous "Viennese Coffee" was born, and Viennese coffeehouses became part of European cultural heritage — meeting places for thinkers and artists.'}],
      facts:[{ar:'كولشيتسكي طلب أكياس البن كمكافأة',en:'Kulczycki asked for coffee sacks as his reward'},{ar:'فينيا أضافت الحليب والسكر للقهوة',en:'Vienna added milk and sugar to coffee'},{ar:'المقاهي الفيينية تراث عالمي',en:'Viennese coffeehouses are world heritage'}]},
     {yr:'1727',enYr:'1727',ic:'🇧🇷',img:'brazil_smuggle',
      title:{ar:'البرازيل — القهوة تعبر المحيط',en:'Brazil — Coffee Crosses the Ocean'},
      story:[{ar:'في قصة أشبه بأفلام التجسس، نُقلت شتلات البن سراً من غويانا الفرنسية إلى البرازيل. أرسلت الزوجة الجميلة لحاكم غويانا باقة وداع فيها شتلات بن مخبأة إلى العقيد البرازيلي باليتا — الذي أغواها. كانت هذه الشتلات القليلة بداية إمبراطورية القهوة البرازيلية.',en:'In a story worthy of spy films, coffee seedlings were smuggled from French Guiana to Brazil. The beautiful wife of French Guiana\'s governor hid coffee seedlings in a farewell bouquet to Brazilian Colonel Palheta — who had seduced her. Those few seedlings were the beginning of Brazil\'s coffee empire.'},
       {ar:'من تلك الشتلات القليلة، أصبحت البرازيل أكبر منتج للقهوة في العالم — ولا تزال تنتج أكثر من ثلث قهوة العالم. مزارع البن البرازيلية الشاسعة غيرت اقتصاد البلاد وجعلت القهوة مشروباً عالمياً متاحاً للجميع.',en:'From those few seedlings, Brazil became the world\'s largest coffee producer — still growing over one third of the world\'s coffee. Brazil\'s vast coffee plantations transformed the country\'s economy and made coffee an affordable global beverage.'}],
      facts:[{ar:'البرازيل تنتج ⅓ قهوة العالم',en:'Brazil produces ⅓ of the world\'s coffee'},{ar:'قصة تهريب البن للبرازيل أشبه بالفيلم',en:'Coffee\'s smuggling to Brazil is like a movie'},{ar:'أكثر من 300 ألف مزرعة بن في البرازيل',en:'Over 300,000 coffee farms in Brazil'}]},
     {yr:'1901',enYr:'1901',ic:'⚙️',img:'bezzera_patent',
      title:{ar:'لويجي بزيرا — أول ماكينة إسبريسو',en:'Bezzera — The First Espresso Machine'},
      story:[{ar:'في ميلانو، إيطاليا، حصل لويجي بزيرا على براءة اختراع غيرت عالم القهوة إلى الأبد: أول ماكينة قهوة تعمل بضغط البخار. الفكرة كانت ثورية — استخدام الضغط لدفع الماء الساخن عبر البن المطحون بسرعة، لإعداد فنجان قوي ومركز في ثوانٍ.',en:'In Milan, Italy, Luigi Bezzera patented an invention that changed the coffee world forever: the first steam-pressure coffee machine. The idea was revolutionary — using pressure to force hot water through ground coffee quickly, producing a strong, concentrated cup in seconds.'},
       {ar:'سُميت "الإسبريسو" لأنها تُحضَر "expressly" (خصيصاً) لكل زبون. لكن مشكلة ماكينة بزيرا كانت أن الضغط العالي يجعل طعم القهوة مراً. استمر المطورون في تحسين التصميم — وكانت الخطوة الكبرى التالية بانتظار جاجيا.',en:'It was called "espresso" because it was made "expressly" for each customer. But Bezzera\'s machine had a problem: the high pressure made coffee taste bitter. Developers continued refining the design — and the next big step was waiting for Gaggia.'}],
      facts:[{ar:'كلمة إسبريسو تعني "مخصص" بالإيطالية',en:'Espresso means "expressly" in Italian'},{ar:'بزيرا اخترع أول ماكينة عام 1901',en:'Bezzera invented the first machine in 1901'},{ar:'الضغط الزائد كان يسبب مرارة',en:'Excess pressure caused bitterness'}]},
     {yr:'1946',enYr:'1946',ic:'☕',img:'gaggia_lever',
      title:{ar:'أكيلي جاجيا — ولادة الكريما',en:'Gaggia — The Birth of Crema'},
      story:[{ar:'في عام 1946، أحدث أكيلي جاجيا ثورة حقيقية. اخترع نظام الرافعة الميكانيكية الذي يولد ضغطاً مثالياً — 9 بار — لا زائداً ولا ناقصاً. لأول مرة في التاريخ، أُنتجت كريما ذهبية جميلة تغطي وجه الإسبريسو. كانت تلك الكريما علامة الجودة التي تميز الإسبريسو الإيطالي.',en:'In 1946, Achille Gaggia created a true revolution. He invented the mechanical lever system that generated the perfect pressure — 9 bars — not too much, not too little. For the first time in history, a beautiful golden crema crowned the espresso. This crema became the quality hallmark of Italian espresso.'},
       {ar:'قبل جاجيا، كان الإسبريسو مجرد سائل بني بدون الكريما المميزة. اختراعه قلب موازين صناعة القهوة — وأصبحت ماكينة الرافعة أيقونة في مقاهي إيطاليا والعالم. اليوم، الكريما هي أول ما يبحث عنه عشاق الإسبريسو.',en:'Before Gaggia, espresso was just brown liquid without the distinctive crema. His invention turned the coffee industry upside down — and the lever machine became an icon in Italian cafes worldwide. Today, crema is the first thing espresso lovers look for.'}],
      facts:[{ar:'9 بار هو الضغط المثالي للإسبريسو',en:'9 bar is the perfect espresso pressure'},{ar:'جاجيا أنتج أول كريما في التاريخ',en:'Gaggia produced history\'s first crema'},{ar:'ماكينة الرافعة أيقونة إيطالية',en:'The lever machine is an Italian icon'}]},
    {yr:'الموجة الثالثة',enYr:'Third Wave',ic:'🌊',img:'j9',
      title:{ar:'الموجة الثالثة — القهوة كفن وعلم',en:'Third Wave — Coffee as Art & Science'},
      story:[{ar:'في التسعينات، بدأت موجة جديدة في عالم القهوة. لم تعد القهوة مجرد سلعة — أصبحت منتجاً حرفياً يُقدَّر مثل النبيذ. بدأ المحمصون في تتبع مصدر البن من مزرعة واحدة، ومعاملة كل حبة بن باحترام يستحقه.',en:'In the 1990s, a new wave began in the coffee world. Coffee was no longer just a commodity — it became an artisan product appreciated like wine. Roasters began tracing beans from a single farm, treating each coffee cherry with the respect it deserves.'},
       {ar:'دخلت أجهزة قياس TDS ومنحنيات الاستخلاص والمقاييس الرقمية إلى عالم القهوة. الباريستا أصبح عالماً يتذوق ويحلل ويبتكر. ظهرت طرق تحضير جديدة: V60، AeroPress، Chemex، Cold Brew. واليوم، أكاديمية الأيادي البيضاء تواصل هذه الرحلة.',en:'TDS meters, extraction curves, and digital scales entered the coffee world. The barista became a scientist who tastes, analyzes, and creates. New brewing methods emerged: V60, AeroPress, Chemex, Cold Brew. And today, White Hands Academy continues this journey.'}],
      facts:[{ar:'الموجة الثالثة بدأت في التسعينات',en:'Third Wave began in the 1990s'},{ar:'القهوة أصبحت مثل النبيذ في التقييم',en:'Coffee is now evaluated like wine'},{ar:'طرق تحضير جديدة غيرت كل شيء',en:'New brewing methods changed everything'}]},
    {yr:'2024',enYr:'2024',ic:'🤲',img:'j10',
      title:{ar:'أكاديمية الأيادي البيضاء',en:'White Hands Academy'},
      story:[{ar:'في عام 2024، انطلقت أكاديمية الأيادي البيضاء — أول منصة تعليمية عربية متكاملة لتدريب الباريستا. من البذرة إلى الفنجان، نأخذك في رحلة تعلم شاملة: 3 مستويات، 9 وحدات، عشرات الدروس التفاعلية، واختبارات تقيس مستواك.',en:'In 2024, White Hands Academy launched — the first integrated Arabic barista training platform. From seed to cup, we take you on a comprehensive learning journey: 3 levels, 9 modules, dozens of interactive lessons, and exams that measure your progress.'},
       {ar:'رسالتنا: نشر ثقافة القهوة المختصة باللغة العربية، بمحتوى تعليمي احترافي معتمد على منهج SCA العالمي. نحن نؤمن أن القهوة ليست مجرد مشروب — إنها علم وفن وثقافة تستحق أن تُدرَّس بأعلى معايير الجودة.',en:'Our mission: spreading specialty coffee culture in Arabic, with professional educational content aligned with global SCA standards. We believe coffee is not just a drink — it is a science, an art, and a culture that deserves to be taught at the highest quality standards.'}],
      facts:[{ar:'3 مستويات — A • B • C',en:'3 Levels — A • B • C'},{ar:'منهج متوافق مع SCA',en:'SCA-aligned curriculum'},{ar:'شهادات إتمام معتمدة',en:'Official completion certificates'}]}
  ];
  let h = '<div class="hero"><div class="hero-glow"></div><h2>' + __({ar:'☕ رحلة القهوة',en:'☕ Coffee Journey'}) + '</h2><div class="gold-divider"></div><p>' + __({ar:'ارتحل معنا عبر 1200 عام من تاريخ القهوة — من غابات إثيوبيا إلى فناجينكم',en:'Travel with us through 1,200 years of coffee history — from Ethiopian forests to your cup'}) + '</p></div>';
  h += '<div class="img-c img-c-timeline" style="margin:0 0 40px"><img src="' + photo('coffee_timeline') + '" alt="" loading="lazy"><div class="cap">' + __({ar:'🗺️ خريطة القهوة عبر الزمن — من البذرة إلى فنجانك',en:'🗺️ Coffee Journey Map — From Seed to Your Cup'}) + '</div></div>';
  h += '<div class="jrny"><div class="jrny-track"></div>';
  ms.forEach((m, i) => {
    h += '<div class="jrny-stop"><div class="jrny-marker">' + (i+1) + '</div>';
    h += '<div class="jrny-card"><div class="jrny-img"><img src="' + photoSmall(m.img) + '" alt="" loading="lazy"><div class="jrny-img-ov"></div><div class="jrny-badge">' + (lang==='ar'?m.yr:m.enYr) + '</div><div class="jrny-ic">' + m.ic + '</div></div>';
    h += '<div class="jrny-body"><h3>' + __(m.title) + '</h3>';
    m.story.forEach(p => { h += '<p>' + __(p) + '</p>'; });
    h += '<div class="jrny-facts"><div class="jrny-facts-title">' + (lang==='ar'?'🔍 حقائق سريعة':'🔍 Quick Facts') + '</div>';
    m.facts.forEach(f => { h += '<div class="jrny-fact"><span>✦</span> ' + __(f) + '</div>'; });
    h += '</div></div></div></div>';
  });
  h += '</div>';
  // === PRODUCING & CONSUMING COUNTRIES ===
  h += '<div class="hero" style="margin-top:30px"><div class="hero-glow"></div><h2>' + __({ar:'🌍 الدول المنتجة للبن',en:'🌍 Coffee Producing Countries'}) + '</h2><div class="gold-divider"></div><p>' + __({ar:'القهوة تنمو في أكثر من 70 دولة حول العالم — لكن 10 دول تنتج 90% من الإنتاج العالمي',en:'Coffee grows in over 70 countries worldwide — but 10 countries produce 90% of global output'}) + '</p></div>';
  h += '<div class="img-c"><img src="' + photo('coffee_map') + '" alt="" loading="lazy" style="width:100%;border-radius:var(--radius-lg)"><div class="cap">' + __({ar:'🗺️ خريطة الدول المنتجة للقهوة — Bean Belt',en:'🗺️ Coffee Producing Countries — Bean Belt'}) + '</div></div>';
  h += '<h3>' + __({ar:'☕ أهم 10 دول منتجة للبن',en:'☕ Top 10 Producing Countries'}) + '</h3>';
  h += '<div style="display:flex;flex-direction:column;gap:8px;margin:12px 0">';
  let prod = [
    {ar:'البرازيل',en:'Brazil',fl:'🇧🇷',q:'3.7B',pct:37,cl:'#4caf50',t:'أرابيكا + روبوستا',te:'Arabica + Robusta'},
    {ar:'فيتنام',en:'Vietnam',fl:'🇻🇳',q:'1.8B',pct:17,cl:'#ff9800',t:'روبوستا',te:'Robusta'},
    {ar:'كولومبيا',en:'Colombia',fl:'🇨🇴',q:'840M',pct:8,cl:'#2196f3',t:'أرابيكا',te:'Arabica'},
    {ar:'إندونيسيا',en:'Indonesia',fl:'🇮🇩',q:'670M',pct:6,cl:'#9c27b0',t:'أرابيكا + روبوستا',te:'Arabica + Robusta'},
    {ar:'إثيوبيا',en:'Ethiopia',fl:'🇪🇹',q:'500M',pct:5,cl:'#e91e63',t:'أرابيكا (برّي)',te:'Arabica (Wild)'},
    {ar:'هندوراس',en:'Honduras',fl:'🇭🇳',q:'460M',pct:4,cl:'#00bcd4',t:'أرابيكا',te:'Arabica'},
    {ar:'الهند',en:'India',fl:'🇮🇳',q:'350M',pct:3,cl:'#ff5722',t:'روبوستا',te:'Robusta'},
    {ar:'أوغندا',en:'Uganda',fl:'🇺🇬',q:'320M',pct:3,cl:'#8bc34a',t:'روبوستا',te:'Robusta'},
    {ar:'المكسيك',en:'Mexico',fl:'🇲🇽',q:'280M',pct:3,cl:'#f44336',t:'أرابيكا',te:'Arabica'},
    {ar:'غواتيمالا',en:'Guatemala',fl:'🇬🇹',q:'250M',pct:2,cl:'#3f51b5',t:'أرابيكا',te:'Arabica'}
  ];
  prod.forEach((c,i) => {
    let cnt = (lang === 'ar' ? c.ar : c.en);
    let tp = (lang === 'ar' ? c.t : c.te);
    h += '<div class="budget-bar" style="margin:0"><div class="budget-lbl" style="display:flex;justify-content:space-between;margin-bottom:3px"><span>' + c.fl + ' <strong>' + cnt + '</strong></span><span style="color:var(--accent);font-size:.8rem">' + c.q + ' · ' + c.pct + '%</span></div><div class="budget-track" style="height:20px;background:rgba(255,255,255,.05);border-radius:10px;overflow:hidden"><div class="budget-fill" style="width:' + c.pct + '%;height:100%;background:' + c.cl + ';border-radius:10px;transition:width 1s ease"></div></div><div style="font-size:.75rem;color:var(--text-muted);margin-top:2px">' + tp + '</div></div>';
  });
  h += '</div>';
  h += '<div class="hl"><strong>' + __({ar:'💡 معلومة:',en:'💡 Fact:'}) + '</strong> ' + __({ar:'البرازيل وحدها تنتج أكثر من ثلث قهوة العالم! فيتنام تتصدر إنتاج الروبوستا. إثيوبيا هي موطن البن الأصلي.',en:'Brazil alone produces over one third of the world\'s coffee! Vietnam leads Robusta production. Ethiopia is coffee\'s birthplace.'}) + '</div>';
  // Visual comparison: Producers vs Consumers
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0">';
  h += '<div class="hl" style="text-align:center;padding:16px;background:linear-gradient(135deg,rgba(76,175,80,.1),rgba(76,175,80,.02))"><div style="font-size:2.2rem">🌱</div><div style="font-weight:700;font-size:1.1rem;color:#4caf50">' + __({ar:'منتجون',en:'Producers'}) + '</div><div style="font-size:.82rem;color:var(--text-muted)">' + __({ar:'حزام البن — دول نامية قرب خط الاستواء',en:'Bean Belt — Developing nations near equator'}) + '</div></div>';
  h += '<div class="hl" style="text-align:center;padding:16px;background:linear-gradient(135deg,rgba(33,150,243,.1),rgba(33,150,243,.02))"><div style="font-size:2.2rem">📦</div><div style="font-weight:700;font-size:1.1rem;color:#2196f3">' + __({ar:'مستهلكون',en:'Consumers'}) + '</div><div style="font-size:.82rem;color:var(--text-muted)">' + __({ar:'أمريكا الشمالية — أوروبا — آسيا',en:'North America — Europe — Asia'}) + '</div></div>';
  h += '</div>';
  // Consuming / Importing
  h += '<h3 style="margin-top:30px">' + __({ar:'📦 أهم الدول المستوردة والمستهلكة للقهوة',en:'📦 Top Coffee Importing & Consuming Countries'}) + '</h3>';
  h += '<div style="display:flex;flex-direction:column;gap:8px;margin:12px 0">';
  let cons = [
    {ar:'الولايات المتحدة',en:'USA',fl:'🇺🇸',q:'1.7B',pc:'4.5 kg',pcp:'4.5 kg',pct:100,n:'أكبر مستورد — 25% من الاستهلاك العالمي',ne:'Largest importer — 25% global'},
    {ar:'ألمانيا',en:'Germany',fl:'🇩🇪',q:'1.1B',pc:'6.7 kg',pcp:'6.7 kg',pct:65,n:'ثاني أكبر — رائدة القهوة الأوروبية',ne:'Second largest — European leader'},
    {ar:'إيطاليا',en:'Italy',fl:'🇮🇹',q:'500M',pc:'5.8 kg',pcp:'5.8 kg',pct:30,n:'مهد الإسبريسو — ثقافة عريقة',ne:'Espresso birthplace — rich culture'},
    {ar:'اليابان',en:'Japan',fl:'🇯🇵',q:'450M',pc:'3.5 kg',pcp:'3.5 kg',pct:26,n:'أكبر سوق قهوة في آسيا',ne:'Largest Asian coffee market'},
    {ar:'فرنسا',en:'France',fl:'🇫🇷',q:'350M',pc:'5.4 kg',pcp:'5.4 kg',pct:20,n:'مقاهي باريس الشهيرة',ne:'Famous Parisian cafes'},
    {ar:'كندا',en:'Canada',fl:'🇨🇦',q:'250M',pc:'6.5 kg',pcp:'6.5 kg',pct:15,n:'نمو سريع في سوق Specialty',ne:'Fast-growing specialty market'},
    {ar:'إسبانيا',en:'Spain',fl:'🇪🇸',q:'200M',pc:'4.2 kg',pcp:'4.2 kg',pct:12,n:'ثقافة القهوة المتوسطية',ne:'Mediterranean coffee culture'},
    {ar:'المملكة المتحدة',en:'UK',fl:'🇬🇧',q:'180M',pc:'2.8 kg',pcp:'2.8 kg',pct:10,n:'نمو هائل في القهوة المختصة',ne:'Huge specialty coffee growth'},
    {ar:'كوريا الجنوبية',en:'South Korea',fl:'🇰🇷',q:'160M',pc:'3.1 kg',pcp:'3.1 kg',pct:9,n:'أسرع سوق نمو في آسيا',ne:'Fastest growing Asian market'},
    {ar:'هولندا',en:'Netherlands',fl:'🇳🇱',q:'150M',pc:'8.4 kg',pcp:'8.4 kg',pct:9,n:'أعلى استهلاك للفرد في أوروبا',ne:'Highest per capita in Europe'}
  ];
  cons.forEach((c,i) => {
    let cnt = (lang === 'ar' ? c.ar : c.en);
    let nt = (lang === 'ar' ? c.n : c.ne);
    h += '<div class="budget-bar" style="margin:0"><div class="budget-lbl" style="display:flex;justify-content:space-between;margin-bottom:3px"><span>' + c.fl + ' <strong>' + cnt + '</strong></span><span style="color:var(--accent);font-size:.8rem">' + __({ar:'استيراد',en:'Import'}) + ': ' + c.q + ' · ' + __({ar:'للفرد',en:'pc'}) + ': ' + __({ar:c.pc,en:c.pcp}) + '</span></div><div class="budget-track" style="height:16px;background:rgba(255,255,255,.05);border-radius:10px;overflow:hidden"><div class="budget-fill" style="width:' + c.pct + '%;height:100%;background:linear-gradient(90deg,#2196f3,#64b5f6);border-radius:10px;transition:width 1s ease"></div></div><div style="font-size:.75rem;color:var(--text-muted);margin-top:2px">' + nt + '</div></div>';
  });
  h += '</div>';
  h += '<div class="ok-box"><strong>' + __({ar:'🎯 الخلاصة:',en:'🎯 Summary:'}) + '</strong> ' + __({ar:'القهوة رحلة عالمية — تزرع في الجنوب وتُستهلك في الشمال. فهم الخريطة يساعدك تعرف مصدر بنك وتتوقع نكهاته.',en:'Coffee is a global journey — grown in the south, consumed in the north. Understanding the map helps you trace your coffee\'s source and anticipate its flavors.'}) + '</div>';
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
  h+='<div class="profile-hero"><div class="profile-hero-glow"></div><div class="profile-avatar-lg">⚙️</div><h2>'+__({ar:'لوحة التحكم',en:'Admin Panel'})+'</h2><p class="profile-title">'+__({ar:'إدارة المستخدمين والموافقات',en:'Manage users & approvals'})+'</p></div>';
  h+='<div class="profile-section"><h3>⏳ '+__({ar:'في انتظار الموافقة',en:'Pending Approval'})+' <span class="pending-count">'+pending.length+'</span></h3>';
  if(pending.length===0){
    h+='<p class="empty-msg">'+__({ar:'لا يوجد مستخدمون في انتظار الموافقة',en:'No pending users'})+'</p>';
  } else {
    h+='<div class="admin-user-list">';
    pending.forEach(p=>{
      h+='<div class="admin-user-item pending">'+
        '<div class="admin-user-ava">'+p.name[0].toUpperCase()+'</div>'+
        '<div class="admin-user-info"><div class="admin-user-name">'+p.name+'</div><div class="admin-user-email">'+p.email+'</div><div class="admin-user-date">'+__({ar:'تاريخ التسجيل:',en:'Joined:'})+' '+p.joinDate+'</div></div>'+
        '<div class="admin-user-actions">'+
        '<button class="btn btn-sm btn-success" onclick="approveUser(\''+p.id+'\').then(()=>loadAdminData())">✓ '+__({ar:'موافقة',en:'Approve'})+'</button>'+
        '<button class="btn btn-sm btn-ghost" style="color:#e74c3c" onclick="rejectUser(\''+p.id+'\').then(()=>loadAdminData())">✕ '+__({ar:'رفض',en:'Reject'})+'</button></div></div>';
    });
    h+='</div>';
  }
  h+='</div>';
  h+='<div class="profile-section"><h3>👥 '+__({ar:'جميع المستخدمين',en:'All Users'})+' <span class="pending-count">'+allUsers.length+'</span></h3>';
  if(allUsers.length===0){
    h+='<p class="empty-msg">'+__({ar:'لا يوجد مستخدمون بعد',en:'No users yet'})+'</p>';
  } else {
    h+='<div class="admin-user-list">';
    allUsers.forEach(p=>{
      let statusCls=p.role==='active'?'active':p.role==='banned'?'banned':'pending';
      let statusTxt=__({ar:p.role==='active'?'نشط':p.role==='banned'?'محظور':'معلق',en:p.role==='active'?'Active':p.role==='banned'?'Banned':'Pending'});
      h+='<div class="admin-user-item '+statusCls+'">'+
        '<div class="admin-user-ava">'+p.name[0].toUpperCase()+'</div>'+
        '<div class="admin-user-info"><div class="admin-user-name">'+p.name+'</div><div class="admin-user-email">'+p.email+'</div>'+
        '<div class="admin-user-meta">'+
        '<span>🎯 '+(p.xp||0)+' XP</span><span>🔥 '+(p.streak||0)+'</span><span>📚 '+(p.completedLessons||[]).length+'</span>'+
        '</div></div>'+
        '<div class="admin-user-status '+statusCls+'">'+statusTxt+'</div>'+
        '<div class="admin-user-actions">'+
        (p.role==='active'?'<button class="btn btn-sm btn-ghost" style="color:#e74c3c" onclick="banUser(\''+p.id+'\').then(()=>loadAdminData())">🚫 '+__({ar:'حظر',en:'Ban'})+'</button>':'')+
        (p.role==='banned'?'<button class="btn btn-sm btn-success" onclick="unbanUser(\''+p.id+'\').then(()=>loadAdminData())">✓ '+__({ar:'إلغاء الحظر',en:'Unban'})+'</button>':'')+
        (p.role==='pending'?'<button class="btn btn-sm btn-success" onclick="approveUser(\''+p.id+'\').then(()=>loadAdminData())">✓ '+__({ar:'موافقة',en:'Approve'})+'</button>':'')+
        ' <button class="btn btn-sm btn-ghost" style="color:#e74c3c" onclick="rejectUser(\''+p.id+'\').then(()=>loadAdminData())">✕</button></div></div>';
    });
    h+='</div>';
  }
  h+='</div>';
  h+='<div class="profile-section" style="text-align:center;color:var(--text-muted);font-size:.82rem">'+
    '<p>🔐 '+__({ar:'أنت مسؤول النظام. أول مستخدم مسجل يصبح مسؤولاً تلقائياً.',en:'You are the system admin. The first registered user becomes admin automatically.'})+'</p>'+
    '<p>🛡️ '+__({ar:'يمكنك الموافقة على المستخدمين الجدد، حظرهم، أو حذفهم.',en:'You can approve new users, ban them, or remove them.'})+'</p></div>';
  h+='</div>';
  return h;
}
function sAdmin(){
  if(!curUser||!isAdmin()) return '<p>'+__({ar:'غير مصرح',en:'Unauthorized'})+'</p>';
  setTimeout(loadAdminData, 50);
  return '<div id="adminPanel"><div style="text-align:center;padding:40px;color:var(--text-muted)">⏳ '+__({ar:'جاري تحميل البيانات...',en:'Loading data...'})+'</div></div>';
}

/* ===== Profile / Dashboard ===== */
function sProfile(){
  let u=getCurUser();
  if(!u) return '<p style="text-align:center;padding:40px;color:var(--text-muted)">'+__({ar:'الرجاء تسجيل الدخول',en:'Please login'})+'</p>';
  let lvl=XP_LEVELS[u.levelIdx||0];
  let h='<div class="profile-wrap">';
  // Hero
  h+='<div class="profile-hero"><div class="profile-hero-glow"></div><div class="profile-avatar-lg">'+u.name[0].toUpperCase()+'</div>'+
    '<h2>'+u.name+'</h2><p class="profile-title">'+lvl.ic+' '+__(lvl.name)+'</p>'+
    '<div class="profile-xp-bar"><div class="profile-xp-fill" style="width:'+xpPct(u)+'%"></div></div>'+
    '<div class="profile-xp-info">'+u.xp+' XP'+(xpToNext(u)>0?' · '+xpToNext(u)+' '+__({ar:'للمستوى التالي',en:'to next level'}):' · '+__({ar:'المستوى الأقصى!',en:'MAX LEVEL!'}))+'</div>'+
    '<div class="profile-stats-row"><div><span class="ps-n">'+(u.completedLessons||[]).length+'</span><span class="ps-l">'+__({ar:'درس مكتمل',en:'Lessons'})+'</span></div>'+
    '<div><span class="ps-n">'+(u.completedModules||[]).length+'</span><span class="ps-l">'+__({ar:'وحدة',en:'Modules'})+'</span></div>'+
    '<div><span class="ps-n">'+(u.passedExams||[]).length+'</span><span class="ps-l">'+__({ar:'اختبار',en:'Exams'})+'</span></div>'+
    '<div><span class="ps-n">🔥'+(u.streak||0)+'</span><span class="ps-l">'+__({ar:'أيام',en:'Streak'})+'</span></div></div></div>';
  // Badges
  h+='<div class="profile-section"><h3>'+__({ar:'🏅 الأوسمة',en:'🏅 Badges'})+'</h3><div class="badge-grid">';
  BADGE_DEFS.forEach(b=>{
    let owned=hasBadge(u,b.id);
    h+='<div class="badge-item'+(owned?' owned':'')+'"><div class="badge-ic">'+b.ic+'</div><div class="badge-name">'+__(b.name)+'</div><div class="badge-desc">'+__(b.desc)+'</div></div>';
  });
  h+='</div></div>';
  // Completed lessons
  h+='<div class="profile-section"><h3>'+__({ar:'📖 تقدمي',en:'📖 My Progress'})+'</h3><div class="progress-mod-list">';
  CM.forEach((m,mi)=>{
    let lessonsDone=m.lessons.filter((_,li)=>isLessonDone(u,m.level,mi,li)).length;
    let pct=Math.round(lessonsDone/m.lessons.length*100);
    h+='<div class="progress-mod-item"><div class="pm-top"><span class="pm-ic">'+m.icon+'</span><span class="pm-title">'+__(m.title)+'</span><span class="pm-pct">'+lessonsDone+'/'+m.lessons.length+'</span></div>'+
      '<div class="pm-bar"><div class="pm-fill" style="width:'+pct+'%"></div></div></div>';
  });
  h+='</div></div>';
  h+='<button class="btn btn-ghost" onclick="logoutUser();showAuth();rT(\'home\')" style="margin:30px auto;display:block">🚪 '+__({ar:'تسجيل الخروج',en:'Logout'})+'</button>';
  h+='</div>';
  return h;
}

/* ===== AI Coffee Assistant ===== */
const AI = {
  kb:[
    {tags:['hello','hi','مرحبا','السلام','مساء','صباح','hey','سلام'],ar:'مرحباً بك في أكاديمية الأيادي البيضاء! 😊 أنا مساعد القهوة الذكي. اسألني عن أي شيء في عالم القهوة: أنواع البن، طرق التحضير، التحميص، الإسبريسو، اللاتيه، وأكثر!',en:'Welcome to White Hands Academy! 😊 I\'m your coffee assistant. Ask me anything about coffee: bean types, brewing methods, roasting, espresso, latte art, and more!'},
    {tags:['اسم','what is your name','who are you','انت مين'],ar:'أنا 🧠 باريستا الذكي — مساعد أكاديمية الأيادي البيضاء. اقدر أساعدك في كل حاجة عن القهوة!',en:'I\'m 🧠 Barista AI — the White Hands Academy assistant. I can help you with everything about coffee!'},
    {tags:['arabica','ارابيكا','أرابيكا','arabic'],ar:'🌱 **البن الأرابيكا** — أشهر أنواع القهوة وأجودها. نسبة كافيين أقل (1.2-1.5%)، طعم أحلى وناعم، رائحة فواكه وزهور. تزرع في مرتفعات 600-2000 متر. أشهر الدول: إثيوبيا، كولومبيا، البرازيل، كينيا.',en:'🌱 **Arabica** — The most popular and highest quality coffee. Lower caffeine (1.2-1.5%), sweeter and smoother taste, fruity and floral aroma. Grown at 600-2000m elevation. Top origins: Ethiopia, Colombia, Brazil, Kenya.'},
    {tags:['robusta','روبوستا','رو busta'],ar:'🌰 **البن الروبوستا** — أقوى وأكثر مرارة من الأرابيكا. نسبة كافيين أعلى (2.2-2.7%)، يُزرع في المنخفضات. يُستخدم بكثرة في الإسبريسو الإيطالي والإبسو لزيادة الكريما والقوام.',en:'🌰 **Robusta** — Stronger and more bitter than Arabica. Higher caffeine (2.2-2.7%), grown at lower elevations. Widely used in Italian espresso blends for better crema and body.'},
    {tags:['espresso','إسبريسو','اسبرسو','اسبريسو','espresso shot'],ar:'☕ **الإسبريسو** — قلب القهوة المختصة. 7-9 جرام بن مطحون ناعم، 25-30 مل ماء بضغط 9 بار، حرارة 92-96°م، وقت 25-30 ثانية. النتيجة: فنجان مركز بكريما ذهبية.',en:'☕ **Espresso** — The heart of specialty coffee. 7-9g finely ground coffee, 25-30ml water at 9 bar pressure, 92-96°C, 25-30 seconds. Result: a concentrated shot with golden crema.'},
    {tags:['لاتيه','latte','لاتيه ارت','latte art'],ar:'🎨 **لاتيه آرت** — فن صب الحليب على الإسبريسو. الحليب المبخر بقوام مخملي يُصب بحركات دقيقة لتشكيل رسومات: قلب، روزيتا، توليب. يحتاج تدريب كثير عشان تتقنه! 🖤',en:'🎨 **Latte Art** — The art of pouring steamed milk over espresso. Velvety textured milk is poured with precise movements to create patterns: heart, rosetta, tulip. Requires lots of practice to master! 🖤'},
    {tags:['v60','في 60','v 60','pour over','pour-over','v60'],ar:'🥃 **V60** — طريقة تحضير بالصب (Pour Over). قمع مخروطي حلزوني، فلتر ورق، بن متوسط النعومة، ماء 93°م. النسبة: 60g بن لكل 1 لتر ماء. وقت: 2:30-3:00 دقيقة. طعم نظيف ومشرق!',en:'🥃 **V60** — A pour-over brewing method. Spiral cone, paper filter, medium-fine grind, 93°C water. Ratio: 60g coffee per 1L water. Time: 2:30-3:00 min. Clean, bright taste!'},
    {tags:['تحميص','roast','roasting','تحميص البن'],ar:'🔥 **التحميص** — يحول البن الأخضر للبني المحمص. 3 مراحل: 1) التجفيف (حتى 160°م) 2) التفاعل (160-190°م) 3) التحميص (190-220°م). أول كراك (First Crack) ~196°م. درجات: فاتح (Light)، متوسط (Medium)، غامق (Dark).',en:'🔥 **Roasting** — Transforms green beans into roasted coffee. 3 stages: 1) Drying (to 160°C) 2) Reaction (160-190°C) 3) Roasting (190-220°C). First crack ~196°C. Levels: Light, Medium, Dark.'},
    {tags:['كريما','crema','golden'],ar:'🟡 **الكريما** — الطبقة الذهبية على وجه الإسبريسو. علامة الجودة! تتكون من زيوت البن وثاني أكسيد الكربون المحبوس تحت ضغط 9 بار. كريما كثيفة بلون البندق المحمص = إسبريسو مثالي.',en:'🟡 **Crema** — The golden layer on top of espresso. A quality mark! Formed by coffee oils and CO₂ trapped under 9 bar pressure. Thick, hazelnut-colored crema = perfect espresso.'},
    {tags:['كافيين','caffeine','الكافيين'],ar:'⚡ **الكافيين** — المنبه الطبيعي في القهوة. الأرابيكا: 1.2-1.5% | الروبوستا: 2.2-2.7%. الإسبريسو (30مل): ~63mg كافيين. فنجان V60 (250مل): ~120-200mg. الجرعة الآمنة يومياً: حتى 400mg.',en:'⚡ **Caffeine** — Coffee\'s natural stimulant. Arabica: 1.2-1.5% | Robusta: 2.2-2.7%. Espresso (30ml): ~63mg. V60 cup (250ml): ~120-200mg. Safe daily limit: up to 400mg.'},
    {tags:['كولد برو','cold brew','كول برو','cold brew'],ar:'🧊 **الكولد برو** — القهوة الباردة المنقوعة. بن خشن + ماء بارد لمدة 12-24 ساعة في الثلاجة. طعم ناعم، حلاوة طبيعية، كافيين عالي. النسبة: 1:8 بن لماء. تقدم مع ثلج وحليب حسب الرغبة!',en:'🧊 **Cold Brew** — Cold steeped coffee. Coarse grounds + cold water for 12-24 hours in the fridge. Smooth taste, natural sweetness, high caffeine. Ratio: 1:8 coffee to water. Serve over ice!'},
    {tags:['طعم','flavor','نكهة','taste','sweet','حلو','مر','bitter','حامض','sour','fruity','فواكه'],ar:'👅 **نكهات القهوة** — تختلف حسب: أصل البن، درجة التحميص، طريقة التحضير. الفواكه والتوت ← بن إثيوبي. الشوكولاتة والمكسرات ← بن برازيلي. الزهور والياسمين ← بن كيني. الحموضة الزائدة ← تحميص فاتح أو استخلاص زائد.',en:'👅 **Coffee Flavors** — Vary by: origin, roast level, brewing method. Fruits & berries ← Ethiopian. Chocolate & nuts ← Brazilian. Floral & jasmine ← Kenyan. Excess acidity ← under-roasted or over-extracted.'},
    {tags:['باريستا','barista','skill','مهارات'],ar:'👨‍🍳 **مهارات الباريستا** — 1) ضبط الطاحونة (Grinder Calibration) 2) توزيع البن (Distribution) 3) الضغط (Tamping) بقوة ~15kg 4) تحضير الإسبريسو 5) تبخير الحليب 6) اللاتيه آرت. أكاديمية الأيادي البيضاء بتعلمك كل ده! 💪',en:'👨‍🍳 **Barista Skills** — 1) Grinder Calibration 2) Distribution 3) Tamping (~15kg pressure) 4) Espresso pulling 5) Milk steaming 6) Latte Art. White Hands Academy teaches all of this! 💪'},
    {tags:['طحنة','grind','grind size','ناعم','خشن','coarse'],ar:'⚙️ **الطحنة** — حجم الطحن يحدد سرعة الاستخلاص. ناعم جداً ← إبريك (Turkish). ناعم ← إسبريسو. متوسط ← V60. متوسط خشن ← Chemex. خشن ← French Press. خشن جداً ← Cold Brew.',en:'⚙️ **Grind Size** — Determines extraction speed. Extra fine ← Turkish. Fine ← Espresso. Medium ← V60. Medium-coarse ← Chemex. Coarse ← French Press. Extra coarse ← Cold Brew.'},
    {tags:['ماء','water','نسبة','ratio'],ar:'💧 **الماء** — 98% من فنجان القهوة! TDS مثالي: 100-150ppm. كلوريد الكالسيوم والمغنيسيوم يساعدان في الاستخلاص. النسبة الذهبية: 60g بن / 1 لتر ماء (لـ V60). للإسبريسو: 1:2 (بن:ماء) = 18g بن → 36g إسبريسو.',en:'💧 **Water** — 98% of your coffee cup! Ideal TDS: 100-150ppm. Calcium and magnesium help extraction. Golden ratio: 60g coffee / 1L water (for V60). For espresso: 1:2 (coffee:water) = 18g → 36g espresso.'},
    {tags:['شهادة','certificate','cert','اعتماد'],ar:'📜 **الشهادات** — أكاديمية الأيادي البيضاء تمنح شهادات إتمام لكل مستوى (A, B, C) بعد اجتياز الاختبارات. الشهادات معتمدة على منهج SCA العالمي. أظهر مهاراتك واحصل على شهادتك! 🎓',en:'📜 **Certificates** — White Hands Academy awards completion certificates for each level (A, B, C) after passing exams. Certificates are SCA-aligned. Show your skills and earn your certificate! 🎓'},
    {tags:['مستوى','level','levels','levels a','levels b','levels c'],ar:'📚 **المستويات:** A (مبتدئ): أساسيات القهوة، أصل البن، تحضير بسيط. B (متوسط): علم التحميص، الإسبريسو، اللاتيه. C (متقدم): تحكيم القهوة، كابينج، إدارة مقهى. ابدأ من A وانتقل للاحتراف!',en:'📚 **Levels:** A (Beginner): Coffee basics, bean origins, simple brewing. B (Intermediate): Roasting science, espresso, latte art. C (Advanced): Coffee judging, cupping, cafe management. Start from A and level up!'},
    {tags:['كابينج','cupping','tasting','تذوق'],ar:'🧪 **الكابينج** — التحكيم الاحترافي للقهوة. تطبيق بروتوكول SCA: تقييم الرائحة (Fragrance/Aroma)، النكهة (Flavor)، الحموضة (Acidity)، القوام (Body)، التوازن (Balance)، النهاية (Aftertaste). كل صفة من 0-10.',en:'🧪 **Cupping** — Professional coffee judging. SCA protocol: evaluate Fragrance/Aroma, Flavor, Acidity, Body, Balance, Aftertaste. Each attribute scored 0-10.'},
    {tags:['معالجة','processing','مغسول','washed','طبيعي','natural','عسل','honey'],ar:'🫘 **طرق المعالجة:** المغسول (Washed): نظيف، حموضة عالية. الطبيعي (Natural): فواكه، حلاوة، ثقل. العسل (Honey): وسط بينهم. كل طريقة بتأثر على طعم القهوة النهائي.',en:'🫘 **Processing Methods:** Washed: clean, high acidity. Natural: fruity, sweet, heavy body. Honey: in between. Each method affects the final cup taste.'},
    {tags:['زراعة','grow','مزرعة','farm','coffee cherry','الكرز'],ar:'🌿 **زراعة البن** — شجرة البن تحتاج 3-5 سنين عشان تثمر. الكرزة الحمراء = ناضجة. كل كرزة فيها 2 بذرة (حبة بن). موسم الحصاد: 1-2 مرة في السنة. أفضل زراعة في المرتفعات >1000م.',en:'🌿 **Coffee Growing** — Coffee trees take 3-5 years to bear fruit. Red cherry = ripe. Each cherry contains 2 seeds (coffee beans). Harvest: 1-2 times per year. Best grown at elevations >1000m.'}
  ],
  fallback:{ar:'🤔 ما عنديش معلومة كافية عن ده. جرب تسأل عن: أنواع البن، طرق التحضير، التحميص، الإسبريسو، اللاتيه، أو المستويات الدراسية!',en:'🤔 I don\'t have enough info on that. Try asking about: coffee types, brewing methods, roasting, espresso, latte art, or course levels!'},
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
      '<button class="ai-btn" id="aiBtn" onclick="AI.toggle()" title="🧠 باريستا الذكي">🧠</button>'+
      '<div class="ai-panel" id="aiPanel">'+
        '<div class="ai-hdr"><span>🧠</span> '+__({ar:'باريستا الذكي',en:'Barista AI'})+' <span style="font-size:.6rem;opacity:.5;font-weight:400">v1.0</span>'+
          '<button class="ai-close" onclick="AI.toggle()">✕</button></div>'+
        '<div class="ai-msgs" id="aiMsgs"></div>'+
        '<div class="ai-chips" id="aiChips"></div>'+
        '<div class="ai-inp-wrap">'+
          '<input class="ai-inp" id="aiInp" placeholder="'+__({ar:'اسأل عن القهوة...',en:'Ask about coffee...'})+'" onkeydown="if(event.key===\'Enter\')AI.send()">'+
          '<button class="ai-send" onclick="AI.send()">➤</button></div></div>'
    );
    this.chips=[{ar:'☕ الإسبريسو',en:'☕ Espresso'},{ar:'🥃 V60',en:'🥃 V60'},{ar:'🔥 التحميص',en:'🔥 Roasting'},{ar:'🌱 أرابيكا',en:'🌱 Arabica'},{ar:'🎨 لاتيه آرت',en:'🎨 Latte Art'},{ar:'⚙️ الطحنة',en:'⚙️ Grind Size'}];
    this.renderChips();
    this.addMsg(__({ar:'👋 مرحباً! أنا 🧠 باريستا الذكي. اسألني أي شيء عن القهوة!',en:'👋 Hi! I\'m 🧠 Barista AI. Ask me anything about coffee!'}),'bot');
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
    if(b)b.textContent=open?'✕':'🧠';
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
    txt=txt.replace(/\[\[(.+?)\]\]/g,'<a class="ai-link" href="#" onclick="rT(\'curriculum\');AI.toggle()">📖 $1</a>');
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
  if(_seq===_magic){_seq='';setLang(lang==='ar'?'en':'ar');to(lang==='ar'?'🌐 Switched to English':'🌐 تم التبديل للعربية')}
});
function showBlocked(){
  document.getElementById('loading-screen')?.remove();
  document.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0d0d1a;color:#e8d5a3;font-family:system-ui;text-align:center;padding:20px"><div><div style="font-size:4rem;margin-bottom:20px">🚫</div><h1 style="font-size:1.7rem;margin-bottom:12px">'+__({ar:'الوصول مقيد',en:'Access Restricted'})+'</h1><p style="font-size:.95rem;color:#a88a30;max-width:400px;margin:0 auto">'+__({ar:'هذا الموقع متاح فقط من جهاز المسؤول.',en:'This site is available only from the admin\'s device.'})+'</p></div></div>';
}
async function checkIP(){
  if(firebaseReady) return true;
  let adminIP = localStorage.getItem('wha_admin_ip');
  if(!adminIP) return true;
  try {
    let res = await fetch('https://ip-api.com/json/?fields=query&t='+Date.now());
    let d = await res.json();
    if(d.query && d.query !== adminIP) return false;
  } catch(e){}
  return true;
}
(async function(){
  initLoading();
  initParticles();
  initSmoothScroll();
  initFirebase();
  let ua = navigator.language || navigator.userLanguage || 'en';
  setLang(ua.startsWith('ar') ? 'ar' : 'en');
  // Check IP before allowing any access
  let ipOk = await checkIP();
  if(!ipOk){ showBlocked(); return }
    // If Firebase is not configured, use offline localStorage mode
  if(!firebaseReady){
    // Force re-login for all users (new approval system)
    let ver=localStorage.getItem('wha_auth_v');
    if(ver!=='3'){
      clearOldSessions();
      // Reset old active users to pending
      try {
        let all=JSON.parse(localStorage.getItem('wha_users')||'[]');
        all.forEach(u=>{if(u.role!=='admin' && u.email!==ADMIN_EMAIL)u.role='pending'});
        localStorage.setItem('wha_users',JSON.stringify(all));
      } catch(e){}
      localStorage.setItem('wha_auth_v','3');
    }
    let u=getCurUser();
    updateHeaderUser();
    if(!u||u.role==='pending'||u.role==='banned'){
      if(u&&u.role==='banned') localStorage.removeItem('wha_curUser');
      showAuth(); return;
    }
    rT('home');
  } else {
    // Firebase handles auth state; show auth overlay immediately if no user
    setTimeout(() => {
      if(!curUser){ showAuth(); return }
      updateHeaderUser();
      rT('home');
    }, 200);
  }
  initUI();
  setTimeout(()=>{AI.init()},400);
})();
