<?php
class ApiPF2HoroscopesUpdate extends ApiPF2Horoscopes {
 public function execute() {
  if (!$this->getUser()->isRegistered()) $this->dieWithError('Connexion requise.');
  $p=$this->extractRequestParams();
  $this->getResult()->addValue(null,'pf2horoscopesupdate',$this->proxy($p['npcId'],'POST',[
   'operation'=>$p['operation'],'id'=>$p['id'],'targetNpcId'=>$p['targetNpcId'],'month'=>$p['month'],'day'=>$p['day'],'roll'=>$p['roll'],'interpretation'=>$p['interpretation']
  ]));
 }
 public function getAllowedParams(){return parent::getAllowedParams()+[
  'operation'=>[self::PARAM_TYPE=>['save','delete'],'default'=>'save'],
  'id'=>[self::PARAM_TYPE=>'integer','default'=>0],
  'targetNpcId'=>[self::PARAM_TYPE=>'string','default'=>''],
  'month'=>[self::PARAM_TYPE=>'integer','default'=>0],
  'day'=>[self::PARAM_TYPE=>'integer','default'=>0],
  'roll'=>[self::PARAM_TYPE=>'string','default'=>''],
  'interpretation'=>[self::PARAM_TYPE=>'string','default'=>'']
 ];}
 public function mustBePosted(){return true;}
 public function needsToken(){return 'csrf';}
 public function isWriteMode(){return true;}
}
