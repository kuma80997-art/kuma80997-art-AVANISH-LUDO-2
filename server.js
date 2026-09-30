const express=require("express");const http=require("http");const {Server}=require("socket.io");
const app=express(),server=http.createServer(app),io=new Server(server);app.use(express.static("public"));
app.get("/health",(q,r)=>r.json({ok:true,game:"AVANISH LUDO"}));
const rooms=new Map(),C=["red","green","yellow","blue"];
io.on("connection",s=>{
s.on("createRoom",({name}={},cb)=>{let c;do{c=Math.random().toString(36).slice(2,7).toUpperCase()}while(rooms.has(c));let r={code:c,players:[],turn:0,started:false};r.players.push({id:s.id,name:String(name||"Player 1").slice(0,20),color:C[0]});rooms.set(c,r);s.join(c);s.data.room=c;cb({ok:true,code:c,color:C[0]});send(r)});
s.on("joinRoom",({code,name}={},cb)=>{code=String(code||"").trim().toUpperCase();let r=rooms.get(code);if(!r)return cb({ok:false,error:"Room not found"});if(r.players.length>=4)return cb({ok:false,error:"Room is full"});if(r.started)return cb({ok:false,error:"Game already started"});let color=C[r.players.length];r.players.push({id:s.id,name:String(name||"Player").slice(0,20),color});s.join(code);s.data.room=code;r.started=r.players.length>=2;cb({ok:true,code,color});send(r);if(r.started)io.to(code).emit("game:start")});
s.on("rollDice",cb=>{let r=rooms.get(s.data.room);if(!r||!r.started)return cb({ok:false,error:"Game not started"});let p=r.players[r.turn];if(!p||p.id!==s.id)return cb({ok:false,error:"Not your turn"});let v=Math.floor(Math.random()*6)+1;io.to(r.code).emit("dice:rolled",{color:p.color,value:v});if(v!==6)r.turn=(r.turn+1)%r.players.length;send(r);cb({ok:true,value:v})});
s.on("disconnect",()=>{let r=rooms.get(s.data.room);if(!r)return;r.players=r.players.filter(p=>p.id!==s.id);if(!r.players.length)return rooms.delete(r.code);r.players.forEach((p,i)=>p.color=C[i]);r.turn=Math.min(r.turn,r.players.length-1);r.started=r.players.length>=2;send(r)})});
function send(r){io.to(r.code).emit("room:update",{code:r.code,players:r.players,turn:r.turn,started:r.started})}
const PORT=process.env.PORT||3000;server.listen(PORT,"0.0.0.0",()=>console.log("AVANISH LUDO on "+PORT));
