import React, { Component, Fragment } from 'react'
import { Switch, Input } from 'antd'
import ReactJson from 'react-json-view'

const {TextArea} = Input
import './Replacer.less'

export default class Replacer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showJSONEditor: false,
      txt: props.defaultValue,
      src: null
    }

    try {
      let src = JSON.parse(props.defaultValue)
      if (src && typeof src === 'object') {
        this.state.src = src
      }
    } catch (e) {

    }
  }

  handleOverrideTxtChange = (txt) => {
    let src
    try {
      src = JSON.parse(txt)
      if (!(src && typeof src === 'object')) {
        src = null
      }
    } catch (e) {

    }
    this.setState({txt, src})

    window.setting.requestMock_rules[this.props.index].overrideTxt = txt
    this.props.set('requestMock_rules', window.setting.requestMock_rules)
  }

  handleJSONEditorChange = ({updated_src: src}) => {
    let txt = JSON.stringify(src)
    this.setState({txt, src})

    window.setting.requestMock_rules[this.props.index].overrideTxt = txt
    this.props.set('requestMock_rules', window.setting.requestMock_rules)
  }

  handleEditorSwitch = showJSONEditor => {
    this.setState({showJSONEditor})
  }

  render() {

    return (
      <Fragment>
        <div className="replace-with">
          Replace Response With:
        </div>
        <TextArea
          rows={4}
          value={this.state.txt}
          onChange={e => this.handleOverrideTxtChange(e.target.value)}
        />
        <Switch style={{marginTop: '6px'}} onChange={this.handleEditorSwitch} checkedChildren="JSON Editor"
                unCheckedChildren="JSON Editor" size="small"/>
        {this.state.showJSONEditor && (
          this.state.src ?
          <div className="JSONEditor">
            <ReactJson
              name={false}
              collapsed
              collapseStringsAfterLength={12}
              src={this.state.src}
              onEdit={this.handleJSONEditorChange}
              onAdd={this.handleJSONEditorChange}
              onDelete={this.handleJSONEditorChange}
              displayDataTypes={false}
            />
          </div> : <div className="JSONEditor Invalid">Invalid JSON</div>
        )}
      </Fragment>
    )
  }
}
