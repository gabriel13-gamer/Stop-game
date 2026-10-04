// draw.js — Desenha e Adivinha. Usa o WebSocket do server.js (mensagens d_*)
const WORDS='gato,cao,casa,carro,sol,lua,flor,arvore,pizza,bola,livro,peixe,aviao,barco,coelho,chapeu,relogio,guitarra,bicicleta,castelo,foguetao,dinossauro,gelado,telemovel,oculos,montanha,ponte,robo,pirata,fantasma,cenoura,banana,tubarao,cavalo,coracao,estrela,nuvem,chuva,vulcao,borboleta,escada,janela,chave,martelo,tesoura,guarda-chuva,cobra,macaco,elefante,girafa'.split(',');
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const rooms={};

module.exports=function(send){
  const bc=(r,o)=>r.pl.forEach(p=>p.ws&&send(p.ws,o));
  const pub=r=>({t:'d_room',code:r.code,host:r.host,st:r.st,round:r.rd,rounds:r.rounds,end:r.end,now:Date.now(),time:r.time,words:r.words?.length||0,
    drawer:r.st=='lobby'||r.st=='final'?null:r.pl[r.di].n,
    hint:r.st=='draw'?r.word.replace(/[^-]/g,'_ '):r.st=='between'?r.word:'',
    players:r.pl.map(p=>({n:p.n,s:p.s,ok:r.ok.includes(p.n),on:!!p.ws}))});
  const sync=r=>bc(r,pub(r));

  function turn(r){
    clearTimeout(r.tm);
    if(r.turns>=r.rounds*r.pl.length){r.st='final';return sync(r)}
    r.di=r.turns%r.pl.length;r.turns++;r.rd=Math.ceil(r.turns/r.pl.length);
    const pool=r.words&&r.words.length?r.words:WORDS;r.word=pool[Math.random()*pool.length|0];r.st='draw';r.ok=[];r.strokes=[];
    r.end=Date.now()+r.time*1000;r.tm=setTimeout(()=>over(r),r.time*1000);
    bc(r,{t:'d_clear'});sync(r);
    const d=r.pl[r.di];d.ws&&send(d.ws,{t:'d_word',w:r.word});
  }
  function over(r){
    clearTimeout(r.tm);if(r.st!='draw')return;
    r.st='between';sync(r);r.tm=setTimeout(()=>turn(r),4000);
  }
  function leave(s){
    const r=rooms[s.dr];s.dr=null;if(!r)return;
    const p=r.pl.find(x=>x.n==s.dn);if(!p||p.ws!==s)return;
    if(r.st=='lobby'){
      r.pl=r.pl.filter(x=>x!==p);
      if(!r.pl.length){delete rooms[r.code];return}
      if(r.host==p.n)r.host=r.pl[0].n;
    }else{
      p.ws=null;
      if(r.pl.every(x=>!x.ws)){clearTimeout(r.tm);delete rooms[r.code];return}
    }
    sync(r);
  }
  function h(s,m){
    const T=m.t;
    if(T=='d_list')return send(s,{t:'d_list',list:Object.values(rooms).filter(r=>r.st=='lobby'&&r.pl.length<10).map(r=>({code:r.code,host:r.host,n:r.pl.length,max:10,rounds:r.rounds,time:r.time}))});
    if(T=='d_join'){
      if(rooms[s.dr])return;
      const n=String(m.n||'').trim().slice(0,16)||'Jogador',code=String(m.code||'').toUpperCase();
      let j=rooms[code];
      if(code&&!j)return send(s,{t:'d_err',m:'Sala inexistente'});
      if(!j){
        const c=Math.random().toString(36).slice(2,6).toUpperCase();
        j=rooms[c]={code:c,host:n,st:'lobby',pl:[],rd:0,rounds:3,time:60,turns:0,di:0,ok:[],strokes:[],word:'',words:WORDS.slice()};
      }
      let p=j.pl.find(x=>x.n==n);
      if(j.st!='lobby'&&!p)return send(s,{t:'d_err',m:'A partida já começou'});
      if(p&&p.ws&&p.ws!==s)return send(s,{t:'d_err',m:'Esse nome já está a ser usado'});
      if(!p){
        if(j.pl.length>=10)return send(s,{t:'d_err',m:'Sala cheia'});
        p={n,s:0};j.pl.push(p);
      }
      p.ws=s;s.dr=j.code;s.dn=n;sync(j);
      j.strokes.forEach(x=>send(s,{t:'d_s',s:x}));
      if(j.st=='draw'&&j.pl[j.di]===p)send(s,{t:'d_word',w:j.word});
      return;
    }
    const r=rooms[s.dr];if(!r)return;
    const me=r.pl.find(x=>x.n==s.dn),dr=r.pl[r.di];
    switch(T){
      case'd_cfg':if(r.host==s.dn&&r.st=='lobby'){const c=m.cfg||{};r.rounds=Math.max(1,Math.min(10,+c.rounds||3));r.time=Math.max(20,Math.min(180,+c.time||60));const w=Array.isArray(c.words)?c.words.map(x=>String(x).trim().slice(0,30)).filter(Boolean).slice(0,100):[];r.words=w.length>=5?w:WORDS.slice();sync(r)}break;
      case'd_start':
        if(r.host==s.dn&&r.st=='lobby'&&r.pl.length>=2){r.turns=0;turn(r)}
        break;
      case'd_s':
        if(r.st=='draw'&&me===dr&&Array.isArray(m.s)){
          const x=m.s.slice(0,6);r.strokes.push(x);
          if(r.strokes.length>6000)r.strokes.shift();
          r.pl.forEach(p=>p.ws&&p!==me&&send(p.ws,{t:'d_s',s:x}));
        }
        break;
      case'd_clear':
        if(r.st=='draw'&&me===dr){r.strokes=[];bc(r,{t:'d_clear'})}
        break;
      case'd_g':{
        const v=String(m.v||'').slice(0,40);
        if(r.st!='draw'||me===dr||r.ok.includes(me.n)||!v.trim())break;
        if(norm(v)==norm(r.word)){
          const left=Math.max(0,r.end-Date.now())/1000;
          me.s+=Math.round(20+80*left/r.time);dr.s+=15;r.ok.push(me.n);
          bc(r,{t:'d_chat',n:me.n,ok:1});
          r.ok.length>=r.pl.filter(p=>p!==dr&&p.ws).length?over(r):sync(r);
        }else bc(r,{t:'d_chat',n:me.n,v});
        break;
      }
      case'd_again':
        if(r.host==s.dn&&r.st=='final'){r.pl.forEach(p=>p.s=0);r.st='lobby';sync(r)}
        break;
      case'd_leave':leave(s);break;
    }
  }
  return{h,leave};
};
