const animal = (sound, label) => ({sound, label, className:sound});

export const JUNGLE_SCENES = {
  'jungle-clearing': {
    name:'Morning Clearing', root:'D', phase:.19,
    residents:[animal('macaw','Macaw'), animal('tapir','Tapir')],
    visitors:[{...animal('toucan','Toucan'),slot:0}, {...animal('morpho','Blue morpho butterfly'),slot:1}],
  },
  'jungle-river': {
    name:'River Bend', root:'G', phase:.50,
    residents:[animal('crocodile','Crocodile'), animal('heron','Heron')],
    visitors:[{...animal('basilisk','Basilisk lizard'),slot:0}, {...animal('capybara','Capybara'),slot:1}],
  },
  'jungle-waterfall': {
    name:'Waterfall', root:'F', phase:.77,
    residents:[animal('riverTurtle','River turtle'), animal('treeFrog','Tree frog')],
    visitors:[{...animal('iguana','Iguana'),slot:0}, {...animal('kingfisher','Kingfisher'),slot:1}],
  },
  'jungle-canopy': {
    name:'Canopy Sunset', root:'Em', phase:.875,
    residents:[animal('sloth','Sloth'), animal('coati','Coati')],
    visitors:[{...animal('monkey','Monkey'),slot:0}, {...animal('orchidMantis','Orchid mantis'),slot:1}],
  },
  'jungle-night': {
    name:'Night Pool', root:'Bm', phase:1.45,
    residents:[animal('potoo','Potoo'), animal('ocelot','Ocelot')],
    visitors:[{...animal('kinkajou','Kinkajou'),slot:0}, {...animal('firefly','Firefly'),slot:1}],
  },
  'jungle-moonlit': {
    name:'Moonlit Stream', root:'Dm', phase:1.73,
    residents:[animal('tarsier','Tarsier'), animal('agouti','Agouti')],
    visitors:[{...animal('pangolin','Pangolin'),slot:1}, {...animal('colugo','Colugo'),slot:0}],
  },
  'jungle-dawn': {
    name:'Misty Dawn', root:'Bb', phase:.085,
    residents:[animal('motmot','Motmot'), animal('peccary','Peccary')],
    visitors:[{...animal('hummingbird','Hummingbird'),slot:1}, {...animal('quetzal','Quetzal'),slot:0}],
  },
};

export const HOME_ENVIRONMENT = 'farm';
export const ENVIRONMENTS = {
  farm:{
    name:'Farm', defaultGenre:'folk', genres:['folk','jazz','rock'],
    scenes:['farm','garden','pond','dusk','night','late-night','dawn'],
  },
  jungle:{
    name:'Jungle', defaultGenre:'samba', genres:['samba','folk','jazz','rock'],
    scenes:Object.keys(JUNGLE_SCENES),
  },
};

export function sceneEnvironment(scene) {
  return Object.keys(ENVIRONMENTS).find(id=>ENVIRONMENTS[id].scenes.includes(scene));
}
