chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    chrome.tabs.sendMessage(tabs[0].id, "toggle");
  })
});

chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === 'requestMock' && msg.to === 'background') {
    if (msg.key === 'requestMock_switchOn') {
      if (msg.value === true) {
        chrome.browserAction.setIcon({path: {
          16: '/images/16.png',
          32: '/images/32.png',
          48: '/images/48.png',
          128: '/images/128.png',
        }});
      } else {
        chrome.browserAction.setIcon({path: {
          16: '/images/16_gray.png',
          32: '/images/32_gray.png',
          48: '/images/48_gray.png',
          128: '/images/128_gray.png',
        }});
      }
    }
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      chrome.tabs.sendMessage(tabs[0].id, {...msg, to: 'content'});
    })
  }
});

chrome.storage.local.get(['requestMock_switchOn', 'requestMock_rules'], (result) => {
  if (result.hasOwnProperty('requestMock_switchOn')) {
    if (result.requestMock_switchOn) {
      chrome.browserAction.setIcon({path: "/images/16.png"});
    } else {
      chrome.browserAction.setIcon({path: "/images/16_gray.png"});
    }
  }
});
