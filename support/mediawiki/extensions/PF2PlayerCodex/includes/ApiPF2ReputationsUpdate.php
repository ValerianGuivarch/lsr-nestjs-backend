<?php
class ApiPF2ReputationsUpdate extends ApiBase {
 public function execute() {
  $p=$this->extractRequestParams();
  if(!PF2ReputationBridge::isAdmin($this->getUser()))$this->dieWithError('Accès administrateur requis.');
  $op=$p['operation'];$id=(int)$p['id'];$groupId=(int)$p['groupid'];
  switch($op){
   case 'group':$path='/groups';$body=['name'=>$p['name']];break;
   case 'create':$path='';$body=['name'=>$p['name'],'groupId'=>$groupId];break;
   case 'move':$path='/'.$id.'/move';$body=['groupId'=>$groupId];break;
   case 'score':$path='/'.$id.'/score';$body=['score'=>(int)$p['score'],'reason'=>$p['reason']??''];break;
   default:$this->dieWithError('Opération inconnue.');
  }
  $result=PF2ReputationBridge::call($this,'POST',$path,$body);
  $this->getResult()->addValue(null,'pf2reputationsupdate',['groups'=>$result]);
 }
 public function getAllowedParams(){return [
  'operation'=>[self::PARAM_TYPE=>['group','create','move','score'],self::PARAM_REQUIRED=>true],
  'id'=>[self::PARAM_TYPE=>'integer','default'=>0],
  'groupid'=>[self::PARAM_TYPE=>'integer','default'=>0],
  'score'=>[self::PARAM_TYPE=>'integer','default'=>0],
  'name'=>[self::PARAM_TYPE=>'string','default'=>''],
  'reason'=>[self::PARAM_TYPE=>'string','default'=>'']
 ];}
 public function mustBePosted(){return true;}
 public function needsToken(){return 'csrf';}
 public function isWriteMode(){return true;}
}
