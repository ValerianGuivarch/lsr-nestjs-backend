<?php
class ApiPF2RequestsUpdate extends ApiBase {
 public function execute() {
  $p=$this->extractRequestParams();
  if (!in_array($p['status'],['requested','in_progress','done'],true) || $p['id']<1) $this->dieWithError('Requête ou état invalide.');
  $row=PF2RequestsBridge::call($this,'POST','/'.(int)$p['id'].'/status',['status'=>$p['status']]);
  $this->getResult()->addValue(null,'pf2requestsupdate',$row);
 }
 public function getAllowedParams() {return ['id'=>[ApiBase::PARAM_TYPE=>'integer',ApiBase::PARAM_REQUIRED=>true],'status'=>[ApiBase::PARAM_TYPE=>'string',ApiBase::PARAM_REQUIRED=>true]];}
 public function mustBePosted() {return true;}
 public function needsToken() {return 'csrf';}
 public function isWriteMode() {return true;}
}
