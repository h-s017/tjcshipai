import React,{useRef,useState,useEffect} from 'react';
import {ActivityIndicator,BackHandler,Linking,SafeAreaView,Share,StatusBar,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {WebView} from 'react-native-webview';
const HOME='https://h-s017.github.io/tjcshipai/bible.html';
const ORIGIN='https://h-s017.github.io';
export default function App(){
 const web=useRef(null);const [url,setUrl]=useState(HOME);const [canGoBack,setCanGoBack]=useState(false);const [loading,setLoading]=useState(true);
 useEffect(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{if(canGoBack){web.current?.goBack();return true}return false});return()=>sub.remove()},[canGoBack]);
 const share=async()=>{const link=url.startsWith(ORIGIN+'/tjcshipai/bible.html')?url:HOME;try{await Share.share({title:'每日讀經心得｜聖經元素表',message:link,url:link})}catch(e){console.warn('Share unavailable',e)}};
 const allow=request=>{const target=request.url;if(target==='about:blank')return true;if(target.startsWith(ORIGIN+'/tjcshipai/'))return true;if(/^https?:\/\//.test(target)){Linking.openURL(target).catch(()=>{});return false}return false};
 return <SafeAreaView style={styles.safe}><StatusBar barStyle="light-content" backgroundColor="#574935"/><View style={styles.bar}><Text style={styles.title}>每日讀經心得</Text><TouchableOpacity onPress={share} accessibilityRole="button" accessibilityLabel="分享目前章節"><Text style={styles.share}>分享 ↗</Text></TouchableOpacity></View><View style={styles.body}><WebView ref={web} source={{uri:HOME}} originWhitelist={['https://*']} onShouldStartLoadWithRequest={allow} onNavigationStateChange={state=>{setUrl(state.url);setCanGoBack(state.canGoBack)}} onLoadEnd={()=>setLoading(false)} onError={()=>setLoading(false)} javaScriptEnabled domStorageEnabled sharedCookiesEnabled={false} setSupportMultipleWindows={false} startInLoadingState renderLoading={()=><ActivityIndicator style={styles.loader} color="#586f67"/>}/>{loading&&<ActivityIndicator style={styles.loader} color="#586f67"/>}</View></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#574935'},bar:{height:52,backgroundColor:'#574935',paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},title:{color:'#fff',fontSize:18,fontWeight:'600'},share:{color:'#fff',fontSize:16},body:{flex:1,backgroundColor:'#fbfaf7'},loader:{position:'absolute',alignSelf:'center',top:'48%'}});
