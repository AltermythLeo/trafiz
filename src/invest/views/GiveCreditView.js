import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  Keyboard,
  DatePickerAndroid,
  Alert,
  ScrollView,
  Picker
} from 'react-native';
import _ from 'lodash';
import moment from 'moment';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Button } from 'react-native-material-ui';
import { TextField } from 'react-native-material-textfield';

const lib = require('../../lib');
const L = require('../../dictionary').translate;
const styles = StyleSheet.create(
  {
    box:{
      fontSize:lib.THEME_FONT_MEDIUM,
      color:lib.THEME_COLOR_BLACK,
      backgroundColor:'white',
      borderColor:lib.THEME_COLOR_BLACK,
      borderWidth:1
    },
    container:{
      height:90, padding:10, paddingTop:0, paddingBottom:20
    },
    label:{
      fontSize:lib.THEME_FONT_MEDIUM, color:lib.THEME_COLOR_BLACK, height:40, paddingTop:10
    },
    spacer:{
      height:15
    }
  }  
)


class Screen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      errMsg:'',
      notes:'',
      amount:'',
      name:'',
      isKeyboardOpen:false,
      trxdate:lib.selectedDate,
      readOnly:false
    }
  }

  componentWillMount()
  {
      this._keyboardDidHide = this._keyboardDidHide.bind(this);
      this._keyboardDidShow = this._keyboardDidShow.bind(this);
      this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
      this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
  }

  componentWillUnmount () {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  _keyboardDidShow () {
    this.setState({isKeyboardOpen:true});
  }

  _keyboardDidHide () {
    this.setState({isKeyboardOpen:false});
  }

  componentDidMount() {

    const initialData = this.props.initialData;
    if(initialData) {
      initialData.readOnly=true;
      this.setState(initialData);
    }
  }

  handleRemove()
  {
    Alert.alert('',
      L('Delete <incomeorexpense>?').replace('<incomeorexpense>', L('this entry')),
      [
        {
          text: L('No').toUpperCase(), 
          onPress: () => console.warn('do nothing')
        },
        {
          text: L('Yes').toUpperCase(), 
          onPress: () => this.handleSave(true)
        },
      ]
    );
  }

  retrieveJson() {

    const json = {
      notes:this.state.notes,
      amount:lib.toNumber(this.state.amount),
      trxdate:this.state.trxdate,
      name:this.state.name
    }

    const fieldName = {
      amount:'Account Receivable\'s Amount',
      name:'Receiver Name'
    }
    
    //insert needed field to update values
    if(this.props.initialData)
    {
      let initialData   = this.props.initialData;
      json.offlineID    = initialData.offlineID;
      json.trafizLoanOfflineID = initialData.trafizLoanOfflineID;
      json.trxdate      = this.state.trxdate;
      json.ts           = moment(this.state.trxdate).unix();;
    }else
    {
      //check if trx is today, add missing hour and minutes
      const issame = moment().isSame(moment(json.trxdate), 'day')
      console.warn(issame ? "Date NOT Changed" : "Date changed");
      if(issame)
      {
        json.trxdate = moment().format("YYYY-MM-DD HH:mm:ss");
      }
    }

    for (let key in fieldName) {
      if (fieldName.hasOwnProperty(key)) {
        const val = json[key];
        if(val.length == 0) {
          const errMsg = fieldName[key]+ ' must be set';
          this.setState({errMsg});
          return null;
        }
      }
    }

    return json;
  }

  handleSave(remove = false) {
    const json = this.retrieveJson();
    if(json) 
    {
      json.remove = remove;
      this.props.onClickButtonSave(json);
    }
  }

  onAmountChanged(num)
  {
    //num = num.replace(/^0+/, '');
    num = lib.toNumber(num);
    num = 'Rp ' + lib.toPrice(num);
    this.setState({amount:num});
  }

  render() {
    let errorIndicator = null;
    //Error Message
    if( this.state.errMsg.length > 0 ) {
      const errMsg = this.state.errMsg.toUpperCase();
      errorIndicator = (
        <View style={{backgroundColor:'red',padding:5}}>
          <Text style={{textAlign:'center',color:'white'}}>{errMsg}</Text>
        </View>
      );
    }

    let btn = null;
    if(this.state.isKeyboardOpen == false)
    {
      if(!this.props.initialData) {
        btn = 
          <Button style={{container:{height:50}, text:{fontSize:lib.THEME_FONT_LARGE}}} primary raised uppercase text={L('Save')}
                onPress={()=>this.handleSave()}>
          </Button>
      }else
      {
        btn = 
          <View style={{}}>
            <Button style={{container:{height:50}, text:{fontSize:lib.THEME_FONT_LARGE}}} primary raised uppercase text={L('Save')}
             onPress={()=>this.handleSave()}></Button>
            <Button style={{container:{height:50}, text:{fontSize:lib.THEME_FONT_LARGE}}} accent raised uppercase text={L('Remove')}
             onPress={()=>this.handleRemove()}></Button>
          </View>
      }
    }

    return (
      <View style={{flex:1}}>
        <View style={{backgroundColor:'white', elevation:1}}>
          {errorIndicator}

          <View style={{padding:10, borderBottomColor:'gainsboro', borderBottomWidth:1}}>
            <Text style={{fontWeight:'bold', fontSize:lib.THEME_FONT_MEDIUM, color:lib.THEME_COLOR_BLACK}}>{L('Expense Type') + ':'}</Text>
            <View style={{padding:15}}>
              <Text style={{fontSize:lib.THEME_FONT_MEDIUM, color:lib.THEME_COLOR_BLACK}}>{L('Account Receivable')}</Text>
            </View>

          </View>
        </View>
        <View style={{flex:1}}>
            <ScrollView keyboardShouldPersistTaps={'always'} style={{backgroundColor:lib.THEME_COLOR_LIGHTGREY}}>
              <View style={styles.container}>
                  <Text style={styles.label}>{L('Payment Date')}</Text>
                  <TextInput
                    underlineColorAndroid='transparent'
                    style={styles.box}
                    placeholder={L('<Set Payment Date>')}
                    placeholderTextColor={lib.THEME_COLOR_GREY}
                    value={moment(this.state.trxdate).format("DD MMMM YYYY")}
                    onChangeText={(text) => console.log('')}
                    onFocus={(text) => this.SelectTrxDate()}
                  />
                </View>
                <View style={styles.container}>
                  <Text style={styles.label}>{L('Account Receivable\'s Amount')}</Text>
                  <TextInput
                    underlineColorAndroid='transparent'
                    style={styles.box}
                    placeholderTextColor={lib.THEME_COLOR_GREY}
                    placeholder={L('<Set Account Receivable\'s Amount>')}
                    value={'Rp ' + lib.toPrice(lib.toNumber(this.state.amount))}
                    keyboardType='numeric'
                    onChangeText={(text) => this.onAmountChanged(text)}
                  />
                </View>
                <View style={styles.spacer}></View>
                <View style={styles.container}>
                  <Text style={styles.label}>{L('Account Receivable Receiver\'s Name')}</Text>
                  <TextInput
                    underlineColorAndroid='transparent'
                    style={styles.box}
                    placeholderTextColor={lib.THEME_COLOR_GREY}
                    placeholder={L('<Set Account Receivable Receiver\'s Name>')}
                    value={this.state.name}
                    onChangeText={(text) => this.setState({name:text})}
                  />
                </View>
                <View style={styles.spacer}></View>
                <View style={{height:200, padding:10, paddingTop:0, paddingBottom:20}}>
                  <Text style={styles.label}>{L('Remark')}</Text>
                    <TextInput
                      underlineColorAndroid='transparent'
                      style={styles.box}
                      placeholderTextColor={lib.THEME_COLOR_GREY}
                      value={this.state.notes}
                      multiline={true}
                      textAlignVertical='top'
                      placeholder={L('<Set Miscellanous Note>')}
                      onChangeText={(text) => this.setState({notes:text})}
                      label={L('Notes')}
                    />
                </View>
             </ScrollView>
          </View>
          <View style={{}}>
            {btn}
          </View>
      </View>
    );
  }
  
  SelectTrxDate() {
    let cur = moment();
    
    DatePickerAndroid.open({
      date: cur.toDate()
    })
    .then(result=>{
      if(result.action !== DatePickerAndroid.dismissedAction) {
        const year = result.year;  
        const month = result.month;  
        const day = result.day;
        const d = new Date(year, month, day);
        const m = moment(d);
        const str = m.format('YYYY-MM-DD');
        this.setState({
          trxdate:str
        });

      }
    });
  }
}

export default Screen;