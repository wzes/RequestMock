import React, { Component } from 'react'
import { Input } from 'antd'
import './StatusReplacer.less';
export default class StatusReplacer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      overrideStatus: props.defaultValue
    }
  }
  handleOverrideStatusChange(val) {
    this.setState({
      overrideStatus: val
    })
    window.setting.requestMock_rules[this.props.index].overrideStatus = val
    this.props.set('requestMock_rules', window.setting.requestMock_rules);
  }
  render() {
    return (
      <>
        <div className="status-replace-with">
          Replace Status With:
        </div>
        <Input
          placeholder={"status"}
          value={this.state.overrideStatus}
          onChange={e => this.handleOverrideStatusChange(e.target.value)}
        />
      </>
    )
  }
}
