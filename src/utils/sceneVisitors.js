export const SCENE_VISITORS={
  farm:[{sound:'sheep',label:'Sheep',slot:0},{sound:'horse',label:'Horse',slot:1}],
  garden:[{sound:'bee',label:'Bumblebee',slot:1},{sound:'woodpecker',label:'Woodpecker',slot:0}],
  pond:[{sound:'duck',label:'Duck',slot:0},{sound:'otter',label:'Otter',slot:1}],
  dusk:[{sound:'cicada',label:'Cicada',slot:0},{sound:'balloon',label:'Hot-air balloon',slot:1}],
  night:[{sound:'fox',label:'Fox',slot:1},{sound:'badger',label:'Badger',slot:0}],
  'late-night':[{sound:'moth',label:'Luna moth',slot:0},{sound:'shootingStar',label:'Shooting star',slot:1}],
  dawn:[{sound:'dove',label:'Dove',slot:0},{sound:'deer',label:'Deer',slot:1}],
};

export function visitorRoll() {return Math.random();}

export function chooseSceneVisitor(scene,roll) {
  if(!Number.isFinite(roll)||roll<0||roll>=1)throw new RangeError('Scene visitor roll must be in [0, 1)');
  const visitors=SCENE_VISITORS[scene];
  if(!visitors)throw new Error(`Unknown visitor scene: ${scene}`);
  return roll<.25?visitors[0]:roll<.30?visitors[1]:null;
}

export function sceneObjectPair(scene,regular,roll) {
  const visitor=chooseSceneVisitor(scene,roll);
  return regular.map((object,index)=>visitor?.slot===index?{...object,...visitor}:object);
}