import React from 'react'
import {connect} from 'react-redux'
import {pushState} from 'redux-router';
import IconButton from 'material-ui/lib/icon-button'
import FontIcon from 'material-ui/lib/font-icon'
import FloatingActionButton from 'material-ui/lib/floating-action-button'
import {
  addVertex,
  addVertexWithEdge,
  loadGraph,
  redo,
  undo
} from '../actions/graph-actions'
import {updateProject} from '../actions/project-actions'
import layoutGraph from '../utils/layout-graph'
import ZoomableSVG from './zoomable-svg'
import ConstructDialog from './construct-dialog'
import Vertex from './vertex'
import Edge from './edge'

const nextVertexId = (graph) => {
  let maxId = -Infinity;
  for (const u of graph.vertices()) {
    maxId = Math.max(+u, maxId);
  }
  return maxId + 1;
};

@connect((state) => ({
  projects: state.projects,
  graph: state.graph.graph,
  canUndo: state.graph.prev !== null,
  canRedo: state.graph.next !== null
}))
class ParticipantInterview extends React.Component {
  componentDidMount() {
    const data = this.props.project.evaluationStructure || '{"vertices":[], "edges":[]}';
    this.props.dispatch(loadGraph(JSON.parse(data)));
  }

  render() {
    const layout = layoutGraph(this.props.graph);
    const dur = 0.3, delay = 0.2;
    return (
      <div>
        <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 10
            }}>
          <ZoomableSVG>
            <g>
              {layout.edges.map(({u, v, points, points0}) => (
                <Edge key={`${u}:${v}`} dur={dur} delay={delay} points={points} points0={points0}/>
              ))}
            </g>
            <g>
              {layout.vertices.map(({u, text, x, y, x0, y0, width, height}) => (
                <Vertex key={u} dur={dur} delay={delay} text={text} x={x} y={y} x0={x0} y0={y0} width={width} height={height}>
                  <g transform="translate(-48,0)">
                    <foreignObject width="98" height="48">
                      <IconButton
                          iconClassName="material-icons"
                          onClick={this.handleLadderUp.bind(this, u)}>
                        arrow_back
                      </IconButton>
                      <IconButton
                          iconClassName="material-icons"
                          onClick={this.handleLadderDown.bind(this, u)}>
                        arrow_forward
                      </IconButton>
                    </foreignObject>
                  </g>
                </Vertex>
              ))}
            </g>
          </ZoomableSVG>
        </div>
        <div
            style={{
              position: 'absolute',
              left: 10,
              bottom: 10
            }}>
          <IconButton
              iconClassName="material-icons"
              disabled={!this.props.canUndo}
              onClick={::this.handleUndo}>
            undo
          </IconButton>
          <IconButton
              iconClassName="material-icons"
              disabled={!this.props.canRedo}
              onClick={::this.handleRedo}>
            redo
          </IconButton>
        </div>
        <div
            style={{
              position: 'absolute',
              right: 10,
              top: 10
            }}>
          <FloatingActionButton
              secondary={true}
              onClick={::this.handleSave}>
              <FontIcon className="material-icons">save</FontIcon>
          </FloatingActionButton>
        </div>
        <div
            style={{
              position: 'absolute',
              right: 10,
              bottom: 10
            }}>
          <FloatingActionButton
              onClick={::this.handleAddVertex}>
              <FontIcon className="material-icons">add</FontIcon>
          </FloatingActionButton>
        </div>
        <ConstructDialog ref="dialog"/>
      </div>
    );
  }

  handleAddVertex() {
    this.refs.dialog.show((text) => {
      this.props.dispatch(addVertex(nextVertexId(this.props.graph), {
        text,
        x: null,
        y: null
      }));
    });
  }

  handleLadderUp(v) {
    this.refs.dialog.show((text) => {
      this.props.dispatch(addVertexWithEdge({
        u: nextVertexId(this.props.graph),
        v,
        ud: {
          text,
          x: null,
          y: null
        },
        d: {
          points: null
        }
      }));
    });
  }

  handleLadderDown(u) {
    this.refs.dialog.show((text) => {
      this.props.dispatch(addVertexWithEdge({
        u,
        v: nextVertexId(this.props.graph),
        vd: {
          text,
          x: null,
          y: null
        },
        d: {
          points: null
        }
      }));
    });
  }

  handleUndo() {
    this.props.dispatch(undo());
  }

  handleRedo() {
    this.props.dispatch(redo());
  }

  handleSave() {
    const {projectId} = this.props.params;
    this.props.dispatch(updateProject(projectId, {
      evaluationStructure: this.props.graph.toString()
    }));
    this.props.dispatch(pushState(null, `/projects/${projectId}/participants`));
  }
}

@connect((state) => ({
  projects: state.projects
}))
class ParticipantInterviewWrapper extends React.Component {
  render() {
    const {projectId} = this.props.params;
    const project = this.props.projects[projectId];
    return project ? <ParticipantInterview params={this.props.params} project={project}/> : <div/>;
  }
}

export default ParticipantInterviewWrapper
