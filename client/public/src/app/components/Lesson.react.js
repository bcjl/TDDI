/* 
* @Author: John Winstead
* @Date:   2015-05-28 16:14:16
* @Last Modified by:   awate
* @Last Modified time: 2015-05-30 15:14:01
*/

var React = require('react');

var codeEval = require('../codeEval');

/*  ========  Components  =======  */
var CodeMirror = require('./CodeMirror');
var ContentPanel = require('./ContentPanel');
var CodeResponseBox = require('./CodeResponseBox.react');


var Lesson = React.createClass({
  getInitialState: function( ){
    return {
      currentUser: "Krazy Kurt",
      codeResponse: [],
      codeResponseStatusClass: 'success'
    }
  },
  updateCode: function(newCode) {
    var sectionData = this.props.sectionData[this.props.currentSection];
    //if the section data exists
    if(sectionData){
      //update its code variable
      sectionData.code = newCode;
    }
  },

  changeSection: function( val ) {
    var min = 0, max = this.props.sectionList.length-1;
    var newSection = this.props.currentSection+val;
    newSection = Math.max( min, Math.min(max, newSection) );
    window.location.hash = "#lesson/" +this.props.currentLesson+ "/section/" +newSection;
  },

  nextSection: function( ) {
    console.log(this.props.currentSection, this.props.sectionList.length-1);
    if(this.props.currentSection === this.props.sectionList.length-1){
      window.location.hash = "#selector";
    }
    else {
      this.changeSection(1);
    }
  },

  //Called when we need to evaluate the code in the codeBox. Called from clicking a button rendered in this file.
  codeEvaluation: function() {
    var sectionData = this.props.sectionData[this.props.currentSection];

    var workerOptions = {
       task: '',
       scripts: []
    };

    var codeResponse = [];

    //Create callback function for passing into codeEval
    var evalCallback = (function( response ){
      if( response.error ) {
        codeResponse.push(response.error);
        console.log("ERROR! ", response.error);

        this.setState({ 
          codeResponse: codeResponse,
          codeResponseStatusClass: 'error'
        });
      } else {
        this.setState({ 
          codeResponse: ["Success!"], 
          codeResponseStatusClass: 'success'
        });          
        console.log( "It worked!", response.result );
      }
    }).bind( this );

    var lintingCallback = (function( response ) {
      if( response.error ){
        response.error.forEach(function(error){
          if(error && error.code !== "E041"){
            codeResponse.push("Line " + error.line + ": " + error.reason);
            console.log("Line " + error.line + ": " + error.reason);
          }
        });

        this.setState({ 
          codeResponse: codeResponse,
          codeResponseStatusClass: 'error'
        });
      } else {

        codeResponse = [];

        this.setState({ 
          codeResponse: codeResponse
        });

        // set worker options for evaluate the user's code
        workerOptions.task = 'code-eval';
        workerOptions.scripts = ['../lib/mocha/mocha.js','../lib/chai/chai.js'];

        // //Call codeEval, which will create a webworker and run the code.
        codeEval( sectionData.code, sectionData.preOp, evalCallback, workerOptions );
      }
    }).bind(this);

    // set worker options for linting the user's code
    workerOptions.task = 'lint';
    workerOptions.scripts = ['../lib/jshint/jshint.js'];

    //Call codeEval, which will create a webworker and lint the user's code
    codeEval( sectionData.code, sectionData.preOp, lintingCallback, workerOptions );
  },
  render: function() {
    var editorOptions = {
      lineNumbers: true,
      mode:        "javascript",
      theme:       "mbo"
    };
    
    var section = this.props.sectionData[this.props.currentSection];
    var code    = section ? section.code    || "" : "";
    var content = section ? section.content || "" : "";

    //generate the information required for the side-bar
    var sectionList = [ ];
    if(this.props.sectionList){
      var path = window.location.pathname+ "#lesson/" +this.props.currentLesson+ "/section/";

      //Create a callback for use in the map function call below
      var callback = (function( sectionName, sectionIndex ){
        return (
          <a href={ path + sectionIndex } >
            <li key={ sectionIndex }>
              {sectionName}
            </li>
          </a>
        );
      }).bind( this );

      sectionList = this.props.sectionList.map( callback );
    }

    return (
      <div className = "AppBodyContainer container">
          <div className = "TableOfContentsContainer">
            <ul>
              { sectionList }
            </ul>
          </div>
          <div className = "LessonContainer">
            <ContentPanel contents = { content } />
            <div className = "CodeBoxContainer">
              <CodeMirror
                value    = { code }
                onChange = { this.updateCode }
                options  = { editorOptions }
              />
            </div>
            <div className = "response-container">
              <div className="submit-container">
                <button onClick = { this.codeEvaluation } className = "btn btn-default submit-code"> Submit </button>
                <button onClick = { this.nextSection } className = "btn btn-default submit-next"> Next </button>
              </div>
              <CodeResponseBox
                codeResponseStatusClass = { this.state.codeResponseStatusClass }
                responses = { this.state.codeResponse } 
                />
            </div>
          </div>
      </div>
    );
  }
})

module.exports = Lesson;