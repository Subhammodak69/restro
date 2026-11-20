import {useEffect,useState} from 'react';
import {io} from 'socket.io-client';
const SOCKET_URL=process.env.REACT_APP_SOCKET_URL||'http://localhost:5000';
export default function useCustomerRealtime(token,session){
 const [revision,setRevision]=useState(0),[connected,setConnected]=useState(false),[lastEvent,setLastEvent]=useState(null);
 useEffect(()=>{
  if(!token){setConnected(false);return undefined}
  const socket=io(SOCKET_URL,{auth:{token},transports:['websocket','polling']});
  let eventSequence=0;
  socket.on('connect',()=>{setConnected(true);if(session?.id&&session?.qrToken)socket.emit('session:join',{sessionId:session.id,tableToken:session.qrToken})});
  socket.on('disconnect',()=>setConnected(false));
  socket.onAny((event,...args)=>{setRevision(x=>x+1);setLastEvent({event,payload:args[0]||{},sequence:++eventSequence})});
  return()=>{socket.disconnect();setConnected(false)};
 },[token,session?.id,session?.qrToken]);
 return {revision,connected,lastEvent};
}
