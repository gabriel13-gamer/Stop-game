const fs=require('fs'),path=require('path');
const OUT=path.join(__dirname,'dicts');fs.mkdirSync(OUT,{recursive:true});
// [ficheiro PT, ficheiro EN, filtro SPARQL]
const Q=[
 ['pais','country','?x wdt:P31 wd:Q6256'],
 ['cidade','city','?x wdt:P31/wdt:P279* wd:Q515; wdt:P1082 ?p. FILTER(?p>50000)'],
 ['animal','animal','?x wdt:P31 wd:Q16521; wdt:P171* wd:Q729; wdt:P1843 ?cn'],
 ['profissao','job','?x wdt:P31/wdt:P279* wd:Q28640'],
 ['nome','name','?x wdt:P31 wd:Q202444'],
 ['apelido','surname','?x wdt:P31 wd:Q101352'],
 ['comida','food','?x wdt:P279* wd:Q2095'],
 ['bebida','drink','?x wdt:P279* wd:Q40050'],
 ['cor','color','?x wdt:P31 wd:Q1075'],
];
async function run(filter,lang){
 const q=`SELECT DISTINCT ?l WHERE{${filter}. ?x rdfs:label ?l. FILTER(lang(?l)="${lang}")} LIMIT 60000`;
 const r=await fetch('https://query.wikidata.org/sparql?format=json&query='+encodeURIComponent(q),{headers:{'User-Agent':'stop-game-dict/1.0','Accept':'application/sparql-results+json'}});
 if(!r.ok)throw new Error(r.status);
 return (await r.json()).results.bindings.map(b=>b.l.value.trim()).filter(w=>w&&w.length<30);
}
(async()=>{for(const[pt,en,f]of Q){
 for(const[lang,file]of[['pt',pt+'.txt'],['en','en_'+en+'.txt']]){
  try{const w=[...new Set(await run(f,lang))];fs.writeFileSync(path.join(OUT,file),w.join('\n'));console.log(file,w.length)}
  catch(e){console.log('falhou',file,e.message)}
  await new Promise(r=>setTimeout(r,1500));}}})();
