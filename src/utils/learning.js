// This catalog owns revisions and discovery rules. Progress never changes playable features.
export const LEARNING_KEY = 'farmjam-learning-v1';
export const GUIDES = [
  {id:'instruments',version:1,title:'Play an instrument',summary:'Start the band, equip an instrument and make your own sounds.'},
  {id:'landscape',version:1,title:'Explore the landscape',summary:'Sun, moon, musical weather and the metronome.'},
  {id:'practice',version:1,title:'Visit the practice room',summary:'Listen, Learn, Rhythm and Together at your own pace.'},
  {id:'settings',version:1,title:'Make it comfortable',summary:'Choose instruments, complexity, labels and sound levels.'},
  {id:'installation',version:1,title:'Install and prepare your device',summary:'Optional installation, offline play and device restrictions.'},
  {id:'together',version:1,title:'Play together',summary:'Simple ideas for sharing music and taking it off screen.'},
];
export const HINTS = [
  {id:'tap',title:'Start a little band',text:'Tap an instrument to start or stop its music.',gesture:'tap',seconds:0,ages:['under3','3to4','5to7','8plus']},
  {id:'landscape',title:'Follow the sun',text:'Tap the sun or moon to visit another landscape. The band keeps its beat.',gesture:'tap',seconds:45,ages:['under3','3to4','5to7','8plus']},
  {id:'equip',title:'Play it yourself',text:'Drag an instrument onto your avatar, then try its controls. You can also choose an instrument below and press Play it yourself.',gesture:'drag',seconds:120,ages:['3to4','5to7','8plus']},
  {id:'weather',title:'Change the musical weather',text:'Tap a cloud to switch between Folk and Jazz. The music changes gradually while the band keeps playing.',gesture:'tap',seconds:180,ages:['3to4','5to7','8plus']},
  {id:'practice',title:'Try a musical conversation',text:'Double-tap your avatar to visit practice. Listen first, then follow the highlighted notes. You can also use Open practice below.',gesture:'double-tap',seconds:300,ages:['5to7','8plus'],requires:'equip'},
];

export function emptyLearning() { return {guides:{},children:{}}; }
export function childLearning(state,id) { return Object.hasOwn(state.children,id)?state.children[id]:{enabled:true,seconds:0,hints:{}}; }
export function normalizeLearning(value) {
  const guides=Object.fromEntries(GUIDES.flatMap(guide=>{
    const revision=value?.guides?.[guide.id];
    return Number.isSafeInteger(revision)&&revision>0?[[guide.id,revision]]:[];
  }));
  const children=Object.fromEntries(Object.entries(value?.children??{}).filter(([id,child])=>id&&child&&typeof child==='object').map(([id,child])=>[
    id,{enabled:child.enabled!==false,seconds:Number.isFinite(child.seconds)?Math.max(0,child.seconds):0,
      hints:Object.fromEntries(HINTS.flatMap(hint=>{
        const saved=child.hints?.[hint.id];
        return saved&&typeof saved==='object'?[[hint.id,{suggested:saved.suggested===true,seen:saved.seen===true,completed:saved.completed===true}]]:[];
      }))}
  ]));
  return {guides,children};
}
export function guideStatus(state,guide) {
  const read=state.guides[guide.id]??0;
  return read>=guide.version?'Read':read?'New':'Unread';
}
export function updateChildLearning(state,id,update) {
  if(!id)return state;
  return {...state,children:{...state.children,[id]:update(childLearning(state,id))}};
}
export function updateHint(state,id,hintId,patch) {
  if(!HINTS.some(hint=>hint.id===hintId))return state;
  return updateChildLearning(state,id,child=>({...child,hints:{...child.hints,[hintId]:{...child.hints[hintId],...patch}}}));
}
export function nextHint(state,child) {
  if(!child)return null;
  const progress=childLearning(state,child.id);
  if(!progress.enabled)return null;
  // Once offered (including by a parent), availability survives restarts and age changes.
  const available=hint=>!progress.hints[hint.id]?.seen&&!progress.hints[hint.id]?.completed;
  return HINTS.find(hint=>available(hint)&&progress.hints[hint.id]?.suggested)
    ??HINTS.find(hint=>available(hint)&&hint.ages.includes(child.age)&&progress.seconds>=hint.seconds&&(!hint.requires||progress.hints[hint.requires]?.completed))
    ??null;
}
export function createLearningStorage(storageProvider=()=>window.localStorage) {
  let readError=null;
  return {
    load() {
      try {const state=normalizeLearning(JSON.parse(storageProvider().getItem(LEARNING_KEY)??'null'));readError=null;return {state,error:null};}
      catch(error){readError=error;return {state:emptyLearning(),error};}
    },
    save(state) {
      if(readError)return {ok:false,error:readError};
      try {storageProvider().setItem(LEARNING_KEY,JSON.stringify(normalizeLearning(state)));return {ok:true,error:null};}
      catch(error){return {ok:false,error};}
    }
  };
}
