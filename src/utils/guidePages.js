// Optional reference pages. Page navigation never records completion or changes play.
const page=(id,title,paragraphs,illustration,notes)=>({id,title,paragraphs,illustration,notes});

export const GUIDE_PAGES={
  instruments:[
    page('band','Start the band',[
      'Tap an instrument in the landscape to start its repeating part. Tap it again to stop that part.',
      'Add one sound at a time and listen to how the parts fit together. The other instruments keep playing when you turn one off.'
    ],{kind:'band',gesture:'tap'},{new:'A phrase is a short musical idea that repeats.',some:'Each instrument repeats a musical phrase while the band keeps a shared beat.',confident:'The repeating parts share the current key and beat.'}),
    page('equip','Play an instrument yourself',[
      'Drag an instrument onto your child’s avatar. Its playable controls open in front of the landscape.',
      'Play your own notes while the other instruments continue their parts. Help also has a “Play it yourself” button if dragging is difficult.'
    ],{kind:'equip',gesture:'drag'}),
    page('surface','Try the controls',[],{kind:'surface'},null),
    page('phrase','Choose another phrase',[
      'Use the next-phrase arrow beside the equipped instrument to choose a different repeating part.',
      'Listen to the new idea and try answering it with your own sounds. The rest of the band keeps playing.'
    ],{kind:'surface',focus:'transport'}),
    page('return','Put the instrument down',[
      'Drag the equipped instrument away from your child’s avatar, or use its return control.',
      'Its playable controls close and the instrument returns to the landscape. Tap landscape instruments whenever you want to change the band.'
    ],{kind:'surface',focus:'exit'})
  ],
  landscape:[
    page('scenes','Visit another landscape',[
      'Tap the sun or moon to move through the day, night and dawn. You can also use the circular arrow at the bottom right.',
      'Each landscape changes the musical key. The band finishes the current bar before the change, so its parts stay together.'
    ],{kind:'sun',gesture:'tap'},{new:'A key is a group of notes that gives the music its home sound.',some:'Changing key shifts the notes and can change the mood.',confident:'The scenes change both the tonic and mode at the next downbeat.'}),
    page('weather','Change the musical style',[
      'Tap a cloud to switch between Folk and Jazz. Pale, sparse clouds show Folk; the denser blue-gray clouds show Jazz.',
      'Keep listening as the music changes gradually. The band continues playing through the change.'
    ],{kind:'weather',gesture:'tap'}),
    page('tempo','Change the beat',[
      'Open the metronome at the bottom left for beat clicks. Slide its weight up to slow the music or down to speed it up.',
      'Hold the weight to pause the music temporarily. Release it to continue.'
    ],{kind:'metronome',gesture:'tempo'},{new:'The beat is a steady pulse you can clap along with.',some:'Tempo is the speed of that pulse.',confident:'The band shares one tempo, so its parts stay in time.'})
  ],
  practice:[
    page('enter','Open the practice room',[
      'Double-tap your child’s avatar in the landscape to enter practice. You can enter with or without an equipped instrument.',
      'Practice gives you one short phrase to explore. You can listen, follow its notes, try its rhythm or play with accompaniment.'
    ],{kind:'profile',gesture:'double-tap'}),
    page('room','Choose what to practice',[
      'Use the instrument and phrase selectors at the top. The stage row chooses Listen, Learn, Rhythm or Together; the playable instrument is below.',
      'The phrase track shows the actions in the phrase. The metronome is in the header. Changing instrument, phrase or stage stops playback and starts that choice from the beginning.'
    ],{kind:'practice-room'}),
    page('listen','Listen to the phrase',[
      'Choose Listen, then press Ready. Wait through the count-in and hear the instrument play the phrase. The highlighted controls show what is sounding.',
      'The demonstration repeats until you press Stop. After one full phrase, Next can take you to Learn. You can also choose any stage directly.'
    ],{kind:'practice-stage',stage:'Listen',focus:'transport'}),
    page('learn','Follow the highlighted notes',[
      'Choose Learn and play the highlighted note or complete chord. There is no Ready button or count-in in this stage: it waits for you.',
      'For a chord, play every highlighted note before moving on. Take as long as you need; Next becomes available after the whole phrase.'
    ],{kind:'practice-stage',stage:'Learn',focus:'progress'},{new:'A chord means several notes sounding together.',some:'Learn checks the notes you choose, with no timing target.',confident:'Each grouped cue must include every required pitch.'}),
    page('rhythm','Play with the beat',[
      'Choose Rhythm, press Ready and wait through the count-in. Start each highlighted note or chord when its turn arrives in the beat.',
      'The orange bars shrink to guide how long to hold. Practice checks the notes and when they start; hold duration is not scored. Next becomes available after one correct full phrase.'
    ],{kind:'practice-stage',stage:'Rhythm',focus:'progress'},{new:'Try saying or clapping the rhythm before playing it.',some:'If a note is missed, the phrase repeats for another try.',confident:'Timed stages check note onsets, including the complete chord.'}),
    page('together','Play with partner instruments',[
      'Choose Together, press Ready and wait through the count-in. Two quieter partner instruments play alongside your phrase.',
      'You play the selected instrument yourself. After one correct full phrase, Finish returns to the landscape. You can choose another stage whenever you like.'
    ],{kind:'practice-stage',stage:'Together'}),
    page('controls','Repeat, restart or leave',[
      'Stop ends a running attempt. In Rhythm and Together, Repeat starts a fresh attempt after stopping. Restart clears the current attempt; press Ready to begin again outside Learn.',
      'The progress display belongs to this attempt. You can choose stages freely, even when Next is unavailable. Use the open door or Escape to leave at any time and return to your landscape band.'
    ],{kind:'practice-room',focus:'exit'})
  ],
  settings:[
    page('open','Open Settings',[
      'Choose Settings on the main menu. During landscape play, double-tap the Settings button at the top right.',
      'Caregiver and Guides are available from the menu. Instruments needs a selected child; Sound is available during play.'
    ],{kind:'settings',gesture:'double-tap'}),
    page('choose','Choose six instruments',[
      'Open the Instruments tab and choose the six instruments you want in this child’s landscape.',
      'Each child keeps their own instrument choices. You can change the selection again whenever their interests change.'
    ],{kind:'settings',focus:'selectors'}),
    page('complexity','Choose a comfortable starting point',[
      'In Instruments, choose an instrument and set its complexity to Simple, Standard or Advanced. Simple offers fewer choices; the other levels add more.',
      'This changes the controls and musical choices when that instrument is played by hand. Try a level, then adjust it to suit the child.'
    ],{kind:'settings',focus:'complexity'},{new:'An age range only suggests a starting point. It does not measure musical ability.',some:'Complexity changes musical choices, rather than volume or tempo.',confident:'Unequipped instruments keep their usual accompaniment parts.'}),
    page('display','Choose useful labels',[
      'Use the display options in Instruments to show note and control labels, sounding note names or finger placement diagrams for guitar and ukulele.',
      'These are optional clues. Choose what helps this child and leave out details they do not need.'
    ],{kind:'settings',focus:'display'},{new:'A note is one musical sound. A chord is several notes together.',some:'Finger placement diagrams show where fingers go to make a chord.',confident:'Display choices are saved separately for each child and instrument.'}),
    page('sound','Balance the sound',[
      'During play, open the Sound tab to adjust each instrument and the shared Scenery sounds level. Changes take effect as you move the sliders.',
      'Restore defaults resets the sound levels. Sound levels last for this play session; instrument and display choices are saved for this child.'
    ],{kind:'settings',focus:'sound'}),
    page('hints','Choose learning hints',[
      'Open Caregiver to change the shared music familiarity setting and to turn learning hints on or off for this child. Familiarity changes explanations; it does not change the music.',
      'Hints offer optional things to try during landscape play. Select the learning symbol to see a hand demonstration. Suggest a hint again here whenever you want to revisit it.'
    ],{kind:'settings',focus:'caregiver'})
  ],
  profiles:[
    page('add','Add a child',[
      'Choose Add child on the main menu. Set up their name, age range and appearance, then choose starting instrument settings.',
      'Finish setup to add the profile. Cancel leaves the unfinished profile out of the menu. Caregiver music familiarity changes explanations and is shared across this browser.'
    ],{kind:'profile'}),
    page('choose','Choose a child to play',[
      'Select the child’s avatar on the main menu to play with their instruments and settings.',
      'Profiles keep each child’s choices separate. They are stored in this browser on this device, with no account or cloud backup.'
    ],{kind:'profile'}),
    page('edit','Edit a child’s profile',[
      'Choose the pencil beside a child to change their name, age range or appearance. Save applies the changes; Cancel discards the draft.',
      'Deleting a child asks for a separate confirmation. It removes that child and their settings from this browser. Changing an age range does not reset their instrument choices.'
    ],{kind:'profile'})
  ],
  installation:[
    page('install','Add FarmJam to your device',[
      'Installation is optional. It can add an app icon and, where supported, a separate app window. You can also bookmark FarmJam and play in the browser.'
    ],null),
    page('offline','Prepare for offline play',[
      'Let FarmJam finish loading online, including its sounds. Then disconnect, reload and try playing to check offline readiness on this device.',
      'Profiles stay in this browser on this device. Switching browsers or app contexts may not carry them over. Browser or device storage can be cleared or evicted; it is not a backup.'
    ],null),
    page('restrict','Set up device restrictions',[
      'Installation and fullscreen do not prevent leaving FarmJam. A caregiver must set up device restrictions and test how to enter and leave them before handing over the device.'
    ],null)
  ],
  together:[page('share','Make music together',[
    'Let your child choose a sound. Copy a short rhythm, take turns leading or answer each other with a few notes. There is no need to read music.',
    'Pause when attention or enjoyment fades. Take a favorite rhythm off screen: clap, sing, move or try a real instrument together.'
  ],null)]
};

export function guidePages(id) { return GUIDE_PAGES[id]??[]; }
export function guidePageNote(page,familiarity='some') { return page.notes?.[familiarity]??page.notes?.some??null; }
