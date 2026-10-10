export function detectInstallationPlatform({userAgent='',platform='',maxTouchPoints=0}={}) {
  const ios=/iPhone|iPad|iPod/i.test(userAgent)||/Mac/i.test(platform)&&maxTouchPoints>1;
  const os=ios?'ios':/Android/i.test(userAgent)?'android':/Windows/i.test(userAgent)?'windows':/Macintosh|Mac OS X/i.test(userAgent)?'macos':/Linux|X11/i.test(userAgent)?'linux':'unknown';
  const browser=/Edg(?:e|A|iOS)?\//.test(userAgent)?'edge':/Chrome\/|CriOS\//.test(userAgent)&&!/OPR\/|SamsungBrowser\//.test(userAgent)?'chrome':/Safari\//.test(userAgent)&&!/Chrome\/|CriOS\/|OPR\/|FxiOS\/|Android/.test(userAgent)?'safari':'other';
  const safariVersion=Number(/Version\/(\d+)/.exec(userAgent)?.[1]??0);
  return {os,browser,safariVersion};
}

export function isInstalled({standalone=false,displayMode=false}={}) {
  return standalone===true||displayMode===true;
}

export function installationGuide(device) {
  const {os,browser,safariVersion}=detectInstallationPlatform(device);
  const chrome='In Chrome, open the three-dot menu, then Cast, save, and share > Install page as app. If an Install icon appears in the address bar, you can use that instead. Confirm the installation.';
  if(os==='ios')return {label:'iPhone or iPad',steps:[browser==='safari'?'In Safari, open Share (the square with an upward arrow; it may be inside the page menu).':'Open this same website in Safari first, then open Share (the square with an upward arrow).','Scroll to Add to Home Screen. If it is missing, check Edit Actions. Turn on Open as Web App if offered, then tap Add.','Find FarmJam on the Home Screen. Touch and hold its icon to move it to a handy spot or into the Dock.']};
  if(os==='android')return {label:'Android',steps:[browser==='chrome'?'In Chrome, open the three-dot menu.':'Open this same website in Chrome first, then open the three-dot menu.','Choose Install app or Add to Home screen, then follow the confirmation. If only a shortcut is offered, it may open a browser tab rather than an app window.','Find FarmJam on the Home screen or in your app list. Touch and hold it to move or add it to the Home screen; your launcher may also let you place it in the bottom favorites row.']};
  if(os==='windows')return {label:'Windows',steps:[browser==='edge'?'In Edge, open the three-dot menu > Apps (under More tools in some versions) > Install this site as an app, or use the address-bar Install icon, then confirm.':browser==='chrome'?chrome:`Open this same website in Edge or Chrome. ${chrome}`,'After installation, Edge may offer Pin to taskbar and Pin to Start. In Edge you can also open edge://apps, choose FarmJam > Details, then either pin option. Otherwise open Windows Start > All apps, find FarmJam and right-click it > Pin to Start or More > Pin to taskbar. You can also right-click its running taskbar icon > Pin to taskbar.']};
  if(os==='macos')return {label:'macOS',steps:[browser==='safari'&&safariVersion>=17?'In Safari on macOS Sonoma 14 or later, choose File > Add to Dock (or Share > Add to Dock), then Add. If Add to Dock is missing, update macOS or use Chrome instead.':`Safari offers File > Add to Dock on macOS Sonoma 14 or later with Safari 17 or newer. Otherwise open this website in Chrome. ${chrome}`,'Safari adds FarmJam to the Dock. For a Chrome-installed app, open FarmJam, then Control-click its Dock icon > Options > Keep in Dock.']};
  if(os==='linux')return {label:'Linux',steps:[browser==='chrome'?chrome:`Open this same website in Chrome. ${chrome}`,'Open FarmJam from your desktop app launcher. Right-click its launcher or running icon and choose Add to Favorites or Pin, if your desktop supports it. Names vary by desktop environment.']};
  return {label:'Your device',steps:['We could not identify this device. Check your browser menu for Install app, Install page as app or Add to Home Screen. If none appears, try a current Chrome or Edge browser, or Safari on an Apple device.','After adding FarmJam, find its icon in your Home Screen or app launcher and use your device’s pin or favorites option. You can always bookmark this website and keep playing in the browser.']};
}