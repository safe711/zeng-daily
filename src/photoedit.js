import {validMediaId} from './model.js';
import {photoIds} from './tasks.js';
import {ritualEvidence} from './ritual.js';
export function replaceEvidencePhoto(state,selection,newId){if(state.settings.paused)throw Error('记录已暂停');if(!validMediaId(newId)||newId===selection.oldId)throw Error('替换照片编号无效');const {type,oldId}=selection;
if(type==='ritual'){const day=state.days[selection.date];if(!day||ritualEvidence(day,selection.kind).photoId!==oldId)throw Error('礼仪照片已变化，请重新打开');if(day.ritualMeta?.[selection.kind])day.ritualMeta[selection.kind].photoId=newId;if(selection.kind==='morning'&&day.morningPhotoId===oldId)day.morningPhotoId=newId;return;}
if(type==='task'){const task=state.tasks.find(t=>t.id===selection.taskId);if(task?.done||task?.status==='archived')throw Error('任务已结束，不可修改照片');if(!task?.photoIds?.includes(oldId))throw Error('任务照片已变化，请重新打开');task.photoIds=task.photoIds.map(id=>id===oldId?newId:id);return;}
if(type==='shoe'){const task=state.tasks.find(t=>t.id===selection.taskId);if(!task||task.done||task.status==='archived')throw Error('任务已结束，不可修改照片');const record=state.shoeRecords.find(r=>r.id===selection.recordId&&r.taskId===selection.taskId),shoe=record?.shoes.find(s=>s.id===selection.shoeId);if(!shoe||!['before','after'].includes(selection.phase)||!photoIds(shoe,selection.phase).includes(oldId))throw Error('洗鞋照片已变化，请重新打开');shoe[selection.phase+'PhotoIds']=photoIds(shoe,selection.phase).map(id=>id===oldId?newId:id);if(shoe[selection.phase+'PhotoId']===oldId)shoe[selection.phase+'PhotoId']=newId;return;}
throw Error('照片类型无效');}
