var React = require('react')
var ReactNative = require('react-native');
var { PropTypes } = React
var { PanResponder, View, StyleSheet, Dimensions, Text} = ReactNative
var rebound = require('rebound');
var released = true;
var distinct = 0;
var previousPage=0;
var timer = null;
var CHAR_WIDTH = 30;
var carousel = React.createClass({
  _panResponder: {},
  _previousLeft: 0,
  _currentPage:1,
  _scrollSpring:null,
  springSystem:null,
  height: Dimensions.get('window').height,
  width: Dimensions.get('window').width,
  getInitialState() {
    return {
      currentPage: 1,
      currentItemIndex: 1
    };
  },
  componentWillUnmount: function() {
    //console.log('remove listener')
    this._scrollSpring.removeAllListeners();
    if(timer){
      clearTimeout(timer);
    }
  },

  componentWillMount: function() {
    this.height = this.props.height;
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this._handleStartShouldSetPanResponder,
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminate: this._handlePanResponderEnd,
    });

      this.springSystem = new rebound.SpringSystem();
      this._scrollSpring = this.springSystem.createSpring();
      var springConfig = this._scrollSpring.getSpringConfig();
      springConfig.tension = 110;
      springConfig.friction = 30;
      var that = this;
      this._scrollSpring.addListener({
        onSpringUpdate: () => {
          if(this.released){
            this._previousLeft = this._scrollSpring.getCurrentValue();
            this.refs.scrollPanel.setNativeProps({
              style:{
                left:this._scrollSpring.getCurrentValue()
              }
            })
          }
        },
        onSpringEndStateChange:()=>{
          var that = this;
          if(that.props.speed){
            timer = setTimeout(function(){
              var currentPage = Math.floor((that._previousLeft+ this._getWidth()/2) / this._getWidth());
              currentPage--;
              if(currentPage<that.props.items.length*-1){
                currentPage = -1;
                that._scrollSpring.setCurrentValue((currentPage+1)*this._getWidth());
              }
              that.movePage(currentPage);
            },that.props.speed);
          }
        }
      });

      if(this.props.speed){
        timer = setTimeout(function(){
          var currentPage = -1;   // if this.props.speed is not undefined, it will be error.
          that._scrollSpring.setCurrentValue((currentPage+1)* this._getWidth());
          that.released = true;
          that.movePage(currentPage);
        },this.props.speed);
      }
  },

  componentWillUpdate: function() {
    if(this.props.items.length > 0 && this._getMaxWidth != this._getWidth()) {
      this.width = this._getMaxWidth();
    }
  },
  _getWidth: function() {
    return this.width;
  },
  onPressSlide:function(index){
    if(this.props.onPress){
      this.props.onPress(index);
    }
  },
  componentDidMount: function() {
    //    this._updatePosition();
    this.refs.scrollPanel.setNativeProps({
      style:{
        left:this._previousLeft
      }
    })
  },
  _getMaxWidth: function() {
    var itemLengths = this.props.items.map(function(item) {
      return item.length;
    })
    var maxLength = Math.max(...itemLengths);

    return this.width = maxLength * 12
  },

  _handleStartShouldSetPanResponder: function(e: Object, gestureState: Object): boolean {
    // Should we become active when the user presses down on the circle?
    distinct=0;
    if(timer){
      clearTimeout(timer);
    }
    return true;
  },

  _handlePanResponderMove: function(e: Object, gestureState: Object) {
    if(timer){
      clearTimeout(timer);
    }

    this.released = false;
    distinct+=gestureState.dx;
    
    var currentItem = Math.floor((gestureState.dx + this._previousLeft+ this._getWidth()/2) / this._getWidth()) *-1;
    currentItem++;

    if(currentItem < 1) {
      currentItem = 1
    }
    if(currentItem > this.props.items.length ) {
      currentItem = this.props.items.length;
    }
    if(this.state.currentItemIndex != currentItem) {
      this.setState({
        currentItemIndex: currentItem
      });
    }

    this.refs.scrollPanel.setNativeProps({
      style:{
        left:gestureState.dx+this._previousLeft
      }
    })
    this._scrollSpring.setCurrentValue(gestureState.dx+this._previousLeft);
    //    this._updatePosition();
  },
  _handlePanResponderEnd: function(e: Object, gestureState: Object) {
    //  this._unHighlight();
    this.released = true;
    this._previousLeft += gestureState.dx;
    var currentPage = Math.floor((this._previousLeft+ this._getWidth()/2) / this._getWidth());  
    if(currentPage==previousPage){
      if(gestureState.dx >50){
        currentPage++;
      }else if(gestureState.dx <-50){
        currentPage--;
      }else{
        var realCurrentPage = (currentPage*-1 +1) % (this.props.items.length+1);
        if(realCurrentPage==0){
          realCurrentPage=1
        }
        if(Math.abs(gestureState.dx)<10 && Math.abs(gestureState.dy)<10){
          this.onPressSlide(realCurrentPage);
        }

      }
    }
    if (currentPage > 0) {
      currentPage = 0;
    }
    if ( currentPage < (this.props.items.length - 1) * -1 ) {
      currentPage = (this.props.items.length - 1) * -1;
    }
    this.movePage(currentPage);
    this.props.onSelectionFinal(
        {
          index: currentPage * -1,
          uid: this.props.uid
        }
    );
  },
  movePage(currentPage){

    previousPage = currentPage;
    this._scrollSpring.setEndValue( currentPage * this._getWidth());

    this._currentPage = currentPage*-1 +1;
    if(this._currentPage > this.props.items.length){
      this._currentPage =1;
    }
    this.setState({currentPage:this._currentPage});
  },

  getPager() {
    var pager = [];
    var color;
    for (var i = 0; i < this.props.items.length; i++) {
      console.log(this.state.currentPage);
      if(i+1==this.state.currentPage){
        color=this.props.activePagerColor;
      }else{
        color=this.props.pagerColor;
      }

      pager.push(
        <View key={i} style={{ borderRadius:this.props.pagerSize/2,width:this.props.pagerSize,height:this.props.pagerSize,margin:this.props.pagerMargin,backgroundColor:'red' }}></View>);
    }
    var left = (this._getWidth() - (this.props.items.length * (this.props.pagerSize+this.props.pagerMargin)))/2;
    return (
      <View style={{ flex: 1,width:this._getWidth(),flexDirection:'row', position:'absolute',bottom:this.props.pagerOffset,left:left,alignItems:'center',backgroundColor:'transparent' }}>
        {pager}
      </View>
    );
  },
  render() {
    var items = [];
    for(i=0; i < this.props.items.length; i++) {
      if(i+1 === this.state.currentItemIndex) {
        items.push(<View style={[{width: this._getWidth(), height: 50}, styles.itemContainer]} key={i} >
          <Text style={[styles.itemText, styles.selectedItem]}>{this.props.items[i]}</Text>
        </View>)
      } else {
        items.push(<View style={[{width: this._getWidth(), height: 50}, styles.itemContainer]} key={i}><Text style={[styles.itemText, styles.unselectedItem]}>{this.props.items[i]}</Text></View>)
      }
    }
    return (
      <View style={{ width:this._getWidth(),height:this.props.height,flexDirection:'column' }}
        {...this._panResponder.panHandlers}
      >
        <View ref="scrollPanel" style={{ flex: 1,width:this._getWidth()*this.props.items.length,flexDirection:'row', }}>
          {items}
        </View>

        {this.getPager()}
      </View>
    );
  },

})

var styles = {
  itemContainer: {
    marginTop: 8,
    backgroundColor: 'transparent'
  },
  itemText: {
    textAlign: 'center',
    fontFamily: 'TitilliumWeb-Light',
    fontSize: 21
  },
  unselectedItem: {
    color: '#A3A3A3'
  },
  selectedItem: {
    color: "#333",
    fontFamily: 'TitilliumWeb-SemiBold'
  }
}
module.exports = carousel
