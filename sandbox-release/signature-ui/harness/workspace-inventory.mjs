// Stable keyset traversal of the authenticated actor's owner memberships only.
// Publish no partial inventory: every page must validate within the bounded cap.
const uuid=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(s);
export async function loadOwnedInventory(request,actor){
 if(!uuid(actor))throw Error('Invalid inventory actor');
 const all=[];let cursor=null;
 for(let page=0;page<21;page++){
  const query=new URLSearchParams({select:'workspace_id,user_id,role,workspaces(title)',user_id:'eq.'+actor,role:'eq.owner',order:'workspace_id.asc',limit:'50'});
  if(cursor)query.set('workspace_id','gt.'+cursor);
  const rows=await request('/rest/v1/workspace_members?'+query);
  if(!Array.isArray(rows)||rows.length>50)throw Error('Invalid inventory page');
  for(const row of rows){
   if(!uuid(row.workspace_id)||row.user_id!==actor||row.role!=='owner'||typeof row.workspaces?.title!=='string'||(cursor&&row.workspace_id<=cursor))throw Error('Invalid owner inventory');
   cursor=row.workspace_id;all.push(row);
   if(all.length>1000)throw Error('Inventory cap exceeded');
  }
  if(rows.length<50)return all;
 }
 throw Error('Inventory cap exceeded');
}
