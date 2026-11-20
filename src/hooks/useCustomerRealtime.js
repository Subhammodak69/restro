import {useEffect,useState} from 'react';
import {io} from 'socket.io-client';
const SOCKET_URL=process.env.REACT_APP_SOCKET_URL||'http://localhost:5000';
export default function useCustomerRealtime(token,session){
 const [revision,setRevision]=useState(0),[connected,setConnected]=useState(false);
 useEffect(()=>{if(!token)return undefined;const socket=io(SOCKET_URL,{auth:{token},transports:['websocket','polling']});const bump=()=>setRevision(x=>x+1);socket.on('connect',()=>{setConnected(true);if(session?.id&&session?.qrToken)socket.emit('session:join',{sessionId:session.id,tableToken:session.qrToken})});socket.on('disconnect',()=>setConnected(false));socket.onAny(bump);return()=>{socket.disconnect();setConnected(false)}},[token,session?.id,session?.qrToken]);
 return {revision,connected};
}
