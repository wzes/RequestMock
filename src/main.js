import React, {Component, Fragment} from 'react';
import 'antd/dist/antd.css';
import {Switch, Collapse, Input, Select, Button, Badge, Tooltip} from 'antd';
const Panel = Collapse.Panel;
const { TextArea } = Input
import Replacer from './Replacer';

import './Main.less';
import StatusReplacer from './StatusReplacer'

const buildUUID = () => {
  var dt = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (dt + Math.random()*16)%16 | 0;
      dt = Math.floor(dt/16);
      return (c=='x' ? r :(r&0x3|0x8)).toString(16);
  });
  return uuid;
}


export default class Main extends Component {
  state = {
    interceptedRequests: {},
  }

  constructor(props) {
    super(props);
    chrome.runtime.onMessage && chrome.runtime.onMessage.addListener(({type, to, url, match, originalResponse}) => {
        if (type === 'requestMock' && to === 'iframe') {
          const {interceptedRequests} = this.state;
          if (!interceptedRequests[match]) interceptedRequests[match] = [];
          const exits = interceptedRequests[match].some(obj => {
            if (obj.url === url) {
              obj.num++;
              obj.response = originalResponse
              return true;
            }
            return false;
          });

          if (!exits) {
            interceptedRequests[match].push({url, num: 1, response: originalResponse});
          }
          const i = window.setting.requestMock_rules.findIndex((_) => {
            return _.match = url
          })
          if (i !== -1) {
            window.setting.requestMock_rules[i].originalResponse = originalResponse
          }
          this.setState({interceptedRequests})
        }
      });
    chrome.runtime.id && chrome.runtime.sendMessage(chrome.runtime.id, {type: 'requestMock', to: 'background', iframeScriptLoaded: true});
  }
  componentDidMount() {
  }

  set = (key, value) => {
    // 发送给background.js
    chrome.runtime.onMessage && chrome.runtime.sendMessage(chrome.runtime.id, {type: 'requestMock', to: 'background', key, value});
    chrome.storage && chrome.storage.local.set({[key]: value});
  }

  forceUpdateDebouce = () => {
    clearTimeout(this.forceUpdateTimeout);
    this.forceUpdateTimeout = setTimeout(() => {
      this.forceUpdate();
    }, 1000);
  }

  handleSingleSwitchChange = (switchOn, i) => {
    window.setting.requestMock_rules[i].switchOn = switchOn;
    this.set('requestMock_rules', window.setting.requestMock_rules);
    // 这么搞主要是为了能实时同步window.setting.requestMock_rules，并且让性能好一点
    this.forceUpdateDebouce();
  }

  handleFilterTypeChange = (val, i) => {
    window.setting.requestMock_rules[i].filterType = val;
    this.set('requestMock_rules', window.setting.requestMock_rules);

    this.forceUpdate();
  }

  handleMatchChange = (e, i) => {
    window.setting.requestMock_rules[i].match = e.target.value;
    this.set('requestMock_rules', window.setting.requestMock_rules);

    this.forceUpdateDebouce();
  }

  handleClickAdd = () => {
    window.setting.requestMock_rules.push({match: '', switchOn: true, key: buildUUID()});
    this.forceUpdate();
  }

  handleClickRemove = (e, i) => {
    e.stopPropagation();
    const {interceptedRequests} = this.state;
    const match = window.setting.requestMock_rules[i].match;

    window.setting.requestMock_rules = [
      ...window.setting.requestMock_rules.slice(0, i),
      ...window.setting.requestMock_rules.slice(i + 1),
    ];
    this.set('requestMock_rules', window.setting.requestMock_rules);

    delete interceptedRequests[match];
    this.setState({interceptedRequests});
  }

  handleSwitchChange = () => {
    window.setting.requestMock_switchOn = !window.setting.requestMock_switchOn;
    this.set('requestMock_switchOn', window.setting.requestMock_switchOn);

    this.forceUpdate();
  }

  render() {
    return (
      <div className="main">
        <Switch
          checkedChildren="开启"
          unCheckedChildren="关闭"
          style={{zIndex: 10}}
          defaultChecked={window.setting.requestMock_switchOn}
          onChange={this.handleSwitchChange}
        />
        <div className={window.setting.requestMock_switchOn ? 'settingBody' : 'settingBody settingBody-hidden'}>
          {window.setting.requestMock_rules && window.setting.requestMock_rules.length > 0 ? (
            <div>
              <Collapse
                className={window.setting.requestMock_switchOn ? 'collapse' : 'collapse collapse-hidden'}
              >
                {window.setting.requestMock_rules.map(({filterType = 'normal', match, overrideTxt, overrideStatus, switchOn = true, key, originalResponse}, i) => (
                  <Panel
                    key={key}
                    header={
                      <div className="panel-header" onClick={e => e.stopPropagation()}>
                        <Input.Group compact style={{width: '74%'}}>
                          <Select defaultValue={filterType} style={{width: '37%'}} onChange={e => this.handleFilterTypeChange(e, i)}>
                            <Option value="normal">normal</Option>
                            <Option value="regex">regex</Option>
                          </Select>
                          <Input
                            placeholder={filterType === 'normal' ? 'eg: abc/get' : 'eg: abc.*'}
                            style={{width: '63%'}}
                            defaultValue={match}
                            onChange={e => this.handleMatchChange(e, i)}
                          />
                        </Input.Group>
                        <Switch
                          size="small"
                          defaultChecked={switchOn}
                          onChange={val => this.handleSingleSwitchChange(val, i)}
                        />
                        <Button
                          style={{marginRight: '16px'}}
                          type="primary"
                          shape="circle"
                          icon="minus"
                          size="small"
                          onClick={e => this.handleClickRemove(e, i)}
                        />
                      </div>
                    }
                  >
                    <StatusReplacer
                      defaultValue={overrideStatus}
                      index={i}
                      set={this.set}
                    />
                    <Replacer
                      defaultValue={overrideTxt}
                      index={i}
                      set={this.set}
                    />
                    {this.state.interceptedRequests[match] && (
                      <Fragment>
                        <div className="intercepted-requests">
                          Intercepted Requests:
                        </div>
                        <div className="intercepted">
                          {this.state.interceptedRequests[match] && this.state.interceptedRequests[match].map(({url, num, response}) => (
                            <Fragment>
                              <Tooltip placement="top" title={url} key={url}>
                                <Badge
                                  count={num}
                                  style={{
                                    backgroundColor: '#fff',
                                    color: '#999',
                                    boxShadow: '0 0 0 1px #d9d9d9 inset',
                                    marginTop: '-3px',
                                    marginRight: '4px'
                                  }}
                                />
                                <span className="url">{url}</span>
                              </Tooltip>
                              <div className="original-response">
                                Original Response:
                              </div>
                              <Tooltip placement="top" title={response} key={response}>
                                <TextArea rows={4} value={response}/>
                              </Tooltip>
                            </Fragment>
                          ))}
                        </div>
                      </Fragment>
                    )}
                  </Panel>
                ))}
              </Collapse>
            </div>
          ): <div />}
        </div>
        <Button
          className={`btn-add ${window.setting.requestMock_switchOn ? '' : ' btn-add-hidden'}`}
          type="primary"
          shape="circle"
          icon="plus"
          onClick={this.handleClickAdd}
          disabled={!window.setting.requestMock_switchOn}
        />
      </div>
    );
  }
}
