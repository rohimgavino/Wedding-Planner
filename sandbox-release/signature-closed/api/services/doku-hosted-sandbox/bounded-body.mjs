// One total stream deadline, including a stalled read; never await hostile cancel.
export async function boundedBody(message,{maxBytes=65536,timeoutMs=5000}={}){
 const length=message.headers.get('content-length');
 if(length!==null&&(!/^\d+$/.test(length)||Number(length)>maxBytes)){
  void message.body?.cancel().catch(()=>{});throw Error('body limit');
 }
 const reader=message.body?.getReader();if(!reader)throw Error('body required');
 let timer;const chunks=[];let size=0;
 const cancel=()=>{void reader.cancel().catch(()=>{});};
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{reject(Error('body timeout'));cancel();},timeoutMs);});
 try{
  for(;;){
   const {done,value}=await Promise.race([reader.read(),deadline]);if(done)break;
   size+=value.byteLength;if(size>maxBytes)throw Error('body limit');chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks,size);
 }catch(error){cancel();throw error;}
 finally{clearTimeout(timer);reader.releaseLock();}
}
