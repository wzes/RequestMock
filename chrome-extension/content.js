const script = document.createElement('script');
script.setAttribute('type', 'text/javascript');
script.setAttribute('src', chrome.extension.getURL('pageScripts/main.js'));
document.documentElement.appendChild(script);

script.addEventListener('load', () => {
  chrome.storage.local.get(['requestMock_switchOn', 'requestMock_rules'], (result) => {
    if (result.hasOwnProperty('requestMock_switchOn')) {
      postMessage({type: 'requestMock', to: 'pageScript', key: 'requestMock_switchOn', value: result.requestMock_switchOn});
    }
    if (result.requestMock_rules) {
      postMessage({type: 'requestMock', to: 'pageScript', key: 'requestMock_rules', value: result.requestMock_rules});
    }
  });
});


let iframe;
let iframeLoaded = false;

if (window.self === window.top) {

  document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
      iframe = document.createElement('iframe');
      iframe.className = "api-interceptor";
      iframe.style.setProperty('height', '100%', 'important');
      iframe.style.setProperty('width', '400px', 'important');
      iframe.style.setProperty('min-width', '1px', 'important');
      iframe.style.setProperty('position', 'fixed', 'important');
      iframe.style.setProperty('top', '0', 'important');
      iframe.style.setProperty('right', '0', 'important');
      iframe.style.setProperty('left', 'auto', 'important');
      iframe.style.setProperty('bottom', 'auto', 'important');
      iframe.style.setProperty('z-index', '9999999999999', 'important');
      iframe.style.setProperty('transform', 'translateX(420px)', 'important');
      iframe.style.setProperty('transition', 'all .4s', 'important');
      iframe.style.setProperty('box-shadow', '0 0 15px 2px rgba(0,0,0,0.12)', 'important');
      iframe.frameBorder = "none";
      iframe.src = chrome.extension.getURL("iframe/index.html")
      document.body.appendChild(iframe);
      let show = false;

      chrome.runtime.onMessage.addListener((msg, sender) => {
        if (msg == 'toggle') {
          show = !show;
          iframe.style.setProperty('transform', show ? 'translateX(0)' : 'translateX(420px)', 'important');
        }

        return true;
      });
    }
  }
}


// 接收background.js传来的信息，转发给pageScript
chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === 'requestMock' && msg.to === 'content') {
    if (msg.hasOwnProperty('iframeScriptLoaded')) {
      if (msg.iframeScriptLoaded) iframeLoaded = true;
    } else {
      postMessage({...msg, to: 'pageScript'});
    }
  }
});

// 接收pageScript传来的信息，转发给iframe
window.addEventListener("pageScript", function(event) {
  if (iframeLoaded) {
    chrome.runtime.sendMessage({type: 'requestMock', to: 'iframe', ...event.detail});
  } else {
    let count = 0;
    const checktLoadedInterval = setInterval(() => {
      if (iframeLoaded) {
        clearInterval(checktLoadedInterval);
        chrome.runtime.sendMessage({type: 'requestMock', to: 'iframe', ...event.detail});
      }
      if (count ++ > 500) {
        clearInterval(checktLoadedInterval);
      }
    }, 10);
  }
}, false);
