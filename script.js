/* NEXUS prototype JavaScript
   Demo-only state. Replace the data layer with Firebase later. */
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];

const demoPosts = [
  {id:1,name:"ShadowX",avatar:"SX",time:"2 hours ago",text:"Just won my first championship match! 🏆 The grind never stops. Who wants to challenge me?",likes:24,comments:[]},
  {id:2,name:"ProGamer",avatar:"PG",time:"5 hours ago",text:"Building a new squad for the upcoming NEXUS tournament. Looking for skilled teammates! 🎮",likes:18,comments:[]},
  {id:3,name:"PixelWolf",avatar:"PW",time:"Yesterday",text:"New setup is ready. Time to queue ranked! ✨",likes:12,comments:[]}
];
const defaultLeaderboard = [
  {rank:1,name:"ShadowX",game:"BGMI",wins:142,points:9850,tier:"Diamond"},
  {rank:2,name:"ProGamer",game:"Valorant",wins:128,points:9200,tier:"Diamond"},
  {rank:3,name:"NightWolf",game:"Free Fire",wins:115,points:8750,tier:"Platinum"},
  {rank:4,name:"SniperX",game:"BGMI",wins:99,points:7900,tier:"Platinum"},
  {rank:5,name:"Phantom",game:"Valorant",wins:88,points:7250,tier:"Gold"},
  {rank:6,name:"AstroPlay",game:"Minecraft",wins:76,points:6800,tier:"Gold"}
];

let posts = load("nexus_posts", demoPosts);
let currentChannel = "general";
let currentServer = "Gaming Hub";
let serverData = load("nexus_servers", {
  "Gaming Hub": {channels:["general","gaming","tournaments","memes","announcements"],messages:{}},
  "Pro Players": {channels:["general","recruitment","scrims"],messages:{}},
  "Friends Zone": {channels:["general","introductions","off-topic"],messages:{}}
});
let galleryUrls = [];

function load(key, fallback) {
  try { const value=localStorage.getItem(key); return value ? JSON.parse(value) : structuredClone(fallback); }
  catch { return structuredClone(fallback); }
}
function save(key,value) {
  try { localStorage.setItem(key,JSON.stringify(value)); }
  catch { toast("Browser storage is full. This item may not be saved."); }
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
let toastTimer;
function toast(message) {
  const el=$("#toast"); if(!el) return;
  el.textContent=message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),2600);
}

function navigate(page) {
  const target=$("#"+page);
  if(!target) return;
  $$(".page").forEach(p=>p.classList.toggle("active",p===target));
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  $("#pageTitle").textContent=target.dataset.title || page;
  window.scrollTo({top:0,behavior:"smooth"});
  if(page==="servers") renderServers();
  if(page==="leaderboard") renderLeaderboard();
}
document.addEventListener("click",e=>{
  const pageButton=e.target.closest("[data-page]");
  if(pageButton){e.preventDefault();navigate(pageButton.dataset.page);}
});
$("#menuToggle").addEventListener("click",()=>$("#sidebar").classList.toggle("collapsed"));

function renderPosts() {
  const html=posts.map(post=>`
    <article class="feed-post" data-post="${post.id}">
      <div class="feed-author"><div class="mini-avatar">${escapeHTML(post.avatar)}</div><div><strong>${escapeHTML(post.name)}</strong><small>${escapeHTML(post.time)}</small></div></div>
      <p>${escapeHTML(post.text)}</p>
      <div class="post-actions">
        <button class="post-action" data-like="${post.id}">♥ ${post.likes} likes</button>
        <button class="post-action" data-comment-toggle="${post.id}">▤ ${post.comments.length} comments</button>
      </div>
      <div class="comment-box" id="commentBox${post.id}" hidden>
        <form class="comment-form" data-comment-form="${post.id}" style="display:flex;gap:7px;margin-top:10px">
          <input name="comment" maxlength="240" placeholder="Write a comment..." style="flex:1;min-width:0;background:#0d0b14;border:1px solid var(--line);border-radius:7px;padding:9px;color:white;font-size:10px">
          <button class="btn btn-glass">Send</button>
        </form>
        ${post.comments.map(c=>`<p style="font-size:9px;color:#bdb3ca;margin-top:8px">↳ ${escapeHTML(c)}</p>`).join("")}
      </div>
    </article>`).join("");
  $("#communityFeed").innerHTML=html;
  $("#dashboardFeed").innerHTML=html || '<p class="muted">No posts yet. Start the conversation!</p>';
}
$("#publishPost").addEventListener("click",()=>{
  const field=$("#postText"), text=field.value.trim();
  if(!text){toast("Write something before publishing.");return;}
  posts.unshift({id:Date.now(),name:load("nexus_name","NEXUS Player"),avatar:(load("nexus_name","N")||"N").slice(0,2).toUpperCase(),time:"Just now",text,likes:0,comments:[]});
  save("nexus_posts",posts);field.value="";renderPosts();toast("Your demo post was published.");
});
document.addEventListener("click",e=>{
  const like=e.target.closest("[data-like]");
  if(like){const post=posts.find(p=>p.id===Number(like.dataset.like));if(post){post.likes++;save("nexus_posts",posts);renderPosts();}}
  const toggle=e.target.closest("[data-comment-toggle]");
  if(toggle){const box=$("#commentBox"+toggle.dataset.commentToggle);if(box)box.hidden=!box.hidden;}
});
document.addEventListener("submit",e=>{
  const form=e.target.closest("[data-comment-form]");
  if(!form)return;
  e.preventDefault();const input=form.elements.comment;const text=input.value.trim();if(!text)return;
  const post=posts.find(p=>p.id===Number(form.dataset.commentForm));if(post){post.comments.push(text);save("nexus_posts",posts);renderPosts();const box=$("#commentBox"+post.id);if(box)box.hidden=false;}
});

function updateGalleryCount(){const count=$$(".gallery-card").length;$("#galleryCount").textContent=`${count} moment${count===1?"":"s"}`;}
$("#imageUpload").addEventListener("change",e=>{
  const files=[...e.target.files];if(!files.length)return;
  files.forEach(file=>{
    if(!file.type.startsWith("image/")){toast("Please choose image files only.");return;}
    if(file.size>5*1024*1024){toast(`${file.name} is larger than 5 MB.`);return;}
    const reader=new FileReader();
    reader.onload=()=>{
      const card=document.createElement("article");card.className="gallery-card";
      const img=document.createElement("img");img.src=reader.result;img.alt="User uploaded gaming moment";
      const caption=document.createElement("div");caption.className="gallery-caption";
      const strong=document.createElement("strong");strong.textContent=file.name;
      const small=document.createElement("span");small.textContent="Local browser upload";
      caption.append(strong,small);card.append(img,caption);$("#galleryGrid").prepend(card);updateGalleryCount();
    };
    reader.readAsDataURL(file);
  });
  e.target.value="";
});
updateGalleryCount();

function renderServers(){
  const names=Object.keys(serverData);
  $("#serverBrowser").innerHTML=names.map(name=>`<button class="server-chip ${name===currentServer?"active":""}" data-select-server="${escapeHTML(name)}">${escapeHTML(name)}</button>`).join("");
  const server=serverData[currentServer] || serverData[names[0]];
  if(!server)return;
  $("#activeServerName").textContent=currentServer;
  $("#channelButtons").innerHTML=server.channels.map(ch=>`<button class="channel-button ${ch===currentChannel?"active":""}" data-channel="${escapeHTML(ch)}"># ${escapeHTML(ch)}</button>`).join("");
  if(!server.channels.includes(currentChannel))currentChannel=server.channels[0];
  $("#activeChannelName").textContent="# "+currentChannel;
  $("#chatInput").placeholder="Message #"+currentChannel+"...";
  renderChat();
}
function renderChat(){
  const server=serverData[currentServer];if(!server)return;
  const messages=(server.messages[currentChannel]||[]);
  $("#chatHistory").innerHTML=messages.length?messages.map(m=>`<div class="chat-line"><strong>${escapeHTML(m.name)}</strong>${escapeHTML(m.text)}</div>`).join(""):`<div class="chat-line"><strong>NEXUS Bot</strong> Welcome to #${escapeHTML(currentChannel)}. Be respectful and have fun! 🎮</div>`;
  $("#chatHistory").scrollTop=$("#chatHistory").scrollHeight;
}
document.addEventListener("click",e=>{
  const chip=e.target.closest("[data-select-server]");
  if(chip){currentServer=chip.dataset.selectServer;currentChannel=serverData[currentServer].channels[0];renderServers();}
  const channel=e.target.closest("[data-channel]");
  if(channel){currentChannel=channel.dataset.channel;renderServers();}
  const shortcut=e.target.closest("[data-server]");
  if(shortcut){currentServer=shortcut.dataset.server;if(!serverData[currentServer])currentServer=Object.keys(serverData)[0];currentChannel=serverData[currentServer].channels[0];navigate("servers");}
});
$("#chatForm").addEventListener("submit",e=>{
  e.preventDefault();const input=$("#chatInput"),text=input.value.trim();if(!text)return;
  const server=serverData[currentServer];server.messages[currentChannel] ||= [];
  server.messages[currentChannel].push({name:load("nexus_name","NEXUS Player"),text});
  save("nexus_servers",serverData);input.value="";renderChat();
});
function createServer(){
  const name=prompt("Choose a name for your server:");
  if(!name||!name.trim())return;
  const clean=name.trim().slice(0,32);
  if(serverData[clean]){toast("A server with that name already exists.");return;}
  serverData[clean]={channels:["general","gaming","introductions"],messages:{}};
  save("nexus_servers",serverData);currentServer=clean;currentChannel="general";renderServers();toast("Demo server created.");
}
$("#createServer").addEventListener("click",createServer);
$("#quickCreateServer").addEventListener("click",createServer);
renderServers();

function renderLeaderboard(filter="All games"){
  const rows=filter==="All games"?defaultLeaderboard:defaultLeaderboard.filter(p=>p.game===filter);
  $("#leaderboardRows").innerHTML=rows.map((p,i)=>`<tr><td class="rank-number">#${i+1}</td><td>${escapeHTML(p.name)}</td><td>${escapeHTML(p.game)}</td><td>${p.wins}</td><td>${p.points.toLocaleString()}</td><td>${escapeHTML(p.tier)}</td></tr>`).join("") || '<tr><td colspan="6">No demo players for this game.</td></tr>';
  if($("#miniLeaderboard"))$("#miniLeaderboard").innerHTML=defaultLeaderboard.slice(0,3).map(p=>`<div class="mini-rank"><span class="rank-num">0${p.rank}</span><strong>${escapeHTML(p.name)}</strong><small>${p.points.toLocaleString()} pts</small></div>`).join("");
}
$("#leaderboardGame").addEventListener("change",e=>renderLeaderboard(e.target.value));
renderLeaderboard();

function addNotification(title,message){
  const row=document.createElement("div");row.className="notification-row";
  row.innerHTML='<span class="notice-icon purple-notice">✦</span><div></div><i class="unread-dot"></i>';
  const div=row.querySelector("div");const strong=document.createElement("strong");strong.textContent=title;const p=document.createElement("p");p.textContent=message;const small=document.createElement("small");small.textContent="Just now · Demo notification";div.append(strong,p,small);$("#notificationList").prepend(row);
}
$("#clearNotifications").addEventListener("click",()=>{$$(".unread-dot").forEach(el=>el.remove());toast("Notifications marked as read.");});

$("#suggestGame").addEventListener("click",()=>{const game=prompt("Which game should NEXUS support?");if(game&&game.trim())toast("Thanks! "+game.trim()+" added to your local suggestions.");});
document.addEventListener("click",e=>{
  const game=e.target.closest("[data-game]");
  if(game){toast(game.dataset.game+" game hub is a demo preview.");}
  const register=e.target.closest(".register-event");
  if(register){toast("Demo registration selected. Sign-in and server validation will be added with Firebase.");}
  const join=e.target.closest(".join-team");
  if(join){join.textContent="Request noted ✓";join.disabled=true;toast("Demo team request noted locally.");}
  const friend=e.target.closest(".friend-action");
  if(friend){friend.textContent=friend.textContent==="Add friend"?"Request sent ✓":"Add friend";toast("Friend request is a local demo only.");}
});

$("#createTeam").addEventListener("click",()=>{
  const name=prompt("Enter your team name:");
  if(!name||!name.trim())return;
  const card=document.createElement("article");card.className="team-card";
  const emblem=document.createElement("div");emblem.className="team-emblem";emblem.textContent=name.trim().slice(0,2).toUpperCase();
  const info=document.createElement("div");info.className="team-info";
  const tag=document.createElement("span");tag.className="live-tag";tag.textContent="NEW TEAM";
  const title=document.createElement("h3");title.textContent=name.trim();
  const desc=document.createElement("p");desc.textContent="Not assigned · 1 / 5 players";
  const footer=document.createElement("div");footer.className="team-footer";const note=document.createElement("span");note.textContent="Created locally";footer.append(note);info.append(tag,title,desc,footer);card.append(emblem,info);$("#teamGrid").prepend(card);toast("Demo team created.");
});

function setProfile(name,bio){
  const safe=name.trim()||"NEXUS Player";
  $("#profileDisplayName").textContent=safe;$("#sidebarName").textContent=safe;$("#topName").textContent=safe.split(" ")[0];
  $("#sidebarAvatar").textContent=safe.slice(0,1).toUpperCase();$("#topAvatar").textContent=safe.slice(0,1).toUpperCase();$("#profileAvatar").textContent=safe.slice(0,1).toUpperCase();
  $("#profileBio").textContent=bio;
  $("#settingsName").value=safe;$("#settingsBio").value=bio;
}
const initialName=load("nexus_name","NEXUS Player");
const initialBio=load("nexus_bio","Gaming enthusiast. Here to meet great teammates, share highlights and compete.");
setProfile(initialName,initialBio);
$("#editProfile").addEventListener("click",()=>navigate("settings"));
$("#saveSettings").addEventListener("click",()=>{
  const name=$("#settingsName").value.trim().slice(0,24)||"NEXUS Player";
  const bio=$("#settingsBio").value.trim().slice(0,180);
  save("nexus_name",name);save("nexus_bio",bio);setProfile(name,bio);toast("Profile updated on this device.");
});
$("#resetDemo").addEventListener("click",()=>{
  if(!confirm("Reset NEXUS demo posts, servers and profile on this browser?"))return;
  ["nexus_posts","nexus_servers","nexus_name","nexus_bio"].forEach(k=>localStorage.removeItem(k));
  location.reload();
});

$("#globalSearch").addEventListener("keydown",e=>{
  if(e.key!=="Enter")return;
  const q=e.target.value.toLowerCase().trim();if(!q)return;
  const match=[...$$(".nav-item")].find(b=>b.textContent.toLowerCase().includes(q));
  if(match){navigate(match.dataset.page);toast("Opened "+match.textContent.trim());}
  else toast("No matching section found.");
});

renderPosts();
