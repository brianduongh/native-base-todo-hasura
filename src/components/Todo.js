import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Container, Header, Left, Body, Title, Right, Content, InputGroup, Input, List, Button, Icon, Spinner } from 'native-base';
import { addTodo, toggleTodo, removeTodo, setVisibilityFilter } from '../action';
import { insertTodo, deleteTodo, updateTodo, fetchTodos } from '../hasuraApi';
import { View, Text, Dimensions, Alert } from 'react-native';

import TodoItem from './TodoItem';

const { width } = Dimensions.get('window');

class Todo extends Component {

  static propTypes = {
    removeTodo: PropTypes.func,
    setVisibilityFilter: PropTypes.func,
    toggleTodo: PropTypes.func,
    todos: PropTypes.array,
    session: PropTypes.object,
    displayType: PropTypes.string,
    dispatch: PropTypes.func
  }

  constructor(props) {
    super(props);
    this.state = { inputText: '', displayType: 'all' };
  }

  async compenentDidUpdate() {
    resp = await fetchTodos(this.props.session.token);
    if (resp.status !== 200){
      if (resp.status === 503){
        Alert.alert("Network Error", "Please check your internet connection");
      } else {
        Alert.alert("Unauthorized", "Please login again");
        this.props.logout();
      }
    } else {
      respBody = await resp.json();
      this.props.dispatch({type: 'SET_FETCHED_TODOS', todos: respBody});
    }
  }

  async componentDidUpdate() {
    if (this.state.removedId != null){
      let todoId = this.props.todos[this.state.removedId].id;
      resp = await deleteTodo(todoId, this.props.session.token);
      if (resp.status !== 200){
        if (resp.status === 503){
          Alert.alert("Network Error", "Please check your internet connection");
        } else {
          Alert.alert("Unauthorized", "Please login again");
          this.setState({...this.state, removedId: null, loading: false});
          this.props.logout();
        }
      } else {
        this.props.removeTodo(this.state.removedId);
        this.setState({...this.state, removedId: null, loading: false});
      }
    }

    if (this.state.toggledId != null){
      let todoId = this.props.todos[this.state.toggledId].id;
      let currentStatus = this.props.todos.completed;
      resp = await updateTodo(todoId, !currentStatus, this.props.session.token);
      if (resp.status !== 200){
        if (resp.status === 503){
          Alert.alert("Network Error", "Please check your internet connection");
        } else {
          Alert.alert("Unauthorized", "Please login again");
          this.setState({...this.state, toggledId: null, loading: false});
          this.props.logout();
        }
      } else {
        this.props.toggleTodo(this.state.toggledId);
        this.setState({...this.state, toggledId: null, loading: false});
      }
    }
  }

  onSubmit = async () => {
    this.setState({...this.state, loading: true})
    if (this.state.inputText.length > 0) {
      console.log(this.props.session.userId);
      console.log(this.props.session.token);
      resp = await insertTodo(this.state.inputText, this.props.session.userId, this.props.session.token);
      console.log(JSON.stringify(resp));
      if (resp.status !== 200){
        if (resp.status === 503){
          Alert.alert("Network Error", "Please check your internet connection");
        } else {
          Alert.alert("Unauthorized", "Please login again");
          this.props.logout();
        }
      } else {
        var respBody = await resp.json();
        var todoId = respBody.returning[0].id;
        await this.props.addTodo(this.state.inputText, todoId);//eslint-disable-line
        this.setState({
          inputText: '',
          loading: false
        });
      }
    }
  }

  handleLogoutPressed(){
    this.props.logout();
  }
  handleToggleClick(id) {
    this.setState({
      ...this.state,
      toggledId: id,
      loading: true
    })
  }

  handleRemoveClick(id) {
    this.setState({
      ...this.state,
      removedId: id,
      loading: false
    })
  }

  renderTodoList() {
    if ((this.props.displayType === 'all')) {
      return this.props.todos.map((item, index) =>
        <TodoItem
          toggle={() => this.handleToggleClick(index)}
          remove={() => this.handleRemoveClick(index)}
          item={item}
          key={index}
        />
      );
    } else if (this.props.displayType === 'completed') {
      const completed = this.props.todos.filter(item => item.completed).length;
      if (completed > 0) {
        return this.props.todos.map((item, index) => {
          if (item.completed === true) {
            return (<TodoItem
              toggle={() => this.handleToggleClick(index)}
              remove={() => this.handleRemoveClick(index)}
              item={item}
              key={index}
            />);
          }

          return null;
        });
      }
      return <View style={{ alignItems: 'center', paddingTop: 10 }}><Text>No Completed Data</Text></View>;
    }

    return this.props.todos.map((item, index) => {
      if (item.completed === false) {
        return (
          <TodoItem
            toggle={() => this.handleToggleClick(index)}
            remove={() => this.handleRemoveClick(index)}
            item={item}
            key={index}
          />
        );
      }
      return null;
    });
  }

  render() {
    if (this.state.loading === true){
      return (
        <Container>
          <Header />
          <Content>
            <Spinner />
          </Content>
        </Container>
      )
    } else {
      return (
        <Container>
          <Header>
            <Left>
              <Button transparent onPress={()=>{this.handleLogoutPressed()}} >
                <Icon name='arrow-back'/>
              </Button>
            </Left>
            <Body>
              <Title>NativeBase To-do App</Title>
            </Body>
            <Right />
          </Header>

          <Content contentContainerStyle={{ justifyContent: 'space-between' }} >
            <View >
              <List>
                {this.renderTodoList()}
              </List>

              {this.props.todos.length > 0 && <View
                style={{
                  flexDirection: 'row',
                  alignSelf: 'center',
                  justifyContent: 'space-around',
                  width,
                  marginTop: 50 }}
              >
                <Button
                  transparent
                  bordered={this.props.displayType === 'all'}
                  onPress={() => this.props.setVisibilityFilter('all')}
                  >
                    <Text> All </Text>
                  </Button>

                <Button
                  transparent
                  bordered={this.props.displayType === 'completed'}
                  onPress={() => this.props.setVisibilityFilter('completed')}
                  >
                    <Text> Completed </Text>
                  </Button>

                <Button
                  transparent
                  bordered={this.props.displayType === 'active'}
                  onPress={() => this.props.setVisibilityFilter('active')}
                  >
                    <Text> Active </Text>
                  </Button>

              </View>}
            </View>
          </Content>

          <View
            style={{
              alignSelf: 'flex-end',
              flex: 0,
              padding: 5,
              flexDirection: 'row',
            }}
          >
            <InputGroup
              borderType="underline"
              style={{ flex: 0.9 }}
            >
              <Input
                placeholder="Type Your Text Here"
                value={this.state.inputText}
                onChangeText={inputText => this.setState({ inputText })}
                onSubmitEditing={this.onSubmit}
                maxLength={35}
              />
            </InputGroup>
            <Button
              style={{ flex: 0.1, marginLeft: 15 }}
              onPress={this.onSubmit}
            >
              <Text> Add </Text>
            </Button>
          </View>
        </Container>
      );
    }
  }
}


function mapStateToProps(state) {
  return {
    todos: state.todos,
    displayType: state.displayType,
    session: state.session,
    loading: false
  };
}

function mapDispatchToProps(dispatch) {
  return {
    addTodo: payload => dispatch(addTodo(payload)),
    toggleTodo: index => dispatch(toggleTodo(index)),
    removeTodo: index => dispatch(removeTodo(index)),
    setVisibilityFilter: displayType => dispatch(setVisibilityFilter(displayType)),
    storeSession: session => dispatch(storeSession(session)),
    logout: () => dispatch({type:'SET_SESSION', session: {}})
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Todo);