import {useEffect,useRef,useState} from 'react';
import {BrowserMultiFormatReader} from '@zxing/browser';

export default function QRCodeScanner({onDetected}){
 const videoRef=useRef(null),onDetectedRef=useRef(onDetected),[error,setError]=useState('');
 useEffect(()=>{onDetectedRef.current=onDetected},[onDetected]);
 useEffect(()=>{
  const reader=new BrowserMultiFormatReader();let controls,active=true,stopped=false;
  const stop=()=>{if(controls&&!stopped){stopped=true;controls.stop()}};
  reader.decodeFromVideoDevice(undefined,videoRef.current,(result,_error,next)=>{
   controls=next;
   if(!active){stop();return}
   if(result){stop();const text=result.getText();try{const url=new URL(text,window.location.origin),match=url.pathname.match(/^\/t\/([^/]+)/);if(match)onDetectedRef.current(match[1]);else setError('This QR code is not a restaurant table QR.')}catch{setError('Could not read that QR destination.')}}
  }).then(nextControls=>{
   controls=nextControls;
   if(!active)stop();
  }).catch(()=>{if(active)setError('Camera permission is needed to scan. You can also scan with your phone camera and open the link.')});
  return()=>{active=false;stop()};
 },[]);
 return <div className="qr-scan"><video ref={videoRef} muted playsInline/><span className="orange-kicker">POSITION THE TABLE CODE INSIDE THE FRAME</span>{error&&<p>{error}</p>}</div>;
}
