// STOP — servidor local (Node 18+, sem dependências). Uso: node server.js
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),os=require('os');
const PORT=process.env.PORT||3000,DBF=path.join(process.env.DATA_DIR||__dirname,'db.json');
let db={users:{},tokens:{}};try{db=JSON.parse(fs.readFileSync(DBF))}catch{}
const save=()=>fs.writeFileSync(DBF,JSON.stringify(db));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');

// Dicionário (valida automaticamente; o que não souber vai a votação)
const D={
animal:'macaco,gato,cao,cavalo,vaca,porco,galinha,pato,leao,tigre,elefante,girafa,zebra,urso,lobo,raposa,coelho,rato,cobra,tartaruga,sapo,peixe,tubarao,baleia,golfinho,polvo,aguia,coruja,papagaio,pardal,abelha,formiga,borboleta,aranha,camelo,canguru,cabra,carneiro,ovelha,burro,morcego,lagarto,jacare,crocodilo,hipopotamo,rinoceronte,gorila,panda,pinguim,foca,lontra,veado,javali,esquilo,mosca,lula,caranguejo,lagosta,gaivota,cisne,pombo,peru,ganso,leopardo,hiena,lince,minhoca,caracol,escorpiao,vespa,grilo,salmao,atum,sardinha,truta,enguia,marmota,mula,morsa,mosquito',
pais:'portugal,espanha,franca,italia,alemanha,brasil,argentina,mexico,canada,china,japao,india,russia,angola,mocambique,cabo verde,egito,marrocos,africa do sul,australia,inglaterra,irlanda,suica,suecia,noruega,dinamarca,finlandia,holanda,belgica,austria,polonia,grecia,turquia,chile,peru,colombia,venezuela,uruguai,paraguai,bolivia,cuba,ucrania,hungria,tailandia,vietna,coreia do sul,indonesia,malasia,filipinas,nigeria,quenia,etiopia,senegal,ira,iraque,israel,arabia saudita,nepal,paquistao,madagascar,monaco,malta,luxemburgo,estados unidos,reino unido,nova zelandia,equador,panama,croacia,servia,romenia,bulgaria,islandia,tunisia,argelia,gana,mali',
cidade:'lisboa,porto,braga,coimbra,faro,madrid,barcelona,paris,londres,roma,milao,berlim,munique,viena,praga,moscovo,nova iorque,toquio,pequim,xangai,seul,banguecoque,mumbai,deli,cairo,casablanca,marraquexe,luanda,maputo,praia,sao paulo,rio de janeiro,brasilia,salvador,buenos aires,montevideu,santiago,lima,bogota,caracas,miami,los angeles,chicago,toronto,montreal,sidney,melbourne,amesterdao,bruxelas,genebra,zurique,atenas,istambul,dubai,varsovia,budapeste,dublin,edimburgo,manchester,liverpool,sevilha,valencia,funchal,aveiro,viseu,leiria,setubal,evora,guimaraes,beja,santarem,braganca,portimao,lagos,cascais,sintra,almada,oeiras,matosinhos',
comida:'massa,arroz,pizza,pao,bolo,batata,carne,peixe,frango,sopa,salada,queijo,fiambre,presunto,ovo,bacalhau,francesinha,hamburguer,lasanha,feijoada,cozido,tosta,sandes,sushi,taco,paella,maca,banana,laranja,pera,uva,morango,melancia,melao,manga,ananas,cereja,pessego,limao,kiwi,tomate,cenoura,cebola,alface,couve,milho,feijao,lentilhas,bife,salsicha,chourico,pudim,gelado,chocolate,mousse,omelete,panqueca,bolacha,biscoito,croissant,tarte,empada,rissol,croquete,esparguete',
profissao:'medico,enfermeiro,professor,engenheiro,advogado,juiz,policia,bombeiro,pedreiro,carpinteiro,canalizador,eletricista,mecanico,motorista,piloto,cozinheiro,padeiro,pescador,agricultor,pintor,musico,cantor,ator,atriz,escritor,jornalista,arquiteto,dentista,veterinario,farmaceutico,programador,cientista,militar,marinheiro,secretario,contabilista,economista,gestor,barbeiro,cabeleireiro,costureiro,sapateiro,jardineiro,vendedor,taxista,arbitro,futebolista,treinador,fotografo,designer,psicologo,padre,astronauta,atleta,mineiro,detetive,carteiro'};
Object.assign(D,{
nome:'ana,maria,joao,pedro,miguel,gabriel,tiago,rui,rita,sofia,ines,beatriz,carla,catarina,diogo,andre,bruno,carlos,daniel,eduardo,filipe,francisco,goncalo,hugo,jose,luis,manuel,marco,nuno,paulo,ricardo,samuel,sergio,tomas,vasco,vitor,alice,barbara,claudia,diana,eva,helena,joana,julia,laura,leonor,lara,marta,mariana,matilde,monica,patricia,paula,raquel,sara,teresa,vera,antonio,alexandre,afonso,david,fabio,henrique,isabel,mafalda,madalena,margarida,susana,tania,telma,vanessa,mario,lucas,luisa,jorge,duarte,cristiano,bernardo,adriana',
apelido:'silva,santos,ferreira,pereira,oliveira,costa,rodrigues,martins,jesus,sousa,fernandes,goncalves,gomes,lopes,marques,alves,almeida,ribeiro,pinto,carvalho,teixeira,moreira,correia,mendes,nunes,soares,vieira,monteiro,cardoso,rocha,neves,coelho,cruz,cunha,pires,ramos,reis,machado,araujo,tavares',
bebida:'agua,cafe,cha,leite,sumo,cerveja,vinho,vodka,whisky,rum,gin,sidra,refrigerante,cola,limonada,batido,champanhe,licor,ginja,porto,sangria,mojito,caipirinha,martini,tequila,cappuccino,fanta,sprite,pepsi,aguardente,bagaco,moscatel,medronho,espumante,expresso,galao,bica,imperial,sagres,coca cola,red bull,compal,ice tea',
cor:'azul,verde,vermelho,amarelo,laranja,roxo,rosa,preto,branco,cinzento,castanho,dourado,prateado,violeta,bege,turquesa,lilas,magenta,ciano,bordeaux,marrom,carmim,creme,salmao,coral,anil'});
for(const k in D)if(typeof D[k]=='string')D[k]=new Set(D[k].split(',').map(norm));
const DE={
animal:'ant,bear,bee,bird,camel,cat,cow,crab,deer,dog,dolphin,donkey,duck,eagle,elephant,fish,fox,frog,giraffe,goat,goose,hippo,horse,lion,lizard,monkey,mouse,owl,panda,parrot,pig,rabbit,rat,shark,sheep,snake,spider,tiger,turtle,whale,wolf,zebra,kangaroo,koala,penguin,gorilla,hamster,leopard,moose,otter,seal,squirrel,swan,turkey,butterfly,octopus',
country:'argentina,australia,austria,belgium,brazil,canada,chile,china,colombia,cuba,denmark,egypt,england,finland,france,germany,greece,hungary,iceland,india,indonesia,iran,iraq,ireland,israel,italy,japan,kenya,mexico,morocco,nepal,netherlands,new zealand,nigeria,norway,pakistan,peru,poland,portugal,russia,scotland,spain,sweden,switzerland,thailand,turkey,ukraine,united states,vietnam,wales,angola,bolivia,croatia,ecuador,jamaica,malta,panama,qatar,serbia,uruguay,venezuela',
city:'amsterdam,athens,atlanta,barcelona,beijing,berlin,boston,brussels,cairo,chicago,dallas,delhi,dublin,dubai,edinburgh,geneva,havana,houston,istanbul,lisbon,london,los angeles,madrid,melbourne,miami,milan,moscow,mumbai,munich,nairobi,new york,oslo,paris,prague,rome,seattle,seoul,shanghai,singapore,sydney,tokyo,toronto,vienna,warsaw,washington,zurich,porto,manchester,liverpool,glasgow,denver',
food:'apple,avocado,bacon,banana,beans,bread,burger,butter,cake,carrot,cheese,cherry,chicken,chocolate,cookie,corn,donut,egg,fish,garlic,grape,ham,honey,ice cream,jam,lemon,lettuce,mango,melon,mushroom,noodles,nuts,olive,onion,orange,pancake,pasta,peach,pear,pie,pizza,potato,rice,salad,salmon,sandwich,soup,steak,strawberry,sushi,taco,tomato,tuna,waffle,watermelon,yogurt',
name:'adam,alex,alice,amy,andrew,anna,ben,beth,bob,carl,charlie,chris,claire,daniel,david,diana,ed,emily,emma,eric,eva,frank,george,grace,hannah,harry,helen,henry,jack,james,jane,jason,jenny,john,julia,kate,kevin,laura,leo,lily,lucy,luke,maria,mark,mary,matt,mia,mike,nick,noah,olivia,paul,peter,rachel,rose,ryan,sam,sarah,sophie,steve,tom,victor,will,zoe',
surname:'smith,johnson,williams,brown,jones,miller,davis,wilson,taylor,clark,hall,lewis,young,king,wright,scott,green,baker,adams,nelson,hill,moore,evans,turner,parker,cooper,morgan,bell,murphy,reed',
drink:'water,coffee,tea,milk,juice,beer,wine,vodka,whiskey,rum,gin,soda,cola,lemonade,smoothie,champagne,cider,cocktail,tequila,latte,espresso,mojito,sprite,fanta,pepsi,martini',
color:'red,blue,green,yellow,orange,purple,pink,black,white,gray,grey,brown,gold,silver,violet,beige,teal,cyan,magenta,navy,maroon,turquoise',
job:'actor,artist,baker,barber,chef,cook,dentist,doctor,driver,engineer,farmer,firefighter,judge,lawyer,mechanic,musician,nurse,painter,pilot,plumber,police officer,programmer,scientist,singer,soldier,teacher,vet,waiter,writer,electrician,carpenter,athlete,astronaut,designer'};
for(const k in DE)DE[k]=new Set(DE[k].split(',').map(norm));
// Dicionários extra: dicts/<categoria>.txt (PT) ou dicts/en_<category>.txt (EN), uma palavra por linha
try{const dd=path.join(__dirname,'dicts');for(const f of fs.readdirSync(dd))if(f.endsWith('.txt')){const en=f.startsWith('en_'),k=norm(f.slice(en?3:0,-4)),T=en?DE:D;T[k]=T[k]||new Set();fs.readFileSync(path.join(dd,f),'utf8').split(/\r?\n/).forEach(w=>{w=norm(w);if(w)T[k].add(w)})}}catch{}
const mp=T=>{const M={};for(const[c,w]of Object.entries(T))w.forEach(x=>(M[x]=M[x]||new Set()).add(c));return M},MAP=mp(D),MAPE=mp(DE);
const socks=new Set(),U=n=>db.users[String(n||'').toLowerCase()],online=n=>[...socks].find(x=>x.u==n);
const avOf=n=>{const u=U(n);return u?u.av:(online(n)||{}).av||null};
const vav=a=>{a=a||{};const n=(v,m)=>Math.max(0,Math.min(m-1,v|0));return{s:n(a.s,100),hs:n(a.hs,20),hc:n(a.hc,100),c:n(a.c,20),cc:n(a.cc,100),ph:0,t:Date.now()}};
const okPh=p=>typeof p=='string'&&/^data:image\/jpeg;base64,/.test(p)&&p.length<70000;
function fl(s){const u=U(s.u);if(!u)return wsSend(s,{t:'friends',friends:[],in:[],out:[]});u.f=u.f||[];u.in=u.in||[];u.out=u.out||[];
  wsSend(s,{t:'friends',friends:u.f.map(n=>({u:n,on:!!online(n),av:avOf(n)})),in:u.in,out:u.out})}
const AL={profession:'job',occupation:'job',colour:'color'};
function judge(c,x,L,lg){
  if(!x)return'empty';
  if(x[0]!=L.toLowerCase()||x.length<2||!/[a-z]/.test(x))return'invalid';
  const T=lg=='en'?DE:D,M=lg=='en'?MAPE:MAP;let k=norm(c);k=AL[k]||k;
  if(T[k]){if(M[x]&&M[x].has(k))return'valid';if(M[x])return'invalid'}
  return'unsure';
}

// ---- WebSocket mínimo (RFC 6455)
function wsSend(s,o){if(!s||s.destroyed)return;const b=Buffer.from(JSON.stringify(o));let h;
  if(b.length<126)h=Buffer.from([0x81,b.length]);
  else if(b.length<65536){h=Buffer.alloc(4);h[0]=0x81;h[1]=126;h.writeUInt16BE(b.length,2)}
  else{h=Buffer.alloc(10);h[0]=0x81;h[1]=127;h.writeBigUInt64BE(BigInt(b.length),2)}
  s.write(Buffer.concat([h,b]));}
function frames(sock,onmsg,onclose){let buf=Buffer.alloc(0);
  sock.on('data',d=>{buf=Buffer.concat([buf,d]);
    for(;;){if(buf.length<2)return;const op=buf[0]&15,mk=buf[1]&128;let len=buf[1]&127,off=2;
      if(len==126){if(buf.length<4)return;len=buf.readUInt16BE(2);off=4}
      else if(len==127){if(buf.length<10)return;len=Number(buf.readBigUInt64BE(2));off=10}
      if(buf.length<off+(mk?4:0)+len)return;
      const mask=mk?buf.slice(off,off+4):null;off+=mk?4:0;
      const p=Buffer.from(buf.slice(off,off+len));if(mask)for(let i=0;i<len;i++)p[i]^=mask[i&3];
      buf=buf.slice(off+len);
      if(op==8){sock.end();return}
      if(op==9)sock.write(Buffer.from([0x8a,0]));
      else if(op==1)onmsg(p.toString());}});
  sock.on('close',onclose);sock.on('error',()=>{});}

// ---- Desenha e Adivinha (draw.js)
const DRAW=require('./draw')(wsSend);

// ---- Salas
const rooms={},guests={};
const mkcode=()=>{let c;do c=Array.from({length:6},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.random()*32|0]).join('');while(rooms[c]);return c};
const err=(s,m)=>wsSend(s,{t:'err',m});
function view(r,n){const inRes=['reveal','results','final'].includes(r.state);
  return{code:r.code,host:r.host,cfg:r.cfg,state:r.state,phase:r.phase,ci:r.ci,round:r.round,letter:r.letter,endsAt:r.endsAt,stopBy:r.stopBy,reason:r.reason,
    players:r.order.map(x=>({n:x,av:avOf(x),score:r.p[x].score,on:!!r.p[x].ws,st:r.p[x].st})),mine:r.p[n].ans,res:inRes?r.res:null}}
function bc(r){r.order.forEach(n=>r.p[n].ws&&wsSend(r.p[n].ws,{t:'room',now:Date.now(),room:view(r,n)}))}
function add(r,s){r.order.push(s.u);r.p[s.u]={score:0,ws:s,ans:{},st:{v:0,i:0,s:0,w:0,b:0}};s.rm=r.code}
function remove(r,n){r.order=r.order.filter(x=>x!=n);delete r.p[n];
  if(!r.order.length){clearTimeout(r.timer);delete rooms[r.code];return}
  if(r.host==n)r.host=r.order.find(x=>r.p[x].ws)||r.order[0];}
function startRound(r){r.round++;
  let pool=r.cfg.letters.filter(l=>!r.used.includes(l));if(!pool.length){r.used=[];pool=r.cfg.letters}
  r.letter=pool[Math.random()*pool.length|0];r.used.push(r.letter);
  r.state='round';r.stopBy=null;r.reason=null;r.res=null;r.order.forEach(n=>r.p[n].ans={});
  r.endsAt=Date.now()+r.cfg.time*1000;clearTimeout(r.timer);
  r.timer=setTimeout(()=>finish(r,'auto'),r.cfg.time*1000+50);bc(r)}
function finish(r,reason,by){if(r.state!='round')return;clearTimeout(r.timer);
  r.state='reveal';r.phase='sign';r.ci=-1;r.reason=reason;r.stopBy=by||null;const cats={};
  for(const c of r.cfg.cats)cats[c]=r.order.map(n=>{const a=(r.p[n].ans[c]||'').trim();return{n,a,st:judge(c,norm(a),r.letter,r.cfg.lang),v:{}}});
  r.res={cats,tot:Object.fromEntries(r.order.map(n=>[n,0]))};
  r.timer=setTimeout(()=>nextCat(r),3200);bc(r)}
function nextCat(r){clearTimeout(r.timer);r.ci++;if(r.ci>=r.cfg.cats.length)return endRound(r);
  r.phase='show';const l=r.res.cats[r.cfg.cats[r.ci]];
  r.timer=setTimeout(()=>{if(l.some(x=>x.st=='unsure')){r.phase='vote';r.timer=setTimeout(()=>resolve(r),15000);bc(r)}else resolve(r)},2200);bc(r)}
function resolve(r){clearTimeout(r.timer);const l=r.res.cats[r.cfg.cats[r.ci]];
  l.forEach(x=>{if(x.st=='unsure'){const y=Object.values(x.v).filter(Boolean).length,z=Object.values(x.v).length-y;x.st=y>z?'valid':'invalid'}});
  const cnt={};l.filter(x=>x.st=='valid').forEach(x=>{const k=norm(x.a);cnt[k]=(cnt[k]||0)+1});
  l.forEach(x=>{if(x.st=='valid'&&cnt[norm(x.a)]>1)x.st='dup';x.pts=x.st=='valid'?10:x.st=='dup'?r.cfg.dup:0;
    const p=r.p[x.n];if(!p)return;p.score+=x.pts;r.res.tot[x.n]+=x.pts;
    if(x.st=='valid'||x.st=='dup')p.st.v++;else if(x.st=='invalid')p.st.i++});
  r.phase='done';r.timer=setTimeout(()=>nextCat(r),3400);bc(r)}
function endRound(r){const t=r.res.tot,mx=Math.max(...Object.values(t));
  r.order.forEach(n=>{const p=r.p[n];p.st.b=Math.max(p.st.b,t[n]);if(t[n]==mx&&mx>0)p.st.w++});r.state='results';bc(r)}
function final(r){r.state='final';const mx=Math.max(...r.order.map(n=>r.p[n].score));
  r.order.forEach(n=>{const u=db.users[n.toLowerCase()];if(!u)return;const p=r.p[n];u.games++;u.points+=p.score;u.best=Math.max(u.best,p.score);if(p.score==mx)u.wins++});
  save();bc(r)}
function login(s,name,guest){const tok=crypto.randomBytes(16).toString('hex');(guest?guests:db.tokens)[tok]=name;if(!guest)save();attach(s,name,tok,guest)}
function attach(s,name,tok,guest){s.u=name;s.g=guest;wsSend(s,{t:'auth',user:name,tok,guest,now:Date.now(),av:avOf(name)});
  const r=Object.values(rooms).find(r=>r.p[name]);if(r){s.rm=r.code;r.p[name].ws=s;bc(r)}}
function handle(s,m){const T=m.t;if(T=='ping')return;if(String(T).startsWith('d_'))return DRAW.h(s,m);
  if(T=='register'){const u=String(m.u||'').trim(),p=String(m.p||'');
    if(!/^[\w.-]{2,20}$/.test(u))return err(s,'Username: 2 a 20 caracteres (letras, números, _ . -)');
    if(p.length<4)return err(s,'Password: mínimo 4 caracteres');
    if(db.users[u.toLowerCase()])return err(s,'Esse username já está em uso, escolhe outro');
    const salt=crypto.randomBytes(16).toString('hex');
    db.users[u.toLowerCase()]={u,salt,hash:crypto.scryptSync(p,salt,32).toString('hex'),wins:0,points:0,games:0,best:0,av:vav(m.av)};if(okPh(m.photo)){const q=db.users[u.toLowerCase()];q.photo=m.photo.split(',')[1];q.av.ph=1}
    return login(s,u)}
  if(T=='login'){const x=db.users[String(m.u||'').toLowerCase()];
    if(!x||!crypto.timingSafeEqual(Buffer.from(x.hash,'hex'),crypto.scryptSync(String(m.p||''),x.salt,32)))return err(s,'Credenciais inválidas');
    return login(s,x.u)}
  if(T=='guest')s.av=vav(m.av);
  if(T=='guest')return login(s,'Convidado'+(Math.random()*9000+1000|0),true);
  if(T=='resume'){const n=db.tokens[m.tok]||guests[m.tok];if(!n)return wsSend(s,{t:'noauth'});return attach(s,n,m.tok,!!guests[m.tok])}
  if(!s.u)return err(s,'Sessão necessária');
  const r=rooms[s.rm],me=r&&r.p[s.u];
  if(T=='logout'){delete db.tokens[m.tok];save();return}
  if(T=='rank')return wsSend(s,{t:'rank',list:Object.values(db.users).sort((a,b)=>b.wins-a.wins||b.points-a.points).slice(0,200).map(({u,wins,points,games,best,av})=>({u,wins,points,games,best,av}))});
  if(T=='list')return wsSend(s,{t:'list',list:Object.values(rooms).filter(r=>r.state=='lobby'&&r.cfg.mode=='public'&&r.order.length<r.cfg.max).map(r=>({code:r.code,host:r.host,n:r.order.length,max:r.cfg.max}))});
  if(T=='setav'){const u=U(s.u),a=vav(m.av);
    if(u){if(okPh(m.photo)){u.photo=m.photo.split(',')[1];a.ph=1}else if(m.photo===1&&u.photo)a.ph=1;else delete u.photo;u.av=a;save()}else s.av=a;
    if(r)bc(r);return err(s,'Avatar guardado')}
  if(T=='flist')return fl(s);
  if(T=='fsearch'){const q=norm(m.q),me=U(s.u)||{};return wsSend(s,{t:'fres',list:q.length<2?[]:Object.values(db.users).filter(x=>x.u!=s.u&&norm(x.u).includes(q)).slice(0,10).map(x=>({u:x.u,av:x.av,rel:(me.f||[]).includes(x.u)?'f':(me.out||[]).includes(x.u)?'o':(me.in||[]).includes(x.u)?'i':''}))})}
  if(['fadd','faccept','fdecline','fremove'].includes(T)){const me=U(s.u),o=U(m.u);if(!me||!o||o==me)return err(s,'Precisas de uma conta para usar amigos');
    for(const x of[me,o]){x.f=x.f||[];x.in=x.in||[];x.out=x.out||[]}
    const rm=(a,v)=>{const i=a.indexOf(v);if(i>=0)a.splice(i,1)};
    if(T=='fadd'&&!me.f.includes(o.u)){if(me.in.includes(o.u))return handle(s,{t:'faccept',u:o.u});if(!me.out.includes(o.u)){me.out.push(o.u);o.in.push(me.u)}}
    if(T=='faccept'&&me.in.includes(o.u)){rm(me.in,o.u);rm(o.out,me.u);me.f.push(o.u);o.f.push(me.u)}
    if(T=='fdecline'){rm(me.in,o.u);rm(o.out,me.u);rm(me.out,o.u);rm(o.in,me.u)}
    if(T=='fremove'){rm(me.f,o.u);rm(o.f,me.u)}
    save();fl(s);const t=online(o.u);if(t)fl(t);return}
  if(T=='create'){if(r)return err(s,'Já estás numa sala');const c=m.cfg||{};
    const cats=[...new Set((c.cats||[]).map(x=>String(x).trim().slice(0,30)).filter(Boolean))];
    const letters=[...new Set((c.letters||[]).filter(l=>/^[A-Z]$/.test(l)))];
    if(cats.length<8)return err(s,'Mínimo de 8 categorias');
    if(!letters.length)return err(s,'Escolhe pelo menos uma letra');
    const cfg={max:Math.min(12,Math.max(2,+c.max||4)),mode:['private','friends'].includes(c.mode)?c.mode:'public',cats,letters,
      time:Math.min(300,Math.max(10,+c.time||60)),rounds:Math.min(20,Math.max(1,+c.rounds||5)),dup:c.dup==0?0:5,lang:c.lang=='en'?'en':'pt',passHash:(c.mode=='private'&&String(c.password||'').trim())?crypto.createHash('sha256').update(String(c.password).trim()).digest('hex'):''};
    const code=mkcode(),nr={code,host:s.u,cfg,state:'lobby',round:0,used:[],order:[],p:{},made:Date.now()};
    rooms[code]=nr;add(nr,s);return bc(nr)}
  if(T=='join'){if(r)return err(s,'Já estás numa sala');const j=rooms[String(m.code).toUpperCase()];
    if(!j)return err(s,'Sala inexistente ou convite expirado');
    if(j.state!='lobby')return err(s,'A partida já começou');
    if(j.order.length>=j.cfg.max)return err(s,'Sala cheia');
    if(j.cfg.mode=='friends'&&j.host!=s.u&&!((U(j.host)||{}).f||[]).includes(s.u))return err(s,'Sala só para amigos do host');
    if(j.cfg.mode=='private'&&j.cfg.passHash){const ph=crypto.createHash('sha256').update(String(m.password||'').trim()).digest('hex');if(ph!==j.cfg.passHash)return err(s,'Password da sala incorreta')}
    add(j,s);return bc(j)}
  if(!r||!me)return;
  const host=s.u==r.host;
  switch(T){
    case'leave':remove(r,s.u);s.rm=null;wsSend(s,{t:'left'});if(rooms[r.code])bc(r);break;
    case'kick':if(host&&r.state=='lobby'&&m.n!=r.host&&r.p[m.n]){const t=r.p[m.n].ws;remove(r,m.n);if(t){t.rm=null;wsSend(t,{t:'left',m:'Foste expulso da sala'})}bc(r)}break;
    case'cfg':if(host&&r.state=='lobby'){const x=m.cfg||{};r.cfg.max=Math.min(12,Math.max(2,+x.max||r.cfg.max));r.cfg.rounds=Math.min(20,Math.max(1,+x.rounds||r.cfg.rounds));r.cfg.time=Math.min(300,Math.max(10,+x.time||r.cfg.time));bc(r)}break;
    case'start':if(host&&r.state=='lobby'&&r.order.length>=2)startRound(r);break;
    case'ans':if(r.state=='round'&&Date.now()<=r.endsAt+300&&r.cfg.cats.includes(m.c))me.ans[m.c]=String(m.v).slice(0,40);break;
    case'stop':if(r.state=='round'){if(!r.cfg.cats.every(c=>(me.ans[c]||'').trim()))return err(s,r.cfg.lang=='en'?"You haven't filled everything yet!":'Ainda não preencheste tudo!');me.st.s++;finish(r,'stop',s.u)}break;
    case'vote':{if(r.state!='reveal'||r.phase!='vote'||m.c!=r.cfg.cats[r.ci])break;const x=r.res.cats[m.c].find(x=>x.n==m.n);
      if(!x||x.st!='unsure')break;x.v[s.u]=!!m.ok;const on=r.order.filter(n=>r.p[n].ws);
      r.res.cats[m.c].every(x=>x.st!='unsure'||on.every(n=>n in x.v))?resolve(r):bc(r);break}
    case'invite':{const u=U(s.u);if(r.state!='lobby'||!u||!(u.f||[]).includes(m.u))break;const t=online(m.u);
      if(!t)return err(s,'Amigo offline');if(t.rm)return err(s,'Já está noutra sala');wsSend(t,{t:'inv',from:s.u,code:r.code});err(s,'Convite enviado a '+m.u);break}
    case'next':if(host&&r.state=='results'){r.round>=r.cfg.rounds?final(r):startRound(r)}break;
    case'again':if(host&&r.state=='final'){r.order.forEach(n=>{r.p[n].score=0;r.p[n].st={v:0,i:0,s:0,w:0,b:0}});r.round=0;r.used=[];r.res=null;r.state='lobby';bc(r)}break;
  }}
function drop(s){DRAW.leave(s);const r=rooms[s.rm];if(!r||!r.p[s.u]||r.p[s.u].ws!==s)return;
  r.p[s.u].ws=null;
  if(r.state=='lobby'&&r.host==s.u){const n=r.order.find(x=>r.p[x].ws);if(n)r.host=n}
  bc(r)}
setInterval(()=>{for(const c in rooms){const r=rooms[c],off=r.order.every(n=>!r.p[n].ws);
  if(off){r.off=r.off||Date.now();if(Date.now()-r.off>600000)delete rooms[c]}else r.off=0;
  if(Date.now()-r.made>6*3600e3)delete rooms[c]}},60000);

// ---- HTTP (ficheiros estáticos + PWA)
const zlib=require('zlib'),CACHE={};
const MT={html:'text/html; charset=utf-8',js:'text/javascript',png:'image/png'};
const STATIC={'/draw.html':'draw.html','/sw.js':'sw.js','/icon-192.png':'icon-192.png','/icon-512.png':'icon-512.png'};
const server=http.createServer((q,s)=>{
  if(q.url=='/manifest.json'){s.writeHead(200,{'Content-Type':'application/manifest+json'});return s.end(JSON.stringify({id:'/',name:'STOP',short_name:'STOP',start_url:'/',scope:'/',display:'standalone',background_color:'#0b0a1a',theme_color:'#0b0a1a',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]}))}
  if(q.url.startsWith('/av/')){const u=U(decodeURIComponent(q.url.slice(4).split('?')[0]));if(u&&u.photo){s.writeHead(200,{'Content-Type':'image/jpeg','Cache-Control':'max-age=86400'});return s.end(Buffer.from(u.photo,'base64'))}s.writeHead(404);return s.end()}
  if(q.url=='/ping'){s.writeHead(200);return s.end('ok')}
  const F=STATIC[q.url.split('?')[0]]||'index.html';
  if(!CACHE[F])try{const b=fs.readFileSync(path.join(__dirname,F));CACHE[F]={b,z:zlib.gzipSync(b)}}catch{}
  const c=CACHE[F];if(!c){s.writeHead(404);return s.end()}
  const gz=/gzip/.test(String(q.headers['accept-encoding']||''));
  s.writeHead(200,{'Content-Type':MT[F.split('.').pop()],'Cache-Control':'no-cache','Vary':'Accept-Encoding',...(gz?{'Content-Encoding':'gzip'}:{})});s.end(gz?c.z:c.b)});
server.on('upgrade',(q,sock)=>{const k=q.headers['sec-websocket-key'];if(!k)return sock.destroy();
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+crypto.createHash('sha1').update(k+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')+'\r\n\r\n');
  sock.setNoDelay(true);socks.add(sock);
  frames(sock,m=>{try{handle(sock,JSON.parse(m))}catch(e){console.error(e)}},()=>{socks.delete(sock);drop(sock)})});
server.listen(PORT,'0.0.0.0',()=>{console.log('STOP a correr. Abre no telemóvel:');console.log('(Link público: noutro terminal corre cloudflared tunnel --url http://localhost:'+PORT+' ou npx localtunnel --port '+PORT+')');
  Object.values(os.networkInterfaces()).flat().filter(i=>i.family=='IPv4'&&!i.internal).forEach(i=>console.log(' http://'+i.address+':'+PORT))});
