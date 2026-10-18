const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('bible.html','utf8');
const js=html.match(/<script>([\s\S]*)<\/script>/)[1];
const element=()=>({value:'',children:[],replaceChildren(){this.children=[]},append(...items){this.children.push(...items)},classList:{add(){},toggle(){}},style:{},setAttribute(){},addEventListener(){}});
const elements={};const context={document:{getElementById:id=>(elements[id]??=element()),createElement:element},console};
vm.createContext(context);vm.runInContext(js,context);
function identify(title){return vm.runInContext(`identify(${JSON.stringify(title)})`,context);}
for(const [title,i,ch] of [['詩一〇〇',18,100],['詩一一〇',18,110],['啓二',65,2],['約一',42,1],['約一 第一章',61,1],['約翰一書 第五章',61,5],['（耶ㄧ）',23,1],['詩篇第一百廿三篇',18,123],['（詩卅）',18,30],['（創50）',0,50],['（約二）',42,2]]){
 const got=identify(title);assert.ok(got, title);assert.equal(got.i,i,title);assert.equal(got.ch,ch,title);
}
for(const title of ['無法確認','創世記第五十一章','創一至三'])assert.equal(identify(title),null,title);
const posts=JSON.parse(fs.readFileSync('data/shipai-discovered.json','utf8')).posts;
const review=posts.filter(p=>!identify(p.title)).map(p=>({...p,reason:'標題無法確定單一有效經卷章節；不推測'}));
async function verifyRendering(){
 const all=JSON.parse(fs.readFileSync('data/bible-posts.json','utf8')).posts;
 const shipai=posts.map(p=>({...p,match:identify(p.title)}));
 const other=all.filter(p=>p.source==='如鷹展翅').map(p=>({...p,match:identify(p.title)}));
 const pair=shipai.find(p=>p.match&&other.some(q=>q.match&&q.match.i===p.match.i&&q.match.ch===p.match.ch));
 assert.ok(pair,'real chapter shared by both sources');
 context.fixture=[...shipai,...other];context.testBook=pair.match.i;context.testChapter=pair.match.ch;
 vm.runInContext('archivePromise=Promise.resolve(fixture);selected=testBook;chapter=testChapter',context);
 await vm.runInContext('renderMatches()',context);
 for(const source of ['石牌・天母每日讀經心得','如鷹展翅'])assert.ok(elements.entry.children.some(e=>e.children?.some(child=>child.textContent===source)),source);
 assert.ok(elements.entry.children.filter(e=>e.href).length>=2);
 process.stdout.write(JSON.stringify(review));
}
verifyRendering().catch(e=>{console.error(e);process.exitCode=1});
