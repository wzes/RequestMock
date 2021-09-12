import React from 'react'
import ReactDOM from 'react-dom'

import Main from './Main'

const DEFAULT_SETTING = {
  requestMock_switchOn: false,
  requestMock_rules: []
}

if (chrome.storage) {
  chrome.storage.local.get(['requestMock_switchOn', 'requestMock_rules'], (result) => {
    window.setting = {
      ...DEFAULT_SETTING,
      ...result
    }
    ReactDOM.render(
      <Main/>,
      document.getElementById('main')
    )
  })
} else {
  window.setting = DEFAULT_SETTING
  ReactDOM.render(
    <Main/>,
    document.getElementById('main')
  )
}
