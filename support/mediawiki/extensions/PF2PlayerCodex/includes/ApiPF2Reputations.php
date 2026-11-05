<?php
class ApiPF2Reputations extends ApiBase {
 public function execute() {
  $result=PF2ReputationBridge::call($this,'GET','');
  $this->getResult()->addValue(null,'pf2reputations',['groups'=>$result['groups']??[],'characters'=>$result['characters']??[],'canEdit'=>PF2ReputationBridge::isAdmin($this->getUser()) ? 1 : 0]);
 }
 public function isReadMode(){return true;}
}
