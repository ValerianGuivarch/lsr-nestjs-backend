<?php
class ApiPF2RelationsUpdate extends ApiPF2Relations {
 public function execute() {
  if(!$this->getUser()->isRegistered()||!$this->getUser()->isAllowed('delete'))$this->dieWithError('Réservé au MJ.');
  $p=$this->extractRequestParams();
  $body=[
   'operation'=>$p['operation'],'id'=>(int)$p['id'],
   'name'=>$p['name'],'description'=>$p['description'],
   'score'=>(int)$p['score'],'linkedNpcId'=>$p['linkedNpcId']
  ];
  $data=$this->proxy(trim($p['npcId']),'POST',$body);
  $this->getResult()->addValue(null,'pf2relationsupdate',['relations'=>$data]);
 }
 public function getAllowedParams(){return [
   'npcId'=>[self::PARAM_TYPE=>'string',self::PARAM_REQUIRED=>true],
   'operation'=>[self::PARAM_TYPE=>['create','update','delete'],self::PARAM_REQUIRED=>true],
   'id'=>[self::PARAM_TYPE=>'integer','default'=>0],
   'name'=>[self::PARAM_TYPE=>'string','default'=>''],
   'description'=>[self::PARAM_TYPE=>'string','default'=>''],
   'score'=>[self::PARAM_TYPE=>'integer','default'=>0],
   'linkedNpcId'=>[self::PARAM_TYPE=>'string','default'=>'']
 ]; }
 public function mustBePosted(){return true;}
 public function needsToken(){return 'csrf';}
 public function isWriteMode(){return true;}
}
