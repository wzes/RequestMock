import React, {Component} from 'react';
import 'antd/dist/antd.css';
import {Switch, Collapse, Input, Select, Button, Badge, Tooltip} from 'antd';
const Panel = Collapse.Panel;

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
  constructor() {
    super();
    chrome.runtime.onMessage.addListener(({type, to, url, match, originalResponse}) => {
      if (type === 'requestMock' && to === 'iframe') {
        const {interceptedRequests} = this.state;
        if (!interceptedRequests[match]) interceptedRequests[match] = [];
        const exits = interceptedRequests[match].some(obj => {
          if (obj.url === url) {
            obj.num++;
            obj.originalResponse = originalResponse
            return true;
          }
          return false;
        });

        if (!exits) {
          interceptedRequests[match].push({url, num: 1, originalResponse});
        }
        const i = window.setting.requestMock_rules.findIndex((_) => {
          return _.match = url
        })
        if (i !== -1) {
          window.setting.requestMock_rules[i].originalResponse = originalResponse
        }
        this.setState({interceptedRequests}, () => {
          if (!exits) {
            // 新增的拦截的url，会多展示一行url，需要重新计算高度
            this.updateAddBtnTop_interval();
          }
        })
      }
    });

    chrome.runtime.sendMessage(chrome.runtime.id, {type: 'requestMock', to: 'background', iframeScriptLoaded: true});

    this.collapseWrapperHeight = -1;
  }

  state = {
    interceptedRequests: {},
  }

  componentDidMount() {
    this.updateAddBtnTop_interval();
  }

  updateAddBtnTop = () => {
    let curCollapseWrapperHeight = this.collapseWrapperRef ? this.collapseWrapperRef.offsetHeight : 0;
    if (this.collapseWrapperHeight !== curCollapseWrapperHeight) {
      this.collapseWrapperHeight = curCollapseWrapperHeight;
      clearTimeout(this.updateAddBtnTopDebounceTimeout);
      this.updateAddBtnTopDebounceTimeout = setTimeout(() => {
        this.addBtnRef.style.top = `${curCollapseWrapperHeight + 30}px`;
      }, 50);
    }
  }

  // 计算按钮位置
  updateAddBtnTop_interval = ({timeout = 1000, interval = 50 } = {}) => {
    const i = setInterval(this.updateAddBtnTop, interval);
    setTimeout(() => {
      clearInterval(i);
    }, timeout);
  }

  set = (key, value) => {
    // 发送给background.js
    chrome.runtime.sendMessage(chrome.runtime.id, {type: 'requestMock', to: 'background', key, value});
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
    this.forceUpdate(this.updateAddBtnTop_interval);
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
    this.setState({interceptedRequests}, this.updateAddBtnTop_interval);
  }

  handleCollaseChange = ({timeout = 1200, interval = 50 }) => {
    this.updateAddBtnTop_interval();
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
          style={{zIndex: 10}}
          defaultChecked={window.setting.requestMock_switchOn}
          onChange={this.handleSwitchChange}
        />
        <div className={window.setting.requestMock_switchOn ? 'settingBody' : 'settingBody settingBody-hidden'}>
          {window.setting.requestMock_rules && window.setting.requestMock_rules.length > 0 ? (
            <div ref={ref => this.collapseWrapperRef = ref}>
              <Collapse
                className={window.setting.requestMock_switchOn ? 'collapse' : 'collapse collapse-hidden'}
                onChange={this.handleCollaseChange}
                // onChangeDone={this.handleCollaseChange}
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
                            // onClick={e => e.stopPropagation()}
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
                      originalResponse={originalResponse}
                      updateAddBtnTop={this.updateAddBtnTop}
                      index={i}
                      set={this.set}
                    />
                    {this.state.interceptedRequests[match] && (
                      <>
                        <div className="intercepted-requests">
                          Intercepted Requests:
                        </div>
                        <div className="intercepted">
                          {this.state.interceptedRequests[match] && this.state.interceptedRequests[match].map(({url, num}) => (
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
                          ))}
                        </div>
                      </>
                    )}
                  </Panel>
                ))}
              </Collapse>
            </div>
          ): <div />}
          <div ref={ref => this.addBtnRef = ref} className="wrapper-btn-add">
            <Button
              className={`btn-add ${window.setting.requestMock_switchOn ? '' : ' btn-add-hidden'}`}
              type="primary"
              shape="circle"
              icon="plus"
              onClick={this.handleClickAdd}
              disabled={!window.setting.requestMock_switchOn}
            />
          </div>
        </div>
      </div>
    );
  }
}
