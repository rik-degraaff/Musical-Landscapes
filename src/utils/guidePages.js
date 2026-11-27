import {TRIAL_CONTENT,TRIAL_DESCRIPTION,TRIAL_PHRASES} from './editions.js';

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
    ],{kind:'surface',focus:'transport',gesture:'tap'}),
    page('return','Put the instrument down',[
      'Drag the equipped instrument away from your child’s avatar, or use its return control.',
      'Its playable controls close and the instrument returns to the landscape. Tap landscape instruments whenever you want to change the band.'
    ],{kind:'surface',focus:'exit',gesture:'tap'})
  ],
  landscape:[
    page('scenes','Visit another landscape',[
      'Tap the sun or moon to move through the seven scenes in your current environment, from morning through night and dawn.',
      'In the morning, tap the bicycle and choose another place on the map. You’ll see your child’s avatar ride there and arrive in the new morning scene.',
      'The band finishes the current bar before changing key, so its parts stay together.'
    ],{kind:'sun',gesture:'tap'},{new:'A key is a group of notes that gives the music its home sound.',some:'Changing key shifts the notes and can change the mood.',confident:'The scenes change both the tonic and mode at the next downbeat.'}),
    page('weather','Change the musical style',[
      'Tap a cloud to cycle through Folk, Jazz and Rock on the Farm. The Jungle starts in Samba, shown by mint-green clouds, and its cycle includes the three other styles.',
      'Keep listening as the music changes gradually. The band continues playing through the change.'
    ],{kind:'weather',gesture:'tap'}),
    page('tempo','Change the beat',[
      'Open the metronome at the bottom left for beat clicks. Slide its weight up to slow the music or down to speed it up.',
      'Hold the weight to pause the music temporarily. Release it to continue.'
    ],{kind:'metronome',gesture:'tempo'},{new:'The beat is a steady pulse you can clap along with.',some:'Tempo is the speed of that pulse.',confident:'The band shares one tempo, so its parts stay in time.'})
  ],
  practice:[
    page('enter','Open Farm Practice',[
      'Double-tap your child’s avatar or the instrument they’re holding. You can also focus the avatar and press Enter or Space, or choose Open practice in caregiver help.',
      'For a first visit, hearing one sound and finding the open door is plenty.'
    ],{kind:'profile',gesture:'double-tap'}),
    page('room','Start where your child is comfortable',[
      'Under 3, take turns around one big target. At 3–4, let the child copy the first sound and offer two when they’re ready. At 5–7, build from one sound to a short sequence. Ages 8+ start with a short example and can choose an instrument or phrase immediately.',
      'Children who aren’t reading can follow the headphones, the hand and the highlighted target. Choose an activity opens any activity and Full practice for every age.'
    ],{kind:'practice-guided',activity:'hear',focus:'activities'}),
    page('hear','Hear it',[
      'Tap the headphones. The room plays one example and highlights the sounding control. Hear it again repeats it. My turn opens copying.',
      'Point to the sound as it plays. For a child who is still learning the symbols, you can tap the headphones first and let them try the highlighted target.'
    ],{kind:'practice-guided',activity:'hear'}),
    page('copy','Copy it',[
      'Follow the hand and play the outlined target. Copy it waits for your child. Hear this sound plays just the current action, and Hear it again returns to the whole example.',
      'Try “I play, you answer.” Model one tap, pluck or clap, then swap turns. Guitar and ukulele start with three strings on a shape the room has chosen. Trumpet has three large controls that play its own pitches.'
    ],{kind:'practice-guided',activity:'copy'}),
    page('echo','Tap the rhythm',[
      'Watch the instrument and wait for the two lead-in clicks. When the hand appears, echo the pattern on any of its big controls. You can clap or pat along together.',
      'Try the steady beat first, then echo the rhythm of the phrase. Each round ends on its own and you can repeat either rhythm.'
    ],{kind:'practice-guided',activity:'rhythm'}),
    page('band','Play with the band',[
      'Start the band, then play any sounds you like while two quieter instruments play along. Stop is available throughout.',
      'Choose Phrase challenge for one timed attempt with the real instrument. You can change the phrase or play freely again.'
    ],{kind:'practice-guided',activity:'band'}),
    page('tools','Open Full practice',[
      'Choose an activity, then Full practice, for the whole phrase library, instrument controls and metronome. The hand button in the header returns to guided practice.',
      'The saved instrument difficulty sets the available phrases. Saved labels and charts appear in Full practice or under Show details when available in the guided room.'
    ],{kind:'practice-room'}),
    page('listen','Repeat a full phrase',[
      'In Full practice, choose Listen and press Ready. After the count-in, the instrument plays the phrase with live highlights and a hold guide.',
      'The example repeats until you press Stop. Use Next or choose any stage directly.'
    ],{kind:'practice-stage',stage:'Listen',focus:'transport'}),
    page('learn','Copy a full phrase',[
      'In Learn, follow each highlighted sound or chord. The room waits for each action, so take as long as you need.',
      'For a grouped action, play each required note. If choosing a chord and sweeping is new, try holding the chord while your child sweeps, then swap.'
    ],{kind:'practice-stage',stage:'Learn',focus:'progress'},{new:'A chord means several notes sounding together.',some:'Learn checks the notes you choose at your pace.',confident:'Each grouped cue accepts its required pitches.'}),
    page('rhythm','Start each note with the beat',[
      'Rhythm uses a count-in and the real instrument. Get ready previews the upcoming action. The instrument highlight marks the time to start. If you miss a chance, follow the next cue or stop and listen again.',
      'Open Attempt details after stopping to see the result. Each complete note or grouped chord counts as one action.'
    ],{kind:'practice-stage',stage:'Rhythm',focus:'progress'}),
    page('together','Try a phrase with the band',[
      'Together adds two quiet accompaniment parts to the timed phrase. Phrase challenge from the guided band plays one attempt. Full practice can also repeat the exercise.',
      'Follow the highlighted instrument or replay the phrase. Practice checks the start of each note or chord, and the door is always available.'
    ],{kind:'practice-stage',stage:'Together'}),
    page('controls','Repeat, restart or leave',[
      'Stop ends audio and clears held notes. Restart resets the attempt. After opening help or switching away, start again when you’re ready. Use the open door or Escape to return to the landscape.',
      'Tap the note at the top of the main menu to learn more, or double-tap the book at the top of the practice room. Choose Take turns and confirm after reading. You can choose Later or turn off the room for this child. Turn it back on in Settings → Caregiver.'
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
    ],{kind:'settings',focus:'selectors',gesture:'tap'}),
    page('complexity','Choose a comfortable starting point',[
      'In Instruments, choose an instrument and set its complexity to Simple, Standard or Advanced. Simple offers fewer choices; the other levels add more.',
      'This changes the controls and musical choices when that instrument is played by hand. Try a level, then adjust it to suit the child.'
    ],{kind:'settings',focus:'complexity',gesture:'tap'},{new:'An age range only suggests a starting point. It does not measure musical ability.',some:'Complexity changes musical choices, rather than volume or tempo.',confident:'Unequipped instruments keep their usual accompaniment parts.'}),
    page('display','Choose useful labels',[
      'Use the display options in Instruments to show note and control labels, sounding note names or finger placement diagrams for guitar and ukulele.',
      'These are optional clues. Choose what helps this child and leave out details they do not need.'
    ],{kind:'settings',focus:'display',gesture:'tap'},{new:'A note is one musical sound. A chord is several notes together.',some:'Finger placement diagrams show where fingers go to make a chord.',confident:'Display choices are saved separately for each child and instrument.'}),
    page('sound','Balance the sound',[
      'During play, open the Sound tab to adjust each instrument and the shared Scenery sounds level. Changes take effect as you move the sliders.',
      'Restore defaults resets the sound levels. Sound levels last for this play session; instrument and display choices are saved for this child.'
    ],{kind:'settings',focus:'sound',gesture:'drag'}),
    page('hints','Choose learning hints',[
      'Open Caregiver to change the shared music familiarity setting and to turn learning hints on or off for this child. Familiarity changes explanations; it does not change the music.',
      'Hints offer optional things to try during landscape play. Select the learning symbol to see a hand demonstration. Suggest a hint again here whenever you want to revisit it.'
    ],{kind:'settings',focus:'caregiver',gesture:'tap'})
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

const trialPages={
  landscape:{
    scenes:page('scenes','Explore morning and night',[TRIAL_DESCRIPTION,TRIAL_CONTENT,'Tap the sun or moon to switch between Sunny Farm and Sleepy Night. Tap the animals and scenery to hear them.'],{kind:'sun',gesture:'tap'}),
    weather:null,
  },
  practice:{
    enter:page('enter','Open Farm Practice',['Double-tap the musician or the instrument they’re holding. You can also focus the musician and press Enter or Space, or choose Open practice in caregiver help.','The age range in Settings → Caregiver changes where the guided activities begin.'],{kind:'profile',gesture:'double-tap'}),
    room:page('room','Start where your child is comfortable',[GUIDE_PAGES.practice[1].paragraphs[0],'Children can follow the headphones, the hand and the highlighted target. Choose an activity opens every activity and Phrase practice.'],{kind:'practice-guided',activity:'hear',focus:'activities'}),
    tools:page('tools','Open Phrase practice',[`Choose an activity, then Phrase practice, for ${TRIAL_PHRASES} phrases per instrument, the instrument controls and metronome. Replay the phrases as often as you like.`,'The guided activities start with the first phrase. The hand button in the header returns to guided practice. The full version includes the complete phrase library.'],{kind:'practice-room'}),
    controls:page('controls','Repeat, restart or leave',[GUIDE_PAGES.practice.at(-1).paragraphs[0]],{kind:'practice-room',focus:'exit'}),
  },
  settings:{
    open:page('open','Open Settings',[GUIDE_PAGES.settings[0].paragraphs[0],'Use Caregiver to change the child’s age range. Instruments and Guides are available from the menu. Sound is available during play.'],{kind:'settings',gesture:'double-tap'}),
    choose:null,
    display:page('display','Choose useful labels',['Use the display options in Instruments to show note and control labels, sounding note names or finger placement diagrams for ukulele.','Choose the clues that help your child. Display choices stay on this device.'],{kind:'settings',focus:'display',gesture:'tap'}),
    sound:page('sound','Balance the sound',[GUIDE_PAGES.settings[4].paragraphs[0],'Restore defaults resets the mix. Sound levels last for this play session. Complexity and display settings stay on this device.'],{kind:'settings',focus:'sound',gesture:'drag'}),
    hints:page('hints','Change the child’s age range',['Open Settings → Caregiver, then choose Child age range. The range guides the starting difficulty and the practice activities.','You can also choose how familiar you are with music. This changes explanations in the guides and help.']),
  },
};

export function guidePages(id,{trial=false}={}) {
  if(trial&&id==='profiles')return [];
  return (GUIDE_PAGES[id]??[]).flatMap(value=>{
    if(trial&&Object.hasOwn(trialPages[id]??{},value.id))return trialPages[id][value.id]??[];
    if(trial&&id==='practice')return {...value,paragraphs:value.paragraphs.map(text=>text.replaceAll('Full practice','Phrase practice'))};
    return value;
  });
}
export function guidePageNote(page,familiarity='some') { return page.notes?.[familiarity]??page.notes?.some??null; }
