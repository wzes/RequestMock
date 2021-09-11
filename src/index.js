import React from 'react';
import ReactDOM from 'react-dom';

import Main from './Main';

const DEFAULT_SETTING = {
  requestMock_switchOn: false,
  requestMock_rules: [],
}

if (chrome.storage) {
  chrome.storage.local.get(['requestMock_switchOn', 'requestMock_rules'], (result) => {
    // if (result.requestMock_switchOn) {
    //   this.set('requestMock_switchOn', result.requestMock_switchOn, false);
    // }
    // if (result.requestMock_rules) {
    //   this.set('requestMock_rules', result.requestMock_rules, false);
    // }
    window.setting = {
      ...DEFAULT_SETTING,
      ...result,
    };

    ReactDOM.render(
      <Main />,
      document.getElementById('main')
    );
  });
} else {
  window.setting = DEFAULT_SETTING;
  // 测试环境
  ReactDOM.render(
    <Main />,
    document.getElementById('main')
  );
}
